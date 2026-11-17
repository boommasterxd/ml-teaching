import { describe, expect, it } from 'vitest';
import { createQuizRound, QUIZ_EXAMPLES } from '@/lib/recognition-quiz';

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

describe('recognition quiz rounds', () => {
  it('offers forty distinct everyday examples with equal correct and incorrect pools', () => {
    expect(QUIZ_EXAMPLES).toHaveLength(40);
    expect(new Set(QUIZ_EXAMPLES.map((example) => example.id)).size).toBe(40);
    expect(QUIZ_EXAMPLES.filter((example) => example.correct)).toHaveLength(20);
  });

  it('draws six distinct examples with three correct choices and varies selection and order', () => {
    const first = createQuizRound([], seededRandom(1));
    const second = createQuizRound([], seededRandom(2));
    for (const round of [first, second]) {
      expect(round).toHaveLength(6);
      expect(new Set(round.map((example) => example.id)).size).toBe(6);
      expect(round.filter((example) => example.correct)).toHaveLength(3);
      expect(round.every((example) => QUIZ_EXAMPLES.includes(example))).toBe(true);
    }
    expect(first.map((example) => example.id).sort()).not.toEqual(
      second.map((example) => example.id).sort(),
    );
    expect(first.map((example) => example.correct)).not.toEqual(
      second.map((example) => example.correct),
    );
  });

  it('changes the selection even when random draws repeat without retrying indefinitely', () => {
    let draws = 0;
    const repeatedRandom = () => {
      draws += 1;
      return 0;
    };
    const first = createQuizRound([], repeatedRandom);
    const next = createQuizRound(first, repeatedRandom);
    expect(next.some((example) => !first.includes(example))).toBe(true);
    expect(next.filter((example) => example.correct)).toHaveLength(3);
    expect(new Set(next.map((example) => example.id)).size).toBe(6);
    expect(draws).toBeLessThan(100);
  });
});
