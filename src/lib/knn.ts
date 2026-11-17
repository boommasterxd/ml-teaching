export type ExampleSignal = 'dog' | 'cat';

export interface KnnPosition {
  readonly x: number;
  readonly y: number;
}

export interface KnnPoint extends KnnPosition {
  readonly id: string;
  readonly signal: ExampleSignal;
}

export function squaredDistance(point: KnnPosition, query: KnnPosition) {
  return (point.x - query.x) ** 2 + (point.y - query.y) ** 2;
}

export function nearestNeighbors<T extends KnnPosition>(
  points: readonly T[],
  query: KnnPosition,
  count: number,
): T[] {
  return points
    .toSorted((a, b) => squaredDistance(a, query) - squaredDistance(b, query))
    .slice(0, count);
}

export function countVotes(points: readonly KnnPoint[]) {
  const votes = { dog: 0, cat: 0 };
  for (const point of points) votes[point.signal] += 1;
  return votes;
}

export function winningSignal(votes: Readonly<Record<ExampleSignal, number>>): ExampleSignal {
  return votes.dog > votes.cat ? 'dog' : 'cat';
}
