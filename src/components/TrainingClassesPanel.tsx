/**
 * TrainingClassesPanel.tsx
 *
 * Left-column panel of the training page. Renders the class list header
 * (count label, reset and add buttons) and the grid of ClassCard components.
 * All state and callbacks are passed in from TrainingPage.
 */
import type React from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import ClassCard from './ClassCard';
import type { ClassCardActions } from './ClassCard';

/**
 * Props for the TrainingClassesPanel component.
 */
interface TrainingClassesPanelProps {
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
}: TrainingClassesPanelProps) {
  return (
    <div className="lg:col-span-7 space-y-6 min-w-0">
      <div className="flex justify-between items-center">
        <h1 ref={mainHeadingRef} tabIndex={-1} className="text-lg font-bold text-zinc-800 focus-visible:outline-none">1. Klassen ({classes.length})</h1>
        <div className="flex gap-2">
          <button
            onClick={onShowClearConfirm}
            className="flex items-center px-3 sm:px-4 py-2 bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl text-sm font-medium transition-colors shadow-sm"
            title="Alles zurücksetzen"
            aria-label="Alle Klassen und Bilder zurücksetzen"
          >
            <RotateCcw className="w-4 h-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Zurücksetzen</span>
          </button>
          <button
            onClick={onAddClass}
            disabled={classes.length >= ML.MAX_CLASSES}
            className="flex items-center px-3 sm:px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-zinc-700"
            title={classes.length >= ML.MAX_CLASSES ? `Maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht` : 'Neue Klasse hinzufügen'}
            aria-label={classes.length >= ML.MAX_CLASSES ? `Hinzufügen deaktiviert — maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht` : 'Neue Klasse hinzufügen'}
          >
            <Plus className="w-4 h-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Hinzufügen</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {classes.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
            <p className="text-zinc-600 text-sm">Keine Klassen vorhanden. Füge Klassen hinzu, um zu starten.</p>
          </div>
        ) : (
          classes.map((cls: MLClass) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              isDuplicate={duplicateClassNames.has(cls.name.trim())}
              stream={stream}
              facingMode={facingMode}
              actions={cardActions}
            />
          ))
        )}
      </div>
    </div>
  );
}
