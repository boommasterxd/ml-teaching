import { rewardIntroduction, rewardPracticeComingSoon } from './learning-areas';
import { learningPaths } from '@/lib/learning-paths';

export interface HeaderNavLink {
  id:
    | 'home'
    | 'hub'
    | 'images'
    | 'training'
    | 'rewards'
    | 'simulation'
    | 'imprint'
    | 'privacy'
    | 'accessibility';
  label: string;
  href: string;
  comingSoon?: boolean;
}

export interface HeaderNavGroup {
  label: string;
  links: readonly HeaderNavLink[];
}

export const headerLearningGroups: readonly HeaderNavGroup[] = [
  {
    label: 'Bilderkennung',
    links: [
      { id: 'images', label: 'Wie KI Bilder erkennt', href: learningPaths.images },
      { id: 'training', label: 'Bildmodell trainieren', href: learningPaths.imagePractice },
    ],
  },
  {
    label: 'Reinforcement Learning',
    links: [
      { ...rewardIntroduction, id: 'rewards', label: 'Lernen durch Belohnung' },
      {
        id: 'simulation',
        label: 'Simulation',
        href: learningPaths.qLearningPractice,
        comingSoon: rewardPracticeComingSoon,
      },
    ],
  },
];

export const headerLegalLinks = [
  { id: 'imprint', href: '/impressum', label: 'Impressum' },
  { id: 'privacy', href: '/datenschutz', label: 'Datenschutz' },
  { id: 'accessibility', href: '/barrierefreiheit', label: 'Barrierefreiheit' },
] as const;

export type LegalPage = (typeof headerLegalLinks)[number]['id'];
