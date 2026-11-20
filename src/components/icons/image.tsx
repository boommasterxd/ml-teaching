'use client';

import { Image as AnimatedIcon } from '../animate-ui/icons/image';
import { Image as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const Image = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
