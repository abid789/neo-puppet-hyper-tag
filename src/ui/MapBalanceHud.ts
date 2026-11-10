// src/ui/MapBalanceHud.ts
// Debug-only overlay toggled with F4 displaying per-map win counts and spawn side distribution.

import { MatchRecapManager } from '../game/MatchRecap';

export class MapBalanceHud {
  private _container: HTMLDivElement | null = null;
  private _visible = false;

  constructor() {
    this._injectStyles();
    window.addEventListener('keydown', this._onKeyDown);
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'F4') {
      e.preventDefault();
      this.toggle();
    }
  };

  public toggle(): void {
    this._visible = !this._visible;
    if (this._visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  public show(): void {
    this.hide();
    this._visible = true;

    const stats = MatchRecapManager.getInstance().getMapStats();
    const mapKeys = Object.keys(stats);

    const hud = document.createElement('div');
    hud.id = 'neo-map-balance-hud';
    hud.innerHTML = `
      <div class="neo-map-balance-header">
        <div class="neo-map-balance-title">⚖ MAP BALANCE & SPAWN METRICS (F4)</div>
        <button id="neo-map-balance-close" class="neo-btn-icon">✕</button>
      </div>
      <div class="neo-map-balance-body">
        ${mapKeys.length === 0 ? `
          <div class="neo-map-balance-empty">NO LOCAL MATCHES RECORDED YET.<br>PLAY A ROUND TO LOG SPAWN WIN RATES.</div>
        ` : `
          <table class="neo-balance-table">
            <thead>
              <tr>
                <th>MAP ID</th>
                <th>MATCHES</th>
                <th>LEFT SPAWN (X < 0)</th>
                <th>RIGHT SPAWN (X ≥ 0)</th>
                <th>BIAS RATING</th>
              </tr>
            </thead>
            <tbody>
              ${mapKeys.map(id => {
                const s = stats[id];
                const leftPct = s.totalMatches > 0 ? Math.round((s.leftSpawnWins / s.totalMatches) * 100) : 50;
                const rightPct = 100 - leftPct;
                const diff = Math.abs(leftPct - rightPct);
                const biasClass = diff > 30 ? 'high-bias' : diff > 15 ? 'med-bias' : 'balanced';
                const biasText = diff <= 15 ? 'BALANCED' : leftPct > rightPct ? 'LEFT BIASED' : 'RIGHT BIASED';

                return `
                  <tr>
                    <td class="map-name">${id}</td>
                    <td>${s.totalMatches}</td>
                    <td><span class="side-stat left">${s.leftSpawnWins} (${leftPct}%)</span></td>
                    <td><span class="side-stat right">${s.rightSpawnWins} (${rightPct}%)</span></td>
                    <td><span class="bias-pill ${biasClass}">${biasText}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    document.body.appendChild(hud);
    this._container = hud;

    const closeBtn = hud.querySelector('#neo-map-balance-close') as HTMLElement;
    closeBtn.onclick = () => this.hide();
  }

  public hide(): void {
    this._visible = false;
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this._onKeyDown);
    this.hide();
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-map-balance-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-map-balance-style';
    style.textContent = `
      #neo-map-balance-hud {
        position: fixed; top: 30px; right: 30px; width: 560px; max-width: 90vw;
        background: rgba(10, 10, 24, 0.95); border: 1px solid #ffee00;
        border-radius: 8px; padding: 16px; z-index: 15000;
        font-family: 'Orbitron', monospace; color: #fff;
        box-shadow: 0 0 30px rgba(255, 238, 0, 0.3); backdrop-filter: blur(12px);
      }
      .neo-map-balance-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
        border-bottom: 1px solid rgba(255, 238, 0, 0.3); padding-bottom: 8px;
      }
      .neo-map-balance-title { font-size: 13px; font-weight: 900; color: #ffee00; letter-spacing: 1px; }
      .neo-balance-table { width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; }
      .neo-balance-table th { color: #88ffff; padding: 6px 8px; border-bottom: 1px solid #333; }
      .neo-balance-table td { padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .map-name { color: #00ffff; font-weight: bold; }
      .side-stat.left { color: #00ff88; }
      .side-stat.right { color: #ff00ff; }
      .bias-pill { font-size: 8px; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
      .bias-pill.balanced { background: rgba(0,255,136,0.2); color: #00ff88; }
      .bias-pill.med-bias { background: rgba(255,170,0,0.2); color: #ffaa00; }
      .bias-pill.high-bias { background: rgba(255,0,85,0.2); color: #ff0055; }
      .neo-map-balance-empty { padding: 20px; text-align: center; color: #888; font-size: 11px; line-height: 1.6; }
    `;
    document.head.appendChild(style);
  }
}
