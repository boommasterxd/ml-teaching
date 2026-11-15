import TrainingPage from '@/screens/TrainingPage';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'error';
export const metadata = pageMetadata(
  'Eigenes Bilderkennungsmodell trainieren',
  'Sammle Kamerabilder, trainiere eigene Klassen und teste deine Bilderkennung lokal im Browser. Modell-Download und Kamera starten erst nach deiner Einwilligung.',
  '/lernen',
);

export default function LearnPage() {
  return <TrainingPage />;
}
