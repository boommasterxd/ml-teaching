import { useId, type MouseEventHandler, type ReactNode, type Ref } from 'react';
import { ArrowRight } from './icons/arrow-right';
import { Plus } from './icons/plus';
import { ML } from '../constants';
import Button from './Button';
import PageHeader from './PageHeader';
import { Badge } from './ui/badge';
import type { TrainingStep } from './training-panel-loading';
import { Heading, Text } from './ui/typography';
import { cn } from '@/lib/utils';

interface CollectionContinueProps {
  canContinue: boolean;
  onContinue?: () => void;
  onContinueIntent?: () => void;
}

interface CollectionFrameControls extends CollectionContinueProps {
  mainHeadingRef?: Ref<HTMLHeadingElement>;
  continueRef?: Ref<HTMLButtonElement>;
}

export const collectionGridClass = 'grid grid-cols-1 gap-4 lg:grid-cols-2';

export function CollectionContinue({
  canContinue,
  onContinue,
  onContinueIntent,
  placement,
  buttonRef,
}: CollectionContinueProps & {
  placement: 'top' | 'bottom';
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const top = placement === 'top';
  return (
    <Button
      ref={buttonRef}
      variant={canContinue ? 'default' : 'outline'}
      size={top ? 'sm' : 'lg'}
      className={cn(
        'min-h-11 shrink-0 disabled:border-border disabled:text-muted-foreground disabled:opacity-100',
        top
          ? 'px-2.5 has-[>svg]:px-2.5 sm:px-4 sm:has-[>svg]:px-4'
          : 'max-sm:border-0 max-sm:bg-transparent max-sm:px-3 max-sm:text-primary max-sm:shadow-none max-sm:hover:bg-primary/10 max-sm:disabled:text-muted-foreground',
      )}
      disabled={!canContinue}
      aria-label="Weiter zum Training"
      onClick={onContinue}
      onPointerEnter={onContinueIntent}
      onFocus={onContinueIntent}
      onPointerDown={onContinueIntent}
    >
      <span className="sm:hidden">Weiter</span>
      <span className="hidden sm:inline">Weiter zum Training</span>
      <ArrowRight data-icon="inline-end" aria-hidden="true" />
    </Button>
  );
}

function CollectionHeader({
  mainHeadingRef,
  continueRef,
  canContinue,
  onContinue,
  onContinueIntent,
}: CollectionFrameControls) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
      <Heading
        as="h2"
        id="training-images"
        ref={mainHeadingRef}
        tabIndex={-1}
        className="scroll-mt-28 border-0 pb-0 text-lg leading-tight font-semibold min-[23rem]:text-xl sm:text-3xl"
      >
        Bilder sammeln
      </Heading>
      <CollectionContinue
        buttonRef={continueRef}
        canContinue={canContinue}
        onContinue={onContinue}
        onContinueIntent={onContinueIntent}
        placement="top"
      />
    </div>
  );
}

export default function TrainingCollectionFrame({
  children,
  actions,
  ...controls
}: CollectionFrameControls & { children: ReactNode; actions: ReactNode }) {
  return (
    <section aria-labelledby="training-images" className="flex min-w-0 flex-col">
      <CollectionHeader {...controls} />
      {/* Keep the mobile hint below the classes and out of scroll anchoring. */}
      <Text
        variant="muted"
        className={cn(
          'mt-3 max-w-prose text-pretty max-sm:order-last max-sm:[overflow-anchor:none]',
          controls.canContinue && 'invisible',
        )}
      >
        Mindestens {ML.MIN_CLASSES} Klassen, eindeutige Namen und je {ML.MIN_IMAGES_PER_CLASS}{' '}
        Bilder.
      </Text>
      {children}
      {actions}
    </section>
  );
}

export function CollectionActionsFrame({
  atLimit = false,
  onAdd,
  children,
}: {
  atLimit?: boolean;
  onAdd?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  const limitDescription = useId();

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <Button
        variant="secondary"
        size="lg"
        className="h-auto min-h-11 min-w-0 max-w-full whitespace-normal max-sm:flex-[1_1_max-content] max-sm:px-3"
        disabled={atLimit}
        aria-label="Neue Klasse hinzufügen"
        aria-describedby={atLimit ? limitDescription : undefined}
        onClick={onAdd}
      >
        <Plus data-icon="inline-start" aria-hidden="true" />
        <span className="min-w-0 wrap-anywhere">Neue Klasse</span>
      </Button>
      {children}
      {atLimit && (
        <Text id={limitDescription} variant="muted" className="w-full text-sm">
          Maximale Klassenanzahl von {ML.MAX_CLASSES} erreicht.
        </Text>
      )}
    </div>
  );
}

export const trainingSteps = [
  { step: 'images', id: 'training-images', label: 'Bilder sammeln' },
  { step: 'training', id: 'training-model', label: 'Training' },
  { step: 'prediction', id: 'training-prediction', label: 'Vorhersage' },
] as const;

export function TrainingWorkspaceHeader({
  currentStep,
  ready,
  canTrain,
  canPredict,
  onSelect,
  onPrepare,
}: {
  currentStep: TrainingStep;
  ready: boolean;
  canTrain: boolean;
  canPredict: boolean;
  onSelect?: (step: TrainingStep) => void;
  onPrepare?: (step: TrainingStep) => void;
}) {
  return (
    <PageHeader
      title="Dein Bildmodell"
      description="Welche Motive soll dein Modell unterscheiden? Benenne die Klassen zum Beispiel „Tasse“ und „Stift“."
      rightSlot={
        <nav
          aria-label="Trainingsablauf"
          className="max-sm:@container/training-steps"
          inert={!ready}
        >
          <ol className="flex flex-wrap justify-between gap-1 sm:justify-start">
            {trainingSteps.map(({ step, label }, index) => (
              <li key={step} className="sm:grow lg:grow-0">
                <Button
                  id={`training-step-${step}`}
                  variant="ghost"
                  size="sm"
                  className="training-step transition-none hover:bg-transparent dark:hover:bg-transparent"
                  aria-current={step === currentStep ? 'step' : undefined}
                  disabled={step === 'training' ? !canTrain : step === 'prediction' && !canPredict}
                  onClick={() => onSelect?.(step)}
                  onPointerEnter={() => onPrepare?.(step)}
                  onFocus={() => onPrepare?.(step)}
                  onPointerDown={() => onPrepare?.(step)}
                >
                  <span className="training-step-content">
                    <Badge
                      variant={step === currentStep ? 'default' : 'secondary'}
                      className="training-step-number p-0 tabular-nums max-sm:pt-px max-sm:leading-none"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </Badge>
                    {index === 0 ? (
                      <>
                        <span aria-hidden="true" className="sm:hidden">
                          Bilder
                        </span>
                        <span className="sr-only sm:not-sr-only">{label}</span>
                      </>
                    ) : (
                      label
                    )}
                  </span>
                </Button>
              </li>
            ))}
          </ol>
        </nav>
      }
    />
  );
}
