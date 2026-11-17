'use client';

import { Stethoscope as AnimatedIcon } from '../animated-icon-fallbacks';
import { Stethoscope as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Stethoscope = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
