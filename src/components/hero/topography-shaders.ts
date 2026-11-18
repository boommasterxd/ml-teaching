// Adapted from the official Animate UI Topography registry. See docs/third-party-notices.md.
import { LENS, RING_BOUND, RING_PROFILE, SCENE_VARYINGS } from './topography-geometry';

export { VERTEX } from './topography-geometry';

export const SCREEN_VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FIELD_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform vec2 cssSize;
uniform float phase;
uniform float lift;
uniform float hillRadius;
uniform vec2 hill;
uniform vec4 ripples[RIPPLE_CAPACITY];
uniform float reach;
uniform float rippleWidth;
${SCENE_VARYINGS}
${LENS}
${RING_BOUND}
${RING_PROFILE}

bool traceLarge;
bool traceSmall;

vec3 interaction(vec2 point) {
  vec3 response = vec3(lift * 0.13 * exp(-length(point - hill) / hillRadius), 0.0, 0.0);
  vec2 center = cssSize * 0.5;
  vec2 radial = normalize(point - center + vec2(0.0001));
  for (int i = 0; i < RIPPLE_CAPACITY; i++) {
    vec4 ripple = ripples[i];
    if (ripple.w < 0.5) break;
    vec2 start = ripple.xy - center;
    // A tap through the opening starts at the top when it has no clear direction.
    start = dot(start, start) < 4.0 ? vec2(0.0, -1.0) : normalize(start);
    float turn = ripple.z * 6.2831853;
    vec2 head = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * start;
    float arc = 1.0 - clamp(dot(radial, head), -1.0, 1.0);
    float behind = head.x * radial.y - head.y * radial.x;
    float fade = 1.0 - smoothstep(0.84, 1.0, ripple.z);
    response.y += fade * exp2(-arc * 103.0);
    response.z += fade * exp2(-arc * mix(14.0, 57.0, smoothstep(-0.14, 0.14, behind)));
    float d = length(point - ripple.xy) - ripple.z * reach;
    response.x += 0.036 * (1.0 - ripple.z) * cos(d / rippleWidth * 1.8) * exp(-(d * d) / (2.0 * rippleWidth * rippleWidth));
  }
  return response;
}

float ringDistance(vec3 p, float breath) {
  float radius = length(p.xy);
  vec2 spine, axes, bank;
  ringProfile(p.xy / max(0.001, radius), breath, spine, axes, bank);
  vec2 section = mat2(bank, -bank.y, bank.x) * (vec2(radius, p.z) - spine);
  return (length(section / axes) - 1.0) * min(axes.x, axes.y);
}

float dropDistance(vec3 p, vec4 drop, vec3 stretch) {
  vec3 d = p - drop.xyz;
  float axial = dot(d, stretch);
  return sqrt(max(0.0, dot(d, d) - axial * axial)) - drop.w;
}

// The stretched silhouette plus its sampling margin stays inside the reserved clearance.
bool nearDrop(vec3 origin, vec3 ray, vec4 drop, vec3 stretch) {
  vec3 offset = cross(drop.xyz - origin, ray);
  float bound = drop.w * inversesqrt(1.0 - dot(stretch, stretch)) + 0.025;
  return dot(offset, offset) < bound * bound;
}

float distanceToGlass(vec3 p, float breath) {
  if (traceLarge) return dropDistance(p, largeDrop, largeStretch.xyz);
  if (traceSmall) return dropDistance(p, smallDrop, smallStretch.xyz);
  return ringDistance(p, breath);
}

vec3 traceFront(vec3 origin, vec3 direction, float breath, out float closest) {
  float travel = 0.0;
  float previous = 2.0;
  float stride = 0.0;
  closest = 2.0;
  vec3 hit = origin;
  for (int i = 0; i < 68; i++) {
    vec3 position = origin + direction * travel;
    float distance = distanceToGlass(position, breath);
    if (distance < closest) {
      closest = distance;
      hit = position;
    }
    if (distance < 0.0) return position + direction * (stride * distance / (previous - distance));
    if (travel > 2.1) break;
    previous = distance;
    stride = max(0.021, distance * 0.57);
    travel += stride;
  }
  return hit;
}

vec3 traceExit(vec3 front, vec3 direction, float breath) {
  float travel = 0.006;
  float stride = 0.006;
  float previous = 0.0;
  for (int i = 0; i < 40; i++) {
    float distance = distanceToGlass(front + direction * travel, breath);
    if (distance >= 0.0) {
      travel -= stride * distance / max(0.0001, distance - previous);
      break;
    }
    previous = distance;
    stride = max(0.014, -distance * 0.59);
    travel += stride;
  }
  return front + direction * travel;
}

vec3 surfaceNormal(vec3 p, float breath) {
  vec3 gradient = vec3(0.0);
  for (int axis = 0; axis < 3; axis++) {
    vec3 direction = axis == 0 ? vec3(1, 0, 0) : (axis == 1 ? vec3(0, 1, 0) : vec3(0, 0, 1));
    vec3 offset = 0.003 * direction;
    gradient += direction * (distanceToGlass(p + offset, breath) - distanceToGlass(p - offset, breath));
  }
  return normalize(gradient);
}

float softbox(vec3 ray, vec3 axis, vec3 vertical, vec2 extent) {
  float forward = dot(ray, axis);
  vec3 horizontal = normalize(cross(axis, vertical));
  vec2 uv = vec2(dot(ray, horizontal), dot(ray, cross(axis, horizontal))) / max(0.015, forward);
  uv /= extent;
  float shape = uv.x * uv.x + uv.y * uv.y;
  return exp2(-shape * 1.55) * smoothstep(0.03, 0.18, forward);
}

vec3 studio(vec3 ray) {
  vec3 ice = normalize(vec3(-0.74, 0.40, 0.55));
  vec3 top = normalize(vec3(0.31, 0.88, -0.36));
  vec3 rose = normalize(vec3(0.92, -0.27, 0.24));
  vec3 rim = normalize(vec3(-0.54, -0.65, -0.53));
  vec3 sky = vec3(0.0011, 0.0016, 0.003)
    + vec3(0.063, 0.052, 0.062) * pow(max(0.0, ray.y * 0.65 + 0.35), 2.0);
  float key = softbox(ray, ice, vec3(0.12, 1.0, 0.1), vec2(0.31, 1.8));
  sky += vec3(0.64, 0.61, 0.64) * key + vec3(1.55, 1.52, 1.55) * pow(key, 6.5);
  sky += vec3(2.98, 2.97, 3.0) * softbox(ray, ice, vec3(0.12, 1.0, 0.1), vec2(0.06, 1.64));
  float overhead = softbox(ray, top, vec3(0.2, 0.1, 1.0), vec2(1.42, 0.28));
  sky += vec3(1.23, 0.044, 0.075) * overhead + vec3(2.1, 0.43, 0.47) * pow(overhead, 5.0);
  float edge = softbox(ray, rose, vec3(0.3, 1.0, -0.2), vec2(0.2, 1.8));
  sky += vec3(1.07, 0.064, 0.096) * edge + vec3(2.38, 0.91, 0.92) * pow(edge, 8.0);
  sky += vec3(1.55, 0.23, 0.29) * softbox(ray, rim, vec3(1.0, 0.0, 0.3), vec2(1.2, 0.13));
  return sky;
}

vec3 glass(vec3 n, vec3 back, float thickness, vec2 pulse) {
  vec3 view = vec3(0.0, 0.0, -1.0);
  float grazing = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.2);
  vec3 incident = refract(view, n, 1.0 / 1.49);
  float exitCos = clamp(dot(incident, back), 0.0, 1.0);
  float discriminant = 1.0 - 1.49 * 1.49 * (1.0 - exitCos * exitCos);
  vec3 exitRay = normalize(1.49 * (incident - back * exitCos) + back * sqrt(max(0.0, discriminant)));
  vec3 bounce = studio(reflect(incident, back));
  // Ruby glass absorbs green and blue along the measured refracted path.
  vec3 transmission = exp(-thickness * vec3(0.42, 6.7, 5.5));
  vec3 through = studio(exitRay) * transmission;
  vec3 radiance = mix(bounce * transmission * 0.82, through, smoothstep(-0.09, 0.12, discriminant));
  radiance += bounce * transmission * 0.15;
  vec3 reflected = reflect(view, n);
  float cove = (dot(reflected, normalize(vec3(-0.12, 0.91, 0.39))) - 0.56) / 0.036;
  radiance += vec3(1.02, 1.02, 1.06) * exp2(-cove * cove) * smoothstep(-0.3, 0.71, -reflected.x);
  radiance += studio(reflected) * (0.43 + 1.18 * grazing);
  // Near the critical angle, dispersed light gathers on the far optical interface.
  vec3 caustic = exp(-abs(vec3(exitCos) - vec3(0.731, 0.742, 0.755)) * vec3(52.0, 67.0, 44.0));
  radiance += caustic * vec3(0.99, 0.08, 0.115) * (0.34 + 0.66 * (1.0 - grazing));
  radiance += vec3(0.23, 0.125, 0.14) * grazing;
  // The leading glint sits inside the glass, with a wider ruby wake behind it.
  float focus = 0.2 + 0.8 * exp2(-abs(exitCos - 0.82) * 7.0);
  radiance += pulse.x * vec3(3.4, 1.72, 1.69) * focus
    + pulse.y * vec3(2.4, 0.055, 0.13) * (0.5 + thickness);
  return pow(1.0 - exp(-radiance * 1.85), vec3(0.60));
}

vec3 dropletLight(vec3 normal, float beat, float inputForce) {
  vec3 key = normalize(vec3(-0.54 + 0.29 * sin(beat), 0.45 + 0.24 * cos(beat), 0.76));
  float shine = max(0.0, dot(normal, key));
  float edge = 1.0 - clamp(normal.z, 0.0, 1.0);
  return vec3(0.18, 0.012, 0.036) * (0.62 + edge)
    + vec3(0.95, 0.73, 0.72) * pow(shine, 49.0)
    + inputForce * (vec3(0.44, 0.042, 0.067) + vec3(0.44, 0.28, 0.26) * pow(shine, 7.0));
}

void main() {
  vec2 point = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / size * cssSize;
  mat2 rotation = mat2(cameraRight.w, cameraUp.w, -cameraUp.w, cameraRight.w);
  vec2 p = rotation * (screenPlane(point) * vec2(1.0, -1.0));
  vec2 pointer = clamp((hill - cssSize * 0.5) / min(cssSize.x, cssSize.y), -0.75, 0.75);
  vec3 right = cameraRight.xyz, up = cameraUp.xyz, eye = cameraEye.xyz;
  float breath = cameraEye.w;
  vec3 origin = right * p.x + up * p.y + eye * 1.12;
  traceLarge = nearDrop(origin, -eye, largeDrop, largeStretch.xyz);
  traceSmall = nearDrop(origin, -eye, smallDrop, smallStretch.xyz);
  if (!traceLarge && !traceSmall && dot(p, p) > ringBound * ringBound) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float closest;
  vec3 front = traceFront(origin, -eye, breath, closest);
  if (closest > 0.046) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 normal = surfaceNormal(front, breath);
  float facing = max(0.0, dot(normal, eye));
  if (closest < 0.0) closest = -max(0.002, 0.13 * facing * facing);
  vec3 response = interaction(point);
  float flow = sin(dot(front.xy, vec2(6.1, 4.2)) + sin(phase * 0.31)) * 0.009;
  vec2 tiltLight = (rotation * vec2(pointer.x, -pointer.y)) * lift * 0.17;
  normal = normalize(normal + vec3(flow + response.x * 1.1 + tiltLight.x, tiltLight.y - response.x, 0.0));
  vec3 transmitted = refract(-eye, normal, 1.0 / 1.49);
  vec3 exitPoint = traceExit(front, transmitted, breath);
  vec3 back = surfaceNormal(exitPoint, breath);
  // Resolve both interfaces in full precision before quantizing the reflected and refracted light.
  vec3 frontView = vec3(dot(right, normal), dot(up, normal), dot(eye, normal));
  vec3 backView = vec3(dot(right, back), dot(up, back), dot(eye, back));
  vec2 pulse = traceLarge || traceSmall ? vec2(0.0) : response.yz;
  vec3 color = glass(frontView, backView, length(exitPoint - front), pulse);
  if (traceLarge) color += dropletLight(frontView, phase * 2.3, largeStretch.w);
  if (traceSmall) color += dropletLight(frontView, phase * 3.1 + 1.4, smallStretch.w);
  gl_FragColor = vec4(color, clamp(0.5 - 12.0 * closest, 0.0, 1.0));
}
`;

export const GLASS_FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform highp sampler2D field;
uniform vec2 size;

void main() {
  vec4 resolved = texture2D(field, gl_FragCoord.xy / size);
  float coverage = smoothstep(-0.75, 0.75, (resolved.a - 0.5) / max(0.002, fwidth(resolved.a)));
  // Transmit the stage light in smoked areas while keeping the brightest reflections opaque.
  float peak = max(max(resolved.r, resolved.g), resolved.b);
  float opacity = coverage * mix(0.35, 1.0, peak);
  gl_FragColor = vec4(resolved.rgb * coverage, opacity);
}
`;
