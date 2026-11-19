import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ErrorPage from '@/app/error';
import { AppRouterHost } from '../helpers/app-router-host';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function RetryJourney() {
  const [recovered, setRecovered] = useState(false);
  return recovered ? (
    <h1>Modell trainieren</h1>
  ) : (
    <ErrorPage error={new Error('Synthetic route failure')} reset={() => setRecovered(true)} />
  );
}

describe('route error recovery', () => {
  it('lets the user retry a failed page and return to its content', () => {
    render(
      <AppRouterHost>
        <RetryJourney />
      </AppRouterHost>,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'Diese Seite konnte nicht geladen werden',
    );
    expect(screen.getByRole('link', { name: 'Zur Startseite' }).getAttribute('href')).toBe('/');
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Modell trainieren' })).toBeTruthy();
  });
});
