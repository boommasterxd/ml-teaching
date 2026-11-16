'use client';

/**
 * NeuralNetViz.tsx
 *
 * Animated neural network visualization for the landing page.
 * Renders a 4-layer network (input → hidden1 → hidden2 → output) with
 * SVG connection lines and circular nodes that light up step-by-step
 * during forward propagation. Users trigger the animation by clicking
 * the dog or cat button.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { AnimatePresence } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import Button from './Button';
import { DEMO_SIGNALS, DiagramSurface, StaticNeuralNetViz } from './NeuralNetFrame';
import { cn } from '../lib/utils';
import { useNeuralNetAnimation } from '../hooks/useNeuralNetAnimation';
import { NEURAL_NET_VIZ } from '../constants';
import { LAYERS, STATIC_CONNECTIONS, getNodeY } from './neuralNetViz.utils';
import type { Signal, SvgConnection } from './neuralNetViz.utils';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Props for the InputButtons component. */
interface InputButtonsProps {
  /** The currently active signal class, or null if no animation has been triggered yet. */
  activeSignal: Signal;
  /** Whether a forward-propagation animation is currently running. Disables both buttons while true. */
  animating: boolean;
  /** Callback invoked when the user clicks a trigger button. */
  onTrigger: (type: 'dog' | 'cat') => void;
}

/**
 * Renders the dog and cat input buttons that start a forward-propagation animation.
 * Each button calls `onTrigger` with its class identifier, which kicks off the
 * step-based animation in `useNeuralNetAnimation`. Buttons are disabled while an
 * animation runs to prevent overlapping states. The icon elements carry
 * `aria-hidden` because the visible text label already conveys the action;
 * the button itself needs no additional aria-label.
 */
function InputButtons({ activeSignal, animating, onTrigger }: InputButtonsProps) {
  return (
    <div className="flex justify-center gap-6 mb-12 relative z-10">
      {DEMO_SIGNALS.map(({ signal, Icon, label }) => (
        <Button
          key={signal}
          variant="demonstration"
          size="demonstration"
          data-signal={signal}
          data-active={activeSignal === signal}
          data-muted={animating && activeSignal !== signal}
          onClick={() => onTrigger(signal)}
          disabled={animating}
        >
          <Icon data-icon="inline-start" aria-hidden="true" />
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
}

/** Props for the SvgConnections component. */
interface SvgConnectionsProps {
  /** Pre-computed list of connection descriptors, including coordinates, color, and opacity. */
  connections: SvgConnection[];
}

/**
 * Renders all inter-layer connection lines as a full-bleed SVG overlay.
 * SVG is used because fractional pixel coordinates from `getNodeY` map
 * directly to SVG geometry without layout reflows. The wrapper div carries
 * `pointer-events-none` so clicks pass through to the node buttons beneath,
 * and `aria-hidden` hides the decorative lines from screen readers entirely.
 */
function SvgConnections({ connections }: SvgConnectionsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
      <svg width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        {connections.map(({ key, x1, y1, x2, y2, color, opacity }) => (
          <Effect asChild initial={false} animate={{ stroke: color, opacity }} key={key}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
          </Effect>
        ))}
      </svg>
    </div>
  );
}

/** Props for the LayerNodes component. */
interface LayerNodesProps {
  /** The currently active signal class, determines which output node and glow color to highlight. */
  activeSignal: Signal;
  /** Current animation step (0–7). Controls which layers and nodes appear lit up. */
  animStep: number;
}

/**
 * Renders all four layer columns with their circular nodes.
 * Node activation is gated by `animStep`: input lights up at step 0,
 * hidden1 at step 2, hidden2 at step 4, and only the target output node
 * (matching `activeSignal`) activates at step 6. This sequential threshold
 * simulates forward propagation through the network. Inactive nodes render
 * at reduced opacity; active nodes scale up and glow in the signal color.
 */
function LayerNodes({ activeSignal, animStep }: LayerNodesProps) {
  const activationStep = { input: 0, hidden1: 2, hidden2: 4, output: 6 };
  return (
    <>
      {LAYERS.map((layer, layerIdx) => (
        <div
          key={layer.id}
          className="absolute top-0 bottom-0 flex flex-col items-center z-10"
          style={{
            left: `${NEURAL_NET_VIZ.LAYER_OFFSET_PERCENT + layerIdx * NEURAL_NET_VIZ.LAYER_WIDTH_PERCENT}%`,
            width: `${NEURAL_NET_VIZ.LAYER_WIDTH_PERCENT}%`,
          }}
        >
          <div className="text-[10px] sm:text-xs font-mono text-zinc-300 mt-2 uppercase tracking-wider absolute -top-8 whitespace-nowrap">
            {layer.label}
          </div>

          {Array.from({ length: layer.nodes }).map((_, nodeIdx) => {
            const isOutput = layer.id === 'output';
            // KNN returns a single winning class, so only the output node matching
            // that class lights up — not all outputs simultaneously.
            const isTargetNode =
              isOutput &&
              ((activeSignal === 'dog' && nodeIdx === 0) ||
                (activeSignal === 'cat' && nodeIdx === 1));

            const isNodeActive =
              animStep >= activationStep[layer.id] && (!isOutput || isTargetNode);

            const glowColor =
              activeSignal === 'dog'
                ? 'shadow-red-500/80 bg-red-400'
                : 'shadow-blue-500/80 bg-blue-400';
            const yPos = getNodeY(layer.nodes, nodeIdx);

            return (
              <div
                key={`${layer.id}-${nodeIdx}`}
                className="absolute w-6 h-6"
                style={{ top: yPos - 12, left: 'calc(50% - 12px)' }}
              >
                <Effect
                  initial={false}
                  fade={{ initialOpacity: 0.6, opacity: isNodeActive ? 1 : 0.6 }}
                  zoom={{ initialScale: 1, scale: isNodeActive ? 1.1 : 1 }}
                  className={cn(
                    'w-full h-full rounded-full',
                    isNodeActive
                      ? glowColor + ' shadow-[0_0_15px_rgba(0,0,0,0.5)] border-transparent'
                      : 'bg-zinc-500 border-2 border-zinc-400',
                  )}
                />
                {isOutput && (
                  <span
                    className={cn(
                      'absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-medium',
                      animStep >= 7 && isTargetNode
                        ? activeSignal === 'dog'
                          ? 'text-red-400 opacity-100 translate-x-0'
                          : 'text-blue-300 opacity-100 translate-x-0'
                        : 'text-zinc-400 opacity-100 translate-x-0',
                    )}
                  >
                    {nodeIdx === 0 ? 'Hund' : 'Katze'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

/** Props for the AnimationResult component. */
interface AnimationResultProps {
  /** The prediction label to display after animation completes, or null if no result is available yet. */
  result: string | null;
  /** Whether the animation is currently running; shows a processing hint when true. */
  animating: boolean;
  /** The active signal class, used to apply the correct color theme to the result label. */
  activeSignal: Signal;
}

/**
 * Displays the prediction outcome at the end of an animation cycle.
 * Three mutually exclusive states are rendered inside a fixed-height container
 * to prevent layout shifts: when `result` is set (animation finished), a
 * colored badge with the predicted class appears; while `animating` is true
 * but no result exists yet, a pulsing processing hint is shown; otherwise an
 * idle call-to-action prompts the user to click an input button. The wrapper
 * uses `aria-live="polite"` so screen readers announce the result automatically
 * without requiring focus to move to this region.
 */
function AnimationResult({ result, animating, activeSignal }: AnimationResultProps) {
  return (
    <div className="mt-12 text-center h-16 relative" aria-live="polite">
      <AnimatePresence initial={false}>
        {result ? (
          <Effect
            key={result}
            fade
            slide={{ direction: 'up', offset: 16 }}
            className={cn(
              'absolute inset-x-0 mx-auto w-fit px-6 py-3 rounded-xl text-xl font-bold',
              activeSignal === 'dog'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
            )}
          >
            {result}
          </Effect>
        ) : animating ? (
          <Effect key="processing" fade className="absolute inset-x-0 text-zinc-300">
            Verarbeite Signal...
          </Effect>
        ) : (
          <Effect key="idle" fade className="absolute inset-x-0 text-zinc-300">
            Klicke auf ein Icon, um den Prozess zu starten
          </Effect>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Renders an interactive neural network animation with dog/cat input buttons.
 *
 * Composes `useNeuralNetAnimation` to drive a step-based animation state.
 * SVG connection lines and node circles activate sequentially as `animStep`
 * advances through the forward-propagation stages.
 */
function InteractiveNeuralNetViz() {
  const { activeSignal, animStep, animating, result, triggerAnimation } = useNeuralNetAnimation();

  // Memoized list of SVG line descriptors for all inter-layer connections.
  // Each connection object carries its start/end coordinates plus the
  // current stroke color and opacity driven by `animStep` and `activeSignal`.
  // Connections between layers activate at specific animation steps:
  //   - input → hidden1: step >= 1
  //   - hidden1 → hidden2: step >= 3
  //   - hidden2 → output: step >= 5 (only for the target output node)
  const svgConnections = useMemo(() => {
    // Red for dog signal, blue for cat signal; muted grey when inactive.
    const activeColor =
      activeSignal === 'dog' ? NEURAL_NET_VIZ.COLORS.DOG : NEURAL_NET_VIZ.COLORS.CAT;
    return STATIC_CONNECTIONS.map((conn) => {
      const isActive =
        conn.groupIndex === 0
          ? animStep >= 1
          : conn.groupIndex === 1
            ? animStep >= 3
            : animStep >= 5 &&
              ((activeSignal === 'dog' && conn.targetNodeIndex === 0) ||
                (activeSignal === 'cat' && conn.targetNodeIndex === 1));
      return {
        key: conn.key,
        x1: conn.x1,
        y1: conn.y1,
        x2: conn.x2,
        y2: conn.y2,
        color: isActive ? activeColor : NEURAL_NET_VIZ.COLORS.INACTIVE,
        opacity: isActive ? NEURAL_NET_VIZ.OPACITY.ACTIVE : NEURAL_NET_VIZ.OPACITY.INACTIVE,
      };
    });
  }, [animStep, activeSignal]);

  return (
    <DiagramSurface>
      <InputButtons
        activeSignal={activeSignal}
        animating={animating}
        onTrigger={triggerAnimation}
      />
      <div className="relative h-80 max-w-4xl mx-auto">
        <SvgConnections connections={svgConnections} />
        <LayerNodes activeSignal={activeSignal} animStep={animStep} />
      </div>
      <AnimationResult result={result} animating={animating} activeSignal={activeSignal} />
    </DiagramSurface>
  );
}

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function NeuralNetViz() {
  const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return isClient ? <InteractiveNeuralNetViz /> : <StaticNeuralNetViz isPreparing />;
}
