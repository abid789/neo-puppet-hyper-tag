// src/ui/SettingsModal.ts
// Comprehensive settings modal with tabs for Graphics presets, Audio volumes, Controls remapping, and Language.

import { SettingsManager, type GraphicsPreset } from '../core/SettingsManager';
import { Localization } from '../core/Localization';
import { checkKeybindConflict, ACTION_LABELS, type KeybindConfig } from '../config/keybinds';
import { Toast } from './Toast';

export class SettingsModal {
  private readonly _settings: SettingsManager;
  private _container: HTMLDivElement | null = null;
  private _activeTab: 'graphics' | 'audio' | 'controls' | 'language' = 'graphics';
  private _listeningForAction: keyof KeybindConfig | null = null;

  constructor(settings: SettingsManager = SettingsManager.getInstance()) {
    this._settings = settings;
    this._injectStyles();
  }

  public show(): void {
    this.close();
    this._render();
  }

  public close(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
    this._listeningForAction = null;
  }

  private _render(): void {
    const s = this._settings.getSettings();

    const modal = document.createElement('div');
    modal.id = 'neo-settings-modal';
    modal.innerHTML = `
      <div class="neo-settings-backdrop"></div>
      <div class="neo-settings-panel">
        <div class="neo-settings-header">
          <h2 class="neo-settings-title">⚙ ${Localization.t('settingsTitle')}</h2>
          <button id="neo-settings-close" class="neo-settings-btn-close">✕</button>
        </div>

        <div class="neo-settings-tabs">
          <button class="neo-tab-btn ${this._activeTab === 'graphics' ? 'active' : ''}" data-tab="graphics">${Localization.t('tabGraphics')}</button>
          <button class="neo-tab-btn ${this._activeTab === 'audio' ? 'active' : ''}" data-tab="audio">${Localization.t('tabAudio')}</button>
          <button class="neo-tab-btn ${this._activeTab === 'controls' ? 'active' : ''}" data-tab="controls">${Localization.t('tabControls')}</button>
          <button class="neo-tab-btn ${this._activeTab === 'language' ? 'active' : ''}" data-tab="language">${Localization.t('tabLanguage')}</button>
        </div>

        <div class="neo-settings-content">
          ${this._renderTabContent(s)}
        </div>

        <div class="neo-settings-footer">
          <button id="neo-settings-reset" class="neo-btn-secondary">RESET DEFAULTS</button>
          <button id="neo-settings-apply" class="neo-btn-primary">${Localization.t('saveSettings')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._container = modal;

    // Tab buttons
    modal.querySelectorAll('.neo-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeTab = btn.getAttribute('data-tab') as typeof this._activeTab;
        this.close();
        this._render();
      });
    });

    const closeBtn = modal.querySelector('#neo-settings-close') as HTMLButtonElement;
    closeBtn.onclick = () => this.close();

    const backdrop = modal.querySelector('.neo-settings-backdrop') as HTMLDivElement;
    backdrop.onclick = () => this.close();

    const applyBtn = modal.querySelector('#neo-settings-apply') as HTMLButtonElement;
    applyBtn.onclick = () => {
      Toast.show('Settings saved!');
      this.close();
    };

    const resetBtn = modal.querySelector('#neo-settings-reset') as HTMLButtonElement;
    resetBtn.onclick = () => {
      this._settings.resetToDefaults();
      Toast.show('Default settings restored.');
      this.close();
      this._render();
    };

    this._bindTabEvents(modal);
  }

  private _renderTabContent(s: ReturnType<typeof this._settings.getSettings>): string {
    switch (this._activeTab) {
      case 'graphics':
        return `
          <div class="neo-form-row">
            <label>GRAPHICS PRESET</label>
            <div class="neo-preset-group">
              <button class="neo-choice-btn ${s.graphicsPreset === 'Ultra' ? 'active' : ''}" data-preset="Ultra">ULTRA</button>
              <button class="neo-choice-btn ${s.graphicsPreset === 'High' ? 'active' : ''}" data-preset="High">HIGH</button>
              <button class="neo-choice-btn ${s.graphicsPreset === 'Esports' ? 'active' : ''}" data-preset="Esports">ESPORTS</button>
            </div>
            <p class="neo-subtext">Ultra: Bloom, light filters, 2000 particles. Esports: Max FPS, minimal VFX.</p>
          </div>

          <div class="neo-form-row">
            <label>${Localization.t('screenShake')}: <span id="shake-val">${Math.round(s.screenShake * 100)}%</span></label>
            <input type="range" id="shake-slider" min="0" max="1" step="0.05" value="${s.screenShake}" />
          </div>
        `;

      case 'audio':
        return `
          <div class="neo-form-row">
            <label>${Localization.t('masterVol')}: <span id="mvol-val">${Math.round(s.masterVolume * 100)}%</span></label>
            <input type="range" id="mvol-slider" min="0" max="1" step="0.05" value="${s.masterVolume}" />
          </div>

          <div class="neo-form-row">
            <label>${Localization.t('sfxVol')}: <span id="sfxvol-val">${Math.round(s.sfxVolume * 100)}%</span></label>
            <input type="range" id="sfxvol-slider" min="0" max="1" step="0.05" value="${s.sfxVolume}" />
          </div>

          <div class="neo-form-row">
            <label>${Localization.t('musicVol')}: <span id="musvol-val">${Math.round(s.musicVolume * 100)}%</span></label>
            <input type="range" id="musvol-slider" min="0" max="1" step="0.05" value="${s.musicVolume}" />
          </div>
        `;

      case 'controls':
        return `
          <div class="neo-keybind-list">
            ${(Object.keys(s.keybinds) as (keyof KeybindConfig)[]).map(action => `
              <div class="neo-keybind-item">
                <span class="neo-action-label">${ACTION_LABELS[action] ?? action}</span>
                <button class="neo-keybind-btn ${this._listeningForAction === action ? 'listening' : ''}" data-action="${action}">
                  ${this._listeningForAction === action ? 'PRESS KEY…' : s.keybinds[action]}
                </button>
              </div>
            `).join('')}
          </div>
        `;

      case 'language':
        const currentLang = Localization.getLanguage();
        return `
          <div class="neo-form-row">
            <label>INTERFACE LANGUAGE (ভাষা)</label>
            <div class="neo-preset-group">
              <button class="neo-choice-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">ENGLISH (US)</button>
              <button class="neo-choice-btn ${currentLang === 'bn' ? 'active' : ''}" data-lang="bn">বাংলা (BENGALI)</button>
            </div>
            <p class="neo-subtext">Switches typography and all HUD / in-game match text.</p>
          </div>
        `;
    }
  }

  private _bindTabEvents(modal: HTMLDivElement): void {
    if (this._activeTab === 'graphics') {
      modal.querySelectorAll('.neo-choice-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.getAttribute('data-preset') as GraphicsPreset;
          this._settings.update({ graphicsPreset: preset });
          this.close();
          this._render();
        });
      });

      const shakeSlider = modal.querySelector('#shake-slider') as HTMLInputElement;
      shakeSlider.oninput = () => {
        const val = parseFloat(shakeSlider.value);
        (modal.querySelector('#shake-val') as HTMLElement).textContent = `${Math.round(val * 100)}%`;
        this._settings.update({ screenShake: val });
      };
    } else if (this._activeTab === 'audio') {
      const bindSlider = (id: string, valId: string, prop: 'masterVolume' | 'sfxVolume' | 'musicVolume') => {
        const slider = modal.querySelector(id) as HTMLInputElement;
        slider.oninput = () => {
          const val = parseFloat(slider.value);
          (modal.querySelector(valId) as HTMLElement).textContent = `${Math.round(val * 100)}%`;
          this._settings.update({ [prop]: val });
        };
      };
      bindSlider('#mvol-slider', '#mvol-val', 'masterVolume');
      bindSlider('#sfxvol-slider', '#sfxvol-val', 'sfxVolume');
      bindSlider('#musvol-slider', '#musvol-val', 'musicVolume');
    } else if (this._activeTab === 'controls') {
      modal.querySelectorAll('.neo-keybind-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action') as keyof KeybindConfig;
          this._listeningForAction = action;
          btn.textContent = 'PRESS KEY…';
          btn.classList.add('listening');

          const keyListener = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const newKey = e.code;
            const currentBindings = this._settings.getSettings().keybinds;
            const check = checkKeybindConflict(currentBindings, action, newKey);

            if (check.hasConflict) {
              Toast.show(`${Localization.t('conflictWarning')} (${check.conflictingAction})`, 3500, true);
            } else {
              this._settings.setKeybind(action, newKey);
              Toast.show(`Bound ${ACTION_LABELS[action]} to [${newKey}]`);
            }

            window.removeEventListener('keydown', keyListener, true);
            this._listeningForAction = null;
            this.close();
            this._render();
          };

          window.addEventListener('keydown', keyListener, { once: true, capture: true });
        });
      });
    } else if (this._activeTab === 'language') {
      modal.querySelectorAll('.neo-choice-btn[data-lang]').forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.getAttribute('data-lang') as 'en' | 'bn';
          Localization.setLanguage(lang);
          this._settings.update({ language: lang });
          this.close();
          this._render();
        });
      });
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-settings-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-settings-style';
    style.textContent = `
      #neo-settings-modal {
        position: fixed; inset: 0; z-index: 14000;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Orbitron', monospace; color: #fff;
      }
      .neo-settings-backdrop {
        position: absolute; inset: 0; background: rgba(5,5,15,0.85); backdrop-filter: blur(10px);
      }
      .neo-settings-panel {
        position: relative; width: 540px; max-width: 94vw; max-height: 85vh;
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff;
        border-radius: 8px; padding: 22px; box-shadow: 0 0 35px rgba(0,255,255,0.3);
        display: flex; flex-direction: column;
      }
      .neo-settings-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
      }
      .neo-settings-title { font-size: 15px; color: #00ffff; font-weight: 900; letter-spacing: 1px; }
      .neo-settings-btn-close { background: none; border: none; color: #888; font-size: 18px; cursor: pointer; }
      .neo-settings-btn-close:hover { color: #ff0066; }
      .neo-settings-tabs {
        display: flex; gap: 8px; border-bottom: 1px solid rgba(0,255,255,0.2); padding-bottom: 10px; margin-bottom: 16px;
      }
      .neo-tab-btn {
        background: rgba(255,255,255,0.05); border: 1px solid #333; color: #aaa;
        border-radius: 4px; padding: 6px 12px; font-size: 10px; font-family: 'Orbitron', monospace;
        cursor: pointer; transition: all 0.2s;
      }
      .neo-tab-btn.active {
        background: rgba(0,255,255,0.2); border-color: #00ffff; color: #00ffff; font-weight: bold;
      }
      .neo-settings-content { flex: 1; overflow-y: auto; padding-right: 6px; }
      .neo-form-row { margin-bottom: 18px; }
      .neo-form-row label { display: block; font-size: 11px; color: #88ffff; margin-bottom: 8px; font-weight: bold; }
      .neo-preset-group { display: flex; gap: 8px; }
      .neo-choice-btn {
        flex: 1; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;
        border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 10px; cursor: pointer;
      }
      .neo-choice-btn.active {
        background: #00ffff; color: #05050f; border-color: #00ffff; font-weight: 900;
      }
      .neo-subtext { font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #777; margin-top: 6px; }
      input[type="range"] { width: 100%; accent-color: #00ffff; }
      .neo-keybind-list { display: flex; flex-direction: column; gap: 8px; }
      .neo-keybind-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 4px;
      }
      .neo-action-label { font-size: 11px; color: #ddd; font-family: 'Rajdhani', sans-serif; font-weight: 600; }
      .neo-keybind-btn {
        min-width: 100px; padding: 5px 10px; background: rgba(0,0,0,0.6); border: 1px solid #444;
        color: #00ffff; font-family: 'Orbitron', monospace; font-size: 10px; border-radius: 4px; cursor: pointer;
      }
      .neo-keybind-btn.listening {
        border-color: #ff0066; color: #ff0066; animation: blink 0.8s infinite;
      }
      .neo-settings-footer {
        display: flex; justify-content: space-between; margin-top: 18px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;
      }
    `;
    document.head.appendChild(style);
  }
}
