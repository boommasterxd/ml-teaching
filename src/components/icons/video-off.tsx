'use client';

import { VideoOff as StaticIcon } from 'lucide-react';
import { VideoOff as AnimatedIcon } from '../animated-icon-fallbacks';
import { clientIcon } from './client-icon';

export const VideoOff = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
