// src/graphics/Shaders.ts
// Factory functions that create PixiJS v8 custom GLSL filters for NEO-PUPPET: HYPER TAG.

import { Filter, GlProgram } from 'pixi.js';

// ── Standard vertex shader ────────────────────────────────────────────────────
// PixiJS v8 injects the `#version 300 es` line automatically; do not include it.
const FILTER_VERT: string = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 / uOutputTexture.y) - 1.0;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Neon Bloom Filter
// ─────────────────────────────────────────────────────────────────────────────

const BLOOM_FRAG: string = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uIntensity;

void main(void) {
  vec4 color = texture(uTexture, vTextureCoord);
  // Extract areas brighter than 0.4 (the "bloom" region).
  vec3 bright = clamp(color.rgb - vec3(0.4), 0.0, 1.0);
  // Add the bright excess, boosted by intensity, back on top.
  finalColor = vec4(color.rgb + bright * uIntensity, color.a);
}
`;

export function createNeonBloomFilter(): {
  filter: Filter;
  setIntensity(v: number): void;
} {
  const filter = new Filter({
    glProgram: new GlProgram({ vertex: FILTER_VERT, fragment: BLOOM_FRAG }),
    resources: {
      bloomUniforms: {
        uIntensity: { value: 2.5, type: 'f32' },
      },
    },
  });

  function setIntensity(v: number): void {
    (
      filter.resources['bloomUniforms'] as unknown as {
        uniforms: Record<string, unknown>;
      }
    ).uniforms['uIntensity'] = v;
  }

  return { filter, setIntensity };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Chromatic Aberration / Shockwave Filter
// ─────────────────────────────────────────────────────────────────────────────

const CHROM_FRAG: string = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uOffset;

void main(void) {
  // Red channel shifted right, blue channel shifted left, green unchanged.
  float r = texture(uTexture, vTextureCoord + vec2( uOffset, 0.0)).r;
  float g = texture(uTexture, vTextureCoord                      ).g;
  float b = texture(uTexture, vTextureCoord + vec2(-uOffset, 0.0)).b;
  float a = texture(uTexture, vTextureCoord).a;
  finalColor = vec4(r, g, b, a);
}
`;

export function createChromaticAberrationFilter(): {
  filter: Filter;
  trigger(strength: number): void;
  update(dt: number): void;
} {
  const filter = new Filter({
    glProgram: new GlProgram({ vertex: FILTER_VERT, fragment: CHROM_FRAG }),
    resources: {
      chromUniforms: {
        uOffset: { value: 0.0, type: 'f32' },
      },
    },
  });

  function getUniforms(): Record<string, unknown> {
    return (
      filter.resources['chromUniforms'] as unknown as {
        uniforms: Record<string, unknown>;
      }
    ).uniforms;
  }

  function trigger(strength: number): void {
    getUniforms()['uOffset'] = strength;
  }

  function update(dt: number): void {
    const u = getUniforms();
    const current = u['uOffset'] as number;
    // Exponential decay toward 0.
    u['uOffset'] = current - current * 8 * dt;
  }

  return { filter, trigger, update };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Vignette + Scanline Filter
// ─────────────────────────────────────────────────────────────────────────────

const VIGNETTE_FRAG: string = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uResY;
uniform float uEnabled;

void main(void) {
  vec4 color = texture(uTexture, vTextureCoord);

  // Vignette: dark edges, bright centre.
  float vig = 1.0 - smoothstep(0.4, 1.0, length(vTextureCoord - vec2(0.5)) * 1.6);

  // Scanlines: subtle horizontal banding.
  float scan = 0.85 + 0.15 * sin(vTextureCoord.y * uResY * 3.14159);

  // When uEnabled == 0.0 the multiplier collapses to 1.0 (pass-through).
  // When uEnabled == 1.0 the full vig*scan is applied.
  float effect = mix(1.0, vig * scan, uEnabled);

  finalColor = vec4(color.rgb * effect, color.a);
}
`;

export function createVignetteScanlineFilter(enabled = true): {
  filter: Filter;
  setEnabled(v: boolean): void;
} {
  const filter = new Filter({
    glProgram: new GlProgram({ vertex: FILTER_VERT, fragment: VIGNETTE_FRAG }),
    resources: {
      vigUniforms: {
        uResY:    { value: 720.0,                 type: 'f32' },
        uEnabled: { value: enabled ? 1.0 : 0.0,  type: 'f32' },
      },
    },
  });

  function getUniforms(): Record<string, unknown> {
    return (
      filter.resources['vigUniforms'] as unknown as {
        uniforms: Record<string, unknown>;
      }
    ).uniforms;
  }

  function setEnabled(v: boolean): void {
    getUniforms()['uEnabled'] = v ? 1.0 : 0.0;
  }

  return { filter, setEnabled };
}
