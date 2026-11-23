'use client';

import { useCallback, useRef, type ComponentProps, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { learningPaths } from '@/lib/learning-paths';
import { prepareRoute } from './prepare-route';
import { useTrainingEntry } from './training/TrainingEntryContext';

type IntentLinkProps = ComponentProps<typeof Link> & {
  prepareOnIntent?: boolean;
  onTrainingEntry?: (link: HTMLAnchorElement) => HTMLElement | null;
};
const forwardNavigation = ['nav-forward'];

function prepareDocument(anchor: HTMLAnchorElement, target: URL) {
  if (
    !HTMLScriptElement.supports?.('speculationrules') ||
    (anchor.target && anchor.target !== '_self') ||
    anchor.hasAttribute('download')
  )
    return;

  const previous = document.querySelector<HTMLAnchorElement>('a[data-recovery-intent]');
  if (previous === anchor) return;
  previous?.removeAttribute('data-recovery-intent');
  anchor.dataset.recoveryIntent = target.pathname === '/' && !target.search ? 'home' : 'page';
}

function startsTraining(target: URL, current: Location) {
  return (
    target.origin === current.origin &&
    target.pathname === learningPaths.imagePractice &&
    current.pathname !== learningPaths.imagePractice
  );
}

/** Native navigation warms its route payload only after pointer, keyboard or touch intent. */
export default function IntentLink({
  onClick,
  onPointerEnter,
  onFocus,
  onPointerDown,
  onNavigate,
  onTrainingEntry,
  prepareOnIntent = true,
  ...props
}: IntentLinkProps) {
  const router = useRouter();
  const entry = useTrainingEntry();
  const activatedLink = useRef<HTMLAnchorElement | null>(null);
  const prepare = useCallback(
    (event: SyntheticEvent<HTMLAnchorElement>) => {
      if (!prepareOnIntent || event.defaultPrevented) return;
      const anchor = event.currentTarget;
      const target = new URL(anchor.href);
      const current = window.location;
      if (
        !['http:', 'https:'].includes(target.protocol) ||
        target.origin !== current.origin ||
        (target.pathname === current.pathname && target.search === current.search)
      )
        return;
      // The Pages Router cannot warm an App Router destination's document.
      if (document.getElementById('error-recovery-speculation')) {
        prepareDocument(anchor, target);
        return;
      }
      const path = target.pathname + target.search;
      prepareRoute(router, path.startsWith('//') ? target.origin + path : path, target.pathname);
      if (startsTraining(target, current)) entry?.prepareEntry();
    },
    [entry, prepareOnIntent, router],
  );

  const navigate: IntentLinkProps['onNavigate'] = (event) => {
    const anchor = activatedLink.current;
    activatedLink.current = null;
    if (!entry || !anchor || !startsTraining(new URL(anchor.href), window.location)) {
      onNavigate?.(event);
      return;
    }
    let cancelled = false;
    onNavigate?.({
      preventDefault() {
        cancelled = true;
        event.preventDefault();
      },
    });
    if (cancelled) return;
    event.preventDefault();
    entry.openEntry(onTrainingEntry ? onTrainingEntry(anchor) : anchor);
  };

  return (
    <Link
      transitionTypes={forwardNavigation}
      {...props}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        activatedLink.current = event.defaultPrevented ? null : event.currentTarget;
      }}
      onNavigate={navigate}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        prepare(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        prepare(event);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        prepare(event);
      }}
    />
  );
}
