import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ClassCard from '@/components/ClassCard';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { makeClasses } from '../helpers/training-data';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('class card', () => {
  it('reports editable names, exposes validation relationships and routes class actions', () => {
    const cls = makeClasses()[0];
    const actions = {
      onAddExample: vi.fn(),
      onAddImageExample: vi.fn(),
      onClear: vi.fn(),
      onRemove: vi.fn(),
      onRemoveImages: vi.fn(),
      onUpdateName: vi.fn(),
      onImageClick: vi.fn(),
      onError: vi.fn(),
      onUploadStart: vi.fn(() => true),
      onUploadEnd: vi.fn(),
      captureDisabled: false,
    };
    const props = {
      cls,
      position: 1,
      isDuplicate: false,
      actions,
    };
    const { rerender } = render(<ClassCard {...props} />);
    const name = screen.getByRole('textbox', { name: 'Name für Klasse 1: Rot' });
    fireEvent.change(name, { target: { value: '' } });
    expect(actions.onUpdateName).toHaveBeenCalledWith('red', '');
    rerender(<ClassCard {...props} cls={{ ...cls, name: '' }} />);
    const empty = screen.getByRole('textbox', { name: 'Name für Klasse 1: ohne Namen' });
    expect(empty.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(empty.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Name darf nicht leer sein',
    );
    rerender(<ClassCard {...props} cls={{ ...cls, name: 'Blau' }} isDuplicate />);
    expect(screen.getByRole('alert').textContent).toBe('Name muss eindeutig sein');
    rerender(<ClassCard {...props} />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Bilder der Klasse 1: Rot zurücksetzen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Klasse 1: Rot löschen' }));
    expect(actions.onClear).toHaveBeenCalledWith('red');
    expect(actions.onRemove).toHaveBeenCalledWith('red');
  });
});
