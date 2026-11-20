import JsonLd from '@/components/JsonLd';
import TrainingPage from '@/screens/TrainingPage';
import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata, siteConfig, webApplicationId } from '@/lib/site';

export const dynamic = 'error';
const title = 'Eigenes Bilderkennungsmodell trainieren';
const description =
  'Sammle eigene Fotos, trainiere ein Bildmodell und teste deine Bilderkennung lokal im Browser. Das Modell wird erst nach deiner Einwilligung geladen.';
export const metadata = pageMetadata(title, description, learningPaths.imagePractice);

export default function ImagePracticePage() {
  const url = `${siteConfig.url}${learningPaths.imagePractice}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebPage', 'LearningResource'],
    '@id': `${url}#learning-resource`,
    url,
    name: title,
    description,
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    isPartOf: { '@id': webApplicationId },
    learningResourceType: 'Interaktive Übung',
    teaches: ['Ein Bildmodell mit eigenen Beispielen trainieren und testen'],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <TrainingPage />
    </>
  );
}
