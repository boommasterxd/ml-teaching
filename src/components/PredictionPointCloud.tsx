'use client';

import { memo, useMemo, useState, type Ref } from 'react';
import { motion } from 'motion/react';
import { spring, useTempoTransition } from '@animate-ui/react/utils/motion';
import { classColorClasses } from '@/lib/class-colors';
import type { ProjectedExample, ProjectedPosition } from '@/lib/feature-projection';
import { cn } from '@/lib/utils';
import type { MLClass } from '@/types/ml';
import { KnnQuery } from './network/KnnArtwork';
import { getMarkerStyles, markerPath, type ClassMarker } from './prediction-class-markers';
import {
  PredictionLegend,
  PredictionPlot,
  plotHeight as height,
  plotViewBox,
  plotWidth as width,
} from './PredictionDiagram';
import { useMotionPreference } from './ui/use-motion-preference';

const padding = 12;

interface PointCloudProps {
  area: Ref<HTMLDivElement>;
  classes: readonly MLClass[];
  points: readonly ProjectedExample[];
  position: ProjectedPosition | null;
}

type PointSeries = Pick<ClassMarker, 'id' | 'color' | 'shape'> & { path: string };

type CameraMarker = ProjectedPosition & { outside: boolean };

function toPlot({ x, y }: ProjectedPosition, scale: number) {
  return { x: width / 2 + x * scale, y: height / 2 - y * scale };
}

function plotMarker({ x, y }: ProjectedPosition): CameraMarker {
  const plotX = Math.max(padding, Math.min(width - padding, x));
  const plotY = Math.max(padding, Math.min(height - padding, y));
  return { x: plotX, y: plotY, outside: plotX !== x || plotY !== y };
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
  markers: readonly ClassMarker[],
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
  return markers.map(({ id, color, shape }) => ({
    id,
    color,
    shape,
    path: (byClass.get(id) ?? []).map((point) => markerPath(point, shape, 2.6)).join(''),
  }));
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
      {series.map(({ id, color, shape, path }) => (
        <path
          key={id}
          d={path}
          data-class-marker={shape}
          className={cn('fill-(--class-on-surface)', classColorClasses(color))}
        />
      ))}
    </svg>
  );
});

function CameraPoint({ x, y, outside }: CameraMarker) {
  const { reduce } = useMotionPreference();
  const move = useTempoTransition(spring.highlight);
  return (
    <motion.g
      data-slot="prediction-live-point"
      initial={false}
      animate={{ x, y }}
      transition={reduce ? { duration: 0 } : move}
    >
      <KnnQuery x={0} y={0} />
      {outside && <circle r="9" fill="none" className="stroke-primary" strokeDasharray="2 2" />}
    </motion.g>
  );
}

export default memo(function PredictionPointCloud({
  area,
  classes,
  points,
  position,
}: PointCloudProps) {
  const scale = useMemo(() => getScale(points), [points]);
  const markers = useMemo(() => getMarkerStyles(classes), [classes]);
  const series = useMemo(() => getSeries(markers, points, scale), [markers, points, scale]);
  const marker = position && plotMarker(toPlot(position, scale));
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const visibleSeries = useMemo(
    () => (hidden.size ? series.filter(({ id }) => !hidden.has(id)) : series),
    [hidden, series],
  );

  return (
    <>
      <PredictionPlot ref={area}>
        <div className="pointer-events-none absolute inset-0">
          <TrainingPointLayer series={visibleSeries} />
          {marker && (
            <svg viewBox={plotViewBox} className="absolute inset-0 size-full" aria-hidden="true">
              <CameraPoint {...marker} />
            </svg>
          )}
        </div>
      </PredictionPlot>
      <PredictionLegend markers={markers} hidden={hidden} onChange={setHidden} />
    </>
  );
});
