'use client';

import { Brain as AnimatedIcon } from '../animated-icon-fallbacks';
import { Brain as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Brain = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
