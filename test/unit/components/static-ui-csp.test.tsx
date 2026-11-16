import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as Icons from '@/components/icons';
import NeuralNetViz from '@/components/NeuralNetViz';
import Button from '@/components/Button';
import AnimatedLink from '@/components/AnimatedLink';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import LandingPage from '@/screens/LandingPage';
import ConsentModal from '@/components/modals/ConsentModal';

describe('strict-CSP static UI', () => {
  it('ships the real initial consent content and choices without inline styles or client-only portals', () => {
    const markup = renderToStaticMarkup(
      <ConsentModal isOpen onConfirm={() => {}} onDecline={() => {}} />,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('consent-modal-title');
    expect(dialog?.querySelector('#consent-modal-title')?.textContent).toBe(
      'Einwilligung zur Datenverarbeitung',
    );
    expect(dialog?.querySelectorAll('[role="checkbox"][aria-checked="false"]')).toHaveLength(2);
    expect(dialog?.textContent).toContain('IP-Adresse an Google übertragen');
    expect(dialog?.querySelector('a[href="/datenschutz"]')).not.toBeNull();
    expect(dialog?.querySelectorAll('button[disabled]')).toHaveLength(1);
  });

  it('ships the full landing journey and a static hero without eager interactive surfaces', () => {
    const markup = renderToStaticMarkup(<LandingPage />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script, canvas')).toBeNull();
    expect(document.querySelector('h1')?.textContent).toBe('Du zeigst.Deine KI lernt.');
    expect(document.querySelector('a[href="/lernen"]')?.textContent).toContain(
      'Jetzt ausprobieren',
    );
    expect(document.querySelector('#so-funktionierts')).not.toBeNull();
    expect(document.querySelector('.landing-demo svg[role="img"]')).not.toBeNull();
    expect(document.body.textContent).toContain('Demo starten');
    expect(document.body.textContent).toContain('MobileNet');
  });
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
