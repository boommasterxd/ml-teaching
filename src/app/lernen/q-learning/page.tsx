import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'error';
export const metadata = {
  ...pageMetadata('Q-Learning', 'Q-Learning bei ML Teaching.', learningPaths.qLearning),
  robots: { index: false, follow: true },
};

/** Reserved for the Q-learning introduction; the shared layout supplies the complete shell. */
export default function QLearningPage() {
  return null;
}
