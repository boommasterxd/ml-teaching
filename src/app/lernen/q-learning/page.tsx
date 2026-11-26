import QLearningPage from '@/screens/QLearningPage';
import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'error';
export const metadata = {
  ...pageMetadata(
    'Q-Learning verstehen',
    'Die Einführung zu Q-Learning für das Lernlabor von ML Teaching ist geplant.',
    learningPaths.qLearning,
  ),
  robots: { index: false, follow: true },
};

export default QLearningPage;
