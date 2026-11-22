import { useState } from 'react';
import { AnimatePresence, useIsPresent, usePresenceData } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { useTempoTransition } from '@animate-ui/react/utils/motion';
import {
  examples,
  signalConnectors,
  SignalArtwork,
  SignalExampleContent,
  type Example,
} from './SignalArtwork';
import { SignalHighlight, signalPreviewFade } from './preview-motion';
import type { PreviewPlayback } from './preview-types';

function SignalDrawing({
  animate,
  sequence,
  showMotion,
}: {
  animate: boolean;
  sequence: string;
  showMotion: boolean;
}) {
  const [interruptedSequence, setInterruptedSequence] = useState<string | null>(null);
  if (!animate && interruptedSequence !== sequence) setInterruptedSequence(sequence);
  if (!showMotion) return null;
  return (
    <AnimatePresence mode="wait">
      {animate && interruptedSequence !== sequence && (
        <SignalHighlight key={sequence} connectors={signalConnectors} />
      )}
    </AnimatePresence>
  );
}

function SignalExample({ example }: { example: Example }) {
  const present = useIsPresent();
  const animate = usePresenceData() === true;
  const transition = useTempoTransition(animate ? signalPreviewFade : { duration: 0 });
  return (
    <Effect asChild fade={animate} initial={animate ? 'hidden' : false} transition={transition}>
      <g data-current-example={present || undefined} aria-hidden={!present || undefined}>
        <SignalExampleContent example={example} />
      </g>
    </Effect>
  );
}

export default function InputExperiment({
  signal,
  imageSequence,
  animateImage,
  showImageMotion,
}: PreviewPlayback) {
  const example = examples[signal === 'dog' ? 1 : 0];
  return (
    <SignalArtwork
      overlay={
        <SignalDrawing
          sequence={`${imageSequence}-${example.id}`}
          animate={animateImage}
          showMotion={showImageMotion}
        />
      }
    >
      <AnimatePresence initial={false} custom={showImageMotion}>
        <SignalExample key={example.id} example={example} />
      </AnimatePresence>
    </SignalArtwork>
  );
}
