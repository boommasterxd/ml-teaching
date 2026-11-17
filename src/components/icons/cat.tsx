'use client';

import { Cat as AnimatedIcon } from '../animated-icon-fallbacks';
import { Cat as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Cat = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
