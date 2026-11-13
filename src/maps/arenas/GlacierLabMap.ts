// src/maps/arenas/GlacierLabMap.ts
// Sub-Zero Cryo Lab: Flat slippery ice brawler ground with breakable glass hurdles and cryo-tanks.

import type { MapDefinition } from '../MapTypes';
import { NEON_CYAN, PANEL_BG } from '../../types';

export const GlacierLabMap: MapDefinition = {
  id: 'glacier_lab',
  name: 'SUB-ZERO CRYO LAB',
  subtitle: 'Flat Ice Brawler // Glass & Cryo Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    NEON_CYAN,
    secondary:  PANEL_BG,
    accent:     0xa8f0ff,
    danger:     0x0088ff,
    background: 0x030810,
  },
  parallax: [
    {
      kind: 'glacier_mirror',
      depth: 0.15,
      color: 0x061524,
      alpha: 0.65,
    },
    {
      kind: 'glacier_mirror',
      depth: 0.3,
      color: 0x00e5ff,
      alpha: 0.15,
    },
  ],
  weather: {
    kind: 'cryo_frost',
    density: 40,
    speed: { x: -35, y: 20 },
    color: 0xccffff,
    size: 2.2,
    alpha: 0.7,
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
    // ── Continuous Main Flat Ice Floor ──────────────────────────────────────
    {
      id: 'glacier_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      friction: 0.035, // Slippery ice physics
      color: 0x0e243b,
      strokeColor: NEON_CYAN,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x0e243b,
      strokeColor: 0xa8f0ff,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x0e243b,
      strokeColor: 0xa8f0ff,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_ice_block_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      friction: 0.04,
      color: 0x122c45,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'obs_cryo_tank_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      friction: 0.04,
      color: 0x163450,
      strokeColor: 0xa8f0ff,
    },
    {
      id: 'obs_freezer_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      friction: 0.04,
      color: 0x122c45,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'obs_cryo_tank_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      friction: 0.04,
      color: 0x163450,
      strokeColor: 0xa8f0ff,
    },
    {
      id: 'obs_ice_block_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      friction: 0.04,
      color: 0x122c45,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'low_ice_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      friction: 0.04,
      color: PANEL_BG,
      strokeColor: 0xa8f0ff,
    },
  ],
  glassBarriers: [
    {
      id: 'glass_barrier_left',
      x: -2.3,
      y: 4.6,
      w: 0.35,
      h: 1.2,
      shardCount: 14,
    },
    {
      id: 'glass_barrier_right',
      x: 2.3,
      y: 4.6,
      w: 0.35,
      h: 1.2,
      shardCount: 14,
    },
  ],
};
