import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight, Camera, Zap, Users, Check } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import LearningCard from '@/components/LearningCard';
import { Heading, Text } from '@/components/ui/typography';
import HeroScene from '@/components/hero/HeroScene';
import HeroAccent from '@/components/hero/HeroAccent';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { neuralNetworkContent } from '@/content/landing/neural-network-content';
import { learningContent } from '@/content/landing/learning-content';
import { AnimateIcon } from '@animate-ui/react/icons';

const steps = [
  {
    number: '01',
    Icon: Camera,
    title: 'Bilder sammeln',
    text: 'Lege Klassen an und füge für jede Klasse Bilder hinzu: mit der Kamera oder per Upload.',
  },
  {
    number: '02',
    Icon: Users,
    title: 'Modell trainieren',
    text: 'Starte das Training. Das Modell lernt, deine Klassen anhand der Bildmerkmale zu unterscheiden.',
  },
  {
    number: '03',
    Icon: Zap,
    title: 'Ergebnis testen',
    text: 'Zeige der Kamera ein neues Bild. Bei Verwechslungen helfen zusätzliche Trainingsbilder.',
  },
];

/** The landing page keeps its full reading journey in build-time HTML. */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-section" aria-labelledby="hero-title">
        <HeroScene>
          <div className="hero-copy landing-container">
            <AnimateIcon animateOnHover className="contents">
              <Badge variant="outline">
                <Zap aria-hidden="true" /> Dein KI-Labor im Browser
              </Badge>
            </AnimateIcon>
            <Heading as="h1" variant="hero" id="hero-title">
              Du zeigst.
              <br />
              <HeroAccent text="Deine KI lernt." />
            </Heading>
            <Text variant="lead" className="hero-description">
              Eine Tasse. Deine Hand. Eine neue Idee. Bring deinem Computer bei, Bilder zu
              unterscheiden. Ohne Code, mit deinen eigenen Beispielen.
            </Text>
            <div className="hero-actions">
              <AnimatedLink href="/lernen" size="lg">
                Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </AnimatedLink>
              <AnimatedLink href="/#so-funktionierts" variant="outline" size="lg">
                So funktioniert’s
              </AnimatedLink>
            </div>
            <AnimateIcon animateOnHover className="contents">
              <Text variant="muted" className="hero-kicker">
                <Check aria-hidden="true" /> Kein Konto. Deine Bilder bleiben auf diesem Gerät.
              </Text>
            </AnimateIcon>
          </div>
        </HeroScene>
      </section>

      <section
        id="so-funktionierts"
        className="landing-section landing-container"
        aria-labelledby="section-steps"
      >
        <ScrollReveal>
          <div className="landing-section-heading">
            <Badge variant="secondary">01 / Selbst ausprobieren</Badge>
            <Heading id="section-steps">So trainierst du dein Modell.</Heading>
            <Text variant="lead">
              Sammle Bilder, trainiere das Modell und teste es mit neuen Aufnahmen.
            </Text>
          </div>
        </ScrollReveal>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(({ number, Icon, title, text }) => (
            <ScrollReveal key={number}>
              <LearningCard title={title} description={text} icon={Icon} marker={number} />
            </ScrollReveal>
          ))}
        </div>
      </section>
      {neuralNetworkContent}
      {learningContent}
    </div>
  );
}
