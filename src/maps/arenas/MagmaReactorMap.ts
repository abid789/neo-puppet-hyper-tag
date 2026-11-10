// src/maps/arenas/MagmaReactorMap.ts
// Magma Core Reactor: Volcanic thermal chamber with periodic 20s lava surges,
// shaking/crumbling basalt platforms (1.2s crumble, 5s respawn), and high-pressure steam vents.

import type { MapDefinition } from '../MapTypes';
import { NEON_ORANGE, NEON_YELLOW, PANEL_BG } from '../../types';

export const MagmaReactorMap: MapDefinition = {
  id: 'magma_reactor',
  name: 'MAGMA CORE REACTOR',
  subtitle: 'Geothermal Generator 04 // Volcanic Chamber',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
  },
  palette: {
    primary:    NEON_ORANGE,
    secondary:  PANEL_BG,
    accent:     NEON_YELLOW,
    danger:     0xff2200,
    background: 0x090403,
  },
  parallax: [
    {
      kind: 'volcanic_cavern',
      depth: 0.15,
      color: 0x330c04,
      alpha: 0.6,
    },
    {
      kind: 'volcanic_cavern',
      depth: 0.3,
      color: 0xff3300,
      alpha: 0.18,
    },
  ],
  weather: {
    kind: 'volcanic_embers',
    density: 50,
    speed: { x: 15, y: -50 },
    color: 0xff6600,
    size: 2.8,
    alpha: 0.8,
  },
  spawns: [
    { x: -8, y: 3.5 },
    { x:  8, y: 3.5 },
    { x: -2.5, y: -3.0 },
    { x:  2.5, y: -3.0 },
  ],
  powerUpNodes: [
    { x:  0, y: -1.5 },
    { x: -5, y:  2.0 },
    { x:  5, y:  2.0 },
  ],
  staticPlatforms: [
    // Sub-structure core foundations
    {
      id: 'reactor_strut_left',
      x: -10.5,
      y: 6.8,
      w: 6.5,
      h: 0.6,
      color: PANEL_BG,
      strokeColor: NEON_ORANGE,
    },
    {
      id: 'reactor_strut_right',
      x: 10.5,
      y: 6.8,
      w: 6.5,
      h: 0.6,
      color: PANEL_BG,
      strokeColor: NEON_ORANGE,
    },
    // Upper reactor catwalks
    {
      id: 'reactor_core_top',
      x: 0,
      y: -2.0,
      w: 7.2,
      h: 0.45,
      color: 0x220a06,
      strokeColor: NEON_YELLOW,
    },
    {
      id: 'high_intake_left',
      x: -7.5,
      y: -3.8,
      w: 4.0,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_ORANGE,
    },
    {
      id: 'high_intake_right',
      x: 7.5,
      y: -3.8,
      w: 4.0,
      h: 0.4,
      color: PANEL_BG,
      strokeColor: NEON_ORANGE,
    },
  ],
  crumblingPlatforms: [
    // Basalt stepping stones that shake for 1.2s and respawn in 5s
    {
      id: 'basalt_stone_1',
      x: -4.5,
      y: 4.8,
      w: 2.8,
      h: 0.45,
      shakeDurationSec: 1.2,
      respawnDurationSec: 5.0,
    },
    {
      id: 'basalt_stone_center',
      x: 0,
      y: 3.2,
      w: 3.2,
      h: 0.45,
      shakeDurationSec: 1.2,
      respawnDurationSec: 5.0,
    },
    {
      id: 'basalt_stone_3',
      x: 4.5,
      y: 4.8,
      w: 2.8,
      h: 0.45,
      shakeDurationSec: 1.2,
      respawnDurationSec: 5.0,
    },
  ],
  steamVents: [
    // Left volcanic steam geyser launching upward
    {
      id: 'steam_vent_left',
      x: -8.0,
      y: 6.3,
      w: 1.6,
      h: 2.5,
      periodSec: 5.0,
      activeSec: 1.6,
      impulse: { x: 2.0, y: -20.0 },
    },
    // Right volcanic steam geyser launching upward
    {
      id: 'steam_vent_right',
      x: 8.0,
      y: 6.3,
      w: 1.6,
      h: 2.5,
      periodSec: 5.0,
      activeSec: 1.6,
      impulse: { x: -2.0, y: -20.0 },
    },
  ],
  lavaSurge: {
    intervalSec: 20.0,
    warningSec: 3.0,
    surgeDurationSec: 4.5,
    baseY: 8.8,
    peakY: 5.2,
  },
  hazardZones: [
    // Permanent lower magma lake
    {
      id: 'magma_core_pit',
      x: 0,
      y: 9.8,
      w: 32,
      h: 2.0,
      type: 'lava',
      respawnTarget: { x: 0, y: -1.0 },
    },
  ],
};
