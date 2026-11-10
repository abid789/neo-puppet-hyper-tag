// src/maps/arenas/NeonFoundryMap.ts
// Neon Cyber Foundry: Multi-level industrial synthwave arena with conveyor belts,
// toggling laser gates with warning telegraphs, and high-impulse jump pads.

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
  subtitle: 'Industrial Heavy Smelter // Sector 09',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
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
    density: 40,
    speed: { x: 30, y: -45 },
    color: 0x00ffff,
    size: 2.5,
    alpha: 0.75,
  },
  spawns: [
    { x: -7, y: 4.5 },
    { x:  7, y: 4.5 },
    { x: -4, y: 0.5 },
    { x:  4, y: 0.5 },
  ],
  powerUpNodes: [
    { x:  0, y: -2.0 },
    { x: -9, y:  0.5 },
    { x:  9, y:  0.5 },
  ],
  staticPlatforms: [
    // Main base ground
    {
      id: 'ground_left',
      x: -8.5,
      y: 8.2,
      w: 9.0,
      h: 0.6,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'ground_right',
      x: 8.5,
      y: 8.2,
      w: 9.0,
      h: 0.6,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
    // Mid gantries
    {
      id: 'mid_gantry_left',
      x: -8.0,
      y: 2.8,
      w: 5.5,
      h: 0.45,
      color: PANEL_BG,
      strokeColor: NEON_PINK,
    },
    {
      id: 'mid_gantry_right',
      x: 8.0,
      y: 2.8,
      w: 5.5,
      h: 0.45,
      color: PANEL_BG,
      strokeColor: NEON_PINK,
    },
    // Upper gantry bridge
    {
      id: 'upper_bridge',
      x: 0,
      y: -0.5,
      w: 7.0,
      h: 0.45,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
    // High snipers' perches
    {
      id: 'perch_left',
      x: -12.5,
      y: -3.0,
      w: 3.5,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
    {
      id: 'perch_right',
      x: 12.5,
      y: -3.0,
      w: 3.5,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
  ],
  movingPlatforms: [
    {
      id: 'vertical_crane_lift',
      x: 0,
      y: 4.0,
      w: 3.6,
      h: 0.4,
      waypoints: [
        { x: 0, y: 5.5 },
        { x: 0, y: 1.5 },
      ],
      speed: 2.2,
      color: 0x1a1a38,
    },
  ],
  conveyors: [
    // Lower left conveyor pushing toward center
    {
      id: 'conveyor_lower_left',
      x: -3.0,
      y: 8.1,
      w: 5.0,
      h: 0.4,
      speed: 4.2,
    },
    // Lower right conveyor pushing toward center
    {
      id: 'conveyor_lower_right',
      x: 3.0,
      y: 8.1,
      w: 5.0,
      h: 0.4,
      speed: -4.2,
    },
  ],
  laserGates: [
    // Center laser gate cutting off middle passage every 4s
    {
      id: 'laser_center_vertical',
      x: 0,
      y: 6.0,
      w: 0.35,
      h: 3.8,
      periodSec: LASER_GATE_PERIOD_SEC,
      activeSec: LASER_GATE_ACTIVE_SEC,
      telegraphSec: LASER_GATE_TELEGRAPH_SEC,
    },
    // Top laser gate sweeping across upper bridge
    {
      id: 'laser_upper_horizontal',
      x: 0,
      y: -0.85,
      w: 6.8,
      h: 0.3,
      periodSec: LASER_GATE_PERIOD_SEC,
      activeSec: 1.8,
      telegraphSec: LASER_GATE_TELEGRAPH_SEC,
    },
  ],
  jumpPads: [
    // Bottom left pad launching to upper left perch
    {
      id: 'jump_pad_bl',
      x: -12.5,
      y: 7.8,
      w: 1.8,
      h: 0.35,
      impulse: { x: 3.5, y: -17.5 },
      color: NEON_CYAN,
    },
    // Bottom right pad launching to upper right perch
    {
      id: 'jump_pad_br',
      x: 12.5,
      y: 7.8,
      w: 1.8,
      h: 0.35,
      impulse: { x: -3.5, y: -17.5 },
      color: NEON_CYAN,
    },
  ],
  hazardZones: [
    {
      id: 'lower_smelter_pit',
      x: 0,
      y: 9.8,
      w: 32,
      h: 2.0,
      type: 'lava',
      respawnTarget: { x: 0, y: -0.2 },
    },
  ],
};
