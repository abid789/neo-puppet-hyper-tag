// src/ui/ReconnectBanner.ts
// Displays reconnecting feedback banner with attempt counter and exponential backoff,
// and a "Connection lost" dialogue with one-click "REJOIN" action.

import { Localization } from '../core/Localization';

export class ReconnectBanner {
  private static _instance: ReconnectBanner | null = null;

  public static getInstance(): ReconnectBanner {
    if (!this._instance) {
      this._instance = new ReconnectBanner();
    }
    return this._instance;
  }

  private _bannerEl: HTMLDivElement | null = null;
  private _lostModalEl: HTMLDivElement | null = null;

  constructor() {
    this._injectStyles();
  }

  public showReconnecting(attempt: number, maxAttempts = 10): void {
    this.hideConnectionLost();

    if (!this._bannerEl) {
      const banner = document.createElement('div');
      banner.id = 'neo-reconnect-banner';
      document.body.appendChild(banner);
      this._bannerEl = banner;
    }

    this._bannerEl.innerHTML = `
      <div class="neo-reconnect-inner">
        <span class="neo-reconnect-spinner"></span>
        <div class="neo-reconnect-text">
          <strong>${Localization.t('reconnectingTitle') || 'RECONNECTING…'}</strong>
          <span>${Localization.t('reconnectAttempt') || 'Attempt'} ${attempt} / ${maxAttempts}</span>
        </div>
      </div>
    `;
    this._bannerEl.classList.remove('hidden');
  }

  public hideReconnecting(): void {
    if (this._bannerEl) {
      this._bannerEl.remove();
      this._bannerEl = null;
    }
  }

  public showConnectionLost(onRejoin: () => void, onMenu: () => void): void {
    this.hideReconnecting();
    this.hideConnectionLost();

    const modal = document.createElement('div');
    modal.id = 'neo-connection-lost-modal';
    modal.innerHTML = `
      <div class="neo-connection-lost-backdrop"></div>
      <div class="neo-connection-lost-panel">
        <div class="neo-connection-lost-icon">⚠</div>
        <h2 class="neo-connection-lost-title">${Localization.t('connectionLostTitle') || 'CONNECTION LOST'}</h2>
        <p class="neo-connection-lost-sub">
          ${Localization.t('connectionLostDesc') || 'Unable to reconnect to the session after 10 attempts. Would you like to rejoin or return to the menu?'}
        </p>
        <div class="neo-connection-lost-actions">
          <button id="btn-rejoin-room" class="neo-btn-primary">
            🔄 ${Localization.t('rejoinBtn') || 'REJOIN ROOM'}
          </button>
          <button id="btn-return-menu" class="neo-btn-secondary">
            🏠 ${Localization.t('backToMenu') || 'MAIN MENU'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._lostModalEl = modal;

    const rejoinBtn = modal.querySelector('#btn-rejoin-room') as HTMLButtonElement;
    if (rejoinBtn) {
      rejoinBtn.onclick = () => {
        this.hideConnectionLost();
        onRejoin();
      };
    }

    const menuBtn = modal.querySelector('#btn-return-menu') as HTMLButtonElement;
    if (menuBtn) {
      menuBtn.onclick = () => {
        this.hideConnectionLost();
        onMenu();
      };
    }
  }

  public hideConnectionLost(): void {
    if (this._lostModalEl) {
      this._lostModalEl.remove();
      this._lostModalEl = null;
    }
  }

  public hideAll(): void {
    this.hideReconnecting();
    this.hideConnectionLost();
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-reconnect-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-reconnect-style';
    style.textContent = `
      #neo-reconnect-banner {
        position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
        z-index: 15000; font-family: 'Orbitron', monospace;
        background: rgba(13, 13, 31, 0.95); border: 1px solid #ff0055;
        border-radius: 6px; padding: 10px 18px; box-shadow: 0 0 25px rgba(255,0,85,0.45);
        display: flex; align-items: center; color: #fff;
        animation: pulseBanner 1.8s infinite;
      }
      .neo-reconnect-inner { display: flex; align-items: center; gap: 14px; }
      .neo-reconnect-spinner {
        width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.2);
        border-top-color: #ff0055; border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .neo-reconnect-text { display: flex; flex-direction: column; font-size: 11px; }
      .neo-reconnect-text strong { color: #ff0055; letter-spacing: 1px; }
      .neo-reconnect-text span { font-size: 10px; color: #aaa; margin-top: 2px; }

      #neo-connection-lost-modal {
        position: fixed; inset: 0; z-index: 16000;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Orbitron', monospace; color: #fff;
      }
      .neo-connection-lost-backdrop {
        position: absolute; inset: 0; background: rgba(5,5,15,0.85); backdrop-filter: blur(8px);
      }
      .neo-connection-lost-panel {
        position: relative; width: 420px; max-width: 90vw; background: rgba(13,13,31,0.98);
        border: 1px solid #ff0055; border-radius: 8px; padding: 24px; text-align: center;
        box-shadow: 0 0 40px rgba(255,0,85,0.4);
      }
      .neo-connection-lost-icon { font-size: 32px; color: #ff0055; margin-bottom: 8px; }
      .neo-connection-lost-title { font-size: 16px; color: #ff0055; font-weight: 900; letter-spacing: 2px; margin: 0 0 10px 0; }
      .neo-connection-lost-sub { font-family: 'Rajdhani', sans-serif; font-size: 13px; color: #bbb; line-height: 1.4; margin-bottom: 20px; }
      .neo-connection-lost-actions { display: flex; gap: 10px; justify-content: center; }

      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulseBanner {
        0%, 100% { box-shadow: 0 0 20px rgba(255,0,85,0.3); }
        50% { box-shadow: 0 0 35px rgba(255,0,85,0.7); }
      }
    `;
    document.head.appendChild(style);
  }
}
