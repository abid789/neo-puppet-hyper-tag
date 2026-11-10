// src/ui/HUD.ts
// Premium esports HUD: Top player scoreboard with animated streak badges, round timer, and dash cooldown meter.

import type { Puppet } from '../entities/Puppet';
import type { ScoringEngine } from '../game/ScoringEngine';
import type { GameMode } from '../game/Modes/GameMode';
import { Localization } from '../core/Localization';

export class HUD {
  private _container: HTMLDivElement | null = null;
  private _timerEl: HTMLElement | null = null;
  private _dashGaugeEl: HTMLElement | null = null;
  private _dashFillEl: HTMLElement | null = null;
  private _dashTextEl: HTMLElement | null = null;

  constructor() {
    this._injectStyles();
    this._buildDOM();
  }

  private _buildDOM(): void {
    const hud = document.createElement('div');
    hud.id = 'neo-match-hud';
    hud.innerHTML = `
      <!-- Top Scoreboard Bar -->
      <div class="neo-hud-top-bar">
        <div class="neo-hud-scores-left" id="neo-hud-p0-p1"></div>

        <div class="neo-hud-center-timer">
          <div class="neo-hud-timer-digits" id="neo-hud-timer">02:00</div>
          <div class="neo-hud-timer-label" id="neo-hud-mode-badge">HUNTER POINT RUSH</div>
        </div>

        <div class="neo-hud-scores-right" id="neo-hud-p2-p3"></div>
      </div>

      <!-- Bottom Center Dash Cooldown Indicator -->
      <div class="neo-hud-dash-meter" id="neo-hud-dash">
        <div class="neo-dash-track">
          <div class="neo-dash-fill" id="neo-dash-fill"></div>
        </div>
        <div class="neo-dash-label" id="neo-dash-text">${Localization.t('dashReady')}</div>
      </div>
    `;

    document.body.appendChild(hud);
    this._container = hud;

    this._timerEl = hud.querySelector('#neo-hud-timer');
    this._dashGaugeEl = hud.querySelector('#neo-hud-dash');
    this._dashFillEl = hud.querySelector('#neo-dash-fill');
    this._dashTextEl = hud.querySelector('#neo-dash-text');
  }

  public update(
    puppets: Puppet[],
    scoring: ScoringEngine,
    timeRemaining: number,
    modeName: string,
    localPlayerIndex = 0,
    currentMode?: GameMode,
  ): void {
    // 1. Update Timer
    if (this._timerEl) {
      const mins = Math.floor(Math.max(0, timeRemaining) / 60);
      const secs = Math.floor(Math.max(0, timeRemaining) % 60);
      this._timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      if (timeRemaining <= 15.0 && timeRemaining > 0) {
        this._timerEl.classList.add('critical');
      } else {
        this._timerEl.classList.remove('critical');
      }
    }

    const modeBadge = document.querySelector('#neo-hud-mode-badge');
    if (modeBadge) {
      if (currentMode && currentMode.id === 'team_tag') {
        const teamScores = currentMode.getTeamScores?.(scoring);
        if (teamScores) {
          modeBadge.innerHTML = `<span style="color:#ff0055; font-weight:900">RED: ${teamScores.red}</span> &nbsp;|&nbsp; <span style="color:#00ffff; font-weight:900">BLUE: ${teamScores.blue}</span>`;
        } else {
          modeBadge.textContent = modeName.toUpperCase();
        }
      } else if (currentMode && currentMode.id === 'last_survivor') {
        const cullSec = currentMode.getEliminationCountdown?.();
        const cullText = cullSec !== undefined && cullSec !== null ? ` [CULL: ${Math.ceil(cullSec)}s]` : '';
        modeBadge.textContent = `${modeName.toUpperCase()}${cullText}`;
      } else {
        modeBadge.textContent = modeName.toUpperCase();
      }
    }

    // 2. Update Scores
    const leftEl = document.querySelector('#neo-hud-p0-p1');
    const rightEl = document.querySelector('#neo-hud-p2-p3');

    const renderCard = (p: Puppet) => {
      const idx = p.getPlayerIndex();
      const stats = scoring.getPlayerStats(idx);
      const score = stats ? stats.score : 0;
      const streak = stats ? stats.streak : 0;
      const hexColor = '#' + p.getColorPrimary().toString(16).padStart(6, '0');

      let badge = '';
      if (streak >= 5) {
        badge = '<span class="neo-streak-badge x2">⚡ x2.0</span>';
      } else if (streak >= 3) {
        badge = '<span class="neo-streak-badge x15">🔥 x1.5</span>';
      }

      let statusIcon = '';
      if (p.isEliminated()) {
        statusIcon = '<span class="neo-status-pill bomb" style="background:#444; color:#fff">ELIMINATED</span>';
      } else if (currentMode && currentMode.id === 'team_tag') {
        const team = currentMode.getTeam?.(idx) ?? (idx % 2 === 0 ? 'red' : 'blue');
        if (team === 'red') {
          statusIcon = '<span class="neo-status-pill it" style="background:#ff0055">RED</span>';
        } else {
          statusIcon = '<span class="neo-status-pill crown" style="background:#00ffff; color:#000">BLUE</span>';
        }
      } else if (currentMode && currentMode.id === 'infection_mode') {
        if (p.isIt()) {
          statusIcon = '<span class="neo-status-pill it" style="background:#ff0055">INFECTED</span>';
        } else {
          statusIcon = '<span class="neo-status-pill crown" style="background:#00ff88; color:#000">SURVIVOR</span>';
        }
      } else if (p.isIt()) {
        statusIcon = '<span class="neo-status-pill it">HUNTER</span>';
      } else if (p.hasCrown()) {
        statusIcon = '<span class="neo-status-pill crown">👑 CROWN</span>';
      } else if (p.getBombTimer() !== null) {
        const bTime = p.getBombTimer()!.toFixed(1);
        statusIcon = `<span class="neo-status-pill bomb">💣 ${bTime}s</span>`;
      }

      return `
        <div class="neo-hud-card ${idx === localPlayerIndex ? 'local' : ''}">
          <div class="neo-hud-avatar" style="background:${hexColor}; box-shadow:0 0 10px ${hexColor}"></div>
          <div class="neo-hud-info">
            <div class="neo-hud-pname">P${idx + 1} ${statusIcon}</div>
            <div class="neo-hud-score">${score} ${badge}</div>
          </div>
        </div>
      `;
    };

    if (leftEl) {
      leftEl.innerHTML = puppets.slice(0, 2).map(renderCard).join('');
    }
    if (rightEl) {
      rightEl.innerHTML = puppets.slice(2, 4).map(renderCard).join('');
    }

    // 3. Update Dash Cooldown Indicator for local player
    const localP = puppets[localPlayerIndex];
    if (localP && this._dashFillEl && this._dashTextEl) {
      const isDashing = localP.isDashing();
      if (isDashing) {
        this._dashFillEl.style.width = '0%';
        this._dashTextEl.textContent = Localization.t('dashCooldown');
        this._dashGaugeEl?.classList.remove('ready');
      } else {
        this._dashFillEl.style.width = '100%';
        this._dashTextEl.textContent = Localization.t('dashReady');
        this._dashGaugeEl?.classList.add('ready');
      }
    }
  }

  public setVisible(visible: boolean): void {
    if (this._container) {
      this._container.style.display = visible ? 'block' : 'none';
    }
  }

  public destroy(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-hud-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-hud-style';
    style.textContent = `
      #neo-match-hud {
        position: fixed; inset: 0; pointer-events: none; z-index: 8000;
        font-family: 'Orbitron', monospace; color: #fff;
      }
      .neo-hud-top-bar {
        position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
        width: 95%; max-width: 1200px; display: flex; justify-content: space-between; align-items: center;
      }
      .neo-hud-scores-left, .neo-hud-scores-right {
        display: flex; gap: 12px;
      }
      .neo-hud-card {
        display: flex; align-items: center; gap: 10px;
        background: rgba(13, 13, 31, 0.85); border: 1px solid rgba(0, 255, 255, 0.25);
        border-radius: 6px; padding: 6px 14px; backdrop-filter: blur(8px);
        min-width: 130px;
      }
      .neo-hud-card.local {
        border-color: #00ffff; box-shadow: 0 0 15px rgba(0,255,255,0.25);
      }
      .neo-hud-avatar {
        width: 22px; height: 22px; border-radius: 50%; border: 1px solid #fff;
      }
      .neo-hud-pname { font-size: 10px; color: #aaa; display: flex; align-items: center; gap: 4px; }
      .neo-hud-score { font-size: 16px; font-weight: 900; color: #fff; display: flex; align-items: center; gap: 6px; }
      .neo-streak-badge {
        font-size: 9px; padding: 2px 5px; border-radius: 3px; font-weight: bold;
      }
      .neo-streak-badge.x15 { background: #ff6600; color: #fff; }
      .neo-streak-badge.x2 { background: #ff0066; color: #fff; animation: pulse 0.8s infinite; }
      .neo-status-pill {
        font-size: 8px; padding: 1px 4px; border-radius: 2px; font-weight: 900;
      }
      .neo-status-pill.it { background: #ff0066; color: #fff; }
      .neo-status-pill.crown { background: #ffee00; color: #000; }
      .neo-status-pill.bomb { background: #ff3300; color: #fff; animation: blink 0.5s infinite; }

      .neo-hud-center-timer {
        text-align: center; background: rgba(5,5,15,0.85); border: 1px solid rgba(0,255,255,0.4);
        border-radius: 8px; padding: 6px 20px; backdrop-filter: blur(10px);
      }
      .neo-hud-timer-digits {
        font-size: 26px; font-weight: 900; color: #00ffff; letter-spacing: 2px;
      }
      .neo-hud-timer-digits.critical {
        color: #ff0066; text-shadow: 0 0 15px #ff0066; animation: timerShake 0.4s infinite;
      }
      .neo-hud-timer-label {
        font-family: 'Rajdhani', sans-serif; font-size: 10px; color: #88ffff; letter-spacing: 1px;
      }
      @keyframes timerShake {
        0%, 100% { transform: scale(1.0); }
        50% { transform: scale(1.08); }
      }

      /* Dash Meter */
      .neo-hud-dash-meter {
        position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(13, 13, 31, 0.9); border: 1px solid rgba(0,255,255,0.3);
        border-radius: 20px; padding: 6px 20px; display: flex; flex-direction: column; align-items: center; gap: 4px;
        backdrop-filter: blur(8px);
      }
      .neo-dash-track {
        width: 120px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;
      }
      .neo-dash-fill {
        width: 100%; height: 100%; background: #00ffff; border-radius: 3px; transition: width 0.15s ease-out;
      }
      .neo-hud-dash-meter.ready {
        border-color: #00ffff; box-shadow: 0 0 15px rgba(0,255,255,0.4);
      }
      .neo-dash-label {
        font-size: 9px; font-weight: bold; color: #00ffff; letter-spacing: 1px;
      }
    `;
    document.head.appendChild(style);
  }
}
