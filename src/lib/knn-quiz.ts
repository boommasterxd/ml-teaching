import {
  nearestNeighbors,
  squaredDistance,
  type ExampleSignal,
  type KnnPoint,
  type KnnPosition,
} from '@/lib/knn';

export type KnnNeighborCount = 1 | 3 | 5;

export interface KnnRound {
  readonly points: readonly KnnPoint[];
  readonly query: KnnPosition;
  readonly input: ExampleSignal;
}

// These synthetic features explain KNN; they do not classify real images.
const OUTER_POINTS: readonly KnnPosition[] = [
  { x: 8, y: 8 },
  { x: 36, y: 8 },
  { x: 64, y: 8 },
  { x: 92, y: 8 },
  { x: 8, y: 36 },
  { x: 92, y: 36 },
  { x: 8, y: 64 },
  { x: 92, y: 64 },
  { x: 8, y: 92 },
  { x: 36, y: 92 },
  { x: 64, y: 92 },
  { x: 92, y: 92 },
];
const QUERY: KnnPosition = { x: 50, y: 50 };

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createTransform(random: () => number) {
  const rotation = Math.floor(random() * 4);
  const reflected = random() < 0.5;
  const offsetX = random() * 4 - 2;
  const offsetY = random() * 4 - 2;
  return ({ x, y }: KnnPosition): KnnPosition => {
    let horizontal = reflected ? 100 - x : x;
    let vertical = y;
    for (let turn = 0; turn < rotation; turn += 1) {
      [horizontal, vertical] = [100 - vertical, horizontal];
    }
    return { x: horizontal + offsetX, y: vertical + offsetY };
  };
}

function createPositions(count: KnnNeighborCount, random: () => number) {
  const inner = Array.from({ length: count }, (_, index) => {
    const angle = (index * 2 * Math.PI) / count;
    const radius = 20 + index * 2;
    return {
      x: QUERY.x + Math.cos(angle) * radius,
      y: QUERY.y + Math.sin(angle) * radius,
    };
  });
  // The fixed outer ring leaves a clear distance gap after exactly the active k.
  // Removing conflicting slots preserves 44px target separation on a 232px board.
  const outer = OUTER_POINTS.filter((point) =>
    inner.every((neighbor) => squaredDistance(point, neighbor) >= 19 ** 2),
  );
  return [...inner, ...shuffled(outer, random).slice(0, 12 - count)];
}

/** Bounded random construction, with no retry loop; RNG follows Math.random's [0, 1) contract. */
export function createKnnRound(
  random: () => number = Math.random,
  k: KnnNeighborCount = 3,
  input?: ExampleSignal,
): KnnRound {
  const signal: ExampleSignal = input ?? (random() < 0.5 ? 'dog' : 'cat');
  const other: ExampleSignal = signal === 'dog' ? 'cat' : 'dog';
  const transform = createTransform(random);
  const query = transform(QUERY);
  const positions = createPositions(k, random).map(transform);
  const ranked = nearestNeighbors(positions, query, positions.length);
  // The active odd k has the input majority; k=3 and k=5 also teach minority votes.
  const signals = [
    signal,
    other,
    signal,
    other,
    signal,
    ...shuffled([signal, signal, signal, other, other, other, other], random),
  ];
  const points = ranked.map((point, index) => ({
    ...point,
    signal: signals[index],
  }));
  const numberedPoints = shuffled(points, random).map((point, index) => ({
    ...point,
    id: `point-${index + 1}`,
  }));
  return { points: numberedPoints, query, input: signal };
}
