import { createElement, useLayoutEffect, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrainingWorkspace as useWorkspace } from '@/hooks/useTrainingWorkspace';
import { useTrainingEngine } from '@/hooks/useTrainingEngine';
import { useTrainingClassName } from '@/hooks/useClassManagement';
import type { TrainingStep } from '@/components/training-panel-loading';
import { ML } from '@/constants';
import type { MLImage } from '@/types/ml';

const mocks = vi.hoisted(() => ({
  modelReady: true,
  extract: vi.fn(),
  toastError: vi.fn(),
  dismissToast: vi.fn(),
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

vi.mock('@/lib/toast', () => ({ toast: { error: mocks.toastError, dismiss: mocks.dismissToast } }));
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
  retainBackendWork: () => undefined,
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

type Workspace = ReturnType<typeof useWorkspace> & { editSecondName: (name: string) => void };

function WorkspaceHarness({
  step,
  publish,
}: {
  step: TrainingStep;
  publish: (value: Workspace) => void;
}) {
  const { engine, ResourceHost, resourceProps } = useTrainingEngine(true, true);
  const workspace = useWorkspace(step, engine);
  const { nameControl, validateNames } = workspace.data.classes;
  const { edit: editSecondName } = useTrainingClassName(nameControl, 1, validateNames);
  useLayoutEffect(
    () => publish({ ...workspace, editSecondName }),
    [publish, workspace, editSecondName],
  );
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
    unmount: view.unmount,
    result: {
      get current() {
        return workspace;
      },
    },
    rerender: (next: TrainingStep) =>
      view.rerender(createElement(WorkspaceHarness, { step: next, publish })),
  };
}

function uploadImage(workspace: Workspace, classId: string, signal = new AbortController().signal) {
  return workspace.cardActions.onAddImageExample(classId, document.createElement('img'), signal);
}

async function collectMinimumImages(result: { current: Workspace }) {
  await act(async () => {
    for (const cls of result.current.data.classes.classes) {
      for (let index = 0; index < ML.MIN_IMAGES_PER_CLASS; index++) {
        await uploadImage(result.current, cls.id);
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
  it('keeps upload notifications available until a retry or workspace exit', async () => {
    const { result, unmount } = await renderWorkspace();
    const { onUploadResult } = result.current.cardActions;
    const report = { className: 'Rot', total: 2, details: ['"bild.png": Ungültiges Bild.'] };
    act(() => onUploadResult('class-1', report));
    expect(mocks.toastError).toHaveBeenCalledWith('2 Bilder konnten nicht hinzugefügt werden.', {
      id: 'training-upload-class-1',
      timeout: 0,
      description: 'Rot\n"bild.png": Ungültiges Bild.\nEine weitere Datei ist fehlgeschlagen.',
    });
    act(() => onUploadResult('class-1', null));
    expect(mocks.dismissToast).toHaveBeenCalledWith('training-upload-class-1');

    act(() => onUploadResult('class-2', report));
    unmount();
    expect(mocks.dismissToast).toHaveBeenLastCalledWith('training-upload-class-2');
  });

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
      await uploadImage(result.current, 'class-1');
      result.current.cardActions.onUploadEnd();
    });
    expect(result.current.data.canTrain).toBe(false);
    await act(async () => {
      await uploadImage(result.current, 'class-2');
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
    await waitFor(() => expect(result.current.resources.camera.stream).toBe(mocks.stream));
    await collectMinimumImages(result);
    let finish!: (image: MLImage) => void;
    mocks.extract.mockImplementationOnce(
      () =>
        new Promise<MLImage>((resolve) => {
          finish = resolve;
        }),
    );
    let capture!: ReturnType<typeof result.current.cardActions.onAddImageExample>;
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
    await waitFor(() => expect(result.current.resources.showCameraPrompt).toBe(true));
    act(() => result.current.resources.consent.declineCameraConsent());
    expect(result.current.resources.consent.cameraConsent).toBe(false);
    expect(result.current.resources.showCameraPrompt).toBe(false);
    expect(result.current.resources.camera.stream).toBeNull();
    await act(() => uploadImage(result.current, 'class-1'));
    expect(result.current.data.classes.classes[0].images).toHaveLength(1);
    act(() => result.current.resources.camera.start());
    expect(result.current.resources.showCameraPrompt).toBe(true);
    expect(result.current.resources.consent.cameraConsent).toBe(false);
  });
  it('never asks for camera access when model loading has failed', async () => {
    mocks.modelReady = false;
    const { result } = await renderWorkspace();
    act(() => result.current.resources.consent.grantConsent());
    await waitFor(() => expect(result.current.resources.models.isModelLoading).toBe(false));
    expect(result.current.resources.models.mobilenetModel).toBeNull();
    expect(result.current.resources.showCameraPrompt).toBe(false);
  });
  it.each(['clearing a class', 'replacing an import'])(
    'never restores an in-flight image after %s',
    async (action) => {
      const { result } = await renderWorkspace();
      const classId = result.current.data.classes.classes[0].id;
      const controller = new AbortController();
      const pending = Promise.withResolvers<MLImage>();
      mocks.extract.mockReturnValueOnce(pending.promise);
      let capture!: ReturnType<typeof result.current.cardActions.onAddImageExample>;
      act(() => {
        capture = uploadImage(result.current, classId, controller.signal);
      });
      if (action === 'clearing a class') act(() => result.current.data.classes.clearClass(classId));
      else controller.abort();
      await act(async () => {
        pending.resolve(image('discarded'));
        await capture;
      });
      expect(result.current.data.classes.classes.every((cls) => cls.images.length === 0)).toBe(
        true,
      );
      await act(() => uploadImage(result.current, classId));
      expect(result.current.data.classes.classes[0].images.map(({ id }) => id)).toEqual([
        'image-0',
      ]);
    },
  );
  it('keeps consent steps ordered and closes a preview when its image is deleted', async () => {
    const { result } = await renderWorkspace();
    expect(result.current.resources.consent.showConsentModal).toBe(true);
    act(() => result.current.resources.consent.grantConsent());
    expect(result.current.resources.consent.showCameraModal).toBe(true);
    await waitFor(() => expect(result.current.resources.showCameraPrompt).toBe(true));
    act(() => result.current.resources.consent.grantCameraConsent());
    expect(result.current.resources.consent.isFullyConsented).toBe(true);
    const classId = result.current.data.classes.classes[0].id;
    await act(() => uploadImage(result.current, classId));
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
    await act(() => uploadImage(result.current, 'class-1'));
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
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    const { onPredictionVisibilityChange } = result.current.resources;
    act(() => onPredictionVisibilityChange(true));
    expect(result.current.resources.prediction.isPredicting).toBe(true);
    act(() => onPredictionVisibilityChange(false));
    expect(result.current.resources.prediction.isPredicting).toBe(false);
    expect(result.current.resources.camera.stream).toBe(mocks.stream);
    act(() => onPredictionVisibilityChange(true));
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
    act(() => result.current.resources.onPredictionVisibilityChange(true));
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
    act(() => result.current.resources.camera.pause());
    act(() => result.current.resources.onPredictionVisibilityChange(false));
    act(() => result.current.resources.onPredictionVisibilityChange(true));
    expect(result.current.resources.camera.stream).toBeNull();
    expect(result.current.resources.prediction.isPredicting).toBe(false);
  });

  it('retains existing images and ignores an unfinished frame after pausing the camera', async () => {
    const { result } = await renderWorkspace();
    act(() => {
      result.current.resources.consent.grantConsent();
      result.current.resources.consent.grantCameraConsent();
    });
    await waitFor(() => expect(result.current.resources.camera.stream).toBe(mocks.stream));
    const { cardActions: actions } = result.current;
    await act(() => uploadImage(result.current, 'class-1'));
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

  it('commits held frames only to the same class version and camera stream', async () => {
    const { result } = await renderWorkspace();
    act(() => {
      result.current.resources.consent.grantConsent();
      result.current.resources.consent.grantCameraConsent();
    });
    await waitFor(() => expect(result.current.resources.camera.stream).toBe(mocks.stream));
    const { cardActions: actions } = result.current;
    const frames = { images: [image('first'), image('second')], version: 0, stream: mocks.stream };
    act(() => actions.onCommitCapture('class-1', frames));
    expect(result.current.data.classes.classes[0].images.map(({ id }) => id)).toEqual([
      'first',
      'second',
    ]);
    act(() => result.current.data.classes.clearClass('class-1'));
    act(() => actions.onCommitCapture('class-1', frames));
    expect(result.current.data.classes.classes[0].images).toHaveLength(0);
    act(() => result.current.resources.camera.pause());
    act(() => actions.onCommitCapture('class-1', { ...frames, version: 1 }));
    expect(result.current.data.classes.classes[0].images).toHaveLength(0);
  });

  it('passes extraction failures to the upload batch and still validates class changes', async () => {
    const { result } = await renderWorkspace();
    mocks.extract.mockRejectedValueOnce(new Error('Image unavailable'));
    await act(async () => {
      await expect(uploadImage(result.current, 'class-1')).rejects.toThrow(
        'Das Bild konnte nicht verarbeitet werden',
      );
    });
    expect(mocks.toastError).not.toHaveBeenCalled();
    await act(() => uploadImage(result.current, 'deleted-class'));
    expect(mocks.extract).toHaveBeenCalledOnce();
    act(() => result.current.editSecondName('Klasse 1'));
    expect(result.current.data.hasDuplicateNames).toBe(true);
    expect(result.current.data.training.canTrain).toBe(false);
    act(() => result.current.data.trainModel());
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('blocks training when a previously valid class name becomes a duplicate before render', async () => {
    const { result } = await renderWorkspace();
    await collectMinimumImages(result);
    expect(result.current.data.canTrain).toBe(true);

    const { data, editSecondName } = result.current;
    const [first] = data.classes.classes;
    await act(async () => {
      editSecondName(first.name);
      data.trainModel();
      expect(data.training.isTrainingActive()).toBe(false);
    });
    expect(result.current.data.canTrain).toBe(false);
    expect(result.current.data.hasDuplicateNames).toBe(true);
    expect(mocks.setClassifier).not.toHaveBeenCalled();
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
