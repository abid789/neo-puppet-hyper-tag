// src/maps/arenas/UnderwaterRuinsMap.ts
// Submerged stone ruins with blue-green palette.
// Features slow buoyant platforms drifting vertically, bubble vents launching puppets upward,
// and a sunken archway that slows movement.

import type { MapDefinition } from '../MapTypes';

export const UnderwaterRuinsMap: MapDefinition = {
  id: 'underwater_ruins',
  name: 'UNDERWATER RUINS',
  subtitle: 'Submerged Abyssal Temple // Depth 420m',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
  },
  palette: {
    primary:    0x00ffc2, // Bioluminescent aquamarine
    secondary:  0x0a2628, // Sunken ancient basalt
    accent:     0x00e5ff, // Hydro-electric cyan
    danger:     0xff0055, // Abyssal thermal vent warning
    background: 0x031215, // Deep sea abyss
  },
  parallax: [
    {
      kind: 'underwater_ruins',
      depth: 0.18,
      color: 0x052226,
      alpha: 0.7,
    },
    {
      kind: 'underwater_ruins',
      depth: 0.38,
      color: 0x00ffc2,
      alpha: 0.18,
    },
  ],
  weather: {
    kind: 'bubbles',
    density: 50,
    speed: { x: 6, y: -50 },
    color: 0x66ffff,
    size: 3.5,
    alpha: 0.65,
  },
  spawns: [
    { x: -7.5, y: 4.0 },
    { x:  7.5, y: 4.0 },
    { x: -3.5, y: 0.0 },
    { x:  3.5, y: 0.0 },
  ],
  powerUpNodes: [
    { x:   0, y: -3.2 },
    { x:  -8, y: -0.5 },
    { x:   8, y: -0.5 },
  ],
  staticPlatforms: [
    // Seabed floor left & right
    {
      id: 'seabed_left',
      x: -8.5,
      y: 8.2,
      w: 9.0,
      h: 0.65,
      color: 0x0a2628,
      strokeColor: 0x00ffc2,
    },
    {
      id: 'seabed_right',
      x: 8.5,
      y: 8.2,
      w: 9.0,
      h: 0.65,
      color: 0x0a2628,
      strokeColor: 0x00ffc2,
    },
    // Central sunken altar platform
    {
      id: 'sunken_altar',
      x: 0,
      y: 7.2,
      w: 5.0,
      h: 0.5,
      color: 0x0d3336,
      strokeColor: 0x00e5ff,
    },
    // Mid temple ledges
    {
      id: 'temple_tier_left',
      x: -9.0,
      y: 2.6,
      w: 5.2,
      h: 0.45,
      color: 0x0a2628,
      strokeColor: 0x00ffc2,
    },
    {
      id: 'temple_tier_right',
      x: 9.0,
      y: 2.6,
      w: 5.2,
      h: 0.45,
      color: 0x0a2628,
      strokeColor: 0x00ffc2,
    },
    // Upper sanctum arch top
    {
      id: 'high_sanctum_beam',
      x: 0,
      y: -2.0,
      w: 6.5,
      h: 0.45,
      color: 0x0d3336,
      strokeColor: 0x00ffc2,
    },
    // Side perches
    {
      id: 'perch_left',
      x: -12.5,
      y: -0.2,
      w: 3.5,
      h: 0.4,
      color: 0x0a2628,
      strokeColor: 0x00e5ff,
    },
    {
      id: 'perch_right',
      x: 12.5,
      y: -0.2,
      w: 3.5,
      h: 0.4,
      color: 0x0a2628,
      strokeColor: 0x00e5ff,
    },
  ],
  movingPlatforms: [
    // Slow buoyant platform left (drifts up and down gently)
    {
      id: 'buoyant_platform_left',
      x: -4.5,
      y: 2.8,
      w: 3.6,
      h: 0.4,
      waypoints: [
        { x: -4.5, y: 3.8 },
        { x: -4.5, y: 1.0 },
      ],
      speed: 1.2,
      color: 0x0f3d40,
    },
    // Slow buoyant platform right
    {
      id: 'buoyant_platform_right',
      x: 4.5,
      y: 1.2,
      w: 3.6,
      h: 0.4,
      waypoints: [
        { x: 4.5, y: 1.0 },
        { x: 4.5, y: 3.8 },
      ],
      speed: 1.2,
      color: 0x0f3d40,
    },
    // Upper buoyant sanctum lift
    {
      id: 'buoyant_platform_center',
      x: 0,
      y: 0.2,
      w: 3.2,
      h: 0.4,
      waypoints: [
        { x: 0, y: 1.2 },
        { x: 0, y: -0.8 },
      ],
      speed: 0.9,
      color: 0x0f3d40,
    },
  ],
  steamVents: [
    // High-pressure bubble vents on seabed edges
    {
      id: 'bubble_vent_left',
      x: -9.5,
      y: 8.0,
      w: 2.4,
      h: 5.0,
      periodSec: 4.2,
      activeSec: 2.6,
      impulse: { x: 0, y: -19.0 },
    },
    {
      id: 'bubble_vent_right',
      x: 9.5,
      y: 8.0,
      w: 2.4,
      h: 5.0,
      periodSec: 4.2,
      activeSec: 2.6,
      impulse: { x: 0, y: -19.0 },
    },
  ],
  slowZones: [
    // Sunken stone archway that creates water drag, slowing puppets to 50% speed
    {
      id: 'sunken_archway',
      x: 0,
      y: 5.2,
      w: 6.2,
      h: 3.5,
      factor: 0.52,
      color: 0x00ffc2,
    },
  ],
  hazardZones: [
    // Thermal trench gap in the center floor
    {
      id: 'abyssal_trench',
      x: 0,
      y: 9.2,
      w: 4.0,
      h: 1.6,
      type: 'lava',
      respawnTarget: { x: 0, y: 4.0 },
    },
  ],
};
