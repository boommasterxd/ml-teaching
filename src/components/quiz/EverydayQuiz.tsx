'use client';

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  QUIZ_CORRECT_COUNT,
  INITIAL_QUIZ_ROUND,
  createQuizRound,
  type QuizExample,
  type QuizId,
} from '@/lib/recognition-quiz';
import Button from '@/components/Button';
import { RotateCcw } from '@/components/icons/rotate-ccw';
import { Badge } from '@/components/ui/badge';
import { EntryReveal } from '@/components/ui/entry-reveal';
import QuizChoice from './QuizChoice';

type Feedback = typeof import('./quiz-feedback');
let feedbackPromise: Promise<Feedback> | undefined;

function prepareFeedback() {
  feedbackPromise ??= import('./quiz-feedback').catch((error: unknown) => {
    feedbackPromise = undefined;
    throw error;
  });
  return feedbackPromise;
}

function useQuizFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const prepare = () => {
    if (feedback || inFlight.current) return;
    inFlight.current = true;
    setFailed(false);
    void prepareFeedback().then(
      (module) => {
        inFlight.current = false;
        setFeedback(module);
      },
      () => {
        inFlight.current = false;
        setFailed(true);
      },
    );
  };
  return { feedback, failed, prepare };
}

interface QuizState {
  answers: QuizId[];
  announcement: string;
  round?: readonly QuizExample[];
}

const visitRound = typeof window === 'undefined' ? INITIAL_QUIZ_ROUND : createQuizRound();
const subscribe = () => () => {};
const clientSnapshot = () => visitRound;
const serverSnapshot = () => INITIAL_QUIZ_ROUND;

export default function EverydayQuiz() {
  const initialRound = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [state, setState] = useState<QuizState>({ answers: [], announcement: '' });
  const { feedback, failed, prepare } = useQuizFeedback();
  const round = state.round ?? initialRound;
  const choices = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (state.round)
      choices.current?.querySelector<HTMLButtonElement>('button[data-quiz-choice]')?.focus();
  }, [state.round]);
  const correctCount = round.filter(
    (example) => example.correct && state.answers.includes(example.id),
  ).length;
  const answer = (example: QuizExample) => {
    prepare();
    setState((current) => {
      if (current.answers.includes(example.id)) return current;
      const answers = [...current.answers, example.id];
      const found = round.filter((item) => item.correct && answers.includes(item.id)).length;
      const completed = example.correct && found === QUIZ_CORRECT_COUNT;
      return {
        ...current,
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
    setState({
      round: createQuizRound(round),
      answers: [],
      announcement: 'Neue Runde. 0 von 3 gefunden.',
    });
  };
  const QuizCompletion = feedback?.QuizCompletion;

  return (
    <div className="flex flex-col gap-6">
      <EntryReveal kind="text" asChild>
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
      </EntryReveal>
      <div>
        <div ref={choices} className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
          {round.map((example, index) => (
            <EntryReveal
              key={example.id}
              index={index % 3}
              activation={Boolean(state.round)}
              className="grid"
            >
              <QuizChoice
                example={example}
                answered={state.answers.includes(example.id)}
                result={feedback?.QuizResult}
                feedbackFailed={failed}
                onIntent={prepare}
                onAnswer={answer}
              />
            </EntryReveal>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {correctCount === QUIZ_CORRECT_COUNT && QuizCompletion && (
            <QuizCompletion key="complete" />
          )}
        </AnimatePresence>
      </div>
      <p role="status" aria-atomic="true" className="sr-only">
        {state.announcement}
      </p>
      <noscript>Aktiviere JavaScript, um deine Auswahl zu prüfen.</noscript>
    </div>
  );
}
