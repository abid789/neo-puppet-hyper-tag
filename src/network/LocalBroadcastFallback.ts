// src/network/LocalBroadcastFallback.ts
// Cross-tab local multiplayer transport via HTML5 BroadcastChannel API.
// Allows multiple tabs on the same PC to discover rooms, elect host, and exchange 60Hz snapshots.

export interface LocalPeerMessage {
  type:        'DISCOVER_HOST' | 'HOST_OFFER' | 'CLIENT_JOIN' | 'PAYLOAD' | 'PING' | 'PONG' | 'LEAVE';
  senderId:    string;
  targetId?:   string;
  playerIndex: number;
  data?:       number[]; // Serialized Uint8Array bytes
  timestamp:   number;
}

export class LocalBroadcastFallback {
  private _channel: BroadcastChannel | null = null;
  private _roomCode = '';
  private _peerId = '';
  private _isHost = false;
  private _playerIndex = 0;
  private _pingMs = 1;
  private _lastPingSent = 0;
  private _onMessageCb: ((data: Uint8Array) => void) | null = null;
  private _onPeerJoinedCb: ((peerId: string, playerIndex: number) => void) | null = null;
  private _connectedPeers: Map<string, number> = new Map();
  private _pingIntervalId: number | null = null;

  public get isHost(): boolean {
    return this._isHost;
  }

  public get roomCode(): string {
    return this._roomCode;
  }

  public get playerIndex(): number {
    return this._playerIndex;
  }

  public get ping(): number {
    return this._pingMs;
  }

  public async joinRoom(
    roomCode: string,
    peerId: string,
    forceHost = false,
  ): Promise<boolean> {
    this.close();
    this._roomCode = roomCode;
    this._peerId = peerId;

    this._channel = new BroadcastChannel(`neo-puppet-room-${roomCode}`);
    this._channel.onmessage = (event: MessageEvent<LocalPeerMessage>) => {
      this._handleIncoming(event.data);
    };

    if (forceHost) {
      this._isHost = true;
      this._playerIndex = 0;
      this._startPing();
      return true;
    }

    // Host Discovery handshake
    return new Promise<boolean>((resolve) => {
      let hostResponded = false;

      const timeout = setTimeout(() => {
        if (!hostResponded) {
          // No host answered within 180ms -> We become the Host!
          this._isHost = true;
          this._playerIndex = 0;
          this._startPing();
          console.log(`[LocalBroadcastFallback] No host detected in ${roomCode}. Assuming HOST role (P1).`);
          resolve(true);
        }
      }, 180);

      const discoveryListener = (event: MessageEvent<LocalPeerMessage>) => {
        const msg = event.data;
        if (msg.type === 'HOST_OFFER' && msg.targetId === this._peerId) {
          hostResponded = true;
          clearTimeout(timeout);
          this._isHost = false;
          this._playerIndex = msg.playerIndex;
          this._startPing();
          console.log(`[LocalBroadcastFallback] Host found! Connected as CLIENT (P${this._playerIndex + 1}).`);
          resolve(true);
        }
      };

      if (this._channel) {
        this._channel.addEventListener('message', discoveryListener, { once: true });
        this._channel.postMessage({
          type: 'DISCOVER_HOST',
          senderId: this._peerId,
          playerIndex: -1,
          timestamp: performance.now(),
        } satisfies LocalPeerMessage);
      }
    });
  }

  private _handleIncoming(msg: LocalPeerMessage): void {
    if (msg.senderId === this._peerId) return;

    switch (msg.type) {
      case 'DISCOVER_HOST':
        if (this._isHost && this._channel) {
          // Assign next available player slot
          const nextIndex = this._connectedPeers.size + 1;
          this._connectedPeers.set(msg.senderId, nextIndex);

          this._channel.postMessage({
            type: 'HOST_OFFER',
            senderId: this._peerId,
            targetId: msg.senderId,
            playerIndex: nextIndex,
            timestamp: performance.now(),
          } satisfies LocalPeerMessage);

          if (this._onPeerJoinedCb) {
            this._onPeerJoinedCb(msg.senderId, nextIndex);
          }
        }
        break;

      case 'PAYLOAD':
        if (msg.data && this._onMessageCb) {
          this._onMessageCb(new Uint8Array(msg.data));
        }
        break;

      case 'PING':
        if (this._channel) {
          this._channel.postMessage({
            type: 'PONG',
            senderId: this._peerId,
            targetId: msg.senderId,
            playerIndex: this._playerIndex,
            timestamp: msg.timestamp,
          } satisfies LocalPeerMessage);
        }
        break;

      case 'PONG':
        if (msg.targetId === this._peerId) {
          const rtt = Math.max(1, Math.round(performance.now() - msg.timestamp));
          this._pingMs = Math.round(this._pingMs * 0.7 + rtt * 0.3);
        }
        break;

      case 'LEAVE':
        this._connectedPeers.delete(msg.senderId);
        break;
    }
  }

  public send(bytes: Uint8Array): void {
    if (!this._channel) return;
    this._channel.postMessage({
      type: 'PAYLOAD',
      senderId: this._peerId,
      playerIndex: this._playerIndex,
      data: Array.from(bytes),
      timestamp: performance.now(),
    } satisfies LocalPeerMessage);
  }

  public onMessage(cb: (data: Uint8Array) => void): void {
    this._onMessageCb = cb;
  }

  public onPeerJoined(cb: (peerId: string, playerIndex: number) => void): void {
    this._onPeerJoinedCb = cb;
  }

  private _startPing(): void {
    if (this._pingIntervalId !== null) return;
    this._pingIntervalId = window.setInterval(() => {
      if (this._channel && !this._isHost) {
        this._lastPingSent = performance.now();
        this._channel.postMessage({
          type: 'PING',
          senderId: this._peerId,
          playerIndex: this._playerIndex,
          timestamp: this._lastPingSent,
        } satisfies LocalPeerMessage);
      }
    }, 1000);
  }

  public close(): void {
    if (this._pingIntervalId !== null) {
      clearInterval(this._pingIntervalId);
      this._pingIntervalId = null;
    }
    if (this._channel) {
      try {
        this._channel.postMessage({
          type: 'LEAVE',
          senderId: this._peerId,
          playerIndex: this._playerIndex,
          timestamp: performance.now(),
        } satisfies LocalPeerMessage);
        this._channel.close();
      } catch {
        /* noop */
      }
      this._channel = null;
    }
    this._connectedPeers.clear();
  }
}
