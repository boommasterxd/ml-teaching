'use client';

import { createContext, use, type ComponentProps } from 'react';
import { motion, MotionConfig, type Variants } from 'motion/react';

import {
  AnimateIcon,
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@animate-ui/react/icons';
import { motionTokens, ReducedMotionContext } from '@animate-ui/react/utils/motion';

type LoaderCircleProps = IconProps<keyof typeof animations>;
type CircleFrameProps = ComponentProps<typeof motion.svg> & { size?: number };
type Playback = keyof typeof animations;

export const LoaderPlayback = createContext<Playback | false | null>(null);

const circlePath = 'M21 12a9 9 0 1 1-6.219-8.56';
const animations = {
  default: {
    group: {
      initial: { transform: 'rotate(0deg)' },
      animate: {
        transform: 'rotate(360deg)',
        transition: { duration: 1, ease: 'linear' },
      },
    },
    path: {},
  } satisfies Record<string, Variants>,
  pulse: {
    group: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0.7, 1],
        transition: { duration: 2, ease: motionTokens.ease.inOut },
      },
    },
    path: {},
  } satisfies Record<string, Variants>,
} as const;

function CircleFrame({ size = 28, ...props }: CircleFrameProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function IconComponent(props: LoaderCircleProps) {
  const playback = use(LoaderPlayback);
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);
  if (playback !== null) {
    return (
      <CircleFrame {...props}>
        <LoadingCircleStroke playback={playback} />
      </CircleFrame>
    );
  }

  return (
    <CircleFrame variants={variants.group} initial="initial" animate={controls} {...props}>
      <motion.path d={circlePath} variants={variants.path} initial="initial" animate={controls} />
    </CircleFrame>
  );
}

function LoaderCircle(props: LoaderCircleProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

function LoadingStroke(props: ComponentProps<typeof motion.path>) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);
  return (
    <motion.path
      {...props}
      d={circlePath}
      className="origin-center"
      variants={variants.group}
      initial={false}
      animate={controls}
    />
  );
}

function LoadingCircleStroke({ playback }: { playback: Playback | false }) {
  if (!playback) return <path d={circlePath} />;

  // The selected pulse is opacity-only even when reduced motion is enabled.
  return (
    <ReducedMotionContext value="never">
      <MotionConfig reducedMotion="never">
        <AnimateIcon key={playback} asChild animateOnView={playback} animateOnViewOnce={false} loop>
          <LoadingStroke />
        </AnimateIcon>
      </MotionConfig>
    </ReducedMotionContext>
  );
}

export { LoaderCircle };
