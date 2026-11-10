// src/maps/MapBuilder.ts
// Instantiates Rapier2D colliders, kinematics, hazards, interactive mechanics,
// parallax backdrops, and weather systems from a MapDefinition. Cleanly destroys all resources on unload.

import type RAPIER from '@dimforge/rapier2d-compat';
import { Container, Graphics } from 'pixi.js';
import { PPM, type Vec2 } from '../types';
import type { MapDefinition } from './MapTypes';
import type { Puppet } from '../entities/Puppet';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { ParticleSystem } from '../graphics/Particles';

interface BuiltMovingPlatform {
  body:      RAPIER.RigidBody;
  gfx:       Graphics;
  w:         number;
  h:         number;
  waypoints: Vec2[];
  speed:     number;
  curIndex:  number;
  t:         number;
}

interface BuiltCrumblingPlatform {
  def:                import('./MapTypes').CrumblingPlatformDef;
  body:               RAPIER.RigidBody | null;
  gfx:                Graphics;
  state:              'idle' | 'shaking' | 'dropped';
  timer:              number;
  shakeOffset:        number;
}

interface BuiltGlassBarrier {
  def:       import('./MapTypes').GlassBarrierDef;
  body:      RAPIER.RigidBody | null;
  gfx:       Graphics;
  shattered: boolean;
}

interface ZiplineRider {
  playerIndex: number;
  progress:    number; // 0 to 1
}

export class MapBuilder {
  private readonly _mapDef: MapDefinition;
  private readonly _physWorld: PhysicsWorld;
  private readonly _particles: ParticleSystem;

  // Layer containers
  private readonly _bgLayer: Container;
  private readonly _arenaLayer: Container;
  private readonly _vfxLayer: Container;

  // Tracked physics bodies and colliders for 100% leak-proof destruction
  private _createdBodies: RAPIER.RigidBody[] = [];
  private _createdColliders: RAPIER.Collider[] = [];

  // Graphics groups
  private readonly _mapRoot: Container;
  private readonly _parallaxGfx: Graphics;
  private readonly _weatherGfx: Graphics;
  private readonly _hazardsGfx: Graphics;
  private readonly _mechanicsGfx: Graphics;

  // Dynamic mechanics state
  private _movingPlatforms: BuiltMovingPlatform[] = [];
  private _crumblingPlatforms: BuiltCrumblingPlatform[] = [];
  private _glassBarriers: BuiltGlassBarrier[] = [];
  private _pendulumAngles: Map<string, number> = new Map();
  private _portalCooldowns: Map<string, number> = new Map(); // key: `${portalId}_${playerIndex}`
  private _ziplineRiders: Map<string, ZiplineRider> = new Map(); // key: playerIndex

  // Environmental global cycle timers
  private _laserTimer = 0;
  private _steamTimer = 0;
  private _lavaTimer = 0;
  private _windTimer = 0;
  private _timeElapsed = 0;

  // Weather simulation points
  private _weatherParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];

  constructor(
    mapDef: MapDefinition,
    physWorld: PhysicsWorld,
    particles: ParticleSystem,
    bgLayer: Container,
    arenaLayer: Container,
    vfxLayer: Container,
  ) {
    this._mapDef = mapDef;
    this._physWorld = physWorld;
    this._particles = particles;
    this._bgLayer = bgLayer;
    this._arenaLayer = arenaLayer;
    this._vfxLayer = vfxLayer;

    this._mapRoot = new Container();
    this._parallaxGfx = new Graphics();
    this._weatherGfx = new Graphics();
    this._hazardsGfx = new Graphics();
    this._mechanicsGfx = new Graphics();

    this._bgLayer.addChild(this._parallaxGfx);
    this._arenaLayer.addChild(this._mapRoot);
    this._arenaLayer.addChild(this._mechanicsGfx);
    this._arenaLayer.addChild(this._hazardsGfx);
    this._vfxLayer.addChild(this._weatherGfx);

    this._initWeather();
    this._buildStaticPlatforms();
    this._buildMovingPlatforms();
    this._buildCrumblingPlatforms();
    this._buildGlassBarriers();
    this._drawParallaxBackdrop(0, 0);
  }

  // ── Static Platforms ─────────────────────────────────────────────────────────
  private _buildStaticPlatforms(): void {
    const pw = this._physWorld;

    for (let i = 0; i < this._mapDef.staticPlatforms.length; i++) {
      const p = this._mapDef.staticPlatforms[i];
      const body = pw.createFixedBody(p.x, p.y);
      const col = pw.addBoxCollider(
        body,
        p.w / 2,
        p.h / 2,
        1.0,
        p.friction ?? 0.6,
      );
      if (p.restitution !== undefined) {
        col.setRestitution(p.restitution);
      }

      this._createdBodies.push(body);
      this._createdColliders.push(col);

      // Visual platform rendering
      const gfx = new Graphics();
      const px = p.x * PPM;
      const py = p.y * PPM;
      const pwPx = p.w * PPM;
      const phPx = p.h * PPM;

      const fillCol = p.color ?? this._mapDef.palette.secondary;
      const strokeCol = p.strokeColor ?? this._mapDef.palette.primary;

      gfx
        .roundRect(px - pwPx / 2, py - phPx / 2, pwPx, phPx, 4)
        .fill({ color: fillCol, alpha: 0.95 })
        .stroke({ color: strokeCol, width: 2.0, alpha: 0.9 });

      // Neon edge top-strip highlight
      gfx
        .moveTo(px - pwPx / 2 + 2, py - phPx / 2)
        .lineTo(px + pwPx / 2 - 2, py - phPx / 2)
        .stroke({ color: strokeCol, width: 3.5, alpha: 1.0 });

      this._mapRoot.addChild(gfx);
    }
  }

  // ── Moving Platforms ─────────────────────────────────────────────────────────
  private _buildMovingPlatforms(): void {
    if (!this._mapDef.movingPlatforms) return;

    for (let i = 0; i < this._mapDef.movingPlatforms.length; i++) {
      const mp = this._mapDef.movingPlatforms[i];
      // Kinematic position-based body
      const desc = (this._physWorld.world.createRigidBody as any);
      void desc;
      const body = this._physWorld.createDynamicBody(mp.x, mp.y, 0, 0);
      body.setBodyType(1, true); // 1 = KinematicPositionBased in Rapier

      const col = this._physWorld.addBoxCollider(body, mp.w / 2, mp.h / 2, 1.0, 0.7);
      this._createdBodies.push(body);
      this._createdColliders.push(col);

      const gfx = new Graphics();
      this._mapRoot.addChild(gfx);

      this._movingPlatforms.push({
        body,
        gfx,
        w: mp.w,
        h: mp.h,
        waypoints: mp.waypoints,
        speed: mp.speed,
        curIndex: 0,
        t: 0,
      });
    }
  }

  // ── Crumbling Platforms ──────────────────────────────────────────────────────
  private _buildCrumblingPlatforms(): void {
    if (!this._mapDef.crumblingPlatforms) return;

    for (let i = 0; i < this._mapDef.crumblingPlatforms.length; i++) {
      const cp = this._mapDef.crumblingPlatforms[i];
      const body = this._physWorld.createFixedBody(cp.x, cp.y);
      const col = this._physWorld.addBoxCollider(body, cp.w / 2, cp.h / 2, 1.0, 0.6);
      this._createdBodies.push(body);
      this._createdColliders.push(col);

      const gfx = new Graphics();
      this._mapRoot.addChild(gfx);

      this._crumblingPlatforms.push({
        def: cp,
        body,
        gfx,
        state: 'idle',
        timer: 0,
        shakeOffset: 0,
      });
    }
  }

  // ── Glass Barriers ───────────────────────────────────────────────────────────
  private _buildGlassBarriers(): void {
    if (!this._mapDef.glassBarriers) return;

    for (let i = 0; i < this._mapDef.glassBarriers.length; i++) {
      const gb = this._mapDef.glassBarriers[i];
      const body = this._physWorld.createFixedBody(gb.x, gb.y);
      const col = this._physWorld.addBoxCollider(body, gb.w / 2, gb.h / 2, 1.0, 0.2);
      this._createdBodies.push(body);
      this._createdColliders.push(col);

      const gfx = new Graphics();
      this._mapRoot.addChild(gfx);

      this._glassBarriers.push({
        def: gb,
        body,
        gfx,
        shattered: false,
      });
    }
  }

  // ── Weather System ───────────────────────────────────────────────────────────
  private _initWeather(): void {
    const w = this._mapDef.weather;
    const count = w.density;
    for (let i = 0; i < count; i++) {
      this._weatherParticles.push({
        x: (Math.random() - 0.5) * 36 * PPM,
        y: (Math.random() - 0.5) * 22 * PPM,
        vx: w.speed.x * (0.8 + Math.random() * 0.4),
        vy: w.speed.y * (0.8 + Math.random() * 0.4),
        life: Math.random() * 2.0,
      });
    }
  }

  // ── Fixed Update: Mechanics & Interactions ───────────────────────────────────
  public fixedUpdate(dt: number, puppets: Puppet[]): void {
    this._timeElapsed += dt;
    this._laserTimer += dt;
    this._steamTimer += dt;
    this._lavaTimer += dt;
    this._windTimer += dt;

    // Decay portal cooldowns
    for (const [key, cd] of this._portalCooldowns.entries()) {
      if (cd <= dt) {
        this._portalCooldowns.delete(key);
      } else {
        this._portalCooldowns.set(key, cd - dt);
      }
    }

    // 1. Moving Platforms
    for (let i = 0; i < this._movingPlatforms.length; i++) {
      const mp = this._movingPlatforms[i];
      if (mp.waypoints.length < 2) continue;

      const p0 = mp.waypoints[mp.curIndex];
      const nextIdx = (mp.curIndex + 1) % mp.waypoints.length;
      const p1 = mp.waypoints[nextIdx];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const travelTime = dist / Math.max(0.1, mp.speed);

      mp.t += dt / travelTime;
      if (mp.t >= 1.0) {
        mp.t = 0;
        mp.curIndex = nextIdx;
      }

      const curX = p0.x + dx * mp.t;
      const curY = p0.y + dy * mp.t;
      mp.body.setNextKinematicTranslation({ x: curX, y: curY });
    }

    // 2. Crumbling Platforms
    for (let i = 0; i < this._crumblingPlatforms.length; i++) {
      const cp = this._crumblingPlatforms[i];

      if (cp.state === 'shaking') {
        cp.timer -= dt;
        cp.shakeOffset = (Math.random() - 0.5) * 6;

        if (cp.timer <= 0) {
          // Drop platform
          cp.state = 'dropped';
          cp.timer = cp.def.respawnDurationSec;
          if (cp.body) {
            this._physWorld.removeRigidBody(cp.body);
            cp.body = null;
          }
          // Crumble dust & spark puff
          this._particles.emitBurst(20, {
            x: cp.def.x * PPM,
            y: cp.def.y * PPM,
            vx: 0,
            vy: 40,
            life: 0.5,
            size: 4,
            color: 0x442211,
            alpha: 0.8,
            kind: 'dust',
            gravity: 40,
          });
        }
      } else if (cp.state === 'dropped') {
        cp.timer -= dt;
        if (cp.timer <= 0) {
          // Respawn platform
          cp.state = 'idle';
          cp.shakeOffset = 0;
          cp.body = this._physWorld.createFixedBody(cp.def.x, cp.def.y);
          const col = this._physWorld.addBoxCollider(cp.body, cp.def.w / 2, cp.def.h / 2, 1.0, 0.6);
          this._createdBodies.push(cp.body);
          this._createdColliders.push(col);

          // Respawn sparkle
          this._particles.emitBurst(16, {
            x: cp.def.x * PPM,
            y: cp.def.y * PPM,
            vx: 0,
            vy: -20,
            life: 0.4,
            size: 3,
            color: this._mapDef.palette.primary,
            alpha: 0.9,
            kind: 'spark',
            gravity: 0,
          });
        }
      }
    }

    // 3. Puppet interactions with map elements
    for (let p = 0; p < puppets.length; p++) {
      const puppet = puppets[p];
      const pIdx = puppet.getPlayerIndex();
      const pos = puppet.getWorldPosition();

      // Conveyor belt contact check
      if (this._mapDef.conveyors) {
        for (let i = 0; i < this._mapDef.conveyors.length; i++) {
          const conv = this._mapDef.conveyors[i];
          if (
            Math.abs(pos.x - conv.x) <= conv.w / 2 &&
            pos.y >= conv.y - conv.h / 2 - 0.7 &&
            pos.y <= conv.y + conv.h / 2 + 0.3
          ) {
            puppet.setConveyorVelocity(conv.speed);
          }
        }
      }

      // Jump pad contact check
      if (this._mapDef.jumpPads) {
        for (let i = 0; i < this._mapDef.jumpPads.length; i++) {
          const pad = this._mapDef.jumpPads[i];
          if (
            Math.abs(pos.x - pad.x) <= pad.w / 2 &&
            pos.y >= pad.y - pad.h / 2 - 0.75 &&
            pos.y <= pad.y + pad.h / 2 + 0.2
          ) {
            puppet.applyImpulse(pad.impulse);
            puppet.triggerBackflip();

            // Jump pad emission burst
            this._particles.emitBurst(18, {
              x: pad.x * PPM,
              y: pad.y * PPM - 10,
              vx: pad.impulse.x * 2.5,
              vy: pad.impulse.y * 3.0,
              life: 0.35,
              size: 4,
              color: pad.color ?? this._mapDef.palette.primary,
              alpha: 0.95,
              kind: 'spark',
              gravity: 0,
            });
          }
        }
      }

      // Low gravity dome detection
      if (this._mapDef.lowGravityDomes) {
        let insideDome = false;
        for (let i = 0; i < this._mapDef.lowGravityDomes.length; i++) {
          const dome = this._mapDef.lowGravityDomes[i];
          const distSq = (pos.x - dome.x) ** 2 + (pos.y - dome.y) ** 2;
          if (distSq <= dome.radius * dome.radius) {
            insideDome = true;
            puppet.setLowGravity(true, dome.scale);
            break;
          }
        }
        if (!insideDome) {
          puppet.setLowGravity(false);
        }
      }

      // Quantum teleporter portals
      if (this._mapDef.portals) {
        for (let i = 0; i < this._mapDef.portals.length; i++) {
          const portal = this._mapDef.portals[i];
          const cdKey = `${portal.id}_${pIdx}`;
          const currentCd = this._portalCooldowns.get(cdKey) ?? 0;

          const distSq = (pos.x - portal.x) ** 2 + (pos.y - portal.y) ** 2;
          if (distSq <= portal.radius * portal.radius && currentCd <= 0) {
            // Origin teleport flash
            this._particles.emitBurst(24, {
              x: portal.x * PPM,
              y: portal.y * PPM,
              vx: 0,
              vy: 0,
              life: 0.35,
              size: 4,
              color: portal.color,
              alpha: 1.0,
              kind: 'spark',
              gravity: 0,
            }, 80);

            // Instantaneous displacement
            puppet.teleport(portal.targetX, portal.targetY);
            this._portalCooldowns.set(cdKey, portal.cooldownSec);

            // Destination exit flash
            this._particles.emitBurst(24, {
              x: portal.targetX * PPM,
              y: portal.targetY * PPM,
              vx: 0,
              vy: 0,
              life: 0.35,
              size: 4,
              color: portal.color,
              alpha: 1.0,
              kind: 'spark',
              gravity: 0,
            }, 80);
          }
        }
      }

      // Wind tunnels (airlocks pushing upward)
      if (this._mapDef.windTunnels) {
        for (let i = 0; i < this._mapDef.windTunnels.length; i++) {
          const wt = this._mapDef.windTunnels[i];
          if (
            Math.abs(pos.x - wt.x) <= wt.w / 2 &&
            Math.abs(pos.y - wt.y) <= wt.h / 2
          ) {
            puppet.applyImpulse({ x: wt.force.x * dt, y: wt.force.y * dt });
          }
        }
      }

      // Crumbling platform trigger
      for (let i = 0; i < this._crumblingPlatforms.length; i++) {
        const cp = this._crumblingPlatforms[i];
        if (
          cp.state === 'idle' &&
          Math.abs(pos.x - cp.def.x) <= cp.def.w / 2 &&
          pos.y >= cp.def.y - cp.def.h / 2 - 0.8 &&
          pos.y <= cp.def.y - cp.def.h / 2 + 0.3
        ) {
          cp.state = 'shaking';
          cp.timer = cp.def.shakeDurationSec;
        }
      }

      // Steam vents (periodic eruption)
      if (this._mapDef.steamVents) {
        for (let i = 0; i < this._mapDef.steamVents.length; i++) {
          const sv = this._mapDef.steamVents[i];
          const cycle = this._steamTimer % sv.periodSec;
          const isErupting = cycle <= sv.activeSec;

          if (
            isErupting &&
            Math.abs(pos.x - sv.x) <= sv.w / 2 &&
            pos.y <= sv.y &&
            pos.y >= sv.y - sv.h
          ) {
            puppet.applyImpulse(sv.impulse);
          }
        }
      }

      // Laser gates (lethal on contact when active)
      if (this._mapDef.laserGates) {
        for (let i = 0; i < this._mapDef.laserGates.length; i++) {
          const lg = this._mapDef.laserGates[i];
          const cycle = this._laserTimer % lg.periodSec;
          const isLethal = cycle <= lg.activeSec;

          if (
            isLethal &&
            Math.abs(pos.x - lg.x) <= lg.w / 2 + 0.25 &&
            Math.abs(pos.y - lg.y) <= lg.h / 2 + 0.25
          ) {
            puppet.applyTag();
          }
        }
      }

      // Glass barriers (shatters if dashed through, solid otherwise)
      for (let i = 0; i < this._glassBarriers.length; i++) {
        const gb = this._glassBarriers[i];
        if (
          !gb.shattered &&
          Math.abs(pos.x - gb.def.x) <= gb.def.w / 2 + 0.35 &&
          Math.abs(pos.y - gb.def.y) <= gb.def.h / 2 + 0.35
        ) {
          if (puppet.isDashing()) {
            gb.shattered = true;
            if (gb.body) {
              this._physWorld.removeRigidBody(gb.body);
              gb.body = null;
            }
            // Shatter into dynamic physics glass shards
            this._particles.emitBurst(gb.def.shardCount, {
              x: gb.def.x * PPM,
              y: gb.def.y * PPM,
              vx: (puppet.getState() === 'dashing' ? 60 : 0),
              vy: -30,
              life: 0.5,
              size: 3.5,
              color: 0xdff9ff,
              alpha: 0.95,
              kind: 'spark',
              gravity: 45,
            }, 90);
          }
        }
      }

      // Overhead Ziplines
      if (this._mapDef.ziplines) {
        const riderKey = `${pIdx}`;
        let rider = this._ziplineRiders.get(riderKey);

        if (!rider) {
          // Check if jumping puppet grabs zipline wire
          for (let z = 0; z < this._mapDef.ziplines.length; z++) {
            const zip = this._mapDef.ziplines[z];
            const startDist = Math.hypot(pos.x - zip.startX, pos.y - zip.startY);
            if (startDist <= 1.1) {
              this._ziplineRiders.set(riderKey, { playerIndex: pIdx, progress: 0 });
              break;
            }
          }
        } else {
          // Advance along zipline
          const zip = this._mapDef.ziplines[0]; // Active line
          const totalDist = Math.hypot(zip.endX - zip.startX, zip.endY - zip.startY);
          const step = (zip.speed * dt) / totalDist;
          rider.progress += step;

          const curX = zip.startX + (zip.endX - zip.startX) * rider.progress;
          const curY = zip.startY + (zip.endY - zip.startY) * rider.progress;
          puppet.teleport(curX, curY);

          // Electrical sparks trailing along cable
          if (Math.random() < 0.6) {
            this._particles.emit({
              x: curX * PPM,
              y: curY * PPM - 10,
              vx: (Math.random() - 0.5) * 40,
              vy: 20,
              life: 0.2,
              size: 3,
              color: 0xffee00,
              alpha: 1.0,
              kind: 'spark',
              gravity: 0,
            });
          }

          if (rider.progress >= 1.0) {
            // Drop off with forward momentum launch
            this._ziplineRiders.delete(riderKey);
            puppet.applyImpulse({ x: 8.0, y: -4.0 });
          }
        }
      }

      // Swinging cryo-pendulum collision
      if (this._mapDef.pendulums) {
        for (let i = 0; i < this._mapDef.pendulums.length; i++) {
          const pend = this._mapDef.pendulums[i];
          const angle = Math.sin(this._timeElapsed * pend.speed) * pend.maxAngle;
          this._pendulumAngles.set(pend.id, angle);

          const bobX = pend.pivotX + Math.sin(angle) * pend.length;
          const bobY = pend.pivotY + Math.cos(angle) * pend.length;

          const dist = Math.hypot(pos.x - bobX, pos.y - bobY);
          if (dist <= pend.bobRadius + 0.4) {
            // Heavy impact knockback
            const dir = Math.cos(this._timeElapsed * pend.speed) >= 0 ? 1 : -1;
            puppet.applyImpulse({ x: dir * 16.0, y: -10.0 });
            puppet.triggerBackflip();

            this._particles.emitBurst(16, {
              x: bobX * PPM,
              y: bobY * PPM,
              vx: dir * 50,
              vy: -40,
              life: 0.35,
              size: 4,
              color: 0x00ffff,
              alpha: 1.0,
              kind: 'spark',
              gravity: 20,
            });
          }
        }
      }

      // Periodic lateral wind gusts
      if (this._mapDef.windGusts) {
        const wg = this._mapDef.windGusts;
        const cycle = this._windTimer % wg.intervalSec;
        if (cycle >= wg.intervalSec - wg.durationSec) {
          puppet.applyImpulse({ x: wg.force.x * dt * 1.5, y: wg.force.y * dt });
        }
      }

      // Lava surge check (volcanic reactor)
      if (this._mapDef.lavaSurge) {
        const ls = this._mapDef.lavaSurge;
        const cycle = this._lavaTimer % ls.intervalSec;
        const isSurging = cycle <= ls.surgeDurationSec;
        const currentLavaY = isSurging ? ls.peakY : ls.baseY;

        if (pos.y >= currentLavaY) {
          puppet.applyTag();
          puppet.teleport(0, -1.0);
        }
      }

      // Permanent hazard zones (lava pits, vacuum void)
      if (this._mapDef.hazardZones) {
        for (let i = 0; i < this._mapDef.hazardZones.length; i++) {
          const hz = this._mapDef.hazardZones[i];
          if (
            Math.abs(pos.x - hz.x) <= hz.w / 2 &&
            pos.y >= hz.y - hz.h / 2
          ) {
            puppet.applyTag();
            puppet.teleport(hz.respawnTarget.x, hz.respawnTarget.y);
          }
        }
      }
    }

    // 4. Update weather particles
    const bounds = this._mapDef.bounds;
    for (let i = 0; i < this._weatherParticles.length; i++) {
      const wp = this._weatherParticles[i];
      wp.x += wp.vx * dt;
      wp.y += wp.vy * dt;

      // Wrap around bounds
      if (wp.y > bounds.maxY * PPM) {
        wp.y = bounds.minY * PPM;
        wp.x = (Math.random() - 0.5) * (bounds.maxX - bounds.minX) * PPM;
      }
      if (wp.x < bounds.minX * PPM) {
        wp.x = bounds.maxX * PPM;
      } else if (wp.x > bounds.maxX * PPM) {
        wp.x = bounds.minX * PPM;
      }
    }
  }

  // ── Render Frame ─────────────────────────────────────────────────────────────
  public render(cameraX: number, cameraY: number): void {
    this._drawParallaxBackdrop(cameraX, cameraY);
    this._renderMechanics();
    this._renderHazards();
    this._renderWeather();
  }

  private _drawParallaxBackdrop(cx: number, cy: number): void {
    this._parallaxGfx.clear();
    const layers = this._mapDef.parallax;

    for (let l = 0; l < layers.length; l++) {
      const pl = layers[l];
      const offsetX = -cx * PPM * pl.depth;
      const offsetY = -cy * PPM * pl.depth;

      if (pl.kind === 'synth_grid') {
        const step = 60;
        this._parallaxGfx.stroke({ color: pl.color, width: 1.0, alpha: pl.alpha });
        for (let x = -900; x <= 900; x += step) {
          this._parallaxGfx.moveTo(x + offsetX, -600).lineTo(x + offsetX, 600);
        }
        for (let y = -600; y <= 600; y += step) {
          this._parallaxGfx.moveTo(-900, y + offsetY).lineTo(900, y + offsetY);
        }
      } else if (pl.kind === 'orbital_stars') {
        for (let s = 0; s < 40; s++) {
          const sx = ((s * 47) % 1800 - 900) + offsetX;
          const sy = ((s * 31) % 1200 - 600) + offsetY;
          this._parallaxGfx.circle(sx, sy, 1.5).fill({ color: pl.color, alpha: pl.alpha });
        }
      } else if (pl.kind === 'volcanic_cavern') {
        // Jagged stalactite backdrops
        this._parallaxGfx.poly([
          { x: -900, y: -400 + offsetY },
          { x: -500 + offsetX, y: -200 + offsetY },
          { x: 0 + offsetX, y: -380 + offsetY },
          { x: 500 + offsetX, y: -180 + offsetY },
          { x: 900, y: -400 + offsetY },
        ]).fill({ color: pl.color, alpha: pl.alpha });
      } else if (pl.kind === 'glacier_mirror') {
        // Crystalline ice pillars
        for (let x = -800; x <= 800; x += 180) {
          this._parallaxGfx
            .rect(x + offsetX, -500, 70, 1000)
            .fill({ color: pl.color, alpha: pl.alpha });
        }
      } else if (pl.kind === 'skyline_rain') {
        // Distant high-rise silhouettes
        for (let b = -850; b <= 850; b += 140) {
          const h = 250 + ((b * 13) % 200);
          this._parallaxGfx
            .rect(b + offsetX, 400 - h + offsetY, 100, h)
            .fill({ color: pl.color, alpha: pl.alpha });
        }
      }
    }
  }

  private _renderMechanics(): void {
    this._mechanicsGfx.clear();

    // 1. Moving platforms render
    for (let i = 0; i < this._movingPlatforms.length; i++) {
      const mp = this._movingPlatforms[i];
      const pos = mp.body.translation();
      mp.gfx.clear();
      mp.gfx.x = pos.x * PPM;
      mp.gfx.y = pos.y * PPM;
      const pw = mp.w * PPM;
      const ph = mp.h * PPM;
      mp.gfx
        .roundRect(-pw / 2, -ph / 2, pw, ph, 4)
        .fill({ color: 0x181830, alpha: 0.95 })
        .stroke({ color: this._mapDef.palette.accent, width: 2.2 });
    }

    // 2. Crumbling platforms render
    for (let i = 0; i < this._crumblingPlatforms.length; i++) {
      const cp = this._crumblingPlatforms[i];
      cp.gfx.clear();
      if (cp.state === 'dropped') continue;

      const px = cp.def.x * PPM + cp.shakeOffset;
      const py = cp.def.y * PPM;
      const pw = cp.def.w * PPM;
      const ph = cp.def.h * PPM;

      const strokeCol = cp.state === 'shaking' ? 0xff2200 : this._mapDef.palette.primary;
      cp.gfx
        .roundRect(px - pw / 2, py - ph / 2, pw, ph, 3)
        .fill({ color: 0x1f1410, alpha: 0.95 })
        .stroke({ color: strokeCol, width: 2.0 });
    }

    // 3. Glass barriers render
    for (let i = 0; i < this._glassBarriers.length; i++) {
      const gb = this._glassBarriers[i];
      gb.gfx.clear();
      if (gb.shattered) continue;

      const px = gb.def.x * PPM;
      const py = gb.def.y * PPM;
      const pw = gb.def.w * PPM;
      const ph = gb.def.h * PPM;

      gb.gfx
        .rect(px - pw / 2, py - ph / 2, pw, ph)
        .fill({ color: 0x99e5ff, alpha: 0.28 })
        .stroke({ color: 0xdff9ff, width: 2.0, alpha: 0.85 });

      // Diagonal prism sheen
      gb.gfx
        .moveTo(px - pw / 2, py - ph / 2)
        .lineTo(px + pw / 2, py + ph / 2)
        .stroke({ color: 0xffffff, width: 1.0, alpha: 0.5 });
    }

    // 4. Portals render
    if (this._mapDef.portals) {
      for (let i = 0; i < this._mapDef.portals.length; i++) {
        const port = this._mapDef.portals[i];
        const rPx = port.radius * PPM;
        const pulse = Math.sin(this._timeElapsed * 4) * 2;

        this._mechanicsGfx
          .circle(port.x * PPM, port.y * PPM, rPx + pulse)
          .stroke({ color: port.color, width: 2.5, alpha: 0.9 })
          .fill({ color: port.color, alpha: 0.18 });

        this._mechanicsGfx
          .circle(port.x * PPM, port.y * PPM, (rPx + pulse) * 0.5)
          .stroke({ color: 0xffffff, width: 1.2, alpha: 0.7 });
      }
    }

    // 5. Laser gates render (with warning telegraph beam)
    if (this._mapDef.laserGates) {
      for (let i = 0; i < this._mapDef.laserGates.length; i++) {
        const lg = this._mapDef.laserGates[i];
        const cycle = this._laserTimer % lg.periodSec;
        const isLethal = cycle <= lg.activeSec;
        const isTelegraph = cycle >= lg.periodSec - lg.telegraphSec;

        const lx = lg.x * PPM;
        const ly = lg.y * PPM;
        const lw = lg.w * PPM;
        const lh = lg.h * PPM;

        if (isLethal) {
          // Lethal active laser beam
          this._mechanicsGfx
            .rect(lx - lw / 2, ly - lh / 2, lw, lh)
            .fill({ color: this._mapDef.palette.danger, alpha: 0.95 });
          // Core bright white filament
          this._mechanicsGfx
            .rect(lx - lw * 0.25, ly - lh / 2, lw * 0.5, lh)
            .fill({ color: 0xffffff, alpha: 0.95 });
        } else if (isTelegraph) {
          // Warning telegraph beam pulsing before firing
          const blink = Math.sin(this._timeElapsed * 24) > 0 ? 0.6 : 0.15;
          this._mechanicsGfx
            .rect(lx - lw * 0.3, ly - lh / 2, lw * 0.6, lh)
            .fill({ color: this._mapDef.palette.danger, alpha: blink });
        }
      }
    }

    // 6. Low gravity domes visual
    if (this._mapDef.lowGravityDomes) {
      for (let i = 0; i < this._mapDef.lowGravityDomes.length; i++) {
        const dome = this._mapDef.lowGravityDomes[i];
        const dr = dome.radius * PPM;
        this._mechanicsGfx
          .circle(dome.x * PPM, dome.y * PPM, dr)
          .stroke({ color: 0x00ff88, width: 2.0, alpha: 0.45 })
          .fill({ color: 0x00ff88, alpha: 0.05 });
      }
    }

    // 7. Ziplines render
    if (this._mapDef.ziplines) {
      for (let i = 0; i < this._mapDef.ziplines.length; i++) {
        const zip = this._mapDef.ziplines[i];
        this._mechanicsGfx
          .moveTo(zip.startX * PPM, zip.startY * PPM)
          .lineTo(zip.endX * PPM, zip.endY * PPM)
          .stroke({ color: 0xffee00, width: 2.2, alpha: 0.85 });
      }
    }

    // 8. Pendulums render
    if (this._mapDef.pendulums) {
      for (let i = 0; i < this._mapDef.pendulums.length; i++) {
        const pend = this._mapDef.pendulums[i];
        const angle = this._pendulumAngles.get(pend.id) ?? 0;
        const pivX = pend.pivotX * PPM;
        const pivY = pend.pivotY * PPM;
        const bobX = (pend.pivotX + Math.sin(angle) * pend.length) * PPM;
        const bobY = (pend.pivotY + Math.cos(angle) * pend.length) * PPM;
        const brPx = pend.bobRadius * PPM;

        // Rod
        this._mechanicsGfx
          .moveTo(pivX, pivY)
          .lineTo(bobX, bobY)
          .stroke({ color: 0x6688aa, width: 3.0 });

        // Bob
        this._mechanicsGfx
          .circle(bobX, bobY, brPx)
          .fill({ color: 0x112233 })
          .stroke({ color: this._mapDef.palette.primary, width: 2.5 });
      }
    }
  }

  private _renderHazards(): void {
    this._hazardsGfx.clear();

    // Lava surge animation
    if (this._mapDef.lavaSurge) {
      const ls = this._mapDef.lavaSurge;
      const cycle = this._lavaTimer % ls.intervalSec;
      const isSurging = cycle <= ls.surgeDurationSec;
      const isWarning = cycle >= ls.intervalSec - ls.warningSec;

      const curY = isSurging ? ls.peakY * PPM : ls.baseY * PPM;

      this._hazardsGfx
        .rect(-900, curY, 1800, 300)
        .fill({ color: this._mapDef.palette.danger, alpha: 0.75 });

      if (isWarning) {
        // Screen border warning siren
        const flash = Math.sin(this._timeElapsed * 16) > 0 ? 0.35 : 0.05;
        this._hazardsGfx
          .rect(-800, -500, 1600, 1000)
          .stroke({ color: 0xff0033, width: 14, alpha: flash });
      }
    }
  }

  private _renderWeather(): void {
    this._weatherGfx.clear();
    const w = this._mapDef.weather;

    for (let i = 0; i < this._weatherParticles.length; i++) {
      const wp = this._weatherParticles[i];
      if (w.kind === 'cyber_rain') {
        this._weatherGfx
          .moveTo(wp.x, wp.y)
          .lineTo(wp.x - 3, wp.y + 12)
          .stroke({ color: w.color, width: 1.2, alpha: w.alpha });
      } else {
        this._weatherGfx
          .circle(wp.x, wp.y, w.size)
          .fill({ color: w.color, alpha: w.alpha });
      }
    }
  }

  // ── Clean Leak-Free Destruction ─────────────────────────────────────────────
  public destroy(): void {
    // 1. Remove all created Rapier rigidbodies
    for (let i = 0; i < this._createdBodies.length; i++) {
      this._physWorld.removeRigidBody(this._createdBodies[i]);
    }
    this._createdBodies = [];
    this._createdColliders = [];

    // 2. Remove all Pixi display objects
    this._bgLayer.removeChild(this._parallaxGfx);
    this._parallaxGfx.destroy();

    this._arenaLayer.removeChild(this._mapRoot);
    this._mapRoot.destroy({ children: true });

    this._arenaLayer.removeChild(this._mechanicsGfx);
    this._mechanicsGfx.destroy();

    this._arenaLayer.removeChild(this._hazardsGfx);
    this._hazardsGfx.destroy();

    this._vfxLayer.removeChild(this._weatherGfx);
    this._weatherGfx.destroy();

    // 3. Clear all mechanic arrays
    this._movingPlatforms = [];
    this._crumblingPlatforms = [];
    this._glassBarriers = [];
    this._pendulumAngles.clear();
    this._portalCooldowns.clear();
    this._ziplineRiders.clear();
    this._weatherParticles = [];
  }
}
