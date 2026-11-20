'use client';

import { TriangleAlert as AnimatedIcon } from '../animate-ui/icons/triangle-alert';
import { AlertTriangle as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const AlertTriangle = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
