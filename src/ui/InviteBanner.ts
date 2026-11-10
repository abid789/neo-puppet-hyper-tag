// src/ui/InviteBanner.ts
// Glassmorphism notification banner with countdown timer for incoming game invites.

import type { GameInvite } from '../network/InviteSystem';

export class InviteBanner {
  private _container: HTMLDivElement | null = null;
  private _timerId: number | null = null;

  public show(
    invite: GameInvite,
    onAccept: (invite: GameInvite) => void,
    onDecline: (invite: GameInvite) => void,
  ): void {
    this.dismiss();

    const banner = document.createElement('div');
    banner.id = 'neo-invite-banner';
    banner.innerHTML = `
      <div class="neo-invite-glow"></div>
      <div class="neo-invite-content">
        <div class="neo-invite-icon">⚡</div>
        <div class="neo-invite-text">
          <div class="neo-invite-sender">${invite.fromName}</div>
          <div class="neo-invite-desc">invited you to play <strong>${invite.modeName}</strong> on <em>${invite.mapName}</em>!</div>
        </div>
        <div class="neo-invite-actions">
          <button id="neo-invite-accept" class="neo-btn-accept">ACCEPT & JOIN</button>
          <button id="neo-invite-decline" class="neo-btn-decline">DECLINE</button>
        </div>
      </div>
      <div class="neo-invite-timer-bar"><div class="neo-invite-timer-fill"></div></div>
    `;

    // Ensure CSS styles
    this._injectStyles();
    document.body.appendChild(banner);
    this._container = banner;

    const acceptBtn = banner.querySelector('#neo-invite-accept') as HTMLButtonElement;
    const declineBtn = banner.querySelector('#neo-invite-decline') as HTMLButtonElement;

    acceptBtn.onclick = () => {
      this.dismiss();
      onAccept(invite);
    };

    declineBtn.onclick = () => {
      this.dismiss();
      onDecline(invite);
    };

    // Auto-dismiss after 60 seconds
    const elapsed = Date.now() - invite.timestamp;
    const remaining = Math.max(1000, 60000 - elapsed);
    this._timerId = window.setTimeout(() => {
      this.dismiss();
      onDecline(invite);
    }, remaining);
  }

  public dismiss(): void {
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-invite-banner-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-invite-banner-style';
    style.textContent = `
      #neo-invite-banner {
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        z-index: 9999; width: 440px; max-width: 92vw;
        background: rgba(13, 13, 31, 0.94);
        border: 1px solid #00ffff; border-radius: 8px;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.4);
        backdrop-filter: blur(12px); font-family: 'Orbitron', monospace;
        color: #fff; overflow: hidden; animation: neoSlideDown 0.35s ease-out;
      }
      @keyframes neoSlideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .neo-invite-content {
        display: flex; align-items: center; padding: 14px 18px; gap: 14px;
      }
      .neo-invite-icon {
        font-size: 26px; color: #ffee00; text-shadow: 0 0 10px #ffee00;
      }
      .neo-invite-text { flex: 1; }
      .neo-invite-sender {
        font-size: 13px; font-weight: 900; color: #00ffff; letter-spacing: 1px;
      }
      .neo-invite-desc {
        font-family: 'Rajdhani', sans-serif; font-size: 13px; color: #ccc; margin-top: 2px;
      }
      .neo-invite-desc strong { color: #ff0066; }
      .neo-invite-desc em { color: #00ff88; font-style: normal; }
      .neo-invite-actions { display: flex; flex-direction: column; gap: 6px; }
      .neo-btn-accept {
        background: #00ffff; color: #05050f; border: none; border-radius: 4px;
        padding: 6px 14px; font-family: 'Orbitron', monospace; font-size: 10px;
        font-weight: 900; cursor: pointer; transition: all 0.2s;
      }
      .neo-btn-accept:hover { background: #88ffff; box-shadow: 0 0 10px #00ffff; }
      .neo-btn-decline {
        background: rgba(255,255,255,0.08); color: #aaa; border: 1px solid #444;
        border-radius: 4px; padding: 5px 12px; font-family: 'Orbitron', monospace;
        font-size: 9px; cursor: pointer; transition: all 0.2s;
      }
      .neo-btn-decline:hover { background: rgba(255,0,102,0.25); color: #ff0066; border-color: #ff0066; }
      .neo-invite-timer-bar {
        width: 100%; height: 3px; background: rgba(255,255,255,0.1);
      }
      .neo-invite-timer-fill {
        height: 100%; background: #00ffff;
        animation: neoDrain 60s linear forwards;
      }
      @keyframes neoDrain {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }
}
