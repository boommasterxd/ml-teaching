import { createElement, useLayoutEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrainingEngine, type TrainingEngine } from '@/hooks/useTrainingEngine';
import { TRAINING_CONSENT_DURATION } from '@/lib/training-consent-storage';

vi.mock(import('@/hooks/useModelLoader'), () => ({
  useModelLoader: (active: boolean) => ({
    isModelLoading: !active,
    mobilenetModel: active ? { infer: vi.fn(), dispose: vi.fn() } : null,
    classifier: null,
    setClassifier: vi.fn(),
    loadingText: '',
  }),
}));

function cameraEnvironment(query: ReturnType<typeof vi.fn>) {
  const track = Object.assign(new EventTarget(), { stop: vi.fn(), readyState: 'live' });
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const getUserMedia = vi.fn(async () => stream);
  vi.stubGlobal('navigator', { permissions: { query }, mediaDevices: { getUserMedia } });
  return { getUserMedia, stream, track };
}

function rememberedCamera() {
  return { expiresAt: Date.now() + TRAINING_CONSENT_DURATION, camera: 'allowed' as const };
}

function EngineHarness({
  active,
  inTraining,
  publish,
}: {
  active: boolean;
  inTraining: boolean;
  publish: (engine: TrainingEngine) => void;
}) {
  const { engine, ResourceHost, resourceProps } = useTrainingEngine(active, inTraining);
  useLayoutEffect(() => publish(engine), [engine, publish]);
  return ResourceHost ? createElement(ResourceHost, resourceProps) : null;
}

async function renderEngine(active = true, inTraining = active) {
  let engine: TrainingEngine;
  const publish = (next: TrainingEngine) => {
    engine = next;
  };
  const view = render(createElement(EngineHarness, { active, inTraining, publish }));
  await act(() => vi.dynamicImportSettled());
  return {
    result: {
      get current() {
        return engine;
      },
    },
    rerender: (nextActive: boolean, nextInTraining = nextActive) =>
      view.rerender(
        createElement(EngineHarness, { active: nextActive, inTraining: nextInTraining, publish }),
      ),
  };
}

beforeEach(() => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('restoring the training camera', () => {
  it('waits until the training route owns the camera, starts it once and stops it on withdrawal', async () => {
    const query = vi.fn(async () => ({ state: 'granted' }));
    const { getUserMedia, stream, track } = cameraEnvironment(query);
    const { result, rerender } = await renderEngine(true, false);
    act(() => result.current.consent.restore(rememberedCamera()));
    await waitFor(() => expect(result.current.canUseModels).toBe(true));
    expect(query).not.toHaveBeenCalled();
    expect(getUserMedia).not.toHaveBeenCalled();

    rerender(true);
    await waitFor(() => expect(result.current.camera.stream).toBe(stream));
    expect(query).toHaveBeenCalledExactlyOnceWith({ name: 'camera' });
    expect(getUserMedia).toHaveBeenCalledOnce();
    act(() => result.current.revokeCamera());
    expect(result.current.camera.stream).toBeNull();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.consent.hasConsented).toBe(true);
  });

  it.each(['prompt', 'unsupported'] as const)(
    'keeps uploads available and waits for a new camera action when permission is %s',
    async (state) => {
      const query = vi.fn(async () => {
        if (state === 'unsupported') throw new TypeError('Unknown permission');
        return { state };
      });
      const { getUserMedia } = cameraEnvironment(query);
      const { result } = await renderEngine();
      act(() => result.current.consent.restore(rememberedCamera()));
      await waitFor(() => expect(query).toHaveBeenCalledOnce());
      expect(result.current.canUseModels).toBe(true);
      expect(result.current.consent.showCameraModal).toBe(false);
      expect(getUserMedia).not.toHaveBeenCalled();

      act(() => result.current.consent.requestCameraConsent());
      expect(result.current.consent.showCameraModal).toBe(true);
      await act(async () => result.current.consent.grantCameraConsent());
      expect(getUserMedia).toHaveBeenCalledOnce();
    },
  );

  it('ignores a permissions result that arrives after leaving training', async () => {
    const status = Promise.withResolvers<{ state: 'granted' }>();
    const query = vi.fn(() => status.promise);
    const { getUserMedia } = cameraEnvironment(query);
    const { result, rerender } = await renderEngine();
    act(() => result.current.consent.restore(rememberedCamera()));
    await waitFor(() => expect(query).toHaveBeenCalledOnce());
    rerender(false);
    await act(async () => status.resolve({ state: 'granted' }));
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.consent.cameraConsent).toBe(false);
  });
});
