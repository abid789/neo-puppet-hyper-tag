// src/config/constants.ts
// Central gameplay, hazard, and environmental balance tuning constants.
// Adjust values here to hand-tune arena physics and gameplay feel.

import type { Vec2 } from '../types';

// ── Jump Pads & Bouncers ─────────────────────────────────────────────────────
// Standard foundry & rooftop jump pad impulse (high vertical boost with slight horizontal lead)
export const JUMP_PAD_STANDARD_IMPULSE: Vec2 = { x: 0, y: -18.5 };

// Bouncy carnival trampoline impulse (supercharged vertical rebound)
export const JUMP_PAD_TRAMPOLINE_IMPULSE: Vec2 = { x: 0, y: -20.5 };

// Thermal sand updraft jump pad impulse (angled outward launch)
export const JUMP_PAD_THERMAL_IMPULSE_LEFT: Vec2 = { x: 5.0, y: -18.0 };
export const JUMP_PAD_THERMAL_IMPULSE_RIGHT: Vec2 = { x: -5.0, y: -18.0 };

// ── Steam & Bubble Vents ──────────────────────────────────────────────────────
// Industrial steam vent eruption impulse (periodic upward geyser)
export const STEAM_VENT_STANDARD_IMPULSE: Vec2 = { x: 0, y: -16.0 };

// Underwater high-pressure bubble vent impulse (continuous buoyant thrust)
export const BUBBLE_VENT_IMPULSE: Vec2 = { x: 0, y: -19.0 };

// ── Wind Tunnels & Atmospheric Gusts ──────────────────────────────────────────
// High-altitude ventilation wind tunnel force vector
export const WIND_TUNNEL_STANDARD_FORCE: Vec2 = { x: 0, y: -45.0 };

// Skyline rooftop lateral wind gust force (strong crosswind push)
export const WIND_GUST_SKYLINE_FORCE: Vec2 = { x: 22.0, y: -3.0 };

// Desert sandstorm lateral sweeping gale force (heavy horizontal dust pressure)
export const WIND_GUST_SANDSTORM_FORCE: Vec2 = { x: -18.0, y: -2.5 };

// ── Hazard Timers & Intervals ────────────────────────────────────────────────
// Volcanic lava surge cycle interval (seconds between surges)
export const LAVA_SURGE_INTERVAL_SEC = 20.0;

// Volcanic lava surge warning siren duration before magma rises (seconds)
export const LAVA_SURGE_WARNING_SEC = 3.0;

// Volcanic lava surge duration at peak lethal height (seconds)
export const LAVA_SURGE_DURATION_SEC = 4.0;

// Laser gate full cycle period (seconds)
export const LASER_GATE_PERIOD_SEC = 4.0;

// Laser gate lethal firing duration (seconds)
export const LASER_GATE_ACTIVE_SEC = 2.0;

// Laser gate pre-firing warning telegraph beam duration (seconds)
export const LASER_GATE_TELEGRAPH_SEC = 1.2;

// ── Environmental Drag & Control Zones ───────────────────────────────────────
// Quicksand patch movement speed multiplier (slows locomotion down to 45%)
export const QUICKSAND_SLOW_FACTOR = 0.45;

// Sunken archway water drag speed multiplier (slows locomotion down to 52%)
export const SUNKEN_ARCHWAY_SLOW_FACTOR = 0.52;

// Haunted carnival fun-house mirror horizontal control flip duration (seconds)
export const FUNHOUSE_MIRROR_DURATION_SEC = 2.0;

// Zero-G orbital low-gravity dome gravity scale factor (35% normal gravity)
export const LOW_GRAVITY_DOME_SCALE = 0.35;
