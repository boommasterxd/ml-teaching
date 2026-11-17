import TrainingPage from '@/screens/TrainingPage';
import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'error';
export const metadata = pageMetadata(
  'Eigenes Bilderkennungsmodell trainieren',
  'Sammle Kamerabilder, trainiere eigene Klassen und teste deine Bilderkennung lokal im Browser. Modell-Download und Kamera starten erst nach deiner Einwilligung.',
  learningPaths.imagePractice,
);

export default function ImagePracticePage() {
  return <TrainingPage />;
}
