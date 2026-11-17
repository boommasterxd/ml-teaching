'use client';

import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { KnnQuery, KnnPoint as PointGlyph } from '@/components/network/KnnArtwork';
import { Text } from '@/components/ui/typography';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { KnnQuizState } from './useKnnQuiz';
import KnnQuizPoint from './KnnQuizPoint';

export default function KnnQuizPlot({ state }: { state: KnnQuizState }) {
  const reduce = useShouldReduceMotion();
  const timing = useTempoTransition(motionTokens.transition.fade);
  return (
    <TooltipProvider>
      <div className="knn-quiz-figure">
        <div
          className="knn-quiz-plot"
          role="group"
          aria-label="Datenpunkte: Wähle die nächsten Nachbarn der Raute"
        >
          <svg
            className="knn-quiz-connections"
            viewBox="0 0 100 100"
            style={{ left: `${state.round.query.x}%`, top: `${state.round.query.y}%` }}
            aria-hidden="true"
          >
            {state.round.points
              .filter((point) => state.selected.includes(point.id))
              .map((point) => (
                <Effect
                  key={point.id}
                  asChild
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={timing}
                >
                  <path
                    d={`M50 50L${50 + point.x - state.round.query.x} ${50 + point.y - state.round.query.y}`}
                    stroke="var(--primary)"
                    strokeWidth="0.4"
                    fill="none"
                  />
                </Effect>
              ))}
          </svg>
          {state.round.points.map((point) => (
            <KnnQuizPoint
              key={point.id}
              point={point}
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
