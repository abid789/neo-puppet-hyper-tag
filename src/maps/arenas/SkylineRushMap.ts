// src/maps/arenas/SkylineRushMap.ts
// Skyline Rooftop Rush: Flat skyscraper rooftop brawler ground with HVAC duct hurdles and ventilation crates.

import type { MapDefinition } from '../MapTypes';
import { NEON_PURPLE, NEON_PINK, NEON_CYAN, PANEL_BG } from '../../types';

export const SkylineRushMap: MapDefinition = {
  id: 'skyline_rush',
  name: 'SKYLINE ROOFTOP RUSH',
  subtitle: 'Flat Skyscraper Rooftop // HVAC Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    NEON_PURPLE,
    secondary:  PANEL_BG,
    accent:     NEON_PINK,
    danger:     NEON_CYAN,
    background: 0x070412,
  },
  parallax: [
    {
      kind: 'skyline_rain',
      depth: 0.15,
      color: 0x140a28,
      alpha: 0.65,
    },
    {
      kind: 'skyline_rain',
      depth: 0.35,
      color: 0xaa00ff,
      alpha: 0.15,
    },
  ],
  weather: {
    kind: 'cyber_rain',
    density: 40,
    speed: { x: 18, y: 65 },
    color: 0xaa66ff,
    size: 2.0,
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
    // ── Continuous Main Flat Rooftop Floor ──────────────────────────────────
    {
      id: 'skyline_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: 0x110b24,
      strokeColor: NEON_PURPLE,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x180d33,
      strokeColor: NEON_PINK,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x180d33,
      strokeColor: NEON_PINK,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_duct_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x181033,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'obs_hvac_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x221345,
      strokeColor: NEON_PINK,
    },
    {
      id: 'obs_vent_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x181033,
      strokeColor: NEON_PURPLE,
    },
    {
      id: 'obs_hvac_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x221345,
      strokeColor: NEON_PINK,
    },
    {
      id: 'obs_duct_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x181033,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'low_skyline_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: NEON_PINK,
    },
  ],
};
