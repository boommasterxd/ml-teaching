'use client';

import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import type { KnnPoint, KnnPosition } from '@/lib/knn';
import Button from '@/components/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { KNN_RING_RADIUS, KnnPoint as PointGlyph } from '@/components/network/KnnArtwork';

export default function KnnQuizPoint({
  point,
  distance,
  query,
  selected,
  disabled,
  errorAttempt,
  k,
  onChoose,
  onDismiss,
}: {
  point: KnnPoint;
  distance: number;
  query: KnnPosition;
  selected: boolean;
  disabled: boolean;
  errorAttempt: number;
  k: number;
  onChoose: (id: string) => void;
  onDismiss: () => void;
}) {
  const reduce = useShouldReduceMotion();
  const timing = useTempoTransition(motionTokens.transition.shake);
  const draw = useTempoTransition(motionTokens.transition.fade);
  const shake = motionTokens.shift.shake;
  const showError = !disabled && Boolean(errorAttempt);
  const placement = {
    left: `${point.x}%`,
    top: `${point.y}%`,
    '--knn-point-offset-x': point.x - query.x,
    '--knn-point-offset-y': point.y - query.y,
  };
  return (
    // Feedback survives the browser's delayed focus scroll; only user dismissal clears it.
    <Tooltip
      open={showError}
      onOpenChange={(open, { reason }) => {
        if (!open && (reason === 'escape-key' || reason === 'outside-press')) onDismiss();
      }}
    >
      <TooltipTrigger
        closeOnClick={false}
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="knn-point-control size-(--knn-point-size) disabled:opacity-100"
            style={placement}
            disabled={disabled}
            aria-label={`${point.signal === 'dog' ? 'Hund' : 'Katze'}, Punkt ${point.id.replace('point-', '')}, Abstand zur Raute: ${distance.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Einheiten`}
            aria-pressed={selected}
            aria-invalid={showError || undefined}
            onClick={() => onChoose(point.id)}
            onBlur={() => {
              if (errorAttempt) onDismiss();
            }}
          >
            <Effect
              asChild
              initial={false}
              animate={{
                x: showError && !reduce ? [0, -shake, shake, -shake * 0.66, shake * 0.66, 0] : 0,
              }}
              transition={timing}
              key={errorAttempt}
            >
              <svg viewBox="-12 -12 24 24" className="size-full" aria-hidden="true">
                <PointGlyph x={0} y={0} signal={point.signal} />
                {selected && (
                  <Effect
                    asChild
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={draw}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r={KNN_RING_RADIUS}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="1"
                    />
                  </Effect>
                )}
              </svg>
            </Effect>
          </Button>
        }
      />
      <TooltipContent sideOffset={6} collisionPadding={12}>
        Dieser Punkt gehört nicht zu den {k} nächsten. Suche näher an der Raute.
      </TooltipContent>
    </Tooltip>
  );
}
