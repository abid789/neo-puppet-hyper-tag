// src/maps/arenas/NeonFoundryMap.ts
// Neon Cyber Foundry: Flat ground arena with industrial hurdles, crates, and barriers.
// Designed for fast horizontal puppet chasing, punching, and obstacle-vaulting tag gameplay.

import type { MapDefinition } from '../MapTypes';
import { NEON_CYAN, NEON_PINK, PANEL_BG, DARK_BG } from '../../types';
import {
  LASER_GATE_PERIOD_SEC,
  LASER_GATE_ACTIVE_SEC,
  LASER_GATE_TELEGRAPH_SEC,
} from '../../config/constants';

export const NeonFoundryMap: MapDefinition = {
  id: 'neon_foundry',
  name: 'NEON CYBER FOUNDRY',
  subtitle: 'Flat Brawler Ground // Obstacle Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    NEON_CYAN,
    secondary:  PANEL_BG,
    accent:     NEON_PINK,
    danger:     0xff0033,
    background: DARK_BG,
  },
  parallax: [
    {
      kind: 'synth_grid',
      depth: 0.15,
      color: 0x111133,
      alpha: 0.5,
    },
    {
      kind: 'synth_grid',
      depth: 0.35,
      color: 0x00ffff,
      alpha: 0.15,
    },
  ],
  weather: {
    kind: 'neon_sparks',
    density: 35,
    speed: { x: 25, y: -30 },
    color: 0x00ffff,
    size: 2.2,
    alpha: 0.75,
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
      id: 'foundry_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x1a1a38,
      strokeColor: NEON_PINK,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x1a1a38,
      strokeColor: NEON_PINK,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    // Low hurdle left
    {
      id: 'obs_hurdle_left',
      x: -8.2,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x161633,
      strokeColor: NEON_CYAN,
    },
    // Heavy crate left
    {
      id: 'obs_crate_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x1e1e3e,
      strokeColor: NEON_PINK,
    },
    // Center barrier hurdle
    {
      id: 'obs_center_barrier',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x161633,
      strokeColor: NEON_CYAN,
    },
    // Heavy crate right
    {
      id: 'obs_crate_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x1e1e3e,
      strokeColor: NEON_PINK,
    },
    // Low hurdle right
    {
      id: 'obs_hurdle_right',
      x: 8.2,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x161633,
      strokeColor: NEON_CYAN,
    },
    // Low tactical vault ledge above center
    {
      id: 'low_center_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: NEON_PINK,
    },
  ],
  conveyors: [
    {
      id: 'conveyor_left',
      x: -6.2,
      y: 5.4,
      w: 2.2,
      h: 0.2,
      speed: 3.2,
    },
    {
      id: 'conveyor_right',
      x: 6.2,
      y: 5.4,
      w: 2.2,
      h: 0.2,
      speed: -3.2,
    },
  ],
  laserGates: [
    {
      id: 'laser_center_hurdle',
      x: 0,
      y: 3.4,
      w: 0.3,
      h: 1.0,
      periodSec: LASER_GATE_PERIOD_SEC,
      activeSec: LASER_GATE_ACTIVE_SEC,
      telegraphSec: LASER_GATE_TELEGRAPH_SEC,
    },
  ],
};
