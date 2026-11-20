import { memo, useId, type ReactNode } from 'react';
import { classColorClasses } from '@/lib/class-colors';
import type { ProjectedPosition } from '@/lib/feature-projection';
import { cn } from '@/lib/utils';
import type { MLClass } from '@/types/ml';
import { KnnQuery } from './network/KnnArtwork';
import { Heading } from './ui/typography';

export const plotWidth = 320;
export const plotHeight = 168;
export const plotViewBox = `0 0 ${plotWidth} ${plotHeight}`;
const shapes = ['circle', 'square', 'triangle'] as const;
type MarkerShape = (typeof shapes)[number];

const fixed = (value: number) => Math.round(value * 10) / 10;

export function markerPath({ x, y }: ProjectedPosition, shape: MarkerShape, radius: number) {
  const diameter = radius * 2;
  if (shape === 'square')
    return `M${fixed(x - radius)} ${fixed(y - radius)}h${diameter}v${diameter}h-${diameter}Z`;
  if (shape === 'triangle')
    return `M${fixed(x)} ${fixed(y - radius)}l${radius} ${diameter}h-${diameter}Z`;
  return `M${fixed(x - radius)} ${fixed(y)}a${radius} ${radius} 0 1 0 ${diameter} 0a${radius} ${radius} 0 1 0 -${diameter} 0Z`;
}

export function getMarkerStyles(classes: readonly MLClass[]) {
  const colorCounts = new Map<string, number>();
  return classes.map(({ id, name, color, images }) => {
    const previous = colorCounts.get(color) ?? 0;
    colorCounts.set(color, previous + 1);
    return { id, name, color, count: images.length, shape: shapes[previous % shapes.length] };
  });
}

const DiagramLegend = memo(function DiagramLegend({ classes }: { classes: readonly MLClass[] }) {
  return (
    <ul
      role="list"
      aria-label="Legende"
      className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-1 text-xs leading-4 text-muted-foreground"
    >
      <li className="inline-flex items-start gap-1.5">
        <svg viewBox="-9 -9 18 18" className="size-4 shrink-0" aria-hidden="true">
          <KnnQuery x={0} y={0} />
        </svg>
        Kamerabild
      </li>
      {getMarkerStyles(classes).map(({ id, name, color, shape, count }) => (
        <li key={id} className="inline-flex min-w-0 items-start gap-1.5">
          <svg viewBox="-9 -9 18 18" className="size-4 shrink-0" aria-hidden="true">
            <path
              d={markerPath({ x: 0, y: 0 }, shape, 4)}
              className={cn('fill-(--class-on-surface)', classColorClasses(color))}
            />
          </svg>
          <span className="min-w-0 wrap-anywhere">
            {name}{' '}
            <span className="whitespace-nowrap tabular-nums">
              {count}
              <span className="sr-only"> Trainingsbilder</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
});

/** Keep the plot, legend and caption in place independently of PCA preparation. */
export default function PredictionDiagram({
  classes,
  children,
}: {
  classes: readonly MLClass[];
  children: ReactNode;
}) {
  const title = useId();
  const description = `${title}-description`;
  return (
    <figure aria-labelledby={title} aria-describedby={description} className="grid min-w-0 gap-2">
      <Heading as="h3" id={title} className="text-sm">
        Merkmalsraum (2D-Projektion)
      </Heading>
      <div className="relative overflow-hidden rounded-xl border bg-background">
        <svg viewBox={plotViewBox} className="w-full" aria-hidden="true">
          <path
            d="M12 24h296M12 54h296M12 114h296M12 144h296M40 12v144m40-144v144m40-144v144m80-144v144m40-144v144m40-144v144"
            className="stroke-border"
            strokeDasharray="2 4"
          />
          <path d="M12 84h296M160 12v144" className="stroke-control/55" />
        </svg>
        {children}
      </div>
      <DiagramLegend classes={classes} />
      <figcaption id={description} className="sr-only">
        Der Klassifikator vergleicht alle Bildmerkmale. Eine gestrichelte Markierung am Rand zeigt
        ein Kamerabild außerhalb des Ausschnitts.
      </figcaption>
    </figure>
  );
}
