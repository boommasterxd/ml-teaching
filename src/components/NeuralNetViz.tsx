/**
 * NeuralNetViz.tsx
 *
 * Animated neural network visualization for the landing page.
 * Renders a 4-layer network (input → hidden1 → hidden2 → output) with
 * SVG connection lines and circular nodes that light up step-by-step
 * during forward propagation. Users trigger the animation by clicking
 * the dog or cat button.
 */
import { useMemo } from 'react';
import { Dog, Cat } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNeuralNetAnimation } from '../hooks/useNeuralNetAnimation';
import { NEURAL_NET_VIZ } from '../constants';

/** Defines the four layers of the visualized network: input (4 nodes), two hidden layers (6 nodes each), and output (2 nodes for dog/cat). */
const LAYERS = [
  { id: 'input', nodes: 4, label: 'Input' },
  { id: 'hidden1', nodes: 6, label: 'Hidden 1' },
  { id: 'hidden2', nodes: 6, label: 'Hidden 2' },
  { id: 'output', nodes: 2, label: 'Output' },
] as const;

/**
 * Calculates the vertical center position of a node within the SVG canvas.
 *
 * @param totalNodes - Total number of nodes in the layer.
 * @param index - Zero-based index of the node within its layer.
 * @returns Y coordinate (in pixels) of the node's center, centered vertically in the canvas.
 */
function getNodeY(totalNodes: number, index: number): number {
  const totalHeight = totalNodes * NEURAL_NET_VIZ.NODE_HEIGHT + (totalNodes - 1) * NEURAL_NET_VIZ.NODE_GAP;
  const startY = (NEURAL_NET_VIZ.CANVAS_HEIGHT - totalHeight) / 2;
  return startY + index * (NEURAL_NET_VIZ.NODE_HEIGHT + NEURAL_NET_VIZ.NODE_GAP) + NEURAL_NET_VIZ.NODE_HEIGHT / 2;
}

/** Represents which input class is currently being propagated through the network, or null before any animation has been triggered. */
type Signal = 'dog' | 'cat' | null;

/**
 * Describes a single SVG line connecting two nodes across adjacent layers.
 * Coordinates are in the SVG canvas space produced by `getNodeY`.
 * Color and opacity are pre-computed from `animStep` and `activeSignal`
 * so the SVG renderer stays a pure display component.
 */
type SvgConnection = {
  key: string;
  x1: string; y1: number;
  x2: string; y2: number;
  color: string;
  opacity: number;
};

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
      <button
        onClick={() => onTrigger('dog')}
        disabled={animating}
        className={cn(
          "flex flex-col items-center p-4 rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
          activeSignal === 'dog' ? "border-red-500 bg-red-500/20" : "border-zinc-600 hover:border-zinc-500 bg-zinc-700/50",
          animating && activeSignal !== 'dog' ? "opacity-50" : ""
        )}
      >
        <Dog className="w-12 h-12 mb-2 text-red-400" aria-hidden="true" />
        <span className="font-medium">Hundebild zeigen</span>
      </button>
      <button
        onClick={() => onTrigger('cat')}
        disabled={animating}
        className={cn(
          "flex flex-col items-center p-4 rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
          activeSignal === 'cat' ? "border-blue-500 bg-blue-500/20" : "border-zinc-600 hover:border-zinc-500 bg-zinc-700/50",
          animating && activeSignal !== 'cat' ? "opacity-50" : ""
        )}
      >
        <Cat className="w-12 h-12 mb-2 text-blue-400" aria-hidden="true" />
        <span className="font-medium">Katzenbild zeigen</span>
      </button>
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
          <line
            key={key}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke={color} strokeWidth="2"
            opacity={opacity}
            style={{ transition: 'opacity 0.4s ease' }}
          />
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
          <div className="text-[10px] sm:text-xs font-mono text-zinc-300 mt-2 uppercase tracking-wider absolute -top-8 whitespace-nowrap">{layer.label}</div>

          {Array.from({ length: layer.nodes }).map((_, nodeIdx) => {
            const isOutput = layer.id === 'output';
            // The target output node is the one matching the active signal class.
            const isTargetNode = isOutput && ((activeSignal === 'dog' && nodeIdx === 0) || (activeSignal === 'cat' && nodeIdx === 1));

            // Each layer lights up at a different animation step to simulate
            // sequential forward propagation through the network.
            let isNodeActive = false;
            if (layer.id === 'input' && animStep >= 0) isNodeActive = true;
            if (layer.id === 'hidden1' && animStep >= 2) isNodeActive = true;
            if (layer.id === 'hidden2' && animStep >= 4) isNodeActive = true;
            if (layer.id === 'output' && animStep >= 6 && isTargetNode) isNodeActive = true;

            const glowColor = activeSignal === 'dog' ? 'shadow-red-500/80 bg-red-400' : 'shadow-blue-500/80 bg-blue-400';
            const yPos = getNodeY(layer.nodes, nodeIdx);

            return (
              <div
                key={`${layer.id}-${nodeIdx}`}
                className="absolute w-6 h-6"
                style={{ top: yPos - 12, left: 'calc(50% - 12px)' }}
              >
                <div
                  className={cn(
                    "w-full h-full rounded-full transition-[opacity,transform] duration-500",
                    isNodeActive
                      ? glowColor + " shadow-[0_0_15px_rgba(0,0,0,0.5)] border-transparent scale-110 opacity-100"
                      : "bg-zinc-700 border-2 border-zinc-600 opacity-30"
                  )}
                />
                {/* Output labels */}
                {isOutput && (
                  <span className={cn(
                    "absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-medium transition-all duration-500",
                    animStep >= 7 && isTargetNode
                      ? (activeSignal === 'dog' ? "text-red-400 opacity-100 translate-x-0" : "text-blue-400 opacity-100 translate-x-0")
                      : "text-[#52525b] opacity-100 translate-x-0"
                  )}>
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
    <div className="mt-12 text-center h-16" aria-live="polite">
      {result ? (
        <div className={cn(
          "inline-block px-6 py-3 rounded-xl text-xl font-bold animate-in fade-in slide-in-from-bottom-4",
          activeSignal === 'dog' ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
        )}>
          {result}
        </div>
      ) : animating ? (
        <div className="text-zinc-300 animate-pulse">Verarbeite Signal...</div>
      ) : (
        <div className="text-zinc-300">Klicke auf ein Icon, um den Prozess zu starten</div>
      )}
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
export default function NeuralNetViz() {
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
    const color = (isActive: boolean) =>
      isActive ? (activeSignal === 'dog' ? NEURAL_NET_VIZ.COLORS.DOG : NEURAL_NET_VIZ.COLORS.CAT) : NEURAL_NET_VIZ.COLORS.INACTIVE;
    const opacity = (isActive: boolean) => isActive ? NEURAL_NET_VIZ.OPACITY.ACTIVE : NEURAL_NET_VIZ.OPACITY.INACTIVE;

    const [lx0, lx1, lx2, lx3] = NEURAL_NET_VIZ.LAYER_X_POSITIONS;

    const layer1 = Array.from({ length: 4 }).flatMap((_, i) =>
      Array.from({ length: 6 }).map((_, j) => {
        const active = animStep >= 1;
        return { key: `l1-${i}-${j}`, x1: lx0, y1: getNodeY(4, i), x2: lx1, y2: getNodeY(6, j), color: color(active), opacity: opacity(active) };
      })
    );
    const layer2 = Array.from({ length: 6 }).flatMap((_, i) =>
      Array.from({ length: 6 }).map((_, j) => {
        const active = animStep >= 3;
        return { key: `l2-${i}-${j}`, x1: lx1, y1: getNodeY(6, i), x2: lx2, y2: getNodeY(6, j), color: color(active), opacity: opacity(active) };
      })
    );
    const layer3 = Array.from({ length: 6 }).flatMap((_, i) =>
      Array.from({ length: 2 }).map((_, j) => {
        // Only highlight connections leading to the winning output node.
        const isTarget = (activeSignal === 'dog' && j === 0) || (activeSignal === 'cat' && j === 1);
        const active = animStep >= 5 && isTarget;
        return { key: `l3-${i}-${j}`, x1: lx2, y1: getNodeY(6, i), x2: lx3, y2: getNodeY(2, j), color: color(active), opacity: opacity(active) };
      })
    );

    return [...layer1, ...layer2, ...layer3];
  }, [animStep, activeSignal]);

  return (
    <div className="bg-zinc-800 p-8 rounded-3xl border border-zinc-700 relative overflow-hidden">
      <InputButtons activeSignal={activeSignal} animating={animating} onTrigger={triggerAnimation} />
      <div className="relative h-80 max-w-4xl mx-auto">
        <SvgConnections connections={svgConnections} />
        <LayerNodes activeSignal={activeSignal} animStep={animStep} />
      </div>
      <AnimationResult result={result} animating={animating} activeSignal={activeSignal} />
    </div>
  );
}
