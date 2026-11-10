// src/network/ChatService.ts
// Party chat lite service: In-memory only (max 50 messages), 140 char limit,
// 1 msg/sec rate limiting, and HTML sanitization. Communicates over existing WebRTC/Broadcast data channel.

import { NetworkManager } from './NetworkManager';

export interface ChatMessage {
  id:         string;
  senderId:   string;
  senderName: string;
  color:      string;
  text:       string;
  timestamp:  number;
}

export class ChatService {
  private static _instance: ChatService | null = null;

  public static getInstance(): ChatService {
    if (!this._instance) {
      this._instance = new ChatService();
    }
    return this._instance;
  }

  private readonly _net: NetworkManager;
  private readonly _messages: ChatMessage[] = [];
  private static readonly MAX_MESSAGES = 50;
  private _lastSentTime = 0;
  private _localSenderName = 'PILOT';
  private _localColor = '#00ffff';

  private readonly _messageListeners: ((messages: ChatMessage[]) => void)[] = [];

  constructor(net: NetworkManager = NetworkManager.getInstance()) {
    this._net = net;

    // Listen to network event packets on the active room data channel
    this._net.onEvent((eventType, payload) => {
      if (eventType === 'CHAT_MESSAGE') {
        const msg: ChatMessage = {
          id:         String(payload.id || Math.random().toString(36)),
          senderId:   String(payload.senderId || 'unknown'),
          senderName: String(payload.senderName || 'PILOT'),
          color:      String(payload.color || '#00ffff'),
          text:       String(payload.text || '').slice(0, 140),
          timestamp:  Number(payload.timestamp || Date.now()),
        };
        this._addMessage(msg);
      }
    });
  }

  public setLocalSender(name: string, color: string): void {
    this._localSenderName = name;
    this._localColor = color;
  }

  public getMessages(): ChatMessage[] {
    return [...this._messages];
  }

  /**
   * Sends a message with 140-char limit and 1 msg/sec rate limiting.
   * Returns { ok: boolean, reason?: string }
   */
  public sendMessage(text: string): { ok: boolean; reason?: string } {
    const now = Date.now();
    if (now - this._lastSentTime < 1000) {
      return { ok: false, reason: 'RATE_LIMIT' };
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, reason: 'EMPTY' };
    }

    const cleanText = trimmed.slice(0, 140);
    this._lastSentTime = now;

    const msg: ChatMessage = {
      id:         Math.random().toString(36).substring(2, 9),
      senderId:   this._net.playerId,
      senderName: this._localSenderName,
      color:      this._localColor,
      text:       cleanText,
      timestamp:  now,
    };

    this._addMessage(msg);

    // Transmit over existing room channel
    this._net.sendEvent('CHAT_MESSAGE', {
      id:         msg.id,
      senderId:   msg.senderId,
      senderName: msg.senderName,
      color:      msg.color,
      text:       msg.text,
      timestamp:  msg.timestamp,
    });

    return { ok: true };
  }

  public clear(): void {
    this._messages.length = 0;
    this._notify();
  }

  public onMessage(cb: (messages: ChatMessage[]) => void): void {
    this._messageListeners.push(cb);
    cb(this.getMessages());
  }

  private _addMessage(msg: ChatMessage): void {
    this._messages.push(msg);
    if (this._messages.length > ChatService.MAX_MESSAGES) {
      this._messages.shift();
    }
    this._notify();
  }

  private _notify(): void {
    const msgs = this.getMessages();
    for (let i = 0; i < this._messageListeners.length; i++) {
      this._messageListeners[i](msgs);
    }
  }

  /**
   * Strict HTML escape helper to prevent XSS / markup injection.
   */
  public static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
