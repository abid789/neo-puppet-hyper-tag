// src/maps/arenas/DesertSandstormMap.ts
// Sand-dune arena with a dusty orange and gold palette.
// Features periodic sandstorm gusts pushing puppets sideways, floating sandstone pillars,
// and quicksand patches that slow movement.

import type { MapDefinition } from '../MapTypes';

export const DesertSandstormMap: MapDefinition = {
  id: 'desert_sandstorm',
  name: 'DESERT SANDSTORM',
  subtitle: 'Anbar Wastelands // Sector Dune-04',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
  },
  palette: {
    primary:    0xffaa00, // Solar amber gold
    secondary:  0x2e1a0b, // Sunbaked sandstone
    accent:     0xff5500, // Thermal flare
    danger:     0xff2200, // Quicksand hazard warning
    background: 0x120a04, // Deep desert horizon
  },
  parallax: [
    {
      kind: 'desert_dunes',
      depth: 0.16,
      color: 0x3d200d,
      alpha: 0.65,
    },
    {
      kind: 'desert_dunes',
      depth: 0.35,
      color: 0xffaa00,
      alpha: 0.18,
    },
  ],
  weather: {
    kind: 'sandstorm',
    density: 60,
    speed: { x: 85, y: 12 },
    color: 0xffbb44,
    size: 2.5,
    alpha: 0.7,
  },
  spawns: [
    { x: -8.0, y: 3.8 },
    { x:  8.0, y: 3.8 },
    { x: -3.5, y: -0.5 },
    { x:  3.5, y: -0.5 },
  ],
  powerUpNodes: [
    { x:   0, y: -3.5 },
    { x:  -7, y:  0.2 },
    { x:   7, y:  0.2 },
  ],
  staticPlatforms: [
    // Base dune ground left
    {
      id: 'dune_floor_left',
      x: -9.0,
      y: 8.2,
      w: 8.5,
      h: 0.7,
      color: 0x2e1a0b,
      strokeColor: 0xffaa00,
    },
    // Base dune ground right
    {
      id: 'dune_floor_right',
      x: 9.0,
      y: 8.2,
      w: 8.5,
      h: 0.7,
      color: 0x2e1a0b,
      strokeColor: 0xffaa00,
    },
    // Central ancient shrine dais
    {
      id: 'ancient_shrine_dais',
      x: 0,
      y: 7.0,
      w: 5.5,
      h: 0.5,
      color: 0x382210,
      strokeColor: 0xffaa00,
    },
    // Floating stone pillars
    {
      id: 'pillar_mid_left',
      x: -7.5,
      y: 2.2,
      w: 4.2,
      h: 0.45,
      color: 0x2e1a0b,
      strokeColor: 0xff5500,
    },
    {
      id: 'pillar_mid_right',
      x: 7.5,
      y: 2.2,
      w: 4.2,
      h: 0.45,
      color: 0x2e1a0b,
      strokeColor: 0xff5500,
    },
    // High sky pillar platform
    {
      id: 'high_sky_pillar',
      x: 0,
      y: -2.2,
      w: 5.0,
      h: 0.45,
      color: 0x382210,
      strokeColor: 0xffaa00,
    },
    // Flanking outpost towers
    {
      id: 'outpost_tower_left',
      x: -12.5,
      y: -0.5,
      w: 3.5,
      h: 0.4,
      color: 0x2e1a0b,
      strokeColor: 0xffaa00,
    },
    {
      id: 'outpost_tower_right',
      x: 12.5,
      y: -0.5,
      w: 3.5,
      h: 0.4,
      color: 0x2e1a0b,
      strokeColor: 0xffaa00,
    },
  ],
  movingPlatforms: [
    // Floating obelisk that drifts horizontally across the upper gorge
    {
      id: 'floating_obelisk',
      x: 0,
      y: 0.2,
      w: 4.0,
      h: 0.4,
      waypoints: [
        { x: -3.5, y: 0.2 },
        { x:  3.5, y: 0.2 },
      ],
      speed: 1.8,
      color: 0x472a14,
    },
  ],
  windGusts: {
    intervalSec: 11.0,
    warningSec: 2.5,
    durationSec: 3.8,
    force: { x: -18.0, y: -2.5 }, // Sandstorm gust sweep
  },
  slowZones: [
    // Quicksand patch on left desert floor
    {
      id: 'quicksand_left',
      x: -4.0,
      y: 7.8,
      w: 3.2,
      h: 1.8,
      factor: 0.45,
      color: 0xcc8800,
    },
    // Quicksand patch on right desert floor
    {
      id: 'quicksand_right',
      x: 4.0,
      y: 7.8,
      w: 3.2,
      h: 1.8,
      factor: 0.45,
      color: 0xcc8800,
    },
  ],
  jumpPads: [
    // Thermal sand updraft vents
    {
      id: 'thermal_updraft_left',
      x: -11.5,
      y: 7.8,
      w: 2.0,
      h: 0.3,
      impulse: { x: 5.0, y: -18.0 },
      color: 0xffaa00,
    },
    {
      id: 'thermal_updraft_right',
      x: 11.5,
      y: 7.8,
      w: 2.0,
      h: 0.3,
      impulse: { x: -5.0, y: -18.0 },
      color: 0xffaa00,
    },
  ],
  hazardZones: [
    // Bottom abyss fall zone
    {
      id: 'dune_chasm',
      x: 0,
      y: 9.4,
      w: 30,
      h: 1.5,
      type: 'void',
      respawnTarget: { x: 0, y: 4.0 },
    },
  ],
};
