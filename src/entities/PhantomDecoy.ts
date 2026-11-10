// src/entities/PhantomDecoy.ts
// Physics-driven holographic clone that runs in the opposite direction for 3 seconds,
// emitting digital hologram glitch particles, then dissolves in a sparkle burst.

import type RAPIER from '@dimforge/rapier2d-compat';
import { Container, Graphics } from 'pixi.js';
import { PPM, clamp } from '../types';
import type { Vec2 } from '../types';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { ParticleSystem } from '../graphics/Particles';

export class PhantomDecoy {
  private readonly _physWorld: PhysicsWorld;
  private readonly _particles: ParticleSystem;
  private readonly _body: RAPIER.RigidBody;
  private readonly _container: Container;
  private readonly _gfx: Graphics;
  private readonly _color: number;
  private readonly _direction: number; // 1 or -1

  private _lifeRemaining = 3.0;
  private _maxLife = 3.0;
  private _active = true;
  private _flickerTimer = 0;
  private _walkPhase = 0;

  constructor(
    physWorld: PhysicsWorld,
    particles: ParticleSystem,
    layer: Container,
    spawnPos: Vec2,
    casterFacingRight: boolean,
    color: number,
  ) {
    this._physWorld = physWorld;
    this._particles = particles;
    this._color = color;
    this._direction = casterFacingRight ? -1 : 1; // Run opposite direction

    // Create a dynamic physics body
    this._body = physWorld.createDynamicBody(spawnPos.x, spawnPos.y, 0.4, 2.0);
    physWorld.addCapsuleCollider(this._body, 0.28, 0.14, 1.0, 0.3);

    // Initial launch impulse in the run direction
    this._body.applyImpulse({ x: this._direction * 5.0, y: -2.0 }, true);

    // Graphics representation
    this._container = new Container();
    this._gfx = new Graphics();
    this._container.addChild(this._gfx);
    layer.addChild(this._container);

    // Spawn hologram materialize burst
    this._particles.emitBurst(16, {
      x: spawnPos.x * PPM,
      y: spawnPos.y * PPM,
      vx: this._direction * 40,
      vy: -20,
      life: 0.35,
      size: 4,
      color: 0x00ffff,
      alpha: 0.9,
      kind: 'spark',
      gravity: 0,
    });
  }

  public get isActive(): boolean {
    return this._active;
  }

  public fixedUpdate(dt: number): void {
    if (!this._active) return;

    this._lifeRemaining -= dt;
    if (this._lifeRemaining <= 0) {
      this.destroy();
      return;
    }

    // Run forward with procedural momentum
    const linvel = this._body.linvel();
    const targetVx = this._direction * 6.5;
    const diff = targetVx - linvel.x;
    this._body.applyImpulse({ x: diff * 0.4, y: 0 }, true);

    // Upright stabilization
    const angle = this._body.rotation();
    const angvel = this._body.angvel();
    const torque = -450 * angle - 45 * angvel;
    this._body.applyTorqueImpulse(torque * dt * dt, true);

    // Small random hop if on ground
    if (Math.abs(linvel.y) < 0.1 && Math.random() < 0.04) {
      this._body.applyImpulse({ x: this._direction * 1.5, y: -5.0 }, true);
    }

    // Glitch particle trail
    this._flickerTimer -= dt;
    if (this._flickerTimer <= 0) {
      this._flickerTimer = 0.08;
      const t = this._body.translation();
      this._particles.emit({
        x: t.x * PPM + (Math.random() - 0.5) * 12,
        y: t.y * PPM + (Math.random() - 0.5) * 18,
        vx: -this._direction * 25,
        vy: (Math.random() - 0.5) * 20,
        life: 0.22,
        size: 2.5,
        color: 0x00ffff,
        alpha: 0.85,
        kind: 'spark',
        gravity: 0,
      });
    }

    this._walkPhase += dt * 18.0;
  }

  public render(): void {
    if (!this._active) return;

    const t = this._body.translation();
    const rot = this._body.rotation();

    this._container.x = t.x * PPM;
    this._container.y = t.y * PPM;
    this._container.rotation = rot;

    // Holographic flicker & alpha decay
    const lifeRatio = this._lifeRemaining / this._maxLife;
    const glitch = Math.random() < 0.15 ? 0.4 : 0.85;
    const alpha = clamp(lifeRatio * glitch, 0.1, 0.9);

    this._gfx.clear();

    // Torso hologram
    this._gfx
      .roundRect(-9, -14, 18, 28, 4)
      .fill({ color: 0x00ffff, alpha: alpha * 0.25 })
      .stroke({ color: 0x00ffff, width: 2, alpha });

    // Head hologram
    this._gfx
      .circle(0, -26, 10)
      .fill({ color: 0x00ffff, alpha: alpha * 0.3 })
      .stroke({ color: 0x00ffff, width: 2, alpha });

    // Eye visor
    const eyeOffset = this._direction > 0 ? 3 : -3;
    this._gfx
      .rect(eyeOffset - 3, -28, 6, 3)
      .fill({ color: 0xffffff, alpha });

    // Hologram scanlines
    for (let y = -36; y <= 16; y += 6) {
      this._gfx
        .moveTo(-12, y)
        .lineTo(12, y)
        .stroke({ color: 0x00ffff, width: 1, alpha: alpha * 0.35 });
    }

    // Procedural holographic legs
    const legSwing = Math.sin(this._walkPhase) * 6;
    this._gfx
      .moveTo(-5, 14)
      .lineTo(-5 - legSwing, 26)
      .stroke({ color: this._color, width: 3, alpha: alpha * 0.8 });
    this._gfx
      .moveTo(5, 14)
      .lineTo(5 + legSwing, 26)
      .stroke({ color: this._color, width: 3, alpha: alpha * 0.8 });
  }

  public destroy(): void {
    if (!this._active) return;
    this._active = false;

    // Disintegration spark burst
    const t = this._body.translation();
    this._particles.emitBurst(22, {
      x: t.x * PPM,
      y: t.y * PPM,
      vx: 0,
      vy: 0,
      life: 0.35,
      size: 4,
      color: 0x00ffff,
      alpha: 1.0,
      kind: 'spark',
      gravity: 0,
    }, 120);

    // Remove physics body
    this._physWorld.removeRigidBody(this._body);

    // Remove visual container
    this._gfx.clear();
    this._container.destroy({ children: true });
  }
}
