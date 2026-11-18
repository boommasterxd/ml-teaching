import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight } from '@/components/icons/arrow-right';
import ScrollReveal from '@/components/hero/ScrollReveal';
import InputExperiment from '@/components/home/InputExperiment';
import { PreviewCycleProvider } from '@/components/home/PreviewCycle';
import { RewardPreview } from '@/components/home/RewardExperiment';
import { Heading, Text } from '@/components/ui/typography';
import { learningAreas } from '@/content/learning-areas';
import { rewardPreviewId } from '@/lib/learning-paths';

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
          {learningAreas.map(({ id, title, explanation }, index) => (
            <ScrollReveal
              key={id}
              kind="reading"
              index={index}
              asChild
              className="grid min-w-0 gap-4 lg:row-span-2 lg:grid-rows-subgrid"
            >
              <section
                id={id === 'images' ? 'bilderkennung' : rewardPreviewId}
                tabIndex={id === 'q-learning' ? -1 : undefined}
                aria-labelledby={`home-${id}-title`}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Heading as="h3" id={`home-${id}-title`}>
                      {title}
                    </Heading>
                    {id === 'q-learning' && <Text variant="muted">Reinforcement Learning</Text>}
                  </div>
                  <Text>{explanation}</Text>
                </div>
                <div className="min-w-0 self-center">
                  {id === 'images' ? <InputExperiment /> : <RewardPreview />}
                </div>
              </section>
            </ScrollReveal>
          ))}
          <section
            className="grid gap-y-4 lg:col-span-2 lg:grid-cols-subgrid"
            aria-labelledby="home-preview-actions-title"
          >
            <Heading as="h3" id="home-preview-actions-title" className="lg:col-span-2">
              Willst du es selbst ausprobieren?
            </Heading>
            {learningAreas.map(({ id, href, action }) => (
              <AnimatedLink
                key={id}
                href={href}
                size="lg"
                className="mobile-action h-auto min-h-11 max-w-full justify-self-start whitespace-normal"
              >
                {action} <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </AnimatedLink>
            ))}
          </section>
        </div>
      </PreviewCycleProvider>
    </section>
  );
}
