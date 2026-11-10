// src/ui/MatchCustomizer.ts
// Host match parameter customizer: Arena cards with visual previews, tag modes, duration, modifiers, and bot slots.

import { Localization } from '../core/Localization';
import type { BotDifficulty } from '../ai/PuppetBotController';

export interface MatchCustomizerConfig {
  mapIndex:      number;
  modeIndex:     number;
  durationSec:   number;
  modifier:      'normal' | 'turbo' | 'low_g';
  botCount:      number;
  botDifficulty: BotDifficulty;
}

export const MAP_PREVIEWS = [
  { id: 'neon_foundry', name: 'NEON CYBER FOUNDRY', color: '#00ffff', desc: 'Conveyors, jump pads & laser gates' },
  { id: 'orbital_station', name: 'ZERO-G ORBITAL STATION', color: '#aa00ff', desc: 'Low-gravity dome & quantum portals' },
  { id: 'magma_reactor', name: 'MAGMA CORE REACTOR', color: '#ff6600', desc: 'Crumbling basalt platforms & lava surges' },
  { id: 'glacier_lab', name: 'GLACIER MIRROR LAB', color: '#88ffff', desc: 'Slippery ice shelves & crystal pendulums' },
  { id: 'skyline_rush', name: 'SKYLINE ROOFTOP RUSH', color: '#ff0066', desc: 'Rainy high-altitude gaps & speed ziplines' },
  { id: 'underwater_ruins', name: 'UNDERWATER RUINS', color: '#00ffc2', desc: 'Buoyant platforms, bubble vents & water drag' },
  { id: 'desert_sandstorm', name: 'DESERT SANDSTORM', color: '#ffaa00', desc: 'Sandstorm gusts, floating pillars & quicksand' },
  { id: 'haunted_carnival', name: 'HAUNTED CARNIVAL', color: '#ff00aa', desc: 'Ferris wheel, trampolines & fun-house mirror' },
];

export class MatchCustomizer {
  private _container: HTMLDivElement | null = null;
  private _cfg: MatchCustomizerConfig = {
    mapIndex:      0,
    modeIndex:     0,
    durationSec:   120,
    modifier:      'normal',
    botCount:      3,
    botDifficulty: 'Pro',
  };
  private _onApplyCb: ((cfg: MatchCustomizerConfig) => void) | null = null;

  public setOnApply(cb: (cfg: MatchCustomizerConfig) => void): void {
    this._onApplyCb = cb;
  }

  public show(currentConfig?: Partial<MatchCustomizerConfig>): void {
    this.close();
    if (currentConfig) {
      this._cfg = { ...this._cfg, ...currentConfig };
    }

    const modal = document.createElement('div');
    modal.id = 'neo-customizer-modal';
    modal.innerHTML = `
      <div class="neo-customizer-backdrop"></div>
      <div class="neo-customizer-panel">
        <div class="neo-customizer-header">
          <h2 class="neo-customizer-title">⚡ ${Localization.t('customizerTitle')}</h2>
          <button id="neo-customizer-close" class="neo-btn-icon">✕</button>
        </div>

        <div class="neo-customizer-scroll">
          <!-- 1. Map Selection -->
          <div class="neo-customizer-section">
            <label class="neo-section-label">${Localization.t('selectMap')}</label>
            <div class="neo-map-cards-grid">
              ${MAP_PREVIEWS.map((m, idx) => `
                <div class="neo-map-card ${this._cfg.mapIndex === idx ? 'selected' : ''}" data-idx="${idx}">
                  <div class="neo-map-thumb" style="border-color:${m.color}; background: linear-gradient(135deg, ${m.color}22, #050510)">
                    <span class="neo-map-id">${m.id}</span>
                  </div>
                  <div class="neo-map-info">
                    <div class="neo-map-name">${m.name}</div>
                    <div class="neo-map-desc">${m.desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. Mode Selection -->
          <div class="neo-customizer-section">
            <label class="neo-section-label">${Localization.t('selectMode')}</label>
            <div class="neo-choice-grid">
              <button class="neo-mode-btn ${this._cfg.modeIndex === 0 ? 'selected' : ''}" data-mode="0">
                <strong>${Localization.t('modeHunter')}</strong>
                <span>${Localization.t('modeHunterDesc')}</span>
              </button>
              <button class="neo-mode-btn ${this._cfg.modeIndex === 1 ? 'selected' : ''}" data-mode="1">
                <strong>${Localization.t('modeBomb')}</strong>
                <span>${Localization.t('modeBombDesc')}</span>
              </button>
              <button class="neo-mode-btn ${this._cfg.modeIndex === 2 ? 'selected' : ''}" data-mode="2">
                <strong>${Localization.t('modeCrown')}</strong>
                <span>${Localization.t('modeCrownDesc')}</span>
              </button>
              <button class="neo-mode-btn ${this._cfg.modeIndex === 3 ? 'selected' : ''}" data-mode="3">
                <strong>${Localization.t('modeTeam')}</strong>
                <span>${Localization.t('modeTeamDesc')}</span>
              </button>
              <button class="neo-mode-btn ${this._cfg.modeIndex === 4 ? 'selected' : ''}" data-mode="4">
                <strong>${Localization.t('modeInfection')}</strong>
                <span>${Localization.t('modeInfectionDesc')}</span>
              </button>
              <button class="neo-mode-btn ${this._cfg.modeIndex === 5 ? 'selected' : ''}" data-mode="5">
                <strong>${Localization.t('modeSurvivor')}</strong>
                <span>${Localization.t('modeSurvivorDesc')}</span>
              </button>
            </div>
          </div>

          <!-- 3. Duration & Modifier Row -->
          <div class="neo-customizer-row">
            <div class="neo-customizer-col">
              <label class="neo-section-label">${Localization.t('durationLabel')}</label>
              <div class="neo-btn-group">
                ${[60, 90, 120, 180].map(dur => `
                  <button class="neo-pill-btn ${this._cfg.durationSec === dur ? 'active' : ''}" data-dur="${dur}">${dur}s</button>
                `).join('')}
              </div>
            </div>

            <div class="neo-customizer-col">
              <label class="neo-section-label">${Localization.t('modifierLabel')}</label>
              <div class="neo-btn-group">
                <button class="neo-pill-btn ${this._cfg.modifier === 'normal' ? 'active' : ''}" data-mod="normal">NORMAL</button>
                <button class="neo-pill-btn ${this._cfg.modifier === 'turbo' ? 'active' : ''}" data-mod="turbo">TURBO 1.25x</button>
                <button class="neo-pill-btn ${this._cfg.modifier === 'low_g' ? 'active' : ''}" data-mod="low_g">LOW-G</button>
              </div>
            </div>
          </div>

          <!-- 4. Bot Slots & Difficulty -->
          <div class="neo-customizer-row">
            <div class="neo-customizer-col">
              <label class="neo-section-label">${Localization.t('botCountLabel')}</label>
              <div class="neo-btn-group">
                ${[0, 1, 2, 3].map(cnt => `
                  <button class="neo-pill-btn ${this._cfg.botCount === cnt ? 'active' : ''}" data-bots="${cnt}">${cnt} BOTS</button>
                `).join('')}
              </div>
            </div>

            <div class="neo-customizer-col">
              <label class="neo-section-label">${Localization.t('botDiffLabel')}</label>
              <div class="neo-btn-group">
                ${['Casual', 'Pro', 'Nightmare'].map(diff => `
                  <button class="neo-pill-btn ${this._cfg.botDifficulty === diff ? 'active' : ''}" data-diff="${diff}">${diff}</button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="neo-customizer-footer">
          <button id="neo-customizer-apply" class="neo-btn-primary">${Localization.t('applyAndClose')}</button>
        </div>
      </div>
    `;

    this._injectStyles();
    document.body.appendChild(modal);
    this._container = modal;

    // Attach Selection listeners
    modal.querySelectorAll('.neo-map-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.querySelectorAll('.neo-map-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._cfg.mapIndex = parseInt(card.getAttribute('data-idx') ?? '0', 10);
      });
    });

    modal.querySelectorAll('.neo-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.neo-mode-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._cfg.modeIndex = parseInt(btn.getAttribute('data-mode') ?? '0', 10);
      });
    });

    modal.querySelectorAll('.neo-pill-btn[data-dur]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.neo-pill-btn[data-dur]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._cfg.durationSec = parseInt(btn.getAttribute('data-dur') ?? '120', 10);
      });
    });

    modal.querySelectorAll('.neo-pill-btn[data-mod]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.neo-pill-btn[data-mod]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._cfg.modifier = btn.getAttribute('data-mod') as typeof this._cfg.modifier;
      });
    });

    modal.querySelectorAll('.neo-pill-btn[data-bots]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.neo-pill-btn[data-bots]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._cfg.botCount = parseInt(btn.getAttribute('data-bots') ?? '3', 10);
      });
    });

    modal.querySelectorAll('.neo-pill-btn[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.neo-pill-btn[data-diff]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._cfg.botDifficulty = btn.getAttribute('data-diff') as BotDifficulty;
      });
    });

    const closeBtn = modal.querySelector('#neo-customizer-close') as HTMLButtonElement;
    closeBtn.onclick = () => this.close();

    const applyBtn = modal.querySelector('#neo-customizer-apply') as HTMLButtonElement;
    applyBtn.onclick = () => {
      if (this._onApplyCb) this._onApplyCb({ ...this._cfg });
      this.close();
    };
  }

  public close(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-customizer-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-customizer-style';
    style.textContent = `
      #neo-customizer-modal {
        position: fixed; inset: 0; z-index: 13000;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Orbitron', monospace; color: #fff;
      }
      .neo-customizer-backdrop {
        position: absolute; inset: 0; background: rgba(5,5,15,0.88); backdrop-filter: blur(12px);
      }
      .neo-customizer-panel {
        position: relative; width: 680px; max-width: 95vw; max-height: 88vh;
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff;
        border-radius: 8px; padding: 22px; box-shadow: 0 0 40px rgba(0,255,255,0.3);
        display: flex; flex-direction: column;
      }
      .neo-customizer-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
      }
      .neo-customizer-title { font-size: 15px; color: #00ffff; font-weight: 900; letter-spacing: 1px; }
      .neo-customizer-scroll { flex: 1; overflow-y: auto; padding-right: 8px; }
      .neo-customizer-section { margin-bottom: 18px; }
      .neo-section-label { display: block; font-size: 10px; color: #88ffff; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
      .neo-map-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
      .neo-map-card {
        background: rgba(255,255,255,0.03); border: 1px solid #333; border-radius: 6px;
        padding: 8px; cursor: pointer; transition: all 0.2s;
      }
      .neo-map-card.selected { border-color: #00ffff; box-shadow: 0 0 12px rgba(0,255,255,0.4); background: rgba(0,255,255,0.08); }
      .neo-map-thumb {
        height: 60px; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
      }
      .neo-map-id { font-size: 8px; color: #aaa; }
      .neo-map-name { font-size: 10px; font-weight: 900; color: #fff; margin-bottom: 2px; }
      .neo-map-desc { font-family: 'Rajdhani', sans-serif; font-size: 10px; color: #888; }
      .neo-choice-grid { display: flex; flex-direction: column; gap: 8px; }
      .neo-mode-btn {
        text-align: left; background: rgba(255,255,255,0.03); border: 1px solid #333;
        border-radius: 6px; padding: 10px 14px; cursor: pointer; color: #ccc; font-family: 'Orbitron', monospace;
      }
      .neo-mode-btn.selected {
        border-color: #ff0066; background: rgba(255,0,102,0.1); color: #fff; box-shadow: 0 0 12px rgba(255,0,102,0.3);
      }
      .neo-mode-btn strong { display: block; font-size: 11px; color: #00ffff; }
      .neo-mode-btn span { font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #aaa; }
      .neo-customizer-row { display: flex; gap: 16px; margin-bottom: 16px; }
      .neo-customizer-col { flex: 1; }
      .neo-btn-group { display: flex; gap: 6px; }
      .neo-pill-btn {
        flex: 1; padding: 7px; background: rgba(0,0,0,0.5); border: 1px solid #444; color: #aaa;
        border-radius: 4px; font-family: 'Orbitron', monospace; font-size: 9px; cursor: pointer;
      }
      .neo-pill-btn.active {
        background: #00ffff; color: #05050f; border-color: #00ffff; font-weight: 900;
      }
      .neo-customizer-footer { margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px; }
    `;
    document.head.appendChild(style);
  }
}
