'use client';

import { Calculator as AnimatedIcon } from '../animated-icon-fallbacks';
import { Calculator as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Calculator = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
