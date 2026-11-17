import { describe, expect, it } from 'vitest';
import {
  countVotes,
  nearestNeighbors,
  squaredDistance,
  winningSignal,
  type KnnPoint,
} from '@/lib/knn';

describe('shared KNN classification', () => {
  it('ranks by both coordinates around the query without changing source points', () => {
    const points: readonly KnnPoint[] = [
      { id: 'far', x: 7, y: 9, signal: 'cat' },
      { id: 'third', x: 9, y: 0, signal: 'cat' },
      { id: 'nearest', x: 6, y: 5, signal: 'dog' },
      { id: 'second', x: 8, y: 5, signal: 'dog' },
    ];
    const query = { x: 5, y: 5 };
    const neighbors = nearestNeighbors(points, query, 3);

    expect(neighbors.map((point) => point.id)).toEqual(['nearest', 'second', 'far']);
    expect(points[0].id).toBe('far');
    expect(squaredDistance(points[0], query)).toBe(20);
    const votes = countVotes(neighbors);
    expect(votes).toEqual({ dog: 2, cat: 1 });
    expect(winningSignal(votes)).toBe('dog');
  });
});
