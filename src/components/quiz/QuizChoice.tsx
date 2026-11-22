'use client';

import { AnimatePresence } from 'motion/react';
import { useId, useRef, useState, type ComponentType } from 'react';
import { useAnimateIconContext } from '@animate-ui/react/icons';
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

function QuizChoiceIcon({
  icon,
  answered,
  focused,
}: {
  icon: QuizExample['icon'];
  answered: boolean;
  focused: boolean;
}) {
  const { active } = useAnimateIconContext();
  const Icon = exampleIcons[icon];
  return (
    <Icon
      size={20}
      className="mt-px shrink-0 text-primary"
      animate={!answered && (focused || Boolean(active))}
      aria-hidden="true"
    />
  );
}

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
  const descriptionId = useId();
  const choice = useRef<HTMLButtonElement>(null);
  const [focused, setFocused] = useState(false);
  return (
    <Card className="isolate grid grid-cols-1 gap-0 py-0">
      <div className="relative col-start-1 row-start-1 min-w-0 overflow-clip rounded-(--quiz-inner-radius) [--quiz-inner-radius:calc(var(--glass-radius)-1px)]">
        <CardHeader className="content-start py-5" aria-hidden={answered || undefined}>
          <CardTitle as="h3" className="flex items-start gap-2 leading-snug">
            <QuizChoiceIcon icon={example.icon} answered={answered} focused={focused} />
            <span className="min-w-0">{example.title}</span>
          </CardTitle>
          <CardDescription id={descriptionId}>{example.description}</CardDescription>
        </CardHeader>
        <Button
          ref={choice}
          data-quiz-choice=""
          variant="quiz-card"
          size="quiz-card"
          aria-label={'Auswählen: ' + example.title}
          aria-describedby={answered ? undefined : descriptionId}
          aria-disabled={answered || undefined}
          onPointerEnter={onIntent}
          onFocus={() => {
            setFocused(true);
            onIntent();
          }}
          onBlur={() => setFocused(false)}
          onPointerDown={onIntent}
          onClick={() => {
            if (!answered) onAnswer(example);
          }}
        />
      </div>
      {answered && !QuizResult && (
        <div className="pointer-events-none z-30 col-start-1 row-start-1 grid min-w-0 place-items-center p-3 sm:px-6">
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
