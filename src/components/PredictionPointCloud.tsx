'use client';

import { memo, useEffect, useId, useMemo, useRef, useState, type Ref } from 'react';
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
  PredictionDescriptionButton,
  PredictionLegend,
  PredictionPlot,
  plotHeight as height,
  plotViewBox,
  plotWidth as width,
} from './PredictionDiagram';
import { Heading, Text } from './ui/typography';
import { useMotionPreference } from './ui/use-motion-preference';

const padding = 12;
const regionNames = [
  'oben links',
  'oben mittig',
  'oben rechts',
  'mittig links',
  'in der Mitte',
  'mittig rechts',
  'unten links',
  'unten mittig',
  'unten rechts',
];
const plotDistance = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 });

interface PointCloudProps {
  area: Ref<HTMLDivElement>;
  classes: readonly MLClass[];
  points: readonly ProjectedExample[];
  position: ProjectedPosition | null;
}

interface PointSeries {
  id: string;
  name: string;
  color: string;
  path: string;
  examples: readonly ProjectedPosition[];
  distribution: string;
}

type CameraMarker = ProjectedPosition & { outside: boolean };

function toPlot({ x, y }: ProjectedPosition, scale: number) {
  return { x: width / 2 + x * scale, y: height / 2 - y * scale };
}

function plotMarker({ x, y }: ProjectedPosition): CameraMarker {
  const plotX = Math.max(padding, Math.min(width - padding, x));
  const plotY = Math.max(padding, Math.min(height - padding, y));
  return { x: plotX, y: plotY, outside: plotX !== x || plotY !== y };
}

function plotRegion({ x, y }: ProjectedPosition) {
  // The inner dotted guides bound the central band on each axis.
  const column = x < 120 ? 0 : x > 200 ? 2 : 1;
  const row = y < 54 ? 0 : y > 114 ? 2 : 1;
  return row * 3 + column;
}

function describeDistribution(counts: readonly number[]) {
  return regionNames
    .flatMap((name, index) => (counts[index] ? [`${counts[index]} ${name}`] : []))
    .join(', ');
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
  markers: ReturnType<typeof getMarkerStyles>,
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
  return markers.map(({ id, name, color, shape }) => {
    const examples = byClass.get(id) ?? [];
    const counts = regionNames.map(() => 0);
    const path = examples
      .map((point) => {
        counts[plotRegion(point)]++;
        return markerPath(point, shape, 2.6);
      })
      .join('');
    return {
      id,
      name,
      color,
      path,
      examples,
      distribution: describeDistribution(counts),
    };
  });
}

function describeCamera(marker: CameraMarker | null) {
  if (!marker) return 'Kamerabild: Noch kein Punkt im Diagramm.';
  const region = regionNames[plotRegion(marker)];
  if (marker.outside) return `Kamerabild: Außerhalb des Ausschnitts, ${region} am Rand markiert.`;
  return `Kamerabild: Im Ausschnitt, ${region}.`;
}

function describeNearest(position: ProjectedPosition, examples: readonly ProjectedPosition[]) {
  let squaredDistance = Infinity;
  for (const { x, y } of examples) {
    squaredDistance = Math.min(squaredDistance, (x - position.x) ** 2 + (y - position.y) ** 2);
  }
  if (squaredDistance === Infinity) return null;
  if (squaredDistance === 0) return 'Nächstes Beispiel: am Kamerapunkt.';
  const fraction = Math.sqrt(squaredDistance) / width;
  const distance = fraction < 0.001 ? 'unter 0,1 %' : plotDistance.format(fraction);
  return `Nächstes Beispiel: ${distance} der Diagrammbreite entfernt.`;
}

function describePlot(
  series: readonly PointSeries[],
  position: ProjectedPosition | null,
  marker: CameraMarker | null,
) {
  return {
    camera: describeCamera(marker),
    classes: series.map(({ id, name, examples, distribution }) => ({
      id,
      name,
      total: examples.length,
      distribution,
      nearest: position && describeNearest(position, examples),
    })),
  };
}

const PlotDescription = memo(function PlotDescription({
  snapshot,
  id,
}: {
  snapshot: ReturnType<typeof describePlot>;
  id: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [snapshot]);

  return (
    <div id={id} className="grid min-w-0 gap-1 text-sm">
      <Heading
        as="h4"
        ref={heading}
        tabIndex={-1}
        className="scroll-mt-28 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-ring"
      >
        Diagrammbeschreibung
      </Heading>
      <Text className="leading-5">{snapshot.camera}</Text>
      <ul role="list" className="grid min-w-0 gap-1 wrap-anywhere">
        {snapshot.classes.map(({ id: classId, name, total, distribution, nearest }) => (
          <li key={classId}>
            <strong>{name}:</strong> {total === 1 ? '1 Trainingsbild' : `${total} Trainingsbilder`}
            {distribution && ` (${distribution})`}.{nearest && ` ${nearest}`}
          </li>
        ))}
      </ul>
      <Text variant="muted">
        Abstände gelten für die 2D-Projektion. Der Klassifikator verwendet alle Bildmerkmale.
      </Text>
    </div>
  );
});

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
  const coordinates = position && toPlot(position, scale);
  const marker = coordinates && plotMarker(coordinates);
  const description = useId();
  const [snapshot, setSnapshot] = useState<ReturnType<typeof describePlot>>();
  const [selected, setSelected] = useState<string | null>(null);
  const visibleSeries = useMemo(
    () => (selected ? series.filter(({ id }) => id === selected) : series),
    [selected, series],
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
      <PredictionDescriptionButton
        controls={snapshot ? description : undefined}
        onClick={() => setSnapshot(describePlot(series, coordinates, marker))}
      />
      {snapshot && <PlotDescription id={description} snapshot={snapshot} />}
      <PredictionLegend markers={markers} selected={selected} onSelect={setSelected} />
    </>
  );
});
