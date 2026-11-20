'use client';

import { Dog as AnimatedIcon } from '../animated-icon-fallbacks';
import { Dog as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Dog = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
