'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLinkStatus } from 'next/link';
import { AnimatePresence } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';
import { Spinner } from './ui/spinner';
import { useMotionPreference } from './ui/use-motion-preference';

export type LinkIcon = { content: ReactNode; position: 'start' | 'end' };

function SpinnerBeforeLabel() {
  const { reduce } = useMotionPreference();
  const fade = useTempoTransition(motionTokens.transition.fade);
  const hidden = { width: 0, opacity: 0 };
  return (
    <Effect
      asChild
      initial={reduce ? false : hidden}
      animate={{ width: '1.5rem', opacity: 1 }}
      exit={hidden}
      transition={reduce ? { duration: 0 } : fade}
    >
      <span
        data-icon="inline-start"
        aria-hidden="true"
        className="inline-flex overflow-clip align-[-0.125em]"
      >
        <Spinner aria-hidden="true" />
      </span>
    </Effect>
  );
}

export function LinkNavigationContent({
  icon,
  children,
  trainingPending,
  documentPending,
}: {
  icon?: LinkIcon;
  children: ReactNode;
  trainingPending: boolean;
  documentPending: boolean;
}) {
  const linkStatus = useLinkStatus();
  const pending = !trainingPending && (linkStatus.pending || documentPending);
  const [delayed, setDelayed] = useState(false);
  if (!pending && delayed) setDelayed(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setDelayed(true), 100);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const loading = trainingPending || (pending && delayed);
  const announcement =
    pending &&
    createPortal(
      <span role="status" className="sr-only">
        {loading && 'Seite wird geladen …'}
      </span>,
      document.body,
    );
  if (!icon)
    return (
      <span className="min-w-0">
        <AnimatePresence>{loading && <SpinnerBeforeLabel key="spinner" />}</AnimatePresence>
        {children}
        {announcement}
      </span>
    );

  const indicator = (
    <span
      data-slot="link-icon"
      data-icon={`inline-${icon.position}`}
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center align-middle [&>*]:col-start-1 [&>*]:row-start-1 [&:has(>[data-slot=spinner])>[data-link-glyph]]:invisible"
    >
      <span data-link-glyph="" className="inline-grid">
        {icon.content}
      </span>
      {loading && <Spinner aria-hidden="true" />}
    </span>
  );
  return (
    <>
      {icon.position === 'start' && indicator}
      {children}
      {icon.position === 'end' && indicator}
      {announcement}
    </>
  );
}
