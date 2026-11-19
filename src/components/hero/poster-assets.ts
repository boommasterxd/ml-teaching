import { getImageProps } from 'next/image';
import { preload } from 'react-dom';

export const contourMedia = {
  mobile: '(width < 48rem)',
  desktop: '(width >= 48rem)',
} as const;

type PosterSource = { src: string; width: number; height: number };
type PosterVariants<T> = Record<keyof typeof contourMedia, T>;

const ringPoster = {
  mobile: { src: '/hero-glass-mobile.webp', width: 615, height: 500 },
  desktop: { src: '/hero-glass.webp', width: 954, height: 900 },
};

const digitsPoster = {
  mobile: { src: '/error-glass-404-mobile.webp', width: 720, height: 360 },
  desktop: { src: '/error-glass-404.webp', width: 1200, height: 600 },
};

function optimizedPoster(source: PosterSource, sizes: string) {
  const {
    props: { src, srcSet },
  } = getImageProps({ ...source, sizes, alt: '' });
  return { ...source, src, srcSet, sizes };
}

export type ContourSources = PosterVariants<ReturnType<typeof optimizedPoster>>;

function optimizedVariants(sources: PosterVariants<PosterSource>, sizes: PosterVariants<string>) {
  return {
    mobile: optimizedPoster(sources.mobile, sizes.mobile),
    desktop: optimizedPoster(sources.desktop, sizes.desktop),
  };
}

export const heroPosterImages = optimizedVariants(ringPoster, {
  mobile: 'min(calc(100vw - max(2.5rem, 10vw)), 47svh, 34rem)',
  desktop: 'min(46vw, 36.71rem)',
});

// Match the padding, grid columns and maximum artwork widths in public-error.css.
export const errorRingPosterImages = optimizedVariants(ringPoster, {
  mobile: 'min(calc(100vw - max(2.5rem, 10vw)), 35rem)',
  desktop: 'min(45.15vw, 35rem)',
});

export const errorDigitsPosterImages = optimizedVariants(digitsPoster, {
  mobile: 'min(calc(100vw - max(2.5rem, 10vw)), 37.5rem)',
  desktop: 'min(49.45vw, 37.5rem)',
});

export function preloadContourPoster(sources: ContourSources) {
  for (const variant of ['mobile', 'desktop'] as const) {
    const image = sources[variant];
    preload(image.src, {
      as: 'image',
      media: contourMedia[variant],
      imageSrcSet: image.srcSet,
      imageSizes: image.sizes,
      fetchPriority: 'high',
    });
  }
}

export function preloadHeroPoster() {
  preloadContourPoster(heroPosterImages);
}
