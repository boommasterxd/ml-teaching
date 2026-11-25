'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { learningPaths } from '@/lib/learning-paths';
import { LinkNavigationContent, type LinkIcon } from './LinkNavigationIndicator';
import { prepareRoute } from './prepare-route';
import { useTrainingEntry, type TrainingEntryOptions } from './training/TrainingEntryContext';

type IntentLinkProps = ComponentProps<typeof Link> & {
  prepareOnIntent?: boolean;
  onTrainingEntry?: (link: HTMLAnchorElement) => TrainingEntryOptions;
  navigationIcon?: LinkIcon;
};
const forwardNavigation = ['nav-forward'];
const touchIntentDelay = 80;

function useTouchPreparation(prepare: (anchor: HTMLAnchorElement) => void) {
  const touch = useRef<{ pointerId: number; timer?: number } | null>(null);
  const cancel = useCallback(() => {
    if (touch.current) window.clearTimeout(touch.current.timer);
    touch.current = null;
  }, []);
  useEffect(() => cancel, [cancel, prepare]);

  function start(event: PointerEvent<HTMLAnchorElement>, prepareImmediately: boolean) {
    if (event.isPrimary === false) return;
    cancel();
    const anchor = event.currentTarget;
    const href = anchor.href;
    const contact: NonNullable<typeof touch.current> = { pointerId: event.pointerId };
    touch.current = contact;
    if (prepareImmediately) {
      prepare(anchor);
    } else {
      contact.timer = window.setTimeout(() => {
        if (anchor.isConnected && anchor.href === href) prepare(anchor);
      }, touchIntentDelay);
    }
  }

  function release(event: PointerEvent<HTMLAnchorElement>) {
    const contact = touch.current;
    if (!contact || event.pointerId !== contact.pointerId) return;
    window.clearTimeout(contact.timer);
    // Touch activation can move focus between pointerup and click.
    contact.timer = window.setTimeout(cancel, touchIntentDelay);
  }

  return {
    start,
    release,
    cancel,
    cancelPointer: (event: PointerEvent<HTMLAnchorElement>) => {
      if (touch.current?.pointerId === event.pointerId) cancel();
    },
    hasTouch: () => touch.current !== null,
  };
}

function prepareDocument(anchor: HTMLAnchorElement, target: URL) {
  if (
    !HTMLScriptElement.supports?.('speculationrules') ||
    (anchor.target && anchor.target !== '_self') ||
    anchor.hasAttribute('download') ||
    target.search ||
    target.hash
  )
    return;

  const previous = document.querySelector<HTMLAnchorElement>('a[data-recovery-intent]');
  if (previous === anchor) return;
  previous?.removeAttribute('data-recovery-intent');
  anchor.dataset.recoveryIntent = '';
}

function startsTraining(target: URL, current: Location) {
  return (
    target.origin === current.origin &&
    target.pathname === learningPaths.imagePractice &&
    current.pathname !== learningPaths.imagePractice
  );
}

function skipActivePageTransition(target: URL, current: Location) {
  if (target.origin !== current.origin || target.pathname === current.pathname) return;
  const transition = document.activeViewTransition;
  if (!transition?.types?.size) return;
  // React waits for its previous view transition before committing the next route.
  if ([...transition.types].every((type) => type === 'nav-forward' || type === 'nav-back'))
    transition.skipTransition();
}

function useLinkPreparation(
  router: ReturnType<typeof useRouter>,
  prepareOnIntent: boolean,
  prepareEntry?: () => void,
) {
  return useCallback(
    (anchor: HTMLAnchorElement) => {
      if (!prepareOnIntent) return;
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
      if (startsTraining(target, current)) prepareEntry?.();
    },
    [prepareEntry, prepareOnIntent, router],
  );
}

function useDocumentNavigationPending() {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const clear = () => setPending(false);
    window.addEventListener('pageshow', clear);
    window.navigation?.addEventListener('navigateerror', clear);
    return () => {
      window.removeEventListener('pageshow', clear);
      window.navigation?.removeEventListener('navigateerror', clear);
    };
  }, [pending]);
  return [pending, setPending] as const;
}

/** Native navigation warms its route payload only after pointer, keyboard or touch intent. */
export default function IntentLink({
  onClick,
  onPointerEnter,
  onFocus,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onNavigate,
  onTrainingEntry,
  navigationIcon,
  children,
  id,
  prepareOnIntent = true,
  ...props
}: IntentLinkProps) {
  const router = useRouter();
  const entry = useTrainingEntry();
  const generatedId = useId();
  const linkId = id ?? (navigationIcon ? generatedId : undefined);
  const pending = linkId !== undefined && entry?.pendingTrigger?.id === linkId;
  const prepareEntry = entry?.prepareEntry;
  const [documentPending, setDocumentPending] = useDocumentNavigationPending();
  const activatedLink = useRef<HTMLAnchorElement | null>(null);
  const prepare = useLinkPreparation(router, prepareOnIntent, prepareEntry);
  const touch = useTouchPreparation(prepare);

  const navigate: IntentLinkProps['onNavigate'] = (event) => {
    const anchor = activatedLink.current;
    activatedLink.current = null;
    let cancelled = false;
    onNavigate?.({
      preventDefault() {
        cancelled = true;
        event.preventDefault();
      },
    });
    if (cancelled || !anchor) return;
    const target = new URL(anchor.href);
    const current = window.location;
    if (!entry || !startsTraining(target, current)) {
      // Next's Pages Router Link does not expose useLinkStatus.
      if (document.getElementById('error-recovery-speculation')) setDocumentPending(true);
      else skipActivePageTransition(target, current);
      return;
    }
    event.preventDefault();
    if (onTrainingEntry) entry.openEntry(anchor, onTrainingEntry(anchor));
    else entry.openEntry(anchor);
  };

  return (
    <Link
      transitionTypes={forwardNavigation}
      {...props}
      id={linkId}
      aria-busy={pending || props['aria-busy']}
      prefetch={false}
      onClick={(event) => {
        touch.cancel();
        onClick?.(event);
        activatedLink.current = event.defaultPrevented ? null : event.currentTarget;
      }}
      onNavigate={navigate}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType !== 'touch' && !event.defaultPrevented) prepare(event.currentTarget);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!touch.hasTouch() && !event.defaultPrevented) prepare(event.currentTarget);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!prepareOnIntent || event.defaultPrevented) return;
        const anchor = event.currentTarget;
        if (event.pointerType !== 'touch') {
          prepare(anchor);
          return;
        }
        // The training dialog intercepts activation, so its route can warm during setup.
        const opensTraining = Boolean(
          entry && startsTraining(new URL(anchor.href), window.location),
        );
        touch.start(event, opensTraining);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        touch.release(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        touch.cancelPointer(event);
      }}
    >
      <LinkNavigationContent
        icon={navigationIcon}
        trainingPending={pending}
        documentPending={documentPending}
      >
        {children}
      </LinkNavigationContent>
    </Link>
  );
}
