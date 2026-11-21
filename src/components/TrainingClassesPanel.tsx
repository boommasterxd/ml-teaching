import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { ArrowRight } from './icons/arrow-right';
import { Plus } from './icons/plus';
import { Camera } from './icons/camera';
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
  camera?: CameraView;
  onEnableCamera: () => void;
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
}: CollectionContinueProps & {
  placement: 'top' | 'bottom';
}) {
  const top = placement === 'top';
  return (
    <Button
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
  canContinue,
  onContinue,
  onContinueIntent,
}: Pick<TrainingClassesPanelProps, 'mainHeadingRef'> & CollectionContinueProps) {
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
        canContinue={canContinue}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
        placement="top"
      />
      {!canContinue && (
        <Text variant="muted" className="col-span-full max-w-prose text-pretty">
          Mindestens {ML.MIN_CLASSES} Klassen, eindeutige Namen und je {ML.MIN_IMAGES_PER_CLASS}{' '}
          Bilder.
        </Text>
      )}
    </div>
  );
}

function CollectionActions({
  classes,
  onAddClass,
  canContinue,
  onContinue,
  onContinueIntent,
}: Pick<TrainingClassesPanelProps, 'classes' | 'onAddClass'> & CollectionContinueProps) {
  const pending = useRef<{ position: number; focusName: boolean } | null>(null);
  const atLimit = classes.length >= ML.MAX_CLASSES;
  const addLabel = atLimit
    ? `Klasse hinzufügen deaktiviert, maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht`
    : 'Neue Klasse hinzufügen';

  useLayoutEffect(() => {
    const request = pending.current;
    const added = request && classes[request.position];
    if (!added) return;
    pending.current = null;
    const name = document.getElementById(`class-name-${added.id}`);
    name?.scrollIntoView?.({ block: 'center', behavior: 'instant' });
    if (request.focusName) name?.focus({ preventScroll: true });
  }, [classes]);

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <Button
        variant="secondary"
        size="lg"
        className="min-h-11 max-sm:min-w-0 max-sm:flex-1 max-sm:px-3"
        disabled={atLimit}
        title={addLabel}
        aria-label={addLabel}
        onClick={(event) => {
          pending.current = { position: classes.length, focusName: event.detail === 0 };
          onAddClass();
        }}
      >
        <Plus data-icon="inline-start" aria-hidden="true" />
        Neue Klasse
      </Button>
      <CollectionContinue
        canContinue={canContinue}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
        placement="bottom"
      />
    </div>
  );
}

export default function TrainingClassesPanel({
  classes,
  duplicateClassNames,
  camera,
  onEnableCamera,
  mainHeadingRef,
  cardActions,
  entryReady = true,
  onAddClass,
  onContinue,
  onContinueIntent,
  canContinue,
}: TrainingClassesPanelProps) {
  const cameraControl = !camera && (
    <Button variant="outline" className="min-h-11" onClick={onEnableCamera}>
      <Camera data-icon="inline-start" aria-hidden="true" />
      Kamera aktivieren
    </Button>
  );

  return (
    <section aria-labelledby="training-images" className="flex min-w-0 flex-col gap-5">
      <CollectionHeader
        mainHeadingRef={mainHeadingRef}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
        canContinue={canContinue}
      />
      <EntryReveal kind="text" active={entryReady} scrollOnly>
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
                  cameraFallback={index === 0 ? cameraControl : undefined}
                  actions={cardActions}
                />
              </AnimatedListItem>
            ))
          )}
        </AnimatedList>
      </EntryReveal>
      <CollectionActions
        classes={classes}
        onAddClass={onAddClass}
        canContinue={canContinue}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
      />
    </section>
  );
}
