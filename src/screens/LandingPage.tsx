import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight } from '@/components/icons/arrow-right';
import { Heading, Text } from '@/components/ui/typography';
import HeroScene from '@/components/hero/HeroScene';
import HeroAccent from '@/components/hero/HeroAccent';
import { heroPosterImages } from '@/components/hero/poster-assets';
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
import { comingSoonLabel, rewardPracticeComingSoon } from '@/content/learning-areas';

/** The introduction and learning choices remain complete in build-time HTML. */
export default function LandingPage() {
  return (
    <div className="landing-page home-glass">
      <HomePlaybackProvider>
        <section className="hero-section" aria-labelledby="hero-title">
          <HeroScene sources={heroPosterImages}>
            <div className="hero-copy">
              <Heading as="h1" variant="hero" id="hero-title">
                Du probierst.
                <br />
                <HeroAccent text="Deine KI lernt." />
              </Heading>
              <Text variant="lead" className="hero-description">
                Probiere aus, wie KI Bilder erkennt und wie sie durch Belohnungen lernt
                {rewardPracticeComingSoon && <span lang="en"> ({comingSoonLabel})</span>}.
              </Text>
              <div className="hero-actions">
                <AnimatedLink
                  href={learningPaths.hub}
                  size="lg"
                  navigationIcon={{
                    content: <ArrowRight data-icon="inline-end" aria-hidden="true" />,
                    position: 'end',
                  }}
                >
                  Lernlabor
                </AnimatedLink>
                <ExperimentsLink />
              </div>
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
