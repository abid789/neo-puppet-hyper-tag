// src/maps/arenas/SkylineRushMap.ts
// Skyline Rooftop Rush: High-altitude neon rooftops in driving cyberpunk rain,
// featuring overhead ziplines, springboard antennas, and periodic lateral wind gusts.

import type { MapDefinition } from '../MapTypes';
import { NEON_PURPLE, NEON_CYAN, NEON_PINK, PANEL_BG } from '../../types';

export const SkylineRushMap: MapDefinition = {
  id: 'skyline_rush',
  name: 'SKYLINE ROOFTOP RUSH',
  subtitle: 'Megacity District 42 // Altitude 850m // Storm Advisory',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
  },
  palette: {
    primary:    NEON_PURPLE,
    secondary:  PANEL_BG,
    accent:     NEON_CYAN,
    danger:     NEON_PINK,
    background: 0x05030d,
  },
  parallax: [
    {
      kind: 'skyline_rain',
      depth: 0.1,
      color: 0x120a24,
      alpha: 0.65,
    },
    {
      kind: 'skyline_rain',
      depth: 0.3,
      color: 0x280e50,
      alpha: 0.35,
    },
  ],
  weather: {
    kind: 'cyber_rain',
    density: 65,
    speed: { x: -25, y: 180 },
    color: 0x00ffff,
    size: 2.0,
    alpha: 0.75,
  },
  spawns: [
    { x: -9, y: 3.5 },
    { x:  9, y: 3.5 },
    { x:  0, y: 4.5 },
    { x: -6, y: -0.5 },
  ],
  powerUpNodes: [
    { x:  0, y: -2.0 },
    { x: -7, y:  0.5 },
    { x:  7, y:  0.5 },
  ],
  staticPlatforms: [
    // Rooftop buildings with huge gap jumps
    {
      id: 'rooftop_west_tower',
      x: -10.0,
      y: 7.2,
      w: 7.0,
      h: 0.6,
      color: 0x110b24,
      strokeColor: NEON_PURPLE,
    },
    {
      id: 'rooftop_east_tower',
      x: 10.0,
      y: 7.2,
      w: 7.0,
      h: 0.6,
      color: 0x110b24,
      strokeColor: NEON_PURPLE,
    },
    // Central air vent rooftop
    {
      id: 'rooftop_center_spire',
      x: 0,
      y: 5.5,
      w: 5.5,
      h: 0.5,
      color: 0x181033,
      strokeColor: NEON_CYAN,
    },
    // Elevated billboard gantries
    {
      id: 'billboard_gantry_left',
      x: -7.5,
      y: 0.5,
      w: 5.0,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_PINK,
    },
    {
      id: 'billboard_gantry_right',
      x: 7.5,
      y: 0.5,
      w: 5.0,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_PINK,
    },
    // High antenna platform
    {
      id: 'high_antenna_mast',
      x: 0,
      y: -3.2,
      w: 4.0,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
  ],
  ziplines: [
    // High-speed overhead power transfer zipline from West billboard to Center
    {
      id: 'zipline_west_to_center',
      startX: -9.5,
      startY: -0.5,
      endX:   -1.5,
      endY:    4.2,
      speed:  11.5,
    },
    // High-speed overhead zipline from East billboard to Center
    {
      id: 'zipline_east_to_center',
      startX:  9.5,
      startY: -0.5,
      endX:    1.5,
      endY:    4.2,
      speed:  11.5,
    },
  ],
  jumpPads: [
    // Antenna springboards launching players across gaps
    {
      id: 'antenna_springboard_left',
      x: -6.8,
      y: 6.8,
      w: 1.6,
      h: 0.35,
      impulse: { x: 8.5, y: -15.5 },
      color: NEON_CYAN,
    },
    {
      id: 'antenna_springboard_right',
      x: 6.8,
      y: 6.8,
      w: 1.6,
      h: 0.35,
      impulse: { x: -8.5, y: -15.5 },
      color: NEON_CYAN,
    },
  ],
  windGusts: {
    intervalSec: 12.0,
    warningSec: 2.0,
    durationSec: 4.0,
    force: { x: -6.5, y: 0 },
  },
  hazardZones: [
    // Rooftop abyss plunge
    {
      id: 'rooftop_abyss_fall',
      x: 0,
      y: 9.8,
      w: 32,
      h: 2.0,
      type: 'void',
      respawnTarget: { x: 0, y: 2.5 },
    },
  ],
};
