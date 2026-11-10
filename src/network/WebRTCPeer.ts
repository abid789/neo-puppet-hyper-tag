// src/network/WebRTCPeer.ts
// WebRTC peer connection manager with unreliable/unordered RTCDataChannel for 60Hz physics.
// Utilizes Google's public STUN server stun:stun.l.google.com:19302.

export interface WebRTCPeerConfig {
  isHost: boolean;
  peerId: string;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onMessage?: (data: Uint8Array | string) => void;
  onConnectionChange?: (state: RTCPeerConnectionState) => void;
}

export class WebRTCPeer {
  private readonly _cfg: WebRTCPeerConfig;
  private _pc: RTCPeerConnection | null = null;
  private _dataChannel: RTCDataChannel | null = null;
  private _isClosing = false;
  private _reconnectAttempts = 0;
  private static readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor(cfg: WebRTCPeerConfig) {
    this._cfg = cfg;
    this._initPeerConnection();
  }

  private _initPeerConnection(): void {
    if (this._pc) {
      this._teardown();
    }

    this._pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    this._pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && this._cfg.onIceCandidate) {
        this._cfg.onIceCandidate(event.candidate.toJSON());
      }
    };

    this._pc.onconnectionstatechange = () => {
      if (!this._pc) return;
      const state = this._pc.connectionState;
      console.log(`[WebRTCPeer] Connection state (${this._cfg.peerId}):`, state);

      if (this._cfg.onConnectionChange) {
        this._cfg.onConnectionChange(state);
      }

      if (state === 'disconnected' || state === 'failed') {
        this._attemptReconnect();
      }
    };

    if (this._cfg.isHost) {
      // Host creates the unreliable & unordered UDP-like data channel
      this._dataChannel = this._pc.createDataChannel('hyper-tag-data', {
        ordered: false,
        maxRetransmits: 0,
      });
      this._setupDataChannel(this._dataChannel);
    } else {
      // Client receives host data channel
      this._pc.ondatachannel = (event: RTCDataChannelEvent) => {
        console.log('[WebRTCPeer] Client received RTCDataChannel');
        this._dataChannel = event.channel;
        this._setupDataChannel(this._dataChannel);
      };
    }
  }

  private _setupDataChannel(channel: RTCDataChannel): void {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log(`[WebRTCPeer] RTCDataChannel OPEN (${this._cfg.peerId})`);
      this._reconnectAttempts = 0;
    };

    channel.onclose = () => {
      console.log(`[WebRTCPeer] RTCDataChannel CLOSED (${this._cfg.peerId})`);
      if (!this._isClosing) {
        this._attemptReconnect();
      }
    };

    channel.onerror = (err) => {
      console.warn(`[WebRTCPeer] RTCDataChannel error (${this._cfg.peerId}):`, err);
    };

    channel.onmessage = (event: MessageEvent) => {
      if (!this._cfg.onMessage) return;

      if (event.data instanceof ArrayBuffer) {
        this._cfg.onMessage(new Uint8Array(event.data));
      } else if (typeof event.data === 'string') {
        this._cfg.onMessage(event.data);
      }
    };
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this._pc) throw new Error('[WebRTCPeer] PeerConnection not initialized');
    const offer = await this._pc.createOffer();
    await this._pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this._pc) throw new Error('[WebRTCPeer] PeerConnection not initialized');
    await this._pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this._pc.createAnswer();
    await this._pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this._pc) throw new Error('[WebRTCPeer] PeerConnection not initialized');
    await this._pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this._pc) return;
    try {
      await this._pc.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (err) {
      console.warn('[WebRTCPeer] Error adding ICE candidate:', err);
    }
  }

  public send(data: Uint8Array | string): boolean {
    if (!this._dataChannel || this._dataChannel.readyState !== 'open') {
      return false;
    }
    try {
      if (typeof data === 'string') {
        this._dataChannel.send(data);
      } else {
        this._dataChannel.send(data);
      }
      return true;
    } catch (err) {
      console.warn('[WebRTCPeer] Send failed:', err);
      return false;
    }
  }

  public isConnected(): boolean {
    return this._dataChannel !== null && this._dataChannel.readyState === 'open';
  }

  private _attemptReconnect(): void {
    if (this._isClosing) return;
    if (this._reconnectAttempts >= WebRTCPeer.MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[WebRTCPeer] Max reconnect attempts reached for ${this._cfg.peerId}`);
      return;
    }
    this._reconnectAttempts++;
    console.log(`[WebRTCPeer] Attempting reconnect #${this._reconnectAttempts}…`);

    setTimeout(() => {
      if (!this._isClosing) {
        this._initPeerConnection();
      }
    }, 1200 * this._reconnectAttempts);
  }

  private _teardown(): void {
    if (this._dataChannel) {
      this._dataChannel.onopen = null;
      this._dataChannel.onclose = null;
      this._dataChannel.onerror = null;
      this._dataChannel.onmessage = null;
      try { this._dataChannel.close(); } catch { /* noop */ }
      this._dataChannel = null;
    }

    if (this._pc) {
      this._pc.onicecandidate = null;
      this._pc.onconnectionstatechange = null;
      this._pc.ondatachannel = null;
      try { this._pc.close(); } catch { /* noop */ }
      this._pc = null;
    }
  }

  public close(): void {
    this._isClosing = true;
    this._teardown();
  }
}
