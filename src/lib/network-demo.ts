export type ExampleSignal = 'dog' | 'cat';

interface ExamplePoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly signal: ExampleSignal;
}

export const KNN_NEIGHBOR_COUNT = 3;

/** Synthetic feature coordinates for the explanatory diagram, never image inference. */
export const KNN_POINTS: readonly ExamplePoint[] = [
  { id: 'dog-1', x: 50, y: 50, signal: 'dog' },
  { id: 'dog-2', x: 92, y: 58, signal: 'dog' },
  { id: 'dog-3', x: 154, y: 60, signal: 'dog' },
  { id: 'dog-4', x: 36, y: 25, signal: 'dog' },
  { id: 'dog-5', x: 30, y: 80, signal: 'dog' },
  { id: 'dog-6', x: 43, y: 117, signal: 'dog' },
  { id: 'dog-7', x: 78, y: 25, signal: 'dog' },
  { id: 'dog-8', x: 107, y: 28, signal: 'dog' },
  { id: 'dog-9', x: 104, y: 115, signal: 'dog' },
  { id: 'cat-1', x: 69, y: 98, signal: 'cat' },
  { id: 'cat-2', x: 136, y: 88, signal: 'cat' },
  { id: 'cat-3', x: 174, y: 102, signal: 'cat' },
  { id: 'cat-4', x: 133, y: 23, signal: 'cat' },
  { id: 'cat-5', x: 185, y: 33, signal: 'cat' },
  { id: 'cat-6', x: 195, y: 74, signal: 'cat' },
  { id: 'cat-7', x: 182, y: 125, signal: 'cat' },
  { id: 'cat-8', x: 130, y: 126, signal: 'cat' },
  { id: 'cat-9', x: 116, y: 61, signal: 'cat' },
];

function createExample(query: { x: number; y: number }) {
  const distance = (point: ExamplePoint) => (point.x - query.x) ** 2 + (point.y - query.y) ** 2;
  const neighbors = KNN_POINTS.toSorted((a, b) => distance(a) - distance(b)).slice(
    0,
    KNN_NEIGHBOR_COUNT,
  );
  const votes = { dog: 0, cat: 0 };
  for (const point of neighbors) votes[point.signal] += 1;
  const winner: ExampleSignal = votes.dog > votes.cat ? 'dog' : 'cat';
  return { query, neighbors, votes, winner };
}

/** Calculate the two bounded examples once; animation only reveals their shared result. */
export const KNN_EXAMPLES = {
  dog: createExample({ x: 70, y: 70 }),
  cat: createExample({ x: 157, y: 90 }),
} as const;

export const NETWORK_RESULTS = {
  dog: `Hund erkannt (${KNN_EXAMPLES.dog.votes.dog} von ${KNN_NEIGHBOR_COUNT} Stimmen)`,
  cat: `Katze erkannt (${KNN_EXAMPLES.cat.votes.cat} von ${KNN_NEIGHBOR_COUNT} Stimmen)`,
} as const;
