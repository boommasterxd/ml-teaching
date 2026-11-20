'use client';

import { ImagePlus as AnimatedIcon } from '../animated-icon-fallbacks';
import { ImagePlus as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const ImagePlus = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
