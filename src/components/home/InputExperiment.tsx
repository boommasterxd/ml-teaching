'use client';

import { useId, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';
import ExamplePhoto from '@/components/network/ExamplePhoto';
import { usePreviewCycle } from './PreviewCycle';
import { PreviewHighlight } from './PreviewHighlight';

const examples = [
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
type Example = (typeof examples)[number];

function SignalHighlight() {
  const timing = useTempoTransition({ duration: 0.6, ease: motionTokens.ease.draw });
  return (
    <PreviewHighlight className="home-signal-active" fill="none" strokeWidth="2">
      {[
        { x: 14, width: 150 },
        { x: 234, width: 132 },
        { x: 436, width: 150 },
      ].map(({ x, width }, index) => (
        <Effect
          key={x}
          asChild
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ ...timing, delay: index * 0.7 }}
        >
          <rect x={x} y="63" width={width} height="142" rx="20" />
        </Effect>
      ))}
      {['M176 134H222l-6-6 6 6-6 6', 'M378 134H424l-6-6 6 6-6 6'].map((d, index) => (
        <Effect
          key={d}
          asChild
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ ...timing, delay: 0.35 + index * 0.7 }}
        >
          <path d={d} />
        </Effect>
      ))}
    </PreviewHighlight>
  );
}

function SignalDrawing({ animate, showMotion }: { animate: boolean; showMotion: boolean }) {
  const [settled, setSettled] = useState(!animate);
  if (!animate && !settled) setSettled(true);
  if (!showMotion) return null;
  return <AnimatePresence>{animate && !settled && <SignalHighlight />}</AnimatePresence>;
}

function SignalArtwork({
  example,
  sequence,
  animate,
  showMotion,
}: {
  example: Example;
  sequence: number;
  animate: boolean;
  showMotion: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const patternOffset = examples.indexOf(example);

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
        <path d="M176 134H222M378 134H424" />
      </g>
      <foreignObject key={example.id} x="35" y="80" width="108" height="108">
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
      <g className="home-signal-label" textAnchor="middle">
        <text x="89" y="232">
          {example.input}
        </text>
        <text x="300" y="232">
          Bildmerkmale
        </text>
        <text x="511" y="232">
          Eine Zuordnung
        </text>
      </g>
      <SignalDrawing key={`${sequence}-${example.id}`} animate={animate} showMotion={showMotion} />
    </svg>
  );
}

export default function InputExperiment() {
  const { imageRef, signal, imageSequence, animateImage, showImageMotion } = usePreviewCycle();
  const example = examples[signal === 'dog' ? 1 : 0];
  return (
    <div ref={imageRef} className="home-input-experiment">
      <SignalArtwork
        example={example}
        sequence={imageSequence}
        animate={animateImage}
        showMotion={showImageMotion}
      />
    </div>
  );
}
