import { Container, Graphics, BlurFilter } from 'pixi.js';
import { PANEL_BG, FIXED_DT, PPM, clamp } from '../types';
import type { Transform2D } from '../types';

// Puppet body dimensions in pixels (for rendering)
const HEAD_R  = 11;
const TORSO_W = 18;
const TORSO_H = 28;
const ARM_W   = 8;
const ARM_H   = 20;
const LEG_W   = 9;
const LEG_H   = 22;

export interface PuppetLimbTransforms {
  head:       Transform2D;
  torso:      Transform2D;
  upperArmL:  Transform2D;
  lowerArmL:  Transform2D;
  upperArmR:  Transform2D;
  lowerArmR:  Transform2D;
  upperLegL:  Transform2D;
  lowerLegL:  Transform2D;
  upperLegR:  Transform2D;
  lowerLegR:  Transform2D;
}

export class PuppetSkin {
  private _root: Container;
  private _shadow: Graphics;

  private _cHead:      Container;
  private _cTorso:     Container;
  private _cUpperArmL: Container;
  private _cLowerArmL: Container;
  private _cUpperArmR: Container;
  private _cLowerArmR: Container;
  private _cUpperLegL: Container;
  private _cLowerLegL: Container;
  private _cUpperLegR: Container;
  private _cLowerLegR: Container;

  private _eyeL: Graphics;
  private _eyeR: Graphics;

  private _shieldGfx: Graphics;
  private _modeGfx: Graphics;
  private _tagFlashTimer = 0;
  private _shieldPulse = 0;

  constructor(
    parent: Container,
    colorPrimary: number,
    colorSecondary: number,
    colorVisor: number,
  ) {
    this._root = new Container();
    parent.addChild(this._root);

    // Shadow — first child (rendered behind everything)
    this._shadow = new Graphics();
    this._root.addChild(this._shadow);
    this._shadow.ellipse(0, 0, TORSO_W * 0.9, 5).fill({ color: 0x000000, alpha: 0.4 });

    // Limbs — back layer
    this._cUpperLegR = this._makeLimb(LEG_W,   LEG_H,   colorPrimary);
    this._cLowerLegR = this._makeLimb(LEG_W,   LEG_H,   colorPrimary);
    this._cUpperArmR = this._makeLimb(ARM_W,   ARM_H,   colorSecondary);
    this._cLowerArmR = this._makeLimb(ARM_W,   ARM_H,   colorSecondary);

    // Torso
    this._cTorso = this._makeLimb(TORSO_W, TORSO_H, colorPrimary);

    // Limbs — front layer
    this._cUpperLegL = this._makeLimb(LEG_W,   LEG_H,   colorPrimary);
    this._cLowerLegL = this._makeLimb(LEG_W,   LEG_H,   colorPrimary);
    this._cUpperArmL = this._makeLimb(ARM_W,   ARM_H,   colorSecondary);
    this._cLowerArmL = this._makeLimb(ARM_W,   ARM_H,   colorSecondary);

    // Head
    this._cHead = new Container();
    const headGlow = new Graphics();
    headGlow.circle(0, 0, HEAD_R + 6).fill({ color: colorPrimary, alpha: 0.25 });
    headGlow.filters = [new BlurFilter({ strength: 6, quality: 2 })];
    const headBody = new Graphics();
    headBody.circle(0, 0, HEAD_R).fill(PANEL_BG);
    headBody.circle(0, 0, HEAD_R).stroke({ color: colorPrimary, width: 2 });
    this._cHead.addChild(headGlow, headBody);

    // Eyes
    this._eyeL = new Graphics();
    this._eyeL.roundRect(-5, -3, 10, 6, 2).fill(colorVisor);
    this._eyeL.x = -7;
    this._eyeL.y = -2;
    this._cHead.addChild(this._eyeL);

    this._eyeR = new Graphics();
    this._eyeR.roundRect(-5, -3, 10, 6, 2).fill(colorVisor);
    this._eyeR.x = 3;
    this._eyeR.y = -2;
    this._cHead.addChild(this._eyeR);

    // Build draw order: back → front
    this._root.addChild(this._cUpperLegR);
    this._root.addChild(this._cLowerLegR);
    this._root.addChild(this._cUpperArmR);
    this._root.addChild(this._cLowerArmR);
    this._root.addChild(this._cTorso);
    this._root.addChild(this._cUpperLegL);
    this._root.addChild(this._cLowerLegL);
    this._root.addChild(this._cUpperArmL);
    this._root.addChild(this._cLowerArmL);
    this._root.addChild(this._cHead);

    // Phase shield visual
    this._shieldGfx = new Graphics();
    this._root.addChild(this._shieldGfx);

    // Mode visual indicators (crown, bomb core, tag grace ring, hunter reticle)
    this._modeGfx = new Graphics();
    this._root.addChild(this._modeGfx);
  }

  private _makeLimb(w: number, h: number, color: number): Container {
    const c = new Container();

    const glow = new Graphics();
    glow.roundRect(-(w / 2) - 3, -(h / 2) - 3, w + 6, h + 6, 3).fill({ color, alpha: 0.25 });
    glow.filters = [new BlurFilter({ strength: 6, quality: 2 })];

    const body = new Graphics();
    body.roundRect(-w / 2, -h / 2, w, h, 3).fill(PANEL_BG);
    body.roundRect(-w / 2, -h / 2, w, h, 3).stroke({ color, width: 2 });

    c.addChild(glow, body);
    return c;
  }

  triggerTagFlash(): void {
    this._tagFlashTimer = 0.3;
  }

  update(
    transforms: PuppetLimbTransforms,
    isDashing: boolean,
    facingRight: boolean,
    state: string,
    hasShield = false,
    hasHyperSurge = false,
    tagGraceTimer = 0,
    hasCrown = false,
    bombTimer: number | null = null,
    isIt = false,
    isStunned = false,
    isPunching = false,
    isBlocking = false,
    isStaggered = false,
  ): void {
    // Apply transforms (metres → pixels)
    this._applyTransform(this._cHead,      transforms.head);
    this._applyTransform(this._cTorso,     transforms.torso);
    this._applyTransform(this._cUpperArmL, transforms.upperArmL);
    this._applyTransform(this._cLowerArmL, transforms.lowerArmL);
    this._applyTransform(this._cUpperArmR, transforms.upperArmR);
    this._applyTransform(this._cLowerArmR, transforms.lowerArmR);
    this._applyTransform(this._cUpperLegL, transforms.upperLegL);
    this._applyTransform(this._cLowerLegL, transforms.lowerLegL);
    this._applyTransform(this._cUpperLegR, transforms.upperLegR);
    this._applyTransform(this._cLowerLegR, transforms.lowerLegR);

    // Eye squinting
    const squint = isDashing ? 0.25 : 1.0;
    this._eyeL.scale.y = squint;
    this._eyeR.scale.y = squint;

    // Eye tracking direction
    const eyeOffset = facingRight ? 2 : -2;
    this._eyeL.x = -7 + eyeOffset;
    this._eyeR.x = 3  + eyeOffset;

    // Tag flash / stun tint
    if (this._tagFlashTimer > 0) {
      this._tagFlashTimer -= FIXED_DT;
      this._root.tint = 0xff8888;
    } else if (isStunned) {
      this._root.tint = 0xffaa00;
    } else if (hasHyperSurge) {
      this._root.tint = 0x88ffff;
    } else {
      this._root.tint = 0xffffff;
    }

    const tx = transforms.torso.x * PPM;
    const ty = transforms.torso.y * PPM;
    const hx = transforms.head.x * PPM;
    const hy = transforms.head.y * PPM;

    // Phase shield render
    this._shieldPulse += 0.08;
    this._shieldGfx.clear();
    if (hasShield) {
      const radius = 34 + Math.sin(this._shieldPulse) * 2.5;
      this._shieldGfx
        .circle(tx, ty, radius)
        .fill({ color: 0x00ffff, alpha: 0.18 })
        .stroke({ color: 0x00ffff, width: 2.2, alpha: 0.85 });
      this._shieldGfx
        .circle(tx, ty, radius * 0.7)
        .stroke({ color: 0xffffff, width: 1.0, alpha: 0.45 });
    }

    // Mode visual indicators render
    this._modeGfx.clear();

    // 1. Tag transfer grace flashing holographic shield ring
    if (tagGraceTimer > 0) {
      const flash = (Math.sin(tagGraceTimer * 28) + 1) * 0.5;
      const ringAlpha = 0.3 + flash * 0.65;
      this._modeGfx
        .circle(tx, ty, 38)
        .stroke({ color: 0x00ff88, width: 2.5, alpha: ringAlpha });
      this._modeGfx
        .circle(tx, ty, 42)
        .stroke({ color: 0xffffff, width: 1.2, alpha: ringAlpha * 0.5 });
    }

    // 2. Crown Keep-Away: Floating neon crown
    if (hasCrown) {
      const crownBob = Math.sin(this._shieldPulse * 1.5) * 3;
      const cy = hy - 24 + crownBob;
      this._modeGfx
        .poly([
          { x: hx - 14, y: cy },
          { x: hx - 10, y: cy + 10 },
          { x: hx + 10, y: cy + 10 },
          { x: hx + 14, y: cy },
          { x: hx + 7,  y: cy + 5 },
          { x: hx,      y: cy - 3 },
          { x: hx - 7,  y: cy + 5 },
        ])
        .fill({ color: 0xffee00, alpha: 0.9 })
        .stroke({ color: 0xffaa00, width: 2.0 });
    }

    // 3. Hot Bomb Tag: Pulsing Neon Core on torso
    if (bombTimer !== null) {
      const urgency = clamp(1 - bombTimer / 15, 0, 1);
      const pulseSpeed = 10 + urgency * 20;
      const bPulse = (Math.sin(this._shieldPulse * pulseSpeed) + 1) * 0.5;
      const bombR = 10 + bPulse * 4;

      this._modeGfx
        .circle(tx, ty, bombR)
        .fill({ color: 0xff0033, alpha: 0.85 })
        .stroke({ color: 0xffffff, width: 2.0, alpha: 0.95 });
    }

    // 4. Hunter / IT indicator
    if (isIt) {
      const arrY = hy - 32 + Math.sin(this._shieldPulse * 2) * 3;
      this._modeGfx
        .poly([
          { x: hx,      y: arrY + 8 },
          { x: hx - 8,  y: arrY },
          { x: hx + 8,  y: arrY },
        ])
        .fill({ color: 0xff0066, alpha: 0.95 })
        .stroke({ color: 0xffffff, width: 1.5 });
    }

    // 5. Stun dizzy stars
    if (isStunned) {
      for (let s = 0; s < 3; s++) {
        const starAngle = this._shieldPulse * 3 + (s * Math.PI * 2) / 3;
        const sx = hx + Math.cos(starAngle) * 16;
        const sy = hy - 10 + Math.sin(starAngle) * 6;
        this._modeGfx.circle(sx, sy, 2.5).fill({ color: 0xffee00, alpha: 0.9 });
      }
    }

    // 6. Block Defensive Energy Barrier
    if (isBlocking) {
      const shieldOffset = facingRight ? 18 : -18;
      this._modeGfx
        .roundRect(tx + shieldOffset - 4, ty - 18, 8, 36, 4)
        .fill({ color: 0x00ffff, alpha: 0.65 })
        .stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
    }

    // 7. Punch Energy Fist / Strike Burst
    if (isPunching) {
      const fistOffset = facingRight ? 24 : -24;
      this._modeGfx
        .circle(tx + fistOffset, ty - 2, 7)
        .fill({ color: 0xff0066, alpha: 0.9 })
        .stroke({ color: 0xffffff, width: 1.5 });
    }

    // 8. Stagger Dizzy / Stumble Stars
    if (isStaggered && !isStunned) {
      for (let s = 0; s < 2; s++) {
        const starAngle = this._shieldPulse * 4 + s * Math.PI;
        const sx = hx + Math.cos(starAngle) * 14;
        const sy = hy - 14 + Math.sin(starAngle) * 5;
        this._modeGfx.circle(sx, sy, 2.0).fill({ color: 0xffaadd, alpha: 0.85 });
      }
    }

    // Suppress unused warning for state; could be used for future states
    void state;

    // Shadow — position at floor level
    const torsoYPx = transforms.torso.y * PPM;
    const floorYPx = 8 * PPM;
    this._shadow.x = transforms.torso.x * PPM;
    this._shadow.y = floorYPx - 2;
    const shadowScaleX = clamp(1 - (8 - transforms.torso.y) * 0.08, 0.2, 1);
    this._shadow.scale.x = shadowScaleX;
    void torsoYPx;
  }

  private _applyTransform(container: Container, t: Transform2D): void {
    container.x        = t.x * PPM;
    container.y        = t.y * PPM;
    container.rotation = t.rotation;
  }
}
