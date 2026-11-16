'use client';

import { useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  QUIZ_CORRECT_COUNT,
  QUIZ_EXAMPLES,
  type QuizExample,
  type QuizId,
} from '@/content/recognition-quiz';
import Button from '@/components/Button';
import { RotateCcw } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import QuizChoice from './QuizChoice';
import QuizCompletion from './QuizCompletion';

interface QuizState {
  answers: QuizId[];
  announcement: string;
}

export default function EverydayQuiz() {
  const [state, setState] = useState<QuizState>({ answers: [], announcement: '' });
  const firstChoice = useRef<HTMLButtonElement>(null);
  const correctCount = QUIZ_EXAMPLES.filter(
    (example) => example.correct && state.answers.includes(example.id),
  ).length;
  const answer = (example: QuizExample) => {
    setState((current) => {
      if (current.answers.includes(example.id)) return current;
      const answers = [...current.answers, example.id];
      const found = QUIZ_EXAMPLES.filter(
        (item) => item.correct && answers.includes(item.id),
      ).length;
      const completed = example.correct && found === QUIZ_CORRECT_COUNT;
      return {
        answers,
        announcement:
          example.title +
          ': ' +
          (example.correct ? 'Richtig! ' : 'Hier nicht. ') +
          example.explanation +
          (completed ? ' Alle drei gefunden.' : ''),
      };
    });
  };
  const reset = () => {
    setState({ answers: [], announcement: 'Quiz zurückgesetzt. 0 von 3 gefunden.' });
    firstChoice.current?.focus();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">
            {correctCount} von {QUIZ_CORRECT_COUNT} gefunden
          </Badge>
          <Button
            variant="ghost"
            className="min-h-11"
            disabled={!state.answers.length}
            onClick={reset}
          >
            <RotateCcw data-icon="inline-start" aria-hidden="true" /> Nochmal spielen
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QUIZ_EXAMPLES.map((example, index) => (
            <QuizChoice
              key={example.id}
              example={example}
              answered={state.answers.includes(example.id)}
              onAnswer={answer}
              buttonRef={index === 0 ? firstChoice : undefined}
            />
          ))}
        </div>
        <AnimatePresence initial={false}>
          {correctCount === QUIZ_CORRECT_COUNT && <QuizCompletion key="complete" />}
        </AnimatePresence>
        <p role="status" aria-atomic="true" className="sr-only">
          {state.announcement}
        </p>
        <noscript>Aktiviere JavaScript, um deine Auswahl zu prüfen.</noscript>
      </div>
    </TooltipProvider>
  );
}
