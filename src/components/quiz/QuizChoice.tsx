'use client';

import { AnimatePresence } from 'motion/react';
import { useId, useRef, type ComponentType } from 'react';
import type { QuizExample } from '@/lib/recognition-quiz';
import { Calculator } from '@/components/icons/calculator';
import { Camera } from '@/components/icons/camera';
import { Car } from '@/components/icons/car';
import { Cat } from '@/components/icons/cat';
import { FileText } from '@/components/icons/file-text';
import { Image } from '@/components/icons/image';
import { Mic } from '@/components/icons/mic';
import { Smartphone } from '@/components/icons/smartphone';
import { Timer } from '@/components/icons/timer';
import Button from '@/components/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const exampleIcons = {
  animal: Cat,
  sound: Mic,
  traffic: Car,
  numbers: Calculator,
  text: FileText,
  time: Timer,
  camera: Camera,
  image: Image,
  phone: Smartphone,
};

export default function QuizChoice({
  example,
  answered,
  result: QuizResult,
  feedbackFailed,
  onIntent,
  onAnswer,
}: {
  example: QuizExample;
  answered: boolean;
  result?: ComponentType<{ example: QuizExample }>;
  feedbackFailed: boolean;
  onIntent: () => void;
  onAnswer: (example: QuizExample) => void;
}) {
  const Icon = exampleIcons[example.icon];
  const descriptionId = useId();
  const choice = useRef<HTMLButtonElement>(null);
  return (
    <Card className="isolate h-full gap-0 py-0">
      <div className="relative flex-1 overflow-clip rounded-(--quiz-inner-radius) [--quiz-inner-radius:calc(var(--glass-radius)-1px)]">
        <CardHeader className="min-h-48 pt-20 pb-6" aria-hidden={answered || undefined}>
          <CardTitle as="h3">{example.title}</CardTitle>
          <CardDescription id={descriptionId}>{example.description}</CardDescription>
        </CardHeader>
        <Button
          ref={choice}
          data-quiz-choice=""
          variant="quiz-card"
          size="quiz-card"
          data-result={answered ? (example.correct ? 'correct' : 'incorrect') : undefined}
          aria-label={'Auswählen: ' + example.title}
          aria-describedby={answered ? undefined : descriptionId}
          aria-disabled={answered || undefined}
          onPointerEnter={onIntent}
          onFocus={onIntent}
          onPointerDown={onIntent}
          onClick={() => {
            if (!answered) onAnswer(example);
          }}
        >
          <Icon
            data-icon="inline-start"
            animate={answered ? false : undefined}
            aria-hidden="true"
          />
        </Button>
      </div>
      {answered && !QuizResult && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center px-3 sm:px-6">
          <Alert role="group" aria-label="Rückmeldung" className="min-w-0">
            <AlertTitle>{example.correct ? 'Richtig!' : 'Hier nicht.'}</AlertTitle>
            <AlertDescription>
              <p>{example.explanation}</p>
              {feedbackFailed && (
                <Button
                  className="pointer-events-auto mt-1 h-auto min-h-8 max-w-full text-center whitespace-normal"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    choice.current?.focus();
                    onIntent();
                  }}
                >
                  Rückmeldung erneut laden
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <AnimatePresence initial={false}>
        {answered && QuizResult && <QuizResult key="result" example={example} />}
      </AnimatePresence>
    </Card>
  );
}
