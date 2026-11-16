// Adapted from the official Animate UI Topography registry. See docs/third-party-notices.md.
export const VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform sampler2D permutation;
uniform vec2 size;
uniform float dpr;
uniform float feature;
uniform float z;
uniform float step;
uniform float range;
uniform float amount;
uniform float lift;
uniform float hillRadius;
uniform vec2 hill;
uniform vec4 ripples[4];
uniform float reach;
uniform float rippleWidth;
uniform vec3 color;

float perm(float i) {
  return floor(texture2D(permutation, vec2((mod(i, 256.0) + 0.5) / 256.0, 0.5)).r * 255.0 + 0.5);
}

float fade(float t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float grad(float hash, float x, float y, float z) {
  float h = mod(hash, 16.0);
  float u = h < 8.0 ? x : y;
  float v = h < 4.0 ? y : (h == 12.0 || h == 14.0 ? x : z);
  return (mod(h, 2.0) == 0.0 ? u : -u) + (mod(floor(h / 2.0), 2.0) == 0.0 ? v : -v);
}

float noise(vec3 p) {
  vec3 cell = mod(floor(p), 256.0);
  vec3 f = p - floor(p);
  float u = fade(f.x);
  float v = fade(f.y);
  float w = fade(f.z);
  float A = perm(cell.x) + cell.y;
  float AA = perm(A) + cell.z;
  float AB = perm(A + 1.0) + cell.z;
  float B = perm(cell.x + 1.0) + cell.y;
  float BA = perm(B) + cell.z;
  float BB = perm(B + 1.0) + cell.z;
  return mix(
    mix(
      mix(grad(perm(AA), f.x, f.y, f.z), grad(perm(BA), f.x - 1.0, f.y, f.z), u),
      mix(grad(perm(AB), f.x, f.y - 1.0, f.z), grad(perm(BB), f.x - 1.0, f.y - 1.0, f.z), u),
      v
    ),
    mix(
      mix(grad(perm(AA + 1.0), f.x, f.y, f.z - 1.0), grad(perm(BA + 1.0), f.x - 1.0, f.y, f.z - 1.0), u),
      mix(grad(perm(AB + 1.0), f.x, f.y - 1.0, f.z - 1.0), grad(perm(BB + 1.0), f.x - 1.0, f.y - 1.0, f.z - 1.0), u),
      v
    ),
    w
  );
}

void main() {
  vec2 point = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / dpr;
  vec2 n = point / feature;
  float value = noise(vec3(n, z)) * 1.1 + noise(vec3(n * 2.1, z * 1.7)) * 0.45;
  if (lift > 0.0) value += lift * exp(-length(point - hill) / hillRadius);
  for (int i = 0; i < 4; i++) {
    vec4 ripple = ripples[i];
    if (ripple.w > 0.5) {
      float d = length(point - ripple.xy) - ripple.z * reach;
      value += 0.9 * (1.0 - ripple.z) * cos(d / rippleWidth * 1.8) * exp(-(d * d) / (2.0 * rippleWidth * rippleWidth));
    }
  }
  value *= amount;
  float level = (value + range) / step;
  float nearest = floor(level + 0.5);
  float slope = length(vec2(dFdx(level), dFdy(level)));
  float pixels = abs(level - nearest) / max(slope, 1e-6);
  bool major = mod(nearest, 5.0) == 0.0;
  float width = (major ? 1.5 : 1.0) * dpr;
  float alpha = slope > 1e-6 ? clamp(width * 0.5 + 0.5 - pixels, 0.0, 1.0) * (major ? 0.85 : 0.4) : 0.0;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
