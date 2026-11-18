import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight } from '@/components/icons/arrow-right';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { Heading, Text } from '@/components/ui/typography';
import HeroScene from '@/components/hero/HeroScene';
import HeroAccent from '@/components/hero/HeroAccent';
import ExperimentsLink from '@/components/home/ExperimentsLink';
import { HomePlaybackProvider } from '@/components/home/HomePlaybackProvider';
import { learningPaths } from '@/lib/learning-paths';
import {
  HomeCallToAction,
  HomeIntroduction,
  HomePerspectives,
  HomePurpose,
  HomeQuestions,
} from '@/content/landing/home-content';
import HomeLearningSections from '@/content/landing/home-learning-sections';

/** The introduction and learning choices remain complete in build-time HTML. */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <HomePlaybackProvider>
        <section className="hero-section" aria-labelledby="hero-title">
          <HeroScene>
            <div className="hero-copy landing-container">
              <Heading as="h1" variant="hero" id="hero-title">
                Du probierst.
                <br />
                <HeroAccent text="Deine KI lernt." />
              </Heading>
              <EntryReveal kind="hero" index={1} asChild>
                <Text variant="lead" className="hero-description">
                  Probiere aus, wie KI Bilder erkennt und durch Belohnungen lernt.
                </Text>
              </EntryReveal>
              <EntryReveal kind="hero" index={2} asChild>
                <div className="hero-actions">
                  <AnimatedLink href={learningPaths.hub} size="lg">
                    Zum Lernlabor <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </AnimatedLink>
                  <ExperimentsLink />
                </div>
              </EntryReveal>
            </div>
          </HeroScene>
        </section>
        <HomeIntroduction />
        <HomePurpose />
        <HomeLearningSections />
      </HomePlaybackProvider>
      <HomePerspectives />
      <HomeQuestions />
      <HomeCallToAction />
    </div>
  );
}
