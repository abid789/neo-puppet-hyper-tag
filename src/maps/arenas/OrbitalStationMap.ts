// src/maps/arenas/OrbitalStationMap.ts
// Zero-G Orbital Station: Flat deep space brawler ground with grounded airlock crates and solar hurdles.

import type { MapDefinition } from '../MapTypes';
import { NEON_GREEN, NEON_CYAN, NEON_PINK, PANEL_BG } from '../../types';
import { LOW_GRAVITY_DOME_SCALE } from '../../config/constants';

export const OrbitalStationMap: MapDefinition = {
  id: 'orbital_station',
  name: 'ZERO-G ORBITAL STATION',
  subtitle: 'Flat Space Brawler // Low-G Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    NEON_GREEN,
    secondary:  PANEL_BG,
    accent:     NEON_CYAN,
    danger:     NEON_PINK,
    background: 0x02030a,
  },
  parallax: [
    {
      kind: 'orbital_stars',
      depth: 0.05,
      color: 0x88bbff,
      alpha: 0.65,
    },
    {
      kind: 'orbital_stars',
      depth: 0.2,
      color: 0x00ff88,
      alpha: 0.35,
    },
  ],
  weather: {
    kind: 'orbital_dust',
    density: 30,
    speed: { x: -8, y: -12 },
    color: 0x88ffff,
    size: 2.0,
    alpha: 0.6,
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
      id: 'orbital_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: PANEL_BG,
      strokeColor: NEON_GREEN,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x101a28,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x101a28,
      strokeColor: NEON_CYAN,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_battery_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x0e1c2b,
      strokeColor: NEON_GREEN,
    },
    {
      id: 'obs_airlock_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x132438,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'obs_core_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x0e1c2b,
      strokeColor: NEON_GREEN,
    },
    {
      id: 'obs_airlock_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x132438,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'obs_battery_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x0e1c2b,
      strokeColor: NEON_GREEN,
    },
    {
      id: 'low_satellite_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
  ],
  lowGravityDomes: [
    {
      id: 'central_zero_g_chamber',
      x: 0,
      y: 4.0,
      radius: 4.8,
      scale: LOW_GRAVITY_DOME_SCALE,
    },
  ],
  portals: [
    {
      id: 'teleporter_alpha',
      x: -11.0,
      y: 4.7,
      targetX: 11.0,
      targetY: 4.7,
      radius: 0.8,
      color: NEON_CYAN,
      cooldownSec: 2.0,
    },
    {
      id: 'teleporter_beta',
      x: 11.0,
      y: 4.7,
      targetX: -11.0,
      targetY: 4.7,
      radius: 0.8,
      color: NEON_PINK,
      cooldownSec: 2.0,
    },
  ],
};
