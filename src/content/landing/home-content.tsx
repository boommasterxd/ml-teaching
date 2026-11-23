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
            Künstliche Intelligenz (KI) umfasst Verfahren, mit denen Computer Muster erkennen,
            Schlüsse ziehen oder Handlungen planen können. KI kann zum Beispiel Texte übersetzen,
            Musik empfehlen oder Spielzüge vorschlagen. Viele KI-Systeme lernen aus Beispielen oder
            durch Rückmeldungen.
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
              Wir glauben, dass Kinder KI früh kennenlernen sollten: neugierig, spielerisch und mit
              Raum für eigene Fragen.
            </Text>
          </CardHeader>
        </ScrollReveal>
        <ScrollReveal kind="reading" className="self-center">
          <CardContent className="home-purpose-body px-0">
            <PurposeWaveform />
            <Text>
              KI prägt mit, wie wir Informationen finden, lernen und kreativ arbeiten. Kinder
              sollten deshalb mehr kennenlernen als fertige Antworten auf einem Bildschirm. Sie
              sollen auch fragen können: Wie entsteht dieses Ergebnis? Welche Beispiele fehlen? Und
              wann liegt die KI daneben?
            </Text>
            <Text>
              Du sammelst Beispiele, testest dein Modell und prüfst seine Fehler. Dafür brauchst du
              keine Programmierkenntnisse.
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
    opportunity:
      'KI kann beim Schreiben, Übersetzen und Gestalten unterstützen. Sie liefert Vorschläge, aus denen Menschen etwas Eigenes machen können.',
    limit:
      'Ein überzeugend klingender Text kann falsch sein. Prüfe wichtige Aussagen mit verlässlichen Quellen, statt sie einfach zu übernehmen.',
  },
  {
    title: 'Muster entdecken',
    opportunity:
      'In der Forschung kann KI helfen, große Datenmengen zu untersuchen, etwa Bilder aus der Medizin oder Beobachtungen der Umwelt.',
    limit:
      'Was ein Modell erkennt, hängt auch von seinen Trainingsdaten ab. Fehlen bestimmte Beispiele, können seine Ergebnisse einseitig oder unzuverlässig sein.',
  },
  {
    title: 'Entscheidungen unterstützen',
    opportunity:
      'Beim Reinforcement Learning probiert eine Spielfigur verschiedene Aktionen aus. Aus den Belohnungen lernt sie, welche Entscheidungen sich auf Dauer lohnen.',
    limit:
      'Menschen legen Ziele und Belohnungen fest. Eine gute Punktzahl bedeutet noch nicht, dass eine Entscheidung für alle Menschen gut oder fair ist.',
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
    'Nein. Für die Bilderkennung kannst du Fotos von deinem Gerät auswählen. Für das Lernen durch Belohnung gibt es hier eine Vorschau.',
  ],
  [
    'Muss ich programmieren können?',
    'Nein. Du startest mit Bildern, verständlichen Erklärungen und kleinen Aufgaben. Beim Bilderkennungsmodell legst du deine eigenen Gruppen an und probierst aus, wie das Modell neue Bilder zuordnet.',
  ],
  [
    'Ist jede KI ein Chatbot?',
    'Nein. Ein Chatbot ist nur eine mögliche Anwendung. Andere KI-Systeme erkennen Bilder, verarbeiten Sprache oder lernen, welche Aktion sie als Nächstes ausführen sollen.',
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
            >
              Zum Lernlabor <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </AnimatedLink>
          </CardFooter>
        </Card>
      </ScrollReveal>
    </section>
  );
}
