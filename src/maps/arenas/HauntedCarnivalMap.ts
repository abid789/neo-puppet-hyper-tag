// src/maps/arenas/HauntedCarnivalMap.ts
// Carnival arena with a vibrant purple, magenta, and amber palette.
// Features a rotating Ferris wheel platform, spinning carousel platforms,
// bouncy trampolines, and a fun-house mirror zone that flips horizontal control for 2 seconds.

import type { MapDefinition } from '../MapTypes';

export const HauntedCarnivalMap: MapDefinition = {
  id: 'haunted_carnival',
  name: 'HAUNTED CARNIVAL',
  subtitle: 'Phantasm Boardwalk // Neon Midway',
  bounds: {
    minX: -16,
    maxX:  16,
    minY: -7,
    maxY:  10,
  },
  palette: {
    primary:    0xff00aa, // Phantasm neon magenta
    secondary:  0x1f0b2f, // Midnight midway violet
    accent:     0xffaa00, // Carnival marquee amber
    danger:     0xff0033, // High-voltage shock hazard
    background: 0x0c0418, // Deep spectral dark purple
  },
  parallax: [
    {
      kind: 'haunted_carnival',
      depth: 0.18,
      color: 0x2d1045,
      alpha: 0.7,
    },
    {
      kind: 'haunted_carnival',
      depth: 0.38,
      color: 0xff00aa,
      alpha: 0.2,
    },
  ],
  weather: {
    kind: 'carnival_confetti',
    density: 50,
    speed: { x: 12, y: 35 },
    color: 0xff00aa,
    size: 3.0,
    alpha: 0.85,
  },
  spawns: [
    { x: -8.0, y: 3.8 },
    { x:  8.0, y: 3.8 },
    { x: -3.5, y: -0.5 },
    { x:  3.5, y: -0.5 },
  ],
  powerUpNodes: [
    { x:   0, y: -3.8 },
    { x:  -7, y:  0.0 },
    { x:   7, y:  0.0 },
  ],
  staticPlatforms: [
    // Boardwalk ground left & right
    {
      id: 'boardwalk_left',
      x: -8.5,
      y: 8.2,
      w: 8.5,
      h: 0.65,
      color: 0x1f0b2f,
      strokeColor: 0xff00aa,
    },
    {
      id: 'boardwalk_right',
      x: 8.5,
      y: 8.2,
      w: 8.5,
      h: 0.65,
      color: 0x1f0b2f,
      strokeColor: 0xff00aa,
    },
    // Funhouse entrance terrace
    {
      id: 'funhouse_terrace',
      x: 0,
      y: 8.2,
      w: 5.5,
      h: 0.65,
      color: 0x2b0f42,
      strokeColor: 0xffaa00,
    },
    // Upper roller coaster truss ledges
    {
      id: 'coaster_beam_left',
      x: -11.0,
      y: 0.2,
      w: 4.8,
      h: 0.45,
      color: 0x1f0b2f,
      strokeColor: 0xffaa00,
    },
    {
      id: 'coaster_beam_right',
      x: 11.0,
      y: 0.2,
      w: 4.8,
      h: 0.45,
      color: 0x1f0b2f,
      strokeColor: 0xffaa00,
    },
    // High marquee crown platform
    {
      id: 'marquee_roof',
      x: 0,
      y: -2.8,
      w: 4.5,
      h: 0.45,
      color: 0x2b0f42,
      strokeColor: 0xff00aa,
    },
  ],
  movingPlatforms: [
    // Rotating Ferris wheel carriage (follows closed orbit around marquee center)
    {
      id: 'ferris_carriage_1',
      x: 0,
      y: -1.5,
      w: 3.2,
      h: 0.4,
      waypoints: [
        { x:  0.0, y: -1.5 },
        { x:  3.0, y:  0.8 },
        { x:  0.0, y:  3.0 },
        { x: -3.0, y:  0.8 },
      ],
      speed: 2.6,
      color: 0x3d145c,
    },
    // Spinning carousel platform left
    {
      id: 'carousel_platform_left',
      x: -6.0,
      y: 3.2,
      w: 3.5,
      h: 0.4,
      waypoints: [
        { x: -7.8, y: 3.2 },
        { x: -4.5, y: 3.2 },
      ],
      speed: 2.0,
      color: 0x3d145c,
    },
    // Spinning carousel platform right
    {
      id: 'carousel_platform_right',
      x: 6.0,
      y: 3.2,
      w: 3.5,
      h: 0.4,
      waypoints: [
        { x: 4.5, y: 3.2 },
        { x: 7.8, y: 3.2 },
      ],
      speed: 2.0,
      color: 0x3d145c,
    },
  ],
  jumpPads: [
    // Bouncy carnival trampolines with super high impulse
    {
      id: 'carnival_trampoline_left',
      x: -11.5,
      y: 7.8,
      w: 2.2,
      h: 0.35,
      impulse: { x: 3.0, y: -20.5 },
      color: 0xff00aa,
    },
    {
      id: 'carnival_trampoline_right',
      x: 11.5,
      y: 7.8,
      w: 2.2,
      h: 0.35,
      impulse: { x: -3.0, y: -20.5 },
      color: 0xff00aa,
    },
  ],
  controlFlipZones: [
    // Fun-house mirror zone: Inverts horizontal control on entry for 2 seconds!
    {
      id: 'funhouse_mirror',
      x: 0,
      y: 6.5,
      w: 5.5,
      h: 2.8,
      durationSec: 2.0,
      color: 0xff00aa,
    },
  ],
  hazardZones: [
    // Midway drop hazard
    {
      id: 'carnival_void',
      x: 0,
      y: 9.4,
      w: 30,
      h: 1.5,
      type: 'void',
      respawnTarget: { x: 0, y: 4.0 },
    },
  ],
};
