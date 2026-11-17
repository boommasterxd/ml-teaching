import LandingPage from '@/screens/LandingPage';
import { siteConfig, webApplicationId } from '@/lib/site';

export const dynamic = 'error';

export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': webApplicationId,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web browser',
    inLanguage: 'de',
    isAccessibleForFree: true,
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <LandingPage />
    </>
  );
}
