import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import { ML } from '@/constants';
import type { MLImage } from '@/types/ml';

const mocks = vi.hoisted(() => ({
  modelReady: true,
  extract: vi.fn(),
  toastError: vi.fn(),
  setClassifier: vi.fn(),
  retryCamera: vi.fn(),
  stream: {} as MediaStream,
  streamRef: { current: null as MediaStream | null },
  reportCameraError: undefined as ((category: 'camera', message: string) => void) | undefined,
  reportCameraReady: undefined as (() => void) | undefined,
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
    _isLoading: boolean,
    onError: typeof mocks.reportCameraError,
    needed = true,
    onReady?: () => void,
  ) => {
    mocks.reportCameraError = onError;
    mocks.reportCameraReady = onReady;
    const stream = consented && needed ? mocks.stream : null;
    mocks.streamRef.current = stream;
    return {
      facingMode: 'user',
      stream,
      streamRef: mocks.streamRef,
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

async function collectMinimumImages(result: { current: ReturnType<typeof useTrainingWorkspace> }) {
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
    const { result } = renderHook(() => useTrainingWorkspace());
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
    const { result } = renderHook(() => useTrainingWorkspace());
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
    const { result } = renderHook(() => useTrainingWorkspace());
    act(() => result.current.resources.consent.grantConsent());
    act(() => result.current.resources.consent.declineCameraConsent());
    expect(result.current.resources.consent.cameraConsent).toBe(false);
    expect(result.current.resources.showCameraPrompt).toBe(false);
    await act(async () =>
      result.current.cardActions.onAddImageExample('class-1', document.createElement('img')),
    );
    expect(result.current.data.classes.classes[0].images).toHaveLength(1);
    act(() => result.current.resources.consent.requestCameraConsent());
    expect(result.current.resources.showCameraPrompt).toBe(true);
    expect(result.current.resources.consent.cameraConsent).toBe(false);
  });
  it('never asks for camera access when model loading has failed', () => {
    mocks.modelReady = false;
    const { result } = renderHook(() => useTrainingWorkspace());
    act(() => result.current.resources.consent.grantConsent());
    expect(result.current.resources.models.isModelLoading).toBe(false);
    expect(result.current.resources.models.mobilenetModel).toBeNull();
    expect(result.current.resources.showCameraPrompt).toBe(false);
  });
  it('never restores an in-flight image after clearing a class', async () => {
    const { result } = renderHook(() => useTrainingWorkspace());
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
    const { result } = renderHook(() => useTrainingWorkspace());
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

  it('trains collected features, starts prediction and invalidates it after a data change', async () => {
    const { result } = renderHook(() => useTrainingWorkspace('prediction'));
    act(() => result.current.resources.startPredicting());
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    await collectMinimumImages(result);
    expect(result.current.data.training.canTrain).toBe(true);
    act(() => result.current.data.trainModel());
    const countBefore = result.current.data.classes.classes[0].images.length;
    await act(async () =>
      result.current.cardActions.onAddImageExample('class-1', document.createElement('img')),
    );
    expect(result.current.data.classes.classes[0].images).toHaveLength(countBefore);
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    act(() => result.current.resources.startPredicting());
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    act(() => result.current.resources.consent.grantConsent());
    act(() => result.current.resources.consent.grantCameraConsent());
    act(() => result.current.resources.startPredicting());
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    act(() => mocks.reportCameraReady?.());
    expect(result.current.resources.prediction.isPredicting).toBe(true);
    act(() => result.current.data.classes.removeImage('class-1', 'image-0'));
    expect(result.current.resources.hasTrainedModel).toBe(false);
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    expect(mocks.setClassifier).toHaveBeenLastCalledWith(null);
  });

  it('stops live prediction on camera loss and retries without restarting it', async () => {
    const { result } = renderHook(() => useTrainingWorkspace('prediction'));
    act(() => result.current.resources.consent.grantConsent());
    act(() => result.current.resources.consent.grantCameraConsent());
    await collectMinimumImages(result);
    act(() => result.current.data.trainModel());
    await waitFor(() => expect(result.current.resources.hasTrainedModel).toBe(true));
    act(() => result.current.resources.startPredicting());
    act(() => mocks.reportCameraReady?.());
    expect(result.current.resources.prediction.isPredicting).toBe(true);

    act(() => mocks.reportCameraError?.('camera', 'Verbindung unterbrochen'));
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    expect(result.current.resources.error?.category).toBe('camera');
    expect(mocks.retryCamera).not.toHaveBeenCalled();
    act(() => result.current.resources.camera.retryCamera());
    expect(mocks.retryCamera).toHaveBeenCalledOnce();
    expect(result.current.resources.error).toBeNull();
    expect(result.current.resources.hasTrainedModel).toBe(true);
    expect(result.current.resources.prediction.isPredicting).toBe(false);
  });

  it('retains existing images and ignores an unfinished frame after camera withdrawal', async () => {
    const { result } = renderHook(() => useTrainingWorkspace());
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
    act(() => result.current.resources.revokeCamera());
    await act(async () => {
      pending.resolve(image('discarded'));
      await capture;
    });
    expect(result.current.resources.consent.hasConsented).toBe(true);
    expect(result.current.resources.consent.cameraConsent).toBe(false);
    expect(result.current.resources.consent.showCameraModal).toBe(false);
    expect(result.current.data.classes.classes[0].images.map(({ id }) => id)).toEqual(['image-0']);
  });

  it('passes extraction failures to the upload batch and still validates class changes', async () => {
    const { result } = renderHook(() => useTrainingWorkspace());
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
    const { result } = renderHook(() => useTrainingWorkspace());
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
