import { act, renderHook, waitFor } from '@testing-library/react';
import { usePredictionSpacePreparation } from '@/hooks/usePredictionSpacePreparation';
import { fitFeatureProjection } from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/feature-projection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/feature-projection')>();
  return { ...actual, fitFeatureProjection: vi.fn(actual.fitFeatureProjection) };
});

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

describe('workspace projection preparation', () => {
  const compute = vi.mocked(fitFeatureProjection);
  const initialClasses = [
    trainingClass('cat', Array<number[]>(10).fill([1, 0])),
    trainingClass('dog', Array<number[]>(11).fill([0, 1])),
  ];

  it('retains a rename, then discards the pending result when another class loses an image', async () => {
    const [cat, dog] = initialClasses;
    const oldProjection = await fitFeatureProjection(initialClasses, new AbortController().signal);
    const oldJob = Promise.withResolvers<typeof oldProjection>();
    compute.mockClear().mockReturnValueOnce(oldJob.promise);
    const { result, rerender } = renderHook<
      ReturnType<typeof usePredictionSpacePreparation>,
      { classes: MLClass[] | undefined }
    >(({ classes }) => usePredictionSpacePreparation(classes, true), {
      initialProps: { classes: initialClasses },
    });
    await waitFor(() => expect(compute).toHaveBeenCalledOnce());
    const oldSignal = compute.mock.calls[0][1];

    rerender({ classes: [cat, { ...dog, name: 'Hund' }] });
    expect(compute).toHaveBeenCalledOnce();
    expect(oldSignal.aborted).toBe(false);

    rerender({ classes: undefined });
    expect(oldSignal.aborted).toBe(true);
    expect(result.current.result).toBeUndefined();
    rerender({ classes: [cat, { ...dog, images: dog.images.slice(1) }] });
    await waitFor(() => expect(result.current.result).toHaveProperty('model.points.length', 20));
    const replacement = result.current.result;
    expect(compute).toHaveBeenCalledTimes(2);
    await act(async () => oldJob.resolve(oldProjection));
    expect(result.current.result).toBe(replacement);
  });

  it('can retry a failed preparation once across repeated intent and aborts on workspace exit', async () => {
    const nextJob = Promise.withResolvers<Awaited<ReturnType<typeof fitFeatureProjection>>>();
    compute
      .mockClear()
      .mockRejectedValueOnce(new Error('Projection failed'))
      .mockReturnValueOnce(nextJob.promise);
    const { result, unmount } = renderHook(() =>
      usePredictionSpacePreparation(initialClasses, true),
    );
    await waitFor(() => expect(result.current.result).toEqual({ failed: true }));
    act(() => {
      result.current.prepare();
      result.current.prepare();
    });
    await waitFor(() => expect(compute).toHaveBeenCalledTimes(2));
    const retrySignal = compute.mock.calls[1][1];
    expect(retrySignal.aborted).toBe(false);
    unmount();
    expect(retrySignal.aborted).toBe(true);
    await act(async () => nextJob.reject(retrySignal.reason));
  });
});
