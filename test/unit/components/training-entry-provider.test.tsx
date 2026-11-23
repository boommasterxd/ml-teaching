import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrainingEntryProvider from '@/components/training/TrainingEntryProvider';
import { useTrainingEntry, useTrainingSession } from '@/components/training/TrainingEntryContext';
import { learningPaths } from '@/lib/learning-paths';
import TrainingPage from '@/screens/TrainingPage';
import {
  getPreparedTrainingWorkspace,
  loadTrainingWorkspace,
} from '@/components/training/training-workspace-loader';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
  TRAINING_CONSENT_DURATION,
  writeRememberedTrainingConsent,
} from '@/lib/training-consent-storage';
import { AppRouterHost, testRouter } from '../helpers/app-router-host';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const browser = vi.hoisted(() => ({
  loadResourceHost: vi.fn(),
  model: vi.fn(),
  disposeModel: vi.fn(),
  getUserMedia: vi.fn(),
  queryPermission: vi.fn(),
  stopCamera: vi.fn(),
  tensor: () => ({ dispose: vi.fn() }),
}));

vi.mock(import('@/components/training/TrainingResourceHost'), async (original) => {
  browser.loadResourceHost();
  return original();
});
vi.mock(import('@/components/training/training-workspace-loader'), async (original) => {
  const loader = await original();
  return {
    loadTrainingWorkspace: vi.fn(loader.loadTrainingWorkspace),
    getPreparedTrainingWorkspace: vi.fn(loader.getPreparedTrainingWorkspace),
  };
});
vi.mock('@/lib/mobilenet-embedding', () => ({ loadMobileNetEmbedding: browser.model }));
vi.mock('@tensorflow/tfjs-core', () => {
  let factory: (() => unknown) | null = () => ({});
  return {
    findBackendFactory: () => factory,
    registerBackend: (_name: string, next: () => unknown) => {
      factory = next;
    },
    setBackend: async () => factory !== null,
    removeBackend: () => {
      factory = null;
    },
    ready: vi.fn(async () => {}),
    tidy: (operation: () => unknown) => operation(),
    zeros: browser.tensor,
  };
});
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow-models/knn-classifier', () => ({
  create: () => ({
    addExample: vi.fn(),
    predictClass: vi.fn(async () => ({})),
    dispose: vi.fn(),
  }),
}));

const mediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
const permissions = Object.getOwnPropertyDescriptor(navigator, 'permissions');
const consentName = 'Einwilligung zur Datenverarbeitung';
const cameraName = 'Berechtigung zur Kameranutzung';
const settingsName = 'Einstellungen zum Bildtraining';

function cameraStream() {
  const track = Object.assign(new EventTarget(), {
    readyState: 'live',
    stop: browser.stopCamera,
  });
  return { getTracks: () => [track] };
}

beforeEach(() => {
  installBrowserHost();
  // Motion restores scroll after measuring animated heights. JSDOM cannot scroll.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.clearAllMocks();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  clearRememberedTrainingConsent();
  browser.model.mockReset().mockResolvedValue({
    infer: browser.tensor,
    dispose: browser.disposeModel,
  });
  browser.getUserMedia.mockReset().mockImplementation(async () => cameraStream());
  browser.queryPermission.mockReset().mockResolvedValue({ state: 'prompt' });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: browser.getUserMedia },
  });
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: { query: browser.queryPermission },
  });
});

afterEach(() => {
  cleanup();
  restoreBrowserHost();
  vi.useRealTimers();
  clearRememberedTrainingConsent();
  if (mediaDevices) Object.defineProperty(navigator, 'mediaDevices', mediaDevices);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
  if (permissions) Object.defineProperty(navigator, 'permissions', permissions);
  else Reflect.deleteProperty(navigator, 'permissions');
});

function EntryContents({ pathname }: { pathname: string }) {
  const entry = useTrainingEntry()!;
  const { engine, pendingArrival } = useTrainingSession();

  return (
    <>
      {pathname === learningPaths.imagePractice ? (
        <main>
          <h1>Bildtraining</h1>
          {pendingArrival && <p>Einrichtung abgeschlossen</p>}
          {engine.canUseModels && <p>Modell einsatzbereit</p>}
          {engine.camera.stream && <p>Kamera verbunden</p>}
        </main>
      ) : (
        <main>
          <button
            onFocus={entry.prepareEntry}
            onClick={(event) => entry.openEntry(event.currentTarget)}
          >
            Bildmodell trainieren
          </button>
        </main>
      )}
      <footer>
        <div id="footer-route-actions" />
      </footer>
    </>
  );
}

function EntryPage({ pathname }: { pathname: string }) {
  return (
    <PathnameContext.Provider value={pathname}>
      <TrainingEntryProvider>
        <EntryContents pathname={pathname} />
      </TrainingEntryProvider>
    </PathnameContext.Provider>
  );
}

function showPage(pathname: string = learningPaths.images) {
  window.history.replaceState(null, '', pathname);
  const page = render(<EntryPage pathname={pathname} />, { wrapper: AppRouterHost });
  return (next: string) => {
    window.history.replaceState(null, '', next);
    page.rerender(<EntryPage pathname={next} />);
  };
}

function startTraining() {
  const opener = screen.getByRole('button', { name: 'Bildmodell trainieren' });
  act(() => opener.focus());
  fireEvent.click(opener);
  return opener;
}

async function agreeToTraining(remember = false) {
  const consent = within(await screen.findByRole('dialog', { name: consentName }));
  for (const choice of consent.getAllByRole('checkbox', { name: /^Ich stimme zu/ })) {
    fireEvent.click(choice);
  }
  if (remember) {
    fireEvent.click(consent.getByRole('checkbox', { name: 'Für 30 Minuten in diesem Tab merken' }));
  }
  fireEvent.click(consent.getByRole('button', { name: 'Zustimmen' }));
}

async function openSettings() {
  const footer = within(screen.getByRole('contentinfo'));
  fireEvent.click(await footer.findByRole('button', { name: settingsName }));
  return within(await screen.findByRole('alertdialog', { name: settingsName }));
}

describe('training entry across routes', () => {
  it('keeps the resource host out of a cold direct entry until consent intent', async () => {
    render(
      <PathnameContext.Provider value={learningPaths.imagePractice}>
        <TrainingEntryProvider>
          <TrainingPage />
        </TrainingEntryProvider>
      </PathnameContext.Provider>,
      { wrapper: AppRouterHost },
    );
    await act(() => vi.dynamicImportSettled());
    expect(browser.loadResourceHost).not.toHaveBeenCalled();
    expect(loadTrainingWorkspace).not.toHaveBeenCalled();

    const consent = within(screen.getByRole('dialog', { name: consentName }));
    const confirm = consent.getByRole('button', { name: 'Zustimmen' });
    for (const choice of consent.getAllByRole('checkbox', { name: /^Ich stimme zu/ })) {
      fireEvent.click(choice);
    }
    act(() => confirm.focus());
    await act(() => vi.dynamicImportSettled());
    expect(browser.loadResourceHost).toHaveBeenCalledOnce();
    expect(loadTrainingWorkspace).toHaveBeenCalledOnce();
    expect(browser.model).not.toHaveBeenCalled();
    expect(browser.getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(confirm);
    await screen.findByRole('dialog', { name: cameraName });
    expect(browser.model).toHaveBeenCalledOnce();
    expect(browser.getUserMedia).not.toHaveBeenCalled();
  });

  it('keeps source setup open for a failed workspace and retries without restarting resources', async () => {
    vi.mocked(getPreparedTrainingWorkspace).mockReturnValueOnce(undefined);
    vi.mocked(loadTrainingWorkspace).mockRejectedValueOnce(new Error('Workspace not available'));
    showPage(learningPaths.images);
    expect(loadTrainingWorkspace).not.toHaveBeenCalled();
    startTraining();
    await agreeToTraining();
    const camera = within(await screen.findByRole('dialog', { name: cameraName }));
    fireEvent.click(camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }));

    const workspace = within(
      await screen.findByRole('dialog', { name: 'Arbeitsbereich vorbereiten' }),
    );
    expect(workspace.getByRole('alert').textContent).toContain('konnte nicht geladen werden');
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(browser.model).toHaveBeenCalledOnce();

    fireEvent.click(workspace.getByRole('button', { name: 'Erneut versuchen' }));
    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledWith(learningPaths.imagePractice, {
        transitionTypes: ['nav-forward'],
      }),
    );
    expect(loadTrainingWorkspace).toHaveBeenCalledTimes(2);
    expect(browser.model).toHaveBeenCalledOnce();
    expect(browser.getUserMedia).not.toHaveBeenCalled();
  });

  it('discards a source setup when the document is hidden with its workspace still loading', async () => {
    const prepared = getPreparedTrainingWorkspace()!;
    const pending = Promise.withResolvers<typeof prepared>();
    vi.mocked(getPreparedTrainingWorkspace).mockReturnValueOnce(undefined);
    vi.mocked(loadTrainingWorkspace).mockReturnValueOnce(pending.promise);
    showPage(learningPaths.images);
    startTraining();
    await agreeToTraining(true);
    const camera = within(await screen.findByRole('dialog', { name: cameraName }));
    fireEvent.click(camera.getByRole('button', { name: 'Ohne Kamera fortfahren' }));
    const workspace = within(
      await screen.findByRole('dialog', { name: 'Arbeitsbereich vorbereiten' }),
    );
    expect(workspace.getByRole('status').textContent).toContain('wird geladen');
    expect(testRouter.push).not.toHaveBeenCalled();

    fireEvent(window, new Event('pagehide'));
    await act(async () => pending.resolve(prepared));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(browser.disposeModel).toHaveBeenCalledOnce();
    expect(readRememberedTrainingConsent()).toBeNull();
  });

  it('prepares the training host on focus without starting its subscriptions before activation', async () => {
    const subscribe = vi.spyOn(document, 'addEventListener');
    const visibilitySubscriptions = () =>
      subscribe.mock.calls.filter(([event]) => event === 'visibilitychange');
    showPage(learningPaths.images);
    const opener = screen.getByRole('button', { name: 'Bildmodell trainieren' });
    expect(visibilitySubscriptions()).toHaveLength(0);

    act(() => opener.focus());
    await act(() => vi.dynamicImportSettled());
    expect(visibilitySubscriptions()).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(opener);
    await screen.findByRole('dialog', { name: consentName });
    expect(visibilitySubscriptions()).toHaveLength(0);
    expect(browser.model).not.toHaveBeenCalled();
    expect(browser.getUserMedia).not.toHaveBeenCalled();

    await agreeToTraining();
    await screen.findByRole('dialog', { name: cameraName });
    expect(visibilitySubscriptions()).toHaveLength(1);
  });

  it('closes the source-page dialog with Escape and returns focus without starting any resources', async () => {
    showPage();
    const opener = startTraining();
    await screen.findByRole('dialog', { name: consentName });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(window.location.pathname).toBe(learningPaths.images);
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(browser.model).not.toHaveBeenCalled();
    expect(browser.getUserMedia).not.toHaveBeenCalled();
    expect(readRememberedTrainingConsent()).toBeNull();
  });

  it('lets a visitor retry a failed model download and withdraw the choice while the retry is pending', async () => {
    browser.model
      .mockRejectedValueOnce(new DOMException('Model timeout', 'TimeoutError'))
      .mockImplementationOnce(
        (signal: AbortSignal) =>
          new Promise((_, reject) =>
            signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
          ),
      );
    showPage();
    const opener = startTraining();
    await agreeToTraining(true);
    const failure = within(
      await screen.findByRole('dialog', { name: 'KI-Modell konnte nicht geladen werden' }),
    );
    fireEvent.click(failure.getByRole('button', { name: 'Erneut versuchen' }));
    await waitFor(() => expect(browser.model).toHaveBeenCalledTimes(2));
    const loading = within(await screen.findByRole('dialog', { name: /Lade KI-Modelle/ }));
    expect(readRememberedTrainingConsent()?.camera).toBe('pending');
    fireEvent.click(loading.getByRole('button', { name: 'Einwilligung widerrufen' }));
    const confirmation = within(
      await screen.findByRole('dialog', { name: 'Einwilligung widerrufen' }),
    );
    fireEvent.click(confirmation.getByRole('button', { name: 'Schließen' }));
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect((browser.model.mock.calls[1][0] as AbortSignal).aborted).toBe(true);
    expect(readRememberedTrainingConsent()).toBeNull();
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(browser.getUserMedia).not.toHaveBeenCalled();
  });

  it('waits for camera recovery, hands the same resources to the destination and releases them on request', async () => {
    const cameraResult = Promise.withResolvers<ReturnType<typeof cameraStream>>();
    browser.getUserMedia
      .mockRejectedValueOnce(new DOMException('Camera denied', 'NotAllowedError'))
      .mockReturnValueOnce(cameraResult.promise);
    const traverse = showPage();
    startTraining();
    await agreeToTraining(true);
    const camera = within(await screen.findByRole('dialog', { name: cameraName }));
    fireEvent.click(camera.getByRole('button', { name: 'Erlauben' }));
    await camera.findByRole('alert', undefined, { timeout: 3000 });
    fireEvent.click(camera.getByRole('button', { name: 'Erneut versuchen' }));
    await camera.findByRole('status');
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(readRememberedTrainingConsent()?.camera).toBe('pending');
    await act(async () => cameraResult.resolve(cameraStream()));
    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledExactlyOnceWith(learningPaths.imagePractice, {
        transitionTypes: ['nav-forward'],
      }),
    );
    traverse(learningPaths.imagePractice);
    expect(await screen.findByText('Einrichtung abgeschlossen')).toBeTruthy();
    expect(screen.getByText('Modell einsatzbereit')).toBeTruthy();
    expect(screen.getByText('Kamera verbunden')).toBeTruthy();
    expect(browser.model).toHaveBeenCalledOnce();
    expect(browser.getUserMedia).toHaveBeenCalledTimes(2);
    expect(readRememberedTrainingConsent()?.camera).toBe('allowed');

    const settings = await openSettings();
    fireEvent.click(settings.getByRole('button', { name: 'Kamera ausschalten' }));
    await waitFor(() => expect(screen.queryByText('Kamera verbunden')).toBeNull());
    expect(screen.getByText('Modell einsatzbereit')).toBeTruthy();
    expect(readRememberedTrainingConsent()?.camera).toBe('declined');
    expect(browser.stopCamera).toHaveBeenCalledOnce();
    expect(browser.disposeModel).not.toHaveBeenCalled();
    traverse(learningPaths.images);
    await waitFor(() => expect(browser.disposeModel).toHaveBeenCalledOnce());
  });

  it('allows camera-only withdrawal from another route before fully forgetting the choice', async () => {
    const expiresAt = Date.now() + TRAINING_CONSENT_DURATION;
    writeRememberedTrainingConsent(expiresAt, 'allowed');
    showPage();
    const settings = await openSettings();
    fireEvent.click(settings.getByRole('button', { name: 'Kamera ausschalten' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { name: settingsName })).toBeNull(),
    );
    expect(readRememberedTrainingConsent()).toEqual({ expiresAt, camera: 'declined' });

    const remaining = await openSettings();
    expect(remaining.queryByRole('button', { name: 'Kamera ausschalten' })).toBeNull();
    fireEvent.click(remaining.getByRole('button', { name: 'Einwilligung widerrufen' }));
    const confirmation = within(
      await screen.findByRole('dialog', { name: 'Einwilligung widerrufen' }),
    );
    expect(confirmation.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Schließen',
    ]);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByRole('button', { name: settingsName })).toBeNull();
    startTraining();
    const consent = within(await screen.findByRole('dialog', { name: consentName }));
    expect(consent.getByRole('button', { name: 'Zustimmen' })).toHaveProperty('disabled', true);
    expect(readRememberedTrainingConsent()).toBeNull();
    expect(browser.model).not.toHaveBeenCalled();
    expect(browser.getUserMedia).not.toHaveBeenCalled();
    expect(testRouter.push).not.toHaveBeenCalled();
  });

  it('continues with remembered consent and does not request camera access when the browser would prompt', async () => {
    const expiresAt = Date.now() + TRAINING_CONSENT_DURATION;
    writeRememberedTrainingConsent(expiresAt, 'allowed');
    const traverse = showPage();
    startTraining();
    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledExactlyOnceWith(learningPaths.imagePractice, {
        transitionTypes: ['nav-forward'],
      }),
    );
    expect(screen.queryByRole('dialog', { name: consentName })).toBeNull();
    expect(browser.queryPermission).not.toHaveBeenCalled();
    expect(browser.getUserMedia).not.toHaveBeenCalled();

    traverse(learningPaths.imagePractice);
    await waitFor(() =>
      expect(browser.queryPermission).toHaveBeenCalledExactlyOnceWith({ name: 'camera' }),
    );
    expect(screen.getByText('Modell einsatzbereit')).toBeTruthy();
    expect(screen.queryByText('Kamera verbunden')).toBeNull();
    expect(browser.model).toHaveBeenCalledOnce();
    expect(browser.getUserMedia).not.toHaveBeenCalled();
    expect(readRememberedTrainingConsent()).toEqual({ expiresAt, camera: 'allowed' });
  });

  it('forgets an expired choice and asks again at the next start', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const expiresAt = Date.now() + TRAINING_CONSENT_DURATION;
    writeRememberedTrainingConsent(expiresAt, 'declined');
    showPage();
    await act(async () => {});
    expect(
      within(screen.getByRole('contentinfo')).getByRole('button', { name: settingsName }),
    ).toBeTruthy();
    await act(async () => vi.advanceTimersByTimeAsync(TRAINING_CONSENT_DURATION));
    expect(screen.queryByRole('button', { name: settingsName })).toBeNull();
    expect(readRememberedTrainingConsent()).toBeNull();
    vi.useRealTimers();
    startTraining();
    expect(await screen.findByRole('dialog', { name: consentName })).toBeTruthy();
    expect(browser.model).not.toHaveBeenCalled();
  });

  it('discards remembered consent and releases resources before a page can enter the back-forward cache', async () => {
    const expiresAt = Date.now() + TRAINING_CONSENT_DURATION;
    writeRememberedTrainingConsent(expiresAt, 'allowed');
    browser.queryPermission.mockResolvedValue({ state: 'granted' });
    showPage(learningPaths.imagePractice);
    expect(await screen.findByText('Kamera verbunden')).toBeTruthy();

    fireEvent(window, new Event('pagehide'));
    fireEvent(window, new Event('pageshow'));

    expect(readRememberedTrainingConsent()).toBeNull();
    expect(screen.queryByText('Kamera verbunden')).toBeNull();
    expect(browser.stopCamera).toHaveBeenCalledOnce();
    await waitFor(() => expect(browser.disposeModel).toHaveBeenCalledOnce());
    expect(browser.getUserMedia).toHaveBeenCalledOnce();
  });

  it('does not restore camera access when its permission result arrives after withdrawal', async () => {
    const expiresAt = Date.now() + TRAINING_CONSENT_DURATION;
    const permission = Promise.withResolvers<{ state: 'granted' }>();
    writeRememberedTrainingConsent(expiresAt, 'allowed');
    browser.queryPermission.mockReturnValueOnce(permission.promise);
    showPage(learningPaths.imagePractice);
    await waitFor(() => expect(browser.queryPermission).toHaveBeenCalledOnce());

    const settings = await openSettings();
    fireEvent.click(settings.getByRole('button', { name: 'Kamera ausschalten' }));
    await act(async () => permission.resolve({ state: 'granted' }));

    expect(readRememberedTrainingConsent()?.camera).toBe('declined');
    expect(browser.getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByText('Modell einsatzbereit')).toBeTruthy();
  });
});
