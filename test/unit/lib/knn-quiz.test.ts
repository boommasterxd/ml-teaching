import { describe, expect, it } from 'vitest';
import { countVotes, nearestNeighbors, squaredDistance, winningSignal } from '@/lib/knn';
import { createKnnRound, KNN_MAX_NEIGHBORS } from '@/lib/knn-quiz';

function seededRandom(seed: number) {
  let state = Math.imul(seed + 1, 2654435761) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe('synthetic KNN exercise rounds', () => {
  it('keeps targets separated for mobile hit areas', () => {
    for (let seed = 1; seed <= 128; seed += 1) {
      const round = createKnnRound(seededRandom(seed));
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

  it('provides ten unambiguous distances, a tie at two and a majority at three', () => {
    const round = createKnnRound(seededRandom(42));
    const ranked = nearestNeighbors(round.points, round.query, round.points.length);
    expect(round.ranked).toEqual(ranked);
    const distances = ranked.map((point) => Math.sqrt(squaredDistance(point, round.query)));
    expect(distances).toHaveLength(12);
    for (const [index, distance] of distances.slice(0, KNN_MAX_NEIGHBORS).entries()) {
      expect(distances[index + 1] - distance).toBeGreaterThan(0.5);
    }
    expect(winningSignal(countVotes(ranked.slice(0, 2)))).toBeNull();
    expect(winningSignal(countVotes(ranked.slice(0, 3)))).toBe(round.input);
  });

  it('varies the question and layout reproducibly without retrying random generation', () => {
    const rounds = Array.from({ length: 64 }, (_, seed) => createKnnRound(seededRandom(seed)));
    expect(createKnnRound(seededRandom(42))).toEqual(createKnnRound(seededRandom(42)));
    expect(new Set(rounds.map((round) => round.input))).toEqual(new Set(['dog', 'cat']));
    expect(new Set(rounds.map((round) => JSON.stringify(round))).size).toBe(64);
  });

  it('bounds generation without retries even with a constant RNG', () => {
    for (const value of [0, 0.999999]) {
      let calls = 0;
      const round = createKnnRound(() => {
        calls += 1;
        return value;
      });
      expect(round.points).toHaveLength(12);
      expect(calls).toBeLessThanOrEqual(40);
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
