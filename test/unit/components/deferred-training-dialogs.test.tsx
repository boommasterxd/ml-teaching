import { useCallback, useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  prepareTrainingDialogs,
  useDeferredTrainingDialogs,
} from '@/components/DeferredTrainingDialogs';
import { ClassManagementActions } from '@/components/TrainingClassFrame';
import type { ModalState } from '@/hooks/useModalState';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { makeClasses } from '../helpers/training-data';

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
  const { Dialogs, pendingDialog } = useDeferredTrainingDialogs(modal, close);
  const reset = vi.fn();
  const classes = makeClasses(1);
  return (
    <>
      <ClassManagementActions
        cls={classes[0]}
        position={1}
        onPrepare={prepareTrainingDialogs}
        onClear={() => setModal({ type: 'clearClass', classId: classes[0].id })}
        pendingAction={pendingDialog?.type}
      />
      {Dialogs && (
        <Dialogs
          modal={modal}
          classes={classes}
          closeModal={close}
          removeImage={reset}
          clearClass={reset}
          removeClass={reset}
        />
      )}
    </>
  );
}

it('can cancel a cold opening, reuse the same chunk and reopen without losing the trigger', async () => {
  render(<TrainingReset />);
  const trigger = screen.getByRole('button', { name: 'Bilder der Klasse 1: Rot zurücksetzen' });
  const remove = screen.getByRole('button', { name: 'Klasse 1: Rot löschen' });
  expect(chunk.request).not.toHaveBeenCalled();
  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-busy')).toBe('true');
  expect(within(trigger).getByRole('status', { hidden: true })).toBeTruthy();
  expect(remove.hasAttribute('aria-busy')).toBe(false);

  fireEvent.keyDown(trigger, { key: 'Escape' });
  expect(trigger.hasAttribute('aria-busy')).toBe(false);

  act(() => trigger.focus());
  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-busy')).toBe('true');
  act(() => remove.focus());
  expect(trigger.hasAttribute('aria-busy')).toBe(false);

  await waitFor(() => expect(chunk.request).toHaveBeenCalledOnce());
  await act(async () => {
    chunk.release();
    await vi.dynamicImportSettled();
  });
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(document.activeElement).toBe(remove);

  act(() => trigger.focus());
  fireEvent.click(trigger);
  expect(trigger.hasAttribute('aria-busy')).toBe(false);
  const dialog = await screen.findByRole('alertdialog', { name: 'Bilder dieser Klasse löschen?' });
  expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
  expect(screen.getByText('„Rot“')).toBeTruthy();
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(chunk.request).toHaveBeenCalledOnce();
});
