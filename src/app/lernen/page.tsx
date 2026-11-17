import LearningHubPage from '@/screens/LearningHubPage';
import { pageMetadata } from '@/lib/site';
import { learningPaths } from '@/lib/learning-paths';

export const dynamic = 'error';
export const metadata = pageMetadata(
  'Lernlabor',
  'Wähle deinen Lernbereich: Entdecke Bilderkennung mit eigenen Beispielen oder lerne Reinforcement Learning und Q-Learning kennen.',
  learningPaths.hub,
);

export default function LearnPage() {
  return <LearningHubPage />;
}
