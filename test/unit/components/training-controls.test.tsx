import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TrainingControls from '@/components/TrainingControls';
import PredictionPanel from '@/components/PredictionPanel';
import TrainingError from '@/components/TrainingError';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { makeClasses } from '../helpers/training-data';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('training and prediction controls', () => {
  it('waits for valid training data and keeps the focused action available for prediction after training', () => {
    const onTrain = vi.fn();
    const onPredict = vi.fn();
    const base = {
      classes: makeClasses(10),
      canTrain: false,
      progress: null,
      hasTrainedModel: false,
      hasInvalidNames: false,
      hasDuplicateNames: false,
      hasPendingUploads: true,
      onTrain,
      onPredict,
    };
    const { rerender } = render(<TrainingControls {...base} />);
    expect(
      (screen.getByRole('button', { name: 'Modell trainieren' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText(/alle ausgewählten Bilder vollständig/)).toBeTruthy();
    rerender(<TrainingControls {...base} hasPendingUploads={false} hasInvalidNames />);
    expect(screen.getByText('Bitte gib allen Klassen einen Namen.')).toBeTruthy();
    rerender(<TrainingControls {...base} hasPendingUploads={false} hasDuplicateNames />);
    expect(screen.getByText('Bitte gib allen Klassen einen eindeutigen Namen.')).toBeTruthy();
    rerender(<TrainingControls {...base} hasPendingUploads={false} canTrain />);
    const train = screen.getByRole<HTMLButtonElement>('button', { name: 'Modell trainieren' });
    train.focus();
    fireEvent.click(train);
    expect(onTrain).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Weiter zur Vorhersage' })).toBeNull();
    rerender(
      <TrainingControls
        {...base}
        hasPendingUploads={false}
        progress={{ processed: 0, total: 20 }}
      />,
    );
    expect(screen.getByText('Das Modell wird vorbereitet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Trainiere/ })).toBe(train);
    expect(document.activeElement).toBe(train);
    expect(train.disabled).toBe(false);
    expect(train.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(train);
    expect(onTrain).toHaveBeenCalledOnce();
    rerender(
      <TrainingControls
        {...base}
        hasPendingUploads={false}
        progress={{ processed: 16, total: 20 }}
      />,
    );
    const progress = screen.getByRole('progressbar', { name: 'Trainingsfortschritt' });
    expect(progress.getAttribute('aria-valuetext')).toBe('16 von 20 Bildern verarbeitet');
    expect(screen.getByRole('status').textContent).toContain('Training läuft');
    rerender(<TrainingControls {...base} hasPendingUploads={false} hasTrainedModel canTrain />);
    expect(screen.getByRole('status').textContent).toContain('Training abgeschlossen');
    expect(screen.getAllByRole('button')).toEqual([train]);
    expect(screen.getByRole('button', { name: 'Weiter zur Vorhersage' })).toBe(train);
    expect(document.activeElement).toBe(train);
    fireEvent.click(train);
    expect(onPredict).toHaveBeenCalledOnce();
    expect(onTrain).toHaveBeenCalledOnce();
  });

  it('requires a camera for live prediction and exposes class confidence and stop controls', () => {
    const onToggle = vi.fn();
    const stream = {} as MediaStream;
    const camera = {
      stream: null,
      active: false,
      pending: false,
      failed: false,
      facingMode: 'user' as const,
      onToggle,
      onSwitch: vi.fn(),
    };
    const liveCamera = { ...camera, active: true, stream };
    const base = {
      classes: makeClasses(10),
      prediction: null,
      isPredicting: false,
      hasTrainedModel: true,
      camera,
      predictVideoRef: { current: null },
      onVisibilityChange: vi.fn(),
      subscribeToFeatures: () => () => {},
      space: { result: undefined, prepare: vi.fn() },
    };
    const { rerender } = render(
      <PredictionPanel {...base} hasTrainedModel={false} camera={liveCamera} />,
    );
    expect(base.predictVideoRef.current).toBeNull();
    expect(screen.getByRole('heading', { name: 'Vorhersage' }).id).toBe('training-prediction');
    expect(screen.getByText(/Trainiere zuerst dein Modell/)).toBeTruthy();
    rerender(<PredictionPanel {...base} />);
    expect(base.onVisibilityChange).toHaveBeenLastCalledWith(true);
    const start = screen.getByRole('button', { name: 'Kamera aktivieren' });
    expect(screen.getByText('Kamera aus')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Kamera wechseln' }).getAttribute('aria-disabled'),
    ).toBe('true');
    fireEvent.click(start);
    expect(onToggle).toHaveBeenCalledOnce();
    expect(base.space.prepare).toHaveBeenCalledOnce();
    rerender(<PredictionPanel {...base} camera={{ ...camera, active: true, pending: true }} />);
    expect(screen.getByText('Kamera wird verbunden …')).toBeTruthy();
    expect(base.predictVideoRef.current).toBeNull();
    expect(screen.getByRole('button', { name: 'Kamera pausieren' })).toBe(start);
    rerender(<PredictionPanel {...base} camera={liveCamera} isPredicting />);
    const preview = screen.getByLabelText<HTMLVideoElement>('Kameravorschau für Vorhersage');
    expect(base.predictVideoRef.current).toBe(preview);
    expect(preview.srcObject).toBe(stream);
    expect(screen.getByText('Die Vorhersage wird vorbereitet.')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'Kamera pausieren' })).toBe(start);
    rerender(
      <PredictionPanel
        {...base}
        camera={liveCamera}
        isPredicting
        prediction={{ label: 'red', confidences: { red: 0.85, blue: 0.15 } }}
      />,
    );
    const result = screen.getByRole('heading', { name: 'Rot' });
    expect(result.closest('[role="status"]')).not.toBeNull();
    expect(
      screen.getByRole('progressbar', { name: 'Konfidenz für Rot' }).getAttribute('aria-valuenow'),
    ).toBe('85');
    expect(
      screen.getByRole('progressbar', { name: 'Konfidenz für Blau' }).getAttribute('aria-valuenow'),
    ).toBe('15');
    const failed = { ...base, space: { ...base.space, result: { failed: true as const } } };
    rerender(<PredictionPanel {...failed} camera={liveCamera} isPredicting />);
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(document.activeElement).toBe(screen.getByRole('group', { name: 'Merkmalsraum' }));
    expect(base.space.prepare).toHaveBeenCalledTimes(2);
    expect(preview.srcObject).toBe(stream);
    fireEvent.click(screen.getByRole('button', { name: 'Kamera pausieren' }));
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(base.space.prepare).toHaveBeenCalledTimes(2);
    rerender(<PredictionPanel {...base} />);
    expect(preview.isConnected).toBe(false);
    expect(screen.getByRole('button', { name: 'Kamera aktivieren' })).toBe(start);
    expect(preview.srcObject).toBeNull();
    expect(base.predictVideoRef.current).toBeNull();
  });

  it('focuses model failures and offers a route back without forcing a permission prompt', () => {
    const onReturn = vi.fn();
    render(<TrainingError message="Modell konnte nicht geladen werden." onReturn={onReturn} />);
    expect(document.activeElement).toBe(screen.getByRole('alert'));
    expect(screen.getByRole('button', { name: 'Seite neu laden' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Zur Bilderkennung' }));
    expect(onReturn).toHaveBeenCalledOnce();
  });
});
