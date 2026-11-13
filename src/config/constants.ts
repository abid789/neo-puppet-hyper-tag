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

// ── Puppet Fighter Movement & Snappy Locomotion ──────────────────────────────
// Snappy horizontal run target speed in metres/sec (quick responsive strides)
export const FIGHTER_RUN_SPEED = 6.8;
// Snappy horizontal acceleration impulse multiplier (zero input latency feel)
export const FIGHTER_ACCEL_IMPULSE_FACTOR = 0.65;
// Crisp grounded athletic hurdle hop impulse (clears crates and obstacles smoothly)
export const FIGHTER_JUMP_IMPULSE = -7.8;
// Quick landing recovery time in seconds before full speed locomotion resumes
export const FIGHTER_LANDING_RECOVERY_SEC = 0.08;
// Variable jump upward sustain lift impulse multiplier while holding jump button
export const FIGHTER_JUMP_SUSTAIN_IMPULSE = -2.0;

// ── Punch & Fight Hit Mechanics ──────────────────────────────────────────────
// Punch wind-up telegraph duration in seconds before active hit frames engage
export const PUNCH_WINDUP_SEC = 0.08;
// Active strike collision window in seconds where hits can connect
export const PUNCH_ACTIVE_SEC = 0.12;
// Punch follow-through recovery duration in seconds before next action
export const PUNCH_RECOVERY_SEC = 0.16;
// Total punch attack cooldown cycle duration in seconds
export const PUNCH_COOLDOWN_SEC = 0.36;
// Maximum reach in metres from torso to register an active punch strike
export const PUNCH_REACH_METRES = 1.15;
// Base physical damage points added to victim damage meter per solid hit (0 to 100+)
export const PUNCH_BASE_DAMAGE = 14.0;
// Base horizontal knockback impulse in Newton-seconds applied on clean hit
export const PUNCH_BASE_KNOCKBACK = 11.5;
// Vertical launch pop impulse applied to destabilize victim into tumbling ragdoll
export const PUNCH_VERTICAL_POP = -4.2;
// Hit-stun freeze duration in seconds inflicted on victim on unblocked strike
export const PUNCH_HIT_STUN_SEC = 0.32;
// Exaggerated rotational torque applied to victim torso to induce funny ragdoll flips
export const PUNCH_RAGDOLL_TORQUE = 28.0;

// ── Block & Defensive Guard Mechanics ─────────────────────────────────────────
// Knockback reduction multiplier applied while fighter is actively blocking (75% absorbed)
export const BLOCK_KNOCKBACK_DAMPING = 0.25;
// Damage reduction multiplier while blocking (80% damage absorbed)
export const BLOCK_DAMAGE_DAMPING = 0.20;
// Perfect block parry timing window in seconds for complete damage negation
export const BLOCK_PARRY_WINDOW_SEC = 0.12;

// ── Ragdoll Stagger & Damage Scaling ──────────────────────────────────────────
// Time in seconds for an off-balance ragdoll to self-right its joints after a strike
export const RAGDOLL_STAGGER_RECOVERY_SEC = 0.58;
// Maximum damage meter ceiling for HUD display purposes
export const DAMAGE_METER_MAX = 100.0;
// Scaling factor: every 50% damage adds +1.0x to the knockback launch velocity
export const DAMAGE_KNOCKBACK_SCALE_DIVISOR = 48.0;

// ── Body Profiles: Small, Standard, Heavy ────────────────────────────────────
export interface BodyProfileConfig {
  // Density multiplier scaling rigid body mass
  massMultiplier: number;
  // Locomotion run speed multiplier
  speedMultiplier: number;
  // Knockback force received multiplier (higher = flies farther)
  knockbackReceivedMultiplier: number;
  // Punch impact impulse multiplier
  punchPowerMultiplier: number;
}

// Body profiles hand-tuned for asymmetric party fighter matchups
export const BODY_PROFILES: Record<'Small' | 'Standard' | 'Heavy', BodyProfileConfig> = {
  // Agile, light featherweight: high speed, low mass, launches far on hit
  Small: { massMultiplier: 0.80, speedMultiplier: 1.12, knockbackReceivedMultiplier: 1.25, punchPowerMultiplier: 0.90 },
  // Balanced standard brawler: baseline mass, velocity, and knockback response
  Standard: { massMultiplier: 1.00, speedMultiplier: 1.00, knockbackReceivedMultiplier: 1.00, punchPowerMultiplier: 1.00 },
  // High-inertia heavyweight tank: slower locomotion, resists knockback, crushing punches
  Heavy: { massMultiplier: 1.35, speedMultiplier: 0.90, knockbackReceivedMultiplier: 0.72, punchPowerMultiplier: 1.20 },
};
