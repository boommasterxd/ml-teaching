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
import { Spinner } from './ui/spinner';

export function TrainingClassNameField(props: ComponentProps<typeof Input>) {
  return (
    <Input
      type="text"
      autoComplete="off"
      maxLength={ML.MAX_CLASS_NAME_LENGTH}
      className="h-10 min-w-0 rounded-xl bg-background/60 font-medium dark:bg-background/60"
      {...props}
    />
  );
}

export function trainingGalleryLabel(cls: MLClass, position: number) {
  return `Trainingsbilder von Klasse ${position}: ${cls.name.trim() || 'ohne Namen'}, scrollbar`;
}

export default function TrainingClassFrame({
  cls,
  position,
  nameField,
  children,
}: {
  cls: MLClass;
  position: number;
  nameField?: ReactNode;
  children: ReactNode;
}) {
  const nameId = `class-name-${cls.id}`;
  const count = cls.images.length;
  const enoughImages = count >= ML.MIN_IMAGES_PER_CLASS;
  const atLimit = count >= ML.MAX_IMAGES_PER_CLASS;
  return (
    <Card className="@container/training-class gap-4 py-4 lg:h-full">
      <CardHeader className="items-center px-4 @md/training-class:px-5">
        <Field className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'size-2.5 shrink-0 rounded-full bg-[var(--class-on-surface)]',
                classColorClasses(cls.color),
              )}
              aria-hidden="true"
            />
            <FieldLabel htmlFor={nameId} className="sr-only">
              Name für Klasse {position}: {cls.name.trim() || 'ohne Namen'}
            </FieldLabel>
            <div className="min-w-0 flex-1">
              {nameField ?? <TrainingClassNameField id={nameId} value={cls.name} readOnly />}
            </div>
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
  pendingAction,
}: {
  cls: MLClass;
  position: number;
  onClear?: () => void;
  onRemove?: () => void;
  onPrepare?: () => void;
  pendingAction?: 'clearClass' | 'removeClass' | 'imagePreview';
}) {
  const name = cls.name.trim() || 'ohne Namen';
  const ClearIcon = pendingAction === 'clearClass' ? Spinner : RotateCcw;
  const RemoveIcon = pendingAction === 'removeClass' ? Spinner : Trash2;
  return (
    <>
      <Button
        variant="outline"
        className="h-auto min-h-11 min-w-0 px-2"
        aria-haspopup="dialog"
        aria-busy={pendingAction === 'clearClass' || undefined}
        onPointerEnter={onPrepare}
        onFocus={onPrepare}
        onPointerDown={onPrepare}
        onClick={onClear}
        title="Bilder dieser Klasse zurücksetzen"
        aria-label={`Bilder der Klasse ${position}: ${name} zurücksetzen`}
      >
        <ClearIcon data-icon="inline-start" aria-hidden="true" />
        <span className="hidden @md/training-class:inline">Zurücksetzen</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto min-h-11 min-w-0 px-2 text-destructive hover:text-destructive"
        aria-haspopup="dialog"
        aria-busy={pendingAction === 'removeClass' || undefined}
        onPointerEnter={onPrepare}
        onFocus={onPrepare}
        onPointerDown={onPrepare}
        onClick={onRemove}
        title="Klasse löschen"
        aria-label={`Klasse ${position}: ${name} löschen`}
      >
        <RemoveIcon data-icon="inline-start" aria-hidden="true" />
        <span className="hidden @md/training-class:inline">Löschen</span>
      </Button>
    </>
  );
}
