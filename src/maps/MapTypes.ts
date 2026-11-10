// src/maps/MapTypes.ts
// Declarative map definition data models for NEO-PUPPET: HYPER TAG.

import type { Vec2 } from '../types';

export interface MapPalette {
  primary:    number; // Primary neon accent (e.g. cyan, orange, amber)
  secondary:  number; // Base platform structural fill
  accent:     number; // Secondary glow / highlight
  danger:     number; // Hazard / lethal warning color
  background: number; // Deep scene clear color
}

export type ParallaxBackdropKind =
  | 'synth_grid'
  | 'orbital_stars'
  | 'volcanic_cavern'
  | 'glacier_mirror'
  | 'skyline_rain';

export interface ParallaxLayerDef {
  kind:       ParallaxBackdropKind;
  depth:      number; // 0 = fixed with camera, 1 = moves with foreground
  color:      number;
  alpha:      number;
  detailDensity?: number;
}

export type WeatherParticleKind =
  | 'cyber_rain'
  | 'volcanic_embers'
  | 'orbital_dust'
  | 'cryo_frost'
  | 'neon_sparks';

export interface WeatherConfig {
  kind:    WeatherParticleKind;
  density: number; // Max active particles in circulation
  speed:   Vec2;   // Base drift velocity (pixels/sec)
  color:   number;
  size:    number;
  alpha:   number;
}

export interface StaticPlatformDef {
  id:           string;
  x:            number; // Metres (center)
  y:            number;
  w:            number; // Width in metres
  h:            number; // Height in metres
  friction?:    number; // Default 0.6; ice ~0.02
  restitution?: number; // Bounciness
  isOneWay?:    boolean;
  color?:       number;
  strokeColor?: number;
}

export interface MovingPlatformDef {
  id:        string;
  x:         number;
  y:         number;
  w:         number;
  h:         number;
  waypoints: Vec2[]; // Sequence of points to interpolate between
  speed:     number; // Metres per second
  color?:    number;
}

export interface HazardZoneDef {
  id:            string;
  x:             number;
  y:             number;
  w:             number;
  h:             number;
  type:          'lava' | 'laser' | 'void' | 'cryo';
  respawnTarget: Vec2;
}

export interface ConveyorBeltDef {
  id:    string;
  x:     number;
  y:     number;
  w:     number;
  h:     number;
  speed: number; // m/s; positive = right, negative = left
}

export interface JumpPadDef {
  id:       string;
  x:        number;
  y:        number;
  w:        number;
  h:        number;
  impulse:  Vec2;   // Force vector applied to puppet torso
  color?:   number;
}

export interface LaserGateDef {
  id:           string;
  x:            number;
  y:            number;
  w:            number;
  h:            number;
  periodSec:    number; // Total cycle length (e.g. 4s)
  activeSec:    number; // Duration gate is lethal (e.g. 2s)
  telegraphSec: number; // Warning beam duration before activation (e.g. 1.2s)
}

export interface PortalDef {
  id:           string;
  x:            number;
  y:            number;
  targetX:      number;
  targetY:      number;
  radius:       number;
  color:        number;
  cooldownSec:  number; // Prevent infinite re-triggering (e.g. 1.5s)
}

export interface WindTunnelDef {
  id:    string;
  x:     number;
  y:     number;
  w:     number;
  h:     number;
  force: Vec2;
}

export interface CrumblingPlatformDef {
  id:                 string;
  x:                  number;
  y:                  number;
  w:                  number;
  h:                  number;
  shakeDurationSec:   number; // Shake time before dropping (e.g. 1.2s)
  respawnDurationSec: number; // Time before reappearing (e.g. 5.0s)
}

export interface SteamVentDef {
  id:        string;
  x:         number;
  y:         number;
  w:         number;
  h:         number;
  periodSec: number;
  activeSec: number;
  impulse:   Vec2;
}

export interface LavaSurgeConfig {
  intervalSec:     number; // Surge triggers every N seconds (e.g. 20s)
  warningSec:      number; // Visual siren/warning duration (e.g. 3s)
  surgeDurationSec: number; // Time peak lava remains raised (e.g. 4s)
  baseY:           number; // Normal lava top line (metres)
  peakY:           number; // Raised lethal top line during surge (metres)
}

export interface GlassBarrierDef {
  id:         string;
  x:          number;
  y:          number;
  w:          number;
  h:          number;
  shardCount: number;
}

export interface PendulumDef {
  id:        string;
  pivotX:    number;
  pivotY:    number;
  length:    number;
  bobRadius: number;
  speed:     number;
  maxAngle:  number; // Radians
}

export interface ZiplineDef {
  id:     string;
  startX: number;
  startY: number;
  endX:   number;
  endY:   number;
  speed:  number; // m/s
}

export interface WindGustConfig {
  intervalSec: number;
  warningSec:  number;
  durationSec: number;
  force:       Vec2;
}

export interface LowGravityDomeDef {
  id:     string;
  x:      number;
  y:      number;
  radius: number;
  scale:  number; // 0.35 = 35% of normal gravity
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MapDefinition {
  id:                  string;
  name:                string;
  subtitle:            string;
  bounds:              MapBounds;
  palette:             MapPalette;
  parallax:            ParallaxLayerDef[];
  weather:             WeatherConfig;
  spawns:              Vec2[];
  powerUpNodes:        Vec2[];
  staticPlatforms:     StaticPlatformDef[];
  movingPlatforms?:    MovingPlatformDef[];
  hazardZones?:        HazardZoneDef[];
  conveyors?:          ConveyorBeltDef[];
  jumpPads?:           JumpPadDef[];
  laserGates?:         LaserGateDef[];
  portals?:            PortalDef[];
  windTunnels?:        WindTunnelDef[];
  crumblingPlatforms?: CrumblingPlatformDef[];
  steamVents?:         SteamVentDef[];
  lavaSurge?:          LavaSurgeConfig;
  glassBarriers?:      GlassBarrierDef[];
  pendulums?:          PendulumDef[];
  ziplines?:           ZiplineDef[];
  windGusts?:          WindGustConfig;
  lowGravityDomes?:    LowGravityDomeDef[];
}

export interface MapCarouselItem {
  id:          string;
  name:        string;
  subtitle:    string;
  votes:       number;
  previewColor: number;
}
