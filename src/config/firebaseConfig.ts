// src/config/firebaseConfig.ts
// Firebase Realtime Database configuration for WebRTC signaling and presence.
// When placeholder/empty, the game automatically runs in LocalBroadcastFallback mode.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

export interface FirebaseConfig {
  apiKey:            string;
  authDomain:        string;
  databaseURL:       string;
  projectId:         string;
  storageBucket:     string;
  messagingSenderId: string;
  appId:             string;
}

// Default placeholder config. Empty strings indicate that online Firebase signaling
// is not yet configured, automatically engaging local multi-tab broadcast fallback.
export const firebaseConfig: FirebaseConfig = {
  apiKey:            '',
  authDomain:        '',
  databaseURL:       '',
  projectId:         '',
  storageBucket:     '',
  messagingSenderId: '',
  appId:             '',
};

const LOCAL_STORAGE_KEY = 'neo-puppet-firebase-config';

/**
 * Retrieves the effective Firebase configuration:
 * Prioritizes localStorage ('neo-puppet-firebase-config') if present,
 * falling back to the hardcoded config object.
 */
export function getEffectiveFirebaseConfig(): FirebaseConfig | null {
  try {
    const custom = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom) as Partial<FirebaseConfig>;
      if (parsed.apiKey && parsed.databaseURL && parsed.projectId) {
        return {
          apiKey:            parsed.apiKey,
          authDomain:        parsed.authDomain ?? '',
          databaseURL:       parsed.databaseURL,
          projectId:         parsed.projectId,
          storageBucket:     parsed.storageBucket ?? '',
          messagingSenderId: parsed.messagingSenderId ?? '',
          appId:             parsed.appId ?? '',
        };
      }
    }
  } catch (err) {
    console.warn('[FirebaseConfig] Failed to parse custom config from localStorage:', err);
  }

  if (firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId) {
    return firebaseConfig;
  }

  return null;
}

/**
 * Checks if Firebase has valid credentials configured.
 */
export function isFirebaseConfigured(): boolean {
  return getEffectiveFirebaseConfig() !== null;
}

/**
 * Saves a user-provided Firebase configuration string (JSON) into localStorage.
 */
export function saveCustomFirebaseConfig(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<FirebaseConfig>;
    if (!parsed.apiKey || !parsed.databaseURL || !parsed.projectId) {
      return false;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears custom Firebase configuration from localStorage.
 */
export function clearCustomFirebaseConfig(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Database | null = null;

/**
 * Safely initializes Firebase App and Realtime Database.
 * Returns null if not configured or if initialization fails,
 * allowing smooth transition to LocalBroadcastFallback.
 */
export function getFirebaseDatabase(): Database | null {
  if (cachedDb) return cachedDb;

  const config = getEffectiveFirebaseConfig();
  if (!config) {
    return null;
  }

  try {
    if (!cachedApp) {
      const apps = getApps();
      cachedApp = apps.length > 0 ? apps[0] : initializeApp(config);
    }
    cachedDb = getDatabase(cachedApp);
    console.log('[FirebaseConfig] Connected to Firebase Realtime Database at', config.databaseURL);
    return cachedDb;
  } catch (err) {
    console.warn('[FirebaseConfig] Failed to initialize Firebase Realtime Database. Falling back to local mode.', err);
    cachedApp = null;
    cachedDb = null;
    return null;
  }
}
