import { nearestNeighbors, type ExampleSignal, type KnnPoint, type KnnPosition } from '@/lib/knn';

export const KNN_MIN_NEIGHBORS = 1;
export const KNN_MAX_NEIGHBORS = 10;

export interface KnnRound {
  readonly points: readonly KnnPoint[];
  readonly ranked: readonly KnnPoint[];
  readonly query: KnnPosition;
  readonly input: ExampleSignal;
}

// These synthetic features explain KNN; they do not classify real images.
const POSITIONS: readonly KnnPosition[] = [
  { x: 70, y: 50 },
  { x: 39, y: 69 },
  { x: 38, y: 29 },
  { x: 12, y: 32 },
  { x: 11, y: 60 },
  { x: 92, y: 89 },
  { x: 11, y: 12 },
  { x: 37, y: 89 },
  { x: 64, y: 8 },
  { x: 92, y: 32 },
  { x: 92, y: 8 },
  { x: 39, y: 8 },
];
const QUERY: KnnPosition = { x: 50, y: 50 };
const RANKED_POSITIONS = nearestNeighbors(POSITIONS, QUERY, POSITIONS.length);

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

/** Bounded random construction, with no retry loop; RNG follows Math.random's [0, 1) contract. */
export function createKnnRound(random: () => number = Math.random): KnnRound {
  const signal: ExampleSignal = random() < 0.5 ? 'dog' : 'cat';
  const other: ExampleSignal = signal === 'dog' ? 'cat' : 'dog';
  const transform = createTransform(random);
  const query = transform(QUERY);
  // The first pair teaches ties. The default three have a clear majority.
  const signals = [
    signal,
    other,
    signal,
    other,
    signal,
    ...shuffled([signal, signal, signal, other, other, other, other], random),
  ];
  const labeled = RANKED_POSITIONS.map((point, index) => ({
    ...transform(point),
    signal: signals[index],
  }));
  const points = shuffled(labeled, random).map((point, index) => ({
    ...point,
    id: `point-${index + 1}`,
  }));
  return { points, ranked: nearestNeighbors(points, query, points.length), query, input: signal };
}
