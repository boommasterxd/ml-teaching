import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight } from '@/components/icons/arrow-right';
import ScrollReveal from '@/components/hero/ScrollReveal';
import InputExperiment from '@/components/home/InputExperiment';
import RewardExperiment from '@/components/home/RewardExperiment';
import { Heading, Text } from '@/components/ui/typography';
import { learningAreas } from '@/content/learning-areas';

/** Each learning method pairs its own explanation with the matching local experiment. */
export default function HomeLearningSections() {
  return (
    <>
      {learningAreas.map(({ id, title, description, steps, href, action }, index) => (
        <section
          key={id}
          id={id === 'images' ? 'lernbereiche' : 'reinforcement-learning'}
          className="landing-section landing-container"
          aria-labelledby={`home-${id}-title`}
        >
          <div className="home-reading-grid home-learning-layout">
            <ScrollReveal kind="reading" className="home-learning-copy min-w-0">
              <div className="flex flex-col items-start gap-6">
                <div className="landing-section-heading">
                  <Text variant="muted">
                    {String(index + 1).padStart(2, '0')} /{' '}
                    {id === 'images' ? 'Lernen mit Beispielen' : 'Lernen durch Belohnungen'}
                  </Text>
                  <Heading id={`home-${id}-title`}>{title}</Heading>
                  <Text>{description}</Text>
                </div>
                <Text variant="small">Das machst du selbst:</Text>
                <ol className="learning-area-steps">
                  {steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </ScrollReveal>
            <ScrollReveal kind="reading" className="home-learning-experiment min-w-0">
              {id === 'images' ? <InputExperiment /> : <RewardExperiment />}
            </ScrollReveal>
            <ScrollReveal kind="reading" className="home-learning-action min-w-0">
              <AnimatedLink
                href={href}
                size="lg"
                className="mobile-action h-auto min-h-11 max-w-full whitespace-normal"
              >
                {action} <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </AnimatedLink>
            </ScrollReveal>
          </div>
        </section>
      ))}
    </>
  );
}
