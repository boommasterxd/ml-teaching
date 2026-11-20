'use client';

import { CircleAlert as AnimatedIcon } from '../animate-ui/icons/circle-alert';
import { AlertCircle as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const AlertCircle = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
