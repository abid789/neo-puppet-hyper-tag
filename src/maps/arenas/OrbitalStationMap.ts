// src/maps/arenas/OrbitalStationMap.ts
// Zero-G Orbital Station: Deep space platform with a central low-gravity dome (35% gravity),
// dual quantum teleporters with 1.5s anti-loop cooldowns, and vertical airlock wind tunnels.

import type { MapDefinition } from '../MapTypes';
import { NEON_GREEN, NEON_CYAN, NEON_PINK, PANEL_BG } from '../../types';
import { LOW_GRAVITY_DOME_SCALE } from '../../config/constants';

export const OrbitalStationMap: MapDefinition = {
  id: 'orbital_station',
  name: 'ZERO-G ORBITAL STATION',
  subtitle: 'Aegis High Orbit Relay // Low Gravity Sector',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -8,
    maxY:  10,
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
    density: 35,
    speed: { x: -10, y: -15 },
    color: 0x88ffff,
    size: 2.0,
    alpha: 0.6,
  },
  spawns: [
    { x: -9, y: 3.5 },
    { x:  9, y: 3.5 },
    { x: -3.5, y: 0.5 },
    { x:  3.5, y: 0.5 },
  ],
  powerUpNodes: [
    { x:  0, y: -1.0 },
    { x: -6, y:  5.0 },
    { x:  6, y:  5.0 },
  ],
  staticPlatforms: [
    // Core habitat floor
    {
      id: 'core_base_left',
      x: -7.5,
      y: 7.2,
      w: 8.0,
      h: 0.5,
      color: PANEL_BG,
      strokeColor: NEON_GREEN,
    },
    {
      id: 'core_base_right',
      x: 7.5,
      y: 7.2,
      w: 8.0,
      h: 0.5,
      color: PANEL_BG,
      strokeColor: NEON_GREEN,
    },
    // Center ring platform (inside low-g dome)
    {
      id: 'central_ring_platform',
      x: 0,
      y: 1.5,
      w: 6.5,
      h: 0.45,
      color: 0x0d1522,
      strokeColor: NEON_CYAN,
    },
    // Upper solar array balconies
    {
      id: 'solar_balcony_left',
      x: -9.5,
      y: -1.5,
      w: 4.8,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_GREEN,
    },
    {
      id: 'solar_balcony_right',
      x: 9.5,
      y: -1.5,
      w: 4.8,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_GREEN,
    },
    // Floating satellite dish roost
    {
      id: 'apex_dish',
      x: 0,
      y: -4.8,
      w: 4.0,
      h: 0.35,
      color: PANEL_BG,
      strokeColor: NEON_CYAN,
    },
  ],
  lowGravityDomes: [
    // Central Zero-G dome: 35% normal gravity
    {
      id: 'central_zero_g_chamber',
      x: 0,
      y: 0.5,
      radius: 6.2,
      scale: LOW_GRAVITY_DOME_SCALE,
    },
  ],
  portals: [
    // Quantum teleporters: pair A and B
    {
      id: 'teleporter_alpha',
      x: -11.0,
      y: 5.8,
      targetX: 11.0,
      targetY: -2.8,
      radius: 0.9,
      color: NEON_CYAN,
      cooldownSec: 1.5,
    },
    {
      id: 'teleporter_beta',
      x: 11.0,
      y: 5.8,
      targetX: -11.0,
      targetY: -2.8,
      radius: 0.9,
      color: NEON_PINK,
      cooldownSec: 1.5,
    },
  ],
  windTunnels: [
    // Left airlock decompression vent (pushes upward)
    {
      id: 'airlock_vent_left',
      x: -13.5,
      y: 2.0,
      w: 1.8,
      h: 7.0,
      force: { x: 0, y: -24.0 },
    },
    // Right airlock decompression vent (pushes upward)
    {
      id: 'airlock_vent_right',
      x: 13.5,
      y: 2.0,
      w: 1.8,
      h: 7.0,
      force: { x: 0, y: -24.0 },
    },
  ],
  hazardZones: [
    // Deep space vacuum bottom fall boundary
    {
      id: 'space_vacuum_fall',
      x: 0,
      y: 9.8,
      w: 32,
      h: 2.0,
      type: 'void',
      respawnTarget: { x: 0, y: 0.0 },
    },
  ],
};
