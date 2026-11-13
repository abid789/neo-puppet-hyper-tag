// src/core/InputManager.ts
// Unified input coordinator bridging keyboard, mouse, and mobile touch controls.
// Produces an identical InputState for deterministic 60Hz physics.

import type { InputState } from '../types';
import { createInputState } from '../types';
import type { KeybindConfig } from '../config/keybinds';

export class InputManager {
  private static _instance: InputManager | null = null;

  public static getInstance(): InputManager {
    if (!this._instance) {
      this._instance = new InputManager();
    }
    return this._instance;
  }

  private _touchState: InputState = createInputState();
  private _keysDown: Set<string> = new Set();
  private _mouseButtonsDown: Set<number> = new Set();
  private readonly _listeners: ((state: InputState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        this._keysDown.add(e.code);
      });

      window.addEventListener('keyup', (e: KeyboardEvent) => {
        this._keysDown.delete(e.code);
      });

      // Mouse controls: Left-Click = Punch (button 0), Right-Click = Block (button 2)
      window.addEventListener('mousedown', (e: MouseEvent) => {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
        this._mouseButtonsDown.add(e.button);
      });

      window.addEventListener('mouseup', (e: MouseEvent) => {
        this._mouseButtonsDown.delete(e.button);
      });

      // Prevent context menu on right click during gameplay
      window.addEventListener('contextmenu', (e: MouseEvent) => {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (this._mouseButtonsDown.has(2) || (e.target as HTMLElement)?.closest('#app')) {
          e.preventDefault();
        }
      });
    }
  }

  public setTouchAction(action: keyof InputState, active: boolean): void {
    if (this._touchState[action] !== active) {
      this._touchState[action] = active;
      if (action === 'punch') this._touchState.attack = active;
      if (action === 'attack') this._touchState.punch = active;
      this._notify();
    }
  }

  public setTouchState(patch: Partial<InputState>): void {
    let changed = false;
    for (const [k, v] of Object.entries(patch)) {
      const key = k as keyof InputState;
      if (v !== undefined && this._touchState[key] !== v) {
        (this._touchState as unknown as Record<string, boolean>)[key] = v;
        if (key === 'punch') this._touchState.attack = v;
        if (key === 'attack') this._touchState.punch = v;
        changed = true;
      }
    }
    if (changed) {
      this._notify();
    }
  }

  public clearTouchState(): void {
    this._touchState = createInputState();
    this._notify();
  }

  public getTouchInput(): InputState {
    return { ...this._touchState };
  }

  public isKeyDown(code: string): boolean {
    return this._keysDown.has(code);
  }

  public isMouseButtonDown(button: number): boolean {
    return this._mouseButtonsDown.has(button);
  }

  /**
   * Evaluates keyboard, mouse, and touch inputs into a synchronized InputState.
   */
  public evaluatePlayerInput(keybinds?: KeybindConfig): InputState {
    const moveLeftKey = keybinds?.moveLeft ?? 'KeyA';
    const moveRightKey = keybinds?.moveRight ?? 'KeyD';
    const jumpKey = keybinds?.jump ?? 'Space';
    const punchKey = keybinds?.punch ?? keybinds?.attack ?? 'KeyJ';
    const blockKey = keybinds?.block ?? 'KeyK';
    const dashKey = keybinds?.dash ?? 'ShiftLeft';

    const moveLeft =
      this._keysDown.has(moveLeftKey) ||
      this._keysDown.has('KeyA') ||
      this._keysDown.has('ArrowLeft') ||
      this._touchState.moveLeft;

    const moveRight =
      this._keysDown.has(moveRightKey) ||
      this._keysDown.has('KeyD') ||
      this._keysDown.has('ArrowRight') ||
      this._touchState.moveRight;

    const jump =
      this._keysDown.has(jumpKey) ||
      this._keysDown.has('Space') ||
      this._keysDown.has('KeyW') ||
      this._keysDown.has('ArrowUp') ||
      this._touchState.jump;

    const punch =
      this._keysDown.has(punchKey) ||
      this._keysDown.has('KeyJ') ||
      this._mouseButtonsDown.has(0) ||
      this._touchState.punch ||
      Boolean(this._touchState.attack);

    const block =
      this._keysDown.has(blockKey) ||
      this._keysDown.has('KeyK') ||
      this._mouseButtonsDown.has(2) ||
      this._touchState.block;

    const dash =
      this._keysDown.has(dashKey) ||
      this._keysDown.has('ShiftLeft') ||
      this._touchState.dash;

    const fastFall =
      this._keysDown.has('KeyS') ||
      this._keysDown.has('ArrowDown') ||
      Boolean(this._touchState.fastFall);

    return {
      moveLeft,
      moveRight,
      jump,
      punch,
      block,
      dash,
      attack: punch,
      fastFall,
    };
  }

  public onInputChanged(cb: (state: InputState) => void): void {
    this._listeners.push(cb);
  }

  private _notify(): void {
    const copy = this.getTouchInput();
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i](copy);
    }
  }
}
