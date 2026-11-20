import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import Button from '@/components/Button';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { InitialEntryContext } from '@/components/ui/entry-policy';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

function PracticeControl() {
  const [selected, setSelected] = useState(false);
  return (
    <EntryReveal asChild index={2}>
      <Button aria-pressed={selected} onClick={() => setSelected(!selected)}>
        Beispiel auswählen
      </Button>
    </EntryReveal>
  );
}

function MotionAwareInput() {
  const reduced = useShouldReduceMotion();
  return (
    <div>
      <label>
        Beispielname
        <input defaultValue="Beispiel 1" />
      </label>
      <p role="status">{reduced ? 'Bewegung reduziert' : 'Bewegung aktiviert'}</p>
    </div>
  );
}

function installLiveMotionPreference() {
  const events = new EventTarget();
  const media = Object.assign(events, {
    matches: false,
    media: '(prefers-reduced-motion: reduce)',
    addListener(listener: EventListener) {
      events.addEventListener('change', listener);
    },
    removeListener(listener: EventListener) {
      events.removeEventListener('change', listener);
    },
  });
  vi.stubGlobal('matchMedia', () => media);
  return (reduced: boolean) => {
    media.matches = reduced;
    media.dispatchEvent(new Event('change'));
  };
}

describe('entry reveal content and control lifetime', () => {
  beforeEach(installBrowserHost);
  afterEach(() => {
    cleanup();
    restoreBrowserHost();
  });

  it('ships complete native content without inline styles or hidden initial output', () => {
    const markup = renderToStaticMarkup(
      <EntryReveal kind="reading" asChild>
        <section aria-labelledby="reading-title">
          <h2 id="reading-title">Deine Daten</h2>
          <p>Deine Bilder bleiben auf deinem Gerät.</p>
          <a href="/datenschutz">Datenschutz</a>
        </section>
      </EntryReveal>,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(
      document.querySelector('[style], style, script, [hidden], [aria-hidden="true"]'),
    ).toBeNull();
    expect(document.querySelector('section')?.getAttribute('aria-labelledby')).toBe(
      'reading-title',
    );
    expect(document.querySelector('h2')?.textContent).toBe('Deine Daten');
    expect(document.querySelector('p')?.textContent).toBe('Deine Bilder bleiben auf deinem Gerät.');
    expect(document.querySelector('a')?.getAttribute('href')).toBe('/datenschutz');
  });

  it('accepts immediate keyboard focus without replacing a selected product button', () => {
    render(<PracticeControl />);
    const button = screen.getByRole('button', { name: 'Beispiel auswählen' });
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
    expect(screen.getByRole('button', { name: 'Beispiel auswählen' })).toBe(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('preserves typed input and focus when training entry becomes active after navigation', () => {
    const content = (active: boolean) => (
      <InitialEntryContext value={false}>
        <EntryReveal active={active} activation>
          <label>
            Klassenname
            <input defaultValue="Klasse 1" />
          </label>
        </EntryReveal>
      </InitialEntryContext>
    );
    const view = render(content(false));
    const input = screen.getByRole('textbox', { name: 'Klassenname' });
    fireEvent.change(input, { target: { value: 'Meine Katze' } });
    act(() => input.focus());
    view.rerender(content(true));
    expect(screen.getByRole('textbox', { name: 'Klassenname' })).toBe(input);
    expect((input as HTMLInputElement).value).toBe('Meine Katze');
    expect(document.activeElement).toBe(input);
  });

  it('updates live motion preferences both ways without remounting focused child controls', () => {
    const setReducedMotion = installLiveMotionPreference();
    render(
      <EntryReveal>
        <MotionAwareInput />
      </EntryReveal>,
    );
    const input = screen.getByRole('textbox', { name: 'Beispielname' });
    fireEvent.change(input, { target: { value: 'Meine Katze' } });
    act(() => input.focus());
    expect(screen.getByRole('status').textContent).toBe('Bewegung aktiviert');
    for (const reduced of [true, false]) {
      act(() => setReducedMotion(reduced));
      expect(screen.getByRole('status').textContent).toBe(
        reduced ? 'Bewegung reduziert' : 'Bewegung aktiviert',
      );
      expect(screen.getByRole('textbox', { name: 'Beispielname' })).toBe(input);
      expect((input as HTMLInputElement).value).toBe('Meine Katze');
      expect(document.activeElement).toBe(input);
    }
  });
});
