import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useTrainingPanelLoading } from '@/components/training-panel-loading';

const loading = vi.hoisted(() => Promise.withResolvers<void>());

vi.mock('@/components/TrainingControls', async () => {
  await loading.promise;
  return { default: () => null };
});

it('requires a new activation when training eligibility was lost during loading', async () => {
  const activate = vi.fn();
  const { result, rerender } = renderHook(
    ({ canTrain }) => useTrainingPanelLoading(canTrain, false),
    { initialProps: { canTrain: true } },
  );
  act(() => result.current.open('training', activate));
  expect(result.current.status).toEqual({ state: 'loading', step: 'training' });

  rerender({ canTrain: false });
  expect(result.current.status).toBeNull();
  rerender({ canTrain: true });
  loading.resolve();
  await waitFor(() => expect(result.current.modules.training).toBeDefined());
  expect(activate).not.toHaveBeenCalled();

  act(() => result.current.open('training', activate));
  expect(activate).toHaveBeenCalledExactlyOnceWith(true);
});
