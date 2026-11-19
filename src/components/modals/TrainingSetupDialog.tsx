'use client';

import { useState } from 'react';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import CameraStep from './CameraStep';
import ConsentStep from './ConsentStep';
import LoadingStep from './LoadingStep';
import SetupStepTransition, { type SetupStep } from './SetupStepTransition';

interface TrainingSetupDialogProps {
  step: SetupStep | null;
  loadingText: string;
  onDeclineConsent: () => void;
  onDeclineConsentIntent?: () => void;
  onConfirmConsent: () => void;
  onDeclineCamera: () => void;
  onConfirmCamera: () => void;
}

export default function TrainingSetupDialog({
  step,
  loadingText,
  onDeclineConsent,
  onDeclineConsentIntent,
  onConfirmConsent,
  onDeclineCamera,
  onConfirmCamera,
}: TrainingSetupDialogProps) {
  // Keep the server-rendered dialog inline until the entire setup sequence closes.
  // A later camera request opens through the usual product dialog portal.
  const [initialSequence, setInitialSequence] = useState(step === 'consent');
  if (initialSequence && step === null) setInitialSequence(false);
  const decline = { consent: onDeclineConsent, camera: onDeclineCamera, loading: undefined };

  return (
    <Dialog
      initialContent={initialSequence}
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
