'use client';

import { SwitchCamera as AnimatedIcon } from '../animated-icon-fallbacks';
import { SwitchCamera as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const SwitchCamera = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
