import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Link from 'next/link';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PageTransition } from '@/components/animate-ui/components/page-transition';
import { VIEW_TRANSITION_RESET } from '@/lib/view-transition-styles';

vi.mock('next/navigation', () => ({ usePathname: () => '/impressum' }));

describe('static page transition security boundary', () => {
  it('binds the exact installed Motion runtime style to the trusted SSG style producer', () => {
    const source = readFileSync(
      resolve(
        'node_modules/framer-motion/dist/es/components/AnimateView/hooks/use-reset-view-transitions.mjs',
      ),
      'utf8',
    );
    const runtimeStyle = source.match(/style\.textContent = `([^`]+)`;/)?.[1];
    expect(runtimeStyle).toBeTruthy();
    expect(VIEW_TRANSITION_RESET).toBe(runtimeStyle);
  });

  it('keeps complete initial content and native links in static output without style attributes', () => {
    const markup = renderToStaticMarkup(
      <PageTransition effect="flow">
        <h1>Impressum</h1>
        <Link href="/">Startseite</Link>
      </PageTransition>,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], script')).toBeNull();
    expect(document.querySelector('h1')?.textContent).toBe('Impressum');
    expect(document.querySelector('a')?.getAttribute('href')).toBe('/');
    expect(document.querySelector('style')?.textContent).toBe(VIEW_TRANSITION_RESET);
  });
});
