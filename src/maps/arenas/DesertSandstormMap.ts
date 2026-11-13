// src/maps/arenas/DesertSandstormMap.ts
// Desert Sandstorm Ruins: Flat desert brawler ground with ancient sandstone hurdles and weathered dune crates.

import type { MapDefinition } from '../MapTypes';
import { PANEL_BG } from '../../types';

export const DesertSandstormMap: MapDefinition = {
  id: 'desert_sandstorm',
  name: 'DESERT SANDSTORM RUINS',
  subtitle: 'Flat Desert Brawler // Sandstone Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    0xffaa00,
    secondary:  PANEL_BG,
    accent:     0xff5500,
    danger:     0xcc3300,
    background: 0x140a04,
  },
  parallax: [
    {
      kind: 'desert_dunes',
      depth: 0.15,
      color: 0x241105,
      alpha: 0.7,
    },
    {
      kind: 'desert_dunes',
      depth: 0.35,
      color: 0x54260a,
      alpha: 0.2,
    },
  ],
  weather: {
    kind: 'sandstorm',
    density: 45,
    speed: { x: -45, y: -8 },
    color: 0xffbb44,
    size: 2.5,
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
    // ── Continuous Main Flat Desert Floor ───────────────────────────────────
    {
      id: 'desert_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: 0x2e1a0b,
      strokeColor: 0xffaa00,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x382210,
      strokeColor: 0xff5500,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x382210,
      strokeColor: 0xff5500,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_sandstone_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x382210,
      strokeColor: 0xffaa00,
    },
    {
      id: 'obs_crate_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x472a14,
      strokeColor: 0xff5500,
    },
    {
      id: 'obs_shrine_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x382210,
      strokeColor: 0xffaa00,
    },
    {
      id: 'obs_crate_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x472a14,
      strokeColor: 0xff5500,
    },
    {
      id: 'obs_sandstone_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x382210,
      strokeColor: 0xffaa00,
    },
    {
      id: 'low_desert_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: 0xffaa00,
    },
  ],
};
