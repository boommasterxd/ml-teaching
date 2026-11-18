'use client';

import { useId, useState } from 'react';
import { AnimatePresence, useIsPresent, usePresenceData } from 'motion/react';
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

const signalConnectors = ['M174 134h48m-7-7 7 7-7 7', 'M376 134h48m-7-7 7 7-7 7'];

function SignalHighlight() {
  const timing = useTempoTransition({ duration: 0.32, ease: motionTokens.ease.fill });
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
          transition={{ ...timing, delay: index * 0.44 }}
        >
          <rect x={x} y="63" width={width} height="142" rx="20" />
        </Effect>
      ))}
      {signalConnectors.map((d, index) => (
        <Effect
          key={d}
          asChild
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ ...timing, delay: 0.22 + index * 0.44 }}
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

function SignalExample({ example }: { example: Example }) {
  const present = useIsPresent();
  const animate = usePresenceData() === true;
  const transition = useTempoTransition(animate ? motionTokens.transition.fade : { duration: 0 });
  const patternOffset = examples.indexOf(example);

  return (
    <Effect asChild fade={animate} initial={animate ? 'hidden' : false} transition={transition}>
      <g data-current-example={present || undefined} aria-hidden={!present || undefined}>
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
      </g>
    </Effect>
  );
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
      <AnimatePresence initial={false} custom={showMotion}>
        <SignalExample key={example.id} example={example} />
      </AnimatePresence>
      <g className="home-signal-label" textAnchor="middle">
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
