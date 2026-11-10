// src/entities/Puppet.ts
// Articulated ragdoll puppet powered by Rapier2D physics with PD balance and procedural locomotion.

import type RAPIER from '@dimforge/rapier2d-compat';
import { Container } from 'pixi.js';
import {
  PPM,
  clamp,
  lerpTransform,
  createInputState,
  KEYMAP_P1,
  KEYMAP_P2,
} from '../types';
import type {
  Vec2,
  Transform2D,
  InputState,
  PuppetConfig,
  PuppetState,
  ITrackedEntity,
  KeyMap,
  PowerUpType,
  ActivePowerUp,
} from '../types';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { PuppetSkin, type PuppetLimbTransforms } from './PuppetSkins';
import type { ParticleSystem } from '../graphics/Particles';

// Puppet physics dimensions in metres
const HEAD_R = 0.22;
const TORSO_HH = 0.28;
const TORSO_R = 0.14;
const ARM_HH = 0.18;
const ARM_R = 0.07;
const LEG_HH = 0.19;
const LEG_R = 0.08;

interface PuppetBodies {
  head: RAPIER.RigidBody;
  torso: RAPIER.RigidBody;
  upperArmL: RAPIER.RigidBody;
  lowerArmL: RAPIER.RigidBody;
  upperArmR: RAPIER.RigidBody;
  lowerArmR: RAPIER.RigidBody;
  upperLegL: RAPIER.RigidBody;
  lowerLegL: RAPIER.RigidBody;
  upperLegR: RAPIER.RigidBody;
  lowerLegR: RAPIER.RigidBody;
}

interface LimbTransformPair {
  prev: Transform2D;
  curr: Transform2D;
}

export class Puppet implements ITrackedEntity {
  private readonly _physWorld: PhysicsWorld;
  private readonly _particles: ParticleSystem;
  private readonly _cfg: PuppetConfig;
  private readonly _skin: PuppetSkin;
  private readonly _bodies: PuppetBodies;
  private readonly _transforms: Record<keyof PuppetBodies, LimbTransformPair>;

  private _state: PuppetState = 'idle';
  private _input: InputState = createInputState();
  private _facingRight = true;
  private _grounded = false;

  private _jumpCooldown = 0;
  private _dashCooldown = 0;
  private _dashActive = false;
  private _dashTimer = 0;
  private _walkPhase = 0;
  private _backflipTimer = 0;

  private _speedMultiplier = 1.0;
  private _conveyorVx = 0;
  private _lowGravityActive = false;
  private _lowGravityScale = 0.35;
  private _phaseShieldActive = false;
  private _activePowerUp: ActivePowerUp | null = null;
  private _electricSparkTimer = 0;

  // ── Phase 3: Match State, AI, and Fair-Play Fields ─────────────────────────
  private _isBot = false;
  private _botInput: InputState = createInputState();
  private _stunTimer = 0;
  private _inputFrozen = false;
  private _tagGraceShieldTimer = 0;
  private _isIt = false;
  private _hasCrown = false;
  private _bombTimer: number | null = null;
  private _dashCooldownMultiplier = 1.0;
  private _slowdownMultiplier = 1.0;
  private _invertControlsTimer = 0;
  private _isEliminated = false;

  private readonly _keyMap: KeyMap;
  private readonly _keysDown: Set<string> = new Set();

  constructor(
    physWorld: PhysicsWorld,
    particles: ParticleSystem,
    cfg: PuppetConfig,
    layer: Container,
  ) {
    this._physWorld = physWorld;
    this._particles = particles;
    this._cfg = cfg;

    this._keyMap = cfg.playerIndex === 0 ? KEYMAP_P1 : KEYMAP_P2;

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // Build ragdoll rigidbodies and joints
    this._bodies = this._build(cfg.x, cfg.y);

    // Initialize transform history pairs
    this._transforms = {
      head: this._initTransform(this._bodies.head),
      torso: this._initTransform(this._bodies.torso),
      upperArmL: this._initTransform(this._bodies.upperArmL),
      lowerArmL: this._initTransform(this._bodies.lowerArmL),
      upperArmR: this._initTransform(this._bodies.upperArmR),
      lowerArmR: this._initTransform(this._bodies.lowerArmR),
      upperLegL: this._initTransform(this._bodies.upperLegL),
      lowerLegL: this._initTransform(this._bodies.lowerLegL),
      upperLegR: this._initTransform(this._bodies.upperLegR),
      lowerLegR: this._initTransform(this._bodies.lowerLegR),
    };

    this._skin = new PuppetSkin(
      layer,
      cfg.colorPrimary,
      cfg.colorSecondary,
      cfg.colorVisor,
    );
  }

  private _initTransform(body: RAPIER.RigidBody): LimbTransformPair {
    const t = body.translation();
    const tr: Transform2D = { x: t.x, y: t.y, rotation: body.rotation() };
    return { prev: { ...tr }, curr: { ...tr } };
  }

  private _build(x: number, y: number): PuppetBodies {
    const pw = this._physWorld;

    // 1. Torso (core root body)
    const torso = pw.createDynamicBody(x, y, 0.45, 2.5);
    pw.addCapsuleCollider(torso, TORSO_HH, TORSO_R, 1.2, 0.3);

    // 2. Head
    const head = pw.createDynamicBody(x, y - 0.55, 0.55, 3.5);
    pw.addBallCollider(head, HEAD_R, 0.8, 0.2);

    // 3. Arms (left & right)
    const upperArmL = pw.createDynamicBody(x - 0.28, y - 0.1, 0.3, 1.5);
    pw.addCapsuleCollider(upperArmL, ARM_HH, ARM_R, 0.5, 0.2);

    const lowerArmL = pw.createDynamicBody(x - 0.28, y + 0.28, 0.3, 1.5);
    pw.addCapsuleCollider(lowerArmL, ARM_HH, ARM_R, 0.4, 0.2);

    const upperArmR = pw.createDynamicBody(x + 0.28, y - 0.1, 0.3, 1.5);
    pw.addCapsuleCollider(upperArmR, ARM_HH, ARM_R, 0.5, 0.2);

    const lowerArmR = pw.createDynamicBody(x + 0.28, y + 0.28, 0.3, 1.5);
    pw.addCapsuleCollider(lowerArmR, ARM_HH, ARM_R, 0.4, 0.2);

    // 4. Legs (left & right)
    const upperLegL = pw.createDynamicBody(x - 0.12, y + 0.42, 0.4, 1.8);
    pw.addCapsuleCollider(upperLegL, LEG_HH, LEG_R, 0.7, 0.4);

    const lowerLegL = pw.createDynamicBody(x - 0.12, y + 0.8, 0.4, 1.8);
    pw.addCapsuleCollider(lowerLegL, LEG_HH, LEG_R, 0.6, 0.6);

    const upperLegR = pw.createDynamicBody(x + 0.12, y + 0.42, 0.4, 1.8);
    pw.addCapsuleCollider(upperLegR, LEG_HH, LEG_R, 0.7, 0.4);

    const lowerLegR = pw.createDynamicBody(x + 0.12, y + 0.8, 0.4, 1.8);
    pw.addCapsuleCollider(lowerLegR, LEG_HH, LEG_R, 0.6, 0.6);

    // ── Articulation Joints ──────────────────────────────────────────────────────
    // Neck: Head <-> Torso
    pw.createRevoluteJoint(head, torso, { x: 0, y: 0.22 }, { x: 0, y: -0.26 }, -0.3, 0.3);

    // Left Arm: Torso <-> UpperArmL <-> LowerArmL
    pw.createRevoluteJoint(torso, upperArmL, { x: -0.14, y: -0.2 }, { x: 0, y: -0.18 }, -1.5, 0.8);
    pw.createRevoluteJoint(upperArmL, lowerArmL, { x: 0, y: 0.18 }, { x: 0, y: -0.18 }, -0.2, 2.1);

    // Right Arm: Torso <-> UpperArmR <-> LowerArmR
    pw.createRevoluteJoint(torso, upperArmR, { x: 0.14, y: -0.2 }, { x: 0, y: -0.18 }, -0.8, 1.5);
    pw.createRevoluteJoint(upperArmR, lowerArmR, { x: 0, y: 0.18 }, { x: 0, y: -0.18 }, -2.1, 0.2);

    // Left Leg: Torso <-> UpperLegL <-> LowerLegL
    pw.createRevoluteJoint(torso, upperLegL, { x: -0.1, y: 0.26 }, { x: 0, y: -0.19 }, -1.1, 1.1);
    pw.createSpringJoint(
      upperLegL,
      lowerLegL,
      { x: 0, y: 0.19 },
      { x: 0, y: -0.19 },
      -0.1,
      1.8,
      0.25,
      75,
      10,
    );

    // Right Leg: Torso <-> UpperLegR <-> LowerLegR
    pw.createRevoluteJoint(torso, upperLegR, { x: 0.1, y: 0.26 }, { x: 0, y: -0.19 }, -1.1, 1.1);
    pw.createSpringJoint(
      upperLegR,
      lowerLegR,
      { x: 0, y: 0.19 },
      { x: 0, y: -0.19 },
      -0.1,
      1.8,
      0.25,
      75,
      10,
    );

    return {
      head,
      torso,
      upperArmL,
      lowerArmL,
      upperArmR,
      lowerArmR,
      upperLegL,
      lowerLegL,
      upperLegR,
      lowerLegR,
    };
  }

  public fixedUpdate(dt: number): void {
    // 1. Gather input state (human or bot)
    if (this._isBot) {
      this._input.moveLeft = this._botInput.moveLeft;
      this._input.moveRight = this._botInput.moveRight;
      this._input.jump = this._botInput.jump;
      this._input.dash = this._botInput.dash;
      this._input.attack = this._botInput.attack;
    } else {
      this._input.moveLeft = this._keysDown.has(this._keyMap.moveLeft);
      this._input.moveRight = this._keysDown.has(this._keyMap.moveRight);
      this._input.jump = this._keysDown.has(this._keyMap.jump);
      this._input.dash = this._keysDown.has(this._keyMap.dash);
      this._input.attack = this._keysDown.has(this._keyMap.attack);
    }

    // Freeze inputs during stun or match intro countdown or elimination
    if (this._stunTimer > 0 || this._inputFrozen || this._isEliminated) {
      this._input.moveLeft = false;
      this._input.moveRight = false;
      this._input.jump = false;
      this._input.dash = false;
      this._input.attack = false;
    } else if (this._invertControlsTimer > 0) {
      this._invertControlsTimer = Math.max(0, this._invertControlsTimer - dt);
      const temp = this._input.moveLeft;
      this._input.moveLeft = this._input.moveRight;
      this._input.moveRight = temp;
    }

    if (this._stunTimer > 0) {
      this._stunTimer = Math.max(0, this._stunTimer - dt);
    }
    if (this._tagGraceShieldTimer > 0) {
      this._tagGraceShieldTimer = Math.max(0, this._tagGraceShieldTimer - dt);
    }

    // 2. Power-Up timer & effects
    if (this._activePowerUp) {
      this._activePowerUp.remainingTime -= dt;
      if (this._activePowerUp.type === 'hyper_surge') {
        this._speedMultiplier = 1.35;
        this._electricSparkTimer -= dt;
        if (this._electricSparkTimer <= 0) {
          this._electricSparkTimer = 0.04;
          const pos = this._bodies.torso.translation();
          this._particles.emit({
            x: pos.x * PPM + (Math.random() - 0.5) * 16,
            y: pos.y * PPM + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            life: 0.2,
            size: 3,
            color: 0x00ffff,
            alpha: 0.9,
            kind: 'spark',
            gravity: 0,
          });
        }
      }
      if (this._activePowerUp.remainingTime <= 0) {
        if (this._activePowerUp.type === 'hyper_surge') {
          this._speedMultiplier = 1.0;
        }
        this._activePowerUp = null;
      }
    }

    // Low-gravity compensation
    if (this._lowGravityActive) {
      // Offset downward gravity to 35% of normal
      const counterImpulse = (1 - this._lowGravityScale) * 22 * 1.2 * dt;
      this._bodies.torso.applyImpulse({ x: 0, y: -counterImpulse }, true);
    }

    // 3. Cooldowns & timers
    this._jumpCooldown = Math.max(0, this._jumpCooldown - dt);
    this._dashCooldown = Math.max(0, this._dashCooldown - dt);
    if (this._backflipTimer > 0) {
      this._backflipTimer = Math.max(0, this._backflipTimer - dt);
    }

    if (this._dashActive) {
      this._dashTimer -= dt;
      if (this._dashTimer <= 0) {
        this._dashActive = false;
      }
    }

    // 4. Ground detection
    this._grounded = this._physWorld.isGrounded(this._bodies.torso, 0.85);

    const torso = this._bodies.torso;
    const linvel = torso.linvel();

    // 5. Locomotion logic
    if (this._input.moveLeft || this._input.moveRight) {
      this._facingRight = this._input.moveRight;
      const targetSpeed = (this._facingRight ? 5.5 : -5.5) * this._speedMultiplier * this._slowdownMultiplier + this._conveyorVx;
      const velDiff = targetSpeed - linvel.x;
      torso.applyImpulse({ x: velDiff * 0.48, y: 0 }, true);

      if (this._grounded && !this._dashActive && this._backflipTimer <= 0) {
        this._state = 'walking';
      }
    } else {
      if (this._grounded) {
        // Friction / braking
        const brakingTarget = this._conveyorVx;
        torso.applyImpulse({ x: (brakingTarget - linvel.x) * 0.28, y: 0 }, true);
        if (!this._dashActive && this._backflipTimer <= 0) {
          this._state = 'idle';
        }
      } else {
        if (!this._dashActive && this._backflipTimer <= 0) {
          this._state = linvel.y > 0.5 ? 'falling' : 'jumping';
        }
      }
    }

    // Reset frame-based conveyor influence and environmental slowdown
    this._conveyorVx = 0;
    this._slowdownMultiplier = 1.0;

    // 5. Jump
    if (this._input.jump && this._grounded && this._jumpCooldown <= 0) {
      torso.applyImpulse({ x: 0, y: -11.5 }, true);
      this._jumpCooldown = 0.28;
      this._state = 'jumping';
      this._emitJumpDust();
    }

    // 6. Dash
    if (this._input.dash && this._dashCooldown <= 0 && !this._dashActive && this._stunTimer <= 0) {
      const dir = this._facingRight ? 1 : -1;
      torso.applyImpulse({ x: dir * 9.0, y: -2.0 }, true);
      this._dashCooldown = 0.9 * this._dashCooldownMultiplier;
      this._dashActive = true;
      this._dashTimer = 0.24;
      this._state = 'dashing';
      this._emitDashTrail();
    }

    // 7. Backflip check (air reverse or trigger)
    if (
      !this._grounded &&
      this._input.jump &&
      this._jumpCooldown <= 0 &&
      this._backflipTimer <= 0
    ) {
      this.triggerBackflip();
    }

    // 8. PD Upright Balance Torque
    this._applyUprightTorque(dt, linvel.x);

    // 9. Procedural walk cycle forces
    if (this._grounded && this._state === 'walking') {
      this._applyWalkCycle(dt, linvel.x);
    }

    // 10. Record ribbon trail during dash
    const pos = torso.translation();
    if (this._dashActive) {
      this._particles.addTrailPoint(
        this._cfg.playerIndex,
        pos.x * PPM,
        pos.y * PPM,
        this._cfg.colorPrimary,
        14,
      );
    }

    // 11. Save physics transforms for render interpolation
    this._updateTransformHistory();
  }

  private _applyUprightTorque(dt: number, vx: number): void {
    const torso = this._bodies.torso;
    const curAngle = torso.rotation();
    const curAngVel = torso.angvel();

    if (this._backflipTimer > 0) {
      // During active backflip, let rotation spin freely
      return;
    }

    // Dynamic lean: lean forward into movement
    let targetAngle = 0;
    if (this._dashActive) {
      targetAngle = this._facingRight ? 0.28 : -0.28;
    } else if (Math.abs(vx) > 0.5) {
      targetAngle = this._facingRight ? 0.12 : -0.12;
    }

    // PD Controller formula: Torque = Kp * error - Kd * angularVelocity
    const error = targetAngle - curAngle;
    const kp = 650;
    const kd = 60;
    const torque = kp * error - kd * curAngVel;

    torso.applyTorqueImpulse(torque * dt * dt, true);
  }

  private _applyWalkCycle(dt: number, vx: number): void {
    const speedNorm = clamp(Math.abs(vx) / 5.0, 0, 1.2);
    this._walkPhase += dt * Math.PI * 2 * (2.8 * speedNorm);

    const hipAmp = 2.4 * speedNorm;
    const armAmp = 1.6 * speedNorm;

    const leftHipTorque = Math.sin(this._walkPhase) * hipAmp;
    const rightHipTorque = -Math.sin(this._walkPhase) * hipAmp;

    this._bodies.upperLegL.applyTorqueImpulse(leftHipTorque * dt, true);
    this._bodies.upperLegR.applyTorqueImpulse(rightHipTorque * dt, true);

    // Counter-swing arms
    this._bodies.upperArmL.applyTorqueImpulse(-leftHipTorque * armAmp * 0.4 * dt, true);
    this._bodies.upperArmR.applyTorqueImpulse(-rightHipTorque * armAmp * 0.4 * dt, true);
  }

  public triggerBackflip(): void {
    const dir = this._facingRight ? -1 : 1;
    this._bodies.torso.applyImpulse({ x: dir * 4.5, y: -6.5 }, true);
    this._bodies.torso.applyTorqueImpulse(dir * 14.0, true);
    this._backflipTimer = 0.55;
    this._state = 'backflipping';
    this._jumpCooldown = 0.5;

    // Spark burst on backflip
    const pos = this._bodies.torso.translation();
    this._particles.emitBurst(16, {
      x: pos.x * PPM,
      y: pos.y * PPM,
      vx: dir * 50,
      vy: -60,
      life: 0.35,
      size: 4,
      color: this._cfg.colorPrimary,
      alpha: 0.9,
      kind: 'spark',
      gravity: 40,
    });
  }

  public applyTag(): void {
    if (this.consumePhaseShield()) {
      return; // Phase shield successfully absorbed the tag!
    }

    this._state = 'tagged';
    this._skin.triggerTagFlash();
    this.triggerBackflip();

    // Shockwave burst of sparks
    const pos = this._bodies.torso.translation();
    this._particles.emitBurst(28, {
      x: pos.x * PPM,
      y: pos.y * PPM,
      vx: 0,
      vy: -40,
      life: 0.5,
      size: 5,
      color: 0xff0066,
      alpha: 1.0,
      kind: 'spark',
      gravity: 50,
    }, 120);
  }

  private _emitJumpDust(): void {
    const pos = this._bodies.torso.translation();
    const groundY = pos.y * PPM + 38;
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * (Math.PI * 0.7);
      const speed = 25 + Math.random() * 55;
      this._particles.emit({
        x: pos.x * PPM + (Math.random() - 0.5) * 16,
        y: groundY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5,
        life: 0.35 + Math.random() * 0.2,
        size: 3 + Math.random() * 4,
        color: 0x6666aa,
        alpha: 0.55,
        kind: 'dust',
        gravity: 30,
      });
    }
  }

  private _emitDashTrail(): void {
    const pos = this._bodies.torso.translation();
    const dir = this._facingRight ? -1 : 1;
    for (let i = 0; i < 14; i++) {
      this._particles.emit({
        x: pos.x * PPM + dir * 12 + (Math.random() - 0.5) * 10,
        y: pos.y * PPM + (Math.random() - 0.5) * 22,
        vx: dir * (50 + Math.random() * 70),
        vy: (Math.random() - 0.5) * 45,
        life: 0.24 + Math.random() * 0.15,
        size: 3 + Math.random() * 3,
        color: this._cfg.colorPrimary,
        alpha: 0.95,
        kind: 'spark',
        gravity: 0,
      });
    }
  }

  private _updateTransformHistory(): void {
    const keys = Object.keys(this._bodies) as (keyof PuppetBodies)[];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const body = this._bodies[k];
      const t = body.translation();
      const pair = this._transforms[k];
      pair.prev.x = pair.curr.x;
      pair.prev.y = pair.curr.y;
      pair.prev.rotation = pair.curr.rotation;

      pair.curr.x = t.x;
      pair.curr.y = t.y;
      pair.curr.rotation = body.rotation();
    }
  }

  public render(alpha: number): void {
    // Interpolate transforms for butter-smooth visual rendering at any refresh rate
    const interp: PuppetLimbTransforms = {
      head: lerpTransform(this._transforms.head.prev, this._transforms.head.curr, alpha),
      torso: lerpTransform(this._transforms.torso.prev, this._transforms.torso.curr, alpha),
      upperArmL: lerpTransform(this._transforms.upperArmL.prev, this._transforms.upperArmL.curr, alpha),
      lowerArmL: lerpTransform(this._transforms.lowerArmL.prev, this._transforms.lowerArmL.curr, alpha),
      upperArmR: lerpTransform(this._transforms.upperArmR.prev, this._transforms.upperArmR.curr, alpha),
      lowerArmR: lerpTransform(this._transforms.lowerArmR.prev, this._transforms.lowerArmR.curr, alpha),
      upperLegL: lerpTransform(this._transforms.upperLegL.prev, this._transforms.upperLegL.curr, alpha),
      lowerLegL: lerpTransform(this._transforms.lowerLegL.prev, this._transforms.lowerLegL.curr, alpha),
      upperLegR: lerpTransform(this._transforms.upperLegR.prev, this._transforms.upperLegR.curr, alpha),
      lowerLegR: lerpTransform(this._transforms.lowerLegR.prev, this._transforms.lowerLegR.curr, alpha),
    };

    this._skin.update(
      interp,
      this._dashActive,
      this._facingRight,
      this._state,
      this._phaseShieldActive,
      this._activePowerUp?.type === 'hyper_surge',
      this._tagGraceShieldTimer,
      this._hasCrown,
      this._bombTimer,
      this._isIt,
      this._stunTimer > 0,
    );
  }

  // ── Phase 3 Fair-Play & Game Mode Methods ──────────────────────────────────
  public getCurrentInput(): InputState {
    return { ...this._input };
  }

  public setBotInput(input: InputState): void {
    this._isBot = true;
    this._botInput = { ...input };
  }

  public setStun(durationSec: number): void {
    this._stunTimer = durationSec;
    const v = this._bodies.torso.linvel();
    this._bodies.torso.applyImpulse({ x: -v.x * 0.8, y: 0 }, true);
  }

  public isStunned(): boolean {
    return this._stunTimer > 0;
  }

  public setInputFrozen(frozen: boolean): void {
    this._inputFrozen = frozen;
  }

  public setTagGraceShield(durationSec: number): void {
    this._tagGraceShieldTimer = durationSec;
  }

  public hasTagGraceShield(): boolean {
    return this._tagGraceShieldTimer > 0;
  }

  public setIsIt(isIt: boolean): void {
    this._isIt = isIt;
  }

  public isIt(): boolean {
    return this._isIt;
  }

  public setHasCrown(hasCrown: boolean): void {
    this._hasCrown = hasCrown;
    this._dashCooldownMultiplier = hasCrown ? 0.8 : 1.0; // 20% cooldown reduction
  }

  public hasCrown(): boolean {
    return this._hasCrown;
  }

  public setBombTimer(timer: number | null): void {
    this._bombTimer = timer;
  }

  public getBombTimer(): number | null {
    return this._bombTimer;
  }

  public setDashCooldownMultiplier(mult: number): void {
    this._dashCooldownMultiplier = mult;
  }

  public getLinvel(): Vec2 {
    const v = this._bodies.torso.linvel();
    return { x: v.x, y: v.y };
  }

  public isAirborne(): boolean {
    return !this._grounded;
  }

  public resetMatchState(): void {
    this._isIt = false;
    this._hasCrown = false;
    this._bombTimer = null;
    this._stunTimer = 0;
    this._tagGraceShieldTimer = 0;
    this._inputFrozen = false;
    this._dashCooldownMultiplier = 1.0;
    this._activePowerUp = null;
    this._phaseShieldActive = false;
    this._speedMultiplier = 1.0;
    this.resetLocomotion();
  }

  // ── Environmental & Power-Up methods ───────────────────────────────────────
  public applyImpulse(impulse: Vec2): void {
    this._bodies.torso.applyImpulse({ x: impulse.x, y: impulse.y }, true);
  }

  public teleport(x: number, y: number): void {
    const curTorso = this._bodies.torso.translation();
    const dx = x - curTorso.x;
    const dy = y - curTorso.y;

    const keys = Object.keys(this._bodies) as (keyof PuppetBodies)[];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const body = this._bodies[k];
      const t = body.translation();
      const newX = t.x + dx;
      const newY = t.y + dy;

      body.setTranslation({ x: newX, y: newY }, true);
      body.setLinvel({ x: 0, y: 0 }, true);
      body.setAngvel(0, true);

      this._transforms[k].prev.x = newX;
      this._transforms[k].prev.y = newY;
      this._transforms[k].curr.x = newX;
      this._transforms[k].curr.y = newY;
    }
  }

  public isDashing(): boolean {
    return this._dashActive;
  }

  public setConveyorVelocity(vx: number): void {
    this._conveyorVx = vx;
  }

  public setLowGravity(active: boolean, scale = 0.35): void {
    this._lowGravityActive = active;
    this._lowGravityScale = scale;
  }

  public hasPhaseShield(): boolean {
    return this._phaseShieldActive;
  }

  public consumePhaseShield(): boolean {
    if (!this._phaseShieldActive) return false;
    this._phaseShieldActive = false;

    const pos = this._bodies.torso.translation();
    this._particles.emitBurst(24, {
      x: pos.x * PPM,
      y: pos.y * PPM,
      vx: 0,
      vy: 0,
      life: 0.4,
      size: 5,
      color: 0x00ffff,
      alpha: 1.0,
      kind: 'spark',
      gravity: 0,
    }, 140);

    return true;
  }

  public applyPowerUp(type: PowerUpType, durationSec: number): void {
    this._activePowerUp = {
      type,
      remainingTime: durationSec,
      maxDuration: durationSec,
    };

    if (type === 'hyper_surge') {
      this._speedMultiplier = 1.35;
    } else if (type === 'phase_shield') {
      this._phaseShieldActive = true;
    }
  }

  public getSpeedMultiplier(): number {
    return this._speedMultiplier;
  }

  public getActivePowerUp(): ActivePowerUp | null {
    return this._activePowerUp;
  }

  public getTorsoBody(): RAPIER.RigidBody {
    return this._bodies.torso;
  }

  public getAllBodies(): RAPIER.RigidBody[] {
    return Object.values(this._bodies);
  }

  public getPlayerIndex(): number {
    return this._cfg.playerIndex;
  }

  public resetLocomotion(): void {
    this._conveyorVx = 0;
    this._lowGravityActive = false;
    this._slowdownMultiplier = 1.0;
    this._invertControlsTimer = 0;
    this._isEliminated = false;
  }

  public setSlowdown(factor: number): void {
    this._slowdownMultiplier = Math.min(this._slowdownMultiplier, factor);
  }

  public invertControls(durationSec = 2.0): void {
    this._invertControlsTimer = Math.max(this._invertControlsTimer, durationSec);
    const pos = this._bodies.torso.translation();
    this._particles.emitBurst(12, {
      x: pos.x * PPM,
      y: pos.y * PPM - 20,
      vx: 0,
      vy: -30,
      life: 0.35,
      size: 3.5,
      color: 0xff00aa,
      alpha: 1.0,
      kind: 'spark',
      gravity: 0,
    });
  }

  public isControlsInverted(): boolean {
    return this._invertControlsTimer > 0;
  }

  public eliminate(): void {
    if (this._isEliminated) return;
    this._isEliminated = true;
    this.setInputFrozen(true);
    this._state = 'tagged';
    this._skin.triggerTagFlash();
    this.triggerBackflip();

    // Ragdoll blast out of arena
    const dir = (Math.random() - 0.5) * 22;
    this._bodies.torso.applyImpulse({ x: dir, y: -26 }, true);
    this._bodies.torso.applyTorqueImpulse((Math.random() - 0.5) * 35, true);

    const pos = this._bodies.torso.translation();
    this._particles.emitBurst(32, {
      x: pos.x * PPM,
      y: pos.y * PPM,
      vx: dir * 5,
      vy: -50,
      life: 0.6,
      size: 5,
      color: 0xff0033,
      alpha: 1.0,
      kind: 'spark',
      gravity: 60,
    }, 150);
  }

  public isEliminated(): boolean {
    return this._isEliminated;
  }

  public resetElimination(): void {
    this._isEliminated = false;
    this.setInputFrozen(false);
  }

  // ── ITrackedEntity implementation ──────────────────────────────────────────
  public getWorldPosition(): Vec2 {
    const t = this._bodies.torso.translation();
    return { x: t.x, y: t.y };
  }

  public getState(): PuppetState {
    return this._state;
  }

  public getColorPrimary(): number {
    return this._cfg.colorPrimary;
  }

  // ── Keyboard event callbacks ───────────────────────────────────────────────
  private _onKeyDown = (e: KeyboardEvent): void => {
    this._keysDown.add(e.code);
  };

  private _onKeyUp = (e: KeyboardEvent): void => {
    this._keysDown.delete(e.code);
  };

  public destroy(): void {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
