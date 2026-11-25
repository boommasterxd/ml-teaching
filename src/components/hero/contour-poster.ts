import { preload } from 'react-dom';
import { belowMediumViewport, mediumViewport } from '@/lib/media-queries';

export const contourMedia = {
  mobile: belowMediumViewport,
  desktop: mediumViewport,
} as const;

export type PosterVariants<T> = Record<keyof typeof contourMedia, T>;

interface ContourSource {
  src: string;
  srcSet?: string;
  sizes: string;
  width: number;
  height: number;
}

export type ContourSources = PosterVariants<ContourSource>;

export function contourPosterPreload(sources: ContourSources, variant: keyof ContourSources) {
  const { src, srcSet, sizes } = sources[variant];
  return {
    href: srcSet ? undefined : src,
    as: 'image',
    media: contourMedia[variant],
    imageSrcSet: srcSet,
    imageSizes: sizes,
    fetchPriority: 'high',
  } as const;
}

export function preloadContourPoster(sources: ContourSources, variant: keyof ContourSources) {
  preload(sources[variant].src, contourPosterPreload(sources, variant));
}
