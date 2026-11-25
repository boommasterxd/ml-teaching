import { learningPaths } from '@/lib/learning-paths';

export const rewardPracticeComingSoon = true;
export const rewardIntroduction = {
  href: learningPaths.qLearning,
  label: 'Q-Learning verstehen',
  comingSoon: true,
} as const;

/** The learning choices pair a home experiment with a next action in the lab. */
export const learningAreas = [
  {
    id: 'images',
    title: 'Bilderkennung',
    explanation:
      'Ein Modell lernt aus Beispielen, woran es etwa Hunde und Katzen erkennt. Dann kann es neue Bilder zuordnen.',
    description: 'Trainiere ein Modell mit deinen Bildern. Teste es mit neuen Bildern.',
    introduction: {
      href: learningPaths.images,
      label: 'Bilderkennung verstehen',
      comingSoon: false,
    },
    href: learningPaths.imagePractice,
    action: 'Eigenes Bildmodell trainieren',
    comingSoon: false,
  },
  {
    id: 'q-learning',
    title: 'Lernen durch Belohnung',
    explanation:
      'Eine Spielfigur probiert verschiedene Wege aus. Aus den Punkten lernt sie, welche Wege sich lohnen.',
    description: 'Eine Spielfigur lernt aus Punkten, welche Wege sich lohnen.',
    introduction: rewardIntroduction,
    href: learningPaths.qLearningPractice,
    action: 'Belohnungen ausprobieren',
    comingSoon: rewardPracticeComingSoon,
  },
] as const;
