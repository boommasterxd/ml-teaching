export const DIGIT_GEOMETRY = `
const float digitSpacing = 0.97;
const float strokeRadius = 0.14;
const float strokeDepth = 0.21;
const float bevelWidth = 0.066;
const float bevelDepth = 0.105;
bool traceZero;

// The same fillet rounds the outline's exterior corners and its carved notches.
float roundedMin(float first, float second) {
  const float fillet = 0.095;
  float overlap = max(fillet - abs(first - second), 0.0);
  return min(first, second) - overlap * overlap / (4.0 * fillet);
}

float roundedMax(float first, float second) {
  return -roundedMin(-first, -second);
}

float zeroStroke(vec2 p) {
  const float corner = 0.215;
  vec2 inset = abs(p) - vec2(0.255, 0.41) + corner;
  return abs(length(max(inset, 0.0)) + min(max(inset.x, inset.y), 0.0) - corner);
}

float fourOutline(vec2 p) {
  // Half-planes cut an open-top four from a single silhouette, including the stem reliefs.
  const float diagonal = 0.39;
  const float slopeScale = 0.9317;
  float diagonalEdge = (p.x + 0.41 - diagonal * (p.y + 0.02)) * slopeScale;
  float outer = roundedMin(0.55 - abs(p.y), roundedMin(p.x + 0.41, 0.42 - p.x));
  outer = roundedMin(outer, diagonalEdge);

  float outsideStem = roundedMax(0.065 - p.x, p.x - 0.295);
  float aboveStem = roundedMax(outsideStem, p.y - 0.40);
  float pastDiagonal = (p.x + 0.17 - diagonal * (p.y - 0.015)) * slopeScale;
  float upperNotch = roundedMin(p.y - 0.015, roundedMin(aboveStem, pastDiagonal));
  float lowerNotch = roundedMin(-0.195 - p.y, outsideStem);
  return roundedMax(-outer, roundedMax(upperNotch, lowerNotch));
}

float fourBody(vec2 p) {
  vec2 slope = p * vec2(0.30, 0.24);
  return 0.094 - dot(slope, slope) + 0.027 * p.y;
}

float distanceToGlass(vec3 p, float breath) {
  if (traceZero) {
    vec2 section = vec2(zeroStroke(p.xy) / strokeRadius, p.z / (strokeDepth * breath));
    return (length(section) - 1.0) * strokeRadius;
  }
  vec2 section = vec2(1.0 + fourOutline(p.xy) / bevelWidth,
    (abs(p.z) / breath - fourBody(p.xy)) / bevelDepth);
  return (length(max(section, 0.0)) + min(max(section.x, section.y), 0.0) - 1.0) * bevelWidth;
}

float frontDepth(vec2 p, float silhouette) {
  if (traceZero) {
    float section = 1.0 + silhouette / strokeRadius;
    return strokeDepth * sqrt(max(0.0, 1.0 - section * section));
  }
  float section = max(0.0, 1.0 + silhouette / bevelWidth);
  return fourBody(p) + bevelDepth * sqrt(max(0.0, 1.0 - section * section));
}

vec2 digitPlane(vec2 point) {
  return (point / cssSize.x - vec2(0.5, 0.5 * cssSize.y / cssSize.x)) * vec2(3.2, -3.2);
}

mat2 digitRoll(float angle) {
  vec2 direction = vec2(cos(angle), sin(angle));
  return mat2(direction, -direction.y, direction.x);
}
`;

export const DIGIT_SCENE = `
vec3 digitImpulse(vec2 point) {
  vec3 response = vec3(0.0);
  float width = clamp(cssSize.x * 0.055, 14.0, 28.0);
  for (int i = 0; i < RIPPLE_CAPACITY; i++) {
    vec4 ripple = ripples[i];
    if (ripple.w < 0.5) break;
    float travel = (length(point - ripple.xy) - ripple.z * reach * 1.15) / width;
    float fade = 1.0 - smoothstep(0.77, 1.0, ripple.z);
    float crest = exp2(-travel * travel * 3.8);
    float wake = travel + 0.75;
    response += fade * vec3(0.06 * crest * sin(travel * 2.4), crest, exp2(-wake * wake * 0.82));
  }
  return response;
}

void main() {
  vec2 point = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / size * cssSize;
  vec2 plane = digitPlane(point);
  float digit = clamp(floor(plane.x / digitSpacing + 0.5), -1.0, 1.0);
  vec2 rest = vec2(digit * digitSpacing, 0.0);
  if (any(greaterThan(abs(plane - rest), vec2(0.51, 0.65)))) {
    gl_FragColor = vec4(0.0);
    return;
  }

  traceZero = digit == 0.0;
  float beat = phase + digit * 2.1;
  vec2 pointer = clamp(digitPlane(hill) - rest, -1.0, 1.0);
  float hover = min(lift, 1.5) * exp2(-dot(pointer, pointer) * 2.4);
  vec2 drift = vec2(cos(beat), sin(beat)) * vec2(0.008, 0.028) + hover * pointer * 0.027;
  float angle = sin(beat) * 0.045 + hover * pointer.x * 0.038;
  mat2 intoDigit = digitRoll(-angle);
  vec2 local = intoDigit * (plane - rest - drift);
  float silhouette = traceZero ? zeroStroke(local) - strokeRadius : fourOutline(local);
  if (silhouette > 0.042) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // The orthographic front hit is the positive root of the elliptical section.
  float breath = 1.0 + 0.085 * cos(beat);
  vec3 front = vec3(local, breath * frontDepth(local, silhouette));
  vec3 response = digitImpulse(point);
  vec3 normal = surfaceNormal(front, breath);
  float flow = sin(dot(local, vec2(13.0, 8.0)) + beat) * 0.027;
  vec2 tilt = intoDigit * (hover * pointer * 0.3);
  normal = normalize(normal + vec3(flow + response.x + tilt.x, tilt.y - response.x, 0.0));
  vec3 transmitted = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / 1.49);
  vec3 exitPoint = traceExit(front, transmitted, breath);
  vec3 back = surfaceNormal(exitPoint, breath);
  mat2 outOfDigit = digitRoll(angle);
  vec3 color = glass(vec3(outOfDigit * normal.xy, normal.z), vec3(outOfDigit * back.xy, back.z),
    length(exitPoint - front), response.yz);
  gl_FragColor = vec4(color, clamp(0.5 - 12.0 * silhouette, 0.0, 1.0));
}
`;
