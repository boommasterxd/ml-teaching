import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'error';
export const metadata = {
  ...pageMetadata(
    'Q-Learning ausprobieren',
    'Q-Learning ausprobieren bei ML Teaching.',
    learningPaths.qLearningPractice,
  ),
  robots: { index: false, follow: true },
};

/** Reserved for the Q-learning exercise; no experiment or instructional content is mounted yet. */
export default function QLearningPracticePage() {
  return null;
}
