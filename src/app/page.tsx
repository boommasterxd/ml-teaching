import LandingPage from '@/screens/LandingPage';
import { siteConfig } from '@/lib/site';

export const dynamic = 'error';

export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web browser with WebGL and camera access',
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
