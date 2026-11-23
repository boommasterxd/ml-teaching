import type { ComponentProps, ReactNode } from 'react';
import { Trash2 } from './icons/trash2';
import { RotateCcw } from './icons/rotate-ccw';
import { CheckCircle2 } from './icons/check-circle2';
import { cn } from '../lib/utils';
import { classColorClasses } from '../lib/class-colors';
import { ML } from '../constants';
import type { MLClass } from '../types/ml';
import Button from './Button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Field, FieldLabel } from './ui/field';

export function TrainingClassNameField(props: ComponentProps<typeof Input>) {
  return (
    <div className="min-w-0 flex-1">
      <Input
        type="text"
        autoComplete="off"
        maxLength={ML.MAX_CLASS_NAME_LENGTH}
        className="h-10 min-w-0 rounded-xl bg-background/60 font-medium dark:bg-background/60"
        {...props}
      />
    </div>
  );
}

export function trainingGalleryLabel(cls: MLClass, position: number) {
  return `Trainingsbilder von Klasse ${position}: ${cls.name.trim() || 'ohne Namen'}, scrollbar`;
}

export default function TrainingClassFrame({
  cls,
  position,
  nameError,
  nameField,
  children,
}: {
  cls: MLClass;
  position: number;
  nameError?: string;
  nameField?: ReactNode;
  children: ReactNode;
}) {
  const count = cls.images.length;
  const enoughImages = count >= ML.MIN_IMAGES_PER_CLASS;
  const atLimit = count >= ML.MAX_IMAGES_PER_CLASS;
  return (
    <Card className="@container/training-class gap-4 py-4 lg:h-full">
      <CardHeader className="items-center px-4 @md/training-class:px-5">
        <Field data-invalid={!!nameError} className="min-w-0 gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'size-2.5 shrink-0 rounded-full bg-[var(--class-on-surface)]',
                classColorClasses(cls.color),
              )}
              aria-hidden="true"
            />
            <FieldLabel htmlFor={`class-name-${cls.id}`} className="sr-only">
              Name für Klasse {position}: {cls.name.trim() || 'ohne Namen'}
            </FieldLabel>
            {nameField ?? (
              <TrainingClassNameField id={`class-name-${cls.id}`} value={cls.name} readOnly />
            )}
            <Badge
              variant="secondary"
              className="min-h-7 max-w-[50%] px-2.5 whitespace-normal tabular-nums"
              title={`Mindestens ${ML.MIN_IMAGES_PER_CLASS}, maximal ${ML.MAX_IMAGES_PER_CLASS} Bilder pro Klasse`}
            >
              {enoughImages && <CheckCircle2 className="text-success" aria-hidden="true" />}
              <span>
                {enoughImages ? `${count} Bilder` : `${count} / ${ML.MIN_IMAGES_PER_CLASS} Bilder`}
                {atLimit && ' · Limit erreicht'}
              </span>
            </Badge>
          </div>
        </Field>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-3 px-4 @md/training-class:px-5 @xl/training-class:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]">
        {children}
      </CardContent>
    </Card>
  );
}

export function ClassManagementActions({
  cls,
  position,
  onClear,
  onRemove,
  onPrepare,
}: {
  cls: MLClass;
  position: number;
  onClear?: () => void;
  onRemove?: () => void;
  onPrepare?: () => void;
}) {
  const name = cls.name.trim() || 'ohne Namen';
  return (
    <>
      <Button
        variant="outline"
        className="h-auto min-h-11 min-w-0 px-2"
        aria-haspopup="dialog"
        onPointerEnter={onPrepare}
        onFocus={onPrepare}
        onPointerDown={onPrepare}
        onClick={onClear}
        title="Bilder dieser Klasse zurücksetzen"
        aria-label={`Bilder der Klasse ${position}: ${name} zurücksetzen`}
      >
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        <span className="hidden @md/training-class:inline">Zurücksetzen</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto min-h-11 min-w-0 px-2 text-destructive hover:text-destructive"
        aria-haspopup="dialog"
        onPointerEnter={onPrepare}
        onFocus={onPrepare}
        onPointerDown={onPrepare}
        onClick={onRemove}
        title="Klasse löschen"
        aria-label={`Klasse ${position}: ${name} löschen`}
      >
        <Trash2 data-icon="inline-start" aria-hidden="true" />
        <span className="hidden @md/training-class:inline">Löschen</span>
      </Button>
    </>
  );
}
