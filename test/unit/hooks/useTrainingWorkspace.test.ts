import { createElement, useLayoutEffect, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrainingWorkspace as useWorkspace } from '@/hooks/useTrainingWorkspace';
import { useTrainingEngine } from '@/hooks/useTrainingEngine';
import type { TrainingStep } from '@/components/training-panel-loading';
import { ML } from '@/constants';
import type { MLImage } from '@/types/ml';

const mocks = vi.hoisted(() => ({
  modelReady: true,
  extract: vi.fn(),
  toastError: vi.fn(),
  setClassifier: vi.fn(),
  retryCamera: vi.fn(),
  cameraFailed: false,
  cameraReady: true,
  refreshCamera: () => {},
  stream: {} as MediaStream,
  streamRef: { current: null as MediaStream | null },
  reportCameraError: undefined as ((category: 'camera', message: string) => void) | undefined,
  classifier: {
    addExample: vi.fn(),
    dispose: vi.fn(),
    getNumClasses: () => 2,
    predictClass: vi.fn(),
    setClassifierDataset: vi.fn(),
  },
}));

vi.mock('@/lib/toast', () => ({ toast: { error: mocks.toastError } }));
vi.mock('@/hooks/useModelLoader', () => ({
  useModelLoader: () => ({
    classifier: mocks.modelReady ? mocks.classifier : null,
    setClassifier: mocks.setClassifier,
    mobilenetModel: mocks.modelReady ? {} : null,
    isModelLoading: false,
    loadingText: '',
  }),
}));
vi.mock('@/hooks/useCameraStream', () => ({
  useCameraStream: (
    consented: boolean,
    isLoading: boolean,
    onError: typeof mocks.reportCameraError,
    needed = true,
  ) => {
    const [, update] = useState(0);
    mocks.refreshCamera = () => update((version) => version + 1);
    mocks.reportCameraError = onError;
    const active = consented && !isLoading && needed;
    const hasFailed = active && mocks.cameraFailed;
    const stream = active && mocks.cameraReady && !hasFailed ? mocks.stream : null;
    mocks.streamRef.current = stream;
    return {
      facingMode: 'user',
      stream,
      streamRef: mocks.streamRef,
      hasFailed,
      isPending: active && !mocks.cameraReady && !hasFailed,
      toggleCamera: vi.fn(),
      retryCamera: mocks.retryCamera,
    };
  },
}));
vi.mock('@/hooks/useImageFeatureExtraction', () => ({
  useImageFeatureExtraction: () => ({ extractFeatures: mocks.extract }),
}));
vi.mock('@/lib/ml-runtime', () => ({
  createClassifier: async () => mocks.classifier,
  loadTensorFlow: async () => ({
    tensor2d: (_rows: Float32Array, shape: [number, number]) => ({ shape }),
    norm: vi.fn(),
    div: (examples: unknown) => examples,
    tidy: (run: () => unknown) => run(),
    dispose: vi.fn(),
  }),
}));

const image = (id: string): MLImage => ({
  id,
  featureArray: [1, 0],
  dataUrl: 'data:image/jpeg;base64,a',
});

type Workspace = ReturnType<typeof useWorkspace>;

function WorkspaceHarness({
  step,
  publish,
}: {
  step: TrainingStep;
  publish: (value: Workspace) => void;
}) {
  const { engine, ResourceHost, resourceProps } = useTrainingEngine(true, true);
  const workspace = useWorkspace(step, engine);
  useLayoutEffect(() => publish(workspace), [publish, workspace]);
  return ResourceHost ? createElement(ResourceHost, resourceProps) : null;
}

async function renderWorkspace(step: TrainingStep = 'images') {
  let workspace: Workspace;
  const publish = (value: Workspace) => {
    workspace = value;
  };
  const view = render(createElement(WorkspaceHarness, { step, publish }));
  await act(() => vi.dynamicImportSettled());
  return {
    result: {
      get current() {
        return workspace;
      },
    },
    rerender: (next: TrainingStep) =>
      view.rerender(createElement(WorkspaceHarness, { step: next, publish })),
  };
}

async function collectMinimumImages(result: { current: Workspace }) {
  await act(async () => {
    for (const cls of result.current.data.classes.classes) {
      for (let index = 0; index < ML.MIN_IMAGES_PER_CLASS; index++) {
        await result.current.cardActions.onAddImageExample(cls.id, document.createElement('img'));
      }
    }
  });
}

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.modelReady = true;
  mocks.cameraFailed = false;
  mocks.cameraReady = true;
  mocks.retryCamera.mockImplementation(() => {
    mocks.cameraFailed = false;
    mocks.cameraReady = false;
  });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  let next = 0;
  mocks.extract.mockImplementation(async () => image(`image-${next++}`));
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

describe('local training workspace', () => {
  it('waits for every selected batch, trains all accepted images, and rejects new batches during training', async () => {
    const { result } = await renderWorkspace();
    await collectMinimumImages(result);
    act(() => {
      result.current.cardActions.onUploadStart();
      result.current.cardActions.onUploadStart();
    });
    expect(result.current.data.training.canTrain).toBe(true);
    expect(result.current.data.canTrain).toBe(false);
    act(() => result.current.data.trainModel());
    expect(result.current.data.training.isTraining).toBe(false);
    await act(async () => {
      await result.current.cardActions.onAddImageExample('class-1', document.createElement('img'));
      result.current.cardActions.onUploadEnd();
    });
    expect(result.current.data.canTrain).toBe(false);
    await act(async () => {
      await result.current.cardActions.onAddImageExample('class-2', document.createElement('img'));
      result.current.cardActions.onUploadEnd();
    });
    expect(result.current.data.canTrain).toBe(true);
    act(() => {
      result.current.data.trainModel();
      expect(result.current.cardActions.onUploadStart()).toBe(false);
    });
    expect(result.current.cardActions.captureDisabled).toBe(true);
    expect(mocks.toastError).toHaveBeenLastCalledWith(
      expect.stringContaining('Training abgeschlossen'),
    );
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    expect(mocks.classifier.setClassifierDataset).toHaveBeenCalledExactlyOnceWith({
      'class-1': { shape: [ML.MIN_IMAGES_PER_CLASS + 1, 2] },
      'class-2': { shape: [ML.MIN_IMAGES_PER_CLASS + 1, 2] },
    });
  });

  it('does not train over an unfinished camera frame', async () => {
    const { result } = await renderWorkspace();
    act(() => {
      result.current.resources.consent.grantConsent();
      result.current.resources.consent.grantCameraConsent();
    });
    await collectMinimumImages(result);
    let finish!: (image: MLImage) => void;
    mocks.extract.mockImplementationOnce(
      () =>
        new Promise<MLImage>((resolve) => {
          finish = resolve;
        }),
    );
    let capture!: Promise<void>;
    act(() => {
      capture = result.current.data.addImage('class-1', document.createElement('video'), false);
    });
    act(() => result.current.data.trainModel());
    expect(result.current.data.training.isTraining).toBe(false);
    await act(async () => {
      finish(image('last-camera-frame'));
      await capture;
    });
    act(() => result.current.data.trainModel());
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    expect(mocks.classifier.setClassifierDataset).toHaveBeenCalledExactlyOnceWith({
      'class-1': { shape: [ML.MIN_IMAGES_PER_CLASS + 1, 2] },
      'class-2': { shape: [ML.MIN_IMAGES_PER_CLASS, 2] },
    });
  });
  it('keeps local image uploads usable after declining camera access and can reopen the choice', async () => {
    const { result } = await renderWorkspace();
    act(() => result.current.resources.consent.grantConsent());
    act(() => result.current.resources.consent.declineCameraConsent());
    expect(result.current.resources.consent.cameraConsent).toBe(false);
    expect(result.current.resources.showCameraPrompt).toBe(false);
    expect(result.current.resources.camera.stream).toBeNull();
    await act(async () =>
      result.current.cardActions.onAddImageExample('class-1', document.createElement('img')),
    );
    expect(result.current.data.classes.classes[0].images).toHaveLength(1);
    act(() => result.current.resources.camera.start());
    expect(result.current.resources.showCameraPrompt).toBe(true);
    expect(result.current.resources.consent.cameraConsent).toBe(false);
  });
  it('never asks for camera access when model loading has failed', async () => {
    mocks.modelReady = false;
    const { result } = await renderWorkspace();
    act(() => result.current.resources.consent.grantConsent());
    expect(result.current.resources.models.isModelLoading).toBe(false);
    expect(result.current.resources.models.mobilenetModel).toBeNull();
    expect(result.current.resources.showCameraPrompt).toBe(false);
  });
  it('never restores an in-flight image after clearing a class', async () => {
    const { result } = await renderWorkspace();
    const classId = result.current.data.classes.classes[0].id;
    let finish!: (image: MLImage) => void;
    mocks.extract.mockImplementationOnce(
      () =>
        new Promise<MLImage>((resolve) => {
          finish = resolve;
        }),
    );
    let capture!: void | Promise<void>;
    act(() => {
      capture = result.current.cardActions.onAddImageExample(
        classId,
        document.createElement('img'),
      );
    });
    act(() => result.current.data.classes.clearClass(classId));
    await act(async () => {
      finish(image('late-image'));
      await capture;
    });
    expect(result.current.data.classes.classes.every((cls) => cls.images.length === 0)).toBe(true);
  });
  it('keeps consent steps ordered and closes a preview when its image is deleted', async () => {
    const { result } = await renderWorkspace();
    expect(result.current.resources.consent.showConsentModal).toBe(true);
    act(() => result.current.resources.consent.grantConsent());
    expect(result.current.resources.consent.showCameraModal).toBe(true);
    expect(result.current.resources.showCameraPrompt).toBe(true);
    act(() => result.current.resources.consent.grantCameraConsent());
    expect(result.current.resources.consent.isFullyConsented).toBe(true);
    const classId = result.current.data.classes.classes[0].id;
    await act(async () =>
      result.current.cardActions.onAddImageExample(classId, document.createElement('img')),
    );
    const captured = result.current.data.classes.classes[0].images[0];
    act(() => result.current.dialogs.showImagePreview(classId, captured));
    expect(result.current.dialogs.modal.type).toBe('imagePreview');
    act(() => result.current.cardActions.onRemoveImages(classId, [captured.id]));
    expect(result.current.dialogs.modal.type).toBe('none');
    expect(result.current.data.classes.classes[0].images).toHaveLength(0);
  });

  it('starts prediction on a new or reused stream and invalidates it on a data change', async () => {
    const { result, rerender } = await renderWorkspace('training');
    act(() => {
      result.current.resources.consent.grantConsent();
      result.current.resources.consent.grantCameraConsent();
    });
    await collectMinimumImages(result);
    expect(result.current.data.training.canTrain).toBe(true);
    act(() => result.current.data.trainModel());
    const countBefore = result.current.data.classes.classes[0].images.length;
    await act(async () =>
      result.current.cardActions.onAddImageExample('class-1', document.createElement('img')),
    );
    expect(result.current.data.classes.classes[0].images).toHaveLength(countBefore);
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    expect(result.current.resources.camera.stream).toBeNull();
    mocks.cameraReady = false;
    rerender('prediction');
    expect(result.current.resources.camera.stream).toBeNull();
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    mocks.cameraReady = true;
    act(() => mocks.refreshCamera());
    expect(result.current.resources.camera.stream).toBe(mocks.stream);
    expect(result.current.resources.prediction.isPredicting).toBe(true);

    rerender('images');
    const collectionStream = result.current.resources.camera.stream;
    expect(collectionStream).toBe(mocks.stream);
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    rerender('prediction');
    expect(result.current.resources.camera.stream).toBe(collectionStream);
    expect(result.current.resources.prediction.isPredicting).toBe(true);
    act(() => result.current.data.classes.removeImage('class-1', 'image-0'));
    expect(result.current.resources.hasTrainedModel).toBe(false);
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    expect(mocks.setClassifier).toHaveBeenLastCalledWith(null);
  });

  it('stops live prediction on camera loss and resumes only after an explicit successful retry', async () => {
    const { result, rerender } = await renderWorkspace('training');
    act(() => result.current.resources.consent.grantConsent());
    act(() => result.current.resources.consent.grantCameraConsent());
    await collectMinimumImages(result);
    act(() => result.current.data.trainModel());
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    rerender('prediction');
    expect(result.current.resources.prediction.isPredicting).toBe(true);

    mocks.cameraFailed = true;
    act(() => mocks.reportCameraError?.('camera', 'Verbindung unterbrochen'));
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    expect(result.current.resources.camera.active).toBe(false);
    expect(result.current.resources.error?.category).toBe('camera');
    expect(mocks.retryCamera).not.toHaveBeenCalled();
    act(() => result.current.resources.camera.start());
    expect(mocks.retryCamera).toHaveBeenCalledOnce();
    expect(result.current.resources.error).toBeNull();
    expect(result.current.resources.hasTrainedModel).toBe(true);
    expect(result.current.resources.camera.stream).toBeNull();
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    mocks.cameraReady = true;
    act(() => mocks.refreshCamera());
    expect(result.current.resources.prediction.isPredicting).toBe(true);
  });

  it('retains existing images and ignores an unfinished frame after pausing the camera', async () => {
    const { result } = await renderWorkspace();
    act(() => {
      result.current.resources.consent.grantConsent();
      result.current.resources.consent.grantCameraConsent();
    });
    const { cardActions: actions } = result.current;
    await act(async () => actions.onAddImageExample('class-1', document.createElement('img')));
    expect(result.current.cardActions).toBe(actions);
    const pending = Promise.withResolvers<MLImage>();
    mocks.extract.mockReturnValueOnce(pending.promise);
    let capture!: Promise<void> | void;
    act(() => {
      capture = actions.onAddExample('class-1', document.createElement('video'));
    });
    act(() => result.current.resources.camera.pause());
    await act(async () => {
      pending.resolve(image('discarded'));
      await capture;
    });
    expect(result.current.resources.consent.hasConsented).toBe(true);
    expect(result.current.resources.consent.cameraConsent).toBe(true);
    expect(result.current.resources.consent.showCameraModal).toBe(false);
    expect(result.current.data.classes.classes[0].images.map(({ id }) => id)).toEqual(['image-0']);
  });

  it('passes extraction failures to the upload batch and still validates class changes', async () => {
    const { result } = await renderWorkspace();
    mocks.extract.mockRejectedValueOnce(new Error('Image unavailable'));
    await act(async () => {
      await expect(
        result.current.cardActions.onAddImageExample('class-1', document.createElement('img')),
      ).rejects.toThrow('Das Bild konnte nicht verarbeitet werden');
    });
    expect(mocks.toastError).not.toHaveBeenCalled();
    await act(async () =>
      result.current.cardActions.onAddImageExample('deleted-class', document.createElement('img')),
    );
    expect(mocks.extract).toHaveBeenCalledOnce();
    act(() => result.current.data.classes.updateClassName('class-2', 'Klasse 1'));
    expect(result.current.data.hasDuplicateNames).toBe(true);
    expect(result.current.data.training.canTrain).toBe(false);
    act(() => result.current.data.trainModel());
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('reports one error per failed training run and retains the examples for retry', async () => {
    const { result } = await renderWorkspace();
    await collectMinimumImages(result);
    for (let attempt = 1; attempt <= 2; attempt++) {
      mocks.classifier.setClassifierDataset.mockImplementationOnce(() => {
        throw new Error('Training failed');
      });
      act(() => result.current.data.trainModel());
      await waitFor(() => expect(result.current.data.training.isTraining).toBe(false));
      expect(mocks.toastError).toHaveBeenCalledTimes(attempt);
      expect(mocks.toastError).toHaveBeenLastCalledWith('Fehler beim Training des Modells.');
      expect(result.current.data.canTrain).toBe(true);
    }
    act(() => result.current.data.trainModel());
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    expect(mocks.toastError).toHaveBeenCalledTimes(2);
  });
});
