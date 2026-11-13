// src/maps/arenas/HauntedCarnivalMap.ts
// Neon Haunted Carnival: Flat boardwalk brawler ground with ticket booth hurdles and circus crates.

import type { MapDefinition } from '../MapTypes';
import { PANEL_BG } from '../../types';

export const HauntedCarnivalMap: MapDefinition = {
  id: 'haunted_carnival',
  name: 'NEON HAUNTED CARNIVAL',
  subtitle: 'Flat Boardwalk Brawler // Carnival Hurdles',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -4,
    maxY:  9,
  },
  palette: {
    primary:    0xff00aa,
    secondary:  PANEL_BG,
    accent:     0xffaa00,
    danger:     0x8800ff,
    background: 0x0c0316,
  },
  parallax: [
    {
      kind: 'haunted_carnival',
      depth: 0.15,
      color: 0x220538,
      alpha: 0.7,
    },
    {
      kind: 'haunted_carnival',
      depth: 0.35,
      color: 0x5a108f,
      alpha: 0.2,
    },
  ],
  weather: {
    kind: 'carnival_confetti',
    density: 35,
    speed: { x: 12, y: -25 },
    color: 0xff00aa,
    size: 2.5,
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
    // ── Continuous Main Flat Boardwalk Floor ────────────────────────────────
    {
      id: 'carnival_main_floor',
      x: 0,
      y: 5.5,
      w: 26.0,
      h: 0.8,
      color: 0x1f0b2f,
      strokeColor: 0xff00aa,
    },

    // ── Ring Bumpers / Boundaries ───────────────────────────────────────────
    {
      id: 'bumper_left',
      x: -13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x2b0f42,
      strokeColor: 0xffaa00,
    },
    {
      id: 'bumper_right',
      x: 13.0,
      y: 4.2,
      w: 0.6,
      h: 2.0,
      color: 0x2b0f42,
      strokeColor: 0xffaa00,
    },

    // ── Ground Obstacles & Hurdles ───────────────────────────────────────────
    {
      id: 'obs_circus_left',
      x: -8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x2b0f42,
      strokeColor: 0xff00aa,
    },
    {
      id: 'obs_booth_left',
      x: -4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x3d145c,
      strokeColor: 0xffaa00,
    },
    {
      id: 'obs_marquee_center',
      x: 0,
      y: 4.5,
      w: 1.8,
      h: 1.2,
      color: 0x2b0f42,
      strokeColor: 0xff00aa,
    },
    {
      id: 'obs_booth_right',
      x: 4.5,
      y: 4.5,
      w: 1.5,
      h: 1.2,
      color: 0x3d145c,
      strokeColor: 0xffaa00,
    },
    {
      id: 'obs_circus_right',
      x: 8.0,
      y: 4.8,
      w: 1.2,
      h: 0.65,
      color: 0x2b0f42,
      strokeColor: 0xff00aa,
    },
    {
      id: 'low_carnival_vault',
      x: 0,
      y: 2.8,
      w: 3.6,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: 0xffaa00,
    },
  ],
};
