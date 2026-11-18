import AnimatedLink from '@/components/AnimatedLink';
import { AlertTriangle } from '@/components/icons/alert-triangle';
import { ArrowRight } from '@/components/icons/arrow-right';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';
import { learningPaths } from '@/lib/learning-paths';

export function HomeIntroduction() {
  return (
    <section className="landing-section landing-container" aria-labelledby="home-ai-title">
      <ScrollReveal kind="reading">
        <div className="max-w-2xl space-y-4">
          <Heading id="home-ai-title">Was ist künstliche Intelligenz?</Heading>
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
    <section className="landing-section landing-container" aria-labelledby="home-purpose-title">
      <div className="home-reading-grid">
        <ScrollReveal kind="reading">
          <div className="landing-section-heading">
            <Text variant="muted">Unsere Idee</Text>
            <Heading id="home-purpose-title">Warum Kinder KI kennenlernen sollten.</Heading>
            <Text variant="lead">
              Wir glauben, dass Kinder KI früh kennenlernen sollten: neugierig, spielerisch und mit
              Raum für eigene Fragen.
            </Text>
          </div>
        </ScrollReveal>
        <ScrollReveal kind="reading">
          <div className="flex flex-col gap-5">
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
          </div>
        </ScrollReveal>
      </div>
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
      'Ein System kann verschiedene Möglichkeiten vergleichen oder durch Ausprobieren und Belohnungen eine Strategie lernen. Das nennt man Reinforcement Learning.',
    limit:
      'Menschen legen Ziele und Belohnungen fest. Eine gute Punktzahl bedeutet noch nicht, dass eine Entscheidung für alle Menschen gut oder fair ist.',
  },
] as const;

export function HomePerspectives() {
  return (
    <section
      className="landing-section landing-container"
      aria-labelledby="home-perspectives-title"
    >
      <ScrollReveal kind="text">
        <div className="landing-section-heading">
          <Text variant="muted">Chancen und Grenzen</Text>
          <Heading id="home-perspectives-title">Was KI kann und wo sie Grenzen hat.</Heading>
        </div>
      </ScrollReveal>
      <div className="flex flex-col gap-8">
        {perspectives.map(({ title, opportunity, limit }, index) => (
          <ScrollReveal key={title} kind="reading" index={index}>
            <article className="flex flex-col gap-5">
              {index > 0 && <Separator />}
              <Heading as="h3">{title}</Heading>
              <div className="home-reading-grid">
                <Text>{opportunity}</Text>
                <Alert
                  role="note"
                  className="self-start border-destructive/60 bg-destructive/10 [&>svg]:text-destructive"
                >
                  <AlertTriangle aria-hidden="true" />
                  <AlertDescription className="text-base text-foreground [&_p]:leading-7">
                    <p>
                      <span className="sr-only">Achtung: </span>
                      {limit}
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

const questions = [
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
    <article className="flex flex-col gap-3">
      <Heading as="h3">{question}</Heading>
      <Text>{answer}</Text>
    </article>
  );
}

export function HomeQuestions() {
  return (
    <section className="landing-section landing-container" aria-labelledby="home-questions-title">
      <div className="home-reading-grid">
        <ScrollReveal kind="text">
          <div className="flex flex-col gap-8">
            <div className="landing-section-heading">
              <Text variant="muted">Vor dem Start</Text>
              <Heading id="home-questions-title">KI lernen, ohne Vorwissen.</Heading>
            </div>
            <HomeQuestion
              question="Brauche ich eine Kamera?"
              answer="Nein. Für die Bilderkennung kannst du Fotos von deinem Gerät auswählen. In der Belohnungsübung wählst du zwischen Stern und Schatz."
            />
          </div>
        </ScrollReveal>
        <div className="flex flex-col gap-8">
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
    <section className="landing-cta" aria-labelledby="home-cta-title">
      <ScrollReveal kind="text">
        <div className="landing-container flex flex-col items-center gap-6">
          <Heading id="home-cta-title">Was möchtest du deiner KI beibringen?</Heading>
          <AnimatedLink href={learningPaths.hub} size="lg" className="mobile-action">
            Zum Lernlabor <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </AnimatedLink>
        </div>
      </ScrollReveal>
    </section>
  );
}
