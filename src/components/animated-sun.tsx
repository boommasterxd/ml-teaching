'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@animate-ui/react/icons';

type SunProps = IconProps<keyof typeof animations>;

const animations = {
  default: (() => {
    const animation: Record<string, Variants> = {
      circle: {},
    };

    for (let i = 1; i <= 8; i++) {
      animation[`line${i}`] = {
        initial: { opacity: 1, scale: 1 },
        animate: {
          opacity: [0, 1],
          pathLength: [0, 1],
          transition: {
            duration: 0.6,
            ease: 'easeInOut',
            delay: (i - 1) * 0.15,
          },
        },
      };
    }

    return animation;
  })() satisfies Record<string, Variants>,
} as const;

const SUN_RAYS = [
  [12, 4, 12, 2],
  [17.7, 6.3, 19.1, 4.9],
  [20, 12, 22, 12],
  [17.7, 17.7, 19.1, 19.1],
  [12, 20, 12, 22],
  [6.3, 17.7, 4.9, 19.1],
  [4, 12, 2, 12],
  [6.3, 6.3, 4.9, 4.9],
] as const;

function IconComponent({ size, ...props }: SunProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

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
      initial="initial"
      animate={controls}
      {...props}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="4"
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
      {SUN_RAYS.map(([x1, y1, x2, y2], index) => (
        <motion.line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          variants={variants['line' + (index + 1)]}
          initial="initial"
          animate={controls}
        />
      ))}
    </motion.svg>
  );
}

function Sun(props: SunProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { Sun };
