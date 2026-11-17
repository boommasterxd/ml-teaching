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
import { KnnPoint as PointGlyph } from '@/components/network/KnnArtwork';

export default function KnnQuizPoint({
  point,
  neighborOffset,
  selected,
  errorAttempt,
  k,
  onChoose,
  onDismiss,
}: {
  point: KnnPoint;
  neighborOffset?: KnnPosition;
  selected: boolean;
  errorAttempt: number;
  k: number;
  onChoose: (id: string) => void;
  onDismiss: () => void;
}) {
  const reduce = useShouldReduceMotion();
  const timing = useTempoTransition(motionTokens.transition.shake);
  const draw = useTempoTransition(motionTokens.transition.fade);
  const shake = motionTokens.shift.shake;
  const placement = {
    left: `${point.x}%`,
    top: `${point.y}%`,
    '--knn-neighbor-offset-x': neighborOffset?.x ?? 0,
    '--knn-neighbor-offset-y': neighborOffset?.y ?? 0,
  };
  return (
    // Feedback survives the browser's delayed focus scroll; only user dismissal clears it.
    <Tooltip open={Boolean(errorAttempt)}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="knn-point-control size-11"
          style={placement}
          aria-label={`${point.signal === 'dog' ? 'Hund' : 'Katze'}, Punkt ${point.id.replace('point-', '')}`}
          aria-pressed={selected}
          aria-invalid={Boolean(errorAttempt) || undefined}
          onClick={() => onChoose(point.id)}
          onBlur={() => {
            if (errorAttempt) onDismiss();
          }}
        >
          <Effect
            asChild
            initial={false}
            animate={{
              x: errorAttempt && !reduce ? [0, -shake, shake, -shake * 0.66, shake * 0.66, 0] : 0,
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
                  <circle cx="0" cy="0" r="9" fill="none" stroke="var(--primary)" strokeWidth="1" />
                </Effect>
              )}
            </svg>
          </Effect>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        collisionPadding={12}
        onEscapeKeyDown={onDismiss}
        onPointerDownOutside={onDismiss}
      >
        Dieser Punkt gehört nicht zu den {k} nächsten. Suche näher an der Raute.
      </TooltipContent>
    </Tooltip>
  );
}
