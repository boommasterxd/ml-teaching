import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CameraPreview from '@/components/CameraPreview';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function CameraControls({
  disabled = false,
  stream = null,
  onFileUpload = vi.fn(),
}: {
  disabled?: boolean;
  stream?: MediaStream | null;
  onFileUpload?: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <CameraPreview
      disabled={disabled}
      stream={stream}
      facingMode="user"
      color="#dc2626"
      isRecording={recording}
      onStartRecording={() => setRecording(true)}
      onStopRecording={() => setRecording(false)}
      onFileUpload={onFileUpload}
      videoRef={videoRef}
    />
  );
}

describe('camera preview controls', () => {
  it('supports keyboard toggling, ignores key repeat and cancels capture on blur or pointer cancellation', () => {
    render(<CameraControls />);
    const record = screen.getByRole('button', { name: 'Aufnehmen' });
    record.focus();
    fireEvent.keyDown(record, { key: ' ' });
    expect(record.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(record, { key: ' ', repeat: true });
    fireEvent.keyUp(record, { key: ' ' });
    expect(record.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(record, { key: ' ' });
    expect(record.getAttribute('aria-pressed')).toBe('false');
    fireEvent.keyDown(record, { key: ' ' });
    fireEvent.blur(record);
    expect(record.getAttribute('aria-pressed')).toBe('false');
    Object.defineProperty(record, 'setPointerCapture', { value: vi.fn() });
    fireEvent.pointerDown(record, { pointerId: 1, pointerType: 'mouse' });
    expect(record.getAttribute('aria-pressed')).toBe('true');
    fireEvent.pointerUp(record, { pointerId: 1, pointerType: 'mouse' });
    expect(record.getAttribute('aria-pressed')).toBe('false');
    fireEvent.pointerDown(record, { pointerId: 2, pointerType: 'touch' });
    fireEvent.pointerCancel(record);
    expect(record.getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps Enter recording active after key release until Enter is pressed again', () => {
    render(<CameraControls />);
    const record = screen.getByRole('button', { name: 'Aufnehmen' });
    record.focus();
    fireEvent.keyDown(record, { key: 'Enter' });
    fireEvent.keyUp(record, { key: 'Enter' });
    expect(record.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(record, { key: 'Enter' });
    fireEvent.keyUp(record, { key: 'Enter' });
    expect(record.getAttribute('aria-pressed')).toBe('false');
  });

  it('attaches and detaches streams, opens the file picker and disables image input during training', () => {
    const stream = {} as MediaStream;
    const onFileUpload = vi.fn();
    const { container, rerender, unmount } = render(
      <CameraControls stream={stream} onFileUpload={onFileUpload} />,
    );
    const video = screen.getByLabelText('Kameravorschau für Trainingsaufnahme') as HTMLVideoElement;
    expect(video.srcObject).toBe(stream);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const openPicker = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Bilder hochladen' }));
    expect(openPicker).toHaveBeenCalledOnce();
    fireEvent.change(input, {
      target: { files: [new File(['image'], 'example.png', { type: 'image/png' })] },
    });
    expect(onFileUpload).toHaveBeenCalledOnce();
    rerender(<CameraControls disabled stream={null} onFileUpload={onFileUpload} />);
    expect(video.srcObject).toBeNull();
    expect(input.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Aufnehmen' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    unmount();
    expect(video.srcObject).toBeNull();
  });
});
