import { useEffect, useState } from 'react';
import type { ModalState } from '@/hooks/useModalState';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import { toast } from '@/lib/toast';

type DialogsComponent = typeof import('./TrainingPageModals').default;
export type PendingTrainingDialog = Exclude<ModalState, { type: 'none' }>;

const loadTrainingDialogs = createRetryableLoader(
  async () => (await import('./TrainingPageModals')).default,
);

export function prepareTrainingDialogs() {
  void loadTrainingDialogs().catch(() => {});
}

/** Mount on first activation and retain the dialog owner through its exits. */
export function useDeferredTrainingDialogs(modal: ModalState, closeModal: () => void) {
  const [Dialogs, setDialogs] = useState<DialogsComponent>();
  const prepared = loadTrainingDialogs.getLoaded();
  if (!Dialogs && modal.type !== 'none' && prepared) setDialogs(() => prepared);
  const pendingDialog = !Dialogs && modal.type !== 'none' ? modal : undefined;

  useEffect(() => {
    if (!pendingDialog) return;
    let active = true;
    let opener = document.activeElement;
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      active = false;
      closeModal();
    };
    const dismissOnFocusChange = (event: FocusEvent) => {
      if (!opener || opener === document.body) {
        opener = event.target instanceof HTMLElement ? event.target : null;
        return;
      }
      if (event.target === opener) return;
      active = false;
      closeModal();
    };
    document.addEventListener('keydown', cancel);
    document.addEventListener('focusin', dismissOnFocusChange);
    void loadTrainingDialogs().then(
      (loaded) => {
        if (!active) return;
        // The existing dialog owns focus as soon as it mounts.
        document.removeEventListener('focusin', dismissOnFocusChange);
        setDialogs(() => loaded);
      },
      () => {
        if (!active) return;
        closeModal();
        toast.error('Der Dialog konnte nicht geladen werden. Versuche es erneut.');
      },
    );
    return () => {
      active = false;
      document.removeEventListener('keydown', cancel);
      document.removeEventListener('focusin', dismissOnFocusChange);
    };
  }, [closeModal, pendingDialog]);

  return { Dialogs, pendingDialog };
}
