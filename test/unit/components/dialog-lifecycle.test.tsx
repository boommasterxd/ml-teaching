import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { SetupDialogFixture } from '../helpers/training-setup-dialog';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function DeletionJourney({
  keepRemovedCard = false,
  showRemainingClass = true,
}: {
  keepRemovedCard?: boolean;
  showRemainingClass?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [count, setCount] = useState(1);
  return (
    <main id="main-content" tabIndex={-1}>
      <h1 tabIndex={-1}>Klassen</h1>
      <p role="status">{count} Bilder</p>
      {(!removed || keepRemovedCard) && (
        <div inert={removed} aria-hidden={removed || undefined}>
          <input id="class-name-first" aria-label="Erste Klasse" />
          <button onClick={() => setOpen(true)}>Daten löschen</button>
        </div>
      )}
      {showRemainingClass && <input id="class-name-second" aria-label="Zweite Klasse" />}
      <button>Weiterarbeiten</button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setCount((current) => current - 1);
          setRemoved(true);
          setOpen(false);
        }}
        titleId="delete-title"
        descId="delete-description"
        title="Daten löschen?"
        description="Alle Bilder werden gelöscht."
        confirmLabel="Unwiderruflich löschen"
      />
    </main>
  );
}

function FollowingDialogJourney() {
  const [step, setStep] = useState<'closed' | 'confirm' | 'loading'>('closed');
  return (
    <>
      <button onClick={() => setStep('confirm')}>Weiter</button>
      <ConfirmDialog
        isOpen={step === 'confirm'}
        onClose={() => setStep('closed')}
        onConfirm={() => setStep('loading')}
        titleId="continue-title"
        descId="continue-description"
        title="Fortfahren?"
        description="Danach wird geladen."
        confirmLabel="Laden"
      />
      <SetupDialogFixture
        step={step === 'loading' ? 'loading' : null}
        loadingText="Modell wird geladen"
      />
    </>
  );
}

function openDeletion() {
  const opener = screen.getByRole('button', { name: 'Daten löschen' });
  opener.focus();
  fireEvent.click(opener);
  return opener;
}

describe('dialog close lifecycle', () => {
  it('removes destructive actions and restores focus immediately after Escape', async () => {
    render(<DeletionJourney />);
    const status = screen.getByRole('status');
    const next = screen.getByRole('button', { name: 'Weiterarbeiten' });
    const opener = openDeletion();
    const dialog = screen.getByRole('dialog', { name: 'Daten löschen?' });
    const confirm = within(dialog).getByRole('button', { name: 'Unwiderruflich löschen' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dialog.isConnected).toBe(false);
    expect(document.activeElement).toBe(opener);
    fireEvent.keyDown(confirm, { key: 'Enter' });
    fireEvent.click(confirm);
    expect(status.textContent).toBe('1 Bilder');
    next.focus();
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(document.activeElement).toBe(next);
  });

  it.each([false, true])(
    'returns to a remaining class when the opener is removed (retained card: %s)',
    async (keepRemovedCard) => {
      render(<DeletionJourney keepRemovedCard={keepRemovedCard} />);
      const status = screen.getByRole('status');
      const remainingClass = screen.getByRole('textbox', { name: 'Zweite Klasse' });
      openDeletion();
      const dialog = screen.getByRole('dialog', { name: 'Daten löschen?' });
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Unwiderruflich löschen' }));
      expect(status.textContent).toBe('0 Bilder');
      expect(dialog.isConnected).toBe(false);
      expect(document.activeElement).toBe(remainingClass);
    },
  );

  it('returns to the class heading when removing the final class', async () => {
    render(<DeletionJourney showRemainingClass={false} />);
    const heading = screen.getByRole('heading', { name: 'Klassen' });
    openDeletion();
    fireEvent.click(screen.getByRole('button', { name: 'Unwiderruflich löschen' }));
    expect(document.activeElement).toBe(heading);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('restores the opener and permits confirming a reopened dialog', async () => {
    render(<DeletionJourney />);
    const opener = openDeletion();
    const dialog = screen.getByRole('dialog', { name: 'Daten löschen?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Unwiderruflich löschen' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('0 Bilder'));
  });

  it('leaves focus in an immediately following non-dismissible loading dialog', async () => {
    render(<FollowingDialogJourney />);
    const opener = screen.getByRole('button', { name: 'Weiter' });
    opener.focus();
    fireEvent.click(opener);
    const confirmation = screen.getByRole('dialog', { name: 'Fortfahren?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Laden' }));
    const loading = screen.getByRole('dialog', { name: 'Lade KI-Modelle...' });
    await waitFor(() => expect(loading.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(confirmation.isConnected).toBe(false));
    expect(loading.contains(document.activeElement)).toBe(true);
  });
});
