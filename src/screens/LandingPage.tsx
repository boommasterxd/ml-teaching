import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight, Camera, Zap, Users } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from '@/components/ui/card';
import HeroScene from '@/components/hero/HeroScene';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { neuralNetworkContent } from '@/content/landing/neural-network-content';
import { learningContent } from '@/content/landing/learning-content';

const steps = [
  {
    number: '01',
    Icon: Camera,
    title: 'Zeig ihr deine Welt.',
    text: 'Lege Klassen an. Sammle mit der Kamera oder per Upload verschiedene Bilder von deinen Objekten.',
  },
  {
    number: '02',
    Icon: Users,
    title: 'Mach Muster sichtbar.',
    text: 'Trainiere dein eigenes Modell. Ein vortrainiertes Netz erkennt Merkmale, deine Beispiele geben ihnen Bedeutung.',
  },
  {
    number: '03',
    Icon: Zap,
    title: 'Stell sie auf die Probe.',
    text: 'Halte etwas Neues vor die Kamera. Beobachte, was deine KI erkennt, und verbessere sie mit weiteren Beispielen.',
  },
];

/** The landing page keeps its full reading journey in build-time HTML. */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-container hero-layout" aria-labelledby="hero-title">
        <div className="hero-copy">
          <Badge variant="outline">DEIN KI-LABOR. DIREKT IM BROWSER.</Badge>
          <h1 id="hero-title" className="hero-title">
            Du zeigst.
            <br />
            <span>Deine KI lernt.</span>
          </h1>
          <p className="hero-description">
            Eine Tasse. Deine Hand. Eine neue Idee. Bring deinem Computer bei, Bilder zu
            unterscheiden. Ohne Code, mit deinen eigenen Beispielen.
          </p>
          <div className="hero-actions">
            <AnimatedLink href="/lernen" variant="primary" size="lg">
              Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </AnimatedLink>
            <AnimatedLink href="/#so-funktionierts" variant="secondary" size="lg">
              So funktioniert’s
            </AnimatedLink>
          </div>
          <p className="hero-kicker">Kein Konto. Deine Bilder bleiben auf diesem Gerät.</p>
        </div>
        <HeroScene />
      </section>

      <section
        id="so-funktionierts"
        className="landing-section landing-container"
        aria-labelledby="section-steps"
      >
        <div className="landing-section-heading">
          <p className="eyebrow">01 / SELBST AUSPROBIEREN</p>
          <h2 id="section-steps" className="section-heading">
            Von deiner Idee
            <br />
            zur eigenen KI.
          </h2>
          <p className="section-lead">
            Drei Schritte. Unzählige Aha-Momente. Du entscheidest, was dein Modell lernen soll.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(({ number, Icon, title, text }) => (
            <ScrollReveal key={number}>
              <Card variant="open">
                <CardHeader variant="explanation">
                  <div className="mb-8 flex items-start justify-between">
                    <Badge variant="count">{number}</Badge>
                    <CardIcon tone="primary">
                      <Icon />
                    </CardIcon>
                  </div>
                  <CardTitle as="h3" variant="explanation" className="mb-4">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent variant="explanation">
                  <p>{text}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>
      {neuralNetworkContent}
      {learningContent}
    </div>
  );
}
