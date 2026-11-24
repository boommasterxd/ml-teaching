import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import ClassCard from '@/components/ClassCard';
import type { CameraView } from '@/components/CameraControls';
import { useClassManagement } from '@/hooks/useClassManagement';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function EditableClassCard(props: Pick<ComponentProps<typeof ClassCard>, 'camera' | 'actions'>) {
  const { classes, nameControl, validateNames } = useClassManagement(() => {});
  return (
    <ClassCard
      {...props}
      cls={classes[0]}
      position={1}
      nameControl={nameControl}
      validateNames={validateNames}
    />
  );
}

describe('class card', () => {
  it('reports editable names, exposes validation relationships and routes class actions', async () => {
    const camera: CameraView = {
      stream: null,
      facingMode: 'user',
      active: false,
      pending: false,
      failed: false,
      onToggle: vi.fn(),
      onSwitch: vi.fn(),
    };
    const actions = {
      onAddExample: vi.fn(),
      onCommitCapture: vi.fn(),
      onAddImageExample: vi.fn(),
      onClear: vi.fn(),
      onRemove: vi.fn(),
      onRemoveImages: vi.fn(),
      onImageClick: vi.fn(),
      onError: vi.fn(),
      onUploadResult: vi.fn(),
      onUploadStart: vi.fn(() => true),
      onUploadEnd: vi.fn(),
      captureDisabled: false,
    };
    render(<EditableClassCard actions={actions} camera={camera} />);
    const name = screen.getByRole('textbox', { name: 'Name für Klasse 1: Klasse 1' });
    fireEvent.change(name, { target: { value: '' } });
    await screen.findByText('Name darf nicht leer sein', { selector: '[role="status"]' });
    fireEvent.blur(name);
    const empty = screen.getByRole('textbox', { name: 'Name für Klasse 1: ohne Namen' });
    expect(empty).toBe(name);
    expect(empty.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(empty.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Name darf nicht leer sein',
    );
    fireEvent.change(name, { target: { value: 'Klasse 2' } });
    await screen.findByText('Name muss eindeutig sein', { selector: '[role="status"]' });
    fireEvent.change(name, { target: { value: 'Rot' } });
    await screen.findByRole('textbox', { name: 'Name für Klasse 1: Rot' });
    expect(name.getAttribute('aria-invalid')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Bilder der Klasse 1: Rot zurücksetzen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Klasse 1: Rot löschen' }));
    expect(actions.onClear).toHaveBeenCalledWith('class-1');
    expect(actions.onRemove).toHaveBeenCalledWith('class-1');
  });
});
