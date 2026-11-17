import { learningPaths } from '@/lib/learning-paths';

/** Shared descriptions and actions for the home sections and learning-area selection. */
export const learningAreas = [
  {
    id: 'images',
    title: 'Bilderkennung',
    description:
      'Wie erkennt eine KI eine Tasse oder einen Stift? Du gibst ihr Beispielbilder und testest, ob sie neue Bilder richtig zuordnet. Dafür gibt es viele Verfahren, zum Beispiel tiefe neuronale Netze. Eine verwandte Aufgabe ist Anomalieerkennung: Sie sucht ungewöhnliche Abweichungen, etwa einen Riss in einem Bauteil. Hier liefert das vortrainierte Netz MobileNet die Bildmerkmale. KNN vergleicht sie mit deinen Beispielen und ordnet das Bild einer Gruppe zu.',
    steps: [
      'Eigene Gruppen anlegen und Bilder mit der Kamera aufnehmen oder hochladen.',
      'Dein Modell trainieren und seine Vorhersagen mit neuen Bildern testen.',
      'Weitere Beispiele ergänzen und beobachten, was sich am Ergebnis verändert.',
    ],
    href: learningPaths.images,
    action: 'Bilderkennung selbst ausprobieren',
  },
  {
    id: 'q-learning',
    title: 'Reinforcement Learning',
    description:
      'Wie lernt eine KI, sich in einer Welt wie Minecraft zurechtzufinden? Stell dir eine Spielfigur vor, die einen sicheren Weg zu einem Ziel sucht. Sie probiert Schritte aus, bekommt für hilfreiche Aktionen Belohnungen und lernt daraus. Beim Q-Learning hält eine Q-Tabelle fest, welche Schritte in welcher Situation Erfolg versprechen.',
    steps: [
      'Ziele und Belohnungen für eine Spielfigur festlegen.',
      'Ihre Entscheidungen und die Werte in der Q-Tabelle verfolgen.',
      'Andere Belohnungen ausprobieren und vergleichen, welchen Weg sie lernt.',
    ],
    href: learningPaths.qLearning,
    action: 'Q-Learning selbst ausprobieren',
  },
] as const;
