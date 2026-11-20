import { preload } from 'react-dom';

export const contourMedia = {
  mobile: '(width < 48rem)',
  desktop: '(width >= 48rem)',
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

export function contourPreloads(sources: ContourSources) {
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
