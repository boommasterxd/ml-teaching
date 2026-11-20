'use client';

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { spring, useTempoTransition } from '@animate-ui/react/utils/motion';
import { classColorClasses } from '@/lib/class-colors';
import type { ProjectedExample, ProjectedPosition } from '@/lib/feature-projection';
import { cn } from '@/lib/utils';
import type { MLClass } from '@/types/ml';
import { KnnQuery } from './network/KnnArtwork';
import {
  getMarkerStyles,
  markerPath,
  plotHeight as height,
  plotViewBox,
  plotWidth as width,
} from './PredictionDiagram';
import { useMotionPreference } from './ui/use-motion-preference';

const padding = 12;

interface PointCloudProps {
  classes: readonly MLClass[];
  points: readonly ProjectedExample[];
  position: ProjectedPosition | null;
}

interface PointSeries {
  id: string;
  color: string;
  path: string;
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
  return getMarkerStyles(classes).map(({ id, color, shape }) => {
    const group = byClass.get(id) ?? [];
    return {
      id,
      color,
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
      viewBox={plotViewBox}
      data-slot="prediction-training-points"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
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

export default memo(function PredictionPointCloud({ classes, points, position }: PointCloudProps) {
  const scale = useMemo(() => getScale(points), [points]);
  const series = useMemo(() => getSeries(classes, points, scale), [classes, points, scale]);
  return (
    <>
      <TrainingPointLayer series={series} />
      {position && (
        <svg viewBox={plotViewBox} className="absolute inset-0 size-full" aria-hidden="true">
          <CameraPoint {...toPlot(position, scale)} />
        </svg>
      )}
    </>
  );
});
