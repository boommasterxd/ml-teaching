import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Fade } from '@animate-ui/react/primitives/effects/fade';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';
import { ArrowRight } from './icons/arrow-right';
import { Plus } from './icons/plus';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import ClassCard from './ClassCard';
import type { ClassCardActions } from './ClassCard';
import type { CameraView } from './CameraControls';
import Button from './Button';
import { Empty, EmptyDescription, EmptyHeader } from './ui/empty';
import { AnimatedList, AnimatedListItem } from './ui/animated-list';
import { Heading, Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';
import { useMotionPreference } from './ui/use-motion-preference';
import { cn } from '@/lib/utils';

/**
 * Props for the TrainingClassesPanel component.
 */
interface TrainingClassesPanelProps {
  entryReady?: boolean;
  /** List of ML classes to display. */
  classes: MLClass[];
  /** Set of class names that appear more than once (used to show duplicate warnings). */
  duplicateClassNames: Set<string>;
  camera: CameraView;
  /** Ref to the main heading element for programmatic focus management. */
  mainHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  /** Callbacks for all actions a ClassCard can trigger (rename, delete, add image, etc.). */
  cardActions: ClassCardActions;
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

function CollectionContinue({
  canContinue,
  onContinue,
  onContinueIntent,
  placement,
  buttonRef,
}: CollectionContinueProps & {
  placement: 'top' | 'bottom';
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const top = placement === 'top';
  return (
    <Button
      ref={buttonRef}
      variant={canContinue ? 'default' : 'outline'}
      size={top ? 'sm' : 'lg'}
      className={cn(
        'min-h-11 shrink-0 disabled:border-border disabled:text-muted-foreground disabled:opacity-100',
        top
          ? 'px-2.5 has-[>svg]:px-2.5 sm:px-4 sm:has-[>svg]:px-4'
          : 'max-sm:border-0 max-sm:bg-transparent max-sm:px-3 max-sm:text-primary max-sm:shadow-none max-sm:hover:bg-primary/10 max-sm:disabled:text-muted-foreground',
      )}
      disabled={!canContinue}
      aria-label="Weiter zum Training"
      onClick={onContinue}
      onPointerEnter={onContinueIntent}
      onFocus={onContinueIntent}
      onPointerDown={onContinueIntent}
    >
      <span className="sm:hidden">Weiter</span>
      <span className="hidden sm:inline">Weiter zum Training</span>
      <ArrowRight data-icon="inline-end" aria-hidden="true" />
    </Button>
  );
}

function CollectionHeader({
  mainHeadingRef,
  continueRef,
  canContinue,
  onContinue,
  onContinueIntent,
}: Pick<TrainingClassesPanelProps, 'mainHeadingRef'> &
  CollectionContinueProps & { continueRef: React.RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
      <Heading
        as="h2"
        id="training-images"
        ref={mainHeadingRef}
        tabIndex={-1}
        className="scroll-mt-28 border-0 pb-0 text-lg leading-tight font-semibold min-[23rem]:text-xl sm:text-3xl"
      >
        Bilder sammeln
      </Heading>
      <CollectionContinue
        buttonRef={continueRef}
        canContinue={canContinue}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
        placement="top"
      />
    </div>
  );
}

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
  const addLabel = atLimit
    ? `Klasse hinzufügen deaktiviert, maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht`
    : 'Neue Klasse hinzufügen';

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
    <div className="mt-5 flex items-center justify-between gap-2 sm:gap-3">
      <Button
        variant="secondary"
        size="lg"
        className="min-h-11 max-sm:min-w-0 max-sm:flex-1 max-sm:px-3"
        disabled={atLimit}
        title={addLabel}
        aria-label={addLabel}
        onClick={(event) => {
          if (event.detail === 0) pendingNamePosition.current = classes.length;
          onAddClass();
        }}
      >
        <Plus data-icon="inline-start" aria-hidden="true" />
        Neue Klasse
      </Button>
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
    </div>
  );
}

export default function TrainingClassesPanel({
  classes,
  duplicateClassNames,
  camera,
  mainHeadingRef,
  cardActions,
  entryReady = true,
  onAddClass,
  onContinue,
  onContinueIntent,
  canContinue,
}: TrainingClassesPanelProps) {
  const continueRef = useRef<HTMLButtonElement>(null);
  return (
    <section aria-labelledby="training-images" className="flex min-w-0 flex-col">
      <CollectionHeader
        mainHeadingRef={mainHeadingRef}
        continueRef={continueRef}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
        canContinue={canContinue}
      />
      {/* Keep the mobile hint below the classes and out of scroll anchoring. */}
      <Text
        variant="muted"
        className={cn(
          'mt-3 max-w-prose text-pretty max-sm:order-last max-sm:[overflow-anchor:none]',
          canContinue && 'invisible',
        )}
      >
        Mindestens {ML.MIN_CLASSES} Klassen, eindeutige Namen und je {ML.MIN_IMAGES_PER_CLASS}{' '}
        Bilder.
      </Text>
      <EntryReveal kind="text" className="mt-4 sm:mt-5" active={entryReady}>
        <AnimatedList className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                  isDuplicate={duplicateClassNames.has(cls.name.trim())}
                  camera={camera}
                  actions={cardActions}
                />
              </AnimatedListItem>
            ))
          )}
        </AnimatedList>
      </EntryReveal>
      <CollectionActions
        classes={classes}
        continueRef={continueRef}
        onAddClass={onAddClass}
        canContinue={canContinue}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
      />
    </section>
  );
}
