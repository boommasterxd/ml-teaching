// The field vertex shader prepares the scene at the three fullscreen triangle vertices.
export const SCENE_VARYINGS = `
varying highp vec4 cameraRight;
varying highp vec4 cameraUp;
varying highp vec4 cameraEye;
varying highp vec4 largeDrop;
varying highp vec4 smallDrop;
varying highp vec4 largeStretch;
varying highp vec4 smallStretch;
`;

// ringProfile, including its breathing cross-section, fits inside this sphere.
// Its orthographic silhouette therefore fits inside the same disc at every camera angle.
export const RING_BOUND = 'const float ringBound = 1.0;';

// A CSS point maps through the same lens for the tracing ray, hovering and tapping.
export const LENS = `
vec2 screenPlane(vec2 point) {
  float scale = min(cssSize.x, cssSize.y);
  vec2 p = (point - cssSize * 0.5) * 2.09 / scale;
  if (lift > 0.0) {
    vec2 pointer = clamp((hill - cssSize * 0.5) / scale, -0.75, 0.75);
    vec2 offset = p - 2.09 * pointer;
    vec2 margin = min(point, cssSize - point) / scale;
    float influence = min(lift, 1.5) * exp2(-dot(offset, offset) * 5.2)
      * smoothstep(0.025, 0.15, min(margin.x, margin.y));
    p += influence * (0.38 * offset - 0.12 * pointer);
  }
  return p;
}
`;

export const RING_PROFILE = `
void ringProfile(vec2 u, float breath, out vec2 spine, out vec2 axes, out vec2 bank) {
  vec2 u2 = vec2(u.x * u.x - u.y * u.y, 2.0 * u.x * u.y);
  vec2 u3 = vec2(dot(u2, vec2(u.x, -u.y)), dot(u2, u.yx));
  spine.x = 0.59 + dot(u3, vec2(0.021, -0.014)) + 0.034 * u2.y + 0.018 * breath * u2.x;
  spine.y = 0.089 * u2.y + (0.049 + 0.035 * breath) * u3.x - 0.115 * u.x;
  float angle = 0.42 + 0.46 * u2.x + 0.13 * breath * u.y;
  bank = vec2(cos(angle), sin(angle));
  axes = vec2(0.252 + (0.030 + 0.014 * breath) * u.y, 0.196 + 0.02 * u2.x);
}
`;

export const DROPLET_GEOMETRY = `
// The stretch projects one component out of the spherical distance metric.
vec3 dropMetric(vec3 p, vec3 stretch) {
  return p - stretch * dot(p, stretch);
}

// The stretched silhouette plus its sampling margin stays inside the reserved clearance.
bool nearDrop(vec3 origin, vec3 ray, vec4 drop, vec3 stretch) {
  vec3 offset = cross(drop.xyz - origin, ray);
  float bound = drop.w * inversesqrt(1.0 - dot(stretch, stretch)) + 0.025;
  return dot(offset, offset) < bound * bound;
}

vec3 dropFront(vec3 origin, vec3 ray, vec4 drop, vec3 stretch, out float closest) {
  vec3 direction = dropMetric(ray, stretch);
  float curvature = dot(ray, direction);
  float center = -dot(origin - drop.xyz, direction) / curvature;
  vec3 offset = origin - drop.xyz + ray * center;
  float distanceSquared = dot(offset, dropMetric(offset, stretch));
  closest = sqrt(max(0.0, distanceSquared)) - drop.w;
  // A miss still samples the tangent region for the soft silhouette.
  float halfChord = sqrt(max(0.0, (drop.w * drop.w - distanceSquared) / curvature));
  return origin + ray * (center - halfChord);
}

vec3 dropExit(vec3 front, vec3 ray, vec4 drop, vec3 stretch) {
  vec3 offset = front - drop.xyz;
  vec3 samplePoint = offset + 0.006 * ray;
  float radiusSquared = drop.w * drop.w;
  // Touching the outside of the droplet leaves no transmission path.
  if (dot(samplePoint, dropMetric(samplePoint, stretch)) >= radiusSquared) return front;
  vec3 direction = dropMetric(ray, stretch);
  float curvature = dot(ray, direction);
  float slope = dot(offset, direction);
  float constant = dot(offset, dropMetric(offset, stretch)) - radiusSquared;
  float travel = (-slope + sqrt(max(0.0, slope * slope - curvature * constant))) / curvature;
  return front + ray * travel;
}
`;

export const VERTEX = `
precision highp float;
attribute vec2 position;
uniform vec2 cssSize;
uniform vec2 hill;
uniform float lift;
uniform float phase;
uniform vec4 ripples[RIPPLE_CAPACITY];
${SCENE_VARYINGS}
${RING_BOUND}
${LENS}

void orientCamera() {
  float drift = sin(phase * 0.43);
  float roll = -0.80 + 0.24 * sin(phase) + 0.085 * drift;
  float tilt = 0.53 + 0.24 * sin(phase * 1.04) + 0.065 * drift;
  float yaw = 0.58 * sin(phase * 0.92) + 0.18 * drift;
  vec3 right = vec3(cos(yaw), sin(yaw), 0.0);
  vec3 eye = vec3(right.y * sin(tilt), -right.x * sin(tilt), cos(tilt));
  vec3 up = cross(eye, right);
  vec2 rotation = vec2(cos(roll), sin(roll));
  if (lift > 0.0) {
    vec2 pointer = clamp((hill - cssSize * 0.5) / min(cssSize.x, cssSize.y), -0.75, 0.75);
    vec2 look = mat2(rotation, -rotation.y, rotation.x) * vec2(pointer.x, -pointer.y);
    eye += (right * look.x + up * look.y) * min(lift, 1.5) * 0.69;
    eye = normalize(vec3(eye.xy, max(eye.z, length(eye.xy) * 0.78)));
    right = normalize(cross(up, eye));
    up = cross(eye, right);
  }
  cameraRight = vec4(right, rotation.x);
  cameraUp = vec4(up, rotation.y);
  cameraEye = vec4(eye, sin(phase * 0.84));
}

float dropHit(vec2 point, vec2 center, float radius) {
  return 1.0 - smoothstep(radius + 0.025, radius + 0.1, length(screenPlane(point) - center));
}

vec2 dropInput(vec2 center, float radius) {
  float hover = dropHit(hill, center, radius) * clamp(lift / 1.5, 0.0, 1.0);
  float impulse = 0.0;
  for (int i = 0; i < RIPPLE_CAPACITY; i++) {
    vec4 ripple = ripples[i];
    if (ripple.w < 0.5) break;
    float hit = dropHit(ripple.xy, center, radius);
    impulse = max(impulse, hit * (1.0 - smoothstep(0.03, 0.88, ripple.z)));
  }
  return vec2(hover, impulse);
}

void prepareDrop(float sizeFraction, vec2 home, float tempo, out vec4 drop, out vec4 stretch) {
  float beat = phase * tempo;
  float scale = min(cssSize.x, cssSize.y);
  float radius = sizeFraction * cssSize.x * 2.09 / scale;
  vec2 drift = vec2(sin(beat * 1.67), sin(beat * 2.41)) * vec2(0.042, 0.054);
  vec2 orbit = screenPlane(home + drift * scale / 2.09);
  const float maxStretch = 1.4;
  // Keep the whole stretched drop outside the loop in the same lens space as the tracing ray.
  vec2 radial = normalize(orbit);
  vec2 center = radial * max(length(orbit), ringBound + 0.055 + radius * maxStretch);
  vec2 inputForce = dropInput(center, radius * maxStretch);
  float strain = 0.09 + 0.06 * sin(beat * 2.3) + 0.09 * inputForce.x + 0.16 * inputForce.y;
  float elongation = min(1.0 + strain, maxStretch);
  vec3 screenX = cameraRight.w * cameraRight.xyz + cameraUp.w * cameraUp.xyz;
  vec3 screenY = cameraUp.w * cameraRight.xyz - cameraRight.w * cameraUp.xyz;
  vec3 tangent = screenY * radial.x - screenX * radial.y;
  drop = vec4(screenX * center.x + screenY * center.y, radius / sqrt(elongation));
  stretch = vec4(tangent * sqrt(1.0 - 1.0 / (elongation * elongation * elongation)),
    inputForce.x * 0.72 + inputForce.y * 1.6);
}

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  orientCamera();
  vec2 largeHome = cssSize * vec2(0.885, 0.12) + vec2(0.0, cssSize.x * 0.035);
  vec2 smallHome = cssSize * vec2(0.108, 0.81) - vec2(0.0, cssSize.x * 0.018);
  prepareDrop(0.039, largeHome, 0.92, largeDrop, largeStretch);
  prepareDrop(0.023, smallHome, 1.31, smallDrop, smallStretch);
}
`;
