import type { ML } from '@/constants';
import type { ProjectedPosition } from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';

const shapes = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'plus',
  'cross',
  'star',
  'triangle-down',
  'arrow-right',
  'arrow-left',
  'semicircle',
  'ring',
  'horizontal-bar',
  'vertical-bar',
  'hourglass',
] as const satisfies readonly string[] & { length: typeof ML.MAX_CLASSES };

type MarkerShape = (typeof shapes)[number];

const polygons: Record<
  Exclude<MarkerShape, 'circle' | 'square' | 'triangle' | 'semicircle' | 'ring'>,
  readonly (readonly [number, number])[]
> = {
  diamond: [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ],
  plus: [
    [-0.35, -1],
    [0.35, -1],
    [0.35, -0.35],
    [1, -0.35],
    [1, 0.35],
    [0.35, 0.35],
    [0.35, 1],
    [-0.35, 1],
    [-0.35, 0.35],
    [-1, 0.35],
    [-1, -0.35],
    [-0.35, -0.35],
  ],
  cross: [
    [-1, -0.65],
    [-0.65, -1],
    [0, -0.35],
    [0.65, -1],
    [1, -0.65],
    [0.35, 0],
    [1, 0.65],
    [0.65, 1],
    [0, 0.35],
    [-0.65, 1],
    [-1, 0.65],
    [-0.35, 0],
  ],
  star: [
    [0, -1],
    [0.24, -0.34],
    [0.95, -0.31],
    [0.39, 0.12],
    [0.59, 0.81],
    [0, 0.43],
    [-0.59, 0.81],
    [-0.39, 0.12],
    [-0.95, -0.31],
    [-0.24, -0.34],
  ],
  'triangle-down': [
    [-1, -1],
    [1, -1],
    [0, 1],
  ],
  'arrow-right': [
    [-1, -0.4],
    [0, -0.4],
    [0, -1],
    [1, 0],
    [0, 1],
    [0, 0.4],
    [-1, 0.4],
  ],
  'arrow-left': [
    [1, -0.4],
    [0, -0.4],
    [0, -1],
    [-1, 0],
    [0, 1],
    [0, 0.4],
    [1, 0.4],
  ],
  'horizontal-bar': [
    [-1, -0.35],
    [1, -0.35],
    [1, 0.35],
    [-1, 0.35],
  ],
  'vertical-bar': [
    [-0.35, -1],
    [0.35, -1],
    [0.35, 1],
    [-0.35, 1],
  ],
  hourglass: [
    [-1, -1],
    [1, -1],
    [0.28, 0],
    [1, 1],
    [-1, 1],
    [-0.28, 0],
  ],
};

const fixed = (value: number) => Math.round(value * 10) / 10;

function circlePath({ x, y }: ProjectedPosition, radius: number, sweep: 0 | 1) {
  const diameter = radius * 2;
  return `M${fixed(x - radius)} ${fixed(y)}a${radius} ${radius} 0 1 ${sweep} ${diameter} 0a${radius} ${radius} 0 1 ${sweep} ${-diameter} 0Z`;
}

export function markerPath(position: ProjectedPosition, shape: MarkerShape, radius: number) {
  const { x, y } = position;
  const diameter = radius * 2;
  if (shape === 'square')
    return `M${fixed(x - radius)} ${fixed(y - radius)}h${diameter}v${diameter}h-${diameter}Z`;
  if (shape === 'triangle')
    return `M${fixed(x)} ${fixed(y - radius)}l${radius} ${diameter}h-${diameter}Z`;
  if (shape === 'circle') return circlePath(position, radius, 0);
  if (shape === 'semicircle')
    return `M${fixed(x - radius)} ${fixed(y + radius / 2)}a${radius} ${radius} 0 0 1 ${diameter} 0Z`;
  // Opposite winding leaves the hole open where same-class markers overlap.
  if (shape === 'ring')
    return circlePath(position, radius, 0) + circlePath(position, radius / 2, 1);
  const vertices = polygons[shape].map(
    ([dx, dy]) => `${fixed(x + dx * radius)} ${fixed(y + dy * radius)}`,
  );
  return `M${vertices.join('L')}Z`;
}

export function getMarkerStyles(classes: readonly MLClass[]) {
  return classes.map(({ id, name, color }, index) => ({
    id,
    name,
    color,
    shape: shapes[index % shapes.length],
  }));
}

export type ClassMarker = ReturnType<typeof getMarkerStyles>[number];
