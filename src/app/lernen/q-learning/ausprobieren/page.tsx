import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';
import RewardPracticePage from '@/screens/RewardPracticePage';

export const dynamic = 'error';
export const metadata = {
  ...pageMetadata(
    'Belohnungen ausprobieren',
    'Wähle ein Ziel und vergleiche zwei Beispielwege beim Lernen durch Belohnung.',
    learningPaths.qLearningPractice,
  ),
  robots: { index: false, follow: true },
};

export default function QLearningPracticePage() {
  return <RewardPracticePage />;
}
