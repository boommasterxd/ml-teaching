import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CameraPreview from '@/components/CameraPreview';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function CapturePreview({
  disabled = false,
  stream = null,
  onFileUpload = vi.fn(),
  pending = false,
  onSwitchCamera = vi.fn(),
  classLabel,
  remainingCapacity,
}: {
  disabled?: boolean;
  stream?: MediaStream | null;
  onFileUpload?: () => void;
  pending?: boolean;
  onSwitchCamera?: () => void;
  classLabel?: string;
  remainingCapacity?: number;
}) {
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <CameraPreview
      disabled={disabled}
      classLabel={classLabel}
      remainingCapacity={remainingCapacity}
      camera={{
        stream,
        facingMode: 'user',
        active: Boolean(stream) || pending,
        pending,
        failed: false,
        onToggle: vi.fn(),
        onSwitch: onSwitchCamera,
      }}
      isRecording={recording}
      onStartRecording={() => setRecording(true)}
      onStopRecording={() => setRecording(false)}
      onFileUpload={onFileUpload}
      videoRef={videoRef}
    />
  );
}

describe('camera preview controls', () => {
  it('associates the import capacity and camera actions with the selected class', async () => {
    await act(async () => {
      render(
        <CapturePreview stream={{} as MediaStream} classLabel="Klasse 2" remainingCapacity={1} />,
      );
    });
    const upload = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Bilder auswählen für Klasse 2',
      description: 'Noch Platz für 1 Bild.',
    });
    const record = screen.getByRole('button', { name: 'Aufnehmen für Klasse 2' });
    await act(async () => {
      fireEvent.click(record);
    });
    expect(screen.getByRole('button', { name: 'Aufnahme stoppen für Klasse 2' })).toBe(record);
    expect(upload.disabled).toBe(false);
  });

  it('starts on button activation and keeps recording until the same button is activated again', () => {
    render(<CapturePreview stream={{} as MediaStream} />);
    const record = screen.getByRole('button', { name: 'Aufnehmen' });
    fireEvent.pointerDown(record, { pointerType: 'mouse' });
    expect(screen.getByRole('button', { name: 'Aufnehmen' })).toBe(record);
    fireEvent.click(record);
    expect(screen.getByRole('button', { name: 'Aufnahme stoppen' })).toBe(record);
    fireEvent.click(record);
    expect(screen.getByRole('button', { name: 'Aufnehmen' })).toBe(record);
  });

  it('records only while holding a touch press and does not toggle back on after release', () => {
    vi.useFakeTimers();
    try {
      render(<CapturePreview stream={{} as MediaStream} />);
      const record = screen.getByRole('button', { name: 'Aufnehmen' });
      const touch = { pointerType: 'touch', pointerId: 1, isPrimary: true };
      fireEvent.pointerDown(record, touch);
      fireEvent.pointerCancel(record, touch);
      act(() => vi.advanceTimersByTime(400));
      expect(screen.getByRole('button', { name: 'Aufnehmen' })).toBe(record);

      fireEvent.pointerDown(record, touch);
      act(() => vi.advanceTimersByTime(400));
      expect(screen.getByRole('button', { name: 'Aufnahme stoppen' })).toBe(record);
      fireEvent.pointerUp(record, touch);
      fireEvent.click(record, { detail: 1 });
      expect(screen.getByRole('button', { name: 'Aufnehmen' })).toBe(record);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops recording when the document becomes hidden', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    try {
      render(<CapturePreview stream={{} as MediaStream} />);
      fireEvent.click(screen.getByRole('button', { name: 'Aufnehmen' }));
      hidden.mockReturnValue(true);
      fireEvent(document, new Event('visibilitychange'));
      expect(screen.getByRole('button', { name: 'Aufnehmen' })).toBeTruthy();
    } finally {
      hidden.mockRestore();
    }
  });

  it('attaches only in view or while recording and preserves controls across scrolling', () => {
    let updateVisibility!: (inView: boolean) => void;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          if (target.getAttribute('data-slot') !== 'camera-preview') return;
          updateVisibility = (isIntersecting) =>
            this.callback(
              [{ target, isIntersecting } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            );
        }
        disconnect() {}
      },
    );
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const { rerender } = render(<CapturePreview stream={stream} />);
    const video = screen.getByLabelText<HTMLVideoElement>('Kameravorschau für Trainingsaufnahme');
    const record = screen.getByRole('button', { name: 'Aufnehmen' });
    expect(video.srcObject ?? null).toBeNull();

    act(() => updateVisibility(true));
    expect(video.srcObject).toBe(stream);
    act(() => record.focus());
    fireEvent.click(record);
    act(() => updateVisibility(false));
    expect(video.srcObject).toBe(stream);
    expect(document.activeElement).toBe(record);
    fireEvent.click(screen.getByRole('button', { name: 'Aufnahme stoppen' }));
    expect(video.srcObject).toBeNull();
    expect(stop).not.toHaveBeenCalled();

    const nextStream = {} as MediaStream;
    rerender(<CapturePreview stream={nextStream} />);
    expect(video.srcObject).toBeNull();
    act(() => updateVisibility(true));
    expect(screen.getByLabelText('Kameravorschau für Trainingsaufnahme')).toBe(video);
    expect(video.srcObject).toBe(nextStream);
    expect(document.activeElement).toBe(record);
  });

  it('keeps the focused switch button during stream replacement and blocks duplicate switches', () => {
    const stream = {} as MediaStream;
    const onSwitchCamera = vi.fn();
    const { rerender } = render(<CapturePreview stream={stream} onSwitchCamera={onSwitchCamera} />);
    const cameraSwitch = screen.getByRole('button', { name: 'Kamera wechseln' });
    act(() => cameraSwitch.focus());
    fireEvent.click(cameraSwitch);
    expect(onSwitchCamera).toHaveBeenCalledOnce();

    rerender(<CapturePreview pending onSwitchCamera={onSwitchCamera} />);
    expect(screen.getByRole('button', { name: 'Kamera wechseln' })).toBe(cameraSwitch);
    expect(document.activeElement).toBe(cameraSwitch);
    expect(cameraSwitch.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(cameraSwitch);
    expect(onSwitchCamera).toHaveBeenCalledOnce();

    rerender(<CapturePreview stream={{} as MediaStream} onSwitchCamera={onSwitchCamera} />);
    expect(document.activeElement).toBe(cameraSwitch);
    fireEvent.click(cameraSwitch);
    expect(onSwitchCamera).toHaveBeenCalledTimes(2);
  });

  it('attaches and detaches streams, opens the file picker and disables image input during training', () => {
    const stream = {} as MediaStream;
    const onFileUpload = vi.fn();
    const { container, rerender, unmount } = render(
      <CapturePreview stream={stream} onFileUpload={onFileUpload} />,
    );
    const video = screen.getByLabelText('Kameravorschau für Trainingsaufnahme') as HTMLVideoElement;
    expect(video.srcObject).toBe(stream);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const openPicker = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Bilder auswählen' }));
    expect(openPicker).toHaveBeenCalledOnce();
    fireEvent.change(input, {
      target: { files: [new File(['image'], 'example.png', { type: 'image/png' })] },
    });
    expect(onFileUpload).toHaveBeenCalledOnce();
    const record = screen.getByRole('button', { name: 'Aufnehmen' });
    fireEvent.click(record);
    expect(screen.getByRole('button', { name: 'Aufnahme stoppen' })).toBe(record);
    rerender(<CapturePreview stream={null} onFileUpload={onFileUpload} />);
    expect(video.srcObject).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Aufnehmen' }).disabled).toBe(
      true,
    );
    expect(screen.queryByLabelText('Kameravorschau für Trainingsaufnahme')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Bilder auswählen' }));
    expect(openPicker).toHaveBeenCalledTimes(2);
    rerender(<CapturePreview disabled stream={stream} onFileUpload={onFileUpload} />);
    expect(input.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Aufnehmen' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    const reopenedVideo = screen.getByLabelText<HTMLVideoElement>(
      'Kameravorschau für Trainingsaufnahme',
    );
    expect(reopenedVideo.srcObject).toBe(stream);
    unmount();
    expect(reopenedVideo.srcObject).toBeNull();
  });
});
