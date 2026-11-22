import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { RewardBoard, rewardPreviewDescription } from './RewardBoard';
import { RewardPreviewTurn } from './preview-motion';
import type { PreviewPlayback } from './preview-types';

export default function RewardPreview({
  rewardGoal,
  rewardSequence,
  animateReward,
  showRewardMotion,
}: PreviewPlayback) {
  const [interruptedSequence, setInterruptedSequence] = useState<string | null>(null);

  // Do not replay the same turn after the preview has become inactive.
  if (rewardGoal && !animateReward && interruptedSequence !== rewardSequence) {
    setInterruptedSequence(rewardSequence);
  }
  const activeGoal = animateReward && interruptedSequence !== rewardSequence ? rewardGoal : null;

  return (
    <RewardBoard showAgentAtStart={!activeGoal} description={rewardPreviewDescription}>
      {showRewardMotion && (
        <AnimatePresence initial={false}>
          {activeGoal && <RewardPreviewTurn key={rewardSequence} goal={activeGoal} />}
        </AnimatePresence>
      )}
    </RewardBoard>
  );
}
