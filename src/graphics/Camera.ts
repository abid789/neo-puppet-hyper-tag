// src/graphics/Camera.ts
// Spring-damped, zoom-aware game camera with screen-shake and hit-stop support.

import type { Application, Container } from 'pixi.js';
import { lerp, clamp, PPM } from '../types';
import type { ITrackedEntity } from '../types';

export class Camera {
  // ── Camera world position (metres) ─────────────────────────────────────────
  private _x = 0;
  private _y = 0;
  private _zoom = 1;

  // ── Spring targets ──────────────────────────────────────────────────────────
  private _targetX    = 0;
  private _targetY    = 0;
  private _targetZoom = 1;

  // ── Spring physics ──────────────────────────────────────────────────────────
  private _velX     = 0;
  private _velY     = 0;
  private _springK  = 6;    // stiffness  (s⁻²)
  private _dampingC = 0.75; // per-frame velocity damping factor (0–1)

  // ── Zoom limits ─────────────────────────────────────────────────────────────
  private _minZoom    = 0.5;
  private _maxZoom    = 1.4;
  private _zoomSpread = 12; // metres; at this spread zoom hits minimum

  // ── Screen shake ────────────────────────────────────────────────────────────
  private _shakeMag   = 0;
  private _shakeDirX  = 0;
  private _shakeDirY  = 1;
  private _shakeDecay = 0.88;

  // ── Hit-stop ────────────────────────────────────────────────────────────────
  private _hitStopActive = false;
  private _hitStopEnd    = 0;

  // ── Tracked entities ────────────────────────────────────────────────────────
  private _tracked: ITrackedEntity[] = [];

  // ── Entity tracking ─────────────────────────────────────────────────────────

  public track(entities: ITrackedEntity[]): void {
    this._tracked = entities;
  }

  // ── Fixed update (called at physics rate, dt ≈ 1/60) ───────────────────────

  public fixedUpdate(dt: number): void {
    // ── Hit-stop guard ──────────────────────────────────────────────────────
    if (this._hitStopActive) {
      if (performance.now() < this._hitStopEnd) {
        // Freeze spring update during hit-stop; still decay shake.
        this._shakeMag *= this._shakeDecay;
        return;
      }
      this._hitStopActive = false;
    }

    // ── Compute centroid & spread ───────────────────────────────────────────
    const entities = this._tracked;
    let centroidX = 0;
    let centroidY = 0;

    if (entities.length > 0) {
      for (const e of entities) {
        const p = e.getWorldPosition();
        centroidX += p.x;
        centroidY += p.y;
      }
      centroidX /= entities.length;
      centroidY /= entities.length;
    }

    // Max pairwise distance.
    let maxDist = 0;
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const pi = entities[i].getWorldPosition();
        const pj = entities[j].getWorldPosition();
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d > maxDist) maxDist = d;
      }
    }

    // ── Set spring targets ──────────────────────────────────────────────────
    this._targetX    = centroidX;
    this._targetY    = centroidY - 2; // look slightly upward / ahead

    const spread      = maxDist;
    this._targetZoom  = clamp(1.0 - spread / this._zoomSpread, this._minZoom, this._maxZoom);

    // ── Semi-implicit Euler spring toward target ────────────────────────────
    // X axis
    this._velX += (this._targetX - this._x) * this._springK * dt;
    this._velX *= this._dampingC;
    this._x    += this._velX * dt * 60;

    // Y axis
    this._velY += (this._targetY - this._y) * this._springK * dt;
    this._velY *= this._dampingC;
    this._y    += this._velY * dt * 60;

    // ── Smooth zoom ─────────────────────────────────────────────────────────
    this._zoom = lerp(this._zoom, this._targetZoom, 1 - Math.exp(-4 * dt));

    // ── Decay shake ─────────────────────────────────────────────────────────
    this._shakeMag *= this._shakeDecay;
  }

  // ── Apply transform to game container ──────────────────────────────────────

  public applyTo(gameContainer: Container, app: Application): void {
    const sw = app.screen.width  / 2;
    const sh = app.screen.height / 2;

    // Centre the world on the screen, offset by camera position.
    let screenX = sw - this._x * PPM * this._zoom;
    let screenY = sh - this._y * PPM * this._zoom;

    // Apply screen shake when magnitude is noticeable.
    if (this._shakeMag > 0.5) {
      screenX += (Math.random() - 0.5) * this._shakeMag * this._shakeDirX;
      screenY += (Math.random() - 0.5) * this._shakeMag * this._shakeDirY;
    }

    gameContainer.x = screenX;
    gameContainer.y = screenY;
    gameContainer.scale.set(this._zoom);
  }

  // ── Screen shake ────────────────────────────────────────────────────────────
  private _shakeMultiplier = 1.0;

  public setShakeMultiplier(mult: number): void {
    this._shakeMultiplier = Math.max(0, Math.min(1, mult));
  }

  public shake(magnitude: number, dirX: number, dirY: number): void {
    this._shakeMag  = magnitude * this._shakeMultiplier;
    this._shakeDirX = dirX;
    this._shakeDirY = dirY;
  }

  // ── Hit-stop ────────────────────────────────────────────────────────────────

  /**
   * Tells the camera to freeze its own spring physics for `durationMs`
   * milliseconds. The Engine's authoritative hit-stop controls game-object
   * updates; this only affects camera movement.
   */
  public hitStop(durationMs: number): void {
    this._hitStopActive = true;
    this._hitStopEnd    = performance.now() + durationMs;
  }
}
