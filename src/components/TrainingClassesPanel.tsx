import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Fade } from '@animate-ui/react/primitives/effects/fade';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import ClassCard from './ClassCard';
import type { ClassCardActions } from './ClassCard';
import type { CameraView } from './CameraControls';
import type { PendingTrainingDialog } from './DeferredTrainingDialogs';
import { Empty, EmptyDescription, EmptyHeader } from './ui/empty';
import { AnimatedList, AnimatedListItem } from './ui/animated-list';
import { EntryReveal } from './ui/entry-reveal';
import { useMotionPreference } from './ui/use-motion-preference';
import { cn } from '@/lib/utils';
import type { TrainingClassNames } from '@/lib/training-class-names';
import TrainingCollectionFrame, {
  CollectionActionsFrame,
  CollectionContinue,
  collectionGridClass,
} from './TrainingCollectionFrame';

/**
 * Props for the TrainingClassesPanel component.
 */
interface TrainingClassesPanelProps {
  entryReady?: boolean;
  /** List of ML classes to display. */
  classes: MLClass[];
  nameControl: Control<TrainingClassNames>;
  validateNames: () => void;
  camera: CameraView;
  /** Ref to the main heading element for programmatic focus management. */
  mainHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  /** Callbacks for all actions a ClassCard can trigger (rename, delete, add image, etc.). */
  cardActions: ClassCardActions;
  pendingDialog?: PendingTrainingDialog;
  /** Called when the user clicks the "Add class" button. */
  onAddClass: () => void;
  onContinue: () => void;
  onContinueIntent: () => void;
  canContinue: boolean;
}

type CollectionContinueProps = Pick<
  TrainingClassesPanelProps,
  'canContinue' | 'onContinue' | 'onContinueIntent'
>;

function observeScrolledPast(button: HTMLButtonElement, onChange: (scrolledPast: boolean) => void) {
  const header = document.querySelector('.site-header-inner');
  let observer: IntersectionObserver | undefined;
  function observe() {
    const cutoff = header?.getBoundingClientRect().bottom ?? 0;
    observer?.disconnect();
    observer = new IntersectionObserver(
      ([entry]) => onChange(!entry.isIntersecting && entry.boundingClientRect.bottom <= cutoff),
      { rootMargin: `${-cutoff}px 0px 0px` },
    );
    observer.observe(button);
  }

  const resize = new ResizeObserver(observe);
  if (header) resize.observe(header);
  else observe();
  return () => {
    resize.disconnect();
    observer?.disconnect();
  };
}

function CollectionActions({
  classes,
  onAddClass,
  continueRef,
  canContinue,
  onContinue,
  onContinueIntent,
}: Pick<TrainingClassesPanelProps, 'classes' | 'onAddClass'> &
  CollectionContinueProps & { continueRef: React.RefObject<HTMLButtonElement | null> }) {
  const pendingNamePosition = useRef<number | null>(null);
  const bottomActionRef = useRef<HTMLDivElement>(null);
  const [visibility, setVisibility] = useState<'unobserved' | 'hidden' | 'visible'>('unobserved');
  const showContinue = visibility === 'visible';
  const fade = useTempoTransition(motionTokens.transition.fade);
  const { reduce } = useMotionPreference();
  const atLimit = classes.length >= ML.MAX_CLASSES;

  useLayoutEffect(() => {
    const position = pendingNamePosition.current;
    const added = position === null ? undefined : classes[position];
    if (!added) return;
    pendingNamePosition.current = null;
    document.getElementById(`class-name-${added.id}`)?.focus({ preventScroll: true });
  }, [classes]);

  useEffect(() => {
    const button = continueRef.current;
    if (!button) return;
    return observeScrolledPast(button, (scrolledPast) => {
      if (!scrolledPast && bottomActionRef.current?.contains(document.activeElement)) {
        button.focus({ preventScroll: true });
      }
      setVisibility(scrolledPast ? 'visible' : 'hidden');
    });
  }, [continueRef]);

  return (
    <CollectionActionsFrame
      atLimit={atLimit}
      onAdd={(event) => {
        if (event.detail === 0) pendingNamePosition.current = classes.length;
        onAddClass();
      }}
    >
      <Fade
        ref={bottomActionRef}
        className={cn('shrink-0 focus-within:opacity-100!', !showContinue && 'invisible')}
        inert={!showContinue}
        aria-hidden={!showContinue || undefined}
        initial={false}
        animate={visibility === 'unobserved' ? false : visibility}
        transition={showContinue && !reduce ? fade : { duration: 0 }}
      >
        <CollectionContinue
          canContinue={canContinue}
          onContinue={onContinue}
          onContinueIntent={onContinueIntent}
          placement="bottom"
        />
      </Fade>
    </CollectionActionsFrame>
  );
}

export default function TrainingClassesPanel({
  classes,
  nameControl,
  validateNames,
  camera,
  mainHeadingRef,
  cardActions,
  pendingDialog,
  entryReady = true,
  onAddClass,
  onContinue,
  onContinueIntent,
  canContinue,
}: TrainingClassesPanelProps) {
  const continueRef = useRef<HTMLButtonElement>(null);
  return (
    <TrainingCollectionFrame
      mainHeadingRef={mainHeadingRef}
      continueRef={continueRef}
      onContinue={onContinue}
      onContinueIntent={onContinueIntent}
      canContinue={canContinue}
      actions={
        <CollectionActions
          classes={classes}
          onAddClass={onAddClass}
          continueRef={continueRef}
          onContinue={onContinue}
          onContinueIntent={onContinueIntent}
          canContinue={canContinue}
        />
      }
    >
      <EntryReveal kind="text" className="mt-4 sm:mt-5" active={entryReady}>
        <AnimatedList className={collectionGridClass}>
          {classes.length === 0 ? (
            <Empty key="empty" className="col-span-full">
              <EmptyHeader>
                <EmptyDescription>
                  Keine Klassen vorhanden. Füge Klassen hinzu, um zu starten.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            classes.map((cls: MLClass, index) => (
              <AnimatedListItem key={cls.id} emptyFocus={mainHeadingRef}>
                <ClassCard
                  cls={cls}
                  position={index + 1}
                  nameControl={nameControl}
                  validateNames={validateNames}
                  camera={camera}
                  actions={cardActions}
                  pendingDialog={pendingDialog?.classId === cls.id ? pendingDialog : undefined}
                />
              </AnimatedListItem>
            ))
          )}
        </AnimatedList>
      </EntryReveal>
    </TrainingCollectionFrame>
  );
}
