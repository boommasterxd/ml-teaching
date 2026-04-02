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
 * @returns Y coordinate (in pixels) of the node's center, centered vertically in a 320px canvas.
 */
function getNodeY(totalNodes: number, index: number): number {
  const nodeHeight = 24;
  const gap = 16;
  const totalHeight = totalNodes * nodeHeight + (totalNodes - 1) * gap;
  const startY = (320 - totalHeight) / 2;
  return startY + index * (nodeHeight + gap) + nodeHeight / 2;
}

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
      isActive ? (activeSignal === 'dog' ? '#ef4444' : '#3b82f6') : '#52525b';
    const opacity = (isActive: boolean) => isActive ? 0.6 : 0.15;

    const layer1 = Array.from({ length: 4 }).flatMap((_, i) =>
      Array.from({ length: 6 }).map((_, j) => {
        const active = animStep >= 1;
        return { key: `l1-${i}-${j}`, x1: '15%', y1: getNodeY(4, i), x2: '35%', y2: getNodeY(6, j), color: color(active), opacity: opacity(active) };
      })
    );
    const layer2 = Array.from({ length: 6 }).flatMap((_, i) =>
      Array.from({ length: 6 }).map((_, j) => {
        const active = animStep >= 3;
        return { key: `l2-${i}-${j}`, x1: '35%', y1: getNodeY(6, i), x2: '55%', y2: getNodeY(6, j), color: color(active), opacity: opacity(active) };
      })
    );
    const layer3 = Array.from({ length: 6 }).flatMap((_, i) =>
      Array.from({ length: 2 }).map((_, j) => {
        // Only highlight connections leading to the winning output node.
        const isTarget = (activeSignal === 'dog' && j === 0) || (activeSignal === 'cat' && j === 1);
        const active = animStep >= 5 && isTarget;
        return { key: `l3-${i}-${j}`, x1: '55%', y1: getNodeY(6, i), x2: '75%', y2: getNodeY(2, j), color: color(active), opacity: opacity(active) };
      })
    );

    return [...layer1, ...layer2, ...layer3];
  }, [animStep, activeSignal]);

  return (
    <div className="bg-zinc-800 p-8 rounded-3xl border border-zinc-700 relative overflow-hidden">
      <div className="flex justify-center gap-6 mb-12 relative z-10">
        <button
          onClick={() => triggerAnimation('dog')}
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
          onClick={() => triggerAnimation('cat')}
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

      <div className="relative h-80 max-w-4xl mx-auto">
        {/* SVG connection lines between layers */}
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
           <svg width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
             {svgConnections.map(({ key, x1, y1, x2, y2, color, opacity }) => (
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

        {/* Layer nodes */}
        {LAYERS.map((layer, layerIdx) => (
          <div
            key={layer.id}
            className="absolute top-0 bottom-0 flex flex-col items-center z-10"
            style={{ left: `${5 + layerIdx * 20}%`, width: '20%' }}
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
      </div>

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
    </div>
  );
}
