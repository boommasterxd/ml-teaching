/**
 * TrainingClassesPanel.tsx
 *
 * Left-column panel of the training page. Renders the class list header
 * (count label, reset and add buttons) and the grid of ClassCard components.
 * All state and callbacks are passed in from TrainingPage.
 */
import type React from 'react';
import { Plus } from './icons/plus';
import { RotateCcw } from './icons/rotate-ccw';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import ClassCard from './ClassCard';
import type { ClassCardActions } from './ClassCard';
import Button from './Button';
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
  /** Ref to the main heading element for programmatic focus management. */
  mainHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  /** Callbacks for all actions a ClassCard can trigger (rename, delete, add image, etc.). */
  cardActions: ClassCardActions;
  /** Called when the user clicks the "Add class" button. */
  onAddClass: () => void;
  /** Called when the user clicks the "Reset all" button to open the confirmation modal. */
  onShowClearConfirm: () => void;
}

/**
 * Renders the classes panel: a header row with reset/add controls and a
 * scrollable list of ClassCard components. Displays an empty-state hint
 * when no classes have been added yet.
 */
export default function TrainingClassesPanel({
  classes,
  duplicateClassNames,
  stream,
  facingMode,
  mainHeadingRef,
  cardActions,
  onAddClass,
  onShowClearConfirm,
  entryReady = true,
}: TrainingClassesPanelProps) {
  return (
    <div className="lg:col-span-7 flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Heading as="h1" ref={mainHeadingRef} tabIndex={-1} className="focus-visible:outline-none">
          1. Klassen ({classes.length})
        </Heading>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={onShowClearConfirm}
            title="Alles zurücksetzen"
            aria-label="Alle Klassen und Bilder zurücksetzen"
          >
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">Zurücksetzen</span>
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={onAddClass}
            disabled={classes.length >= ML.MAX_CLASSES}
            title={
              classes.length >= ML.MAX_CLASSES
                ? `Maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht`
                : 'Neue Klasse hinzufügen'
            }
            aria-label={
              classes.length >= ML.MAX_CLASSES
                ? `Hinzufügen deaktiviert, maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht`
                : 'Neue Klasse hinzufügen'
            }
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">Hinzufügen</span>
          </Button>
        </div>
      </div>

      <EntryReveal kind="text" active={entryReady} activation>
        <AnimatedList>
          {classes.length === 0 ? (
            <Empty key="empty">
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
    </div>
  );
}
