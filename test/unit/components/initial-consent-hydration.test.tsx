import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import ConsentModal from '@/components/modals/ConsentModal';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { AppRouterHost } from '../helpers/app-router-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function InitialConsent() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <h1>Modell trainieren</h1>
      <p role="status">{open ? 'Einwilligung erforderlich' : 'Einwilligung erteilt'}</p>
      <ConsentModal
        isOpen={open}
        onConfirm={() => setOpen(false)}
        onDecline={() => setOpen(false)}
      />
    </>
  );
}

describe('initial consent hydration', () => {
  it('retains the visible server dialog, focuses within it and requires both choices after hydration', async () => {
    const container = document.createElement('div');
    const initialContent = (
      <AppRouterHost>
        <InitialConsent />
      </AppRouterHost>
    );
    container.innerHTML = renderToString(initialContent);
    document.body.append(container);
    const initialDialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    const errors = vi.fn();
    const root = hydrateRoot(container, initialContent, { onRecoverableError: errors });
    try {
      const initialChoice = initialDialog.querySelector<HTMLElement>('[role="checkbox"]')!;
      initialChoice.focus();
      fireEvent.click(initialChoice);
      await act(async () => {});
      expect(container.querySelector('[role="dialog"]')).toBe(initialDialog);
      await waitFor(() => expect(initialDialog.contains(document.activeElement)).toBe(true));
      const choices = within(initialDialog).getAllByRole('checkbox');
      expect(choices[0]).toBe(initialChoice);
      expect(document.activeElement).toBe(choices[0]);
      const confirm = within(initialDialog).getByRole('button', { name: 'Zustimmen' });
      expect((confirm as HTMLButtonElement).disabled).toBe(true);
      expect(choices[0].getAttribute('aria-checked')).toBe('true');
      fireEvent.click(choices[1]);
      expect((confirm as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(confirm);
      expect(initialDialog.isConnected).toBe(false);
      expect(within(container).getByRole('status').textContent).toBe('Einwilligung erteilt');
      expect(errors).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
