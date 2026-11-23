import { COLORS, type MLClass } from '@/types/ml';

export function createInitialTrainingClasses(): MLClass[] {
  return [0, 1].map((index) => ({
    id: `class-${index + 1}`,
    name: `Klasse ${index + 1}`,
    color: COLORS[index],
    images: [],
  }));
}
