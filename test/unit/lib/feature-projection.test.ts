import { fitFeatureProjection } from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';
import { describe, expect, it } from 'vitest';

function trainingClass(id: string, vectors: number[][]): MLClass {
  return {
    id,
    name: id,
    color: 'red',
    images: vectors.map((featureArray, index) => ({
      id: `${id}-${index}`,
      dataUrl: '',
      featureArray,
    })),
  };
}

describe('training feature projection', () => {
  it('puts each example and its live equivalent in the same normalized feature space', async () => {
    const classes = [
      trainingClass('cat', [
        [1, 0, 0],
        [2, 0, 0],
        [-1, 0, 0],
        [-2, 0, 0],
      ]),
      trainingClass('dog', [
        [0, 1, 0],
        [0, -1, 0],
      ]),
    ];
    const result = await fitFeatureProjection(classes, new AbortController().signal);
    const [cat, duplicate, oppositeCat, , dog, oppositeDog] = result.points;

    expect(result.points.map((point) => point.classId)).toEqual([
      'cat',
      'cat',
      'cat',
      'cat',
      'dog',
      'dog',
    ]);
    expect(cat).toEqual(duplicate);
    expect(result.project(new Float32Array([8, 0, 0]))).toEqual({ x: cat.x, y: cat.y });
    const liveDog = result.project([0, -3, 0]);
    expect(liveDog.x).toBeCloseTo(oppositeDog.x, 10);
    expect(liveDog.y).toBeCloseTo(oppositeDog.y, 10);
    expect(Math.abs(cat.x - oppositeCat.x)).toBeCloseTo(2, 3);
    expect(Math.abs(dog.y - oppositeDog.y)).toBeCloseTo(2, 3);
  });

  it('keeps coincident points together when the dataset has no variance', async () => {
    const classes = [
      trainingClass('cat', [
        [0, 0, 0],
        [0, 0, 0],
      ]),
      trainingClass('dog', [
        [0, 0, 0],
        [0, 0, 0],
      ]),
    ];
    const result = await fitFeatureProjection(classes, new AbortController().signal);
    expect(result.points).toEqual([
      { classId: 'cat', x: 0, y: 0 },
      { classId: 'cat', x: 0, y: 0 },
      { classId: 'dog', x: 0, y: 0 },
      { classId: 'dog', x: 0, y: 0 },
    ]);
    expect(result.project([1, 2, 3])).toEqual({ x: 0, y: 0 });
  });

  it('stops fitting when the owner leaves while a large dataset is being prepared', async () => {
    const horizontal = Array.from({ length: 1280 }, (_, index) => Number(index === 0));
    const vertical = Array.from({ length: 1280 }, (_, index) => Number(index === 1));
    const classes = Array.from({ length: 15 }, (_, index) =>
      trainingClass(
        String(index),
        Array<number[]>(200).fill(index % 2 === 0 ? horizontal : vertical),
      ),
    );
    const controller = new AbortController();
    const fitting = fitFeatureProjection(classes, controller.signal);
    setTimeout(() => controller.abort(), 0);
    await expect(fitting).rejects.toHaveProperty('name', 'AbortError');
  });
});
