'use client';

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { learningPaths } from '@/lib/learning-paths';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
  writeRememberedTrainingConsent,
  type RememberedTrainingConsent,
} from '@/lib/training-consent-storage';
import { useTrainingEngine, type TrainingEngine } from '@/hooks/useTrainingEngine';
import { toast } from '@/lib/toast';
import { prepareToastViewport } from '../toast-loader';
import { useDeferredModule } from '@/hooks/use-deferred-module';
import type { SetupStep } from '../modals/SetupStepTransition';
import TrainingConsentControls from './TrainingConsentControls';
import {
  TrainingEntryContext,
  TrainingSessionContext,
  type TrainingEntryOptions,
} from './TrainingEntryContext';
import { useTrainingWithdrawal } from './use-training-withdrawal';
import TrainingWithdrawalFeedback from './TrainingWithdrawalFeedback';
import { getPreparedTrainingWorkspace, loadTrainingWorkspace } from './training-workspace-loader';

type Entry = {
  source: string;
  trigger: HTMLElement | null;
  opener: HTMLElement | null;
  onReady?: () => void;
  phase: 'setup' | 'cancelled' | 'moving';
};

function loadSetup() {
  return import('../modals/TrainingSetupDialog');
}

function getStep(engine: TrainingEngine, workspaceReady: boolean): SetupStep {
  if (!engine.consent.hasConsented) return 'consent';
  if (engine.resourceLoadFailed || engine.error?.category === 'model') return 'error';
  if (finishAllowed(engine) && !workspaceReady) return 'workspace';
  if (!engine.canUseModels || engine.consent.restored) return 'loading';
  return 'camera';
}

function finishAllowed(engine: TrainingEngine) {
  return (
    engine.canUseModels &&
    !engine.consent.showCameraModal &&
    (!engine.consent.cameraConsent || engine.camera.stream !== null)
  );
}

function acceptTrainingConsent(
  remember: boolean,
  grant: TrainingEngine['consent']['grantConsent'],
  setRemembered: (record: RememberedTrainingConsent | null) => void,
) {
  prepareToastViewport();
  grant(remember);
  if (remember) setRemembered(readRememberedTrainingConsent());
}

function useRememberedConsent(
  pathname: string | null,
  restore: ((record: RememberedTrainingConsent) => void) | undefined,
) {
  const [remembered, setRemembered] = useState<RememberedTrainingConsent | null>(null);
  const rememberedUntil = remembered?.expiresAt ?? null;

  useLayoutEffect(() => {
    const saved = readRememberedTrainingConsent();
    if (saved) restore?.(saved);
    // Same-document navigation can adopt consent before paint.
    let current = true;
    queueMicrotask(() => {
      if (current) setRemembered(saved);
    });
    return () => {
      current = false;
    };
  }, [pathname, restore]);

  useEffect(() => {
    if (rememberedUntil === null) return;
    const expiry = window.setTimeout(
      () => {
        setRemembered(readRememberedTrainingConsent());
      },
      Math.max(0, rememberedUntil - Date.now()),
    );
    return () => window.clearTimeout(expiry);
  }, [rememberedUntil]);

  return { remembered, setRemembered };
}

function useTrainingEntryState() {
  const router = useRouter();
  const pathname = usePathname();
  const inTraining = pathname === learningPaths.imagePractice;
  const setup = useDeferredModule(loadSetup);
  const workspace = useDeferredModule(loadTrainingWorkspace, getPreparedTrainingWorkspace());
  const { module, prepare } = setup;
  const { prepare: prepareWorkspace } = workspace;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [visit, setVisit] = useState<{
    pathname: string | null;
    handoff: boolean;
  }>({
    pathname,
    handoff: false,
  });
  const activeEntry = entry?.source === pathname ? entry : null;
  const { engine, ResourceHost, resourceProps } = useTrainingEngine(
    inTraining || Boolean(activeEntry && activeEntry.phase !== 'cancelled' && module),
    inTraining,
  );
  const { consent, clearError, prepareResources } = engine;
  const { reset, cancel, restore } = consent;

  if (visit.pathname !== pathname) {
    const handoff = inTraining && entry?.phase === 'moving';
    setVisit({ pathname, handoff });
    setEntry(null);
    if (!handoff) {
      reset();
      clearError();
    }
  }

  const { remembered, setRemembered } = useRememberedConsent(
    pathname,
    inTraining && !visit.handoff ? restore : undefined,
  );

  const prepareEntry = useCallback(() => {
    prepare();
    prepareResources();
    prepareWorkspace();
  }, [prepare, prepareResources, prepareWorkspace]);
  const openEntry = useCallback(
    (trigger: HTMLElement | null, options?: TrainingEntryOptions) => {
      if (!pathname || inTraining || activeEntry) return;
      const saved = readRememberedTrainingConsent();
      if (saved) restore(saved);
      setEntry({
        source: pathname,
        trigger,
        opener: options ? options.opener : trigger,
        onReady: options?.onReady,
        phase: 'setup',
      });
      prepareEntry();
    },
    [pathname, inTraining, activeEntry, prepareEntry, restore],
  );
  const pendingTrigger =
    activeEntry?.phase === 'setup' && !module && !setup.failed ? activeEntry.trigger : null;
  const cancelPendingEntry = useCallback(() => {
    if (!pendingTrigger) return;
    setEntry(null);
    cancel();
    clearError();
  }, [pendingTrigger, cancel, clearError]);
  const actions = useMemo(
    () => ({ openEntry, prepareEntry, pendingTrigger, cancelPendingEntry }),
    [openEntry, prepareEntry, pendingTrigger, cancelPendingEntry],
  );
  const withdrawal = useTrainingWithdrawal(pathname, inTraining);

  function closeEntry() {
    if (!activeEntry) return;
    if (module) setEntry({ ...activeEntry, phase: 'cancelled' });
    else {
      setEntry(null);
      activeEntry.trigger?.focus({ preventScroll: true });
    }
    cancel();
    clearError();
  }

  return {
    router,
    inTraining,
    setup,
    workspace,
    engine,
    ResourceHost,
    resourceProps,
    visit,
    clearHandoff: () => setVisit((current) => ({ ...current, handoff: false })),
    activeEntry,
    setEntry,
    actions,
    withdrawal,
    remembered,
    setRemembered,
    closeEntry,
  };
}

function useTrainingEntryFlow() {
  const {
    router,
    inTraining,
    setup,
    workspace,
    engine,
    ResourceHost,
    resourceProps,
    visit,
    clearHandoff,
    activeEntry,
    setEntry,
    actions,
    withdrawal,
    remembered,
    setRemembered,
    closeEntry,
  } = useTrainingEntryState();
  const { module, failed } = setup;
  const { consent, clearError } = engine;
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const complete =
    activeEntry?.phase === 'setup' && Boolean(module && workspace.module) && finishAllowed(engine);

  const resetForPageHide = useEffectEvent(() => {
    clearRememberedTrainingConsent();
    if (!remembered && !consent.hasConsented && !activeEntry) return;
    // A cached document can return with the same React tree. Clear it before the freeze.
    flushSync(() => {
      consent.cancel();
      clearError();
      setRemembered(null);
      setEntry(null);
      clearHandoff();
      setWorkspaceVersion((version) => version + 1);
    });
  });

  useEffect(() => {
    const handlePageHide = () => resetForPageHide();
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  function clearTrainingConsent() {
    clearRememberedTrainingConsent();
    setRemembered(null);
    if (activeEntry) closeEntry();
    else {
      consent.cancel();
      clearError();
      if (inTraining) clearHandoff();
    }
  }

  function revokeConsent(waitForSettings = false) {
    clearTrainingConsent();
    if (inTraining) setWorkspaceVersion((version) => version + 1);
    withdrawal.begin(
      waitForSettings || Boolean(activeEntry && module),
      activeEntry?.opener ?? null,
    );
  }

  function finishClose() {
    if (!activeEntry || window.location.pathname !== activeEntry.source) return;
    if (activeEntry.phase === 'cancelled') {
      setEntry(null);
      if (withdrawal.active) withdrawal.showAfterExit();
      else activeEntry.opener?.focus({ preventScroll: true });
    } else if (complete) {
      setEntry({ ...activeEntry, phase: 'moving' });
      router.push(learningPaths.imagePractice, { transitionTypes: ['nav-forward'] });
    }
  }

  return {
    actions,
    engine,
    ResourceHost,
    resourceProps,
    pendingArrival: visit.handoff,
    workspaceVersion,
    revokeConsent,
    clearTrainingConsent,
    withdrawal,
    grantConsent: (remember: boolean) =>
      acceptTrainingConsent(remember, consent.grantConsent, setRemembered),
    inTraining,
    activeEntry,
    complete,
    workspace,
    Setup: module?.default,
    failed,
    remembered,
    setRemembered,
    closeEntry,
    finishClose,
  };
}

export default function TrainingEntryProvider({ children }: { children: ReactNode }) {
  const flow = useTrainingEntryFlow();
  const { actions, engine, pendingArrival, workspaceVersion, revokeConsent, grantConsent } = flow;
  const { inTraining, activeEntry, remembered, setRemembered, withdrawal } = flow;
  const { ResourceHost, resourceProps } = flow;
  const { consent } = engine;
  function revokeCamera() {
    if (inTraining) engine.revokeCamera();
    else if (remembered?.camera === 'allowed')
      writeRememberedTrainingConsent(remembered.expiresAt, 'declined', true);
    setRemembered(readRememberedTrainingConsent());
  }
  return (
    <TrainingEntryContext value={actions}>
      <TrainingSessionContext
        value={{
          engine,
          pendingArrival,
          workspaceVersion,
          revokeConsent: () => revokeConsent(),
          clearTrainingConsent: flow.clearTrainingConsent,
          prepareWithdrawal: withdrawal.prepare,
          setupSuppressed: Boolean(withdrawal.active),
          grantConsent,
        }}
      >
        {children}
      </TrainingSessionContext>
      {ResourceHost && <ResourceHost {...resourceProps} />}
      <TrainingEntryOverlay flow={flow} />
      <TrainingConsentControls
        visible={Boolean(remembered || (inTraining && consent.hasConsented))}
        blocked={
          Boolean(activeEntry || withdrawal.active) || (inTraining && consent.showConsentModal)
        }
        canRevokeCamera={
          inTraining
            ? consent.cameraConsent || consent.restored?.camera === 'allowed'
            : remembered?.camera === 'allowed'
        }
        onRevokeCamera={revokeCamera}
        onRevokeConsent={() => revokeConsent(true)}
        onRevokeIntent={withdrawal.prepare}
        onExited={withdrawal.showAfterExit}
      />
      <TrainingWithdrawalFeedback
        withdrawal={withdrawal}
        resourcesReleased={!engine.models.mobilenetModel && !engine.models.classifier}
      />
    </TrainingEntryContext>
  );
}

function TrainingEntryOverlay({ flow }: { flow: ReturnType<typeof useTrainingEntryFlow> }) {
  const { activeEntry, Setup, complete, failed, engine, workspace } = flow;
  const { consent } = engine;
  const [lastStep, setLastStep] = useState<SetupStep>('consent');
  const open = activeEntry?.phase === 'setup' && !complete;
  const step = open ? getStep(engine, Boolean(workspace.module)) : lastStep;
  const loading = open && !Setup && !failed;
  const onReady = activeEntry?.onReady;
  const cancel = useEffectEvent(flow.closeEntry);
  useLayoutEffect(() => {
    if (open && Setup) onReady?.();
  }, [open, Setup, onReady]);
  useEffect(() => {
    if (!open || Setup || !failed) return;
    cancel();
    toast.error('Die Einrichtung konnte nicht geladen werden. Versuche es erneut.');
  }, [open, Setup, failed]);
  useLayoutEffect(() => {
    if (!loading) return;
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      cancel();
    };
    document.addEventListener('keydown', dismissOnEscape);
    return () => document.removeEventListener('keydown', dismissOnEscape);
  }, [loading]);
  if (open && step !== lastStep) setLastStep(step);
  if (!activeEntry) return null;
  if (Setup) {
    return (
      <Setup
        initialContent={false}
        step={step}
        open={open}
        onExited={flow.finishClose}
        loadingText={engine.models.loadingText}
        onWithdrawConsent={() => flow.revokeConsent()}
        onWithdrawIntent={flow.withdrawal.prepare}
        onDeclineConsent={(withdraw) => {
          if (withdraw) flow.clearTrainingConsent();
          else flow.closeEntry();
        }}
        onConfirmConsentIntent={engine.prepareResources}
        onConfirmConsent={flow.grantConsent}
        onDeclineCamera={consent.declineCameraConsent}
        onConfirmCamera={consent.grantCameraConsent}
        cameraPending={engine.camera.isPending}
        cameraError={engine.error?.category === 'camera' ? engine.error.message : undefined}
        onRetryCamera={engine.camera.retryCamera}
        onRetryModel={engine.retryModels}
        workspaceFailed={workspace.failed}
        onRetryWorkspace={workspace.prepare}
      />
    );
  }
  return (
    <span role="status" className="sr-only">
      {loading ? 'Einrichtung wird geladen …' : ''}
    </span>
  );
}
