import { useEffect, useState, type ComponentProps } from 'react';
import { toast } from '@/lib/toast';

type DialogsComponent = typeof import('./TrainingPageModals').default;
type DialogsProps = ComponentProps<DialogsComponent>;

let pendingDialogs: Promise<DialogsComponent> | undefined;
let readyDialogs: DialogsComponent | undefined;

function loadTrainingDialogs() {
  pendingDialogs ??= import('./TrainingPageModals')
    .then(({ default: Dialogs }) => {
      readyDialogs = Dialogs;
      return Dialogs;
    })
    .catch((error: unknown) => {
      pendingDialogs = undefined;
      throw error;
    });
  return pendingDialogs;
}

export function prepareTrainingDialogs() {
  if (!pendingDialogs) void loadTrainingDialogs().catch(() => {});
}

function TrainingDialogsBoundary(props: DialogsProps) {
  const { modal, closeModal } = props;
  const [Dialogs, setDialogs] = useState(() => readyDialogs);
  const pending = modal.type !== 'none' && !Dialogs;

  useEffect(() => {
    if (!pending) return;
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
  }, [closeModal, pending]);

  if (Dialogs) return <Dialogs {...props} />;
  return (
    <p className="sr-only" role="status">
      {pending ? 'Dialog wird geladen.' : ''}
    </p>
  );
}

/** Mount after the first activation and retain the existing dialog through its exit. */
export default function DeferredTrainingDialogs(props: DialogsProps) {
  const [activated, setActivated] = useState(false);
  if (!activated && props.modal.type !== 'none') setActivated(true);
  return activated ? <TrainingDialogsBoundary {...props} /> : null;
}
