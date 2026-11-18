import type { ReactNode } from 'react';
import { KNN_POINTS, type ExampleSignal } from '@/lib/network-demo';

export const KNN_RING_RADIUS = 9;

export function KnnPoint({ x, y, signal }: { x: number; y: number; signal: ExampleSignal }) {
  return signal === 'dog' ? (
    <circle cx={x} cy={y} r="4" fill="var(--primary)" />
  ) : (
    <rect x={x - 4} y={y - 4} width="8" height="8" rx="1" fill="var(--foreground)" />
  );
}

export function KnnQuery({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 6}l6 6-6 6-6-6Z`}
      fill="var(--card)"
      stroke="var(--primary)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}

function KnnLegend() {
  return (
    <g fontSize="14" fill="var(--muted-foreground)">
      <KnnPoint x={25} y={160} signal="dog" />
      <text x="36" y="165">
        Hund
      </text>
      <KnnPoint x={90} y={160} signal="cat" />
      <text x="101" y="165">
        Katze
      </text>
      <KnnQuery x={166} y={160} />
      <text x="178" y="165">
        Neu
      </text>
    </g>
  );
}

/** Plot geometry is shared by the style-free SSG preview and deferred signal drawing. */
export function KnnPlot({ children }: { children?: ReactNode }) {
  return (
    <svg viewBox="0 0 220 180" fill="none" aria-hidden="true" className="size-full">
      <g stroke="var(--border)" strokeWidth="0.75">
        <path
          d="M20 35h180M20 70h180M20 105h180M60 16v119m50-119v119m50-119v119"
          strokeDasharray="2 5"
        />
        <path d="M20 16v119h180" />
      </g>
      {KNN_POINTS.map((point) => (
        <KnnPoint key={point.id} {...point} />
      ))}
      {children}
      <KnnLegend />
    </svg>
  );
}

export function KnnArtwork() {
  return <KnnPlot />;
}
