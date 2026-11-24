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

export function preloadContourPoster(
  sources: ContourSources,
  variants: readonly (keyof ContourSources)[] = ['mobile', 'desktop'],
) {
  for (const variant of variants) {
    const { src, srcSet, sizes } = sources[variant];
    preload(src, {
      as: 'image',
      media: contourMedia[variant],
      imageSrcSet: srcSet,
      imageSizes: sizes,
      fetchPriority: 'high',
    });
  }
}
