import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup as renderStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as Icons from '@/components/icons';
import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import { NetworkScene } from '@/components/network/NetworkScene';
import Button from '@/components/Button';
import AnimatedLink from '@/components/AnimatedLink';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import LandingPage from '@/screens/LandingPage';
import ConsentModal from '@/components/modals/ConsentModal';
import ImprintPage from '@/screens/ImprintPage';
import PrivacyPage from '@/screens/PrivacyPage';
import AccessibilityPage from '@/screens/AccessibilityPage';
import { AppRouterHost } from '../helpers/app-router-host';

const renderToStaticMarkup = (ui: ReactNode) =>
  renderStaticMarkup(<AppRouterHost>{ui}</AppRouterHost>);

describe('strict-CSP static UI', () => {
  it('ships complete legal documents with one title and native current-page navigation', () => {
    const pages = [
      [ImprintPage, '/impressum', 'Impressum'],
      [PrivacyPage, '/datenschutz', 'Datenschutzerklärung'],
      [AccessibilityPage, '/barrierefreiheit', 'Barrierefreiheit'],
    ] as const;
    for (const [Page, href, title] of pages) {
      const markup = renderToStaticMarkup(createElement(Page));
      const document = new DOMParser().parseFromString(markup, 'text/html');
      expect(document.querySelector('[style], style, script')).toBeNull();
      expect(document.querySelectorAll('h1')).toHaveLength(1);
      expect(document.querySelector('article h1')?.textContent).toBe(title);
      const navigation = document.querySelector('nav[aria-label="Informationsseiten"]');
      expect(navigation?.querySelectorAll('a')).toHaveLength(3);
      expect(navigation?.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
      expect(navigation?.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe(href);
      expect(document.querySelectorAll('article p').length).toBeGreaterThan(0);
    }
  });

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
    const quiz = document.querySelector('section[aria-labelledby="section-examples"]');
    expect(quiz?.querySelectorAll('button[aria-label^="Auswählen: "]')).toHaveLength(6);
    expect(document.querySelector('.landing-demo img')).toBeNull();
    expect(document.querySelector('.landing-demo [data-slot="empty"]')?.textContent).toBe('Input');
    expect(document.querySelector('button[data-signal=dog]')?.getAttribute('aria-label')).toContain(
      'Hundebild zeigen',
    );
    expect(document.querySelector('button[data-signal=cat]')?.getAttribute('aria-label')).toContain(
      'Katzenbild zeigen',
    );
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
      <AnimatedLink href="/lernen" variant="default" size="lg">
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
    const markup = renderToStaticMarkup(createElement(DeferredNetworkDemo));
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('[data-slot="empty"]')?.textContent).toBe('Input');
    const selectedMarkup = renderToStaticMarkup(<NetworkScene signal="dog" />);
    const selected = new DOMParser().parseFromString(selectedMarkup, 'text/html');
    expect(selected.querySelector('[style], style, script')).toBeNull();
    const image = selected.querySelector('img[alt="Generiertes Beispielbild eines Hundes"]');
    expect(image?.getAttribute('src')).toContain('/_next/image');
    expect(image?.getAttribute('srcset')).toContain('/_next/image');
    for (const label of [
      '01 / Eingabe',
      '02 / Merkmale',
      '03 / Vergleich',
      '04 / Ausgabe',
      'MobileNet',
      'KNN',
    ]) {
      expect(document.body.textContent).toContain(label);
    }
    expect(document.querySelector('button[data-signal="dog"]')?.getAttribute('aria-label')).toBe(
      'Hundebild zeigen',
    );
    expect(document.querySelector('button[data-signal="cat"]')?.getAttribute('aria-label')).toBe(
      'Katzenbild zeigen',
    );
  });
});
