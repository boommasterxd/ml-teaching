'use client';

import { Square as AnimatedIcon } from '../animated-icon-fallbacks';
import { Square as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Square = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
