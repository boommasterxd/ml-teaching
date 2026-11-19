'use client';

import { useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import ExamplePhoto from '@/components/network/ExamplePhoto';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
import { useControlHydrated } from '@/components/ui/use-control-hydration';
import { imageHeroCatSizes } from './hero-assets';

function HeroScan({ active, hydrated }: { active: boolean; hydrated: boolean }) {
  const timing = useTempoTransition({
    duration: 2.4,
    ease: motionTokens.ease.draw,
    repeat: Infinity,
    repeatDelay: 1.2,
  });
  return (
    <Effect
      asChild
      initial={false}
      animate={
        hydrated
          ? active
            ? { y: [0, 220], opacity: [0, 1, 1, 0] }
            : { y: 0, opacity: 0 }
          : undefined
      }
      transition={active ? timing : { duration: 0 }}
    >
      <g className="image-hero-scan">
        <rect x="171" y="98" width="238" height="28" fill="url(#image-hero-scan-light)" />
        <path d="M171 126h238" />
      </g>
    </Effect>
  );
}

function HeroScene({ active, hydrated }: { active: boolean; hydrated: boolean }) {
  return (
    <svg viewBox="0 0 580 460" fill="none" className="image-hero-scene" aria-hidden="true">
      <g className="image-hero-grid">
        <circle cx="295" cy="224" r="183" />
        <circle cx="295" cy="224" r="172" strokeDasharray="1 12" />
        <path d="M58 179h11m-5.5-5.5v11m437-23h11m-5.5-5.5v11" />
      </g>
      <text x="170" y="47" className="image-hero-meta">
        BILD / 01
      </text>
      <rect x="158" y="64" width="264" height="290" rx="26" className="image-hero-frame" />
      <foreignObject x="170" y="76" width="240" height="266">
        <ExamplePhoto
          signal="cat"
          decorative
          sizes={imageHeroCatSizes}
          className="image-hero-photo"
        />
      </foreignObject>
      <g className="image-hero-focus">
        <path d="M191 124V97h27m144 0h27v27M191 294v27h27m144 0h27v-27" />
        <rect x="223" y="155" width="135" height="104" rx="8" />
        <circle cx="258" cy="190" r="5" />
        <circle cx="323" cy="190" r="5" />
      </g>
      <HeroScan active={active} hydrated={hydrated} />
      <path d="M358 224h89v42" className="image-hero-connector" />
      <g>
        <rect x="384" y="266" width="152" height="64" rx="16" className="image-hero-result" />
        <circle cx="407" cy="298" r="4" fill="currentColor" className="image-hero-accent" />
        <text x="425" y="306" className="image-hero-result-label">
          Katze
        </text>
      </g>
      <rect x="48" y="275" width="134" height="134" rx="22" className="image-hero-frame" />
      <foreignObject x="58" y="285" width="114" height="114">
        <ExamplePhoto signal="dog" decorative className="image-hero-photo" />
      </foreignObject>
      <text x="56" y="434" className="image-hero-meta">
        ODER EIN HUND?
      </text>
      <defs>
        <linearGradient id="image-hero-glass" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="var(--secondary-hover)" />
          <stop offset="0.48" stopColor="var(--card)" />
          <stop offset="1" stopColor="var(--primary-soft)" />
        </linearGradient>
        <linearGradient id="image-hero-edge" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="var(--foreground)" stopOpacity="0.74" />
          <stop offset="0.38" stopColor="var(--control)" stopOpacity="0.5" />
          <stop offset="0.78" stopColor="var(--primary)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--control)" stopOpacity="0.43" />
        </linearGradient>
        <linearGradient
          id="image-hero-scan-light"
          className="image-hero-accent"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.22" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** The scan loops only while visible; the example photos and classification stay static. */
export default function ImageHeroArtwork() {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.3 });
  const visible = usePageVisible();
  const reduce = useShouldReduceMotion();
  const hydrated = useControlHydrated();
  const [paused, setPaused] = useState(false);
  const active = inView && visible && !reduce && !paused;
  return (
    <div ref={root} className="image-hero-artwork">
      <HeroScene active={active} hydrated={hydrated} />
      <div className="image-hero-controls">
        <Button
          variant="ghost"
          size="sm"
          disabled={reduce}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused || reduce ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {reduce ? 'Bewegung reduziert' : paused ? 'Animation fortsetzen' : 'Animation pausieren'}
        </Button>
      </div>
    </div>
  );
}
