'use client';

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { Highlight, HighlightItem } from '@animate-ui/react/primitives/effects/highlight';
import { cn } from '@/lib/utils';

const MenuIntent = createContext<{
  pointer: (value: string | null) => void;
  focus: (value: string | null) => void;
} | null>(null);

function getItemValue({ target, currentTarget }: SyntheticEvent<HTMLDivElement>) {
  if (!(target instanceof Element) || !currentTarget.contains(target)) return null;
  const item = target.closest<HTMLElement>('[data-highlight="true"][data-value]');
  return item?.closest('.menu-highlight-container') === currentTarget
    ? (item.dataset.value ?? null)
    : null;
}

// The upstream positioning styles are supplied by CSS so the initial HTML stays style-free.
function MenuHighlightContainer({ ref, className, children }: ComponentProps<'div'>) {
  const intent = useContext(MenuIntent);
  return (
    <div
      ref={ref}
      data-slot="motion-highlight-container"
      className={cn('menu-highlight-container', className)}
      onPointerOver={(event) => {
        if (event.pointerType !== 'touch') intent?.pointer(getItemValue(event));
      }}
      onPointerOut={(event) => {
        // React portals can remain in the navigation tree after the pointer leaves its DOM.
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) intent?.pointer(null);
      }}
      onFocus={(event) => {
        if (!event.target.matches(':focus-visible')) return;
        const item = getItemValue(event);
        if (!item) return;
        intent?.pointer(null);
        intent?.focus(item);
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.target)) intent?.focus(null);
      }}
    >
      {children}
    </div>
  );
}

export function MenuHighlight({
  current = null,
  insideAnimatedPopup = false,
  children,
}: {
  current?: string | null;
  insideAnimatedPopup?: boolean;
  children: ReactNode;
}) {
  const [pointer, setPointer] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  // A popup scales while opening, so its highlight travels in the rows' own layout space.
  return (
    <MenuIntent value={{ pointer: setPointer, focus: setFocus }}>
      <Highlight
        as={MenuHighlightContainer}
        mode={insideAnimatedPopup ? 'children' : 'parent'}
        controlledItems
        click={false}
        value={pointer ?? focus ?? current}
        className="menu-highlight-surface"
      >
        {insideAnimatedPopup ? (
          <MenuHighlightContainer className="menu-highlight-popup">
            {children}
          </MenuHighlightContainer>
        ) : (
          children
        )}
      </Highlight>
    </MenuIntent>
  );
}

export function MenuHighlightItem({ value, children }: { value: string; children: ReactElement }) {
  return (
    <HighlightItem asChild value={value}>
      {children}
    </HighlightItem>
  );
}
