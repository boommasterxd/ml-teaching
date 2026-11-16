import type { ReactNode } from 'react';
import { buttonVariants } from './button-variants';
import { Dog, Cat } from './icons';
import { NEURAL_NET_VIZ } from '../constants';
import { LAYERS, STATIC_CONNECTIONS, getNodeY } from './neuralNetViz.utils';

export const DEMO_SIGNALS = [
  { signal: 'dog', Icon: Dog, label: 'Hundebild zeigen' },
  { signal: 'cat', Icon: Cat, label: 'Katzenbild zeigen' },
] as const;

export function DiagramSurface({
  children,
  isPreparing = false,
}: {
  children: ReactNode;
  isPreparing?: boolean;
}) {
  return (
    <div
      className="bg-diagram-surface p-8 rounded-3xl border border-diagram-border relative overflow-hidden"
      aria-busy={isPreparing || undefined}
    >
      {children}
    </div>
  );
}

/** Static illustration preserves the educational layout without inline style attributes. */
export function StaticNeuralNetViz({
  action,
  isPreparing = false,
}: {
  action?: ReactNode;
  isPreparing?: boolean;
}) {
  return (
    <DiagramSurface isPreparing={isPreparing}>
      <div className="flex justify-center gap-6 mb-12 relative z-10" aria-hidden="true">
        {DEMO_SIGNALS.map(({ signal, Icon, label }) => (
          <div
            key={signal}
            className={buttonVariants({ variant: 'demonstration', size: 'demonstration' })}
            data-signal={signal}
            data-active={false}
            data-muted={false}
          >
            <Icon data-icon="inline-start" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <svg
        width="100%"
        height={NEURAL_NET_VIZ.CANVAS_HEIGHT}
        className="max-w-4xl mx-auto overflow-visible"
        role="img"
        aria-label="Neuronales Netz: Input, zwei versteckte Schichten und die Ausgaben Hund und Katze"
      >
        {STATIC_CONNECTIONS.map(({ key, x1, y1, x2, y2 }) => (
          <line
            key={key}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={NEURAL_NET_VIZ.COLORS.INACTIVE}
            strokeWidth="2"
            opacity={NEURAL_NET_VIZ.OPACITY.INACTIVE}
          />
        ))}
        {LAYERS.map((layer, layerIndex) => (
          <g key={layer.id}>
            <text
              x={NEURAL_NET_VIZ.LAYER_X_POSITIONS[layerIndex]}
              y="-10"
              textAnchor="middle"
              className="text-[10px] sm:text-xs font-mono uppercase tracking-wider fill-zinc-300"
            >
              {layer.label}
            </text>
            {Array.from({ length: layer.nodes }, (_, index) => (
              <circle
                key={index}
                cx={NEURAL_NET_VIZ.LAYER_X_POSITIONS[layerIndex]}
                cy={getNodeY(layer.nodes, index)}
                r="11"
                className="fill-zinc-500 stroke-zinc-400"
                strokeWidth="2"
                opacity="0.6"
              />
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-12 text-center h-16 text-zinc-300 relative flex items-start justify-center">
        {action ?? 'Interaktive Darstellung wird vorbereitet.'}
      </div>
    </DiagramSurface>
  );
}
