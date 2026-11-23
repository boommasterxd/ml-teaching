'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import TrainingError from '../components/TrainingError';
import TrainingSetupDialog from '../components/modals/TrainingSetupDialog';
import type { SetupStep } from '../components/modals/SetupStepTransition';
import { useTrainingSession } from '@/components/training/TrainingEntryContext';
import {
  getPreparedTrainingWorkspace,
  loadTrainingWorkspace,
} from '@/components/training/training-workspace-loader';
import { useMenuModule } from '@/components/use-menu-module';
import { useEntryViewportReady, useInitialEntry } from '@/components/ui/entry-policy';
import { prepareRoute } from '@/components/prepare-route';
import { learningPaths } from '@/lib/learning-paths';
import { toast } from '@/lib/toast';
import { createInitialTrainingClasses } from '@/lib/training-class-defaults';
import type { AppError } from '@/types/errors';
import CameraPreview from '@/components/CameraPreview';
import type { CameraView } from '@/components/CameraControls';
import TrainingClassFrame, {
  ClassManagementActions,
  trainingGalleryLabel,
} from '@/components/TrainingClassFrame';
import TrainingCollectionFrame, {
  CollectionActionsFrame,
  CollectionContinue,
  TrainingWorkspaceHeader,
  collectionGridClass,
} from '@/components/TrainingCollectionFrame';
import TrainingGalleryFrame from '@/components/TrainingGalleryFrame';
import './training-workspace.css';

const initialClasses = createInitialTrainingClasses();
const ignoreCameraAction = () => {};
const inactiveCamera: CameraView = {
  stream: null,
  facingMode: 'user',
  active: false,
  pending: false,
  failed: false,
  onToggle: ignoreCameraAction,
  onSwitch: ignoreCameraAction,
};
const unattachedVideo = { current: null };

function InitialTrainingWorkspace({ notice }: { notice?: ReactNode }) {
  return (
    <>
      <TrainingWorkspaceHeader
        currentStep="images"
        ready={false}
        canTrain={false}
        canPredict={false}
      />
      {notice}
      <div className="training-panels" data-training-panel="images" inert>
        <TrainingCollectionFrame
          canContinue={false}
          actions={
            <CollectionActionsFrame>
              <div className="invisible shrink-0" inert>
                <CollectionContinue canContinue={false} placement="bottom" />
              </div>
            </CollectionActionsFrame>
          }
        >
          <div className={`mt-4 sm:mt-5 ${collectionGridClass}`} data-entry-admission="static">
            {initialClasses.map((cls, index) => (
              <TrainingClassFrame key={cls.id} cls={cls} position={index + 1}>
                <CameraPreview
                  camera={inactiveCamera}
                  disabled
                  isRecording={false}
                  onStartRecording={ignoreCameraAction}
                  onStopRecording={ignoreCameraAction}
                  onFileUpload={ignoreCameraAction}
                  videoRef={unattachedVideo}
                  fileActions={<ClassManagementActions cls={cls} position={index + 1} />}
                />
                <TrainingGalleryFrame
                  color={cls.color}
                  label={trainingGalleryLabel(cls, index + 1)}
                />
              </TrainingClassFrame>
            ))}
          </div>
        </TrainingCollectionFrame>
      </div>
    </>
  );
}

function getSetupStep(
  engine: ReturnType<typeof useTrainingSession>['engine'],
  workspaceReady: boolean,
) {
  const { consent, models, resourceLoadFailed, canUseModels } = engine;
  if (consent.showConsentModal) return 'consent';
  if (resourceLoadFailed) return 'error';
  if (models.isModelLoading) return 'loading';
  if (consent.showCameraModal && canUseModels) return 'camera';
  return canUseModels && !workspaceReady ? 'workspace' : null;
}

function useSetupPresentation(step: SetupStep | null, canShow: boolean) {
  const requested = canShow ? step : null;
  const [lastStep, setLastStep] = useState(requested);
  const [initialSetup, setInitialSetup] = useState(step === 'consent');
  const [focusRequests, requestFocus] = useState(0);
  if (requested && requested !== lastStep) setLastStep(requested);
  if (!canShow && lastStep !== null) {
    setLastStep(null);
    setInitialSetup(false);
  }

  function onExited() {
    if (requested !== null || lastStep === null) return;
    if (lastStep === 'camera' || lastStep === 'loading' || lastStep === 'workspace')
      requestFocus((previous) => previous + 1);
    setLastStep(null);
    setInitialSetup(false);
  }

  return {
    focusRequests,
    initialSetup,
    step: canShow ? (requested ?? lastStep) : null,
    open: requested !== null,
    onExited,
    restoreFocus: true,
  };
}

function useCameraErrorNotice(error: AppError | null, canNotify: boolean) {
  useEffect(() => {
    if (canNotify && error?.category === 'camera') {
      toast.error(`${error.message} Du kannst Bilder hochladen.`, { id: 'training-camera' });
    }
  }, [canNotify, error]);
}

function TrainingVisit({ initialWorkspace }: { initialWorkspace: boolean }) {
  const router = useRouter();
  const {
    engine,
    pendingArrival,
    revokeConsent,
    grantConsent,
    setupSuppressed,
    prepareWithdrawal,
  } = useTrainingSession();
  const { error, consent, models } = engine;
  const initialDocument = useInitialEntry();
  const entryViewportReady = useEntryViewportReady();
  const workspace = useMenuModule(loadTrainingWorkspace, getPreparedTrainingWorkspace());
  const { prepare, module: workspaceModule } = workspace;
  useEffect(() => {
    if (consent.hasConsented) prepare();
  }, [consent.hasConsented, prepare]);

  const Workspace = consent.hasConsented ? workspaceModule?.default : undefined;
  const setupStep = getSetupStep(engine, Boolean(Workspace));
  const { initialSetup, focusRequests, ...setup } = useSetupPresentation(
    setupStep,
    !setupSuppressed && (initialDocument || entryViewportReady),
  );
  const blocked = setupStep !== null || setup.step !== null;
  const ready = !blocked && !initialSetup && engine.canUseModels && entryViewportReady;
  useCameraErrorNotice(error, entryViewportReady && setup.step === null);
  const prepareReturn = () => prepareRoute(router, learningPaths.images);
  const declineConsent = () => router.push(learningPaths.images, { transitionTypes: ['nav-back'] });
  const prepareConsent = () => {
    prepare();
    engine.prepareResources();
  };
  const notice = error?.category === 'model' && setup.step === null && (
    <TrainingError
      message={error.message}
      onReturn={declineConsent}
      onReturnIntent={prepareReturn}
    />
  );

  return (
    <div className="bg-background text-foreground pb-10 sm:pb-16">
      <div className="training-workspace" inert={blocked}>
        {Workspace ? (
          <Workspace
            ready={ready}
            focusRequest={focusRequests + Number(pendingArrival)}
            notice={notice}
          />
        ) : (
          <InitialTrainingWorkspace notice={notice} />
        )}
      </div>
      <TrainingSetupDialog
        initialContent={initialDocument && initialWorkspace && initialSetup}
        {...setup}
        loadingText={models.loadingText}
        onDeclineConsent={declineConsent}
        declineConsentHref={learningPaths.images}
        onConfirmConsentIntent={prepareConsent}
        onConfirmConsent={grantConsent}
        onWithdrawLoading={revokeConsent}
        onWithdrawIntent={prepareWithdrawal}
        onDeclineCamera={consent.declineCameraConsent}
        onConfirmCamera={consent.grantCameraConsent}
        onRetryModel={engine.retryModels}
        workspaceFailed={workspace.failed}
        onRetryWorkspace={prepare}
      />
    </div>
  );
}

/** Keep the build-rendered setup in place while a visit loads its workspace. */
export default function TrainingPage() {
  const { workspaceVersion } = useTrainingSession();
  return <TrainingVisit key={workspaceVersion} initialWorkspace={workspaceVersion === 0} />;
}
