'use client';

import { useState } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import Button from '@/components/Button';
import { Cat } from '@/components/icons/cat';
import { Dog } from '@/components/icons/dog';
import ExamplePhoto from '@/components/network/ExamplePhoto';
import { prepareExample } from '@/components/network/prepare-example';

const examples = [
  {
    id: 'cat',
    label: 'Katzenbild zeigen',
    Icon: Cat,
    input: 'Ein Katzenbild',
    process: 'Bildmerkmale',
    output: 'Katze',
  },
  {
    id: 'dog',
    label: 'Hundebild zeigen',
    Icon: Dog,
    input: 'Ein Hundebild',
    process: 'Bildmerkmale',
    output: 'Hund',
  },
] as const;
type Example = (typeof examples)[number];

function prepare(signal: Example['id']) {
  void prepareExample(signal).catch(() => {});
}

function InputArtwork({ example }: { example: Example }) {
  return (
    <foreignObject x="35" y="80" width="108" height="108">
      <ExamplePhoto signal={example.id} decorative className="home-example-photo" />
    </foreignObject>
  );
}

function SignalDrawing({ sequence, reduce }: { sequence: number; reduce: boolean }) {
  const timing = useTempoTransition({ duration: 0.6, ease: motionTokens.ease.draw });
  return (
    <g key={sequence} className="home-signal-active" fill="none" strokeWidth="2">
      {[
        { x: 14, width: 150 },
        { x: 234, width: 132 },
        { x: 436, width: 150 },
      ].map(({ x, width }, index) => (
        <Effect
          key={x}
          asChild
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ ...timing, delay: reduce ? 0 : index * 0.7 }}
        >
          <rect x={x} y="63" width={width} height="142" rx="20" />
        </Effect>
      ))}
      {['M176 134H222l-6-6 6 6-6 6', 'M378 134H424l-6-6 6 6-6 6'].map((d, index) => (
        <Effect
          key={d}
          asChild
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ ...timing, delay: reduce ? 0 : 0.35 + index * 0.7 }}
        >
          <path d={d} />
        </Effect>
      ))}
    </g>
  );
}

function SignalArtwork({ example, sequence }: { example: Example; sequence: number }) {
  const reduce = useShouldReduceMotion();
  return (
    <svg viewBox="0 0 600 250" fill="none" aria-hidden="true" className="home-signal-artwork">
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
        <path d="M176 134H222M378 134H424" />
      </g>
      <g className="home-signal-input">
        <InputArtwork example={example} />
      </g>
      <g className="home-signal-cells">
        {Array.from({ length: 16 }, (_, index) => (
          <rect
            key={index}
            x={265 + (index % 4) * 18}
            y={99 + Math.floor(index / 4) * 18}
            width="14"
            height="14"
            rx="3"
            data-on={(index + examples.indexOf(example)) % 3 !== 0}
          />
        ))}
      </g>
      <g className="home-signal-output" textAnchor="middle">
        <text x="511" y="134" dominantBaseline="central">
          {example.output}
        </text>
      </g>
      <g className="home-signal-label" textAnchor="middle">
        <text x="89" y="232">
          {example.input}
        </text>
        <text x="300" y="232">
          {example.process}
        </text>
        <text x="511" y="232">
          Eine Zuordnung
        </text>
      </g>
      {sequence > 0 && <SignalDrawing sequence={sequence} reduce={reduce} />}
    </svg>
  );
}

/** A bounded local illustration, with animation only after an explicit example action. */
export default function InputExperiment() {
  const [selection, setSelection] = useState({ index: 0, sequence: 0 });
  const example = examples[selection.index];
  return (
    <div className="home-input-experiment">
      <div
        className="home-example-actions mobile-action-pair"
        role="group"
        aria-label="Bilderkennung ausprobieren"
      >
        {examples.map(({ id, label, Icon }, index) => (
          <Button
            key={id}
            variant="outline"
            onPointerEnter={() => prepare(id)}
            onFocus={() => prepare(id)}
            onPointerDown={() => prepare(id)}
            onClick={() => setSelection((previous) => ({ index, sequence: previous.sequence + 1 }))}
          >
            <Icon data-icon="inline-start" aria-hidden="true" /> {label}
          </Button>
        ))}
      </div>
      <SignalArtwork example={example} sequence={selection.sequence} />
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {example.output} erkannt
      </p>
    </div>
  );
}
