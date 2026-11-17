'use client';

import { LockKeyhole as AnimatedIcon } from '../animate-ui/icons/lock-keyhole';
import { LockKeyhole as StaticIcon } from 'lucide-react';
import { clientIcon } from './client-icon';

export const LockKeyhole = /* @__PURE__ */ clientIcon(AnimatedIcon, StaticIcon);
