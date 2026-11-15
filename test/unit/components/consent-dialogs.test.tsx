import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ConsentModal from '@/components/modals/ConsentModal';
import CameraConsentModal from '@/components/modals/CameraConsentModal';
import LoadingModal from '@/components/modals/LoadingModal';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

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
      <ConsentModal
        isOpen={step === 'privacy'}
        onConfirm={() => setStep('camera')}
        onDecline={() => setStep('closed')}
      />
      <CameraConsentModal
        isOpen={step === 'camera'}
        onDecline={() => setStep('complete')}
        onConfirm={() => {
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
    const { rerender } = render(<LoadingModal isOpen loadingText="Modell wird geladen" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Lade KI-Modelle...' })).toBeTruthy();
    rerender(<LoadingModal isOpen loadingText="GPU wird vorbereitet" />);
    expect(screen.getByText('GPU wird vorbereitet')).toBeTruthy();
  });
});
