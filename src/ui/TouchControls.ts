// src/ui/TouchControls.ts
// On-screen dual-thumb mobile control HUD for NEO-PUPPET: HYPER TAG.
// Features sliding Left/Right directional buttons, variable-height Jump, Tag/Grapple attack,
// Fast-Fall down button, and a dynamic circular Dash cooldown ring with haptic feedback.

import { InputManager } from '../core/InputManager';

export class TouchControls {
  private _container: HTMLDivElement | null = null;
  private _visible = false;
  private readonly _input: InputManager;

  // DOM element references
  private _btnLeft: HTMLElement | null = null;
  private _btnRight: HTMLElement | null = null;
  private _btnFastFall: HTMLElement | null = null;
  private _btnJump: HTMLElement | null = null;
  private _btnDash: HTMLElement | null = null;
  private _btnAttack: HTMLElement | null = null;
  private _dashRingCircle: SVGCircleElement | null = null;

  // Track active pointer IDs for sliding support
  private _leftZonePointerId: number | null = null;

  constructor(inputManager = InputManager.getInstance()) {
    this._input = inputManager;
    this._injectStyles();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this._container) return;

    const el = document.createElement('div');
    el.id = 'neo-touch-controls-container';
    el.className = 'hidden';
    el.innerHTML = `
      <!-- Left Thumb Zone: Directional Slider & Fast-Fall -->
      <div class="neo-touch-zone neo-touch-zone-left">
        <button id="touch-btn-fastfall" class="neo-touch-btn neo-touch-btn-small" aria-label="Fast Fall">
          <span class="neo-touch-icon">▼</span>
          <span class="neo-touch-label">FALL</span>
        </button>

        <div class="neo-touch-dpad-row" id="neo-touch-dpad-slider">
          <button id="touch-btn-left" class="neo-touch-btn neo-touch-btn-large" aria-label="Move Left">
            <span class="neo-touch-icon">◀</span>
          </button>
          <button id="touch-btn-right" class="neo-touch-btn neo-touch-btn-large" aria-label="Move Right">
            <span class="neo-touch-icon">▶</span>
          </button>
        </div>
      </div>

      <!-- Right Thumb Zone: Jump, Dash (with Cooldown Ring), Grapple/Tag -->
      <div class="neo-touch-zone neo-touch-zone-right">
        <!-- Tag / Shove / Grapple Button -->
        <button id="touch-btn-attack" class="neo-touch-btn neo-touch-btn-action neo-touch-attack" aria-label="Tag Attack">
          <span class="neo-touch-icon">💥</span>
          <span class="neo-touch-label">TAG</span>
        </button>

        <!-- Dash Button with Circular SVG Cooldown Ring -->
        <div class="neo-touch-dash-wrapper">
          <svg class="neo-dash-cooldown-svg" viewBox="0 0 76 76">
            <circle class="neo-dash-cooldown-bg" cx="38" cy="38" r="34" />
            <circle id="neo-touch-dash-ring" class="neo-dash-cooldown-fill" cx="38" cy="38" r="34" />
          </svg>
          <button id="touch-btn-dash" class="neo-touch-btn neo-touch-btn-action neo-touch-dash" aria-label="Air Dash">
            <span class="neo-touch-icon">⚡</span>
            <span class="neo-touch-label">DASH</span>
          </button>
        </div>

        <!-- Jump Button (supports tap or hold for variable jump height) -->
        <button id="touch-btn-jump" class="neo-touch-btn neo-touch-btn-action neo-touch-jump" aria-label="Jump">
          <span class="neo-touch-icon">▲</span>
          <span class="neo-touch-label">JUMP</span>
        </button>
      </div>
    `;

    parent.appendChild(el);
    this._container = el;

    this._cacheElements();
    this._bindEvents();
  }

  private _cacheElements(): void {
    if (!this._container) return;
    this._btnLeft = this._container.querySelector('#touch-btn-left');
    this._btnRight = this._container.querySelector('#touch-btn-right');
    this._btnFastFall = this._container.querySelector('#touch-btn-fastfall');
    this._btnJump = this._container.querySelector('#touch-btn-jump');
    this._btnDash = this._container.querySelector('#touch-btn-dash');
    this._btnAttack = this._container.querySelector('#touch-btn-attack');
    this._dashRingCircle = this._container.querySelector('#neo-touch-dash-ring');
  }

  private _vibrate(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        /* noop */
      }
    }
  }

  private _bindEvents(): void {
    if (!this._container) return;

    // ── Directional Slider Zone (Pointer tracking for holding & sliding between Left & Right) ──
    const dpadRow = this._container.querySelector('#neo-touch-dpad-slider') as HTMLElement;
    if (dpadRow) {
      const handleDirectionFromPoint = (x: number, y: number): void => {
        const target = document.elementFromPoint(x, y);
        const isLeft = Boolean(this._btnLeft && (this._btnLeft === target || this._btnLeft.contains(target)));
        const isRight = Boolean(this._btnRight && (this._btnRight === target || this._btnRight.contains(target)));

        this._input.setTouchAction('moveLeft', isLeft);
        this._input.setTouchAction('moveRight', isRight);

        if (this._btnLeft) this._btnLeft.classList.toggle('pressed', isLeft);
        if (this._btnRight) this._btnRight.classList.toggle('pressed', isRight);
      };

      dpadRow.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this._leftZonePointerId = e.pointerId;
        dpadRow.setPointerCapture(e.pointerId);
        this._vibrate();
        handleDirectionFromPoint(e.clientX, e.clientY);
      });

      dpadRow.addEventListener('pointermove', (e: PointerEvent) => {
        if (this._leftZonePointerId === e.pointerId) {
          e.preventDefault();
          e.stopPropagation();
          handleDirectionFromPoint(e.clientX, e.clientY);
        }
      });

      const releaseDpad = (e: PointerEvent) => {
        if (this._leftZonePointerId === e.pointerId) {
          e.preventDefault();
          e.stopPropagation();
          this._leftZonePointerId = null;
          try {
            dpadRow.releasePointerCapture(e.pointerId);
          } catch {
            /* noop */
          }
          this._input.setTouchAction('moveLeft', false);
          this._input.setTouchAction('moveRight', false);
          if (this._btnLeft) this._btnLeft.classList.remove('pressed');
          if (this._btnRight) this._btnRight.classList.remove('pressed');
        }
      };

      dpadRow.addEventListener('pointerup', releaseDpad);
      dpadRow.addEventListener('pointercancel', releaseDpad);
    }

    // ── Fast-Fall (Down button) ───────────────────────────────────────────────
    if (this._btnFastFall) {
      this._bindSingleButton(this._btnFastFall, 'fastFall');
    }

    // ── Jump Button (Supports hold for variable height) ────────────────────────
    if (this._btnJump) {
      this._bindSingleButton(this._btnJump, 'jump');
    }

    // ── Dash Button ───────────────────────────────────────────────────────────
    if (this._btnDash) {
      this._bindSingleButton(this._btnDash, 'dash');
    }

    // ── Tag Attack / Shove Button ─────────────────────────────────────────────
    if (this._btnAttack) {
      this._bindSingleButton(this._btnAttack, 'attack');
    }

    // Prevent default context menu and gestures on controls container
    this._container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private _bindSingleButton(btn: HTMLElement, action: 'jump' | 'dash' | 'attack' | 'fastFall'): void {
    let pointerId: number | null = null;

    btn.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pointerId = e.pointerId;
      btn.setPointerCapture(e.pointerId);
      btn.classList.add('pressed');
      this._vibrate();
      this._input.setTouchAction(action, true);
    });

    const release = (e: PointerEvent) => {
      if (pointerId === e.pointerId) {
        e.preventDefault();
        e.stopPropagation();
        pointerId = null;
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        btn.classList.remove('pressed');
        this._input.setTouchAction(action, false);
      }
    };

    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  }

  public setVisible(visible: boolean): void {
    this._visible = visible;
    if (this._container) {
      if (visible) {
        this._container.classList.remove('hidden');
      } else {
        this._container.classList.add('hidden');
        this._input.clearTouchState();
      }
    }
  }

  public get isVisible(): boolean {
    return this._visible;
  }

  /**
   * Updates the circular dash cooldown ring progress.
   * @param fraction 0.0 (just used, cooling down) to 1.0 (fully recharged and ready).
   * @param isReady true if dash is immediately available.
   */
  public updateDashCooldown(fraction: number, isReady: boolean): void {
    if (!this._dashRingCircle) return;

    // Circumference for r=34 is 2 * PI * 34 ≈ 213.63
    const circumference = 213.63;
    const clamped = Math.max(0, Math.min(1.0, fraction));
    const offset = circumference * (1.0 - clamped);

    this._dashRingCircle.style.strokeDashoffset = `${offset}`;

    if (this._btnDash) {
      this._btnDash.classList.toggle('ready', isReady);
    }
  }

  public destroy(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
    this._input.clearTouchState();
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-touch-controls-styles')) return;

    const style = document.createElement('style');
    style.id = 'neo-touch-controls-styles';
    style.textContent = `
      #neo-touch-controls-container {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        height: 38%;
        max-height: 280px;
        z-index: 9999;
        pointer-events: none;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-left: calc(16px + env(safe-area-inset-left, 0px));
        padding-right: calc(16px + env(safe-area-inset-right, 0px));
        padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
        box-sizing: border-box;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        transition: opacity 0.25s ease-out;
      }

      #neo-touch-controls-container.hidden {
        opacity: 0;
        pointer-events: none !important;
      }

      .neo-touch-zone {
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .neo-touch-zone-left {
        align-items: flex-start;
      }

      .neo-touch-zone-right {
        position: relative;
        width: 190px;
        height: 170px;
      }

      /* Directional D-Pad Row */
      .neo-touch-dpad-row {
        display: flex;
        gap: 10px;
        background: rgba(0, 255, 255, 0.04);
        border: 1px solid rgba(0, 255, 255, 0.18);
        border-radius: 40px;
        padding: 5px;
        backdrop-filter: blur(4px);
      }

      /* Base Buttons: At least 64px for touch accessibility */
      .neo-touch-btn {
        min-width: 68px;
        min-height: 68px;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, rgba(13, 20, 45, 0.85) 0%, rgba(5, 8, 20, 0.95) 100%);
        border: 2px solid rgba(0, 255, 255, 0.4);
        color: #00ffff;
        font-family: 'Orbitron', monospace;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2), inset 0 0 8px rgba(0, 255, 255, 0.15);
        cursor: pointer;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 0.08s ease, border-color 0.1s ease, box-shadow 0.1s ease;
      }

      .neo-touch-btn.pressed {
        transform: scale(0.92);
        background: rgba(0, 255, 255, 0.25);
        border-color: #00ffff;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.6), inset 0 0 14px rgba(0, 255, 255, 0.4);
        color: #fff;
      }

      .neo-touch-btn-small {
        min-width: 50px;
        min-height: 50px;
        width: 50px;
        height: 50px;
        border-radius: 12px;
        border-color: rgba(255, 255, 255, 0.25);
        color: #bbb;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }

      .neo-touch-btn-small.pressed {
        border-color: #ffee00;
        color: #ffee00;
        background: rgba(255, 238, 0, 0.2);
        box-shadow: 0 0 18px rgba(255, 238, 0, 0.5);
      }

      .neo-touch-icon {
        font-size: 20px;
        line-height: 1;
        pointer-events: none;
      }

      .neo-touch-label {
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.5px;
        margin-top: 2px;
        pointer-events: none;
      }

      /* Right Zone Action Placement (Ergonomic Arc Layout) */
      .neo-touch-jump {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 74px;
        height: 74px;
        border-color: #00ff88;
        color: #00ff88;
        box-shadow: 0 0 18px rgba(0, 255, 136, 0.25);
      }

      .neo-touch-jump.pressed {
        border-color: #00ff88;
        background: rgba(0, 255, 136, 0.28);
        box-shadow: 0 0 28px rgba(0, 255, 136, 0.65);
      }

      /* Dash Button with SVG Circular Cooldown Ring */
      .neo-touch-dash-wrapper {
        position: absolute;
        bottom: 74px;
        right: 48px;
        width: 76px;
        height: 76px;
      }

      .neo-dash-cooldown-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        pointer-events: none;
      }

      .neo-dash-cooldown-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.12);
        stroke-width: 4;
      }

      .neo-dash-cooldown-fill {
        fill: none;
        stroke: #00ffff;
        stroke-width: 4;
        stroke-dasharray: 213.63;
        stroke-dashoffset: 0;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.06s linear;
      }

      .neo-touch-dash {
        position: absolute;
        inset: 4px;
        width: 68px;
        height: 68px;
        border-color: rgba(0, 255, 255, 0.4);
        color: #00ffff;
      }

      .neo-touch-dash.ready {
        border-color: #00ffff;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
      }

      .neo-touch-dash.pressed {
        background: rgba(0, 255, 255, 0.35);
        box-shadow: 0 0 26px rgba(0, 255, 255, 0.7);
      }

      /* Tag / Shove Button */
      .neo-touch-attack {
        position: absolute;
        bottom: 8px;
        left: 0;
        border-color: #ff0055;
        color: #ff0055;
        box-shadow: 0 0 16px rgba(255, 0, 85, 0.25);
      }

      .neo-touch-attack.pressed {
        border-color: #ff0055;
        background: rgba(255, 0, 85, 0.3);
        box-shadow: 0 0 26px rgba(255, 0, 85, 0.65);
      }

      /* Screen orientation adjustments */
      @media (max-width: 500px) {
        .neo-touch-btn {
          min-width: 64px;
          min-height: 64px;
          width: 64px;
          height: 64px;
        }
        .neo-touch-zone-right {
          width: 170px;
          height: 155px;
        }
        .neo-touch-jump {
          width: 68px;
          height: 68px;
        }
        .neo-touch-dash-wrapper {
          bottom: 68px;
          right: 36px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
