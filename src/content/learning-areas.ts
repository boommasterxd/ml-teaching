import { learningPaths } from '@/lib/learning-paths';

export const comingSoonLabel = 'Coming Soon';
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
      'Bilderkennung soll automatisch erkennen, was auf einem Bild zu sehen ist, etwa ein Tier oder ein Gegenstand. Häufig lernt ein Modell aus Beispielbildern mit bekannten Kategorien, welche Merkmale zu welcher Kategorie passen. So kann es neue Bilder zuordnen.',
    description: 'Trainiere ein Modell mit eigenen Beispielbildern und teste es mit neuen Bildern.',
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
      'Ziel ist es, mit einer Folge von Aktionen möglichst viel Belohnung zu bekommen. Dazu probiert ein Agent, etwa eine Spielfigur, verschiedene Aktionen in seiner Umgebung aus und lernt aus den Rückmeldungen, welche Entscheidungen sich auf Dauer lohnen.',
    description: 'Eine Spielfigur lernt aus Punkten, welche Wege sich lohnen.',
    introduction: rewardIntroduction,
    href: learningPaths.qLearningPractice,
    action: 'Belohnungen ausprobieren',
    comingSoon: rewardPracticeComingSoon,
  },
] as const;
