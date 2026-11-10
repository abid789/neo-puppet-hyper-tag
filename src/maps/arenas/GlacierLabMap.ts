// src/maps/arenas/GlacierLabMap.ts
// Glacier Mirror Lab: Low-friction ice surfaces (mu = 0.02), shatterable glass barriers
// that fragment when dashed through, and heavy swinging cryo-pendulums.

import type { MapDefinition } from '../MapTypes';
import { NEON_CYAN, PANEL_BG } from '../../types';

export const GlacierLabMap: MapDefinition = {
  id: 'glacier_lab',
  name: 'GLACIER MIRROR LAB',
  subtitle: 'Sub-Zero Cryogenics Facility // Deep Frost Sector',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
  },
  palette: {
    primary:    NEON_CYAN,
    secondary:  PANEL_BG,
    accent:     0xd8f8ff,
    danger:     0x0066ff,
    background: 0x040813,
  },
  parallax: [
    {
      kind: 'glacier_mirror',
      depth: 0.12,
      color: 0x081830,
      alpha: 0.65,
    },
    {
      kind: 'glacier_mirror',
      depth: 0.28,
      color: 0x00e1ff,
      alpha: 0.2,
    },
  ],
  weather: {
    kind: 'cryo_frost',
    density: 45,
    speed: { x: -8, y: 35 },
    color: 0xdbf9ff,
    size: 2.2,
    alpha: 0.7,
  },
  spawns: [
    { x: -8, y: 3.5 },
    { x:  8, y: 3.5 },
    { x: -6, y: 1.5 },
    { x:  6, y: 1.5 },
  ],
  powerUpNodes: [
    { x:  0, y: -2.2 },
    { x: -5, y:  1.0 },
    { x:  5, y:  1.0 },
  ],
  staticPlatforms: [
    // Low-friction ice base platforms (friction = 0.02)
    {
      id: 'ice_shelf_left',
      x: -8.0,
      y: 7.8,
      w: 8.5,
      h: 0.55,
      friction: 0.02,
      color: 0x0e243b,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'ice_shelf_right',
      x: 8.0,
      y: 7.8,
      w: 8.5,
      h: 0.55,
      friction: 0.02,
      color: 0x0e243b,
      strokeColor: NEON_CYAN,
    },
    // Mid-level lab bridges (also slippery ice)
    {
      id: 'cryo_bridge_left',
      x: -7.0,
      y: 2.4,
      w: 6.0,
      h: 0.45,
      friction: 0.03,
      color: 0x122c45,
      strokeColor: 0xa8f0ff,
    },
    {
      id: 'cryo_bridge_right',
      x: 7.0,
      y: 2.4,
      w: 6.0,
      h: 0.45,
      friction: 0.03,
      color: 0x122c45,
      strokeColor: 0xa8f0ff,
    },
    // Central observation platform
    {
      id: 'central_pedestal',
      x: 0,
      y: 4.8,
      w: 4.5,
      h: 0.5,
      friction: 0.04,
      color: 0x0e243b,
      strokeColor: NEON_CYAN,
    },
    // Upper cryogenic freezer ledge
    {
      id: 'upper_freezer_dock',
      x: 0,
      y: -1.0,
      w: 8.0,
      h: 0.45,
      friction: 0.03,
      color: 0x122c45,
      strokeColor: 0xa8f0ff,
    },
  ],
  glassBarriers: [
    // Breakable reinforced glass screens blocking high-speed lanes
    {
      id: 'glass_barrier_left',
      x: -3.8,
      y: 2.4,
      w: 0.35,
      h: 2.8,
      shardCount: 16,
    },
    {
      id: 'glass_barrier_right',
      x: 3.8,
      y: 2.4,
      w: 0.35,
      h: 2.8,
      shardCount: 16,
    },
  ],
  pendulums: [
    // Heavy swinging cryo-pendulum sweeping across the center lane
    {
      id: 'cryo_pendulum_center',
      pivotX: 0,
      pivotY: -3.5,
      length: 6.5,
      bobRadius: 0.75,
      speed: 2.0,
      maxAngle: 0.7, // ~40 degrees
    },
  ],
  hazardZones: [
    {
      id: 'liquid_nitrogen_abyss',
      x: 0,
      y: 9.8,
      w: 32,
      h: 2.0,
      type: 'cryo',
      respawnTarget: { x: 0, y: 1.5 },
    },
  ],
};
