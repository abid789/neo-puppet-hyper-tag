// src/maps/arenas/UnderwaterRuinsMap.ts
// Sunken Cyber Ruins: Flat seabed brawler ground with ancient stone hurdles and coral reef blocks.

import type { MapDefinition } from '../MapTypes';
import { PANEL_BG } from '../../types';

export const UnderwaterRuinsMap: MapDefinition = {
  id: 'underwater_ruins',
  name: 'SUNKEN CYBER RUINS',
  subtitle: 'Flat Seabed Brawler // Coral & Stone Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    0x00ffc2,
    secondary:  PANEL_BG,
    accent:     0x00e5ff,
    danger:     0x0066cc,
    background: 0x021118,
  },
  parallax: [
    {
      kind: 'underwater_ruins',
      depth: 0.15,
      color: 0x052229,
      alpha: 0.7,
    },
    {
      kind: 'underwater_ruins',
      depth: 0.35,
      color: 0x00b4d8,
      alpha: 0.2,
    },
  ],
  weather: {
    kind: 'bubbles',
    density: 35,
    speed: { x: 2, y: -25 },
    color: 0x72efdd,
    size: 2.8,
    alpha: 0.65,
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
    // ── Continuous Main Flat Seabed Floor ───────────────────────────────────
    {
      id: 'seabed_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: 0x0a2628,
      strokeColor: 0x00ffc2,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x0d3336,
      strokeColor: 0x00e5ff,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x0d3336,
      strokeColor: 0x00e5ff,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_coral_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x0d3336,
      strokeColor: 0x00ffc2,
    },
    {
      id: 'obs_ruin_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x114246,
      strokeColor: 0x00e5ff,
    },
    {
      id: 'obs_altar_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x0d3336,
      strokeColor: 0x00ffc2,
    },
    {
      id: 'obs_ruin_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x114246,
      strokeColor: 0x00e5ff,
    },
    {
      id: 'obs_coral_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x0d3336,
      strokeColor: 0x00ffc2,
    },
    {
      id: 'low_aquatic_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: 0x00e5ff,
    },
  ],
};
