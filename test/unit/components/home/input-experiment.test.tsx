import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InputExperiment from '@/components/home/InputExperiment';
import { prepareExample } from '@/components/network/prepare-example';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

vi.mock('@/components/network/prepare-example', () => ({
  prepareExample: vi.fn(() => Promise.resolve()),
}));

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('homepage input experiment', () => {
  it('delivers its example, explanation and actions without client-only content or inline styles', () => {
    const document = new DOMParser().parseFromString(
      renderToStaticMarkup(<InputExperiment />),
      'text/html',
    );
    expect(document.querySelector('[style], style, script')).toBeNull();
    expect(document.querySelectorAll('button')).toHaveLength(2);
    expect(document.querySelector('img')?.getAttribute('src')).toContain('cat');
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Katze erkannt');
  });

  it('explains each selected input and retains the action focus when replayed', () => {
    render(<InputExperiment />);
    for (const [action, explanation] of [
      ['Hundebild zeigen', 'Hund'],
      ['Katzenbild zeigen', 'Katze'],
    ]) {
      const button = screen.getByRole('button', { name: action });
      button.focus();
      expect(prepareExample).toHaveBeenCalledWith(explanation === 'Hund' ? 'dog' : 'cat');
      fireEvent.click(button);
      expect(screen.getByRole('status').textContent).toContain(`${explanation} erkannt`);
      expect(document.querySelector('img')?.getAttribute('src')).toContain(
        explanation === 'Hund' ? 'dog' : 'cat',
      );
      expect(document.activeElement).toBe(button);
      fireEvent.click(button);
      expect(screen.getByRole('status').textContent).toContain(`${explanation} erkannt`);
      expect(document.activeElement).toBe(button);
    }
  });
});
