import type { ReactNode, Ref } from 'react';
import { Image as ImageIcon } from './icons/image';
import { cn } from '../lib/utils';
import { classColorClasses } from '../lib/class-colors';
import { Empty, EmptyDescription, EmptyMedia } from './ui/empty';
import { ScrollFadeViewport } from './ui/scroll-fade-viewport';
import { ML } from '../constants';

function GalleryEmpty() {
  return (
    <Empty className="h-full gap-3 p-2 md:p-2">
      <EmptyMedia variant="icon" className="gallery-empty-symbol" aria-hidden="true">
        <ImageIcon className="size-5" />
      </EmptyMedia>
      <EmptyDescription className="max-w-[34ch]">
        Sammle mindestens {ML.MIN_IMAGES_PER_CLASS} Bilder desselben Motivs aus verschiedenen
        Blickwinkeln.
      </EmptyDescription>
    </Empty>
  );
}

export default function TrainingGalleryFrame({
  className,
  label,
  color,
  toolbar,
  children,
  scrollContainerRef,
  scrollFade = true,
  onFocusWithinChange,
}: {
  className?: string;
  label: string;
  color: string;
  toolbar?: ReactNode;
  children?: ReactNode;
  scrollContainerRef?: Ref<HTMLDivElement>;
  scrollFade?: boolean;
  onFocusWithinChange?: (focused: boolean) => void;
}) {
  const hasImages = children != null && children !== false;
  return (
    <div
      onFocusCapture={onFocusWithinChange && (() => onFocusWithinChange(true))}
      onBlurCapture={
        onFocusWithinChange &&
        ((event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onFocusWithinChange(false);
        })
      }
      className={cn(
        '@container/gallery flex h-58 min-w-0 flex-col gap-1 overflow-clip rounded-2xl bg-muted/60 px-1.5 pt-1.5 dark:bg-background/40',
        '@xl/training-class:h-auto @xl/training-class:[contain:size]',
        classColorClasses(color),
        className,
      )}
    >
      {toolbar}
      <ScrollFadeViewport
        enabled={hasImages && scrollFade}
        blurItems
        ref={scrollContainerRef}
        tabIndex={hasImages ? 0 : -1}
        role="region"
        aria-label={label}
        className="gallery-region min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-0.5"
      >
        {hasImages ? children : <GalleryEmpty />}
      </ScrollFadeViewport>
    </div>
  );
}
