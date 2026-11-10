// src/network/NetworkManager.ts
// Unified networking facade. Gameplay and NetSync code use send() and onMessage()
// without needing to know whether WebRTC or LocalBroadcastFallback transport is active.

import { isFirebaseConfigured } from '../config/firebaseConfig';
import { FirebaseSignaling } from './FirebaseSignaling';
import { WebRTCPeer } from './WebRTCPeer';
import { LocalBroadcastFallback } from './LocalBroadcastFallback';
import { RoomLinkManager } from './RoomLinkManager';
import {
  SnapshotCodec,
  PACKET_SNAPSHOT,
  PACKET_INPUT,
  PACKET_EVENT,
  type WorldSnapshot,
  type ClientInputPacket,
} from './SnapshotCodec';

export type TransportKind = 'webrtc' | 'broadcast_channel';

export class NetworkManager {
  private static _instance: NetworkManager | null = null;

  public static getInstance(): NetworkManager {
    if (!this._instance) {
      this._instance = new NetworkManager();
    }
    return this._instance;
  }

  private _localPlayerId: string;
  private _roomCode = '';
  private _roomPasscode = '';
  private _isHost = true;
  private _localPlayerIndex = 0;
  private _transport: TransportKind = 'broadcast_channel';

  // Transports
  private readonly _signaling: FirebaseSignaling;
  private _localFallback: LocalBroadcastFallback | null = null;
  private _peerConnections: Map<string, WebRTCPeer> = new Map();

  // Listeners
  private _snapshotListeners: ((snapshot: WorldSnapshot) => void)[] = [];
  private _inputListeners: ((input: ClientInputPacket) => void)[] = [];
  private _eventListeners: ((eventType: string, payload: Record<string, unknown>) => void)[] = [];
  private _reconnectAttemptListeners: ((attempt: number, max: number) => void)[] = [];
  private _reconnectedListeners: (() => void)[] = [];
  private _connectionLostListeners: (() => void)[] = [];
  private _hostDisconnectedListeners: (() => void)[] = [];

  constructor() {
    this._localPlayerId = this._getOrCreatePlayerId();
    this._signaling = new FirebaseSignaling();
  }

  private _getOrCreatePlayerId(): string {
    const KEY = 'neo-puppet-player-id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
      localStorage.setItem(KEY, id);
    }
    return id;
  }

  public get playerId(): string {
    return this._localPlayerId;
  }

  public get isHost(): boolean {
    return this._isHost;
  }

  public get localPlayerIndex(): number {
    return this._localPlayerIndex;
  }

  public get roomCode(): string {
    return this._roomCode;
  }

  public get roomPasscode(): string {
    return this._roomPasscode;
  }

  public setRoomPasscode(passcode: string): void {
    this._roomPasscode = passcode;
  }

  public async checkRoomProtected(code: string): Promise<string | null> {
    return this._signaling.getRoomPassHash(code);
  }

  public get transport(): TransportKind {
    return this._transport;
  }

  public isConnected(): boolean {
    if (this._transport === 'broadcast_channel') {
      return this._localFallback !== null;
    }
    return this._peerConnections.size > 0;
  }

  public getPing(): number {
    if (this._transport === 'broadcast_channel' && this._localFallback) {
      return this._localFallback.ping;
    }
    return 12; // Nominal WebRTC ping when active
  }

  /**
   * Host creates a new room with a code like TAG-8492 and an optional passcode.
   */
  public async createRoom(preferredCode?: string, passcode?: string): Promise<string> {
    this.leaveRoom();
    const code = preferredCode ?? ('TAG-' + Math.floor(1000 + Math.random() * 9000));
    this._roomCode = code;
    this._roomPasscode = passcode ?? '';
    this._isHost = true;
    this._localPlayerIndex = 0;

    if (passcode && passcode.length >= 4) {
      const hash = await RoomLinkManager.hashPasscode(code, passcode);
      await this._signaling.setRoomPassHash(code, hash);
    }

    const useFirebase = isFirebaseConfigured() && this._signaling.isAvailable();

    if (useFirebase) {
      this._transport = 'webrtc';
      console.log(`[NetworkManager] Creating WebRTC room: ${code}`);

      // Host prepares WebRTC peer listener
      this._signaling.onAnswers(code, async (clientId, answer) => {
        const peer = this._peerConnections.get(clientId);
        if (peer) {
          await peer.handleAnswer(answer);
        }
      });

      this._signaling.onIceCandidates(code, this._localPlayerId, async (candidate) => {
        for (const peer of this._peerConnections.values()) {
          await peer.addIceCandidate(candidate);
        }
      });
    } else {
      this._transport = 'broadcast_channel';
      console.log(`[NetworkManager] Creating LocalBroadcast fallback room: ${code}`);
      this._localFallback = new LocalBroadcastFallback();
      await this._localFallback.joinRoom(code, this._localPlayerId, true);
      this._localFallback.onMessage((bytes) => this._dispatchIncomingBinary(bytes));
      this._localFallback.onPeerJoined((peerId, pIndex) => {
        console.log(`[NetworkManager] Remote player ${pIndex + 1} (${peerId}) joined room.`);
      });
    }

    return code;
  }

  /**
   * Client joins an existing room.
   */
  public async joinRoom(code: string): Promise<boolean> {
    this.leaveRoom();
    this._roomCode = code;

    const useFirebase = isFirebaseConfigured() && this._signaling.isAvailable();

    if (useFirebase) {
      this._transport = 'webrtc';
      this._isHost = false;
      this._localPlayerIndex = 1;

      console.log(`[NetworkManager] Joining WebRTC room: ${code}`);

      const clientPeer = new WebRTCPeer({
        isHost: false,
        peerId: this._localPlayerId,
        onIceCandidate: (candidate) => {
          this._signaling.sendIceCandidate(code, 'host', this._localPlayerId, candidate);
        },
        onMessage: (data) => {
          if (data instanceof Uint8Array) {
            this._dispatchIncomingBinary(data);
          }
        },
        onReconnectAttempt: (attempt, maxAttempts) => {
          for (let i = 0; i < this._reconnectAttemptListeners.length; i++) {
            this._reconnectAttemptListeners[i](attempt, maxAttempts);
          }
        },
        onReconnected: () => {
          for (let i = 0; i < this._reconnectedListeners.length; i++) {
            this._reconnectedListeners[i]();
          }
        },
        onReconnectFailed: () => {
          for (let i = 0; i < this._connectionLostListeners.length; i++) {
            this._connectionLostListeners[i]();
          }
        },
        onConnectionChange: (state) => {
          if (state === 'closed' || state === 'failed') {
            if (!this._isHost) {
              for (let i = 0; i < this._hostDisconnectedListeners.length; i++) {
                this._hostDisconnectedListeners[i]();
              }
            }
          }
        },
      });

      this._peerConnections.set('host', clientPeer);

      this._signaling.onOffer(code, async (offer) => {
        const answer = await clientPeer.handleOffer(offer);
        await this._signaling.publishAnswer(code, this._localPlayerId, answer);
      });

      this._signaling.onIceCandidates(code, this._localPlayerId, async (cand) => {
        await clientPeer.addIceCandidate(cand);
      });

      return true;
    } else {
      this._transport = 'broadcast_channel';
      console.log(`[NetworkManager] Joining LocalBroadcast fallback room: ${code}`);
      this._localFallback = new LocalBroadcastFallback();
      const joined = await this._localFallback.joinRoom(code, this._localPlayerId, false);
      this._isHost = this._localFallback.isHost;
      this._localPlayerIndex = this._localFallback.playerIndex;
      this._localFallback.onMessage((bytes) => this._dispatchIncomingBinary(bytes));
      this._localFallback.onHostDisconnected(() => {
        for (let i = 0; i < this._hostDisconnectedListeners.length; i++) {
          this._hostDisconnectedListeners[i]();
        }
      });
      return joined;
    }
  }

  public leaveRoom(): void {
    if (this._localFallback) {
      this._localFallback.close();
      this._localFallback = null;
    }

    for (const peer of this._peerConnections.values()) {
      peer.close();
    }
    this._peerConnections.clear();

    if (this._roomCode) {
      this._signaling.destroy(this._roomCode, this._isHost);
      this._roomCode = '';
      this._roomPasscode = '';
    }
  }

  // ── Dispatch & Transmission ──────────────────────────────────────────────────
  public sendSnapshot(snapshot: WorldSnapshot): void {
    const bytes = SnapshotCodec.encodeSnapshot(snapshot);
    this._sendBytes(bytes);
  }

  public sendInput(inputPacket: ClientInputPacket): void {
    const bytes = SnapshotCodec.encodeInput(inputPacket);
    this._sendBytes(bytes);
  }

  public sendEvent(eventType: string, payload: Record<string, unknown>): void {
    const bytes = SnapshotCodec.encodeEvent(eventType, payload);
    this._sendBytes(bytes);
  }

  private _sendBytes(bytes: Uint8Array): void {
    if (this._transport === 'broadcast_channel') {
      if (this._localFallback) {
        this._localFallback.send(bytes);
      }
    } else {
      for (const peer of this._peerConnections.values()) {
        peer.send(bytes);
      }
    }
  }

  private _dispatchIncomingBinary(bytes: Uint8Array): void {
    if (bytes.length === 0) return;
    const packetType = bytes[0];

    try {
      if (packetType === PACKET_SNAPSHOT) {
        const snapshot = SnapshotCodec.decodeSnapshot(bytes);
        for (let i = 0; i < this._snapshotListeners.length; i++) {
          this._snapshotListeners[i](snapshot);
        }
      } else if (packetType === PACKET_INPUT) {
        const input = SnapshotCodec.decodeInput(bytes);
        for (let i = 0; i < this._inputListeners.length; i++) {
          this._inputListeners[i](input);
        }
      } else if (packetType === PACKET_EVENT) {
        const evt = SnapshotCodec.decodeEvent(bytes);
        for (let i = 0; i < this._eventListeners.length; i++) {
          this._eventListeners[i](evt.eventType, evt.payload);
        }
      }
    } catch (err) {
      console.warn('[NetworkManager] Error decoding incoming packet:', err);
    }
  }

  public onSnapshot(cb: (snapshot: WorldSnapshot) => void): void {
    this._snapshotListeners.push(cb);
  }

  public onInput(cb: (input: ClientInputPacket) => void): void {
    this._inputListeners.push(cb);
  }

  public onEvent(cb: (eventType: string, payload: Record<string, unknown>) => void): void {
    this._eventListeners.push(cb);
  }

  public onReconnectAttempt(cb: (attempt: number, max: number) => void): void {
    this._reconnectAttemptListeners.push(cb);
  }

  public onReconnected(cb: () => void): void {
    this._reconnectedListeners.push(cb);
  }

  public onConnectionLost(cb: () => void): void {
    this._connectionLostListeners.push(cb);
  }

  public onHostDisconnected(cb: () => void): void {
    this._hostDisconnectedListeners.push(cb);
  }

  public async manualRejoin(): Promise<boolean> {
    if (!this._roomCode) return false;
    const code = this._roomCode;
    console.log(`[NetworkManager] Manually rejoining room: ${code}`);
    return this.joinRoom(code);
  }
}
