'use client';

import Button from '../Button';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import { DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import CameraStep from './CameraStep';
import ConsentStep from './ConsentStep';
import LoadingStep from './LoadingStep';
import SetupStepTransition, { type SetupStep } from './SetupStepTransition';

interface TrainingSetupDialogProps {
  initialContent: boolean;
  step: SetupStep | null;
  open?: boolean;
  restoreFocus?: boolean;
  onExited?: () => void;
  loadingText: string;
  onWithdrawLoading: () => void;
  onWithdrawIntent?: () => void;
  onDeclineConsent: () => void;
  onDeclineConsentIntent?: () => void;
  onConfirmConsent: (remember: boolean) => void;
  onDeclineCamera: () => void;
  onConfirmCamera: () => void;
  cameraPending?: boolean;
  cameraError?: string;
  onRetryCamera?: () => void;
  onRetryModel?: () => void;
}

export default function TrainingSetupDialog({
  initialContent,
  step,
  open = step !== null,
  onExited,
  restoreFocus = !onExited,
  loadingText,
  onWithdrawLoading,
  onWithdrawIntent,
  onDeclineConsent,
  onDeclineConsentIntent,
  onConfirmConsent,
  onDeclineCamera,
  onConfirmCamera,
  cameraPending,
  cameraError,
  onRetryCamera,
  onRetryModel,
}: TrainingSetupDialogProps) {
  const decline = {
    consent: onDeclineConsent,
    camera: onDeclineCamera,
    loading: undefined,
    error: onDeclineConsent,
  };

  return (
    <Dialog
      initialContent={initialContent}
      initialSuppressedByRememberedConsent={initialContent}
      isOpen={open}
      labelledBy={`${step}-modal-title`}
      describedBy={`${step}-modal-desc`}
      onClose={step ? decline[step] : undefined}
      restoreFocus={restoreFocus}
      onExited={onExited}
    >
      <ModalContent className="max-w-xl p-4 sm:p-6">
        {step && (
          <SetupStepTransition step={step}>
            {step === 'consent' && (
              <ConsentStep
                onDecline={onDeclineConsent}
                onDeclineIntent={onDeclineConsentIntent}
                onConfirm={onConfirmConsent}
              />
            )}
            {step === 'loading' && (
              <LoadingStep
                loadingText={loadingText}
                onWithdraw={onWithdrawLoading}
                onWithdrawIntent={onWithdrawIntent}
              />
            )}
            {step === 'camera' && (
              <CameraStep
                onDecline={onDeclineCamera}
                onConfirm={onConfirmCamera}
                pending={cameraPending}
                error={cameraError}
                onRetry={onRetryCamera}
              />
            )}
            {step === 'error' && (
              <>
                <DialogTitle id="error-modal-title" tabIndex={-1}>
                  KI-Modell konnte nicht geladen werden
                </DialogTitle>
                <DialogDescription id="error-modal-desc">
                  Überprüfe deine Verbindung und versuche es erneut.
                </DialogDescription>
                <DialogFooter>
                  <Button variant="secondary" onClick={onDeclineConsent}>
                    Abbrechen
                  </Button>
                  <Button onClick={onRetryModel}>Erneut versuchen</Button>
                </DialogFooter>
              </>
            )}
          </SetupStepTransition>
        )}
      </ModalContent>
    </Dialog>
  );
}
