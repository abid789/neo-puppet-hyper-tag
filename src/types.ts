// src/types.ts
// Shared constants, interfaces, and utilities for NEO-PUPPET: HYPER TAG.
// All physics coordinates use metres (Y+ = down, matching PixiJS screen space).
// Conversion: screenPx = physicsMetres * PPM

// ── Physics constants ──────────────────────────────────────────────────────────
export const FIXED_DT  = 1 / 60;   // physics timestep  (seconds)
export const MAX_DELTA = 0.25;      // spiral-of-death guard (seconds)
export const PPM       = 50;        // pixels per metre
export const GRAVITY_Y = 22;        // m/s² (Y+ down)

// ── Colour palette ─────────────────────────────────────────────────────────────
export const NEON_CYAN   = 0x00ffff;
export const NEON_PINK   = 0xff0066;
export const NEON_GREEN  = 0x00ff88;
export const NEON_PURPLE = 0xaa00ff;
export const NEON_ORANGE = 0xff6600;
export const NEON_YELLOW = 0xffee00;
export const NEON_BLUE   = 0x0066ff;
export const DARK_BG     = 0x05050f;
export const PANEL_BG    = 0x0d0d1f;

// ── Geometry ───────────────────────────────────────────────────────────────────
export interface Vec2 {
  x: number;
  y: number;
}

export interface Transform2D {
  x:        number;
  y:        number;
  rotation: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function lerpTransform(a: Transform2D, b: Transform2D, t: number): Transform2D {
  return {
    x:        lerp(a.x, b.x, t),
    y:        lerp(a.y, b.y, t),
    rotation: lerpAngle(a.rotation, b.rotation, t),
  };
}

/** Convert a physics-space transform to screen pixels. */
export function toScreen(t: Transform2D): Transform2D {
  return { x: t.x * PPM, y: t.y * PPM, rotation: t.rotation };
}

/** Clamp value to [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── Input ──────────────────────────────────────────────────────────────────────
export interface InputState {
  moveLeft:  boolean;
  moveRight: boolean;
  jump:      boolean;
  dash:      boolean;
  attack:    boolean;
}

export function createInputState(): InputState {
  return { moveLeft: false, moveRight: false, jump: false, dash: false, attack: false };
}

// ── Engine ─────────────────────────────────────────────────────────────────────
export interface EngineHooks {
  onFixedUpdate(dt: number): void;
  onRender(alpha: number, dt: number): void;
}

// ── Rendering ──────────────────────────────────────────────────────────────────
// Avoid importing pixi types at the value level here; use `import type`.
export interface RendererLayers {
  backgroundLayer: import('pixi.js').Container;
  arenaLayer:      import('pixi.js').Container;
  shadowLayer:     import('pixi.js').Container;
  trailLayer:      import('pixi.js').Container;
  entityLayer:     import('pixi.js').Container;
  lightingLayer:   import('pixi.js').Container;
  vfxLayer:        import('pixi.js').Container;
  uiOverlayLayer:  import('pixi.js').Container;
}

// ── Particles ──────────────────────────────────────────────────────────────────
export type ParticleKind = 'spark' | 'dust' | 'ember' | 'trail';

export interface ParticleEmitConfig {
  x:       number;        // world pixels
  y:       number;
  vx:      number;        // pixels/s
  vy:      number;
  life:    number;        // seconds (total lifespan)
  size:    number;        // pixels
  color:   number;        // 0xRRGGBB
  alpha:   number;        // 0-1
  kind:    ParticleKind;
  gravity: number;        // pixels/s² downward, 0 = none
}

// ── Puppet ─────────────────────────────────────────────────────────────────────
export interface PuppetConfig {
  x:             number;   // spawn x, metres
  y:             number;   // spawn y, metres
  colorPrimary:  number;
  colorSecondary: number;
  colorVisor:    number;
  playerIndex:   number;
}

export type PuppetState =
  | 'idle'
  | 'walking'
  | 'jumping'
  | 'falling'
  | 'dashing'
  | 'backflipping'
  | 'tagged'
  | 'celebrating';

// Interface implemented by Puppet so Camera and Lighting can track it.
export interface ITrackedEntity {
  getWorldPosition(): Vec2;
  getState(): PuppetState;
  getColorPrimary(): number;
}

// ── Key-binding maps ───────────────────────────────────────────────────────────
export interface KeyMap {
  moveLeft:  string;
  moveRight: string;
  jump:      string;
  dash:      string;
  attack:    string;
}

export const KEYMAP_P1: KeyMap = {
  moveLeft:  'KeyA',
  moveRight: 'KeyD',
  jump:      'KeyW',
  dash:      'ShiftLeft',
  attack:    'KeyF',
};

export const KEYMAP_P2: KeyMap = {
  moveLeft:  'ArrowLeft',
  moveRight: 'ArrowRight',
  jump:      'ArrowUp',
  dash:      'ControlRight',
  attack:    'KeyH',
};

// ── Power-Up System ────────────────────────────────────────────────────────────
export type PowerUpType =
  | 'hyper_surge'
  | 'phase_shield'
  | 'grapple_pulse'
  | 'phantom_decoy';

export interface ActivePowerUp {
  type:          PowerUpType;
  remainingTime: number;
  maxDuration:   number;
}

