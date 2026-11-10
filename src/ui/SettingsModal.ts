// src/ui/SettingsModal.ts
// Comprehensive settings modal with one-click performance presets,
// granular graphics tuning, audio volumes, keybindings, and language switches.

import { SettingsManager, type GraphicsPreset, type TouchControlSetting } from '../core/SettingsManager';
import { Localization } from '../core/Localization';
import { checkKeybindConflict, ACTION_LABELS, type KeybindConfig } from '../config/keybinds';
import { isTouchDevice } from '../core/DeviceInfo';
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
          <div class="neo-settings-title-group">
            <h2 class="neo-settings-title">⚙ ${Localization.t('settingsTitle')}</h2>
            <span class="neo-current-preset-badge ${s.graphicsPreset === 'Custom' ? 'custom' : 'preset'}">
              PROFILE: ${s.graphicsPreset.toUpperCase()}
            </span>
          </div>
          <button id="neo-settings-close" class="neo-settings-btn-close">✕</button>
        </div>

        <!-- Top One-Click Performance Presets Bar -->
        <div class="neo-top-presets-bar">
          <div class="neo-preset-bar-label">⚡ ONE-CLICK PRESET</div>
          <div class="neo-preset-buttons-row">
            <button class="neo-quick-preset-btn ${s.graphicsPreset === 'Low Spec' ? 'active' : ''}" data-apply-preset="Low Spec">
              LOW SPEC
            </button>
            <button class="neo-quick-preset-btn ${s.graphicsPreset === 'Balanced' || s.graphicsPreset === 'High' ? 'active' : ''}" data-apply-preset="Balanced">
              BALANCED
            </button>
            <button class="neo-quick-preset-btn ${s.graphicsPreset === 'Max Quality' || s.graphicsPreset === 'Ultra' ? 'active' : ''}" data-apply-preset="Max Quality">
              MAX QUALITY
            </button>
            <button class="neo-quick-preset-btn ${s.graphicsPreset === 'Mobile' ? 'active' : ''}" data-apply-preset="Mobile">
              📱 MOBILE
            </button>
          </div>
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

    // Quick Preset buttons at the top
    modal.querySelectorAll('.neo-quick-preset-btn[data-apply-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-apply-preset') as GraphicsPreset;
        this._settings.applyPreset(p);
        Toast.show(`Preset Applied: ${p}`);
        this.close();
        this._render();
      });
    });

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
            <label>PRESET DOCUMENTATION & DETAILS</label>
            <div class="neo-preset-doc-card">
              <div class="neo-preset-doc-title">CURRENT: <strong>${s.graphicsPreset.toUpperCase()}</strong></div>
              <div class="neo-preset-doc-grid">
                <div><span>Render Scale:</span> <strong>${Math.round(s.renderScale * 100)}%</strong></div>
                <div><span>Target FPS:</span> <strong>${s.targetFps > 0 ? `${s.targetFps} FPS` : 'UNCAPPED'}</strong></div>
                <div><span>Particle Budget:</span> <strong>${s.particleBudget}</strong></div>
                <div><span>Bloom VFX:</span> <strong>${s.bloom ? 'ON' : 'OFF'}</strong></div>
                <div><span>Scanlines:</span> <strong>${s.scanlines ? 'ON' : 'OFF'}</strong></div>
                <div><span>Chromatic Aberration:</span> <strong>${s.chromaticAberration ? 'ON' : 'OFF'}</strong></div>
              </div>
            </div>
          </div>

          <div class="neo-form-row">
            <label>TARGET RENDER FPS: <span id="fps-val">${s.targetFps > 0 ? `${s.targetFps} FPS` : 'UNCAPPED'}</span></label>
            <div class="neo-preset-group">
              <button class="neo-choice-btn ${s.targetFps === 30 ? 'active' : ''}" data-fps="30">30 FPS (POWERSAVE)</button>
              <button class="neo-choice-btn ${s.targetFps === 60 ? 'active' : ''}" data-fps="60">60 FPS (STANDARD)</button>
              <button class="neo-choice-btn ${s.targetFps === 0 ? 'active' : ''}" data-fps="0">UNCAPPED</button>
            </div>
            <p class="neo-subtext">30 FPS caps render load for battery life and mobile thermals while keeping physics 60Hz.</p>
          </div>

          <div class="neo-form-row">
            <label>RESOLUTION SCALE: <span id="res-val">${Math.round(s.renderScale * 100)}%</span></label>
            <input type="range" id="res-slider" min="0.5" max="1.0" step="0.05" value="${s.renderScale}" />
            <p class="neo-subtext">0.75x or 0.6x scales internal canvas resolution for older laptops.</p>
          </div>

          <div class="neo-form-row">
            <label>PARTICLE BUDGET: <span id="part-val">${s.particleBudget} max</span></label>
            <input type="range" id="part-slider" min="300" max="2500" step="100" value="${s.particleBudget}" />
          </div>

          <div class="neo-form-row">
            <label>${Localization.t('screenShake')}: <span id="shake-val">${Math.round(s.screenShake * 100)}%</span></label>
            <input type="range" id="shake-slider" min="0" max="1" step="0.05" value="${s.screenShake}" />
          </div>

          <div class="neo-form-row">
            <label>POST-PROCESSING SHADERS</label>
            <div class="neo-toggle-grid">
              <button class="neo-toggle-btn ${s.bloom ? 'active' : ''}" id="toggle-bloom">
                BLOOM: ${s.bloom ? 'ENABLED' : 'DISABLED'}
              </button>
              <button class="neo-toggle-btn ${s.scanlines ? 'active' : ''}" id="toggle-scanlines">
                SCANLINES: ${s.scanlines ? 'ENABLED' : 'DISABLED'}
              </button>
              <button class="neo-toggle-btn ${s.chromaticAberration ? 'active' : ''}" id="toggle-chrom">
                CHROMATIC: ${s.chromaticAberration ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
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
          <div class="neo-form-row">
            <label>${Localization.t('touchControlsTitle') || 'TOUCH CONTROLS'}</label>
            <div class="neo-preset-group">
              <button class="neo-choice-btn ${s.touchControls === 'Auto' ? 'active' : ''}" data-touch-setting="Auto">
                AUTO (${isTouchDevice() ? 'ON' : 'OFF'})
              </button>
              <button class="neo-choice-btn ${s.touchControls === 'On' ? 'active' : ''}" data-touch-setting="On">
                ALWAYS ON
              </button>
              <button class="neo-choice-btn ${s.touchControls === 'Off' ? 'active' : ''}" data-touch-setting="Off">
                ALWAYS OFF
              </button>
            </div>
            <p class="neo-subtext">Auto automatically displays mobile dual-thumb touch controls when a touch device is detected.</p>
          </div>

          <div class="neo-form-row">
            <label>KEYBOARD CONTROLS REMAPPING</label>
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
      // FPS buttons
      modal.querySelectorAll('.neo-choice-btn[data-fps]').forEach(btn => {
        btn.addEventListener('click', () => {
          const fps = parseInt(btn.getAttribute('data-fps') || '60', 10);
          this._settings.update({ targetFps: fps });
          this.close();
          this._render();
        });
      });

      // Render scale slider
      const resSlider = modal.querySelector('#res-slider') as HTMLInputElement | null;
      if (resSlider) {
        resSlider.oninput = () => {
          const val = parseFloat(resSlider.value);
          const txt = modal.querySelector('#res-val');
          if (txt) txt.textContent = `${Math.round(val * 100)}%`;
          this._settings.update({ renderScale: val });
          this._updatePresetBadgeToCustom(modal);
        };
      }

      // Particle budget slider
      const partSlider = modal.querySelector('#part-slider') as HTMLInputElement | null;
      if (partSlider) {
        partSlider.oninput = () => {
          const val = parseInt(partSlider.value, 10);
          const txt = modal.querySelector('#part-val');
          if (txt) txt.textContent = `${val} max`;
          this._settings.update({ particleBudget: val });
          this._updatePresetBadgeToCustom(modal);
        };
      }

      // Screen shake slider
      const shakeSlider = modal.querySelector('#shake-slider') as HTMLInputElement | null;
      if (shakeSlider) {
        shakeSlider.oninput = () => {
          const val = parseFloat(shakeSlider.value);
          const txt = modal.querySelector('#shake-val');
          if (txt) txt.textContent = `${Math.round(val * 100)}%`;
          this._settings.update({ screenShake: val });
          this._updatePresetBadgeToCustom(modal);
        };
      }

      // Shaders toggles
      const bloomBtn = modal.querySelector('#toggle-bloom') as HTMLButtonElement | null;
      if (bloomBtn) {
        bloomBtn.onclick = () => {
          const cur = this._settings.getSettings().bloom;
          this._settings.update({ bloom: !cur });
          this.close();
          this._render();
        };
      }

      const scanBtn = modal.querySelector('#toggle-scanlines') as HTMLButtonElement | null;
      if (scanBtn) {
        scanBtn.onclick = () => {
          const cur = this._settings.getSettings().scanlines;
          this._settings.update({ scanlines: !cur });
          this.close();
          this._render();
        };
      }

      const chromBtn = modal.querySelector('#toggle-chrom') as HTMLButtonElement | null;
      if (chromBtn) {
        chromBtn.onclick = () => {
          const cur = this._settings.getSettings().chromaticAberration;
          this._settings.update({ chromaticAberration: !cur });
          this.close();
          this._render();
        };
      }
    } else if (this._activeTab === 'audio') {
      const bindSlider = (id: string, valId: string, prop: 'masterVolume' | 'sfxVolume' | 'musicVolume') => {
        const slider = modal.querySelector(id) as HTMLInputElement | null;
        if (!slider) return;
        slider.oninput = () => {
          const val = parseFloat(slider.value);
          const txt = modal.querySelector(valId);
          if (txt) txt.textContent = `${Math.round(val * 100)}%`;
          this._settings.update({ [prop]: val });
        };
      };
      bindSlider('#mvol-slider', '#mvol-val', 'masterVolume');
      bindSlider('#sfxvol-slider', '#sfxvol-val', 'sfxVolume');
      bindSlider('#musvol-slider', '#musvol-val', 'musicVolume');
    } else if (this._activeTab === 'controls') {
      modal.querySelectorAll('.neo-choice-btn[data-touch-setting]').forEach(btn => {
        btn.addEventListener('click', () => {
          const setting = btn.getAttribute('data-touch-setting') as TouchControlSetting;
          this._settings.update({ touchControls: setting });
          Toast.show(`Touch Controls: ${setting}`);
          this.close();
          this._render();
        });
      });

      modal.querySelectorAll('.neo-keybind-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action') as keyof KeybindConfig;
          this._listeningForAction = action;
          btn.textContent = 'PRESS KEY…';

          const keyListener = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            window.removeEventListener('keydown', keyListener, true);

            const newKey = e.code;
            const conflict = checkKeybindConflict(
              this._settings.getSettings().keybinds,
              action,
              newKey,
            );
            if (conflict.hasConflict && conflict.conflictingAction) {
              Toast.show(`Key already bound to ${ACTION_LABELS[conflict.conflictingAction]}`);
            } else {
              this._settings.setKeybind(action, newKey);
              Toast.show(`Bound ${ACTION_LABELS[action]} to [${newKey}]`);
            }

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
          this._settings.update({ language: lang });
          Toast.show(lang === 'bn' ? 'ভাষা পরিবর্তিত হয়েছে: বাংলা' : 'Language changed: English');
          this.close();
          this._render();
        });
      });
    }
  }

  private _updatePresetBadgeToCustom(modal: HTMLDivElement): void {
    const badge = modal.querySelector('.neo-current-preset-badge');
    if (badge) {
      badge.textContent = 'PROFILE: CUSTOM';
      badge.className = 'neo-current-preset-badge custom';
    }
    modal.querySelectorAll('.neo-quick-preset-btn').forEach(b => b.classList.remove('active'));
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
        position: relative; width: 560px; max-width: 95vw; max-height: 88vh;
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff;
        border-radius: 8px; padding: 22px; box-shadow: 0 0 35px rgba(0,255,255,0.3);
        display: flex; flex-direction: column;
      }
      .neo-settings-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
      }
      .neo-settings-title-group { display: flex; align-items: center; gap: 12px; }
      .neo-settings-title { font-size: 15px; color: #00ffff; font-weight: 900; letter-spacing: 1px; margin: 0; }
      .neo-current-preset-badge {
        font-size: 9px; padding: 2px 7px; border-radius: 4px; font-weight: bold; letter-spacing: 1px;
      }
      .neo-current-preset-badge.preset {
        background: rgba(0,255,255,0.15); border: 1px solid #00ffff; color: #00ffff;
      }
      .neo-current-preset-badge.custom {
        background: rgba(255,170,0,0.15); border: 1px solid #ffaa00; color: #ffaa00;
      }
      .neo-settings-btn-close { background: none; border: none; color: #888; font-size: 18px; cursor: pointer; }
      .neo-settings-btn-close:hover { color: #ff0066; }

      /* Top Presets Bar */
      .neo-top-presets-bar {
        background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0,255,255,0.18);
        border-radius: 6px; padding: 8px 10px; margin-bottom: 12px;
      }
      .neo-preset-bar-label { font-size: 9px; color: #88ffff; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px; }
      .neo-preset-buttons-row { display: flex; gap: 6px; }
      .neo-quick-preset-btn {
        flex: 1; padding: 7px 4px; background: rgba(0,0,0,0.5); border: 1px solid #334455;
        color: #bbb; border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 9px;
        font-weight: bold; cursor: pointer; transition: all 0.2s; text-align: center;
      }
      .neo-quick-preset-btn:hover { border-color: #00ffff; color: #fff; }
      .neo-quick-preset-btn.active {
        background: #00ffff; color: #05050f; border-color: #00ffff; font-weight: 900;
        box-shadow: 0 0 12px rgba(0,255,255,0.4);
      }

      .neo-settings-tabs {
        display: flex; gap: 8px; border-bottom: 1px solid rgba(0,255,255,0.2); padding-bottom: 10px; margin-bottom: 14px;
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
      .neo-form-row { margin-bottom: 16px; }
      .neo-form-row label { display: block; font-size: 11px; color: #88ffff; margin-bottom: 8px; font-weight: bold; }
      
      .neo-preset-doc-card {
        background: rgba(0,0,0,0.4); border: 1px solid #223344; border-radius: 4px; padding: 10px;
        font-size: 10px; color: #ccc;
      }
      .neo-preset-doc-title { margin-bottom: 6px; font-size: 10px; color: #00ffff; }
      .neo-preset-doc-title strong { color: #ffee00; }
      .neo-preset-doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 10px; }
      .neo-preset-doc-grid span { color: #888; }
      .neo-preset-doc-grid strong { color: #fff; }

      .neo-preset-group { display: flex; gap: 8px; }
      .neo-choice-btn {
        flex: 1; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;
        border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 9px; cursor: pointer;
      }
      .neo-choice-btn.active {
        background: #00ffff; color: #05050f; border-color: #00ffff; font-weight: 900;
      }
      .neo-toggle-grid { display: flex; gap: 8px; }
      .neo-toggle-btn {
        flex: 1; padding: 8px 4px; background: rgba(0,0,0,0.4); border: 1px solid #444;
        color: #888; border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 9px;
        cursor: pointer; font-weight: bold;
      }
      .neo-toggle-btn.active {
        border-color: #00ff88; color: #00ff88; background: rgba(0,255,136,0.1);
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
        display: flex; justify-content: space-between; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;
      }
    `;
    document.head.appendChild(style);
  }
}
