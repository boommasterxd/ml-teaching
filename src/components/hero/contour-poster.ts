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

function contourPreloads(sources: ContourSources) {
  return (['mobile', 'desktop'] as const).map((variant) => {
    const { src, srcSet, sizes } = sources[variant];
    return {
      as: 'image',
      media: contourMedia[variant],
      imageSrcSet: srcSet,
      imageSizes: sizes,
      fetchPriority: 'high',
      src,
    } as const;
  });
}

export function preloadContourPoster(sources: ContourSources) {
  for (const { src, ...options } of contourPreloads(sources)) {
    preload(src, options);
  }
}
