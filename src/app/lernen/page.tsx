import LearningHubPage from '@/screens/LearningHubPage';
import { pageMetadata } from '@/lib/site';
import { learningPaths } from '@/lib/learning-paths';

export const dynamic = 'error';
export const metadata = pageMetadata(
  'Lernlabor',
  'Trainiere ein Bildmodell mit eigenen Fotos. Entdecke außerdem, wie eine Spielfigur durch Belohnungen lernen kann.',
  learningPaths.hub,
);

export default function LearnPage() {
  return <LearningHubPage />;
}
