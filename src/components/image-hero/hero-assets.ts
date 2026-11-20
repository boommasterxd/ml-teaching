import { preload } from 'react-dom';
import { exampleImageProps } from '@/components/network/examples';

export const imageHeroCatSizes = '(min-width: 1024px) 240px, (min-width: 640px) 200px, 45vw';

export function preloadImageHero() {
  for (const image of [exampleImageProps('cat', imageHeroCatSizes), exampleImageProps('dog')]) {
    preload(image.src, { as: 'image', imageSrcSet: image.srcSet, imageSizes: image.sizes });
  }
}
