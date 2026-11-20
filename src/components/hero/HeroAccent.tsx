'use client';

import { useSyncExternalStore } from 'react';
import { HighlightText } from '@animate-ui/react/primitives/texts/highlight';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** The headline stays readable in SSG; Animate UI adds only its highlight after hydration. */
export default function HeroAccent({ text }: { text: string }) {
  const client = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return client ? (
    <HighlightText text={text} className="hero-accent" />
  ) : (
    <span className="hero-accent">{text}</span>
  );
}
