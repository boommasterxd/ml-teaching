import type { ExampleSignal } from '@/lib/network-demo';

export const FEATURE_LAYERS = [0, 1, 2] as const;

const FEATURE_LABELS = [
  ['Kanten', 'Linien und Umrisse'],
  ['Muster', 'Formen kombinieren'],
  ['Zahlen', 'Merkmalsvektor'],
] as const;
const EDGE_MAPS = {
  dog: ['011110', '110011', '100001', '101101', '010010', '001100'],
  cat: ['100001', '110011', '101101', '100001', '010010', '001100'],
};
const PATTERN_MAP = ['100001', '110011', '011110', '001100', '011110', '001100'];
const VECTOR = [0.8, 0.25, 0.65, 0.95, 0.3, 0.55];

/** Conceptual feature maps, not measured MobileNet activations. */
export function FeatureLayer({
  layer,
  example,
  signal = false,
}: {
  layer: number;
  example: ExampleSignal;
  signal?: boolean;
}) {
  const color = signal ? 'var(--primary)' : 'var(--muted-foreground)';
  const rows = layer === 0 ? EDGE_MAPS[example] : PATTERN_MAP;
  return (
    <g transform={`translate(12 ${10 + layer * 64})`}>
      {layer === 2
        ? VECTOR.map((value, index) => (
            <rect
              key={index}
              x={5 + index * 8}
              y={46 - value * 36}
              width="5"
              height={value * 36}
              rx="1"
              fill={color}
              fillOpacity={signal ? 1 : 0.35}
            />
          ))
        : rows.flatMap((row, y) =>
            [...row].map((value, x) => (
              <rect
                key={`${x}-${y}`}
                x={6 + x * 8}
                y={4 + y * 8}
                width="6"
                height="6"
                rx="1"
                fill={color}
                fillOpacity={value === '1' ? (signal ? 1 : 0.45) : 0.06}
              />
            )),
          )}
    </g>
  );
}

export function FeatureFoundation() {
  return (
    <>
      {FEATURE_LABELS.map(([title, detail], layer) => (
        <g key={title} transform={`translate(0 ${layer * 64})`}>
          <rect x="12" y="10" width="58" height="54" rx="7" fill="var(--muted)" />
          <text x="84" y="31" fill="var(--foreground)" fontSize="14" fontWeight="600">
            {title}
          </text>
          <text x="84" y="49" fill="var(--muted-foreground)" fontSize="11">
            {detail}
          </text>
          {layer < 2 && (
            <path d="M41 66v6m-3-3 3 3 3-3" fill="none" stroke="var(--muted-foreground)" />
          )}
        </g>
      ))}
    </>
  );
}

export function FeatureArtwork({ signal = 'dog' }: { signal?: ExampleSignal }) {
  return (
    <svg viewBox="0 0 220 200" fill="none" aria-hidden="true" className="size-full">
      <FeatureFoundation />
      {FEATURE_LAYERS.map((layer) => (
        <FeatureLayer key={layer} layer={layer} example={signal} />
      ))}
    </svg>
  );
}
