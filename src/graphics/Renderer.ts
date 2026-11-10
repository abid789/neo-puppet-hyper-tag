// src/graphics/Renderer.ts
// Initialises PixiJS v8 and builds all render layers for NEO-PUPPET: HYPER TAG.

import { Application, Container, Graphics, BlurFilter } from 'pixi.js';
import type { Filter } from 'pixi.js';
import { DARK_BG, PANEL_BG, NEON_CYAN, PPM } from '../types';
import type { RendererLayers } from '../types';
import { createVignetteScanlineFilter } from './Shaders';
import type { GraphicsPreset } from '../core/SettingsManager';

export class Renderer {
  public app!: Application;
  public layers!: RendererLayers;
  public customMapActive = false;

  private _mountEl: HTMLElement;

  constructor(mountEl: HTMLElement) {
    this._mountEl = mountEl;
  }

  // ── Initialisation ──────────────────────────────────────────────────────────

  public async init(): Promise<void> {
    this.app = new Application();

    await this.app.init({
      resizeTo:        window,
      antialias:       true,
      resolution:      window.devicePixelRatio || 1,
      autoDensity:     true,
      backgroundAlpha: 1,
      background:      DARK_BG,
    });

    this._mountEl.appendChild(this.app.canvas);

    this._buildLayers();
    this._buildArenaBackground();

    // Vignette + scanline post-process over the whole stage.
    const { filter: vigFilter } = createVignetteScanlineFilter(true);
    // Keep uResY in sync with actual screen height.
    this._syncVignetteRes(vigFilter);
    this.app.stage.filters = [vigFilter];

    window.addEventListener('resize', this._onResize);
  }

  // ── Layer construction ──────────────────────────────────────────────────────

  private _buildLayers(): void {
    const makeLayer = (): Container => {
      const c = new Container();
      this.app.stage.addChild(c);
      return c;
    };

    this.layers = {
      backgroundLayer: makeLayer(),
      arenaLayer:      makeLayer(),
      shadowLayer:     makeLayer(),
      trailLayer:      makeLayer(),
      entityLayer:     makeLayer(),
      lightingLayer:   makeLayer(),
      vfxLayer:        makeLayer(),
      uiOverlayLayer:  makeLayer(),
    };
  }

  // ── Arena background ────────────────────────────────────────────────────────

  private _buildArenaBackground(): void {
    // ── Background layer ────────────────────────────────────────────────────
    const bg = this.layers.backgroundLayer;
    // Clear previous draws each time we rebuild (resize).
    bg.removeChildren();

    const W = this.app.screen.width;
    const H = this.app.screen.height;

    // --- Solid dark fill --------------------------------------------------
    const fill = new Graphics();
    fill.rect(0, 0, W, H).fill({ color: DARK_BG, alpha: 1 });
    bg.addChild(fill);

    // --- Grid lines -------------------------------------------------------
    const grid = new Graphics();
    const GRID_SPACING = 50;
    const GRID_COLOR   = 0x111133;

    // Horizontal lines
    for (let y = 0; y <= H; y += GRID_SPACING) {
      grid
        .moveTo(0, y)
        .lineTo(W, y)
        .stroke({ color: GRID_COLOR, alpha: 0.4, width: 1 });
    }
    // Vertical lines
    for (let x = 0; x <= W; x += GRID_SPACING) {
      grid
        .moveTo(x, 0)
        .lineTo(x, H)
        .stroke({ color: GRID_COLOR, alpha: 0.4, width: 1 });
    }
    bg.addChild(grid);

    // --- Floor accent line -----------------------------------------------
    const floorY   = 8 * PPM; // 400 px
    const floorLine = new Graphics();
    floorLine
      .moveTo(0, floorY)
      .lineTo(W, floorY)
      .stroke({ color: NEON_CYAN, alpha: 0.6, width: 2 });
    bg.addChild(floorLine);

    // --- Radial glow circles (deep background atmosphere) ----------------
    const cx = W / 2;
    const cy = H / 2;
    const radii = [Math.max(W, H) * 0.9, Math.max(W, H) * 0.6, Math.max(W, H) * 0.35];

    for (const r of radii) {
      const glow = new Graphics();
      glow.circle(cx, cy, r).fill({ color: NEON_CYAN, alpha: 0.015 });

      // Soft blur makes it look like a real glow rather than a hard circle.
      glow.filters = [new BlurFilter({ strength: 40, quality: 3 })];
      bg.addChild(glow);
    }

    // ── Arena layer ─────────────────────────────────────────────────────────
    if (!this.customMapActive) {
      const arena = this.layers.arenaLayer;
      arena.removeChildren();

      const floorPlatform = new Graphics();
      const platformH = 20;
      floorPlatform
        .roundRect(0, floorY, W, platformH, 4)
        .fill({ color: PANEL_BG, alpha: 1 })
        .stroke({ color: NEON_CYAN, width: 2 });
      arena.addChild(floorPlatform);
    }
  }

  public setCustomMapActive(active: boolean): void {
    this.customMapActive = active;
    if (active) {
      this.layers.arenaLayer.removeChildren();
    }
  }

  public setGraphicsPreset(preset: GraphicsPreset): void {
    if (preset === 'Esports') {
      this.app.stage.filters = [];
      this.layers.lightingLayer.visible = false;
      this.setResolutionScale(1.0);
    } else if (preset === 'Low Spec') {
      this.app.stage.filters = [];
      this.layers.lightingLayer.visible = false;
      this.setResolutionScale(0.75);
    } else if (preset === 'Mobile') {
      this.app.stage.filters = [];
      this.layers.lightingLayer.visible = false;
      this.setResolutionScale(0.75);
    } else if (preset === 'Balanced' || preset === 'High') {
      const { filter: vigFilter } = createVignetteScanlineFilter(false);
      this._syncVignetteRes(vigFilter);
      this.app.stage.filters = [vigFilter];
      this.layers.lightingLayer.visible = true;
      this.setResolutionScale(1.0);
    } else {
      // 'Max Quality', 'Ultra', or 'Custom'
      const { filter: vigFilter } = createVignetteScanlineFilter(true);
      this._syncVignetteRes(vigFilter);
      this.app.stage.filters = [vigFilter];
      this.layers.lightingLayer.visible = true;
      this.setResolutionScale(1.0);
    }
  }

  public setResolutionScale(scale: number): void {
    try {
      const baseDpr = window.devicePixelRatio || 1;
      const targetRes = Math.max(0.5, Math.min(1.0, scale)) * baseDpr;
      if (this.app && this.app.renderer) {
        this.app.renderer.resolution = targetRes;
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
      }
    } catch {
      /* noop */
    }
  }

  // ── Resize handling ─────────────────────────────────────────────────────────

  private _onResize = (): void => {
    this._buildArenaBackground();
    // Keep vignette resolution uniform up to date.
    if (this.app.stage.filters && this.app.stage.filters.length > 0) {
      this._syncVignetteRes(this.app.stage.filters[0] as Filter);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private _syncVignetteRes(filter: Filter): void {
    try {
      const ub = filter.resources['vigUniforms'] as unknown as {
        uniforms: Record<string, unknown>;
      };
      ub.uniforms['uResY'] = this.app.screen.height;
    } catch {
      // Not a vignette filter — ignore.
    }
  }

  // ── Public accessors ────────────────────────────────────────────────────────

  public get width(): number {
    return this.app.screen.width;
  }

  public get height(): number {
    return this.app.screen.height;
  }
}
