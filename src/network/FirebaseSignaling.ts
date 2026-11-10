// src/network/FirebaseSignaling.ts
// WebRTC signaling provider using Firebase Realtime Database (modular API).
// Exchanges SDP offers, answers, and ICE candidates under /rooms/{roomCode}.

import {
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  onDisconnect,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseDatabase } from '../config/firebaseConfig';

export class FirebaseSignaling {
  private readonly _unsubscribes: Unsubscribe[] = [];

  public isAvailable(): boolean {
    return getFirebaseDatabase() !== null;
  }

  /**
   * Sets the salted SHA-256 passHash under /rooms/{roomCode}/passHash.
   */
  public async setRoomPassHash(roomCode: string, passHash: string): Promise<void> {
    const db = getFirebaseDatabase();
    if (db) {
      const passRef = ref(db, `rooms/${roomCode}/passHash`);
      await set(passRef, passHash);
      onDisconnect(passRef).remove().catch(() => { /* noop */ });
    }
    // Also save in localStorage for local fallback support
    try {
      localStorage.setItem(`neo-puppet-passhash-${roomCode}`, passHash);
    } catch {
      /* noop */
    }
  }

  /**
   * Retrieves the salted SHA-256 passHash from /rooms/{roomCode}/passHash if protected.
   */
  public async getRoomPassHash(roomCode: string): Promise<string | null> {
    const db = getFirebaseDatabase();
    if (db) {
      try {
        const passRef = ref(db, `rooms/${roomCode}/passHash`);
        const snap = await get(passRef);
        const val = snap.val();
        if (typeof val === 'string' && val.length > 0) {
          return val;
        }
      } catch (err) {
        console.warn('[FirebaseSignaling] Failed to fetch room passHash:', err);
      }
    }
    // Local fallback check
    try {
      const local = localStorage.getItem(`neo-puppet-passhash-${roomCode}`);
      return local || null;
    } catch {
      return null;
    }
  }

  /**
   * Host publishes SDP Offer under /rooms/{roomCode}/hostOffer.
   */
  public async publishOffer(
    roomCode: string,
    hostId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const db = getFirebaseDatabase();
    if (!db) return;

    const offerRef = ref(db, `rooms/${roomCode}/hostOffer`);
    await set(offerRef, {
      offer,
      hostId,
      timestamp: Date.now(),
    });

    // Auto-clean on disconnect
    onDisconnect(offerRef).remove().catch(() => { /* noop */ });
  }

  /**
   * Client listens for Host's SDP Offer under /rooms/{roomCode}/hostOffer.
   */
  public onOffer(
    roomCode: string,
    callback: (offer: RTCSessionDescriptionInit, hostId: string) => void,
  ): void {
    const db = getFirebaseDatabase();
    if (!db) return;

    const offerRef = ref(db, `rooms/${roomCode}/hostOffer`);
    const unsub = onValue(offerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.offer) {
        callback(data.offer, data.hostId);
      }
    });

    this._unsubscribes.push(unsub);
  }

  /**
   * Client publishes SDP Answer under /rooms/{roomCode}/clientAnswers/{clientId}.
   */
  public async publishAnswer(
    roomCode: string,
    clientId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const db = getFirebaseDatabase();
    if (!db) return;

    const answerRef = ref(db, `rooms/${roomCode}/clientAnswers/${clientId}`);
    await set(answerRef, {
      answer,
      timestamp: Date.now(),
    });

    onDisconnect(answerRef).remove().catch(() => { /* noop */ });
  }

  /**
   * Host listens for Client SDP Answers under /rooms/{roomCode}/clientAnswers.
   */
  public onAnswers(
    roomCode: string,
    callback: (clientId: string, answer: RTCSessionDescriptionInit) => void,
  ): void {
    const db = getFirebaseDatabase();
    if (!db) return;

    const answersRef = ref(db, `rooms/${roomCode}/clientAnswers`);
    const unsub = onValue(answersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      for (const clientId of Object.keys(data)) {
        const item = data[clientId];
        if (item && item.answer) {
          callback(clientId, item.answer);
        }
      }
    });

    this._unsubscribes.push(unsub);
  }

  /**
   * Sends an ICE candidate to a specific peer under /rooms/{roomCode}/ice/{targetId}.
   */
  public async sendIceCandidate(
    roomCode: string,
    targetId: string,
    fromId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const db = getFirebaseDatabase();
    if (!db) return;

    const iceListRef = ref(db, `rooms/${roomCode}/ice/${targetId}`);
    const newCandidateRef = push(iceListRef);
    await set(newCandidateRef, {
      candidate,
      fromId,
      timestamp: Date.now(),
    });
  }

  /**
   * Listens for incoming ICE candidates directed to localPeerId.
   */
  public onIceCandidates(
    roomCode: string,
    localPeerId: string,
    callback: (candidate: RTCIceCandidateInit, fromId: string) => void,
  ): void {
    const db = getFirebaseDatabase();
    if (!db) return;

    const myIceRef = ref(db, `rooms/${roomCode}/ice/${localPeerId}`);
    const unsub = onValue(myIceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      for (const key of Object.keys(data)) {
        const item = data[key];
        if (item && item.candidate) {
          callback(item.candidate, item.fromId);
        }
      }
    });

    this._unsubscribes.push(unsub);
  }

  /**
   * Cleans up room data and all active listeners.
   */
  public destroy(roomCode?: string, isHost?: boolean): void {
    for (let i = 0; i < this._unsubscribes.length; i++) {
      try {
        this._unsubscribes[i]();
      } catch {
        /* noop */
      }
    }
    this._unsubscribes.length = 0;

    const db = getFirebaseDatabase();
    if (db && roomCode && isHost) {
      const roomRef = ref(db, `rooms/${roomCode}`);
      remove(roomRef).catch(() => { /* noop */ });
    }
  }
}
