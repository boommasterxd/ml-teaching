'use client';

import { HighlightText } from '@animate-ui/react/primitives/texts/highlight';
import { useMotionStart } from '../ui/use-motion-start';

/** The headline stays readable in SSG; Animate UI adds only its highlight after hydration. */
export default function HeroAccent({ text }: { text: string }) {
  const motionReady = useMotionStart();
  return motionReady ? (
    <HighlightText text={text} className="hero-accent" />
  ) : (
    <span className="hero-accent">{text}</span>
  );
}
