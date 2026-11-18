import { learningPaths } from '@/lib/learning-paths';

/** The learning choices pair a home experiment with a next action in the lab. */
export const learningAreas = [
  {
    id: 'images',
    title: 'Bilderkennung',
    explanation:
      'Bilderkennung soll automatisch erkennen, was auf einem Bild zu sehen ist, etwa ein Tier oder ein Gegenstand. Häufig lernt ein Modell aus Beispielbildern mit bekannten Kategorien, welche Merkmale zu welcher Kategorie passen. So kann es neue Bilder zuordnen.',
    description: 'Trainiere ein Modell mit eigenen Beispielbildern und teste es mit neuen Bildern.',
    href: learningPaths.imagePractice,
    action: 'Eigenes Bildmodell trainieren',
  },
  {
    id: 'q-learning',
    title: 'Lernen durch Belohnung',
    explanation:
      'Ziel ist es, mit einer Folge von Aktionen möglichst viel Belohnung zu bekommen. Dazu probiert ein Agent, etwa eine Spielfigur, verschiedene Aktionen in seiner Umgebung aus und lernt aus den Rückmeldungen, welche Entscheidungen sich auf Dauer lohnen.',
    description: 'Entscheide, welches Ziel Punkte bringt, und vergleiche zwei Beispielwege.',
    href: learningPaths.qLearningPractice,
    action: 'Belohnungen ausprobieren',
  },
] as const;
