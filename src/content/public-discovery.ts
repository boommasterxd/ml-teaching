import { learningPaths } from '@/lib/learning-paths';
import { siteConfig } from '@/lib/site';

export const publicDiscoveryDescription =
  'Ein deutschsprachiges Lernprojekt für Kinder: KI verstehen und ausprobieren. Entdecke Bilderkennung und Lernen durch Belohnung anhand von Beispielen.';

export const publicDiscoverySections = [
  {
    title: 'Anwendung',
    pages: [
      {
        path: '/',
        title: 'Startseite',
        description:
          'Allgemeiner Einstieg in maschinelles Lernen mit Beispielen, Aktionen und Belohnungen.',
      },
      {
        path: learningPaths.hub,
        title: 'Lernlabor',
        description:
          'Bildmodelle mit eigenen Fotos trainieren und über die Wirkung von Belohnungen nachdenken. Erklärung und Übung zu Q-Learning sind angekündigt.',
      },
      {
        path: learningPaths.images,
        title: 'Bilderkennung verstehen',
        description: 'Bildverarbeitung als Animation, MobileNet und KNN sowie interaktive Quizze.',
      },
      {
        path: learningPaths.imagePractice,
        title: 'Bildmodell trainieren',
        description:
          'Interaktive Bildklassifikation mit Kamera oder eigenen Bildern. Wenn du zustimmst, lädt dein Browser das vortrainierte Modell MobileNetV2 über Dienste von Google und Kaggle. Training und Bilderkennung laufen in deinem Browser.',
      },
    ],
  },
  {
    title: 'Kontakt und rechtliche Informationen',
    pages: [
      {
        path: '/impressum',
        title: 'Impressum',
        description: 'Betreiber und Kontakt.',
      },
      {
        path: '/datenschutz',
        title: 'Datenschutzerklärung',
        description:
          'Hinweise zur Verarbeitung von Zugriffsdaten, zum Modell-Download und zur lokalen Bildverarbeitung.',
      },
      {
        path: '/barrierefreiheit',
        title: 'Barrierefreiheit',
        description: 'Maßnahmen und Kontakt für Rückmeldungen zur Zugänglichkeit.',
      },
    ],
  },
];

export function publicDiscoveryUrl(path: string) {
  return new URL(path, siteConfig.url);
}
