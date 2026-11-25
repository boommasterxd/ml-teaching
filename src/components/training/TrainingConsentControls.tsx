'use client';

import { useEffect, useState, useSyncExternalStore, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '@/lib/toast';
import Button from '../Button';
import { ShieldCheck } from '../icons/shield-check';
import { Spinner } from '../ui/spinner';
import { useDeferredModule } from '@/hooks/use-deferred-module';

interface TrainingConsentControlsProps {
  visible: boolean;
  blocked: boolean;
  canRevokeCamera: boolean;
  onRevokeCamera: () => void;
  onRevokeConsent: () => void;
  onRevokeIntent: () => void;
  onExited: () => void;
}

type Trigger = 'floating' | 'footer';

const label = 'Einstellungen zum Bildtraining';
const subscribeToFooter = () => () => {};
const getFooterSlot = () => document.getElementById('footer-route-actions');
const getServerSlot = () => null;
const loadSettings = () => import('./TrainingConsentDialog');

export default function TrainingConsentControls({
  visible,
  blocked,
  canRevokeCamera,
  onRevokeCamera,
  onRevokeConsent,
  onRevokeIntent,
  onExited,
}: TrainingConsentControlsProps) {
  const slot = useSyncExternalStore(subscribeToFooter, getFooterSlot, getServerSlot);
  const { module, failed, prepare } = useDeferredModule(loadSettings);
  const [opening, setOpening] = useState<Trigger | null>(null);
  const Dialog = module?.default;
  const available = visible && !blocked;
  const pending = available && opening !== null && !Dialog && !failed;
  const FloatingIcon = pending && opening === 'floating' ? Spinner : ShieldCheck;
  const FooterIcon = pending && opening === 'footer' ? Spinner : ShieldCheck;
  const open = available && opening !== null && Boolean(Dialog);
  if (!available && opening !== null) setOpening(null);

  useEffect(() => {
    if (available && failed && opening !== null)
      toast.error('Die Einstellungen konnten nicht geladen werden. Versuche es erneut.');
  }, [available, failed, opening]);

  function activate(trigger: Trigger, event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.focus({ preventScroll: true });
    setOpening(trigger);
    prepare();
  }

  function triggerProps(trigger: Trigger) {
    const active = opening === trigger;
    return {
      type: 'button' as const,
      disabled: blocked,
      'aria-haspopup': 'dialog' as const,
      'aria-expanded': open && active,
      'aria-busy': (pending && active) || undefined,
      'data-training-settings-trigger': trigger,
      onClick: (event: MouseEvent<HTMLButtonElement>) => activate(trigger, event),
      onPointerEnter: prepare,
      onPointerDown: prepare,
      onFocus: prepare,
      onBlur: () => {
        if (!Dialog) setOpening(null);
      },
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && !Dialog && active) {
          event.preventDefault();
          setOpening(null);
        }
      },
    };
  }

  return (
    <>
      {visible && (
        <Button
          {...triggerProps('floating')}
          variant="secondary"
          size="icon-lg"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-30 hidden size-11 border border-input shadow-md 2xl:inline-flex"
          aria-label={label}
        >
          <FloatingIcon aria-hidden="true" />
        </Button>
      )}
      {visible &&
        slot &&
        createPortal(
          <Button
            {...triggerProps('footer')}
            variant="ghost"
            size="sm"
            className="footer-link min-h-11 px-0 font-normal hover:bg-transparent"
          >
            <FooterIcon data-icon="inline-start" aria-hidden="true" />
            {label}
          </Button>,
          slot,
        )}
      {pending && (
        <span role="status" className="sr-only">
          Einstellungen werden geladen.
        </span>
      )}
      {Dialog && (
        <Dialog
          isOpen={open}
          canRevokeCamera={canRevokeCamera}
          onClose={() => setOpening(null)}
          onRevokeCamera={onRevokeCamera}
          onRevokeConsent={onRevokeConsent}
          onRevokeIntent={onRevokeIntent}
          onExited={onExited}
        />
      )}
    </>
  );
}
