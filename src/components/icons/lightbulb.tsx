'use client';

import { Lightbulb as AnimatedIcon } from '../animate-ui/icons/lightbulb';
import { Lightbulb as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Lightbulb = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
