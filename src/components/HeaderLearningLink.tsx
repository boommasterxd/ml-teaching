'use client';

import { usePathname } from 'next/navigation';
import AnimatedLink from './AnimatedLink';
import { ArrowRight } from './icons/arrow-right';
import { learningPaths } from '@/lib/learning-paths';

/** Keep the learning entry action outside the learning workspace. */
export default function HeaderLearningLink() {
  const pathname = usePathname();
  if (pathname === learningPaths.hub || pathname?.startsWith(`${learningPaths.hub}/`)) return null;

  return (
    <AnimatedLink
      href={learningPaths.hub}
      variant="outline"
      size="default"
      aria-label="Lernlabor öffnen"
    >
      <span className="hidden sm:inline">Lernlabor</span>
      <ArrowRight data-icon="inline-end" aria-hidden="true" />
    </AnimatedLink>
  );
}
