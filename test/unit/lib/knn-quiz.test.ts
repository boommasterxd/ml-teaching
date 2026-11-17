import { describe, expect, it } from 'vitest';
import { countVotes, nearestNeighbors, squaredDistance, winningSignal } from '@/lib/knn';
import { createKnnRound, type KnnNeighborCount } from '@/lib/knn-quiz';

const COUNTS: readonly KnnNeighborCount[] = [1, 3, 5];

function seededRandom(seed: number) {
  let state = Math.imul(seed + 1, 2654435761) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe('synthetic KNN exercise rounds', () => {
  it.each(COUNTS)('keeps targets separated for mobile hit areas with k=%s', (k) => {
    for (let seed = 1; seed <= 128; seed += 1) {
      const round = createKnnRound(seededRandom(seed), k);
      const targets = [...round.points, round.query];
      expect(round.points).toHaveLength(12);
      expect(new Set(round.points.map((point) => point.id)).size).toBe(12);
      expect(countVotes(round.points)).toEqual({ dog: 6, cat: 6 });
      for (const [index, point] of targets.entries()) {
        expect(point.x).toBeGreaterThanOrEqual(6);
        expect(point.x).toBeLessThanOrEqual(94);
        expect(point.y).toBeGreaterThanOrEqual(6);
        expect(point.y).toBeLessThanOrEqual(94);
        for (const other of targets.slice(index + 1)) {
          // 19% of the minimum 232px board exceeds the 44px target diameter.
          expect(Math.sqrt(squaredDistance(point, other))).toBeGreaterThanOrEqual(19);
        }
      }
    }
  });

  it.each(COUNTS)('leaves an obvious gap after the k=%s nearest points', (k) => {
    for (let seed = 1; seed <= 128; seed += 1) {
      const round = createKnnRound(seededRandom(seed), k);
      const ranked = nearestNeighbors(round.points, round.query, 12);
      const distances = ranked.map((point) => Math.sqrt(squaredDistance(point, round.query)));
      expect(distances[k] - distances[k - 1]).toBeGreaterThanOrEqual(14);
      expect(distances[k] / distances[k - 1]).toBeGreaterThanOrEqual(1.5);
      const neighbors = nearestNeighbors(round.points, round.query, k);
      const votes = countVotes(neighbors);
      expect(neighbors).toHaveLength(k);
      expect(votes[round.input]).toBe((k + 1) / 2);
      expect(winningSignal(votes)).toBe(round.input);
    }
  });

  it('varies the question and layout reproducibly without retrying random generation', () => {
    const rounds = Array.from({ length: 64 }, (_, seed) => createKnnRound(seededRandom(seed)));
    expect(createKnnRound(seededRandom(42))).toEqual(createKnnRound(seededRandom(42)));
    expect(new Set(rounds.map((round) => round.input))).toEqual(new Set(['dog', 'cat']));
    expect(new Set(rounds.map((round) => JSON.stringify(round))).size).toBe(64);
  });

  it.each(COUNTS)('bounds generation without retries even with a constant RNG for k=%s', (k) => {
    for (const value of [0, 0.999999]) {
      let calls = 0;
      const round = createKnnRound(() => {
        calls += 1;
        return value;
      }, k);
      expect(round.points).toHaveLength(12);
      expect(calls).toBeLessThanOrEqual(40);
      const ranked = nearestNeighbors(round.points, round.query, 12);
      const inside = Math.sqrt(squaredDistance(ranked[k - 1], round.query));
      const outside = Math.sqrt(squaredDistance(ranked[k], round.query));
      expect(outside - inside).toBeGreaterThanOrEqual(14);
    }
  });

  it('preserves the photo class when rebuilding the layout for a different k', () => {
    for (const input of ['dog', 'cat'] as const) {
      for (const k of COUNTS) {
        const round = createKnnRound(seededRandom(42), k, input);
        expect(round.input).toBe(input);
        expect(winningSignal(countVotes(nearestNeighbors(round.points, round.query, k)))).toBe(
          input,
        );
      }
    }
  });

  it('does not reveal the nearest answers through point numbers', () => {
    const answerIds = Array.from({ length: 64 }, (_, seed) => {
      const round = createKnnRound(seededRandom(seed));
      return nearestNeighbors(round.points, round.query, 3)
        .map((point) => point.id)
        .toSorted()
        .join(',');
    });

    expect(new Set(answerIds).size).toBeGreaterThan(1);
    expect(answerIds.some((ids) => ids !== 'point-1,point-2,point-3')).toBe(true);
  });
});
