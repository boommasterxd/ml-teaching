'use client';

import type { ComponentType } from 'react';
import type { ClassMarker } from './prediction-class-markers';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

// Animate UI animates each row's filter, so override it to keep class names readable on entry.
const classFilterSurface =
  'max-h-[min(var(--available-height),24rem)] w-56 [&_[role=menuitemcheckbox]]:filter-none!';

export default function PredictionClassMenu({
  markers,
  hidden,
  onChange,
  visible,
  glyph: Glyph,
}: {
  markers: readonly ClassMarker[];
  hidden: ReadonlySet<string>;
  onChange: (ids: ReadonlySet<string>) => void;
  visible: number;
  glyph: ComponentType<ClassMarker>;
}) {
  const all = visible === markers.length;
  const partial = visible > 0 && !all;

  function changeClass(id: string, checked: boolean) {
    const next = new Set(hidden);
    if (checked) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <DropdownMenuContent
      align="end"
      className={classFilterSurface}
      aria-label="Klassenfilter"
      data-prediction-class-menu=""
    >
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          className="min-h-11"
          highlightValue="all"
          checked={all}
          indicator={partial ? 'mixed' : 'check'}
          onCheckedChange={(checked) =>
            onChange(new Set(checked ? [] : markers.map(({ id }) => id)))
          }
        >
          <span className="font-medium">Alle Klassen</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {markers.map((marker) => (
          <DropdownMenuCheckboxItem
            key={marker.id}
            className="min-h-11"
            highlightValue={marker.id}
            checked={!hidden.has(marker.id)}
            indicator="check"
            onCheckedChange={(next) => changeClass(marker.id, next)}
          >
            <Glyph {...marker} />
            <span className="min-w-0 wrap-anywhere">{marker.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
