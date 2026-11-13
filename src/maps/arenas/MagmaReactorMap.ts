// src/maps/arenas/MagmaReactorMap.ts
// Magma Core Reactor: Flat volcanic brawler ground with obsidian hurdle blocks and heat-shield crates.

import type { MapDefinition } from '../MapTypes';
import { NEON_ORANGE, NEON_YELLOW, PANEL_BG } from '../../types';

export const MagmaReactorMap: MapDefinition = {
  id: 'magma_reactor',
  name: 'MAGMA CORE REACTOR',
  subtitle: 'Flat Volcanic Brawler // Obsidian Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    NEON_ORANGE,
    secondary:  PANEL_BG,
    accent:     NEON_YELLOW,
    danger:     0xff2200,
    background: 0x090403,
  },
  parallax: [
    {
      kind: 'volcanic_cavern',
      depth: 0.15,
      color: 0x330c04,
      alpha: 0.6,
    },
    {
      kind: 'volcanic_cavern',
      depth: 0.3,
      color: 0xff3300,
      alpha: 0.18,
    },
  ],
  weather: {
    kind: 'volcanic_embers',
    density: 45,
    speed: { x: 12, y: -35 },
    color: 0xff6600,
    size: 2.5,
    alpha: 0.8,
  },
  spawns: [
    { x: -6.5, y: 4.7 },
    { x:  6.5, y: 4.7 },
    { x: -2.0, y: 4.7 },
    { x:  2.0, y: 4.7 },
  ],
  powerUpNodes: [
    { x: -4.5, y: 3.4 },
    { x:  4.5, y: 3.4 },
    { x:  0.0, y: 2.2 },
  ],
  staticPlatforms: [
    // ── Continuous Main Flat Floor ──────────────────────────────────────────
    {
      id: 'magma_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: PANEL_BG,
      strokeColor: NEON_ORANGE,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x1f0a05,
      strokeColor: NEON_YELLOW,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x1f0a05,
      strokeColor: NEON_YELLOW,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_obsidian_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x1c0905,
      strokeColor: NEON_ORANGE,
    },
    {
      id: 'obs_forge_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x240d07,
      strokeColor: NEON_YELLOW,
    },
    {
      id: 'obs_reactor_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x1c0905,
      strokeColor: NEON_ORANGE,
    },
    {
      id: 'obs_forge_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x240d07,
      strokeColor: NEON_YELLOW,
    },
    {
      id: 'obs_obsidian_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x1c0905,
      strokeColor: NEON_ORANGE,
    },
    {
      id: 'low_heat_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: NEON_YELLOW,
    },
  ],
  crumblingPlatforms: [
    {
      id: 'obs_crumble_left',
      x: -2.3,
      y: 4.7,
      w: 1.2,
      h: 0.5,
      shakeDurationSec: 1.5,
      respawnDurationSec: 4.0,
    },
    {
      id: 'obs_crumble_right',
      x: 2.3,
      y: 4.7,
      w: 1.2,
      h: 0.5,
      shakeDurationSec: 1.5,
      respawnDurationSec: 4.0,
    },
  ],
};
