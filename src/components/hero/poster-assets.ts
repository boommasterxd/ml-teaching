import { getImageProps, type StaticImageData } from 'next/image';
import digitsDesktop from '@/assets/hero/error-glass-404.webp';
import digitsMobile from '@/assets/hero/error-glass-404-mobile.webp';
import ringDesktop from '@/assets/hero/hero-glass.webp';
import ringMobile from '@/assets/hero/hero-glass-mobile.webp';

import { reducedMotionMedia } from '@/lib/media-queries';
import {
  contourMedia,
  preloadContourPoster,
  type ContourSources,
  type PosterVariants,
} from './contour-poster';

type PosterSource = { src: StaticImageData; width: number; height: number };

const ringPoster = {
  mobile: { src: ringMobile, width: 615, height: 500 },
  desktop: { src: ringDesktop, width: 954, height: 900 },
};
const digitsPoster = {
  mobile: { src: digitsMobile, width: 720, height: 360 },
  desktop: { src: digitsDesktop, width: 1200, height: 600 },
};

function optimizedPoster(image: PosterSource, sizes: string) {
  const {
    props: { src, srcSet },
  } = getImageProps({ ...image, sizes, alt: '' });
  const candidates = srcSet?.split(', ');
  // Next's optimizer does not enlarge raster sources. Keep the first candidate
  // that reaches full resolution and share that URL at higher display densities.
  const largest = candidates?.findIndex((candidate) => {
    const descriptor = candidate.split(' ').at(-1);
    return descriptor?.endsWith('w') && Number.parseInt(descriptor, 10) >= image.width;
  });
  const capped =
    largest !== undefined && largest >= 0 ? candidates?.slice(0, largest + 1) : undefined;
  const optimizedSrcSet = capped?.join(', ') ?? srcSet;
  return {
    src: capped?.at(-1)?.split(' ')[0] ?? src,
    ...(optimizedSrcSet && { srcSet: optimizedSrcSet }),
    sizes,
    width: image.width,
    height: image.height,
  };
}

function optimizedVariants(sources: PosterVariants<PosterSource>, sizes: PosterVariants<string>) {
  return {
    mobile: optimizedPoster(sources.mobile, sizes.mobile),
    desktop: optimizedPoster(sources.desktop, sizes.desktop),
  };
}

export const heroPosterImages = /* @__PURE__ */ optimizedVariants(ringPoster, {
  mobile: 'min(calc(100vw - max(2.5rem, 10vw)), 47svh, 34rem)',
  desktop: 'min(46vw, 36.71rem)',
});

// Match the padding, grid columns and maximum artwork widths in public-error.css.
export const errorRingPosterImages = /* @__PURE__ */ optimizedVariants(ringPoster, {
  mobile: 'min(calc(100vw - max(2.5rem, 10vw)), 35rem)',
  desktop: 'min(45.15vw, 35rem)',
});

export const errorDigitsPosterImages = /* @__PURE__ */ optimizedVariants(digitsPoster, {
  mobile: 'min(calc(100vw - max(2.5rem, 10vw)), 37.5rem)',
  desktop: 'min(49.45vw, 37.5rem)',
});

export function preloadHeroPoster(variant: keyof ContourSources) {
  preloadContourPoster(
    heroPosterImages,
    variant,
    `${contourMedia[variant]} and ${reducedMotionMedia}`,
  );
}
