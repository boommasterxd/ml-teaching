import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import LandingPage from '@/screens/LandingPage';
import { siteConfig, webApplicationId, webSiteId } from '@/lib/site';

export const dynamic = 'error';
export const metadata: Metadata = {
  title: 'ML Teaching – KI verstehen und ausprobieren',
  description: siteConfig.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': webSiteId,
        name: siteConfig.name,
        url: siteConfig.url,
        inLanguage: siteConfig.language,
      },
      {
        '@type': 'WebApplication',
        '@id': webApplicationId,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web browser',
        inLanguage: siteConfig.language,
        isAccessibleForFree: true,
        isPartOf: { '@id': webSiteId },
      },
    ],
  };
  return (
    <>
      <JsonLd data={structuredData} />
      <LandingPage />
    </>
  );
}
