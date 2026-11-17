import type { Metadata } from 'next';

export const siteConfig = {
  name: 'ML Teaching',
  url: 'https://mlteaching.boomapps.de',
  description:
    'Entdecke, wie künstliche Intelligenz lernt: mit Bildern oder durch Ausprobieren und Belohnungen. ML Teaching macht maschinelles Lernen für Kinder verständlich.',
  language: 'de',
  locale: 'de_DE',
} as const;

export const webApplicationId = `${siteConfig.url}/#application`;

const socialImage = {
  url: `${siteConfig.url}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: 'ML Teaching – KI verstehen und ausprobieren',
};

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images: [socialImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [socialImage] },
  };
}
