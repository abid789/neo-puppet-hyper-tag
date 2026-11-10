// src/entities/PowerUpManager.ts
// Manages power-up orb spawning every 12s, floating holographic animations, pickup detection,
// effects execution (Hyper Surge, Phase Shield, Grapple Pulse, Phantom Decoy), and lifecycle cleanup.

import { Container, Graphics } from 'pixi.js';
import { PPM, type Vec2, type PowerUpType } from '../types';
import type { Puppet } from './Puppet';
import { PhantomDecoy } from './PhantomDecoy';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { ParticleSystem } from '../graphics/Particles';

export interface PowerUpOrb {
  id:       number;
  type:     PowerUpType;
  x:        number; // Metres
  y:        number;
  baseY:    number;
  color:    number;
  gfx:      Graphics;
  active:   boolean;
  bobPhase: number;
}

const POWERUP_CONFIGS: Record<PowerUpType, { color: number; label: string; duration: number }> = {
  hyper_surge: {
    color: 0x00ffff,
    label: 'HYPER SURGE',
    duration: 5.0,
  },
  phase_shield: {
    color: 0x00ff88,
    label: 'PHASE SHIELD',
    duration: 15.0,
  },
  grapple_pulse: {
    color: 0xff0066,
    label: 'GRAPPLE PULSE',
    duration: 0.2,
  },
  phantom_decoy: {
    color: 0xaa00ff,
    label: 'PHANTOM DECOY',
    duration: 3.0,
  },
};

const POWERUP_TYPES: PowerUpType[] = [
  'hyper_surge',
  'phase_shield',
  'grapple_pulse',
  'phantom_decoy',
];

export class PowerUpManager {
  private readonly _physWorld: PhysicsWorld;
  private readonly _particles: ParticleSystem;
  private readonly _layer: Container;

  private _spawnNodes: Vec2[] = [];
  private _orbs: PowerUpOrb[] = [];
  private _decoys: PhantomDecoy[] = [];

  private _spawnTimer = 0;
  private readonly _spawnInterval = 12.0; // Spawns every 12 seconds
  private _nextOrbId = 1;

  constructor(physWorld: PhysicsWorld, particles: ParticleSystem, layer: Container) {
    this._physWorld = physWorld;
    this._particles = particles;
    this._layer = layer;
  }

  public setSpawnNodes(nodes: Vec2[]): void {
    this.clearOrbs();
    this._spawnNodes = [...nodes];
    this._spawnTimer = 2.0; // Initial orb spawns shortly after round start
  }

  public fixedUpdate(dt: number, puppets: Puppet[]): void {
    // 1. Spawning countdown
    if (this._spawnNodes.length > 0) {
      this._spawnTimer -= dt;
      if (this._spawnTimer <= 0) {
        this._spawnTimer = this._spawnInterval;
        this._spawnRandomOrb();
      }
    }

    // 2. Animate and check pickups for active orbs
    for (let i = 0; i < this._orbs.length; i++) {
      const orb = this._orbs[i];
      if (!orb.active) continue;

      orb.bobPhase += dt * 3.5;
      orb.y = orb.baseY + Math.sin(orb.bobPhase) * 0.25;

      // Check distance to puppets
      for (let p = 0; p < puppets.length; p++) {
        const puppet = puppets[p];
        const pPos = puppet.getWorldPosition();
        const distSq = (pPos.x - orb.x) ** 2 + (pPos.y - orb.y) ** 2;
        const pickupRadius = 0.95; // Metres (~48px)

        if (distSq <= pickupRadius * pickupRadius) {
          this._collectOrb(orb, puppet, puppets);
          break;
        }
      }
    }

    // 3. Update active decoys
    for (let i = this._decoys.length - 1; i >= 0; i--) {
      const decoy = this._decoys[i];
      if (!decoy.isActive) {
        this._decoys.splice(i, 1);
      } else {
        decoy.fixedUpdate(dt);
      }
    }
  }

  public render(): void {
    // Render active orbs with pulsing rings and core glow
    for (let i = 0; i < this._orbs.length; i++) {
      const orb = this._orbs[i];
      if (!orb.active) continue;

      const px = orb.x * PPM;
      const py = orb.y * PPM;
      const rot = orb.bobPhase;

      orb.gfx.clear();
      orb.gfx.x = px;
      orb.gfx.y = py;

      // Outer rotating holographic diamond
      const dSize = 14 + Math.sin(rot * 1.5) * 2;
      orb.gfx
        .poly([
          { x: 0, y: -dSize },
          { x: dSize * 0.8, y: 0 },
          { x: 0, y: dSize },
          { x: -dSize * 0.8, y: 0 },
        ])
        .stroke({ color: orb.color, width: 2.0, alpha: 0.85 });

      // Secondary counter-rotating ring
      const r = 11 + Math.cos(rot * 2) * 1.5;
      orb.gfx.circle(0, 0, r).stroke({ color: 0xffffff, width: 1.0, alpha: 0.6 });

      // Core pulsating nucleus
      const coreR = 6 + Math.sin(rot * 4) * 1.5;
      orb.gfx.circle(0, 0, coreR).fill({ color: orb.color, alpha: 0.85 });
      orb.gfx.circle(0, 0, coreR * 0.5).fill({ color: 0xffffff, alpha: 0.9 });
    }

    // Render decoys
    for (let i = 0; i < this._decoys.length; i++) {
      this._decoys[i].render();
    }
  }

  private _spawnRandomOrb(): void {
    if (this._spawnNodes.length === 0) return;

    // Pick an empty spawn node if possible
    const availableNodes = this._spawnNodes.filter(node =>
      !this._orbs.some(orb => orb.active && Math.abs(orb.x - node.x) < 0.5 && Math.abs(orb.baseY - node.y) < 0.5),
    );

    if (availableNodes.length === 0) return; // All nodes occupied

    const node = availableNodes[Math.floor(Math.random() * availableNodes.length)];
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    const cfg = POWERUP_CONFIGS[type];

    const gfx = new Graphics();
    this._layer.addChild(gfx);

    const orb: PowerUpOrb = {
      id: this._nextOrbId++,
      type,
      x: node.x,
      y: node.y,
      baseY: node.y,
      color: cfg.color,
      gfx,
      active: true,
      bobPhase: Math.random() * Math.PI * 2,
    };

    this._orbs.push(orb);

    // Spawn emergence particle burst
    this._particles.emitBurst(16, {
      x: node.x * PPM,
      y: node.y * PPM,
      vx: 0,
      vy: -30,
      life: 0.35,
      size: 3.5,
      color: cfg.color,
      alpha: 0.9,
      kind: 'spark',
      gravity: 0,
    });
  }

  private _collectOrb(orb: PowerUpOrb, collector: Puppet, allPuppets: Puppet[]): void {
    orb.active = false;
    orb.gfx.clear();
    this._layer.removeChild(orb.gfx);
    orb.gfx.destroy();

    const cfg = POWERUP_CONFIGS[orb.type];

    // Pickup explosion effect
    this._particles.emitBurst(28, {
      x: orb.x * PPM,
      y: orb.y * PPM,
      vx: 0,
      vy: -20,
      life: 0.45,
      size: 5,
      color: cfg.color,
      alpha: 1.0,
      kind: 'spark',
      gravity: 0,
    }, 120);

    // Apply specific effect
    switch (orb.type) {
      case 'hyper_surge':
        collector.applyPowerUp('hyper_surge', cfg.duration);
        break;

      case 'phase_shield':
        collector.applyPowerUp('phase_shield', cfg.duration);
        break;

      case 'grapple_pulse':
        this._executeGrapplePulse(collector, allPuppets);
        break;

      case 'phantom_decoy':
        this._spawnPhantomDecoy(collector);
        break;
    }
  }

  private _executeGrapplePulse(caster: Puppet, puppets: Puppet[]): void {
    const casterPos = caster.getWorldPosition();
    const pulseRadiusPx = 220; // 220 px requirement
    const pulseRadiusM = pulseRadiusPx / PPM; // 4.4 metres

    // Expand shockwave visual burst
    this._particles.emitBurst(32, {
      x: casterPos.x * PPM,
      y: casterPos.y * PPM,
      vx: 0,
      vy: 0,
      life: 0.35,
      size: 4.5,
      color: 0xff0066,
      alpha: 0.9,
      kind: 'spark',
      gravity: 0,
    }, pulseRadiusPx * 0.9);

    for (let i = 0; i < puppets.length; i++) {
      const target = puppets[i];
      if (target === caster) continue;

      const targetPos = target.getWorldPosition();
      const dx = targetPos.x - casterPos.x;
      const dy = targetPos.y - casterPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.01 && dist <= pulseRadiusM) {
        // Magnetic pull toward caster followed by disruptive launch
        const nx = dx / dist;
        const ny = dy / dist;
        const force = 14.0 * (1 - dist / pulseRadiusM);

        target.applyImpulse({
          x: -nx * force * 1.2,
          y: -ny * force - 6.0,
        });

        target.triggerBackflip();
      }
    }
  }

  private _spawnPhantomDecoy(caster: Puppet): void {
    const pos = caster.getWorldPosition();
    const facingRight = caster.getState() === 'walking' || caster.getState() === 'idle';

    const decoy = new PhantomDecoy(
      this._physWorld,
      this._particles,
      this._layer,
      pos,
      facingRight,
      caster.getColorPrimary(),
    );

    this._decoys.push(decoy);
  }

  public clearOrbs(): void {
    for (let i = 0; i < this._orbs.length; i++) {
      const orb = this._orbs[i];
      orb.active = false;
      orb.gfx.clear();
      this._layer.removeChild(orb.gfx);
      orb.gfx.destroy();
    }
    this._orbs = [];

    for (let i = 0; i < this._decoys.length; i++) {
      this._decoys[i].destroy();
    }
    this._decoys = [];
  }

  public clearAll(): void {
    this.clearOrbs();
  }

  public destroy(): void {
    this.clearOrbs();
  }

  public get activeOrbCount(): number {
    return this._orbs.filter(o => o.active).length;
  }

  public get activeDecoyCount(): number {
    return this._decoys.length;
  }
}
