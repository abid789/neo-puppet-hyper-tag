// src/network/InviteSystem.ts
// Direct player invites with 60-second expiration, Web Audio synthesized chime, and Firebase/Broadcast delivery.

import { ref, set, push, remove, onValue, type Unsubscribe } from 'firebase/database';
import { getFirebaseDatabase, isFirebaseConfigured } from '../config/firebaseConfig';
import type { UserProfile } from './RoomLinkManager';

export interface GameInvite {
  inviteId:     string;
  fromName:     string;
  fromPlayerId: string;
  roomCode:     string;
  mapName:      string;
  modeName:     string;
  timestamp:    number;
}

export class InviteSystem {
  public static readonly INVITE_EXPIRATION_MS = 60000;

  private readonly _profile: UserProfile;
  private readonly _listeners: ((invite: GameInvite) => void)[] = [];
  private _localChannel: BroadcastChannel | null = null;
  private _firebaseUnsub: Unsubscribe | null = null;
  private _audioCtx: AudioContext | null = null;

  constructor(profile: UserProfile) {
    this._profile = profile;
    this._initTransport();
  }

  private _initTransport(): void {
    if (isFirebaseConfigured() && getFirebaseDatabase() !== null) {
      const db = getFirebaseDatabase()!;
      const myInvitesRef = ref(db, `invites/${this._profile.playerId}`);

      this._firebaseUnsub = onValue(myInvitesRef, (snapshot) => {
        const data = snapshot.val() as Record<string, GameInvite> | null;
        if (!data) return;

        const now = Date.now();
        for (const [id, inv] of Object.entries(data)) {
          if (inv && (now - inv.timestamp) < InviteSystem.INVITE_EXPIRATION_MS) {
            this._notifyInvite({ ...inv, inviteId: id });
          } else {
            // Delete expired invite
            remove(ref(db, `invites/${this._profile.playerId}/${id}`)).catch(() => { /* noop */ });
          }
        }
      });
    } else {
      // Local fallback channel
      this._localChannel = new BroadcastChannel('neo-puppet-invites');
      this._localChannel.onmessage = (event: MessageEvent<GameInvite & { targetPlayerId: string }>) => {
        const msg = event.data;
        if (msg && msg.targetPlayerId === this._profile.playerId) {
          const now = Date.now();
          if (now - msg.timestamp < InviteSystem.INVITE_EXPIRATION_MS) {
            this._notifyInvite(msg);
          }
        }
      };
    }
  }

  public async sendInvite(
    targetPlayerId: string,
    roomCode: string,
    mapName: string,
    modeName: string,
  ): Promise<boolean> {
    const invitePayload: GameInvite = {
      inviteId:     `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromName:     this._profile.nickname,
      fromPlayerId: this._profile.playerId,
      roomCode,
      mapName,
      modeName,
      timestamp:    Date.now(),
    };

    if (isFirebaseConfigured() && getFirebaseDatabase() !== null) {
      try {
        const db = getFirebaseDatabase()!;
        const targetRef = ref(db, `invites/${targetPlayerId}`);
        const newInviteRef = push(targetRef);
        await set(newInviteRef, invitePayload);
        return true;
      } catch (err) {
        console.warn('[InviteSystem] Failed to send Firebase invite:', err);
        return false;
      }
    } else {
      if (this._localChannel) {
        this._localChannel.postMessage({
          ...invitePayload,
          targetPlayerId,
        });
        return true;
      }
    }

    return false;
  }

  public dismissInvite(inviteId: string): void {
    if (isFirebaseConfigured() && getFirebaseDatabase() !== null) {
      const db = getFirebaseDatabase()!;
      remove(ref(db, `invites/${this._profile.playerId}/${inviteId}`)).catch(() => { /* noop */ });
    }
  }

  public onInviteReceived(cb: (invite: GameInvite) => void): void {
    this._listeners.push(cb);
  }

  private _notifyInvite(invite: GameInvite): void {
    this.playInviteChime();
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i](invite);
    }
  }

  /**
   * Synthesizes a high-tech sci-fi chime via Web Audio API (zero audio files needed).
   */
  public playInviteChime(): void {
    try {
      if (!this._audioCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this._audioCtx = new AudioCtx();
      }

      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(() => { /* noop */ });
      }

      const now = this._audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this._audioCtx.createOscillator();
      const gain1 = this._audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this._audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Note 2: 880.00 Hz (A5)
      const osc2 = this._audioCtx.createOscillator();
      const gain2 = this._audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(this._audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.66);
    } catch (err) {
      console.warn('[InviteSystem] Web Audio chime error:', err);
    }
  }

  public destroy(): void {
    if (this._firebaseUnsub) {
      this._firebaseUnsub();
      this._firebaseUnsub = null;
    }
    if (this._localChannel) {
      this._localChannel.close();
      this._localChannel = null;
    }
    if (this._audioCtx) {
      this._audioCtx.close().catch(() => { /* noop */ });
      this._audioCtx = null;
    }
  }
}
