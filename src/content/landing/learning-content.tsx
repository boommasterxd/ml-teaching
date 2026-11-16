import AnimatedLink from '@/components/AnimatedLink';
import ScrollReveal from '@/components/hero/ScrollReveal';
import EverydayQuiz from '@/components/quiz/EverydayQuiz';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { ImagePlus, Lightbulb, Camera, ArrowRight } from '@/components/icons';

const tips = [
  {
    Icon: ImagePlus,
    title: 'Mehr Ansichten',
    text: 'Sammle mindestens 15–20 Bilder pro Klasse. Zeige dein Objekt von vorne, von oben und von der Seite.',
  },
  {
    Icon: Lightbulb,
    title: 'Andere Hintergründe',
    text: 'Wechsle Licht und Hintergrund. Sonst erkennt dein Modell vielleicht dein Zimmer statt deiner Tasse.',
  },
  {
    Icon: Camera,
    title: 'Neue Bilder testen',
    text: 'Teste mit neuen Bildern. Wird etwas verwechselt? Ergänze Beispiele und trainiere noch einmal.',
  },
];

export const learningContent = (
  <>
    <section className="landing-guidance" aria-labelledby="section-tips">
      <div className="landing-section landing-container">
        <ScrollReveal>
          <div className="landing-section-heading">
            <Text variant="muted">04 / Bessere Beispiele</Text>
            <Heading id="section-tips">Bessere Trainingsbilder</Heading>
            <Text variant="lead">
              Unterschiedliche Aufnahmen helfen dem Modell, das Objekt statt des Hintergrunds zu
              erkennen.
            </Text>
          </div>
        </ScrollReveal>
        <ItemGroup aria-label="Tipps für Trainingsbilder">
          {tips.map(({ Icon, title, text }, index) => (
            <ScrollReveal key={title}>
              <div role="listitem">
                <Separator />
                <Item>
                  <ItemContent className="landing-tip-content">
                    <ItemTitle>
                      <Text variant="lead" className="shrink-0 font-mono tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <h3>{title}</h3>
                    </ItemTitle>
                    <ItemDescription className="line-clamp-none">{text}</ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            </ScrollReveal>
          ))}
        </ItemGroup>
      </div>
    </section>
    <section className="landing-band" aria-labelledby="section-examples">
      <div className="landing-container landing-section">
        <ScrollReveal>
          <div className="landing-section-heading">
            <Text variant="muted">05 / Im Alltag</Text>
            <Heading id="section-examples">Wo steckt Bilderkennung drin?</Heading>
            <Text variant="lead">
              Wähle die drei Beispiele aus, bei denen Bilderkennung zum Einsatz kommt.
            </Text>
          </div>
        </ScrollReveal>
        <EverydayQuiz />
      </div>
    </section>
    <section className="landing-cta" aria-labelledby="section-cta">
      <div className="landing-container flex flex-col items-center gap-6">
        <Heading id="section-cta">Trainiere deine eigenen Klassen.</Heading>
        <Text variant="lead" className="max-w-xl">
          Öffne das Lernlabor und füge deine ersten Bilder hinzu.
        </Text>
        <AnimatedLink href="/lernen" size="lg">
          Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </AnimatedLink>
      </div>
    </section>
  </>
);
