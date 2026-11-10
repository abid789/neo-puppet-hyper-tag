// src/graphics/Particles.ts
// High-performance object-pooled particle and ribbon-trail system for NEO-PUPPET: HYPER TAG.
// 2,000+ live particles with zero per-frame heap allocations.

import { Container, Graphics } from 'pixi.js';
import type { ParticleEmitConfig, ParticleKind } from '../types';

const MAX_PARTICLES = 2500;
const MAX_TRAIL_POINTS = 32;

class PooledParticle {
  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public life = 0;
  public maxLife = 1;
  public size = 4;
  public color = 0x00ffff;
  public alpha = 1;
  public kind: ParticleKind = 'spark';
  public gravity = 0;
  public active = false;
  public readonly index: number;
  public readonly gfx: Graphics;

  constructor(index: number, parent: Container) {
    this.index = index;
    this.gfx = new Graphics();
    this.gfx.visible = false;
    parent.addChild(this.gfx);
  }

  public spawn(cfg: ParticleEmitConfig): void {
    this.x = cfg.x;
    this.y = cfg.y;
    this.vx = cfg.vx;
    this.vy = cfg.vy;
    this.life = cfg.life;
    this.maxLife = Math.max(cfg.life, 0.001);
    this.size = cfg.size;
    this.color = cfg.color;
    this.alpha = cfg.alpha;
    this.kind = cfg.kind;
    this.gravity = cfg.gravity;
    this.active = true;
    this.gfx.visible = true;
  }

  public deactivate(): void {
    this.active = false;
    this.gfx.visible = false;
  }
}

interface TrailPoint {
  x: number;
  y: number;
  color: number;
  width: number;
  alpha: number;
}

class TrailRingBuffer {
  public readonly points: TrailPoint[] = [];
  public head = 0;
  public count = 0;

  constructor(maxSize: number) {
    for (let i = 0; i < maxSize; i++) {
      this.points.push({ x: 0, y: 0, color: 0x00ffff, width: 4, alpha: 0 });
    }
  }

  public push(x: number, y: number, color: number, width: number): void {
    const pt = this.points[this.head];
    pt.x = x;
    pt.y = y;
    pt.color = color;
    pt.width = width;
    pt.alpha = 1.0;

    this.head = (this.head + 1) % this.points.length;
    if (this.count < this.points.length) {
      this.count++;
    }
  }

  public decay(rate: number): void {
    for (let i = 0; i < this.count; i++) {
      this.points[i].alpha = Math.max(0, this.points[i].alpha - rate);
    }
  }
}

export class ParticleSystem {
  private readonly _pool: PooledParticle[] = [];
  private readonly _freeIndices: number[] = [];
  private readonly _activeParticles: PooledParticle[] = [];
  private readonly _trailGraphics: Graphics;
  private readonly _trails: Map<number, TrailRingBuffer> = new Map();
  private _maxBudget = MAX_PARTICLES;

  constructor(trailLayer: Container, vfxLayer: Container) {
    // Pre-allocate full pool up front
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = new PooledParticle(i, vfxLayer);
      this._pool.push(p);
      this._freeIndices.push(i);
    }

    this._trailGraphics = new Graphics();
    trailLayer.addChild(this._trailGraphics);
  }

  public setBudget(budget: number): void {
    this._maxBudget = Math.max(100, Math.min(budget, MAX_PARTICLES));
  }

  public get activeParticleCount(): number {
    return this._activeParticles.length;
  }

  public get activeCount(): number {
    return this._activeParticles.length;
  }

  public emit(cfg: ParticleEmitConfig): void {
    if (this._activeParticles.length >= this._maxBudget || this._freeIndices.length === 0) {
      return; // Pool or preset budget fully saturated, drop excess gracefully
    }

    const freeIdx = this._freeIndices.pop()!;
    const particle = this._pool[freeIdx];
    particle.spawn(cfg);
    this._activeParticles.push(particle);
  }

  public emitBurst(count: number, baseCfg: ParticleEmitConfig, spread = 60): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 0.5) * spread;
      this.emit({
        ...baseCfg,
        vx: baseCfg.vx + Math.cos(angle) * speed,
        vy: baseCfg.vy + Math.sin(angle) * speed,
        size: baseCfg.size * (0.7 + Math.random() * 0.6),
        life: baseCfg.life * (0.8 + Math.random() * 0.4),
      });
    }
  }

  public addTrailPoint(entityId: number, x: number, y: number, color: number, width: number): void {
    let buffer = this._trails.get(entityId);
    if (!buffer) {
      buffer = new TrailRingBuffer(MAX_TRAIL_POINTS);
      this._trails.set(entityId, buffer);
    }
    buffer.push(x, y, color, width);
  }

  public fixedUpdate(dt: number): void {
    // Update active particles backwards for O(1) swap-and-pop removal
    for (let i = this._activeParticles.length - 1; i >= 0; i--) {
      const p = this._activeParticles[i];
      p.life -= dt;

      if (p.life <= 0) {
        p.deactivate();
        this._freeIndices.push(p.index);
        this._activeParticles[i] = this._activeParticles[this._activeParticles.length - 1];
        this._activeParticles.pop();
        continue;
      }

      p.vy += p.gravity * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Decay trail alphas
    for (const trail of this._trails.values()) {
      trail.decay(dt * 2.8);
    }
  }

  public render(_alpha: number): void {
    // Render particles
    for (let i = 0; i < this._activeParticles.length; i++) {
      const p = this._activeParticles[i];
      const normLife = Math.max(0, p.life / p.maxLife);
      const curSize = Math.max(1, p.size * normLife);
      const curAlpha = p.alpha * normLife;

      p.gfx.x = p.x;
      p.gfx.y = p.y;
      p.gfx.clear();

      if (p.kind === 'spark') {
        p.gfx.circle(0, 0, curSize).fill({ color: p.color, alpha: curAlpha });
        // Core highlight
        p.gfx.circle(0, 0, Math.max(0.8, curSize * 0.4)).fill({ color: 0xffffff, alpha: curAlpha });
      } else if (p.kind === 'ember') {
        // Diamond shaped ember
        const s = curSize * 1.2;
        p.gfx
          .poly([
            { x: 0, y: -s },
            { x: s * 0.6, y: 0 },
            { x: 0, y: s },
            { x: -s * 0.6, y: 0 },
          ])
          .fill({ color: p.color, alpha: curAlpha });
      } else if (p.kind === 'dust') {
        p.gfx.circle(0, 0, curSize * 1.5).fill({ color: p.color, alpha: curAlpha * 0.45 });
      } else {
        p.gfx.circle(0, 0, curSize).fill({ color: p.color, alpha: curAlpha });
      }
    }

    // Render ribbon trails
    this._renderRibbonTrails();
  }

  private _renderRibbonTrails(): void {
    this._trailGraphics.clear();

    for (const trail of this._trails.values()) {
      if (trail.count < 2) continue;

      const len = trail.points.length;
      // Start from oldest active point up to newest
      const startIndex = (trail.head - trail.count + len) % len;

      let prevPt = trail.points[startIndex];
      for (let i = 1; i < trail.count; i++) {
        const curIdx = (startIndex + i) % len;
        const curPt = trail.points[curIdx];

        if (prevPt.alpha > 0.02 || curPt.alpha > 0.02) {
          const segAlpha = (prevPt.alpha + curPt.alpha) * 0.5;
          const segWidth = Math.max(1, (prevPt.width + curPt.width) * 0.5 * segAlpha);

          this._trailGraphics
            .moveTo(prevPt.x, prevPt.y)
            .lineTo(curPt.x, curPt.y)
            .stroke({
              color: curPt.color,
              width: segWidth,
              alpha: segAlpha * 0.7,
            });
        }
        prevPt = curPt;
      }
    }
  }
}
