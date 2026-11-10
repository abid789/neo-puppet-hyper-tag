// src/graphics/Lighting.ts
// Dynamic neon point-light and ambient emission system for NEO-PUPPET: HYPER TAG.

import { Container, Graphics, BlurFilter, type Application } from 'pixi.js';
import { PPM } from '../types';
import type { ITrackedEntity } from '../types';

export interface PointLight {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
}

export class LightingSystem {
  private readonly _gfx: Graphics;
  private readonly _blur: BlurFilter;
  private _customLights: PointLight[] = [];

  constructor(lightLayer: Container, _app: Application) {
    this._gfx = new Graphics();
    lightLayer.addChild(this._gfx);

    lightLayer.blendMode = 'add';
    this._blur = new BlurFilter({
      strength: 28,
      quality: 3,
    });
    lightLayer.filters = [this._blur];
  }

  public addLight(x: number, y: number, radius: number, color: number, intensity: number): void {
    this._customLights.push({ x, y, radius, color, intensity });
  }

  public clearLights(): void {
    this._customLights = [];
    this._gfx.clear();
  }

  public update(_alpha: number, entities: ITrackedEntity[]): void {
    this._gfx.clear();

    // 1. Arena subtle ambient backdrop emission
    this._gfx
      .circle(0, 0, 500)
      .fill({ color: 0x00ffff, alpha: 0.035 });

    // 2. Entity lights (neon glow surrounding puppets)
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      const pos = e.getWorldPosition();
      const px = pos.x * PPM;
      const py = pos.y * PPM;
      const col = e.getColorPrimary();
      const state = e.getState();

      const boost = state === 'dashing' ? 1.6 : state === 'tagged' ? 2.0 : 1.0;
      const radius = (85 + (state === 'dashing' ? 30 : 0)) * boost;
      const alpha = 0.22 * boost;

      // Outer soft aura
      this._gfx
        .circle(px, py, radius)
        .fill({ color: col, alpha });

      // Intense inner core glow
      this._gfx
        .circle(px, py, radius * 0.45)
        .fill({ color: 0xffffff, alpha: alpha * 0.5 });
    }

    // 3. Custom point lights (e.g., spark impacts, special effects)
    for (let i = 0; i < this._customLights.length; i++) {
      const l = this._customLights[i];
      this._gfx
        .circle(l.x, l.y, l.radius)
        .fill({ color: l.color, alpha: l.intensity });
    }
  }
}
