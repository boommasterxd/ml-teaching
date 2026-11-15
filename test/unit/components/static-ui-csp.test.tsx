import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as Icons from '@/components/icons';
import NeuralNetViz from '@/components/NeuralNetViz';
import Button from '@/components/Button';
import AnimatedLink from '@/components/AnimatedLink';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';

describe('strict-CSP static UI', () => {
  it('renders shared action buttons without Motion initial style attributes', () => {
    const markup = renderToStaticMarkup(createElement(Button, null, 'Modell trainieren'));
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    expect(document.querySelector('button')?.textContent).toBe('Modell trainieren');
  });

  it('keeps native action-link semantics in strict-CSP static HTML', () => {
    const markup = renderToStaticMarkup(
      <AnimatedLink href="/lernen" variant="cta" size="lg">
        Jetzt ausprobieren
      </AnimatedLink>,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script, button')).toBeNull();
    expect(document.querySelector('a')?.getAttribute('href')).toBe('/lernen');
    expect(document.querySelector('a')?.textContent).toBe('Jetzt ausprobieren');
  });

  it('includes initial list controls without hidden content or Motion styles', () => {
    const markup = renderToStaticMarkup(
      <AnimatedList>
        <AnimatedListItem key="first" emptyFocus={{ current: null }}>
          <button>Klasse bearbeiten</button>
        </AnimatedListItem>
      </AnimatedList>,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(
      document.querySelector('[style], style, script, [inert], [aria-hidden="true"]'),
    ).toBeNull();
    expect(document.querySelector('button')?.textContent).toBe('Klasse bearbeiten');
  });

  it('renders every shared icon without inline style or script markup', () => {
    const icons: ComponentType<{ className: string; 'aria-hidden': true }>[] = Object.values(Icons);
    for (const Icon of icons) {
      const markup = renderToStaticMarkup(
        createElement(Icon, { className: 'size-5', 'aria-hidden': true }),
      );
      const document = new DOMParser().parseFromString(markup, 'text/html');
      expect(document.querySelector('[style], style, script')).toBeNull();
      expect(document.querySelector('svg')).not.toBeNull();
    }
  });

  it('includes the educational network in static HTML without inline styles', () => {
    const markup = renderToStaticMarkup(createElement(NeuralNetViz));
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    expect(document.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toContain(
      'Neuronales Netz',
    );
    expect(document.body.textContent).toContain('Hundebild zeigen');
    expect(document.body.textContent).toContain('Katzenbild zeigen');
  });
});
