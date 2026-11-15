import type { Metadata } from 'next';

export const siteConfig = {
  name: 'ML Teaching',
  url: 'https://mlteaching.boomapps.de',
  description:
    'Lerne maschinelles Lernen kennen: Trainiere einen Bildklassifikator mit eigenen Beispielen direkt im Browser.',
  language: 'de',
  locale: 'de_DE',
} as const;

const socialImage = {
  url: `${siteConfig.url}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: 'ML Teaching – Bilderkennung im Browser lernen',
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
