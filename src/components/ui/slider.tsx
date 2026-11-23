'use client';

import { cn } from '@/lib/utils';
import { Slider as SliderPrimitive } from '@animate-ui/react/primitives/base-ui/slider';

function Slider<Value extends number | readonly number[]>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-valuetext': ariaValueText,
  ...props
}: Omit<SliderPrimitive.Root.Props<Value>, 'className'> & { className?: string }) {
  const values = value ?? defaultValue;
  const thumbCount = Array.isArray(values) ? values.length : 1;
  return (
    <SliderPrimitive.Root<Value>
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge-client-only"
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={cn(
          'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
          className,
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted outline outline-control data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5 forced-colors:outline-[CanvasText]"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full forced-colors:bg-[Highlight] forced-colors:forced-color-adjust-none"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuetext={ariaValueText}
            index={index}
            key={index}
            data-slot="slider-thumb"
            className="control-focus block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 data-[disabled]:pointer-events-none"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
