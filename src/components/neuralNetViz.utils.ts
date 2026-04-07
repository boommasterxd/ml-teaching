/**
 * neuralNetViz.utils.ts
 *
 * Geometry constants, types, and pre-computed connection data for the
 * NeuralNetViz component. Kept separate so NeuralNetViz.tsx stays focused
 * on rendering and animation logic.
 */
import { NEURAL_NET_VIZ } from '../constants';

/** Defines the four layers of the visualized network: input (4 nodes), two hidden layers (6 nodes each), and output (2 nodes for dog/cat). */
export const LAYERS = [
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
export function getNodeY(totalNodes: number, index: number): number {
  const totalHeight = totalNodes * NEURAL_NET_VIZ.NODE_HEIGHT + (totalNodes - 1) * NEURAL_NET_VIZ.NODE_GAP;
  const startY = (NEURAL_NET_VIZ.CANVAS_HEIGHT - totalHeight) / 2;
  return startY + index * (NEURAL_NET_VIZ.NODE_HEIGHT + NEURAL_NET_VIZ.NODE_GAP) + NEURAL_NET_VIZ.NODE_HEIGHT / 2;
}

/** Represents which input class is currently being propagated through the network, or null before any animation has been triggered. */
export type Signal = 'dog' | 'cat' | null;

/**
 * Static geometry for a single SVG connection line between two nodes.
 * Coordinates are pre-computed once at module load from getNodeY().
 */
export interface StaticConnection {
  key: string;
  x1: string; y1: number;
  x2: string; y2: number;
  /** Layer pair: 0 = input→hidden1, 1 = hidden1→hidden2, 2 = hidden2→output */
  groupIndex: number;
  /** Output node index for group 2 (0=dog, 1=cat). -1 for other groups. */
  targetNodeIndex: number;
}

/** Pre-computed connection geometries for all 72 inter-layer lines. */
export const STATIC_CONNECTIONS: StaticConnection[] = (() => {
  const [lx0, lx1, lx2, lx3] = NEURAL_NET_VIZ.LAYER_X_POSITIONS;
  const conns: StaticConnection[] = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 6; j++)
      conns.push({ key: `l1-${i}-${j}`, x1: lx0, y1: getNodeY(4, i), x2: lx1, y2: getNodeY(6, j), groupIndex: 0, targetNodeIndex: -1 });
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++)
      conns.push({ key: `l2-${i}-${j}`, x1: lx1, y1: getNodeY(6, i), x2: lx2, y2: getNodeY(6, j), groupIndex: 1, targetNodeIndex: -1 });
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 2; j++)
      conns.push({ key: `l3-${i}-${j}`, x1: lx2, y1: getNodeY(6, i), x2: lx3, y2: getNodeY(2, j), groupIndex: 2, targetNodeIndex: j });
  return conns;
})();

/**
 * Describes a single SVG line connecting two nodes across adjacent layers.
 * Coordinates are in the SVG canvas space produced by `getNodeY`.
 * Color and opacity are pre-computed from `animStep` and `activeSignal`
 * so the SVG renderer stays a pure display component.
 */
export type SvgConnection = {
  key: string;
  x1: string; y1: number;
  x2: string; y2: number;
  color: string;
  opacity: number;
};
