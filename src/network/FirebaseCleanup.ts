// src/network/FirebaseCleanup.ts
// Automated and bounded Firebase database maintenance for NEO-PUPPET: HYPER TAG.
// Runs once per app session (rate-limited to at most once every 6 hours).
// Performs bounded queries using orderByChild/endAt/limitToFirst to prune:
// 1. Presence entries older than 24 hours.
// 2. Rooms older than 24 hours with no activity.
// 3. Game invites older than 60 seconds.

import {
  ref,
  get,
  query,
  update,
  orderByChild,
  endAt,
  limitToFirst,
} from 'firebase/database';
import { getFirebaseDatabase, isFirebaseConfigured } from '../config/firebaseConfig';

const CLEANUP_STORAGE_KEY = 'neo-puppet-last-firebase-cleanup';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SIXTY_SECONDS_MS = 60 * 1000;

export class FirebaseCleanup {
  /**
   * Evaluates whether 6 hours have elapsed since the last database upkeep run,
   * and if so executes bounded maintenance queries without reading whole collections.
   */
  public static async runIfDue(localPlayerId: string, force = false): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    const db = getFirebaseDatabase();
    if (!db) return false;

    const now = Date.now();
    if (!force) {
      try {
        const raw = localStorage.getItem(CLEANUP_STORAGE_KEY);
        if (raw) {
          const lastRun = parseInt(raw, 10);
          if (now - lastRun < SIX_HOURS_MS) {
            // Already cleaned within the last 6 hours
            return false;
          }
        }
      } catch {
        /* noop */
      }
    }

    console.log('[FirebaseCleanup] Commencing 6-hour bounded database cleanup routine…');

    try {
      const updates: Record<string, null> = {};

      // 1. Prune presence entries older than 24h
      const stalePresenceCutoff = now - TWENTY_FOUR_HOURS_MS;
      const presenceQuery = query(
        ref(db, 'presence'),
        orderByChild('lastSeen'),
        endAt(stalePresenceCutoff),
        limitToFirst(50),
      );

      const presenceSnap = await get(presenceQuery);
      if (presenceSnap.exists()) {
        presenceSnap.forEach((child) => {
          if (child.key) {
            updates[`presence/${child.key}`] = null;
          }
        });
      }

      // 2. Prune rooms older than 24h with no activity
      const staleRoomCutoff = now - TWENTY_FOUR_HOURS_MS;
      const roomsQuery = query(
        ref(db, 'rooms'),
        orderByChild('lastActivity'),
        endAt(staleRoomCutoff),
        limitToFirst(50),
      );

      const roomsSnap = await get(roomsQuery);
      if (roomsSnap.exists()) {
        roomsSnap.forEach((child) => {
          if (child.key) {
            updates[`rooms/${child.key}`] = null;
          }
        });
      }

      // 3. Prune expired invites older than 60 seconds for this player
      if (localPlayerId) {
        const staleInviteCutoff = now - SIXTY_SECONDS_MS;
        const invitesQuery = query(
          ref(db, `invites/${localPlayerId}`),
          orderByChild('timestamp'),
          endAt(staleInviteCutoff),
          limitToFirst(50),
        );

        const invitesSnap = await get(invitesQuery);
        if (invitesSnap.exists()) {
          invitesSnap.forEach((child) => {
            if (child.key) {
              updates[`invites/${localPlayerId}/${child.key}`] = null;
            }
          });
        }
      }

      // Execute single bounded batch delete if any stale keys found
      const prunedCount = Object.keys(updates).length;
      if (prunedCount > 0) {
        await update(ref(db), updates);
        console.log(`[FirebaseCleanup] Successfully pruned ${prunedCount} stale database nodes.`);
      } else {
        console.log('[FirebaseCleanup] All collections clean. No stale records found.');
      }

      try {
        localStorage.setItem(CLEANUP_STORAGE_KEY, String(now));
      } catch {
        /* noop */
      }

      return true;
    } catch (err) {
      console.warn('[FirebaseCleanup] Non-fatal cleanup warning (rules or network):', err);
      return false;
    }
  }
}
