import { Accessibility } from './icons/accessibility';
import { Brain } from './icons/brain';
import { Gavel } from './icons/gavel';
import { Home } from './icons/home';
import { ImagePlus } from './icons/image-plus';
import { Lightbulb } from './icons/lightbulb';
import { LockKeyhole } from './icons/lock-keyhole';
import { Play } from './icons/play';

export const legalPageIcons = {
  imprint: Gavel,
  privacy: LockKeyhole,
  accessibility: Accessibility,
};

export const headerMenuIcons = {
  home: Home,
  hub: Brain,
  images: Lightbulb,
  training: ImagePlus,
  rewards: Lightbulb,
  simulation: Play,
  ...legalPageIcons,
};
