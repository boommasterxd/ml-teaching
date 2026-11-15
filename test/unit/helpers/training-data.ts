import type { MLClass, MLImage } from '@/types/ml';

export const makeImage = (id: string): MLImage => ({
  id,
  dataUrl: 'data:image/jpeg;base64,/9j/2Q==',
  featureArray: [1, 0],
});

export function makeClasses(imagesPerClass = 0): MLClass[] {
  return [
    { id: 'red', name: 'Rot', color: '#dc2626' },
    { id: 'blue', name: 'Blau', color: '#2563eb' },
  ].map((cls) => ({
    ...cls,
    images: Array.from({ length: imagesPerClass }, (_, index) => makeImage(`${cls.id}-${index}`)),
  }));
}
