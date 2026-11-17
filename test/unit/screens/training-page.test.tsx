import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import TrainingPage from '@/screens/TrainingPage';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const boundary = vi.hoisted(() => {
  const tensor = () => ({ data: async () => new Float32Array([1, 0]), dispose: vi.fn() });
  return {
    tensor,
    load: vi.fn(),
    push: vi.fn(),
    getUserMedia: vi.fn(),
    stopTrack: vi.fn(),
    model: { infer: vi.fn(tensor), dispose: vi.fn() },
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: boundary.push }) }));
vi.mock('@tensorflow/tfjs-core', () => ({
  setBackend: vi.fn(async () => true),
  ready: vi.fn(async () => {}),
  zeros: boundary.tensor,
  tensor1d: boundary.tensor,
  tidy: (operation: () => unknown) => operation(),
  browser: { fromPixels: vi.fn(boundary.tensor) },
}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow-models/mobilenet', () => ({ load: boundary.load }));
vi.mock('@tensorflow-models/knn-classifier', () => ({
  create: () => {
    const labels = new Set<string>();
    return {
      addExample: (_tensor: unknown, label: string) => labels.add(label),
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

beforeEach(() => {
  installBrowserHost();
  vi.clearAllMocks();
  boundary.load.mockReset().mockResolvedValue(boundary.model);
  boundary.getUserMedia.mockResolvedValue({
    active: true,
    getTracks: () => [{ stop: boundary.stopTrack }],
  });
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

function confirmGeneralConsent() {
  const dialog = screen.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  within(dialog)
    .getAllByRole('checkbox')
    .forEach((choice) => fireEvent.click(choice));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Zustimmen' }));
}

async function enterWithoutCamera() {
  confirmGeneralConsent();
  const dialog = await screen.findByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Ohne Kamera fortfahren' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
}

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWP4z8DwnwGMERQARNAF+661WskAAAAASUVORK5CYII=';
const imageBytes = Uint8Array.from(atob(png), (character) => character.charCodeAt(0));
const selectedImages = (prefix: string, count = 10) =>
  Array.from(
    { length: count },
    (_, index) => new File([imageBytes], `${prefix}-${index}.png`, { type: 'image/png' }),
  );

describe('training page integration', () => {
  it('keeps processing opt-in, supports local training, enables camera later and confirms destructive changes', async () => {
    const { container, unmount } = render(
      <main id="main-content" tabIndex={-1}>
        <TrainingPage />
      </main>,
    );
    expect(boundary.load).not.toHaveBeenCalled();
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
    await enterWithoutCamera();
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
    const names = screen.getAllByRole('textbox');
    fireEvent.change(names[0], { target: { value: 'Tasse' } });
    fireEvent.change(names[1], { target: { value: 'Buch' } });
    const inputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fireEvent.change(inputs[0], { target: { files: selectedImages('tasse') } });
    await screen.findByText('10 / 200 Bilder');
    fireEvent.change(inputs[1], { target: { files: selectedImages('buch') } });
    await waitFor(() => expect(screen.getAllByText('10 / 200 Bilder')).toHaveLength(2));
    const train = screen.getByRole('button', { name: 'Modell trainieren' });
    await waitFor(() => expect((train as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(train);
    await screen.findByRole('button', { name: 'Modell neu trainieren' });
    expect((screen.getByRole('button', { name: 'Starten' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Kamera aktivieren' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Erlauben' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(boundary.getUserMedia).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Starten' }));
    await screen.findByRole('progressbar', { name: 'Konfidenz für Tasse' });
    expect(
      screen
        .getByRole('progressbar', { name: 'Konfidenz für Tasse' })
        .getAttribute('aria-valuenow'),
    ).toBe('100');
    fireEvent.click(screen.getByRole('button', { name: 'Stoppen' }));
    const previews = screen.getAllByRole('button', { name: 'Bild vergrößern' });
    fireEvent.click(previews[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Schließen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getAllByRole('button', { name: 'Bild vergrößern' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Bild löschen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('9 / 200 Bilder')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Bilder der Klasse 1: Tasse zurücksetzen' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('9 / 200 Bilder')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Bilder der Klasse 1: Tasse zurücksetzen' }),
    );
    const clear = await screen.findByRole('dialog', { name: 'Bilder dieser Klasse löschen?' });
    fireEvent.click(within(clear).getByRole('button', { name: 'Zurücksetzen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('0 / 200 Bilder')).toBeTruthy();
    const removeClass = screen.getByRole('button', { name: 'Klasse 1: Tasse löschen' });
    act(() => removeClass.focus());
    fireEvent.click(removeClass);
    const remove = await screen.findByRole('dialog', { name: 'Klasse löschen?' });
    fireEvent.click(within(remove).getByRole('button', { name: 'Löschen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByRole('textbox', { name: 'Name für Klasse 1: Tasse' })).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('textbox', { name: 'Name für Klasse 1: Buch' }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Neue Klasse hinzufügen' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Alle Klassen und Bilder zurücksetzen' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Unwiderruflich löschen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getAllByText('0 / 200 Bilder').filter((node) => !node.closest('[inert]')),
    ).toHaveLength(2);
    unmount();
    expect(boundary.stopTrack).toHaveBeenCalled();
  }, 15_000);

  it('keeps model failures visible without a camera prompt and returns safely to the landing page', async () => {
    boundary.load.mockRejectedValue(new DOMException('Model network timeout', 'TimeoutError'));
    render(<TrainingPage />);
    confirmGeneralConsent();
    const error = await screen.findByRole('alert');
    expect(error.textContent).toContain('Fehler beim Laden der KI-Modelle');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(error);
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Seite neu laden' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Zur Startseite' }));
    expect(boundary.push).toHaveBeenCalledWith('/');
  });

  it('reports a failed file decode and accepts a later valid local image', async () => {
    const { container } = render(<TrainingPage />);
    await enterWithoutCamera();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, { target: { files: selectedImages('broken', 1) } });
    expect((await screen.findByRole('alert')).textContent).toContain('broken-0.png');
    fireEvent.change(input, { target: { files: selectedImages('valid', 1) } });
    await screen.findByText('1 / 200 Bilder');
    expect(boundary.getUserMedia).not.toHaveBeenCalled();
  });

  it('leaves the application when the general processing choice is declined', () => {
    render(<TrainingPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(boundary.push).toHaveBeenCalledWith('/');
    expect(boundary.load).not.toHaveBeenCalled();
  });
});
