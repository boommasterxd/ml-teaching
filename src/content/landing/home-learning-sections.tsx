import AnimatedLink from '@/components/AnimatedLink';
import Button from '@/components/Button';
import { ArrowRight } from '@/components/icons/arrow-right';
import ScrollReveal from '@/components/hero/ScrollReveal';
import InputExperiment from '@/components/home/InputExperiment';
import { PreviewCycleProvider } from '@/components/home/PreviewCycle';
import { RewardPreview } from '@/components/home/RewardExperiment';
import { Heading, Text } from '@/components/ui/typography';
import { learningAreas } from '@/content/learning-areas';
import { rewardPreviewId } from '@/lib/learning-paths';
import { cn } from '@/lib/utils';

const rewardPracticeComingSoon = true;
const rewardAvailabilityId = 'home-reward-availability';
const practiceActionClassName =
  'mobile-action h-auto min-h-11 max-w-full justify-self-start whitespace-normal lg:row-start-4';

function PreviewAction({
  href,
  action,
  comingSoon,
}: Pick<(typeof learningAreas)[number], 'href' | 'action'> & { comingSoon: boolean }) {
  const label = (
    <>
      {action} <ArrowRight data-icon="inline-end" aria-hidden="true" />
    </>
  );
  return comingSoon ? (
    <Button
      disabled
      size="lg"
      className={practiceActionClassName}
      aria-describedby={rewardAvailabilityId}
    >
      {label}
    </Button>
  ) : (
    <AnimatedLink href={href} size="lg" className={practiceActionClassName}>
      {label}
    </AnimatedLink>
  );
}

/** Each learning method pairs its own explanation with the matching local experiment. */
export default function HomeLearningSections() {
  return (
    <section
      id="lernbereiche"
      tabIndex={-1}
      className="landing-section landing-container"
      aria-labelledby="home-experiments-title"
    >
      <ScrollReveal kind="reading">
        <Heading id="home-experiments-title">Zwei Arten, wie KI lernt</Heading>
      </ScrollReveal>
      <PreviewCycleProvider>
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-4">
          {learningAreas.map(({ id, title, explanation, action, href }, index) => {
            const isRewardPreview = id === 'q-learning';
            const comingSoon = isRewardPreview && rewardPracticeComingSoon;
            return (
              <ScrollReveal
                key={id}
                kind="reading"
                index={index}
                asChild
                className={cn(
                  'grid min-w-0 gap-4 lg:row-span-4 lg:grid-rows-subgrid',
                  comingSoon && 'home-preview-pending',
                )}
              >
                <section
                  id={isRewardPreview ? rewardPreviewId : 'bilderkennung'}
                  tabIndex={isRewardPreview ? -1 : undefined}
                  aria-labelledby={`home-${id}-title`}
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Heading as="h3" id={`home-${id}-title`}>
                        {title}
                      </Heading>
                      {isRewardPreview && <Text variant="muted">Reinforcement Learning</Text>}
                    </div>
                    <Text>{explanation}</Text>
                  </div>
                  <div className="min-w-0 self-center">
                    {isRewardPreview ? <RewardPreview /> : <InputExperiment />}
                  </div>
                  {comingSoon && (
                    <>
                      <div className="home-preview-pending-shade" aria-hidden="true" />
                      <div className="home-preview-pending-overlay">
                        <span id={rewardAvailabilityId} lang="en">
                          Coming Soon
                        </span>
                      </div>
                    </>
                  )}
                  {!isRewardPreview && (
                    <Heading as="h4" className="text-2xl">
                      Willst du es selbst ausprobieren?
                    </Heading>
                  )}
                  <PreviewAction href={href} action={action} comingSoon={comingSoon} />
                </section>
              </ScrollReveal>
            );
          })}
        </div>
      </PreviewCycleProvider>
    </section>
  );
}
