// src/ui/LobbyChat.ts
// Embedded party chat panel for Lobby: 6 quick-reply buttons, 140 char limit,
// 1 msg/sec rate limiting, and HTML escaping.

import { ChatService, type ChatMessage } from '../network/ChatService';
import { Localization } from '../core/Localization';
import { Toast } from './Toast';

export const QUICK_REPLIES = ['GG', 'Rematch?', 'Ready?', 'Wait!', 'Nice tag', 'Lol'];

export class LobbyChat {
  private _container: HTMLElement | null = null;
  private _feedEl: HTMLElement | null = null;
  private _inputEl: HTMLInputElement | null = null;
  private readonly _chat: ChatService;

  constructor(chat: ChatService = ChatService.getInstance()) {
    this._chat = chat;
    this._injectStyles();
  }

  public render(parent: HTMLElement): void {
    const existing = parent.querySelector('#neo-lobby-chat-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'neo-lobby-chat-panel';
    panel.innerHTML = `
      <div class="neo-chat-header">
        <span class="neo-chat-title">💬 ${Localization.t('partyChat')}</span>
      </div>

      <!-- Quick Replies Bar -->
      <div class="neo-chat-quick-replies">
        ${QUICK_REPLIES.map(text => `
          <button type="button" class="neo-btn-quick" data-reply="${ChatService.escapeHtml(text)}">${ChatService.escapeHtml(text)}</button>
        `).join('')}
      </div>

      <!-- Message Feed -->
      <div class="neo-chat-feed" id="neo-chat-feed"></div>

      <!-- Input Form -->
      <div class="neo-chat-form">
        <input
          type="text"
          id="neo-chat-input"
          maxlength="140"
          placeholder="${Localization.t('chatPlaceholder')}"
          autocomplete="off"
        />
        <button type="button" id="neo-chat-send-btn" class="neo-btn-send">SEND</button>
      </div>
    `;

    parent.appendChild(panel);
    this._container = panel;
    this._feedEl = panel.querySelector('#neo-chat-feed');
    this._inputEl = panel.querySelector('#neo-chat-input');

    // Attach Quick-Reply listeners
    panel.querySelectorAll('.neo-btn-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const reply = btn.getAttribute('data-reply');
        if (reply) {
          this._trySendMessage(reply);
        }
      });
    });

    // Send button & enter key
    const sendBtn = panel.querySelector('#neo-chat-send-btn') as HTMLButtonElement;
    sendBtn.onclick = () => this._handleSend();

    if (this._inputEl) {
      this._inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._handleSend();
        }
      };
    }

    // Subscribe to chat updates
    this._chat.onMessage((messages) => {
      this._updateFeed(messages);
    });
  }

  private _handleSend(): void {
    if (!this._inputEl) return;
    const text = this._inputEl.value;
    if (this._trySendMessage(text)) {
      this._inputEl.value = '';
      this._inputEl.focus();
    }
  }

  private _trySendMessage(text: string): boolean {
    const res = this._chat.sendMessage(text);
    if (!res.ok) {
      if (res.reason === 'RATE_LIMIT') {
        Toast.show(Localization.t('chatRateLimit'));
      }
      return false;
    }
    return true;
  }

  private _updateFeed(messages: ChatMessage[]): void {
    if (!this._feedEl) return;

    if (messages.length === 0) {
      this._feedEl.innerHTML = `<div class="neo-chat-empty">Party chat active. Say hello!</div>`;
      return;
    }

    this._feedEl.innerHTML = messages.map(m => {
      const time = new Date(m.timestamp);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      const safeName = ChatService.escapeHtml(m.senderName);
      const safeText = ChatService.escapeHtml(m.text);

      return `
        <div class="neo-chat-msg">
          <span class="neo-chat-time">${timeStr}</span>
          <strong class="neo-chat-author" style="color: ${m.color}">${safeName}:</strong>
          <span class="neo-chat-text">${safeText}</span>
        </div>
      `;
    }).join('');

    // Auto-scroll to bottom
    this._feedEl.scrollTop = this._feedEl.scrollHeight;
  }

  public destroy(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-lobby-chat-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-lobby-chat-style';
    style.textContent = `
      #neo-lobby-chat-panel {
        width: 100%; max-width: 1200px; margin: 16px auto 0;
        background: rgba(13,13,31,0.85); border: 1px solid rgba(0,255,255,0.25);
        border-radius: 8px; padding: 12px 18px; box-shadow: 0 0 20px rgba(0,255,255,0.1);
        display: flex; flex-direction: column; gap: 8px; font-family: 'Orbitron', monospace;
      }
      .neo-chat-header {
        display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;
      }
      .neo-chat-title { font-size: 11px; font-weight: 900; color: #88ffff; letter-spacing: 1px; }
      .neo-chat-quick-replies { display: flex; gap: 6px; flex-wrap: wrap; margin: 2px 0; }
      .neo-btn-quick {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15);
        color: #00ffff; border-radius: 12px; padding: 4px 10px; font-size: 10px;
        font-family: 'Rajdhani', sans-serif; font-weight: bold; cursor: pointer; transition: all 0.15s;
      }
      .neo-btn-quick:hover {
        background: rgba(0,255,255,0.15); border-color: #00ffff; transform: translateY(-1px);
      }
      .neo-chat-feed {
        height: 85px; max-height: 85px; overflow-y: auto; display: flex; flex-direction: column;
        gap: 4px; padding: 6px 8px; background: rgba(0,0,0,0.4); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);
      }
      .neo-chat-empty { font-size: 10px; color: #666; font-family: 'Rajdhani', sans-serif; text-align: center; margin-top: 25px; }
      .neo-chat-msg { font-size: 11px; line-height: 1.3; font-family: 'Rajdhani', sans-serif; word-break: break-word; }
      .neo-chat-time { font-size: 9px; color: #666; margin-right: 6px; font-family: 'Orbitron', monospace; }
      .neo-chat-author { margin-right: 6px; }
      .neo-chat-text { color: #eee; }
      .neo-chat-form { display: flex; gap: 8px; }
      #neo-chat-input {
        flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 4px;
        padding: 8px 12px; color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 13px;
      }
      #neo-chat-input:focus { border-color: #00ffff; outline: none; }
      .neo-btn-send {
        background: #00ffff; color: #05050f; border: none; border-radius: 4px; padding: 0 16px;
        font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 900; cursor: pointer;
      }
      .neo-btn-send:hover { background: #88ffff; }
    `;
    document.head.appendChild(style);
  }
}
