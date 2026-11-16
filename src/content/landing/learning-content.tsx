import AnimatedLink from '@/components/AnimatedLink';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from '@/components/ui/card';
import {
  ImagePlus,
  Lightbulb,
  Camera,
  Smartphone,
  Car,
  Stethoscope,
  ArrowRight,
} from '@/components/icons';

const tips = [
  {
    Icon: ImagePlus,
    title: 'Mehr Perspektiven.',
    text: 'Sammle mindestens 15–20 Bilder pro Klasse. Zeige dein Objekt von vorne, von oben und von der Seite.',
  },
  {
    Icon: Lightbulb,
    title: 'Weniger Zufall.',
    text: 'Wechsle Licht und Hintergrund. Sonst erkennt dein Modell vielleicht dein Zimmer statt deiner Tasse.',
  },
  {
    Icon: Camera,
    title: 'Ehrlich testen.',
    text: 'Teste mit neuen Bildern. Wird etwas verwechselt? Ergänze Beispiele und trainiere noch einmal.',
  },
];
const examples = [
  {
    Icon: Smartphone,
    title: 'Auf deinem Handy',
    text: 'Gesichtserkennung und Filter finden Muster in Bildern. Manche Anwendungen verarbeiten dabei sensible Daten.',
  },
  {
    Icon: Car,
    title: 'Unterwegs',
    text: 'Kamerasysteme erkennen Verkehrsschilder und Hindernisse. Ein einzelnes Modell ersetzt dabei keine verlässliche Sicherheitsentscheidung.',
  },
  {
    Icon: Stethoscope,
    title: 'In der Medizin',
    text: 'Bilderkennung unterstützt die Auswertung medizinischer Aufnahmen. Die Beurteilung bleibt Aufgabe von Fachleuten.',
  },
];

export const learningContent = (
  <>
    <section className="landing-section landing-container" aria-labelledby="section-tips">
      <div className="landing-section-heading">
        <p className="eyebrow">04 / BESSERE BEISPIELE. BESSERES LERNEN.</p>
        <h2 id="section-tips" className="section-heading">
          Eine gute KI
          <br />
          beginnt bei deinen Daten.
        </h2>
        <p className="section-lead">
          Wenn das Ergebnis überrascht, ist das kein Ende. Es ist der Anfang deines nächsten
          Experiments.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {tips.map(({ Icon, title, text }) => (
          <ScrollReveal key={title}>
            <Card variant="feature">
              <CardHeader variant="explanation">
                <CardIcon tone="primary" className="mb-6">
                  <Icon />
                </CardIcon>
                <CardTitle as="h3" variant="feature" className="mb-3">
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

    <section className="landing-section landing-container" aria-labelledby="section-examples">
      <div className="landing-section-heading">
        <p className="eyebrow">05 / NICHT NUR IM LABOR</p>
        <h2 id="section-examples" className="section-heading">
          Muster sind überall.
        </h2>
        <p className="section-lead">
          Bilderkennung begegnet dir längst im Alltag. Hier erforschst du das Prinzip dahinter.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {examples.map(({ Icon, title, text }) => (
          <ScrollReveal key={title}>
            <Card variant="open">
              <CardHeader variant="explanation">
                <CardIcon tone="primary" className="mb-6">
                  <Icon />
                </CardIcon>
                <CardTitle as="h3" variant="feature" className="mb-3">
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

    <section className="landing-cta landing-section" aria-labelledby="section-cta">
      <div className="landing-container">
        <p className="eyebrow">DEIN NÄCHSTES AHA WARTET.</p>
        <h2 id="section-cta" className="section-heading">
          Was bringst du
          <br />
          deiner KI bei?
        </h2>
        <p className="section-lead">
          Nimm deine Idee mit ins Labor. Alles, was du brauchst, ist ein Browser und etwas Neugier.
        </p>
        <AnimatedLink href="/lernen" variant="primary" size="xl">
          Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </AnimatedLink>
      </div>
    </section>
  </>
);
