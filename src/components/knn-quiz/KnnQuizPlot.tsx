'use client';

import { useId } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { KNN_RING_RADIUS, KnnQuery, KnnPoint as PointGlyph } from '@/components/network/KnnArtwork';
import { Text } from '@/components/ui/typography';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { KnnQuizState } from './useKnnQuiz';
import KnnQuizPoint from './KnnQuizPoint';
import { squaredDistance, type KnnPosition } from '@/lib/knn';

function QuizConnection({ point, query }: { point: KnnPosition; query: KnnPosition }) {
  const reduce = useShouldReduceMotion();
  const timing = useTempoTransition(motionTokens.transition.fade);
  const dx = point.x - query.x;
  const dy = point.y - query.y;
  return (
    <svg
      className="knn-quiz-connections"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={{
        left: `${query.x}%`,
        top: `${query.y}%`,
        width: `calc(${Math.hypot(dx, dy)}cqmin - var(--knn-point-size) * ${KNN_RING_RADIUS / 24})`,
        rotate: `${Math.atan2(dy, dx)}rad`,
      }}
      aria-hidden="true"
    >
      <Effect
        asChild
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={timing}
      >
        <path d="M0 0.5H1" stroke="var(--primary)" strokeWidth="1" fill="none" />
      </Effect>
    </svg>
  );
}

export default function KnnQuizPlot({ state }: { state: KnnQuizState }) {
  const descriptionId = useId();
  return (
    <TooltipProvider>
      <div className="knn-quiz-figure">
        <p id={descriptionId} className="sr-only">
          Die Abstände zur Raute verwenden dieselben Einheiten im vereinfachten Merkmalsraum.
          Kleinere Werte bedeuten nähere Nachbarn.
        </p>
        <div
          className="knn-quiz-plot"
          role="group"
          aria-label="Datenpunkte: Wähle die nächsten Nachbarn der Raute"
          aria-describedby={descriptionId}
        >
          {state.round.points
            .filter((point) => state.selected.includes(point.id))
            .map((point) => (
              <QuizConnection key={point.id} point={point} query={state.round.query} />
            ))}
          {state.round.points.map((point) => (
            <KnnQuizPoint
              key={point.id}
              point={point}
              distance={Math.sqrt(squaredDistance(point, state.round.query))}
              neighborOffset={
                state.neighbors.some((neighbor) => neighbor.id === point.id)
                  ? { x: point.x - state.round.query.x, y: point.y - state.round.query.y }
                  : undefined
              }
              selected={state.selected.includes(point.id)}
              errorAttempt={state.error?.id === point.id ? state.error.attempt : 0}
              k={state.k}
              onChoose={state.choosePoint}
              onDismiss={state.clearError}
            />
          ))}
          <span
            className="knn-query-position size-11"
            style={{ left: `${state.round.query.x}%`, top: `${state.round.query.y}%` }}
            role="img"
            aria-label="Raute: der neue Datenpunkt"
          >
            <svg viewBox="-12 -12 24 24" className="size-full" aria-hidden="true">
              <KnnQuery x={0} y={0} />
            </svg>
          </span>
        </div>
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          aria-label="Legende"
        >
          {(['dog', 'cat'] as const).map((signal) => (
            <Text key={signal} variant="muted" className="flex items-center gap-1">
              <svg viewBox="-12 -12 24 24" className="size-6" aria-hidden="true">
                <PointGlyph x={0} y={0} signal={signal} />
              </svg>
              {signal === 'dog' ? 'Hund' : 'Katze'}
            </Text>
          ))}
          <Text variant="muted" className="flex items-center gap-1">
            <svg viewBox="-12 -12 24 24" className="size-6" aria-hidden="true">
              <KnnQuery x={0} y={0} />
            </svg>
            Neues Bild
          </Text>
        </div>
      </div>
    </TooltipProvider>
  );
}
