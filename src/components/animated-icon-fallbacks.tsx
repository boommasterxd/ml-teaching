'use client';

import { motion, type Variants } from 'motion/react';
import { glyphs } from './animated-icon-glyphs';
import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';

type ProjectIconProps = IconProps<'default'>;
type GlyphNode = readonly [
  tag: 'path' | 'circle' | 'rect',
  attributes: Readonly<Record<string, string>>,
];

function projectIcon(nodes: readonly GlyphNode[], gesture: Variants) {
  const animations = {
    default: {
      group: gesture,
      ...Object.fromEntries(nodes.map((_, index) => ['stroke' + index, {}])),
    },
  };
  function Glyph({ size, ...props }: ProjectIconProps) {
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
        {...props}
      >
        <motion.g variants={variants.group} initial="initial" animate={controls}>
          {nodes.map(([tag, attributes], index) => {
            const Piece = motion[tag];
            const { key, ...geometry } = attributes;
            return (
              <Piece
                key={key}
                {...geometry}
                variants={variants['stroke' + index]}
                initial="initial"
                animate={controls}
              />
            );
          })}
        </motion.g>
      </motion.svg>
    );
  }
  return function ProjectIcon(props: ProjectIconProps) {
    return <IconWrapper icon={Glyph} {...props} />;
  };
}

const acknowledge: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: [0, -5, 5, 0], transition: { duration: 0.5, ease: 'easeInOut' } },
};
const pulse: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.08, 1], transition: { duration: 0.45, ease: 'easeInOut' } },
};
const travel: Variants = {
  initial: { x: 0 },
  animate: { x: [0, 1.5, 0], transition: { duration: 0.45, ease: 'easeInOut' } },
};

export const Brain = /* @__PURE__ */ projectIcon(glyphs.Brain, pulse);
export const Calculator = /* @__PURE__ */ projectIcon(glyphs.Calculator, pulse);
export const Car = /* @__PURE__ */ projectIcon(glyphs.Car, travel);
export const Cat = /* @__PURE__ */ projectIcon(glyphs.Cat, acknowledge);
export const Dog = /* @__PURE__ */ projectIcon(glyphs.Dog, acknowledge);
export const ImagePlus = /* @__PURE__ */ projectIcon(glyphs.ImagePlus, pulse);
export const Square = /* @__PURE__ */ projectIcon(glyphs.Square, pulse);
export const SwitchCamera = /* @__PURE__ */ projectIcon(glyphs.SwitchCamera, acknowledge);
export const VideoOff = /* @__PURE__ */ projectIcon(glyphs.VideoOff, pulse);
