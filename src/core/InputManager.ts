// src/core/InputManager.ts
// Unified input coordinator bridging keyboard events and mobile touch controls.
// Produces an identical InputState for deterministic 60Hz physics.

import type { InputState } from '../types';
import { createInputState } from '../types';

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
  private readonly _listeners: ((state: InputState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        this._keysDown.add(e.code);
      });
      window.addEventListener('keyup', (e: KeyboardEvent) => {
        this._keysDown.delete(e.code);
      });
    }
  }

  public setTouchAction(action: keyof InputState, active: boolean): void {
    if (this._touchState[action] !== active) {
      this._touchState[action] = active;
      this._notify();
    }
  }

  public setTouchState(patch: Partial<InputState>): void {
    let changed = false;
    for (const [k, v] of Object.entries(patch)) {
      const key = k as keyof InputState;
      if (v !== undefined && this._touchState[key] !== v) {
        (this._touchState as unknown as Record<string, boolean>)[key] = v;
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
