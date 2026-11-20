import { Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LegalReadingSections from '@/components/LegalReadingSections';

describe('legal reading content preservation', () => {
  it('retains fragment content, heading order, native links and lists in static output', () => {
    const content = (
      <>
        <p>Einleitung mit unverändertem Inhalt.</p>
        <Fragment>
          <h2 id="rights">Deine Rechte</h2>
          <p>
            Schreib an <a href="mailto:privacy@example.org">unsere Kontaktadresse</a>.
          </p>
          <>
            <h3 id="choices">Deine Möglichkeiten</h3>
            <ul>
              <li>Auskunft erhalten</li>
              <li>Einwilligung widerrufen</li>
            </ul>
          </>
        </Fragment>
        <h2 id="contact">Kontakt</h2>
        <p>
          Weitere Angaben im <a href="/impressum#kontakt">Impressum</a>.
        </p>
      </>
    );
    const original = new DOMParser().parseFromString(renderToStaticMarkup(content), 'text/html');
    const grouped = new DOMParser().parseFromString(
      renderToStaticMarkup(<LegalReadingSections>{content}</LegalReadingSections>),
      'text/html',
    );
    expect(grouped.body.textContent).toBe(original.body.textContent);
    expect(grouped.querySelector('h1, [style], style, script, [hidden]')).toBeNull();
    const elements = (document: Document) =>
      Array.from(document.querySelectorAll('h2, h3, p, a, ul, li'), (element) => element.outerHTML);
    expect(elements(grouped)).toEqual(elements(original));
    expect(
      Array.from(grouped.body.children, (section) => section.firstElementChild?.tagName),
    ).toEqual(['P', 'H2', 'H3', 'H2']);
  });
});
