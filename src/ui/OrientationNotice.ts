// src/ui/OrientationNotice.ts
// Displays a non-intrusive banner in portrait mode recommending landscape orientation during a match.

import { Localization } from '../core/Localization';
import { DeviceInfo } from '../core/DeviceInfo';

export class OrientationNotice {
  private _el: HTMLDivElement | null = null;
  private _inMatch = false;

  constructor() {
    this._injectStyles();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._checkOrientation);
      window.addEventListener('orientationchange', this._checkOrientation);
    }
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this._el) return;

    const el = document.createElement('div');
    el.id = 'neo-orientation-notice';
    el.className = 'hidden';
    el.innerHTML = `
      <div class="neo-orientation-inner">
        <span class="neo-orientation-icon">📱 ↷</span>
        <span class="neo-orientation-text">
          ${Localization.t('rotatePhoneHint') || 'Rotate your phone for the best esports experience'}
        </span>
        <button id="neo-orientation-close" class="neo-orientation-close" aria-label="Dismiss">✕</button>
      </div>
    `;

    parent.appendChild(el);
    this._el = el;

    const closeBtn = el.querySelector('#neo-orientation-close') as HTMLButtonElement | null;
    if (closeBtn) {
      closeBtn.onclick = () => {
        el.classList.add('hidden');
      };
    }

    this._checkOrientation();
  }

  public setInMatch(inMatch: boolean): void {
    this._inMatch = inMatch;
    this._checkOrientation();
  }

  private _checkOrientation = (): void => {
    if (!this._el) return;

    const isTouch = DeviceInfo.isTouchDevice();
    const isPortrait = !DeviceInfo.isLandscape();

    if (this._inMatch && isTouch && isPortrait) {
      this._el.classList.remove('hidden');
    } else {
      this._el.classList.add('hidden');
    }
  };

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._checkOrientation);
      window.removeEventListener('orientationchange', this._checkOrientation);
    }
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-orientation-styles')) return;

    const style = document.createElement('style');
    style.id = 'neo-orientation-styles';
    style.textContent = `
      #neo-orientation-notice {
        position: fixed;
        top: calc(12px + env(safe-area-inset-top, 0px));
        left: 50%;
        transform: translateX(-50%);
        z-index: 12000;
        pointer-events: auto;
        font-family: 'Orbitron', monospace;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      #neo-orientation-notice.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -15px);
      }

      .neo-orientation-inner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(13, 13, 31, 0.92);
        border: 1px solid #ffee00;
        border-radius: 20px;
        padding: 6px 14px;
        box-shadow: 0 0 20px rgba(255, 238, 0, 0.4);
        backdrop-filter: blur(8px);
        color: #ffee00;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .neo-orientation-icon {
        font-size: 14px;
        animation: rotateIcon 2.5s ease-in-out infinite;
      }

      .neo-orientation-close {
        background: none;
        border: none;
        color: #888;
        font-size: 12px;
        cursor: pointer;
        padding: 0 2px;
      }

      .neo-orientation-close:hover {
        color: #fff;
      }

      @keyframes rotateIcon {
        0%, 15% { transform: rotate(0deg); }
        40%, 65% { transform: rotate(90deg); }
        85%, 100% { transform: rotate(0deg); }
      }
    `;

    document.head.appendChild(style);
  }
}
