import { FIXED_DT, MAX_DELTA } from '../types';
import type { EngineHooks } from '../types';
import { PerfHud } from './PerfHud';
import type { Container } from 'pixi.js';

export class Engine {
  private _hooks: EngineHooks;
  private _accumulator = 0;
  private _lastTime = 0;
  private _running = false;
  private _rafId = 0;
  private _hud: PerfHud;
  private _physStepStart = 0;
  private _physStepMs = 0;
  private _frameCount = 0;
  private _fpsAccum = 0;
  private _displayFps = 0;
  private _hitStopRemaining = 0;
  private _hitStopActive = false;
  private _timeScale = 1.0;
  private _timeScaleRemaining = 0;
  private _pingMs = 0;
  private _bufferMs = 50;

  constructor(hooks: EngineHooks, uiLayer: Container) {
    this._hooks = hooks;
    this._hud = new PerfHud(uiLayer);

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this._hud.toggle();
      }
    });
  }

  start(): void {
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._loop);
  }

  stop(): void {
    this._running = false;
    cancelAnimationFrame(this._rafId);
  }

  setPing(pingMs: number): void {
    this._pingMs = pingMs;
  }

  setInterpolationBuffer(bufferMs: number): void {
    this._bufferMs = bufferMs;
  }

  hitStop(durationMs: number): void {
    this._hitStopRemaining = durationMs;
    this._hitStopActive = true;
  }

  setTimeScale(scale: number, durationSec: number): void {
    this._timeScale = scale;
    this._timeScaleRemaining = durationSec;
  }

  getTimeScale(): number {
    return this._timeScale;
  }

  private _loop = (now: number): void => {
    if (!this._running) return;

    this._rafId = requestAnimationFrame(this._loop);

    if (this._hitStopActive) {
      this._hitStopRemaining -= (now - this._lastTime);
      if (this._hitStopRemaining <= 0) {
        this._hitStopActive = false;
      } else {
        this._lastTime = now;
        return;
      }
    }

    const rawDelta = (now - this._lastTime) / 1000;
    this._lastTime = now;

    if (this._timeScaleRemaining > 0) {
      this._timeScaleRemaining -= rawDelta;
      if (this._timeScaleRemaining <= 0) {
        this._timeScale = 1.0;
      }
    }

    const scaledDelta = rawDelta * this._timeScale;
    const delta = Math.min(scaledDelta, MAX_DELTA);

    const frameStart = performance.now();
    this._accumulator += delta;

    while (this._accumulator >= FIXED_DT) {
      this._physStepStart = performance.now();
      this._hooks.onFixedUpdate(FIXED_DT);
      this._physStepMs = performance.now() - this._physStepStart;
      this._accumulator -= FIXED_DT;
    }

    const alpha = this._accumulator / FIXED_DT;
    this._hooks.onRender(alpha, delta);

    const frameMs = performance.now() - frameStart;

    this._fpsAccum += delta;
    this._frameCount++;
    if (this._fpsAccum >= 1) {
      this._displayFps = Math.round(this._frameCount / this._fpsAccum);
      this._fpsAccum = 0;
      this._frameCount = 0;
    }

    this._hud.update(this._displayFps, frameMs, this._physStepMs, this._pingMs, this._bufferMs);
  };
}
