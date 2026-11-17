'use client';

import { useState, type ReactElement } from 'react';
import { useIsPresent } from 'motion/react';
import { useAnimateIconContext } from '@animate-ui/react/icons';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { ReducedMotionConfig, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import type { QuizExample } from '@/lib/recognition-quiz';
import { Check } from '@/components/icons/check';
import { X } from '@/components/icons/x';
import Button from '@/components/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function QuizResult({ example }: { example: QuizExample }) {
  const [open, setOpen] = useState(false);
  const present = useIsPresent();
  const { active: cardActive } = useAnimateIconContext();
  return (
    <div className="contents" inert={!present || undefined} aria-hidden={!present || undefined}>
      <ReducedMotionConfig remount>
        <ResultMotion kind="dimmer">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-black/65"
          />
        </ResultMotion>
      </ReducedMotionConfig>
      <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
        <Tooltip open={present && open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <Button
              variant="quiz-result"
              size="quiz-result"
              data-result={example.correct ? 'correct' : 'incorrect'}
              aria-label={
                (example.correct ? 'Richtig: ' : 'Hier nicht: ') +
                example.title +
                '. Erklärung anzeigen'
              }
              onClick={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
            >
              <ReducedMotionConfig remount>
                <ResultMotion kind="icon">
                  <span className="grid place-items-center">
                    <ResultGlyph correct={example.correct} cardActive={Boolean(cardActive)} />
                  </span>
                </ResultMotion>
              </ReducedMotionConfig>
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={8} collisionPadding={12}>
            {example.explanation}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ResultGlyph({ correct, cardActive }: { correct: boolean; cardActive: boolean }) {
  const { active: controlActive } = useAnimateIconContext();
  const Icon = correct ? Check : X;
  return <Icon animate={cardActive || Boolean(controlActive)} aria-hidden="true" />;
}

function ResultMotion({ kind, children }: { kind: 'dimmer' | 'icon'; children: ReactElement }) {
  const reduce = useShouldReduceMotion();
  return (
    <Effect
      asChild
      fade={kind === 'dimmer'}
      zoom={kind === 'icon' ? { initialScale: 0.65 } : false}
      initial={reduce || kind === 'dimmer' ? false : 'hidden'}
      transition={reduce ? { duration: 0 } : undefined}
    >
      {children}
    </Effect>
  );
}
