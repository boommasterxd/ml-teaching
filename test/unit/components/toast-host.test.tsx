import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ToastHost from '@/components/ToastHost';
import * as toastLoader from '@/components/toast-loader';
import { toast } from '@/lib/toast';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

describe('global notifications', () => {
  beforeEach(() => {
    installBrowserHost();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    vi.mocked(window.matchMedia).mockReturnValue({ ...motion, matches: true });
  });
  afterEach(restoreBrowserHost);

  it('delivers the first notification when the viewport loads and lets users dismiss it', async () => {
    render(<ToastHost />);
    const region = { name: 'Mitteilungen' };
    expect(screen.queryByRole('region', region)).toBeNull();

    act(() => toast.error('Kamera nicht verfügbar'));
    const viewport = await screen.findByRole('region', region);
    const notices = within(viewport);
    expect(await notices.findByRole('dialog', { name: 'Kamera nicht verfügbar' })).toBeDefined();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'F6' });
    expect(document.activeElement).toBe(viewport);
    fireEvent.click(notices.getByRole('button', { name: 'Meldung schließen' }));
    await waitFor(() =>
      expect(notices.queryByRole('dialog', { name: 'Kamera nicht verfügbar' })).toBeNull(),
    );

    act(() => toast.success('Modell trainiert'));
    expect(await notices.findByRole('dialog', { name: 'Modell trainiert' })).toBeDefined();
  });

  it('retains only recent distinct notifications while the viewport is unavailable', async () => {
    toast.info('Kamera wird gestartet', { id: 'camera' });
    toast.info('Ältester Hinweis');
    toast.info('Auswahl gespeichert');
    toast.error('Kamerazugriff verweigert', { id: 'camera' });
    toast.success('Bilder hinzugefügt');

    render(<ToastHost />);
    const notices = within(await screen.findByLabelText('Mitteilungen'));
    expect(await notices.findByText('Kamerazugriff verweigert')).toBeDefined();
    expect(notices.getByText('Bilder hinzugefügt')).toBeDefined();
    expect(notices.getByText('Auswahl gespeichert')).toBeDefined();
    expect(notices.queryByText('Kamera wird gestartet')).toBeNull();
    expect(notices.queryByText('Ältester Hinweis')).toBeNull();
  });

  it('shows a readable fallback on chunk failure and recovers on the next notification', async () => {
    const loader = vi.spyOn(toastLoader, 'loadToaster');
    loader.mockRejectedValueOnce(new Error('Notification chunk unavailable'));
    render(<ToastHost />);

    act(() => toast.error('Kamera nicht verfügbar', { id: 'camera' }));
    const fallback = await screen.findByRole('alert');
    expect(fallback.textContent).toContain('Kamera nicht verfügbar');
    expect(loader).toHaveBeenCalledTimes(1);

    act(() => toast.error('Kamera weiterhin nicht verfügbar', { id: 'camera' }));
    const viewport = await screen.findByRole('region', { name: 'Mitteilungen' });
    expect(
      await within(viewport).findByRole('dialog', { name: 'Kamera weiterhin nicht verfügbar' }),
    ).toBeDefined();
    expect(screen.queryByText('Kamera nicht verfügbar')).toBeNull();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
