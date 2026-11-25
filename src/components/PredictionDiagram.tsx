import { memo, useId, useState, type ReactNode, type Ref } from 'react';
import { classColorClasses } from '@/lib/class-colors';
import { cn } from '@/lib/utils';
import type { MLClass } from '@/types/ml';
import { KnnQuery } from './network/KnnArtwork';
import { DeferredMenuLoadError } from './DeferredMenuLoadError';
import { ChevronDown } from './icons/chevron-down';
import { getMarkerStyles, markerPath, type ClassMarker } from './prediction-class-markers';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu-trigger';
import { Spinner } from './ui/spinner';
import { Heading } from './ui/typography';
import { useMenuActivationFocus, useMenuModule, usePendingMenuDismissal } from './use-menu-module';

export const plotWidth = 320;
export const plotHeight = 168;
export const plotViewBox = `0 0 ${plotWidth} ${plotHeight}`;
const inlineLegendLimit = 3;
const filterRowClass =
  'relative flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2';

const loadClassMenu = () => import('./PredictionClassMenu');

export function PredictionPlot({
  children,
  ref,
}: {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className="relative overflow-hidden rounded-xl border bg-background">
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
  );
}

export function PredictionPlotPlaceholder({
  classes,
  children,
}: {
  classes: readonly MLClass[];
  children?: ReactNode;
}) {
  return (
    <>
      <PredictionPlot>{children}</PredictionPlot>
      <PredictionLegend markers={getMarkerStyles(classes)} />
    </>
  );
}

function LegendGlyph({ color, shape }: ClassMarker) {
  return (
    <svg viewBox="-9 -9 18 18" className="size-4 shrink-0" aria-hidden="true">
      <path
        d={markerPath({ x: 0, y: 0 }, shape, 4)}
        data-class-marker={shape}
        className={cn('fill-(--class-on-surface)', classColorClasses(color))}
      />
    </svg>
  );
}

function CameraLegendMarker() {
  return (
    <>
      <svg viewBox="-9 -9 18 18" className="size-4 shrink-0" aria-hidden="true">
        <KnnQuery x={0} y={0} />
      </svg>
      Kamerabild
    </>
  );
}

function CameraLegendHint() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CameraLegendMarker />
    </span>
  );
}

function PredictionClassFilter({
  markers,
  hidden,
  onChange,
}: {
  markers: readonly ClassMarker[];
  hidden: ReadonlySet<string>;
  onChange: (ids: ReadonlySet<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const { module, failed, prepare } = useMenuModule(loadClassMenu);
  const Menu = module?.default;
  const pending = open && !Menu && !failed;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu,
    popupSelector: '[data-prediction-class-menu]',
    onDismiss: () => setOpen(false),
  });
  const { trackMenuActivation, focusFirstHighlightedItem } = useMenuActivationFocus(trigger);
  const visible = markers.filter(({ id }) => !hidden.has(id)).length;
  const summary =
    visible === markers.length ? 'Alle Klassen' : `${visible} von ${markers.length} Klassen`;

  return (
    <div ref={area} className={filterRowClass}>
      <CameraLegendHint />
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next, { event }) => {
          trackMenuActivation(next, event);
          setOpen(next);
          if (next) prepare();
        }}
        onItemHighlighted={focusFirstHighlightedItem}
      >
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="outline" size="sm" />}
          className="h-auto min-h-11 max-w-full whitespace-normal"
          aria-label={`Klassenfilter: ${summary}`}
          aria-busy={pending || undefined}
          {...(!Menu && { 'aria-controls': undefined })}
          onPointerEnter={prepare}
          onPointerDown={prepare}
          onFocus={prepare}
        >
          {summary}
          {pending ? (
            <Spinner data-icon="inline-end" aria-hidden="true" />
          ) : (
            <ChevronDown data-icon="inline-end" aria-hidden="true" />
          )}
        </DropdownMenuTrigger>
        {Menu && (
          <Menu
            markers={markers}
            hidden={hidden}
            onChange={onChange}
            visible={visible}
            glyph={LegendGlyph}
          />
        )}
      </DropdownMenu>
      {pending && (
        <span role="status" className="sr-only">
          Klassenfilter wird geladen.
        </span>
      )}
      {open && failed && (
        <DeferredMenuLoadError
          className="absolute top-full right-0 z-30 mt-2 w-56"
          message="Der Klassenfilter konnte nicht geladen werden."
          trigger={trigger}
          retry={prepare}
        />
      )}
    </div>
  );
}

export const PredictionLegend = memo(function PredictionLegend({
  markers,
  hidden,
  onChange,
}: {
  markers: readonly ClassMarker[];
  hidden?: ReadonlySet<string>;
  onChange?: (ids: ReadonlySet<string>) => void;
}) {
  if (markers.length > inlineLegendLimit) {
    return hidden && onChange ? (
      <PredictionClassFilter markers={markers} hidden={hidden} onChange={onChange} />
    ) : (
      <div className={filterRowClass}>
        <CameraLegendHint />
      </div>
    );
  }
  return (
    <ul
      role="list"
      aria-label="Legende"
      className="flex min-w-0 flex-wrap items-start justify-center gap-x-2 gap-y-1 text-xs leading-4 text-muted-foreground"
    >
      <li className="inline-flex items-center gap-1">
        <CameraLegendMarker />
      </li>
      {markers.map((marker) => (
        <li key={marker.id} className="inline-flex min-w-0 items-start gap-1">
          <LegendGlyph {...marker} />
          <span className="min-w-0 wrap-anywhere">{marker.name}</span>
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
      {children || <PredictionPlotPlaceholder classes={classes} />}
      <figcaption id={description} className="sr-only">
        Der Klassifikator vergleicht alle Bildmerkmale. Eine gestrichelte Markierung am Rand zeigt
        ein Kamerabild außerhalb des Ausschnitts.
      </figcaption>
    </figure>
  );
}
