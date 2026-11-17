import AnimatedLink from '@/components/AnimatedLink';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { EntryReveal } from '@/components/ui/entry-reveal';
import EverydayQuiz from '@/components/quiz/EverydayQuiz';
import DeferredKnnQuiz from '@/components/knn-quiz/DeferredKnnQuiz';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { ImagePlus } from '@/components/icons/image-plus';
import { Lightbulb } from '@/components/icons/lightbulb';
import { Camera } from '@/components/icons/camera';
import { ArrowRight } from '@/components/icons/arrow-right';
import { learningPaths } from '@/lib/learning-paths';

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

export function LearningContent() {
  return (
    <>
      <section aria-labelledby="section-tips">
        <div className="landing-section landing-container">
          <ScrollReveal kind="text">
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
              <ScrollReveal key={title} kind="reading" index={index}>
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
      <section aria-labelledby="section-examples">
        <div className="landing-container landing-section">
          <ScrollReveal kind="text">
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
      <section className="landing-container landing-section" aria-labelledby="section-knn-quiz">
        <ScrollReveal kind="text">
          <div className="landing-section-heading">
            <Text variant="muted">06 / KNN ausprobieren</Text>
            <Heading id="section-knn-quiz">Welche Nachbarn zählen?</Heading>
            <Text variant="lead">
              Finde die nächsten Nachbarn der Raute. Entscheide danach, welche Klasse die meisten
              Stimmen bekommt.
            </Text>
          </div>
        </ScrollReveal>
        <EntryReveal kind="surface">
          <DeferredKnnQuiz />
        </EntryReveal>
      </section>
      <ImageTrainingAction />
    </>
  );
}

function ImageTrainingAction() {
  return (
    <section className="landing-cta" aria-labelledby="section-cta">
      <div className="landing-container flex flex-col items-center gap-6">
        <EntryReveal kind="text" asChild>
          <Heading id="section-cta">Trainiere deine eigenen Klassen.</Heading>
        </EntryReveal>
        <EntryReveal kind="text" index={1} className="mobile-action">
          <AnimatedLink href={learningPaths.imagePractice} size="lg" className="mobile-action">
            Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </AnimatedLink>
        </EntryReveal>
      </div>
    </section>
  );
}
