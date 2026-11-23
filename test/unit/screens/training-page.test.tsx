import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import TrainingPage from '@/screens/TrainingPage';
import TrainingEntryProvider from '@/components/training/TrainingEntryProvider';
import { learningPaths } from '@/lib/learning-paths';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
} from '@/lib/training-consent-storage';
import { fitFeatureProjection } from '@/lib/feature-projection';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const boundary = vi.hoisted(() => {
  const tensor = () => ({ data: async () => new Float32Array([1, 0]), dispose: vi.fn() });
  return {
    tensor,
    load: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    getUserMedia: vi.fn(),
    stopTrack: vi.fn(),
    toastError: vi.fn(),
    prepareToastViewport: vi.fn(),
  };
});
vi.mock('@/components/toast-loader', () => ({
  prepareToastViewport: boundary.prepareToastViewport,
}));
vi.mock('@/lib/toast', () => ({ toast: { error: boundary.toastError } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: boundary.push, prefetch: boundary.prefetch }),
  usePathname: () => '/lernen/bilderkennung/ausprobieren',
}));
vi.mock('@tensorflow/tfjs-core', () => ({
  setBackend: vi.fn(async () => true),
  ready: vi.fn(async () => {}),
  zeros: boundary.tensor,
  tensor2d: boundary.tensor,
  div: boundary.tensor,
  norm: boundary.tensor,
  dispose: vi.fn(),
  tidy: (operation: () => unknown) => operation(),
  browser: { fromPixels: vi.fn(boundary.tensor) },
}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@/lib/mobilenet-embedding', () => ({ loadMobileNetEmbedding: boundary.load }));
vi.mock('@/lib/feature-projection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/feature-projection')>();
  return { ...actual, fitFeatureProjection: vi.fn(actual.fitFeatureProjection) };
});
vi.mock('@tensorflow-models/knn-classifier', () => ({
  create: () => {
    const labels = new Set<string>();
    return {
      addExample: (_tensor: unknown, label: string) => labels.add(label),
      setClassifierDataset: (dataset: Record<string, unknown>) => {
        for (const label of Object.keys(dataset)) labels.add(label);
      },
      getNumClasses: () => labels.size,
      predictClass: async () => ({
        label: [...labels][0],
        confidences: Object.fromEntries(
          [...labels].map((label, index) => [label, index === 0 ? 1 : 0]),
        ),
      }),
      dispose: vi.fn(),
      clearAllClasses: () => labels.clear(),
    };
  },
}));

const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
const originalCreateURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

function createCameraStream() {
  const track = Object.assign(new EventTarget(), { stop: boundary.stopTrack, readyState: 'live' });
  return { active: true, getTracks: () => [track] };
}

beforeEach(() => {
  installBrowserHost();
  vi.clearAllMocks();
  clearRememberedTrainingConsent();
  boundary.load.mockReset().mockImplementation(async () => ({
    infer: vi.fn(boundary.tensor),
    dispose: vi.fn(),
  }));
  boundary.getUserMedia.mockImplementation(async () => createCameraStream());
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: boundary.getUserMedia },
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((file: File) => `blob:http://localhost/${file.name}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/jpeg;base64,/9j/2Q==',
  );
  vi.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(640);
  vi.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(480);
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(2);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        const image = document.createElement('img');
        image.width = image.height = 224;
        Object.defineProperties(image, {
          naturalWidth: { value: 2 },
          naturalHeight: { value: 3 },
        });
        let src = '';
        Object.defineProperty(image, 'src', {
          configurable: true,
          get: () => src,
          set: (value: string) => {
            src = value;
            if (value)
              queueMicrotask(() =>
                image.dispatchEvent(new Event(value.includes('broken') ? 'error' : 'load')),
              );
          },
        });
        return image;
      }
    },
  );
});
afterEach(() => {
  cleanup();
  clearRememberedTrainingConsent();
  restoreBrowserHost();
  for (const [target, name, descriptor] of [
    [navigator, 'mediaDevices', originalMediaDevices],
    [URL, 'createObjectURL', originalCreateURL],
    [URL, 'revokeObjectURL', originalRevokeURL],
  ] as const) {
    if (descriptor) Object.defineProperty(target, name, descriptor);
    else Reflect.deleteProperty(target, name);
  }
});

function confirmGeneralConsent(remember = false) {
  const dialog = screen.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  within(dialog)
    .getAllByRole('checkbox')
    .slice(0, 2)
    .forEach((choice) => fireEvent.click(choice));
  if (remember)
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /in diesem Tab merken/ }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Zustimmen' }));
}

async function enterWithoutCamera() {
  confirmGeneralConsent();
  const dialog = await screen.findByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Ohne Kamera fortfahren' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}

async function openSecondImagePreview() {
  const gallery = within(screen.getByRole('region', { name: /Trainingsbilder von Klasse 1:/ }));
  fireEvent.click(await gallery.findByRole('button', { name: 'Bild 2 vergrößern' }));
  return within(await screen.findByRole('dialog', { name: 'Bild 2 aus Klasse 1' }));
}

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWP4z8DwnwGMERQARNAF+661WskAAAAASUVORK5CYII=';
const imageBytes = Uint8Array.from(atob(png), (character) => character.charCodeAt(0));
const selectedImages = (prefix: string, count = 10) =>
  Array.from(
    { length: count },
    (_, index) => new File([imageBytes], `${prefix}-${index}.png`, { type: 'image/png' }),
  );

async function collectCupAndBookImages(container: HTMLElement) {
  const names = screen.getAllByRole('textbox');
  fireEvent.change(names[0], { target: { value: 'Tasse' } });
  fireEvent.change(names[1], { target: { value: 'Buch' } });
  const inputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
  fireEvent.change(inputs[0], { target: { files: selectedImages('tasse') } });
  await screen.findByText('10 Bilder', undefined, { timeout: 3000 });
  fireEvent.change(inputs[1], { target: { files: selectedImages('buch') } });
  await waitFor(() => expect(screen.getAllByText('10 Bilder')).toHaveLength(2), { timeout: 3000 });
}

async function prepareAutomaticPrediction(container: HTMLElement) {
  confirmGeneralConsent();
  const dialog = await screen.findByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Erlauben' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await collectCupAndBookImages(container);
  fireEvent.click(screen.getByRole('button', { name: 'Weiter zum Training' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Modell trainieren' }));
  await waitFor(() => expect(boundary.stopTrack).toHaveBeenCalledOnce());
  return screen.findByRole('button', { name: 'Weiter zur Vorhersage' }, { timeout: 3000 });
}

async function expectPredictionCameraLifecycle(steps: ReturnType<typeof within>) {
  const confidence = { name: 'Konfidenz für Tasse' };
  expect(boundary.getUserMedia).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Kamera aktivieren' }));
  const allow = await screen.findByRole('button', { name: 'Erlauben' });
  expect(boundary.getUserMedia).not.toHaveBeenCalled();

  const pending = Promise.withResolvers<ReturnType<typeof createCameraStream>>();
  boundary.getUserMedia.mockReturnValueOnce(pending.promise);
  fireEvent.click(allow);
  await screen.findByText('Kamera wird verbunden …');
  expect(boundary.getUserMedia).toHaveBeenCalledOnce();
  expect(screen.queryByRole('progressbar', confidence)).toBeNull();
  await act(async () => pending.resolve(createCameraStream()));
  const result = await screen.findByRole('progressbar', confidence);
  expect(result.getAttribute('aria-valuenow')).toBe('100');
  expect(boundary.getUserMedia).toHaveBeenCalledOnce();

  fireEvent.click(steps.getByRole('button', { name: 'Training' }));
  expect(screen.queryByRole('progressbar', confidence)).toBeNull();
  expect(boundary.stopTrack).toHaveBeenCalledOnce();
  expect(boundary.getUserMedia).toHaveBeenCalledOnce();
  fireEvent.click(steps.getByRole('button', { name: 'Vorhersage' }));
  await screen.findByRole('progressbar', confidence);
  expect(boundary.getUserMedia).toHaveBeenCalledTimes(2);

  fireEvent.click(steps.getByRole('button', { name: 'Bilder sammeln' }));
  await screen.findAllByLabelText('Kameravorschau für Trainingsaufnahme');
  expect(boundary.getUserMedia).toHaveBeenCalledTimes(2);
  expect(boundary.stopTrack).toHaveBeenCalledOnce();
  const [off] = screen.getAllByRole('button', { name: 'Kamera pausieren' });
  act(() => off.focus());
  fireEvent.click(off);
  expect(boundary.stopTrack).toHaveBeenCalledTimes(2);
  expect(boundary.getUserMedia).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getAllByRole('button', { name: 'Kamera aktivieren' })[0]).toBe(off);
  expect(document.activeElement).toBe(off);
  expect(screen.getAllByText('10 Bilder')).toHaveLength(2);

  fireEvent.click(steps.getByRole('button', { name: 'Vorhersage' }));
  expect(screen.getByRole('button', { name: 'Kamera aktivieren' })).toBeTruthy();
  expect(screen.queryByRole('progressbar', confidence)).toBeNull();
  expect(boundary.getUserMedia).toHaveBeenCalledTimes(2);
  fireEvent.click(steps.getByRole('button', { name: 'Bilder sammeln' }));
}

function TrainingFixture() {
  return (
    <TrainingEntryProvider>
      <TrainingPage />
    </TrainingEntryProvider>
  );
}

describe('training page integration', () => {
  it('starts one projection before opening automatic prediction and waits to start the camera', async () => {
    const { container } = render(<TrainingFixture />);
    const next = await prepareAutomaticPrediction(container);
    const compute = vi.mocked(fitFeatureProjection);
    const original = compute.getMockImplementation()!;
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof fitFeatureProjection>>>();
    compute.mockReturnValueOnce(pending.promise);

    expect(compute).not.toHaveBeenCalled();
    act(() => next.focus());
    fireEvent.pointerEnter(next);
    await waitFor(() => expect(compute).toHaveBeenCalledOnce());
    expect(boundary.getUserMedia).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Vorhersage' })).toBeNull();

    fireEvent.click(next);
    await screen.findByText('Merkmalsraum wird vorbereitet …');
    expect(compute).toHaveBeenCalledOnce();
    expect(boundary.getUserMedia).toHaveBeenCalledTimes(2);

    const [classes, signal] = compute.mock.calls[0];
    await act(async () => pending.resolve(await original(classes, signal)));
    await waitFor(() =>
      expect(container.querySelector('[data-slot="prediction-training-points"]')).not.toBeNull(),
    );
  }, 15_000);

  it('keeps processing opt-in, supports local training, enables camera later and confirms destructive changes', async () => {
    const { container, unmount } = render(
      <main id="main-content" tabIndex={-1}>
        <TrainingFixture />
      </main>,
    );
    expect(boundary.load).not.toHaveBeenCalled();
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
    await enterWithoutCamera();
    expect(boundary.prepareToastViewport).toHaveBeenCalledOnce();
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
    const steps = within(screen.getByRole('navigation', { name: 'Trainingsablauf' }));
    const currentStep = () => steps.getByRole('button', { current: 'step' });
    expect(currentStep()).toBe(steps.getByRole('button', { name: 'Bilder sammeln' }));
    const continueButton = () =>
      screen.getByRole<HTMLButtonElement>('button', { name: 'Weiter zum Training' });
    expect(continueButton().disabled).toBe(true);
    await collectCupAndBookImages(container);
    expect(currentStep()).toBe(steps.getByRole('button', { name: 'Bilder sammeln' }));
    fireEvent.click(continueButton());
    expect(screen.getByText('Ansicht wird geladen …')).toBeTruthy();
    const train = await screen.findByRole('button', { name: 'Modell trainieren' });
    await waitFor(() => expect((train as HTMLButtonElement).disabled).toBe(false));
    expect(currentStep()).toBe(steps.getByRole('button', { name: 'Training' }));
    fireEvent.click(train);
    const next = await screen.findByRole(
      'button',
      { name: 'Weiter zur Vorhersage' },
      { timeout: 3000 },
    );
    fireEvent.click(next);
    const predictionHeading = await screen.findByRole('heading', { name: 'Vorhersage' });
    expect(currentStep()).toBe(steps.getByRole('button', { name: 'Vorhersage' }));
    expect(document.activeElement).toBe(predictionHeading);
    await expectPredictionCameraLifecycle(steps);
    const preview = await openSecondImagePreview();
    fireEvent.click(preview.getByRole('button', { name: 'Schließen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const reopened = await openSecondImagePreview();
    fireEvent.click(reopened.getByRole('button', { name: 'Bild löschen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('9 / 10 Bilder')).toBeTruthy();
    expect((steps.getByRole('button', { name: 'Vorhersage' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: selectedImages('tasse-replacement', 1) },
    });
    await waitFor(() => expect(screen.getAllByText('10 Bilder')).toHaveLength(2));
    fireEvent.click(continueButton());
    const trainAgain = await screen.findByRole<HTMLButtonElement>('button', {
      name: 'Modell trainieren',
    });
    expect(trainAgain.disabled).toBe(false);
    expect(screen.queryByRole('button', { name: 'Weiter zur Vorhersage' })).toBeNull();
    fireEvent.click(steps.getByRole('button', { name: 'Bilder sammeln' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Bilder der Klasse 1: Tasse zurücksetzen' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.getAllByText('10 Bilder')).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', { name: 'Bilder der Klasse 1: Tasse zurücksetzen' }),
    );
    const clear = await screen.findByRole('alertdialog', { name: 'Bilder dieser Klasse löschen?' });
    fireEvent.click(within(clear).getByRole('button', { name: 'Zurücksetzen' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.getByText('0 / 10 Bilder')).toBeTruthy();
    const removeClass = screen.getByRole('button', { name: 'Klasse 1: Tasse löschen' });
    act(() => removeClass.focus());
    fireEvent.click(removeClass);
    const remove = await screen.findByRole('alertdialog', { name: 'Klasse löschen?' });
    fireEvent.click(within(remove).getByRole('button', { name: 'Löschen' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.queryByRole('textbox', { name: 'Name für Klasse 1: Tasse' })).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('textbox', { name: 'Name für Klasse 1: Buch' }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Neue Klasse hinzufügen' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    unmount();
    expect(boundary.stopTrack).toHaveBeenCalled();
  }, 15_000);

  it('keeps model failures visible without a camera prompt and returns safely to the image explanation', async () => {
    boundary.load.mockRejectedValue(new DOMException('Model network timeout', 'TimeoutError'));
    render(<TrainingFixture />);
    confirmGeneralConsent();
    const error = await screen.findByRole('alert');
    expect(error.textContent).toContain('Fehler beim Laden der KI-Modelle');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(error);
    expect(boundary.toastError).not.toHaveBeenCalled();
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Seite neu laden' })).toBeTruthy();
    const goToExplanation = screen.getByRole('button', { name: 'Zur Bilderkennung' });
    expect(boundary.prefetch).not.toHaveBeenCalled();
    fireEvent.focus(goToExplanation);
    expect(boundary.prefetch).toHaveBeenCalledWith(learningPaths.images);
    expect(boundary.push).not.toHaveBeenCalled();
    fireEvent.click(goToExplanation);
    expect(boundary.push).toHaveBeenCalledWith(learningPaths.images, {
      transitionTypes: ['nav-back'],
    });
  });

  it('reports failed file selections once per action and accepts a later valid local image', async () => {
    const { container } = render(<TrainingFixture />);
    await enterWithoutCamera();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    for (let attempt = 1; attempt <= 2; attempt++) {
      fireEvent.change(input, { target: { files: selectedImages('broken', 1) } });
      await waitFor(() => expect(boundary.toastError).toHaveBeenCalledTimes(attempt));
      expect(boundary.toastError).toHaveBeenLastCalledWith(expect.stringContaining('broken-0.png'));
    }
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(input, { target: { files: selectedImages('valid', 1) } });
    await screen.findByText('1 / 10 Bilder');
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
  });

  it('reports camera access failure and still lets the user continue with uploads', async () => {
    boundary.getUserMedia.mockRejectedValueOnce(
      new DOMException('Access denied', 'NotAllowedError'),
    );
    const { container } = render(<TrainingFixture />);
    confirmGeneralConsent();
    fireEvent.click(await screen.findByRole('button', { name: 'Erlauben' }));
    await waitFor(
      () =>
        expect(boundary.toastError).toHaveBeenCalledWith(
          expect.stringContaining('Kamerazugriff verweigert oder keine Kamera gefunden.'),
          { id: 'training-camera' },
        ),
      { timeout: 3000 },
    );
    expect(screen.queryByRole('alert')).toBeNull();
    const [retry] = screen.getAllByRole('button', { name: 'Kamera erneut verbinden' });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, { target: { files: selectedImages('valid', 1) } });
    await screen.findByText('1 / 10 Bilder');
    expect(boundary.toastError).toHaveBeenCalledTimes(1);
    act(() => retry.focus());
    fireEvent.click(retry);
    await screen.findAllByLabelText('Kameravorschau für Trainingsaufnahme');
    expect(boundary.getUserMedia).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole('button', { name: 'Kamera pausieren' })[0]).toBe(retry);
    expect(document.activeElement).toBe(retry);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('preserves remembered camera consent on pause and asks again after settings withdrawal', async () => {
    render(<TrainingFixture />);
    confirmGeneralConsent(true);
    const cameraDialog = { name: 'Berechtigung zur Kameranutzung' };
    const setup = within(await screen.findByRole('dialog', cameraDialog));
    fireEvent.click(setup.getByRole('button', { name: 'Erlauben' }));
    await screen.findAllByLabelText('Kameravorschau für Trainingsaufnahme');
    const remembered = readRememberedTrainingConsent();
    expect(remembered?.camera).toBe('allowed');

    const [pause] = screen.getAllByRole('button', { name: 'Kamera pausieren' });
    fireEvent.click(pause);
    expect(readRememberedTrainingConsent()).toEqual(remembered);
    expect(boundary.stopTrack).toHaveBeenCalledOnce();

    const settingsName = 'Einstellungen zum Bildtraining';
    fireEvent.click(screen.getByRole('button', { name: settingsName }));
    const settings = await screen.findByRole('alertdialog', { name: settingsName });
    fireEvent.click(within(settings).getByRole('button', { name: 'Kamera ausschalten' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { name: settingsName })).toBeNull(),
    );
    expect(readRememberedTrainingConsent()?.camera).toBe('declined');

    fireEvent.click(pause);
    await screen.findByRole('dialog', cameraDialog);
    expect(boundary.getUserMedia).toHaveBeenCalledOnce();
  });

  it('returns to the image explanation when the general processing choice is declined', () => {
    render(<TrainingFixture />);
    const decline = screen.getByRole('link', { name: 'Abbrechen' });
    expect(decline.getAttribute('href')).toBe(learningPaths.images);
    expect(boundary.prefetch).not.toHaveBeenCalled();
    fireEvent.pointerDown(decline, { pointerType: 'touch' });
    expect(boundary.prefetch).toHaveBeenCalledWith(learningPaths.images);
    expect(boundary.push).not.toHaveBeenCalled();
    fireEvent(decline.closest('dialog')!, new Event('cancel', { cancelable: true }));
    expect(boundary.push).toHaveBeenCalledWith(learningPaths.images, {
      transitionTypes: ['nav-back'],
    });
    expect(boundary.load).not.toHaveBeenCalled();
  });
});
