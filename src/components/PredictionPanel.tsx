/**
 * PredictionPanel.tsx
 *
 * Live prediction panel showing the camera feed, per-class confidence bars,
 * and start/stop controls. Disabled and visually dimmed when no trained model is available.
 */
import type React from 'react';
import { useMemo } from 'react';
import { Camera, Play, Square } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MLClass, Prediction } from '../types/ml';

/**
 * Props for the PredictionPanel component.
 */
interface PredictionPanelProps {
  /** All ML classes defined by the user, used to render per-class confidence bars. */
  classes: MLClass[];
  /** The latest prediction result from the KNN inference loop, or null if not yet available. */
  prediction: Prediction | null;
  /** Whether the prediction loop is currently running. */
  isPredicting: boolean;
  /** Whether a trained KNN model is available. Controls the disabled/dimmed state of the panel. */
  hasTrainedModel: boolean;
  /** Camera facing direction — mirrors the video horizontally when set to 'user'. */
  facingMode: 'user' | 'environment';
  /** Ref attached to the video element used for the prediction camera feed. */
  predictVideoRef: React.RefObject<HTMLVideoElement | null>;
  /** Called when the user clicks the start button to begin prediction. */
  onStartPredicting: () => void;
  /** Called when the user clicks the stop button to halt prediction. */
  onStopPredicting: () => void;
}

/**
 * Renders the live prediction panel with a camera feed overlay and confidence bars.
 * The panel becomes inert and semi-transparent when no trained model exists.
 */
export default function PredictionPanel({
  classes,
  prediction,
  isPredicting,
  hasTrainedModel,
  facingMode,
  predictVideoRef,
  onStartPredicting,
  onStopPredicting,
}: PredictionPanelProps) {
  const predictedClassName = useMemo(
    () => classes.find(c => c.id === prediction?.label)?.name ?? 'Unbekannt',
    [classes, prediction?.label]
  );

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col flex-1 transition-opacity duration-300',
        !hasTrainedModel ? 'opacity-80 pointer-events-none' : 'opacity-100'
      )}
      inert={!hasTrainedModel}
    >
      <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center">
        <h2 className="text-base font-bold text-zinc-800 flex items-center">
          <Camera className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> 3. Vorhersage
        </h2>
        {isPredicting && (
          <span className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" aria-hidden="true"></span>
            Live
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="relative aspect-[16/10.25] bg-zinc-900 rounded-xl overflow-hidden mb-5 flex-shrink-0">
          <video
            ref={predictVideoRef}
            autoPlay
            playsInline
            muted
            aria-label="Kameravorschau für Vorhersage"
            className={cn(
              'w-full h-full object-cover rounded-xl',
              facingMode === 'user' ? 'transform scale-x-[-1]' : ''
            )}
          />
          {!isPredicting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
              <button
                onClick={onStartPredicting}
                className="px-5 py-2.5 bg-white text-zinc-900 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                <Play className="w-4 h-4 mr-2 fill-current" aria-hidden="true" /> Starten
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center min-h-[2.25rem]" aria-live="polite" aria-atomic="true">
          {isPredicting && prediction ? (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Erkannt</div>
                <div className="text-2xl font-black text-zinc-800">
                  {predictedClassName}
                </div>
              </div>
              <div className="space-y-2.5">
                {classes.map(c => {
                  const conf = prediction.confidences[c.id] || 0;
                  const confPercent = Math.round(conf * 100);
                  return (
                    <div key={c.id} className="flex items-center text-xs">
                      <span className="w-20 truncate font-semibold text-zinc-600">{c.name}</span>
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden mx-3">
                        <div
                          className="h-full rounded-full transition-all duration-200 ease-out"
                          style={{ width: `${confPercent}%`, backgroundColor: c.color }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono font-medium text-zinc-600">
                        {confPercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={onStopPredicting}
                className="w-full mt-4 py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center border border-zinc-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              >
                <Square className="w-4 h-4 mr-2 fill-current" aria-hidden="true" /> Stoppen
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-800 text-sm text-center">
              Starte die Vorhersage, um Ergebnisse zu sehen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
