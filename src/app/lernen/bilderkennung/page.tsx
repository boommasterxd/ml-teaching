import ImageRecognitionPage from '@/screens/ImageRecognitionPage';
import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'error';
export const metadata = pageMetadata(
  'Bilderkennung verstehen',
  'Entdecke, wie eine KI Bilder unterscheidet. Folge einem Bild durch MobileNet und KNN und teste dein Wissen mit interaktiven Übungen.',
  learningPaths.images,
);

export default function ImageLearningPage() {
  return <ImageRecognitionPage />;
}
