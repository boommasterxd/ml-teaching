'use client';

import { useState } from 'react';
import { countVotes, winningSignal, type ExampleSignal } from '@/lib/knn';
import { createKnnRound, KNN_MAX_NEIGHBORS, KNN_MIN_NEIGHBORS } from '@/lib/knn-quiz';

const names = { dog: 'Hund', cat: 'Katze' };

function initialState(k = 3) {
  return {
    round: createKnnRound(),
    k,
    selected: [] as string[],
    error: { id: null as string | null, attempt: 0 },
    result: null as 'correct' | 'incorrect' | null,
    announcement: '',
  };
}

/** One round owns its K, accepted neighbors and feedback; nothing is persisted. */
export function useKnnQuiz() {
  const [state, setState] = useState(initialState);
  const winner = winningSignal(countVotes(state.round.ranked.slice(0, state.k)));
  const choosePoint = (id: string) => {
    setState((current) => {
      if (current.result === 'correct') return current;
      const nearest = current.round.ranked.slice(0, current.k);
      if (!nearest.some((point) => point.id === id)) {
        const attempt = current.error.attempt + 1;
        const pointNumber = id.replace('point-', '');
        return {
          ...current,
          error: { id, attempt },
          announcement: `Fehlversuch ${attempt}: Punkt ${pointNumber} gehört nicht zu den ${current.k} nächsten Nachbarn. Suche näher an der Raute.`,
        };
      }
      const selected = current.selected.includes(id)
        ? current.selected.filter((point) => point !== id)
        : [...current.selected, id];
      return {
        ...current,
        selected,
        error: { ...current.error, id: null },
        result: null,
        announcement: `${selected.length} von ${current.k} Nachbarn gefunden.`,
      };
    });
  };
  const changeK = (k: number) => {
    if (!Number.isInteger(k) || k < KNN_MIN_NEIGHBORS || k > KNN_MAX_NEIGHBORS) return;
    setState((current) =>
      k === current.k
        ? current
        : {
            ...current,
            k,
            selected: [],
            error: { ...current.error, id: null },
            result: null,
            announcement: `Finde jetzt ${k} Nachbarn.`,
          },
    );
  };
  const chooseClass = (signal: ExampleSignal | null) => {
    setState((current) => {
      if (current.selected.length !== current.k || current.result === 'correct') return current;
      const votes = countVotes(current.round.ranked.slice(0, current.k));
      const correct = signal === winningSignal(votes);
      return {
        ...current,
        result: correct ? 'correct' : 'incorrect',
        announcement: correct
          ? voteSentence(votes, current.k, signal)
          : 'Zähle noch einmal, wie viele Stimmen Hund und Katze bekommen.',
      };
    });
  };
  const clearError = () =>
    setState((current) =>
      current.error.id ? { ...current, error: { ...current.error, id: null } } : current,
    );
  const restart = () =>
    setState((current) => ({
      ...initialState(current.k),
      announcement: `Neue Runde. Finde ${current.k} Nachbarn.`,
    }));
  return { ...state, winner, choosePoint, changeK, chooseClass, clearError, restart };
}

export type KnnQuizState = ReturnType<typeof useKnnQuiz>;

function voteSentence(
  votes: ReturnType<typeof countVotes>,
  k: number,
  signal: ExampleSignal | null,
) {
  if (signal === null)
    return `Hund und Katze haben je ${votes.dog} ${votes.dog === 1 ? 'Stimme' : 'Stimmen'}.`;
  if (k === 1) return `Der nächste Nachbar stimmt für ${names[signal]}.`;
  return `${votes[signal]} von ${k} Nachbarn stimmen für ${names[signal]}.`;
}
