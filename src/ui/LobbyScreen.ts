// src/ui/LobbyScreen.ts
// Tactical party lobby: 4 glowing puppet pedestals, ready status toggle, and host launch controls.

import { Localization } from '../core/Localization';
import { RoomLinkManager } from '../network/RoomLinkManager';
import { Toast } from './Toast';

export interface LobbyPlayerSlot {
  index:       number;
  name:        string;
  color:       string;
  isReady:     boolean;
  isBot:       boolean;
  isHost:      boolean;
  isConnected: boolean;
}

export class LobbyScreen {
  private _container: HTMLDivElement | null = null;
  private _isReady = false;
  private _slots: LobbyPlayerSlot[] = [
    { index: 0, name: 'HOST PILOT', color: '#00ffff', isReady: true, isBot: false, isHost: true, isConnected: true },
    { index: 1, name: 'AI BOT 1',   color: '#ff0066', isReady: true, isBot: true,  isHost: false, isConnected: true },
    { index: 2, name: 'AI BOT 2',   color: '#00ff88', isReady: true, isBot: true,  isHost: false, isConnected: true },
    { index: 3, name: 'AI BOT 3',   color: '#ffee00', isReady: true, isBot: true,  isHost: false, isConnected: true },
  ];

  private _onStartMatch: (() => void) | null = null;
  private _onOpenCustomizer: (() => void) | null = null;
  private _onLeave: (() => void) | null = null;
  private _onReadyToggled: ((ready: boolean) => void) | null = null;

  constructor() {
    this._injectStyles();
  }

  public setCallbacks(
    onStart: () => void,
    onCustomizer: () => void,
    onLeave: () => void,
    onReady: (ready: boolean) => void,
  ): void {
    this._onStartMatch = onStart;
    this._onOpenCustomizer = onCustomizer;
    this._onLeave = onLeave;
    this._onReadyToggled = onReady;
  }

  public updateSlots(slots: LobbyPlayerSlot[]): void {
    this._slots = slots;
    if (this._container) {
      this._renderPedestals();
    }
  }

  public show(isHost = true, roomCode = 'TAG-8492'): void {
    this.hide();

    const screen = document.createElement('div');
    screen.id = 'neo-lobby-screen';
    screen.innerHTML = `
      <div class="neo-lobby-header">
        <div>
          <h1 class="neo-lobby-title">⚡ ${Localization.t('lobbyTitle')}</h1>
          <div class="neo-lobby-code">ROOM CODE: <strong>${roomCode}</strong></div>
        </div>
        <div class="neo-lobby-top-actions">
          <button id="neo-lobby-copy-btn" class="neo-btn-secondary">📋 ${Localization.t('copyLink')}</button>
          <button id="neo-lobby-leave-btn" class="neo-btn-secondary danger">${Localization.t('backToMenu')}</button>
        </div>
      </div>

      <!-- 4 Puppet Pedestals Grid -->
      <div class="neo-pedestals-container" id="neo-pedestals-grid"></div>

      <!-- Footer Action Controls -->
      <div class="neo-lobby-footer">
        <button id="neo-lobby-ready-btn" class="neo-btn-ready">${Localization.t('readyBtn')}</button>
        ${isHost ? `
          <button id="neo-lobby-custom-btn" class="neo-btn-secondary">⚙ ${Localization.t('customizer')}</button>
          <button id="neo-lobby-start-btn" class="neo-btn-primary">▶ ${Localization.t('startGame')}</button>
        ` : `
          <div class="neo-lobby-waiting-text">${Localization.t('waitingForHost')}</div>
        `}
      </div>
    `;

    document.body.appendChild(screen);
    this._container = screen;
    this._renderPedestals();

    const readyBtn = screen.querySelector('#neo-lobby-ready-btn') as HTMLButtonElement;
    readyBtn.onclick = () => {
      this._isReady = !this._isReady;
      readyBtn.classList.toggle('active', this._isReady);
      readyBtn.textContent = this._isReady ? `✓ ${Localization.t('readyStatus')}` : Localization.t('readyBtn');
      if (this._onReadyToggled) this._onReadyToggled(this._isReady);
    };

    const copyBtn = screen.querySelector('#neo-lobby-copy-btn') as HTMLButtonElement;
    copyBtn.onclick = async () => {
      const ok = await RoomLinkManager.copyInviteLink(roomCode);
      Toast.show(ok ? Localization.t('copiedLinkToast') : 'Copy Failed');
    };

    const leaveBtn = screen.querySelector('#neo-lobby-leave-btn') as HTMLButtonElement;
    leaveBtn.onclick = () => {
      this.hide();
      if (this._onLeave) this._onLeave();
    };

    if (isHost) {
      const customBtn = screen.querySelector('#neo-lobby-custom-btn') as HTMLButtonElement;
      if (customBtn) {
        customBtn.onclick = () => {
          if (this._onOpenCustomizer) this._onOpenCustomizer();
        };
      }

      const startBtn = screen.querySelector('#neo-lobby-start-btn') as HTMLButtonElement;
      if (startBtn) {
        startBtn.onclick = () => {
          this.hide();
          if (this._onStartMatch) this._onStartMatch();
        };
      }
    }
  }

  public hide(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _renderPedestals(): void {
    const grid = document.querySelector('#neo-pedestals-grid');
    if (!grid) return;

    grid.innerHTML = this._slots.map((slot) => `
      <div class="neo-pedestal-card ${slot.isConnected ? 'occupied' : 'empty'} ${slot.isReady ? 'ready' : ''}">
        <div class="neo-pedestal-disc" style="border-color:${slot.color}; box-shadow: 0 0 25px ${slot.color}44">
          <div class="neo-pedestal-avatar" style="background:${slot.color}"></div>
        </div>
        <div class="neo-pedestal-info">
          <div class="neo-pedestal-slot">${slot.isHost ? '★ HOST' : slot.isBot ? Localization.t('botSlot') : Localization.t('playerSlot')} ${slot.index + 1}</div>
          <div class="neo-pedestal-name">${slot.name}</div>
          <div class="neo-pedestal-status ${slot.isReady ? 'ready' : 'not-ready'}">
            ${slot.isReady ? `✓ ${Localization.t('readyStatus')}` : `… ${Localization.t('notReadyStatus')}`}
          </div>
        </div>
      </div>
    `).join('');
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-lobby-style-screen')) return;
    const style = document.createElement('style');
    style.id = 'neo-lobby-style-screen';
    style.textContent = `
      #neo-lobby-screen {
        position: fixed; inset: 0; z-index: 10000;
        background: radial-gradient(circle at center, rgba(13,13,31,0.95) 0%, rgba(5,5,15,0.98) 100%);
        backdrop-filter: blur(12px); font-family: 'Orbitron', monospace; color: #fff;
        display: flex; flex-direction: column; justify-content: space-between; padding: 36px 48px;
      }
      .neo-lobby-header { display: flex; justify-content: space-between; align-items: flex-start; }
      .neo-lobby-title { font-size: 22px; color: #00ffff; font-weight: 900; letter-spacing: 2px; }
      .neo-lobby-code { font-size: 13px; color: #aaa; margin-top: 6px; }
      .neo-lobby-code strong { color: #ffee00; }
      .neo-lobby-top-actions { display: flex; gap: 10px; }
      .neo-pedestals-container {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%;
      }
      .neo-pedestal-card {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
        padding: 24px; display: flex; flex-direction: column; align-items: center; text-align: center;
        transition: all 0.3s;
      }
      .neo-pedestal-card.occupied { border-color: rgba(0,255,255,0.3); background: rgba(0,255,255,0.04); }
      .neo-pedestal-card.ready { border-color: #00ff88; box-shadow: 0 0 20px rgba(0,255,136,0.25); }
      .neo-pedestal-disc {
        width: 100px; height: 100px; border-radius: 50%; border: 2px solid #555;
        display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
        animation: floatPedestal 3s ease-in-out infinite;
      }
      @keyframes floatPedestal {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .neo-pedestal-avatar { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #fff; }
      .neo-pedestal-slot { font-size: 10px; color: #88ffff; font-weight: bold; margin-bottom: 4px; }
      .neo-pedestal-name { font-size: 14px; font-weight: 900; margin-bottom: 8px; }
      .neo-pedestal-status { font-size: 11px; font-weight: bold; }
      .neo-pedestal-status.ready { color: #00ff88; }
      .neo-pedestal-status.not-ready { color: #888; }
      .neo-lobby-footer {
        display: flex; justify-content: center; align-items: center; gap: 16px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);
      }
      .neo-btn-ready {
        padding: 12px 28px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88;
        font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 900; border-radius: 4px; cursor: pointer;
      }
      .neo-btn-ready.active { background: #00ff88; color: #05050f; }
      .neo-lobby-waiting-text { font-family: 'Rajdhani', sans-serif; font-size: 14px; color: #aaa; animation: blink 1.2s infinite; }
    `;
    document.head.appendChild(style);
  }
}
