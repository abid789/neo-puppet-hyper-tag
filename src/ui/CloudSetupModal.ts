// src/ui/CloudSetupModal.ts
// Modal allowing players to paste in their free Firebase Realtime Database credentials.
// Validates JSON and saves/resets directly to localStorage.

import { Localization } from '../core/Localization';
import {
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  isFirebaseConfigured,
  getEffectiveFirebaseConfig,
} from '../config/firebaseConfig';
import { Toast } from './Toast';

export class CloudSetupModal {
  private _container: HTMLDivElement | null = null;
  private _onConfigChanged: (() => void) | null = null;

  public setOnConfigChanged(cb: () => void): void {
    this._onConfigChanged = cb;
  }

  public show(): void {
    this.close();

    const isConnected = isFirebaseConfigured();
    const existingConfig = getEffectiveFirebaseConfig();
    const currentJson = existingConfig ? JSON.stringify(existingConfig, null, 2) : '';

    const modal = document.createElement('div');
    modal.id = 'neo-cloud-modal';
    modal.innerHTML = `
      <div class="neo-cloud-backdrop"></div>
      <div class="neo-cloud-panel">
        <div class="neo-cloud-header">
          <h2 class="neo-cloud-title">⚡ ${Localization.t('cloudTitle')}</h2>
          <button id="neo-cloud-close" class="neo-cloud-btn-close">✕</button>
        </div>

        <div class="neo-cloud-status-badge ${isConnected ? 'active' : 'fallback'}">
          ${isConnected ? `✓ ${Localization.t('cloudActive')}` : `ℹ ${Localization.t('localFallbackActive')}`}
        </div>

        <p class="neo-cloud-desc">${Localization.t('cloudDesc')}</p>

        <textarea id="neo-cloud-input" rows="8" placeholder="${Localization.t('cloudPlaceholder')}">${currentJson}</textarea>

        <div class="neo-cloud-actions">
          <button id="neo-cloud-save" class="neo-btn-primary">${Localization.t('saveConfig')}</button>
          <button id="neo-cloud-clear" class="neo-btn-secondary">${Localization.t('clearConfig')}</button>
        </div>
      </div>
    `;

    this._injectStyles();
    document.body.appendChild(modal);
    this._container = modal;

    // Listeners
    const closeBtn = modal.querySelector('#neo-cloud-close') as HTMLButtonElement;
    closeBtn.onclick = () => this.close();

    const backdrop = modal.querySelector('.neo-cloud-backdrop') as HTMLDivElement;
    backdrop.onclick = () => this.close();

    const saveBtn = modal.querySelector('#neo-cloud-save') as HTMLButtonElement;
    const inputEl = modal.querySelector('#neo-cloud-input') as HTMLTextAreaElement;
    saveBtn.onclick = () => {
      const val = inputEl.value.trim();
      if (!val) {
        Toast.show('Please paste a valid Firebase JSON configuration', 3000, true);
        return;
      }
      const ok = saveCustomFirebaseConfig(val);
      if (ok) {
        Toast.show('Firebase credentials saved! Reloading engine…');
        this.close();
        if (this._onConfigChanged) this._onConfigChanged();
        setTimeout(() => window.location.reload(), 1200);
      } else {
        Toast.show('Invalid Firebase JSON. Must contain apiKey, databaseURL, and projectId', 3500, true);
      }
    };

    const clearBtn = modal.querySelector('#neo-cloud-clear') as HTMLButtonElement;
    clearBtn.onclick = () => {
      clearCustomFirebaseConfig();
      Toast.show('Firebase credentials removed. Switched to Local Fallback.');
      this.close();
      if (this._onConfigChanged) this._onConfigChanged();
      setTimeout(() => window.location.reload(), 1000);
    };
  }

  public close(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-cloud-modal-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-cloud-modal-style';
    style.textContent = `
      #neo-cloud-modal {
        position: fixed; inset: 0; z-index: 14000;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Orbitron', monospace; color: #fff;
      }
      .neo-cloud-backdrop {
        position: absolute; inset: 0; background: rgba(5,5,15,0.85); backdrop-filter: blur(10px);
      }
      .neo-cloud-panel {
        position: relative; width: 480px; max-width: 92vw;
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff;
        border-radius: 8px; padding: 22px; box-shadow: 0 0 35px rgba(0,255,255,0.3);
      }
      .neo-cloud-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
      }
      .neo-cloud-title { font-size: 15px; color: #00ffff; font-weight: 900; letter-spacing: 1px; }
      .neo-cloud-btn-close { background: none; border: none; color: #888; font-size: 18px; cursor: pointer; }
      .neo-cloud-btn-close:hover { color: #ff0066; }
      .neo-cloud-status-badge {
        font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-bottom: 12px; display: inline-block;
      }
      .neo-cloud-status-badge.active { background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; }
      .neo-cloud-status-badge.fallback { background: rgba(255,238,0,0.15); border: 1px solid #ffee00; color: #ffee00; }
      .neo-cloud-desc { font-family: 'Rajdhani', sans-serif; font-size: 13px; color: #aaa; margin-bottom: 12px; line-height: 1.4; }
      #neo-cloud-input {
        width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.65); border: 1px solid #333;
        border-radius: 4px; color: #00ffff; font-family: monospace; font-size: 11px; padding: 10px;
        resize: vertical; margin-bottom: 14px;
      }
      .neo-cloud-actions { display: flex; gap: 10px; }
      .neo-btn-primary {
        flex: 1; padding: 10px; background: #00ffff; color: #05050f; border: none;
        border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 900;
        cursor: pointer; transition: all 0.2s;
      }
      .neo-btn-primary:hover { background: #88ffff; box-shadow: 0 0 15px #00ffff; }
      .neo-btn-secondary {
        padding: 10px 14px; background: rgba(255,0,102,0.15); color: #ff0066; border: 1px solid #ff0066;
        border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 11px; font-weight: bold; cursor: pointer;
      }
      .neo-btn-secondary:hover { background: #ff0066; color: #fff; }
    `;
    document.head.appendChild(style);
  }
}
