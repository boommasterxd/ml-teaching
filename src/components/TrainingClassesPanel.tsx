/**
 * TrainingClassesPanel.tsx
 *
 * Collection section of the training page. Renders the class list header
 * (count label, reset and add buttons) and the grid of ClassCard components.
 * All state and callbacks are passed in from TrainingPage.
 */
import type React from 'react';
import { Plus } from './icons/plus';
import { RotateCcw } from './icons/rotate-ccw';
import { Camera } from './icons/camera';
import { SwitchCamera } from './icons/switch-camera';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import ClassCard from './ClassCard';
import type { ClassCardActions } from './ClassCard';
import Button from './Button';
import { prepareTrainingDialogs } from './DeferredTrainingDialogs';
import { Badge } from './ui/badge';
import { Empty, EmptyDescription, EmptyHeader } from './ui/empty';
import { AnimatedList, AnimatedListItem } from './ui/animated-list';
import { Heading } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';

/**
 * Props for the TrainingClassesPanel component.
 */
interface TrainingClassesPanelProps {
  entryReady?: boolean;
  /** List of ML classes to display. */
  classes: MLClass[];
  /** Set of class names that appear more than once (used to show duplicate warnings). */
  duplicateClassNames: Set<string>;
  /** Active camera stream passed down to each ClassCard for live capture. */
  stream: MediaStream | null;
  /** Camera facing mode: front-facing ('user') or rear-facing ('environment'). */
  facingMode: 'user' | 'environment';
  cameraActionLabel: 'Kamera aktivieren' | 'Kamera wechseln';
  onCameraAction: () => void;
  /** Ref to the main heading element for programmatic focus management. */
  mainHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  /** Callbacks for all actions a ClassCard can trigger (rename, delete, add image, etc.). */
  cardActions: ClassCardActions;
  /** Called when the user clicks the "Add class" button. */
  onAddClass: () => void;
  /** Called when the user clicks the "Reset all" button to open the confirmation modal. */
  onShowClearConfirm: () => void;
}

function CollectionHeader({
  count,
  mainHeadingRef,
  onAddClass,
  onShowClearConfirm,
  cameraActionLabel,
  onCameraAction,
}: Pick<
  TrainingClassesPanelProps,
  'mainHeadingRef' | 'onAddClass' | 'onShowClearConfirm' | 'cameraActionLabel' | 'onCameraAction'
> & { count: number }) {
  const atLimit = count >= ML.MAX_CLASSES;
  const addLabel = atLimit
    ? `Klasse hinzufügen deaktiviert, maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht`
    : 'Neue Klasse hinzufügen';
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
      <div className="flex flex-wrap items-center gap-x-3">
        <Heading
          as="h2"
          id="training-images"
          ref={mainHeadingRef}
          tabIndex={-1}
          className="scroll-mt-28 border-0 pb-0 text-2xl font-semibold sm:text-3xl"
        >
          Bilder sammeln
        </Heading>
        <Badge variant="secondary" className="tabular-nums">
          {count} {count === 1 ? 'Klasse' : 'Klassen'}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          id="training-camera"
          variant="outline"
          aria-label={cameraActionLabel}
          onClick={onCameraAction}
        >
          {cameraActionLabel === 'Kamera wechseln' ? (
            <SwitchCamera data-icon="inline-start" aria-hidden="true" />
          ) : (
            <Camera data-icon="inline-start" aria-hidden="true" />
          )}
          <span className="sm:hidden">Kamera</span>
          <span className="hidden sm:inline">{cameraActionLabel}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-haspopup="dialog"
          onPointerEnter={prepareTrainingDialogs}
          onFocus={prepareTrainingDialogs}
          onPointerDown={prepareTrainingDialogs}
          onClick={onShowClearConfirm}
          title="Alles zurücksetzen"
          aria-label="Alle Klassen und Bilder zurücksetzen"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="default"
          onClick={onAddClass}
          disabled={atLimit}
          title={addLabel}
          aria-label={addLabel}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          <span className="sm:hidden">Neue Klasse</span>
          <span className="hidden sm:inline">Klasse hinzufügen</span>
        </Button>
      </div>
    </div>
  );
}

export default function TrainingClassesPanel({
  classes,
  duplicateClassNames,
  stream,
  facingMode,
  mainHeadingRef,
  cardActions,
  entryReady = true,
  ...headerActions
}: TrainingClassesPanelProps) {
  return (
    <section aria-labelledby="training-images" className="flex min-w-0 flex-col gap-5">
      <CollectionHeader {...headerActions} count={classes.length} mainHeadingRef={mainHeadingRef} />
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
                  stream={stream}
                  facingMode={facingMode}
                  actions={cardActions}
                />
              </AnimatedListItem>
            ))
          )}
        </AnimatedList>
      </EntryReveal>
    </section>
  );
}
