import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImageGallery from '@/components/ImageGallery';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { makeImage } from '../helpers/training-data';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

const label = 'Trainingsbilder von Klasse 1: Klasse 1, scrollbar';

function trackResizeEvents() {
  const callbacks = new Set<() => void>();
  const HostResizeObserver = globalThis.ResizeObserver;
  vi.stubGlobal(
    'ResizeObserver',
    class extends HostResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          callbacks.add(() => callback(entries, observer));
          callback(entries, observer);
        });
      }
    },
  );
  return () => act(() => callbacks.forEach((callback) => callback()));
}

function trackActiveResizeObservers() {
  const active = new Set<ResizeObserver>();
  const HostResizeObserver = globalThis.ResizeObserver;
  vi.stubGlobal(
    'ResizeObserver',
    class extends HostResizeObserver {
      observe(target: Element) {
        active.add(this);
        super.observe(target);
      }
      unobserve(target: Element) {
        active.delete(this);
        super.unobserve(target);
      }
      disconnect() {
        active.delete(this);
        super.disconnect();
      }
    },
  );
  return active;
}

async function galleryWithPendingRows() {
  vi.resetModules();
  const rows = Promise.withResolvers<typeof import('@/components/ImageGalleryRows')>();
  vi.doMock('@/components/ImageGalleryRows', () => rows.promise);
  const { default: Gallery } = await import('@/components/ImageGallery');
  return { Gallery, rows };
}

describe('training image gallery', () => {
  it('keeps a collected photo through a gallery load failure and restores access on retry', async () => {
    const { Gallery, rows } = await galleryWithPendingRows();
    const image = makeImage('saved');
    const onImageClick = vi.fn();
    try {
      render(
        <Gallery
          label={label}
          images={[image]}
          color="#dc2626"
          onImageClick={onImageClick}
          onRemoveImages={vi.fn()}
        />,
      );
      expect(screen.getByText('Galerie wird geladen.').getAttribute('role')).toBe('status');
      await act(async () => rows.reject(new Error('Gallery code temporarily unavailable')));
      expect(screen.getByRole('alert').textContent).toBe(
        'Die Galerie konnte nicht geladen werden.',
      );
      vi.doUnmock('@/components/ImageGalleryRows');
      fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
      expect(document.activeElement).toBe(screen.getByRole('region', { name: label }));
      fireEvent.click(await screen.findByRole('button', { name: 'Bild 1 vergrößern' }));
      expect(onImageClick).toHaveBeenCalledExactlyOnceWith(image);
    } finally {
      vi.doUnmock('@/components/ImageGalleryRows');
    }
  });

  it('keeps gallery measurement inactive if the last photo is cleared before the module arrives', async () => {
    const { Gallery, rows } = await galleryWithPendingRows();
    const observers = trackActiveResizeObservers();
    const props = { label, color: '#dc2626', onImageClick: vi.fn(), onRemoveImages: vi.fn() };
    try {
      const { rerender } = render(<Gallery {...props} images={[makeImage('first')]} />);
      expect(screen.getByText('Galerie wird geladen.').getAttribute('role')).toBe('status');
      rerender(<Gallery {...props} images={[]} />);
      const galleryRows = await vi.importActual<typeof import('@/components/ImageGalleryRows')>(
        '@/components/ImageGalleryRows',
      );
      await act(async () => rows.resolve(galleryRows));
      expect(observers.size).toBe(0);
      expect(screen.queryByRole('button', { name: 'Bild 1 vergrößern' })).toBeNull();
      expect(screen.getByText(/mindestens 10 Bilder desselben Motivs/)).toBeTruthy();
    } finally {
      vi.doUnmock('@/components/ImageGalleryRows');
    }
  });

  it('releases empty-gallery measurement and restores usable previews with a fresh selection', async () => {
    const observers = trackActiveResizeObservers();
    const image = makeImage('first');
    const onImageClick = vi.fn();
    const props = { label, color: '#dc2626', onImageClick, onRemoveImages: vi.fn() };
    const { rerender } = render(<ImageGallery {...props} images={[]} />);
    const region = screen.getByRole('region', { name: label });
    expect(observers.size).toBe(0);
    act(() => region.focus());
    expect(document.activeElement).toBe(region);
    rerender(<ImageGallery {...props} images={[image]} />);
    const preview = await screen.findByRole('button', { name: 'Bild 1 vergrößern' });
    expect(observers.size).toBeGreaterThan(0);
    expect(document.activeElement).toBe(region);
    fireEvent.click(screen.getByRole('button', { name: 'Mehrere markieren' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bild 1 auswählen' }));
    expect(screen.getByText('1 ausgewählt')).toBeTruthy();
    rerender(<ImageGallery {...props} images={[]} />);
    expect(observers.size).toBe(0);
    expect(preview.isConnected).toBe(false);
    expect(screen.queryByText('1 ausgewählt')).toBeNull();
    expect(screen.getByText(/mindestens 10 Bilder desselben Motivs/)).toBeTruthy();
    rerender(<ImageGallery {...props} images={[image]} />);
    const restored = await screen.findByRole('button', { name: 'Bild 1 vergrößern' });
    expect(observers.size).toBeGreaterThan(0);
    await act(async () => restored.focus());
    expect(document.activeElement).toBe(restored);
    fireEvent.click(restored);
    expect(onImageClick).toHaveBeenCalledWith(image);
    fireEvent.click(screen.getByRole('button', { name: 'Mehrere markieren' }));
    expect(screen.getByText('0 ausgewählt')).toBeTruthy();
  });

  it('opens previews, supports reversible selection and deletes only selected images', async () => {
    const images = ['first', 'second', 'third'].map(makeImage);
    const onImageClick = vi.fn();
    const onRemoveImages = vi.fn();
    const props = { label, images, color: '#dc2626', onImageClick, onRemoveImages };
    const { rerender } = render(<ImageGallery {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Bild 2 vergrößern' }));
    expect(onImageClick).toHaveBeenCalledWith(images[1]);
    const mode = screen.getByRole('button', { name: 'Mehrere markieren' });
    fireEvent.click(mode);
    expect(screen.getByRole('button', { name: 'Auswahl abbrechen' })).toBe(mode);
    expect(document.activeElement).toBe(mode);
    const selectionStatus = screen.getByRole('status');
    expect(selectionStatus.textContent).toBe('0 ausgewählt');
    const first = screen.getByRole('button', { name: 'Bild 1 auswählen', pressed: false });
    act(() => first.focus());
    fireEvent.click(first);
    expect(screen.getByRole('button', { name: 'Bild 1 auswählen', pressed: true })).toBe(first);
    expect(document.activeElement).toBe(first);
    fireEvent.click(screen.getByRole('button', { name: 'Bild 3 auswählen' }));
    expect(selectionStatus.textContent).toBe('2 ausgewählt');
    fireEvent.click(first);
    expect(selectionStatus.textContent).toBe('1 ausgewählt');
    fireEvent.click(mode);
    expect(screen.getByRole('button', { name: 'Mehrere markieren' })).toBe(mode);
    expect(document.activeElement).toBe(mode);
    expect(onRemoveImages).not.toHaveBeenCalled();
    fireEvent.click(mode);
    fireEvent.click(screen.getByRole('button', { name: 'Bild 1 auswählen', pressed: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Bild 2 auswählen' }));
    fireEvent.click(screen.getByRole('button', { name: '2 ausgewählte Bilder löschen' }));
    expect(onRemoveImages).toHaveBeenCalledWith(['first', 'second']);
    expect(document.activeElement).toBe(mode);
    rerender(<ImageGallery {...props} images={[images[2]]} />);
    fireEvent.click(mode);
    fireEvent.click(screen.getByRole('button', { name: 'Bild 1 auswählen' }));
    fireEvent.click(screen.getByRole('button', { name: '1 ausgewähltes Bild löschen' }));
    expect(onRemoveImages).toHaveBeenLastCalledWith(['third']);
    rerender(<ImageGallery {...props} images={[]} />);
    expect(document.activeElement).toBe(screen.getByRole('region', { name: label }));
    expect(screen.queryByRole('button', { name: 'Mehrere markieren' })).toBeNull();
    expect(screen.getByText(/mindestens 10 Bilder desselben Motivs/)).toBeTruthy();
  });

  it('retains selection across virtual windows without rendering the full collection', async () => {
    const images = Array.from({ length: 200 }, (_, index) => makeImage(`image-${index}`));
    const onRemoveImages = vi.fn();
    render(
      <ImageGallery
        label={label}
        images={images}
        color="#dc2626"
        onRemoveImages={onRemoveImages}
        onImageClick={vi.fn()}
      />,
    );
    const initial = await screen.findAllByRole('button', { name: /^Bild \d+ vergrößern$/ });
    expect(initial.length).toBeLessThan(images.length);
    fireEvent.click(screen.getByRole('button', { name: 'Mehrere markieren' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bild 1 auswählen' }));
    const region = screen.getByRole('region', { name: label });
    region.scrollTop = 88 * 45;
    fireEvent.scroll(region);
    fireEvent.click(await screen.findByRole('button', { name: 'Bild 200 auswählen' }));
    fireEvent.click(screen.getByRole('button', { name: '2 ausgewählte Bilder löschen' }));
    expect(onRemoveImages).toHaveBeenCalledWith(['image-0', 'image-199']);
    await waitFor(() => expect(screen.queryByText('2 ausgewählt')).toBeNull());
  });

  it('preserves the focused image across column changes and offscreen range updates', async () => {
    const resize = trackResizeEvents();
    render(
      <ImageGallery
        label={label}
        images={Array.from({ length: 200 }, (_, index) => makeImage(`image-${index}`))}
        color="#dc2626"
        onRemoveImages={vi.fn()}
        onImageClick={vi.fn()}
      />,
    );
    const image = await screen.findByRole('img', { name: 'Trainingsbeispiel 5' });
    const button = image.closest('button')!;
    const region = screen.getByRole('region', { name: label });
    act(() => button.focus());
    region.style.setProperty('--gallery-columns', '6');
    resize();
    await waitFor(() => expect(document.activeElement).toBe(button));
    expect(button.isConnected).toBe(true);
    region.scrollTop = 88 * 30;
    fireEvent.scroll(region);
    await screen.findByRole('img', { name: 'Trainingsbeispiel 200' });
    expect(document.activeElement).toBe(button);
    expect(button.isConnected).toBe(true);
    expect(screen.getAllByRole('button', { name: /^Bild \d+ vergrößern$/ }).length).toBeLessThan(
      200,
    );
  });
});
