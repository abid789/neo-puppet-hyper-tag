// src/ui/PodiumScreen.ts
// End-of-match victory podium with MVP accolades (Apex Hunter, Untouchable, Ankle Breaker) and victory fanfare.

import { Localization } from '../core/Localization';
import { SoundEngine } from '../audio/SoundEngine';

export interface PodiumResultItem {
  playerIndex: number;
  name:        string;
  score:       number;
  color:       string;
  tagsMade:    number;
  taggedCount: number;
  nearMisses:  number;
}

export class PodiumScreen {
  private _container: HTMLDivElement | null = null;
  private _onPlayAgainCb: (() => void) | null = null;
  private _onLobbyCb: (() => void) | null = null;

  constructor() {
    this._injectStyles();
  }

  public setCallbacks(onPlayAgain: () => void, onLobby: () => void): void {
    this._onPlayAgainCb = onPlayAgain;
    this._onLobbyCb = onLobby;
  }

  public show(results: PodiumResultItem[]): void {
    this.hide();

    // Play victory fanfare SFX
    SoundEngine.getInstance().playVictoryFanfare();

    // Sort descending by score
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const first  = sorted[0];
    const second = sorted[1];
    const third  = sorted[2];

    // MVP Accolades calculation
    const apex = [...results].sort((a, b) => b.tagsMade - a.tagsMade)[0];
    const untouch = [...results].sort((a, b) => a.taggedCount - b.taggedCount)[0];
    const ankle = [...results].sort((a, b) => b.nearMisses - a.nearMisses)[0];

    const screen = document.createElement('div');
    screen.id = 'neo-podium-screen';
    screen.innerHTML = `
      <div class="neo-podium-header">
        <h1 class="neo-podium-title">🏆 ${Localization.t('matchFinished')}</h1>
        <p class="neo-podium-sub">${Localization.t('champion')}: <strong>${first ? first.name : 'PILOT 1'}</strong></p>
      </div>

      <!-- 3-Tier Podium -->
      <div class="neo-podium-stage">
        <!-- 2nd Place -->
        ${second ? `
          <div class="neo-podium-stand second">
            <div class="neo-podium-avatar" style="background:${second.color}; box-shadow:0 0 20px ${second.color}"></div>
            <div class="neo-podium-pname">${second.name}</div>
            <div class="neo-podium-score">${second.score} ${Localization.t('score')}</div>
            <div class="neo-podium-block">2ND</div>
          </div>
        ` : ''}

        <!-- 1st Place (Center & Highest) -->
        ${first ? `
          <div class="neo-podium-stand first">
            <div class="neo-podium-crown">👑</div>
            <div class="neo-podium-avatar" style="background:${first.color}; box-shadow:0 0 30px ${first.color}"></div>
            <div class="neo-podium-pname">${first.name}</div>
            <div class="neo-podium-score">${first.score} ${Localization.t('score')}</div>
            <div class="neo-podium-block">1ST</div>
          </div>
        ` : ''}

        <!-- 3rd Place -->
        ${third ? `
          <div class="neo-podium-stand third">
            <div class="neo-podium-avatar" style="background:${third.color}; box-shadow:0 0 15px ${third.color}"></div>
            <div class="neo-podium-pname">${third.name}</div>
            <div class="neo-podium-score">${third.score} ${Localization.t('score')}</div>
            <div class="neo-podium-block">3RD</div>
          </div>
        ` : ''}
      </div>

      <!-- MVP Titles Accordion -->
      <div class="neo-podium-mvps">
        ${apex && apex.tagsMade > 0 ? `
          <div class="neo-mvp-badge">${Localization.t('mvpTitleApex')}: <span>${apex.name} (${apex.tagsMade})</span></div>
        ` : ''}
        ${untouch ? `
          <div class="neo-mvp-badge">${Localization.t('mvpTitleUntouch')}: <span>${untouch.name} (${untouch.taggedCount} tags)</span></div>
        ` : ''}
        ${ankle && ankle.nearMisses > 0 ? `
          <div class="neo-mvp-badge">${Localization.t('mvpTitleAnkle')}: <span>${ankle.name} (${ankle.nearMisses} dodges)</span></div>
        ` : ''}
      </div>

      <!-- Action Footer -->
      <div class="neo-podium-footer">
        <button id="neo-podium-lobby" class="neo-btn-secondary">${Localization.t('backToMenu')}</button>
        <button id="neo-podium-again" class="neo-btn-primary">▶ ${Localization.t('playAgain')}</button>
      </div>
    `;

    document.body.appendChild(screen);
    this._container = screen;

    const againBtn = screen.querySelector('#neo-podium-again') as HTMLButtonElement;
    againBtn.onclick = () => {
      this.hide();
      if (this._onPlayAgainCb) this._onPlayAgainCb();
    };

    const lobbyBtn = screen.querySelector('#neo-podium-lobby') as HTMLButtonElement;
    lobbyBtn.onclick = () => {
      this.hide();
      if (this._onLobbyCb) this._onLobbyCb();
    };
  }

  public hide(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-podium-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-podium-style';
    style.textContent = `
      #neo-podium-screen {
        position: fixed; inset: 0; z-index: 11000;
        background: radial-gradient(circle at center, rgba(13,13,31,0.96) 0%, rgba(5,5,15,0.99) 100%);
        backdrop-filter: blur(14px); font-family: 'Orbitron', monospace; color: #fff;
        display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 40px;
        animation: neoFadeIn 0.5s ease-out;
      }
      @keyframes neoFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .neo-podium-header { text-align: center; }
      .neo-podium-title { font-size: 26px; color: #ffee00; text-shadow: 0 0 20px #ffee00; font-weight: 900; letter-spacing: 2px; }
      .neo-podium-sub { font-family: 'Rajdhani', sans-serif; font-size: 16px; color: #aaa; margin-top: 6px; }
      .neo-podium-sub strong { color: #00ffff; }
      .neo-podium-stage {
        display: flex; align-items: flex-end; justify-content: center; gap: 20px; width: 100%; max-width: 700px;
      }
      .neo-podium-stand {
        flex: 1; display: flex; flex-direction: column; align-items: center;
      }
      .neo-podium-crown { font-size: 32px; animation: floatPedestal 2s infinite ease-in-out; margin-bottom: -10px; z-index: 2; }
      .neo-podium-avatar {
        width: 50px; height: 50px; border-radius: 50%; border: 2px solid #fff; margin-bottom: 10px;
      }
      .neo-podium-pname { font-size: 12px; font-weight: 900; color: #fff; margin-bottom: 2px; }
      .neo-podium-score { font-size: 11px; color: #88ffff; margin-bottom: 12px; }
      .neo-podium-block {
        width: 100%; border: 1px solid rgba(0,255,255,0.3); border-radius: 6px 6px 0 0;
        display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900;
        background: rgba(255,255,255,0.04);
      }
      .neo-podium-stand.first .neo-podium-block {
        height: 160px; background: linear-gradient(to top, rgba(255,238,0,0.15), rgba(255,238,0,0.3));
        border-color: #ffee00; color: #ffee00; text-shadow: 0 0 15px #ffee00;
      }
      .neo-podium-stand.second .neo-podium-block {
        height: 110px; background: linear-gradient(to top, rgba(0,255,255,0.1), rgba(0,255,255,0.25));
        border-color: #00ffff; color: #00ffff;
      }
      .neo-podium-stand.third .neo-podium-block {
        height: 80px; background: linear-gradient(to top, rgba(255,0,102,0.1), rgba(255,0,102,0.25));
        border-color: #ff0066; color: #ff0066;
      }
      .neo-podium-mvps {
        display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 500px;
      }
      .neo-mvp-badge {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.2);
        padding: 8px 14px; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between;
      }
      .neo-mvp-badge span { color: #00ffff; font-weight: bold; }
      .neo-podium-footer { display: flex; gap: 16px; }
    `;
    document.head.appendChild(style);
  }
}
