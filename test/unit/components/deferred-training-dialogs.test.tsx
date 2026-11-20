import { useCallback, useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeferredTrainingDialogs, {
  prepareTrainingDialogs,
} from '@/components/DeferredTrainingDialogs';
import type { ModalState } from '@/hooks/useModalState';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const chunk = vi.hoisted(() => {
  const gate = Promise.withResolvers<void>();
  return { request: vi.fn(() => gate.promise), release: () => gate.resolve() };
});

vi.mock(import('@/components/TrainingPageModals'), async (importOriginal) => {
  await chunk.request();
  return importOriginal();
});

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function TrainingReset() {
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const close = useCallback(() => setModal({ type: 'none' }), []);
  const reset = vi.fn();
  return (
    <>
      <button
        onFocus={prepareTrainingDialogs}
        onClick={() => setModal({ type: 'clearClass', classId: 'test-class' })}
      >
        Klasse zurücksetzen
      </button>
      <DeferredTrainingDialogs
        modal={modal}
        classes={[]}
        closeModal={close}
        removeImage={reset}
        clearClass={reset}
        removeClass={reset}
      />
    </>
  );
}

it('can cancel a cold opening, reuse the same chunk and reopen without losing the trigger', async () => {
  render(<TrainingReset />);
  const trigger = screen.getByRole('button', { name: 'Klasse zurücksetzen' });
  expect(chunk.request).not.toHaveBeenCalled();
  fireEvent.click(trigger);
  expect(screen.getByRole('status').textContent).toBe('Dialog wird geladen.');

  fireEvent.keyDown(trigger, { key: 'Escape' });
  act(() => trigger.focus());
  await waitFor(() => expect(chunk.request).toHaveBeenCalledOnce());
  await act(async () => {
    chunk.release();
    await vi.dynamicImportSettled();
  });
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);

  fireEvent.click(trigger);
  const dialog = await screen.findByRole('alertdialog', { name: 'Bilder dieser Klasse löschen?' });
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(chunk.request).toHaveBeenCalledOnce();
});
