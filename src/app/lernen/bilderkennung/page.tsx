import ImageRecognitionPage from '@/screens/ImageRecognitionPage';
import { learningPaths } from '@/lib/learning-paths';
import { pageMetadata, siteConfig, webApplicationId } from '@/lib/site';

export const dynamic = 'error';
const title = 'Bilderkennung verstehen';
const description =
  'Entdecke, wie eine KI Bilder unterscheidet. Folge einem Bild durch MobileNet und KNN und teste dein Wissen mit interaktiven Übungen.';
export const metadata = pageMetadata(title, description, learningPaths.images);

export default function ImageLearningPage() {
  const url = `${siteConfig.url}${learningPaths.images}`;
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
    teaches: ['Bildmerkmale mit MobileNet beschreiben', 'Bilder mit KNN zuordnen'],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <ImageRecognitionPage />
    </>
  );
}
