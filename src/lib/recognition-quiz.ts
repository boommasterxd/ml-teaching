import { QUIZ_EXAMPLES } from '@/content/recognition-examples';

export { QUIZ_EXAMPLES } from '@/content/recognition-examples';

export type QuizExample = (typeof QUIZ_EXAMPLES)[number];
export type QuizId = QuizExample['id'];
export const QUIZ_CORRECT_COUNT = 3;
export const INITIAL_QUIZ_ROUND: readonly QuizExample[] = QUIZ_EXAMPLES.slice(0, 6);

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

/** Sample a bounded six-card round; a replay always changes its selection. */
export function createQuizRound(
  previous: readonly QuizExample[] = [],
  random: () => number = Math.random,
): readonly QuizExample[] {
  const correct = shuffle(
    QUIZ_EXAMPLES.filter((example) => example.correct),
    random,
  );
  const incorrect = shuffle(
    QUIZ_EXAMPLES.filter((example) => !example.correct),
    random,
  );
  const selected = [...correct.slice(0, 3), ...incorrect.slice(0, 3)];
  if (selected.every((example) => previous.some((item) => item.id === example.id))) {
    selected[0] = correct.find((example) => !selected.includes(example))!;
  }
  return shuffle(selected, random);
}
