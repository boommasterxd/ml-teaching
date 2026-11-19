'use client';

import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import CameraStep from './CameraStep';
import ConsentStep from './ConsentStep';
import LoadingStep from './LoadingStep';
import SetupStepTransition, { type SetupStep } from './SetupStepTransition';

interface TrainingSetupDialogProps {
  initialContent: boolean;
  step: SetupStep | null;
  loadingText: string;
  onDeclineConsent: () => void;
  onDeclineConsentIntent?: () => void;
  onConfirmConsent: () => void;
  onDeclineCamera: () => void;
  onConfirmCamera: () => void;
}

export default function TrainingSetupDialog({
  initialContent,
  step,
  loadingText,
  onDeclineConsent,
  onDeclineConsentIntent,
  onConfirmConsent,
  onDeclineCamera,
  onConfirmCamera,
}: TrainingSetupDialogProps) {
  const decline = { consent: onDeclineConsent, camera: onDeclineCamera, loading: undefined };

  return (
    <Dialog
      initialContent={initialContent}
      isOpen={step !== null}
      labelledBy={`${step}-modal-title`}
      describedBy={`${step}-modal-desc`}
      onClose={step ? decline[step] : undefined}
    >
      <ModalContent className="max-w-xl">
        {step && (
          <SetupStepTransition step={step}>
            {step === 'consent' && (
              <ConsentStep
                onDecline={onDeclineConsent}
                onDeclineIntent={onDeclineConsentIntent}
                onConfirm={onConfirmConsent}
              />
            )}
            {step === 'loading' && <LoadingStep loadingText={loadingText} />}
            {step === 'camera' && (
              <CameraStep onDecline={onDeclineCamera} onConfirm={onConfirmCamera} />
            )}
          </SetupStepTransition>
        )}
      </ModalContent>
    </Dialog>
  );
}
