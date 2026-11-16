import { getImageProps } from 'next/image';
import dog from '@/assets/network/dog.webp';
import cat from '@/assets/network/cat.webp';
import type { ExampleSignal } from '@/lib/network-demo';

export type { ExampleSignal } from '@/lib/network-demo';

export const NETWORK_EXAMPLES = {
  dog: { name: 'Hund', src: dog, alt: 'Generiertes Beispielbild eines Hundes' },
  cat: { name: 'Katze', src: cat, alt: 'Generiertes Beispielbild einer Katze' },
} as const;

/** Native responsive image URLs, with CSS owning the strict-CSP initial appearance. */
export function exampleImageProps(signal: ExampleSignal) {
  const example = NETWORK_EXAMPLES[signal];
  const { props } = getImageProps({
    src: example.src,
    alt: example.alt,
    width: 512,
    height: 512,
    sizes: '112px',
  });
  return { ...props, style: undefined };
}
