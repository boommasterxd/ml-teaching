import { useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { SetupDialogFixture } from '../helpers/training-setup-dialog';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { AppRouterHost } from '../helpers/app-router-host';

const render = (ui: ReactNode) => renderComponent(ui, { wrapper: AppRouterHost });

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function ConsentJourney() {
  const [step, setStep] = useState<'closed' | 'privacy' | 'camera' | 'complete'>('closed');
  const [camera, setCamera] = useState(false);
  return (
    <>
      <button onClick={() => setStep('privacy')}>Training öffnen</button>
      <p role="status">
        {step === 'complete'
          ? camera
            ? 'Kamera eingeschaltet'
            : 'Dateien ohne Kamera auswählen'
          : 'Einwilligung erforderlich'}
      </p>
      <SetupDialogFixture
        step={step === 'privacy' ? 'consent' : step === 'camera' ? 'camera' : null}
        onConfirmConsent={() => setStep('camera')}
        onDeclineConsent={() => setStep('closed')}
        onDeclineCamera={() => setStep('complete')}
        onConfirmCamera={() => {
          setCamera(true);
          setStep('complete');
        }}
      />
    </>
  );
}

describe('consent dialogs', () => {
  it('requires both processing choices and lets the user continue without camera permission', async () => {
    render(<ConsentJourney />);
    fireEvent.click(screen.getByRole('button', { name: 'Training öffnen' }));
    const privacy = screen.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
    const confirm = within(privacy).getByRole('button', { name: 'Zustimmen' });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    const choices = within(privacy).getAllByRole('checkbox');
    fireEvent.click(choices[0]);
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(choices[0]);
    expect(choices[0].getAttribute('aria-checked')).toBe('false');
    fireEvent.click(choices[0]);
    fireEvent.click(choices[1]);
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirm);
    const camera = await screen.findByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
    expect(within(camera).getByText(/Kamera ist optional/)).toBeTruthy();
    fireEvent.click(within(camera).getByRole('button', { name: 'Ohne Kamera fortfahren' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toBe('Dateien ohne Kamera auswählen');
  });

  it('supports abandoning general consent and dismissing the camera choice with Escape', async () => {
    render(<ConsentJourney />);
    const opener = screen.getByRole('button', { name: 'Training öffnen' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    screen.getAllByRole('checkbox').forEach((choice) => fireEvent.click(choice));
    fireEvent.click(screen.getByRole('button', { name: 'Zustimmen' }));
    await screen.findByRole('dialog', { name: 'Berechtigung zur Kameranutzung' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toBe('Dateien ohne Kamera auswählen');
  });

  it('keeps model loading non-dismissible and exposes updated progress', () => {
    const { rerender } = render(<SetupDialogFixture />);
    rerender(<SetupDialogFixture step="loading" loadingText="Modell wird geladen" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Lade KI-Modelle...' })).toBeTruthy();
    const progress = screen.getByText('Modell wird geladen');
    expect(progress.closest('[aria-live="polite"]')).not.toBeNull();
    const withdrawal = screen.getByRole('link', { name: /Einwilligung widerrufen/ });
    withdrawal.focus();
    rerender(<SetupDialogFixture step="loading" loadingText="GPU wird vorbereitet" />);
    expect(screen.getByText('GPU wird vorbereitet')).toBe(progress);
    expect(document.activeElement).toBe(withdrawal);
  });
});
