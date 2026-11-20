'use client';

import { useEffect, useRef } from 'react';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { animate, type AnimationPlaybackControls } from 'motion/react';
import { routes, type Goal } from './RewardBoard';

export default function RewardPath({
  goal,
  playing = true,
  onArrival,
}: {
  goal: Goal;
  playing?: boolean;
  onArrival?: () => void;
}) {
  const reduce = useShouldReduceMotion();
  const route = useRef<SVGPathElement>(null);
  const traveler = useRef<SVGCircleElement>(null);
  const playback = useRef<AnimationPlaybackControls | null>(null);
  const { duration, ease } = useTempoTransition({ duration: 1.9, ease: motionTokens.ease.draw });
  const endY = goal === 'star' ? 40 : 244;

  useEffect(() => {
    const path = route.current;
    const agent = traveler.current;
    if (!path || !agent || reduce || !path.getTotalLength) return;
    const length = path.getTotalLength();
    const draw = (progress: number) => {
      const point = path.getPointAtLength(progress * length);
      agent.setAttribute('cx', String(point.x));
      agent.setAttribute('cy', String(point.y));
      path.setAttribute('stroke-dashoffset', String(1 - progress));
    };
    draw(0);
    const controls = animate(0, 1, {
      duration,
      ease,
      onUpdate: draw,
      onComplete: () => {
        playback.current = null;
        onArrival?.();
      },
    });
    playback.current = controls;
    return () => {
      controls.stop();
      playback.current = null;
    };
  }, [duration, ease, goal, onArrival, reduce]);

  useEffect(() => {
    if (playing) playback.current?.play();
    else playback.current?.pause();
  }, [playing, goal, reduce]);

  return (
    <g key={String(reduce)}>
      <path
        ref={route}
        d={routes[goal].path}
        pathLength="1"
        strokeDasharray="1 1"
        strokeDashoffset={reduce ? 0 : 1}
        className="reward-experiment-route"
      />
      <circle
        ref={traveler}
        cx={reduce ? 312 : 40}
        cy={reduce ? endY : 244}
        r="5.5"
        className="reward-experiment-traveler reward-experiment-agent"
      />
    </g>
  );
}
