'use client';

import { memo, useId, useMemo } from 'react';
import { motion } from 'motion/react';
import { spring, useTempoTransition } from '@animate-ui/react/utils/motion';
import { classColorClasses } from '@/lib/class-colors';
import type { ProjectedExample, ProjectedPosition } from '@/lib/feature-projection';
import { cn } from '@/lib/utils';
import type { MLClass } from '@/types/ml';
import { KnnQuery } from './network/KnnArtwork';
import { Heading, Text } from './ui/typography';
import { useMotionPreference } from './ui/use-motion-preference';

const width = 320;
const height = 168;
const padding = 12;
const viewBox = `0 0 ${width} ${height}`;
const markerShapes = ['circle', 'square', 'triangle'] as const;

type MarkerShape = (typeof markerShapes)[number];

interface PointCloudProps {
  classes: readonly MLClass[];
  points: readonly ProjectedExample[];
  position: ProjectedPosition | null;
}

interface PointSeries {
  id: string;
  label: string;
  color: string;
  shape: MarkerShape;
  count: number;
  path: string;
}

const fixed = (value: number) => Math.round(value * 10) / 10;

function markerPath({ x, y }: ProjectedPosition, shape: MarkerShape, radius: number) {
  const diameter = radius * 2;
  if (shape === 'square')
    return `M${fixed(x - radius)} ${fixed(y - radius)}h${diameter}v${diameter}h-${diameter}Z`;
  if (shape === 'triangle')
    return `M${fixed(x)} ${fixed(y - radius)}l${radius} ${diameter}h-${diameter}Z`;
  return `M${fixed(x - radius)} ${fixed(y)}a${radius} ${radius} 0 1 0 ${diameter} 0a${radius} ${radius} 0 1 0 -${diameter} 0Z`;
}

function toPlot({ x, y }: ProjectedPosition, scale: number) {
  return { x: width / 2 + x * scale, y: height / 2 - y * scale };
}

function getScale(points: readonly ProjectedExample[]) {
  // Both axes use the same unit scale. Leave room for the live point around the training cloud.
  let span = 0.001;
  for (const { x, y } of points) {
    span = Math.max(
      span,
      Math.abs(x) / (width / 2 - padding),
      Math.abs(y) / (height / 2 - padding),
    );
  }
  return 0.76 / span;
}

function getSeries(
  classes: readonly MLClass[],
  points: readonly ProjectedExample[],
  scale: number,
): PointSeries[] {
  const byClass = new Map<string, ProjectedPosition[]>();
  for (const { classId, x, y } of points) {
    const mapped = toPlot({ x, y }, scale);
    const group = byClass.get(classId);
    if (group) group.push(mapped);
    else byClass.set(classId, [mapped]);
  }
  const colorCounts = new Map<string, number>();
  return classes.map(({ id, name, color }) => {
    const previous = colorCounts.get(color) ?? 0;
    colorCounts.set(color, previous + 1);
    const shape = markerShapes[previous % markerShapes.length];
    const group = byClass.get(id) ?? [];
    return {
      id,
      label: name,
      color,
      shape,
      count: group.length,
      path: group.map((point) => markerPath(point, shape, 2.6)).join(''),
    };
  });
}

const TrainingPointLayer = memo(function TrainingPointLayer({
  series,
}: {
  series: readonly PointSeries[];
}) {
  return (
    <svg
      viewBox={viewBox}
      data-slot="prediction-training-points"
      className="w-full"
      aria-hidden="true"
    >
      <path
        d="M12 24h296M12 54h296M12 114h296M12 144h296M40 12v144m40-144v144m40-144v144m80-144v144m40-144v144m40-144v144"
        className="stroke-border"
        strokeDasharray="2 4"
      />
      <path d="M12 84h296M160 12v144" className="stroke-control/55" />
      {series.map(({ id, color, path }) => (
        <path
          key={id}
          d={path}
          className={cn('fill-(--class-on-surface)', classColorClasses(color))}
        />
      ))}
    </svg>
  );
});

function CameraPoint({ x, y }: ProjectedPosition) {
  const { reduce } = useMotionPreference();
  const move = useTempoTransition(spring.highlight);
  const plotX = Math.max(padding, Math.min(width - padding, x));
  const plotY = Math.max(padding, Math.min(height - padding, y));
  const outside = plotX !== x || plotY !== y;
  return (
    <motion.g
      data-slot="prediction-live-point"
      initial={false}
      animate={{ x: plotX, y: plotY }}
      transition={reduce ? { duration: 0 } : move}
    >
      <KnnQuery x={0} y={0} />
      {outside && <circle r="9" fill="none" className="stroke-primary" strokeDasharray="2 2" />}
    </motion.g>
  );
}

const PlotLegend = memo(function PlotLegend({ series }: { series: readonly PointSeries[] }) {
  return (
    <ul
      role="list"
      aria-label="Legende"
      className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
    >
      <li className="inline-flex items-center gap-1.5">
        <svg viewBox="-9 -9 18 18" className="size-4 shrink-0" aria-hidden="true">
          <KnnQuery x={0} y={0} />
        </svg>
        Kamerabild
      </li>
      {series.map(({ id, label, color, shape, count }) => (
        <li key={id} className="inline-flex min-w-0 items-center gap-1.5">
          <svg viewBox="-9 -9 18 18" className="size-4 shrink-0" aria-hidden="true">
            <path
              d={markerPath({ x: 0, y: 0 }, shape, 4)}
              className={cn('fill-(--class-on-surface)', classColorClasses(color))}
            />
          </svg>
          <span className="wrap-anywhere">{label}</span>
          <span className="font-mono tabular-nums">
            {count}
            <span className="sr-only"> Trainingsbilder</span>
          </span>
        </li>
      ))}
    </ul>
  );
});

export default memo(function PredictionPointCloud({ classes, points, position }: PointCloudProps) {
  const title = useId();
  const scale = useMemo(() => getScale(points), [points]);
  const series = useMemo(() => getSeries(classes, points, scale), [classes, points, scale]);
  return (
    <figure aria-labelledby={title} className="grid min-w-0 gap-2">
      <Heading as="h3" id={title} className="text-sm">
        Merkmalsraum
      </Heading>
      <div className="relative overflow-hidden rounded-xl border bg-background">
        <TrainingPointLayer series={series} />
        {position && (
          <svg
            viewBox={viewBox}
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden="true"
          >
            <CameraPoint {...toPlot(position, scale)} />
          </svg>
        )}
      </div>
      <PlotLegend series={series} />
      <figcaption>
        <Text variant="muted" className="text-xs leading-relaxed">
          2D-Projektion der Bildmerkmale. Der Klassifikator vergleicht alle Merkmale. Eine
          gestrichelte Markierung am Rand zeigt ein Kamerabild außerhalb des Ausschnitts.
        </Text>
      </figcaption>
    </figure>
  );
});
