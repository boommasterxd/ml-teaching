'use client';

import { useState, type ReactNode } from 'react';
import Button from '../Button';
import AnimatedLink from '../AnimatedLink';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Spinner } from '../ui/spinner';
import { RotateCcw } from '../icons/rotate-ccw';
import CameraStep from './CameraStep';
import ConsentStep from './ConsentStep';
import LoadingStep from './LoadingStep';
import SetupActionFooter from './SetupActionFooter';
import SetupStepTransition, { type SetupStep } from './SetupStepTransition';

interface TrainingSetupDialogProps {
  initialContent: boolean;
  step: SetupStep | null;
  open?: boolean;
  restoreFocus?: boolean;
  onExited?: () => void;
  loadingText: string;
  onWithdrawConsent: () => void;
  onWithdrawIntent?: () => void;
  onDeclineConsent: (withdraw: boolean) => void;
  declineConsentHref?: string;
  onConfirmConsentIntent?: () => void;
  onConfirmConsent: (remember: boolean) => void;
  onDeclineCamera: () => void;
  onConfirmCamera: () => void;
  cameraPending?: boolean;
  cameraError?: string;
  onRetryCamera?: () => void;
  onRetryModel?: () => void;
  workspaceFailed?: boolean;
  onRetryWorkspace?: () => void;
}

function WorkspaceStep({
  failed,
  onRetry,
  cancelAction,
}: {
  failed: boolean;
  onRetry?: () => void;
  cancelAction: ReactNode;
}) {
  const [attempted, setAttempted] = useState(false);
  return (
    <>
      <DialogTitle id="workspace-modal-title" tabIndex={-1}>
        Arbeitsbereich vorbereiten
      </DialogTitle>
      <DialogBody>
        <div id="workspace-modal-desc">
          {failed ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>Der Arbeitsbereich konnte nicht geladen werden.</AlertDescription>
            </Alert>
          ) : (
            <DialogDescription className="flex items-center gap-2" role="status">
              <Spinner aria-hidden="true" /> Arbeitsbereich wird geladen …
            </DialogDescription>
          )}
        </div>
      </DialogBody>
      <DialogFooter layout="auto-fit">
        {cancelAction}
        {(failed || attempted) && (
          <Button
            aria-disabled={!failed || undefined}
            onClick={() => {
              if (!failed) return;
              setAttempted(true);
              onRetry?.();
            }}
          >
            Erneut versuchen
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

function ModelLoadError({
  declineAction,
  onRetryModel,
  withdrawAction,
}: {
  declineAction: ReactNode;
  onRetryModel?: () => void;
  withdrawAction: ReactNode;
}) {
  return (
    <>
      <DialogTitle id="error-modal-title" tabIndex={-1}>
        KI-Modell konnte nicht geladen werden
      </DialogTitle>
      <DialogBody tabIndex={0} role="region" aria-labelledby="error-modal-title">
        <DialogDescription id="error-modal-desc">
          Überprüfe deine Verbindung und versuche es erneut.
        </DialogDescription>
      </DialogBody>
      <SetupActionFooter>
        {declineAction}
        {withdrawAction}
        <Button onClick={onRetryModel}>Erneut versuchen</Button>
      </SetupActionFooter>
    </>
  );
}

function SetupWithdrawalAction({
  showIcon,
  onWithdrawConsent,
  onWithdrawIntent,
}: Pick<TrainingSetupDialogProps, 'onWithdrawConsent' | 'onWithdrawIntent'> & {
  showIcon: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onWithdrawConsent}
      onPointerEnter={onWithdrawIntent}
      onPointerDown={onWithdrawIntent}
      onFocus={onWithdrawIntent}
    >
      {showIcon && <RotateCcw data-icon="inline-start" aria-hidden="true" />}
      Einwilligung widerrufen
    </Button>
  );
}

export default function TrainingSetupDialog({
  initialContent,
  step,
  open = step !== null,
  onExited,
  restoreFocus = !onExited,
  loadingText,
  onWithdrawConsent,
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
  workspaceFailed = false,
  onRetryWorkspace,
}: TrainingSetupDialogProps) {
  const dismiss = () => onDeclineConsent(step === 'workspace');
  const decline = {
    consent: dismiss,
    camera: onDeclineCamera,
    loading: undefined,
    error: dismiss,
    workspace: dismiss,
  };
  const declineAction =
    declineConsentHref && step !== 'workspace' ? (
      <AnimatedLink href={declineConsentHref} variant="secondary" transitionTypes={['nav-back']}>
        Abbrechen
      </AnimatedLink>
    ) : (
      <Button type="button" variant="secondary" onClick={dismiss}>
        Abbrechen
      </Button>
    );
  const withdrawAction = (
    <SetupWithdrawalAction
      showIcon={step === 'loading'}
      onWithdrawConsent={onWithdrawConsent}
      onWithdrawIntent={onWithdrawIntent}
    />
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
      <ModalContent className="@container/training-setup max-w-xl [--dialog-padding:1rem] sm:[--dialog-padding:1.5rem]">
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
              <LoadingStep loadingText={loadingText} withdrawAction={withdrawAction} />
            )}
            {step === 'camera' && (
              <CameraStep
                onDecline={onDeclineCamera}
                onConfirm={onConfirmCamera}
                pending={cameraPending}
                error={cameraError}
                onRetry={onRetryCamera}
                withdrawAction={withdrawAction}
              />
            )}
            {step === 'error' && (
              <ModelLoadError
                declineAction={declineAction}
                onRetryModel={onRetryModel}
                withdrawAction={withdrawAction}
              />
            )}
            {step === 'workspace' && (
              <WorkspaceStep
                failed={workspaceFailed}
                onRetry={onRetryWorkspace}
                cancelAction={declineAction}
              />
            )}
          </SetupStepTransition>
        )}
      </ModalContent>
    </Dialog>
  );
}
