// src/network/PresenceService.ts
// Online presence, friends system, and heartbeat tracking via Firebase and local BroadcastChannel.

import { ref, set, onValue, onDisconnect, type Unsubscribe } from 'firebase/database';
import { getFirebaseDatabase, isFirebaseConfigured } from '../config/firebaseConfig';
import type { UserProfile } from './RoomLinkManager';

export type PlayerStatus = 'ONLINE_IDLE' | 'IN_LOBBY' | 'IN_MATCH';

export interface PlayerPresence {
  playerId:      string;
  name:          string;
  avatarSkin:    string;
  status:        PlayerStatus;
  currentRoomId: string;
  lastSeen:      number;
  pingMs:        number;
}

export class PresenceService {
  private static readonly FRIENDS_KEY = 'neo-puppet-friends';

  private readonly _profile: UserProfile;
  private _status: PlayerStatus = 'ONLINE_IDLE';
  private _currentRoomId = '';
  private _pingMs = 12;

  private _onlinePlayers: Map<string, PlayerPresence> = new Map();
  private _presenceListeners: ((players: PlayerPresence[]) => void)[] = [];

  // Transports
  private _localPresenceChannel: BroadcastChannel | null = null;
  private _heartbeatInterval: number | null = null;
  private _firebaseUnsub: Unsubscribe | null = null;

  constructor(profile: UserProfile) {
    this._profile = profile;
    this._initPresence();
  }

  private _initPresence(): void {
    if (isFirebaseConfigured() && getFirebaseDatabase() !== null) {
      this._initFirebasePresence();
    } else {
      this._initLocalPresence();
    }
  }

  private _initFirebasePresence(): void {
    const db = getFirebaseDatabase();
    if (!db) return;

    const myPresenceRef = ref(db, `presence/${this._profile.playerId}`);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Connected!
        const presenceData: PlayerPresence = {
          playerId:      this._profile.playerId,
          name:          this._profile.nickname,
          avatarSkin:    this._profile.avatarSkin,
          status:        this._status,
          currentRoomId: this._currentRoomId,
          lastSeen:      Date.now(),
          pingMs:        this._pingMs,
        };

        set(myPresenceRef, presenceData).catch(() => { /* noop */ });
        onDisconnect(myPresenceRef).remove().catch(() => { /* noop */ });
      }
    });

    // Listen to all players presence
    const allPresenceRef = ref(db, 'presence');
    this._firebaseUnsub = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val() as Record<string, PlayerPresence> | null;
      this._onlinePlayers.clear();
      if (data) {
        for (const [id, item] of Object.entries(data)) {
          if (item && item.playerId) {
            this._onlinePlayers.set(id, item);
          }
        }
      }
      this._notifyListeners();
    });
  }

  private _initLocalPresence(): void {
    this._localPresenceChannel = new BroadcastChannel('neo-puppet-global-presence');

    this._localPresenceChannel.onmessage = (event: MessageEvent<PlayerPresence & { type?: string }>) => {
      const item = event.data;
      if (!item || !item.playerId) return;

      if (item.type === 'OFFLINE') {
        this._onlinePlayers.delete(item.playerId);
      } else {
        this._onlinePlayers.set(item.playerId, {
          playerId:      item.playerId,
          name:          item.name,
          avatarSkin:    item.avatarSkin,
          status:        item.status,
          currentRoomId: item.currentRoomId,
          lastSeen:      Date.now(),
          pingMs:        item.pingMs,
        });
      }
      this._notifyListeners();
    };

    // Heartbeat every 2 seconds
    this._broadcastLocalHeartbeat();
    this._heartbeatInterval = window.setInterval(() => {
      this._broadcastLocalHeartbeat();
      this._pruneStaleLocalPlayers();
    }, 2000);
  }

  private _broadcastLocalHeartbeat(): void {
    if (!this._localPresenceChannel) return;
    this._localPresenceChannel.postMessage({
      playerId:      this._profile.playerId,
      name:          this._profile.nickname,
      avatarSkin:    this._profile.avatarSkin,
      status:        this._status,
      currentRoomId: this._currentRoomId,
      lastSeen:      Date.now(),
      pingMs:        this._pingMs,
    } satisfies PlayerPresence);
  }

  private _pruneStaleLocalPlayers(): void {
    const now = Date.now();
    let changed = false;

    for (const [id, player] of this._onlinePlayers.entries()) {
      if (id !== this._profile.playerId && now - player.lastSeen > 4800) {
        this._onlinePlayers.delete(id);
        changed = true;
      }
    }

    if (changed) {
      this._notifyListeners();
    }
  }

  public updateStatus(status: PlayerStatus, currentRoomId = '', pingMs = this._pingMs): void {
    this._status = status;
    this._currentRoomId = currentRoomId;
    this._pingMs = pingMs;

    const db = getFirebaseDatabase();
    if (db) {
      const myRef = ref(db, `presence/${this._profile.playerId}`);
      set(myRef, {
        playerId:      this._profile.playerId,
        name:          this._profile.nickname,
        avatarSkin:    this._profile.avatarSkin,
        status:        this._status,
        currentRoomId: this._currentRoomId,
        lastSeen:      Date.now(),
        pingMs:        this._pingMs,
      } satisfies PlayerPresence).catch(() => { /* noop */ });
    } else {
      this._broadcastLocalHeartbeat();
    }
  }

  public getOnlinePlayers(): PlayerPresence[] {
    return Array.from(this._onlinePlayers.values());
  }

  public onPresenceChange(cb: (players: PlayerPresence[]) => void): void {
    this._presenceListeners.push(cb);
    cb(this.getOnlinePlayers());
  }

  private _notifyListeners(): void {
    const list = this.getOnlinePlayers();
    for (let i = 0; i < this._presenceListeners.length; i++) {
      this._presenceListeners[i](list);
    }
  }

  // ── Friends Management ────────────────────────────────────────────────────────
  public getFriends(): string[] {
    try {
      const raw = localStorage.getItem(PresenceService.FRIENDS_KEY);
      return raw ? JSON.parse(raw) as string[] : [];
    } catch {
      return [];
    }
  }

  public addFriend(friendId: string): void {
    const list = this.getFriends();
    if (!list.includes(friendId)) {
      list.push(friendId);
      localStorage.setItem(PresenceService.FRIENDS_KEY, JSON.stringify(list));
      this._notifyListeners();
    }
  }

  public removeFriend(friendId: string): void {
    const list = this.getFriends().filter(id => id !== friendId);
    localStorage.setItem(PresenceService.FRIENDS_KEY, JSON.stringify(list));
    this._notifyListeners();
  }

  public isFriend(friendId: string): boolean {
    return this.getFriends().includes(friendId);
  }

  public destroy(): void {
    if (this._heartbeatInterval !== null) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }

    if (this._localPresenceChannel) {
      this._localPresenceChannel.postMessage({
        type:          'OFFLINE',
        playerId:      this._profile.playerId,
        name:          this._profile.nickname,
        avatarSkin:    this._profile.avatarSkin,
        status:        'ONLINE_IDLE',
        currentRoomId: '',
        lastSeen:      Date.now(),
        pingMs:        0,
      });
      this._localPresenceChannel.close();
      this._localPresenceChannel = null;
    }

    if (this._firebaseUnsub) {
      this._firebaseUnsub();
      this._firebaseUnsub = null;
    }

    const db = getFirebaseDatabase();
    if (db) {
      const myRef = ref(db, `presence/${this._profile.playerId}`);
      set(myRef, null).catch(() => { /* noop */ });
    }
  }
}
