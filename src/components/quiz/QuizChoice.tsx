'use client';

import type { Ref } from 'react';
import { AnimatePresence } from 'motion/react';
import type { QuizExample } from '@/content/recognition-quiz';
import { Calculator, Car, Cat, FileText, Mic, Timer } from '@/components/icons';
import Button from '@/components/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QuizResult from './QuizResult';

const exampleIcons = {
  photos: Cat,
  voice: Mic,
  traffic: Car,
  calculator: Calculator,
  'photo-text': FileText,
  timer: Timer,
};

export default function QuizChoice({
  example,
  answered,
  onAnswer,
  buttonRef,
}: {
  example: QuizExample;
  answered: boolean;
  onAnswer: (example: QuizExample) => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const Icon = exampleIcons[example.id];
  return (
    <Card className="h-full gap-0 py-0">
      <div className="relative flex-1">
        <CardHeader className="min-h-48 pt-20 pb-6" aria-hidden={answered || undefined}>
          <CardTitle as="h3">{example.title}</CardTitle>
          <CardDescription>{example.description}</CardDescription>
        </CardHeader>
        <Button
          ref={buttonRef}
          variant="quiz-card"
          size="quiz-card"
          data-result={answered ? (example.correct ? 'correct' : 'incorrect') : undefined}
          aria-label={'Auswählen: ' + example.title}
          aria-disabled={answered || undefined}
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
        <AnimatePresence initial={false}>
          {answered && <QuizResult key="result" example={example} />}
        </AnimatePresence>
      </div>
    </Card>
  );
}
