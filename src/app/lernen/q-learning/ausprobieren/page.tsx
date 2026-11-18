import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';
import RewardPracticePage from '@/screens/RewardPracticePage';

export const dynamic = 'error';
export const metadata = {
  ...pageMetadata(
    'Lernen durch Belohnung',
    'Die Q-Learning-Übung im Lernlabor von ML Teaching.',
    learningPaths.qLearningPractice,
  ),
  robots: { index: false, follow: true },
};

export default function QLearningPracticePage() {
  return <RewardPracticePage />;
}
