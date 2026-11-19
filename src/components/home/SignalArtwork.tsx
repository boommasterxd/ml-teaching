import { useId, type ReactNode } from 'react';
import ExamplePhoto from '@/components/network/ExamplePhoto';

export const examples = [
  {
    id: 'cat',
    input: 'Ein Katzenbild',
    output: 'Katze',
  },
  {
    id: 'dog',
    input: 'Ein Hundebild',
    output: 'Hund',
  },
] as const;
export type Example = (typeof examples)[number];

export const signalConnectors = ['M174 134h48m-7-7 7 7-7 7', 'M376 134h48m-7-7 7 7-7 7'];

export function SignalExampleContent({ example }: { example: Example }) {
  const patternOffset = examples.indexOf(example);
  return (
    <>
      <foreignObject x="35" y="80" width="108" height="108">
        <ExamplePhoto signal={example.id} decorative className="home-example-photo" />
      </foreignObject>
      <g className="home-signal-cells">
        {Array.from({ length: 16 }, (_, index) => (
          <rect
            key={index}
            x={265 + (index % 4) * 18}
            y={99 + Math.floor(index / 4) * 18}
            width="14"
            height="14"
            rx="3"
            data-on={(index + patternOffset) % 3 !== 0}
          />
        ))}
      </g>
      <g className="home-signal-output" textAnchor="middle">
        <text x="511" y="134" dominantBaseline="central">
          {example.output}
        </text>
      </g>
      <text className="home-signal-label" x="89" y="232" textAnchor="middle">
        {example.input}
      </text>
    </>
  );
}

export function SignalArtwork({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <svg
      viewBox="0 0 600 250"
      fill="none"
      className="home-signal-artwork"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <title id={titleId}>Bilderkennung anhand von Bildmerkmalen</title>
      <desc id={descriptionId}>
        Ein Katzenbild wird der Klasse Katze zugeordnet, ein Hundebild der Klasse Hund.
      </desc>
      <g className="home-signal-surface">
        <rect x="14" y="63" width="150" height="142" rx="20" />
        <rect x="234" y="63" width="132" height="142" rx="20" />
        <rect x="436" y="63" width="150" height="142" rx="20" />
      </g>
      <g className="home-signal-label" textAnchor="middle">
        <text x="89" y="35">
          01 / EINGABE
        </text>
        <text x="300" y="35">
          02 / LERNMUSTER
        </text>
        <text x="511" y="35">
          03 / ERGEBNIS
        </text>
      </g>
      <g className="home-signal-muted" strokeWidth="2">
        {signalConnectors.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {children}
      <g className="home-signal-label" textAnchor="middle">
        <text x="300" y="232">
          Bildmerkmale
        </text>
        <text x="511" y="232">
          Eine Zuordnung
        </text>
      </g>
      {overlay}
    </svg>
  );
}

export function InputPreviewStill() {
  return (
    <SignalArtwork>
      <g data-current-example="true">
        <SignalExampleContent example={examples[0]} />
      </g>
    </SignalArtwork>
  );
}
