'use client';

import { Car as AnimatedIcon } from '../animated-icon-fallbacks';
import { Car as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Car = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
