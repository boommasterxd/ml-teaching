import { describe, expect, it } from 'vitest';
import { pageMetadata } from '@/lib/site';

describe('pageMetadata', () => {
  it('keeps a complete social preview when page metadata replaces the root metadata', () => {
    const metadata = pageMetadata(
      'Modell trainieren',
      'Bilderkennung im Browser lernen.',
      '/lernen',
    );
    const image = {
      url: 'https://mlteaching.boomapps.de/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'ML Teaching – Bilderkennung im Browser lernen',
    };

    expect(metadata).toMatchObject({
      title: 'Modell trainieren',
      description: 'Bilderkennung im Browser lernen.',
      alternates: { canonical: '/lernen' },
      openGraph: {
        title: 'Modell trainieren',
        description: 'Bilderkennung im Browser lernen.',
        url: '/lernen',
        images: [image],
      },
      twitter: { card: 'summary_large_image', images: [image] },
    });
  });
});
