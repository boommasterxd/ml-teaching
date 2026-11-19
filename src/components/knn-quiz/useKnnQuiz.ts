'use client';

import { useState } from 'react';
import { countVotes, nearestNeighbors, winningSignal, type ExampleSignal } from '@/lib/knn';
import { createKnnRound, type KnnNeighborCount } from '@/lib/knn-quiz';

const names = { dog: 'Hund', cat: 'Katze' };

function initialState(k: KnnNeighborCount = 3) {
  return {
    round: createKnnRound(Math.random, k),
    k,
    selected: [] as string[],
    error: null as { id: string; attempt: number } | null,
    result: null as 'correct' | 'incorrect' | null,
    announcement: '',
  };
}

/** One round owns its K, accepted neighbors and feedback; nothing is persisted. */
export function useKnnQuiz() {
  const [state, setState] = useState(initialState);
  const neighbors = nearestNeighbors(state.round.points, state.round.query, state.k);
  const votes = countVotes(neighbors);
  const choosePoint = (id: string) => {
    setState((current) => {
      if (current.result === 'correct') return current;
      const nearest = nearestNeighbors(current.round.points, current.round.query, current.k);
      if (!nearest.some((point) => point.id === id))
        return {
          ...current,
          error: { id, attempt: (current.error?.attempt ?? 0) + 1 },
          announcement: `Dieser Punkt gehört nicht zu den ${current.k} nächsten Nachbarn. Suche näher an der Raute.`,
        };
      const selected = current.selected.includes(id)
        ? current.selected.filter((point) => point !== id)
        : [...current.selected, id];
      return {
        ...current,
        selected,
        error: null,
        result: null,
        announcement: `${selected.length} von ${current.k} Nachbarn gefunden.`,
      };
    });
  };
  const changeK = (k: number) => {
    if (k !== 1 && k !== 3 && k !== 5) return;
    setState((current) =>
      k === current.k
        ? current
        : {
            ...current,
            round: createKnnRound(Math.random, k, current.round.input),
            k,
            selected: [],
            error: null,
            result: null,
            announcement: `Neue Anordnung. Finde jetzt ${k} Nachbarn.`,
          },
    );
  };
  const chooseClass = (signal: ExampleSignal) => {
    if (state.selected.length !== state.k || state.result === 'correct') return;
    const correct = signal === winningSignal(votes);
    setState((current) => ({
      ...current,
      result: correct ? 'correct' : 'incorrect',
      announcement: correct
        ? voteSentence(votes[signal], state.k, signal)
        : 'Zähle die umkreisten Hunde und Katzen. Welche Klasse hat mehr Stimmen?',
    }));
  };
  const clearError = () =>
    setState((current) => (current.error ? { ...current, error: null } : current));
  const restart = () =>
    setState((current) => ({
      ...initialState(current.k),
      announcement: `Neue Runde. Finde ${current.k} Nachbarn.`,
    }));
  return { ...state, neighbors, votes, choosePoint, changeK, chooseClass, clearError, restart };
}

export type KnnQuizState = ReturnType<typeof useKnnQuiz>;

function voteSentence(count: number, k: KnnNeighborCount, signal: ExampleSignal) {
  if (k === 1) return `Der nächste Nachbar stimmt für ${names[signal]}.`;
  return `${count} von ${k} Nachbarn stimmen für ${names[signal]}.`;
}
