import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight } from '@/components/icons/arrow-right';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';
import { learningPaths } from '@/lib/learning-paths';

export function HomeIntroduction() {
  return (
    <section className="landing-section landing-container" aria-labelledby="home-ai-title">
      <div className="home-reading-grid">
        <ScrollReveal kind="reading">
          <div className="landing-section-heading">
            <Text variant="muted">Kurz erklärt</Text>
            <Heading id="home-ai-title">Was ist künstliche Intelligenz?</Heading>
            <Text variant="lead">
              Von der Foto-App bis zum Sprachassistenten: Künstliche Intelligenz, kurz KI, hilft
              Computern, Bilder zu erkennen, Sprache zu verarbeiten oder Entscheidungen zu
              unterstützen.
            </Text>
            <Text>
              Viele KI-Systeme lernen aus Beispielen oder durch Ausprobieren. Das Gelernte steckt in
              einem Modell, das auf neue Eingaben reagieren kann.
            </Text>
          </div>
        </ScrollReveal>
        <ScrollReveal kind="reading">
          <div className="flex flex-col gap-5">
            <Separator />
            <Heading as="h3">Menschen gestalten KI</Heading>
            <Text>
              Welche Aufgabe soll die KI lösen? Welche Beispiele bekommt sie? Wann gibt es eine
              Belohnung? Diese Entscheidungen prägen, was sie lernt.
            </Text>
            <Separator />
            <Heading as="h3">Ergebnisse prüfen</Heading>
            <Text>
              Eine KI kann sich irren oder einseitige Ergebnisse liefern. Schau deshalb genau hin,
              ob ihre Antwort zur Aufgabe passt.
            </Text>
          </div>
        </ScrollReveal>
      </div>
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
              <Separator />
              <Heading as="h3">{title}</Heading>
              <div className="home-reading-grid">
                <Text>{opportunity}</Text>
                <Text>
                  <strong>Genau hinschauen:</strong> {limit}
                </Text>
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
  [
    'Welche Lernbereiche kann ich ausprobieren?',
    'Bilderkennung mit deinen eigenen Beispielbildern und Reinforcement Learning mit Aktionen, Belohnungen und einer Q-Tabelle.',
  ],
] as const;

export function HomeQuestions() {
  return (
    <section className="landing-section landing-container" aria-labelledby="home-questions-title">
      <div className="home-reading-grid">
        <ScrollReveal kind="text">
          <div className="landing-section-heading">
            <Text variant="muted">Vor dem Start</Text>
            <Heading id="home-questions-title">KI lernen, ohne Vorwissen.</Heading>
          </div>
        </ScrollReveal>
        <div className="flex flex-col gap-8">
          {questions.map(([question, answer], index) => (
            <ScrollReveal key={question} kind="reading" index={index}>
              <article className="flex flex-col gap-3">
                <Heading as="h3">{question}</Heading>
                <Text>{answer}</Text>
              </article>
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
