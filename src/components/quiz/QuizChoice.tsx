'use client';

import { AnimatePresence } from 'motion/react';
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
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QuizResult from './QuizResult';

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
  onAnswer,
}: {
  example: QuizExample;
  answered: boolean;
  onAnswer: (example: QuizExample) => void;
}) {
  const Icon = exampleIcons[example.icon];
  return (
    <Card className="isolate h-full gap-0 py-0">
      <div className="relative flex-1 overflow-clip rounded-(--quiz-inner-radius) [--quiz-inner-radius:calc(var(--glass-radius)-1px)]">
        <CardHeader className="min-h-48 pt-20 pb-6" aria-hidden={answered || undefined}>
          <CardTitle as="h3">{example.title}</CardTitle>
          <CardDescription>{example.description}</CardDescription>
        </CardHeader>
        <Button
          data-quiz-choice=""
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
      </div>
      <AnimatePresence initial={false}>
        {answered && <QuizResult key="result" example={example} />}
      </AnimatePresence>
    </Card>
  );
}
