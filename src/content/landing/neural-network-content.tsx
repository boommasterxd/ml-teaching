import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { Brain } from '@/components/icons/brain';
import { Users } from '@/components/icons/users';
import { Card } from '@/components/ui/card';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Heading, Text } from '@/components/ui/typography';

const techniques = [
  {
    title: 'MobileNet',
    Icon: Brain,
    source: {
      href: 'https://arxiv.org/abs/1801.04381',
      label: 'Originalarbeit zur MobileNetV2-Architektur',
    },
    descriptions: [
      'Ein Foto besteht für den Computer aus vielen farbigen Bildpunkten. MobileNet verarbeitet sie in mehreren Schritten: Zuerst erfasst es einfache Merkmale wie helle und dunkle Kanten. Spätere Schichten verbinden solche Merkmale zu komplizierteren Mustern. Die Kästchen bei „Kanten“ und „Muster“ zeigen das vereinfacht.',
      'Am Ende entsteht eine Liste von Zahlen, der sogenannte Merkmalsvektor. Er beschreibt die gefundenen Bildmerkmale. Dafür stehen die kleinen Balken bei „Zahlen“. MobileNet berechnet diese Liste direkt in deinem Browser. Ob dein Bild zu „Hund“ oder „Katze“ gehört, entscheidet anschließend KNN.',
    ],
  },
  {
    title: 'KNN',
    Icon: Users,
    source: {
      href: 'https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier#making-a-prediction',
      label: 'KNN-Klassifikation in TensorFlow.js',
    },
    descriptions: [
      'KNN heißt „K-Nearest Neighbors“, auf Deutsch etwa „die K nächsten Nachbarn“. Hier ist K gleich drei: KNN sucht die drei Trainingsbilder, deren Zahlenlisten dem neuen Bild am ähnlichsten sind. Jedes dieser Beispiele hat von dir bereits einen Namen bekommen, etwa „Hund“ oder „Katze“.',
      'Im Diagramm stehen die Kreise und Quadrate für solche Beispiele. Die Raute ist das neue Bild. Die Linien verbinden es mit seinen drei nächsten Nachbarn. Sind zwei davon Hunde und einer eine Katze, gewinnt „Hund“ mit zwei Stimmen. Genau das zeigen die Balken bei „Ausgabe“. Die Lage der Punkte ist ein vereinfachtes Beispiel, keine echte Messung von MobileNet.',
    ],
  },
];

export function ImageAnimationSection() {
  return (
    <section aria-labelledby="section-neural-net">
      <div className="landing-container landing-section">
        <ScrollReveal kind="text">
          <div className="landing-section-heading">
            <Text variant="muted">02 / Bilderkennung</Text>
            <Heading id="section-neural-net">Vom Bild zur Zuordnung.</Heading>
            <Text id="network-demo-intro" variant="lead">
              Wähle Hund oder Katze. Folge dem Bild durch MobileNet, den Nachbarvergleich und die
              Ausgabe.
            </Text>
          </div>
        </ScrollReveal>
        <EntryReveal kind="surface">
          <DeferredNetworkDemo />
        </EntryReveal>
      </div>
    </section>
  );
}

export function ImageTechniqueSection() {
  return (
    <section
      className="landing-container landing-section landing-technique-layout"
      aria-labelledby="section-explanation"
    >
      <div className="h-full">
        <div className="landing-technique-copy">
          <EntryReveal kind="text" asChild>
            <div className="flex flex-col gap-5">
              <Text variant="muted" className="image-chapter-label">
                01 / Die Technik
              </Text>
              <Heading id="section-explanation">MobileNet und KNN</Heading>
              <Text variant="lead" className="image-technique-intro">
                Du zeigst ein neues Bild. MobileNet beschreibt, was darin zu sehen ist, mit Zahlen.
                KNN vergleicht diese Zahlen mit deinen Beispielen und ordnet das Bild einer Gruppe
                zu.
              </Text>
            </div>
          </EntryReveal>
          <EntryReveal kind="reading" index={1} asChild>
            <Text variant="muted">
              MobileNet wurde schon mit vielen Bildern trainiert. Du nutzt seine bereits gelernten
              Bildmerkmale und gibst eigene Beispiele für deine Gruppen hinzu. Eine solche Gruppe
              heißt Klasse, zum Beispiel „Hund“. Das Nutzen eines vortrainierten Netzes nennt man
              Transfer Learning. MobileNet selbst wird hier nicht neu trainiert.
            </Text>
          </EntryReveal>
          <EntryReveal kind="reading" index={2} asChild>
            <Text variant="muted">
              Bilderkennung kennt viele Verfahren. Tiefe neuronale Netze können auch direkt lernen,
              ein Bild einer Klasse zuzuordnen. MobileNet ist selbst ein solches Netz; hier nutzen
              wir seine Bildmerkmale und lassen KNN die Klasse bestimmen. Wir wählen KNN, weil du
              den Vergleich mit den nächsten Beispielen gut nachvollziehen kannst. Eine verwandte
              Aufgabe ist Anomalieerkennung, auf Englisch „Anomaly Detection“: Sie sucht
              Abweichungen vom Gewohnten, etwa einen Riss in einem Bauteil.
            </Text>
          </EntryReveal>
        </div>
      </div>
      <Card className="py-0">
        <ItemGroup aria-label="Bausteine des Modells" className="landing-technique-items">
          {techniques.map(({ title, Icon, descriptions, source }, index) => (
            <ScrollReveal key={title} kind="reading" index={index} asChild>
              <div role="listitem" className="landing-technique-item">
                <Item className="p-0">
                  <ItemContent className="gap-3">
                    <ItemTitle>
                      <ItemMedia variant="icon">
                        <Icon aria-hidden="true" />
                      </ItemMedia>
                      <h3>{title}</h3>
                    </ItemTitle>
                    {descriptions.map((description) => (
                      <ItemDescription key={description} className="line-clamp-none">
                        {description}
                      </ItemDescription>
                    ))}
                    <ItemDescription className="line-clamp-none">
                      <a href={source.href} rel="noreferrer">
                        {source.label}
                      </a>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            </ScrollReveal>
          ))}
        </ItemGroup>
      </Card>
    </section>
  );
}
