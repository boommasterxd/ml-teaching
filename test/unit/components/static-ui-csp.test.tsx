import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup as renderStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';
import * as Icons from '@/components/icons';
import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import { NetworkScene } from '@/components/network/NetworkScene';
import Button from '@/components/Button';
import AnimatedLink from '@/components/AnimatedLink';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import LandingPage from '@/screens/LandingPage';
import ImageRecognitionPage from '@/screens/ImageRecognitionPage';
import LearningHubPage from '@/screens/LearningHubPage';
import { learningPaths } from '@/lib/learning-paths';
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

  it('ships the general home with a static hero and native access to the learning hub', () => {
    const markup = renderToStaticMarkup(<LandingPage />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script, canvas')).toBeNull();
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    const hero = document.querySelector('section[aria-labelledby="hero-title"]');
    expect(hero?.querySelector(`a[href="${learningPaths.hub}"]`)?.textContent).toContain(
      'Zum Lernlabor',
    );
    expect(hero?.querySelector('a[href="#lernbereiche"]')?.textContent).toContain(
      'Mini-Experimente ansehen',
    );
    const journey = [
      'hero-title',
      'home-ai-title',
      'home-purpose-title',
      'home-experiments-title',
      'home-images-title',
      'home-q-learning-title',
    ];
    const readingOrder = Array.from(document.querySelectorAll('section[aria-labelledby]'))
      .map((section) => section.getAttribute('aria-labelledby') ?? '')
      .filter((title) => journey.includes(title));
    expect(readingOrder).toEqual(journey);
    const experiments = document.querySelector('#lernbereiche');
    assert.ok(experiments);
    expect(experiments.querySelector('h2#home-experiments-title')?.textContent).toBe(
      'Zwei Arten, wie KI lernt',
    );
    const images = experiments.querySelector('section[aria-labelledby="home-images-title"]');
    assert.ok(images);
    expect(images.querySelector('h3#home-images-title')?.textContent).toBe('Bilderkennung');
    const reinforcement = experiments.querySelector('#reinforcement-learning');
    assert.ok(reinforcement);
    expect(reinforcement.querySelector('h3#home-q-learning-title')?.textContent).toBe(
      'Lernen durch Belohnung',
    );
    expect(reinforcement.textContent).toContain('Reinforcement Learning');
    expect(images.querySelector('h4')?.textContent).toBe('Willst du es selbst ausprobieren?');
    expect(images.querySelector(`a[href="${learningPaths.imagePractice}"]`)?.textContent).toContain(
      'Eigenes Bildmodell trainieren',
    );
    const rewardButton = reinforcement.querySelector('button[disabled]');
    assert.ok(rewardButton);
    expect(rewardButton.textContent).toContain('Belohnungen ausprobieren');
    expect(
      document.getElementById(rewardButton.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toBe('Coming Soon');
    expect(experiments.querySelector(`a[href="${learningPaths.qLearningPractice}"]`)).toBeNull();
    expect(
      experiments.querySelector('button:not([disabled]), [role="status"], [aria-live]'),
    ).toBeNull();
  });

  it('ships the learning choices and introductions without consent or client-only navigation', () => {
    const markup = renderToStaticMarkup(<LearningHubPage />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script, canvas, [role="dialog"]')).toBeNull();
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    for (const [path, label] of [
      [learningPaths.imagePractice, 'Eigenes Bildmodell trainieren'],
      [learningPaths.images, 'Bilderkennung verstehen'],
      [learningPaths.qLearningPractice, 'Belohnungen ausprobieren'],
    ]) {
      expect(document.querySelector(`a[href="${path}"]`)?.textContent).toContain(label);
    }
    expect(document.querySelector(`a[href="${learningPaths.qLearning}"]`)).toBeNull();
  });

  it('ships the complete image explanation and local exercises before hydration', () => {
    const markup = renderToStaticMarkup(<ImageRecognitionPage />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script, canvas, [role="dialog"]')).toBeNull();
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    const hero = document.querySelector('#image-learning-hero');
    const readingOrder = Array.from(document.querySelectorAll('.landing-page > section'))
      .map((section) => section.getAttribute('aria-labelledby'))
      .slice(0, 4);
    expect(readingOrder).toEqual([
      'image-learning-title',
      'section-explanation',
      'section-neural-net',
      'section-steps',
    ]);
    expect(hero?.querySelector('h1')?.textContent?.trim()).toBeTruthy();
    expect(hero?.querySelector(`a[href="${learningPaths.hub}"]`)).not.toBeNull();
    expect(hero?.querySelector(`a[href="${learningPaths.imagePractice}"]`)?.textContent).toContain(
      'Eigenes Bildmodell trainieren',
    );
    const photos = hero?.querySelectorAll('img');
    expect(photos).toHaveLength(2);
    for (const photo of photos ?? []) {
      expect(photo.getAttribute('src')).toContain('/_next/image');
      expect(photo.getAttribute('srcset')).toContain('/_next/image');
    }
    expect(
      document.querySelector(`.landing-cta a[href="${learningPaths.imagePractice}"]`)?.textContent,
    ).toContain('Jetzt ausprobieren');
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
    expect(document.querySelector('section[aria-labelledby="section-knn-quiz"]')).not.toBeNull();
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
