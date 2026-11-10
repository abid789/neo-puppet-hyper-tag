// src/ui/MainMenu.ts
// Main menu screen: Cyberpunk hero title, interactive buttons, language toggle, and navigation triggers.

import { Localization } from '../core/Localization';

export class MainMenu {
  private _container: HTMLDivElement | null = null;

  private _onQuickMatch: (() => void) | null = null;
  private _onPracticeMode: (() => void) | null = null;
  private _onShowRecap: (() => void) | null = null;
  private _onHostLobby: (() => void) | null = null;
  private _onJoinRoom: (() => void) | null = null;
  private _onCustomizer: (() => void) | null = null;
  private _onSettings: (() => void) | null = null;
  private _onCloudSetup: (() => void) | null = null;
  private _onSessionHistory: (() => void) | null = null;

  constructor() {
    this._injectStyles();
  }

  public setCallbacks(callbacks: {
    onQuickMatch:     () => void;
    onPracticeMode:   () => void;
    onShowRecap:      () => void;
    onHostLobby:      () => void;
    onJoinRoom:       () => void;
    onCustomizer:     () => void;
    onSettings:       () => void;
    onCloudSetup:     () => void;
    onSessionHistory: () => void;
  }): void {
    this._onQuickMatch     = callbacks.onQuickMatch;
    this._onPracticeMode   = callbacks.onPracticeMode;
    this._onShowRecap      = callbacks.onShowRecap;
    this._onHostLobby      = callbacks.onHostLobby;
    this._onJoinRoom       = callbacks.onJoinRoom;
    this._onCustomizer     = callbacks.onCustomizer;
    this._onSettings       = callbacks.onSettings;
    this._onCloudSetup     = callbacks.onCloudSetup;
    this._onSessionHistory = callbacks.onSessionHistory;
  }

  public show(): void {
    this.hide();

    const menu = document.createElement('div');
    menu.id = 'neo-main-menu';
    menu.innerHTML = `
      <div class="neo-menu-content">
        <!-- Hero Header -->
        <div class="neo-menu-hero">
          <h1 class="neo-hero-glitch" data-text="NEO-PUPPET">NEO-PUPPET</h1>
          <div class="neo-hero-sub">HYPER TAG</div>
          <p class="neo-hero-caption">${Localization.t('appSubtitle')}</p>
        </div>

        <!-- Navigation Buttons -->
        <div class="neo-menu-buttons">
          <button id="btn-quick-match" class="neo-btn-hero primary">▶ ${Localization.t('playQuickMatch')}</button>
          <button id="btn-practice-mode" class="neo-btn-hero">🎯 ${Localization.t('practiceMode')}</button>
          <button id="btn-recap" class="neo-btn-hero">📊 ${Localization.t('matchRecap')}</button>
          <button id="btn-session-history" class="neo-btn-hero">📅 ${Localization.t('todayMatches')}</button>
          <button id="btn-host-lobby" class="neo-btn-hero">⚡ ${Localization.t('hostLobby')}</button>
          <button id="btn-join-room" class="neo-btn-hero">🔗 ${Localization.t('joinRoom')}</button>
          <button id="btn-customizer" class="neo-btn-hero">⚙ ${Localization.t('customizer')}</button>
          <button id="btn-settings" class="neo-btn-hero">🛠 ${Localization.t('settings')}</button>
          <button id="btn-cloud" class="neo-btn-hero secondary">☁ ${Localization.t('cloudSetup')}</button>
        </div>

        <!-- Language Switcher & Controls Footer -->
        <div class="neo-menu-footer">
          <button id="btn-toggle-lang" class="neo-btn-lang">🌐 ${Localization.t('switchLang')}</button>
          <div class="neo-keyboard-hints">WASD: MOVE // SHIFT: DASH // F: ATTACK // F3: HUD</div>
        </div>
      </div>
    `;

    document.body.appendChild(menu);
    this._container = menu;

    // Attach click events
    (menu.querySelector('#btn-quick-match') as HTMLElement).onclick = () => {
      this.hide();
      if (this._onQuickMatch) this._onQuickMatch();
    };

    (menu.querySelector('#btn-practice-mode') as HTMLElement).onclick = () => {
      this.hide();
      if (this._onPracticeMode) this._onPracticeMode();
    };

    (menu.querySelector('#btn-recap') as HTMLElement).onclick = () => {
      if (this._onShowRecap) this._onShowRecap();
    };

    (menu.querySelector('#btn-session-history') as HTMLElement).onclick = () => {
      if (this._onSessionHistory) this._onSessionHistory();
    };

    (menu.querySelector('#btn-host-lobby') as HTMLElement).onclick = () => {
      this.hide();
      if (this._onHostLobby) this._onHostLobby();
    };

    (menu.querySelector('#btn-join-room') as HTMLElement).onclick = () => {
      if (this._onJoinRoom) this._onJoinRoom();
    };

    (menu.querySelector('#btn-customizer') as HTMLElement).onclick = () => {
      if (this._onCustomizer) this._onCustomizer();
    };

    (menu.querySelector('#btn-settings') as HTMLElement).onclick = () => {
      if (this._onSettings) this._onSettings();
    };

    (menu.querySelector('#btn-cloud') as HTMLElement).onclick = () => {
      if (this._onCloudSetup) this._onCloudSetup();
    };

    (menu.querySelector('#btn-toggle-lang') as HTMLElement).onclick = () => {
      Localization.toggleLanguage();
      this.show(); // Re-render in new language
    };
  }

  public hide(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-menu-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-menu-style';
    style.textContent = `
      #neo-main-menu {
        position: fixed; inset: 0; z-index: 9000;
        display: flex; align-items: center; justify-content: flex-start;
        padding-left: 8vw; font-family: 'Orbitron', monospace; color: #fff;
        background: linear-gradient(90deg, rgba(5,5,15,0.92) 0%, rgba(5,5,15,0.6) 55%, transparent 100%);
        backdrop-filter: blur(4px); pointer-events: auto;
      }
      .neo-menu-content { width: 440px; max-width: 90vw; }
      .neo-menu-hero { margin-bottom: 30px; }
      .neo-hero-glitch {
        font-size: clamp(34px, 5vw, 56px); font-weight: 900; color: #00ffff;
        letter-spacing: 3px; line-height: 1; text-shadow: 0 0 20px #00ffff88;
        margin-bottom: 4px;
      }
      .neo-hero-sub {
        font-size: 20px; font-weight: 900; color: #ff0066; letter-spacing: 8px;
        text-shadow: 0 0 15px #ff006688; margin-bottom: 8px;
      }
      .neo-hero-caption {
        font-family: 'Rajdhani', sans-serif; font-size: 13px; color: #888; letter-spacing: 1.5px;
      }
      .neo-menu-buttons {
        display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px;
      }
      .neo-btn-hero {
        width: 100%; padding: 12px 18px; text-align: left;
        background: rgba(13, 13, 31, 0.85); border: 1px solid rgba(0, 255, 255, 0.25);
        color: #e0e0ff; font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 700;
        letter-spacing: 1.5px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
        backdrop-filter: blur(8px);
      }
      .neo-btn-hero:hover {
        background: rgba(0, 255, 255, 0.15); border-color: #00ffff; color: #00ffff;
        transform: translateX(6px); box-shadow: 0 0 15px rgba(0,255,255,0.3);
      }
      .neo-btn-hero.primary {
        background: #00ffff; color: #05050f; font-weight: 900; border-color: #00ffff;
      }
      .neo-btn-hero.primary:hover {
        background: #88ffff; color: #05050f; box-shadow: 0 0 25px #00ffff;
      }
      .neo-btn-hero.secondary {
        border-color: rgba(255, 0, 102, 0.4); color: #ff0066;
      }
      .neo-btn-hero.secondary:hover {
        background: rgba(255, 0, 102, 0.15); border-color: #ff0066; box-shadow: 0 0 15px rgba(255,0,102,0.3);
      }
      .neo-menu-footer {
        display: flex; flex-direction: column; gap: 10px;
      }
      .neo-btn-lang {
        align-self: flex-start; background: rgba(255,255,255,0.06); border: 1px solid #444;
        color: #aaa; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer;
        transition: all 0.2s; font-family: 'Hind Siliguri', 'Orbitron', sans-serif;
      }
      .neo-btn-lang:hover { border-color: #00ffff; color: #00ffff; }
      .neo-keyboard-hints {
        font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #555; letter-spacing: 1px;
      }
    `;
    document.head.appendChild(style);
  }
}
