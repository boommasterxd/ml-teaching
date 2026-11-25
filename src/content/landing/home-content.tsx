import AnimatedLink from '@/components/AnimatedLink';
import { AlertTriangle } from '@/components/icons/alert-triangle';
import { ArrowRight } from '@/components/icons/arrow-right';
import ScrollReveal from '@/components/hero/ScrollReveal';
import PurposeWaveform from '@/components/home/PurposeWaveform';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading, Text } from '@/components/ui/typography';
import { learningPaths } from '@/lib/learning-paths';

export function HomeIntroduction() {
  return (
    <section
      className="home-chapter home-introduction landing-container"
      aria-labelledby="home-ai-title"
    >
      <ScrollReveal kind="reading">
        <div className="home-introduction-grid">
          <Heading id="home-ai-title" className="home-chapter-title">
            Was ist künstliche Intelligenz?
          </Heading>
          <Text>
            Mit künstlicher Intelligenz (KI) können Computer zum Beispiel Bilder zuordnen, Texte
            übersetzen oder Spielzüge vorschlagen. Viele KI-Systeme lernen aus Beispielen oder
            Rückmeldungen.
          </Text>
        </div>
      </ScrollReveal>
    </section>
  );
}

export function HomePurpose() {
  return (
    <section
      className="home-chapter home-purpose landing-container"
      aria-labelledby="home-purpose-title"
    >
      <Card className="home-purpose-grid">
        <ScrollReveal kind="reading">
          <CardHeader className="home-purpose-intro gap-0 px-0">
            <Text className="home-chapter-label" variant="muted">
              Unsere Idee
            </Text>
            <CardTitle id="home-purpose-title" className="home-chapter-title">
              Warum Kinder KI kennenlernen sollten.
            </CardTitle>
            <Text variant="lead" className="home-purpose-lead">
              Entdecke beim Ausprobieren, wie KI lernt und wo sie sich irren kann.
            </Text>
          </CardHeader>
        </ScrollReveal>
        <ScrollReveal kind="reading" className="self-center">
          <CardContent className="home-purpose-body px-0">
            <PurposeWaveform />
            <Text>
              Warum kommt die KI zu diesem Ergebnis? Welche Beispiele fehlen ihr? Im Lernlabor
              kannst du das selbst herausfinden.
            </Text>
            <Text>
              Sammle Bilder, trainiere ein Modell und prüfe, was es erkennt. Das Lernlabor ist
              kostenlos.
            </Text>
          </CardContent>
        </ScrollReveal>
      </Card>
    </section>
  );
}

const perspectives = [
  {
    title: 'Neue Ideen entwickeln',
    opportunity: 'KI kann dir Vorschläge zum Schreiben, Übersetzen und Gestalten machen.',
    limit:
      'Auch ein überzeugender Text kann Fehler enthalten. Prüfe wichtige Aussagen mit verlässlichen Quellen.',
  },
  {
    title: 'Muster entdecken',
    opportunity:
      'KI kann in vielen Bildern nach Mustern suchen, zum Beispiel auf Röntgenaufnahmen.',
    limit: 'Fehlen dem Modell beim Lernen wichtige Beispiele, kann es später mehr Fehler machen.',
  },
  {
    title: 'Entscheidungen unterstützen',
    opportunity:
      'Eine Spielfigur probiert verschiedene Wege aus. An den Punkten erkennt sie, welche sich lohnen.',
    limit:
      'Menschen legen fest, wofür es Punkte gibt. Auch eine hohe Punktzahl kann zu unfairen Entscheidungen führen.',
  },
] as const;

export function HomePerspectives() {
  return (
    <section
      className="home-chapter home-perspectives landing-container"
      aria-labelledby="home-perspectives-title"
    >
      <ScrollReveal kind="text">
        <div className="home-comparison-heading">
          <Text className="home-chapter-label" variant="muted">
            Chancen und Grenzen
          </Text>
          <Heading id="home-perspectives-title" className="home-chapter-title">
            Was KI kann und wo sie Grenzen hat.
          </Heading>
        </div>
      </ScrollReveal>
      <Card className="home-comparison">
        {perspectives.map(({ title, opportunity, limit }, index) => (
          <ScrollReveal
            key={title}
            kind="reading"
            index={index}
            asChild
            className="home-comparison-row"
          >
            <article>
              <Heading as="h3" className="home-chapter-subtitle">
                {title}
              </Heading>
              <Text>{opportunity}</Text>
              <Alert role="note" className="home-comparison-note">
                <AlertTriangle aria-hidden="true" />
                <AlertDescription className="home-comparison-limit">
                  <p>
                    <span className="sr-only">Achtung: </span>
                    {limit}
                  </p>
                </AlertDescription>
              </Alert>
            </article>
          </ScrollReveal>
        ))}
      </Card>
    </section>
  );
}

const questions = [
  [
    'Brauche ich eine Kamera?',
    'Zum Trainieren reichen Fotos von deinem Gerät. Für die Live-Vorhersage brauchst du eine Kamera.',
  ],
  [
    'Muss ich programmieren können?',
    'Nein. Wähle Bilder aus und trainiere dein Modell direkt auf der Website.',
  ],
  [
    'Ist jede KI ein Chatbot?',
    'Nein. KI kann zum Beispiel auch Bilder zuordnen oder gesprochene Wörter erkennen.',
  ],
] as const;

function HomeQuestion({ question, answer }: { question: string; answer: string }) {
  return (
    <article className="home-question">
      <Heading as="h3" className="home-chapter-subtitle">
        {question}
      </Heading>
      <Text>{answer}</Text>
    </article>
  );
}

export function HomeQuestions() {
  return (
    <section className="home-chapter home-questions" aria-labelledby="home-questions-title">
      <div className="home-questions-grid landing-container">
        <ScrollReveal kind="text">
          <div>
            <Text className="home-chapter-label" variant="muted">
              Vor dem Start
            </Text>
            <Heading id="home-questions-title" className="home-chapter-title">
              KI lernen, ohne Vorwissen.
            </Heading>
          </div>
        </ScrollReveal>
        <div className="home-question-list">
          {questions.map(([question, answer], index) => (
            <ScrollReveal key={question} kind="reading" index={index}>
              <HomeQuestion question={question} answer={answer} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeCallToAction() {
  return (
    <section className="home-editorial-cta landing-container" aria-labelledby="home-cta-title">
      <ScrollReveal kind="text">
        <Card rim="ruby" className="home-cta-content">
          <CardHeader className="w-full justify-items-center gap-0 px-0">
            <CardTitle id="home-cta-title" className="home-chapter-title">
              Was möchtest du deiner KI beibringen?
            </CardTitle>
          </CardHeader>
          <CardFooter className="justify-center px-0">
            <AnimatedLink
              href={learningPaths.hub}
              size="lg"
              className="home-cta-action mobile-action"
              navigationIcon={{
                content: <ArrowRight data-icon="inline-end" aria-hidden="true" />,
                position: 'end',
              }}
            >
              Zum Lernlabor
            </AnimatedLink>
          </CardFooter>
        </Card>
      </ScrollReveal>
    </section>
  );
}
