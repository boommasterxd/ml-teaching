import JsonLd from '@/components/JsonLd';
import LearningHubPage from '@/screens/LearningHubPage';
import { learningResourceId, pageMetadata, siteConfig, webSiteId } from '@/lib/site';
import { learningPaths } from '@/lib/learning-paths';

export const dynamic = 'error';
const title = 'Lernlabor';
const description =
  'Trainiere ein Bildmodell mit eigenen Fotos. Entdecke außerdem, wie eine Spielfigur durch Belohnungen lernen kann.';
export const metadata = pageMetadata(title, description, learningPaths.hub);

export default function LearnPage() {
  const url = `${siteConfig.url}${learningPaths.hub}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: title,
    description,
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    isPartOf: { '@id': webSiteId },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        { '@id': learningResourceId(learningPaths.images) },
        { '@id': learningResourceId(learningPaths.imagePractice) },
      ],
    },
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <LearningHubPage />
    </>
  );
}
