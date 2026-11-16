import { describe, expect, it } from 'vitest';
import { KNN_EXAMPLES, KNN_NEIGHBOR_COUNT, KNN_POINTS, NETWORK_RESULTS } from '@/lib/network-demo';

describe('the educational KNN examples', () => {
  it.each([
    ['dog', 'Hund erkannt (2 von 3 Stimmen)'],
    ['cat', 'Katze erkannt (2 von 3 Stimmen)'],
  ] as const)(
    'shows the three nearest examples and their %s majority',
    (signal, expectedResult) => {
      const example = KNN_EXAMPLES[signal];
      const selectedIds = new Set(example.neighbors.map((point) => point.id));
      const distance = (point: { x: number; y: number }) =>
        Math.hypot(point.x - example.query.x, point.y - example.query.y);
      const selected = KNN_POINTS.filter((point) => selectedIds.has(point.id));
      const remaining = KNN_POINTS.filter((point) => !selectedIds.has(point.id));

      expect(KNN_NEIGHBOR_COUNT).toBe(3);
      expect(selectedIds.size).toBe(3);
      expect(selected).toHaveLength(3);
      expect(Math.max(...selected.map(distance))).toBeLessThanOrEqual(
        Math.min(...remaining.map(distance)),
      );
      expect(example.votes.dog).toBe(selected.filter((point) => point.signal === 'dog').length);
      expect(example.votes.cat).toBe(selected.filter((point) => point.signal === 'cat').length);
      expect(example.votes[signal]).toBe(2);
      expect(example.winner).toBe(signal);
      expect(NETWORK_RESULTS[signal]).toBe(expectedResult);
    },
  );
});
