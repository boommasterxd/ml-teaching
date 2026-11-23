'use client';

import Button from '../Button';
import AnimatedLink from '../AnimatedLink';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
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
  declineConsentHref?: string;
  onConfirmConsentIntent?: () => void;
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
  declineConsentHref,
  onConfirmConsentIntent,
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
  const declineAction = declineConsentHref ? (
    <AnimatedLink href={declineConsentHref} variant="secondary" transitionTypes={['nav-back']}>
      Abbrechen
    </AnimatedLink>
  ) : (
    <Button variant="secondary" onClick={onDeclineConsent}>
      Abbrechen
    </Button>
  );

  return (
    <Dialog
      initialContent={initialContent}
      isOpen={open}
      labelledBy={`${step}-modal-title`}
      describedBy={`${step}-modal-desc`}
      onClose={step ? decline[step] : undefined}
      restoreFocus={restoreFocus}
      onExited={onExited}
    >
      <ModalContent className="max-w-xl [--dialog-padding:1rem] sm:[--dialog-padding:1.5rem]">
        {step && (
          <SetupStepTransition step={step}>
            {step === 'consent' && (
              <ConsentStep
                declineAction={declineAction}
                onConfirmIntent={onConfirmConsentIntent}
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
                <DialogBody tabIndex={0} role="region" aria-labelledby="error-modal-title">
                  <DialogDescription id="error-modal-desc">
                    Überprüfe deine Verbindung und versuche es erneut.
                  </DialogDescription>
                </DialogBody>
                <DialogFooter>
                  {declineAction}
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
