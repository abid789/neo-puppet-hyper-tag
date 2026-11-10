// src/ui/SessionHistoryScreen.ts
// "Today's Matches" screen: Chronological match log and head-to-head pair rivalry matrix.

import { SessionHistory } from '../game/SessionHistory';
import { Localization } from '../core/Localization';

export class SessionHistoryScreen {
  private _container: HTMLDivElement | null = null;
  private readonly _session: SessionHistory;

  constructor(session: SessionHistory = SessionHistory.getInstance()) {
    this._session = session;
    this._injectStyles();
  }

  public show(): void {
    this.hide();

    const matches = this._session.getTodayMatches();
    const pairs = this._session.getPairSummaries();
    const sessionKey = SessionHistory.getTodaySessionKey();

    const modal = document.createElement('div');
    modal.id = 'neo-session-history-modal';
    modal.innerHTML = `
      <div class="neo-session-backdrop"></div>
      <div class="neo-session-panel">
        <div class="neo-session-header">
          <div>
            <h2 class="neo-session-title">📅 ${Localization.t('todayMatches')}</h2>
            <div class="neo-session-sub">${sessionKey} // ${matches.length} matches recorded</div>
          </div>
          <button id="neo-session-close" class="neo-btn-icon">✕</button>
        </div>

        <div class="neo-session-scroll">
          <!-- 1. Rivalry Matrix / Per-Pair Summary -->
          <div class="neo-session-section">
            <h3 class="neo-session-section-title">⚖ ${Localization.t('rivalryMatrix')}</h3>
            ${pairs.length === 0 ? `
              <div class="neo-session-empty">No shared multiplayer games recorded today yet.</div>
            ` : `
              <div class="neo-pair-grid">
                ${pairs.map(p => `
                  <div class="neo-pair-card">
                    <div class="neo-pair-names">
                      <strong>${p.playerA}</strong> <span class="vs-text">VS</span> <strong>${p.playerB}</strong>
                    </div>
                    <div class="neo-pair-stats">
                      <span>Shared: <strong>${p.sharedGames}</strong></span>
                      <span>Score: <strong style="color:#00ffff">${p.winsA}</strong> - <strong style="color:#ff00aa">${p.winsB}</strong></span>
                      ${p.ties > 0 ? `<span>(Ties: ${p.ties})</span>` : ''}
                    </div>
                    <div class="neo-pair-leader">
                      ${p.leader === 'TIED' ? `
                        <span class="leader-badge tied">⚖ TIED</span>
                      ` : `
                        <span class="leader-badge champ">🏆 LEADER: ${p.leader}</span>
                      `}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- 2. Match Log -->
          <div class="neo-session-section" style="margin-top: 18px;">
            <h3 class="neo-session-section-title">📜 TODAY'S MATCH LOG</h3>
            ${matches.length === 0 ? `
              <div class="neo-session-empty">No matches played today yet. Start a match to log results!</div>
            ` : `
              <div class="neo-match-log-list">
                ${[...matches].reverse().map(m => `
                  <div class="neo-match-log-card">
                    <div class="neo-match-log-head">
                      <div class="neo-match-title">
                        <span class="match-time">${m.timeFormatted}</span>
                        <strong class="match-map">${m.mapName}</strong>
                        <span class="match-mode">${m.modeName}</span>
                      </div>
                      <div class="neo-match-champ">
                        🏆 <span style="color:${m.winnerColor}; font-weight:bold;">${m.winnerName}</span> (${m.winnerScore} pts)
                      </div>
                    </div>
                    <div class="neo-match-roster">
                      ${m.players.map(p => `
                        <div class="neo-match-player-chip">
                          <span class="chip-color" style="background:${p.color}"></span>
                          <span class="chip-name">${p.name}</span>
                          <span class="chip-score">${p.score} pts</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <div class="neo-session-footer">
          <button id="neo-session-btn-close" class="neo-btn-primary">✕ CLOSE</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._container = modal;

    const closeBtn = modal.querySelector('#neo-session-close') as HTMLButtonElement;
    closeBtn.onclick = () => this.hide();

    const bottomClose = modal.querySelector('#neo-session-btn-close') as HTMLButtonElement;
    bottomClose.onclick = () => this.hide();
  }

  public hide(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-session-history-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-session-history-style';
    style.textContent = `
      #neo-session-history-modal {
        position: fixed; inset: 0; z-index: 12500;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Orbitron', monospace; color: #fff;
      }
      .neo-session-backdrop {
        position: absolute; inset: 0; background: rgba(5,5,15,0.88); backdrop-filter: blur(10px);
      }
      .neo-session-panel {
        position: relative; width: 720px; max-width: 95vw; max-height: 88vh;
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff;
        border-radius: 8px; padding: 22px; box-shadow: 0 0 35px rgba(0,255,255,0.25);
        display: flex; flex-direction: column;
      }
      .neo-session-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
        border-bottom: 1px solid rgba(0,255,255,0.2); padding-bottom: 10px;
      }
      .neo-session-title { font-size: 16px; color: #00ffff; font-weight: 900; letter-spacing: 1px; margin: 0; }
      .neo-session-sub { font-size: 11px; color: #aaa; font-family: 'Rajdhani', sans-serif; margin-top: 2px; }
      .neo-session-scroll { flex: 1; overflow-y: auto; padding-right: 6px; }
      .neo-session-section-title {
        font-size: 11px; color: #88ffff; letter-spacing: 1px; margin-bottom: 8px; font-weight: bold;
      }
      .neo-session-empty {
        font-size: 11px; color: #666; font-family: 'Rajdhani', sans-serif; padding: 12px;
        background: rgba(255,255,255,0.02); border-radius: 4px; text-align: center;
      }
      .neo-pair-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px;
      }
      .neo-pair-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
        padding: 10px; display: flex; flex-direction: column; gap: 4px;
      }
      .neo-pair-names { font-size: 11px; }
      .neo-pair-names strong { color: #fff; }
      .neo-pair-names .vs-text { color: #888; font-size: 9px; margin: 0 4px; }
      .neo-pair-stats { font-family: 'Rajdhani', sans-serif; font-size: 12px; color: #ccc; display: flex; gap: 8px; }
      .neo-pair-leader { margin-top: 4px; }
      .leader-badge { font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px; }
      .leader-badge.champ { background: rgba(0,255,136,0.15); color: #00ff88; border: 1px solid #00ff88; }
      .leader-badge.tied { background: rgba(255,238,0,0.12); color: #ffee00; border: 1px solid #ffee00; }
      .neo-match-log-list { display: flex; flex-direction: column; gap: 8px; }
      .neo-match-log-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.15); border-radius: 6px;
        padding: 10px 14px; display: flex; flex-direction: column; gap: 6px;
      }
      .neo-match-log-head { display: flex; justify-content: space-between; align-items: center; }
      .neo-match-title { display: flex; align-items: center; gap: 8px; font-size: 11px; }
      .match-time { color: #666; font-size: 9px; }
      .match-map { color: #00ffff; }
      .match-mode { color: #ff00aa; font-family: 'Rajdhani', sans-serif; font-size: 11px; }
      .neo-match-champ { font-size: 11px; }
      .neo-match-roster { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
      .neo-match-player-chip {
        display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4);
        padding: 2px 8px; border-radius: 12px; font-size: 10px; font-family: 'Rajdhani', sans-serif;
      }
      .chip-color { width: 8px; height: 8px; border-radius: 50%; }
      .chip-name { color: #ccc; font-weight: bold; }
      .chip-score { color: #88ffff; }
      .neo-session-footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); }
    `;
    document.head.appendChild(style);
  }
}
