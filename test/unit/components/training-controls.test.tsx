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
  it('keeps training blocked until uploads and label validation are complete, then exposes retraining', () => {
    const onTrain = vi.fn();
    const base = {
      classes: makeClasses(10),
      canTrain: false,
      isTraining: false,
      hasTrainedModel: false,
      hasInvalidNames: false,
      hasDuplicateNames: false,
      hasPendingUploads: true,
      onTrain,
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
    fireEvent.click(screen.getByRole('button', { name: 'Modell trainieren' }));
    expect(onTrain).toHaveBeenCalledOnce();
    rerender(<TrainingControls {...base} hasPendingUploads={false} isTraining />);
    expect((screen.getByRole('button', { name: /Trainiere/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    rerender(<TrainingControls {...base} hasPendingUploads={false} hasTrainedModel canTrain />);
    expect(screen.getByRole('status').textContent).toContain('Bereit');
    fireEvent.click(screen.getByRole('button', { name: 'Modell neu trainieren' }));
    expect(onTrain).toHaveBeenCalledTimes(2);
  });

  it('requires a camera for live prediction and exposes class confidence and stop controls', () => {
    const onStartPredicting = vi.fn();
    const onStopPredicting = vi.fn();
    const base = {
      classes: makeClasses(10),
      prediction: null,
      isPredicting: false,
      hasTrainedModel: true,
      hasCamera: false,
      facingMode: 'user' as const,
      predictVideoRef: { current: null },
      onStartPredicting,
      onStopPredicting,
    };
    const { rerender } = render(<PredictionPanel {...base} hasTrainedModel={false} hasCamera />);
    const preview = base.predictVideoRef.current as HTMLVideoElement | null;
    expect(preview?.closest('[hidden]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Vorhersage' }).id).toBe('training-prediction');
    expect(screen.getByText(/Trainiere zuerst dein Modell/)).toBeTruthy();
    rerender(<PredictionPanel {...base} />);
    const start = screen.getByRole('button', { name: 'Starten' });
    expect((start as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Aktiviere die Kamera/)).toBeTruthy();
    rerender(<PredictionPanel {...base} hasCamera />);
    expect(base.predictVideoRef.current).toBe(preview);
    expect(preview?.closest('[hidden]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Starten' }));
    expect(onStartPredicting).toHaveBeenCalledOnce();
    rerender(<PredictionPanel {...base} hasCamera isPredicting />);
    expect(screen.getByText('Die Vorhersage wird vorbereitet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stoppen' })).toBe(start);
    rerender(
      <PredictionPanel
        {...base}
        hasCamera
        isPredicting
        prediction={{ label: 'red', confidences: { red: 0.85, blue: 0.15 } }}
      />,
    );
    expect(screen.getByRole('status').textContent).toContain('Rot');
    expect(
      screen.getByRole('progressbar', { name: 'Konfidenz für Rot' }).getAttribute('aria-valuenow'),
    ).toBe('85');
    expect(
      screen.getByRole('progressbar', { name: 'Konfidenz für Blau' }).getAttribute('aria-valuenow'),
    ).toBe('15');
    fireEvent.click(screen.getByRole('button', { name: 'Stoppen' }));
    expect(onStopPredicting).toHaveBeenCalledOnce();
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
