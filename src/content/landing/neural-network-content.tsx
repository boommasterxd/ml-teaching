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
      'MobileNet erkennt zuerst Kanten und setzt sie zu Mustern zusammen. Das zeigen die Kästchen bei „Kanten“ und „Muster“.',
      'Daraus entsteht eine Liste von Zahlen, der Merkmalsvektor. Die Balken bei „Zahlen“ stehen für diese Liste. KNN nutzt sie, um das Bild zuzuordnen.',
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
      'KNN heißt „K-Nearest Neighbors“. K gibt an, wie viele Nachbarn zählen. Hier sucht KNN die drei Trainingsbilder, deren Zahlenlisten der Liste des neuen Bildes am ähnlichsten sind.',
      'Die Raute steht für das neue Bild. Die Linien führen zu seinen nächsten Nachbarn. Sind zwei Hunde und einer eine Katze, gewinnt „Hund“ mit zwei Stimmen. Die Balken bei „Ausgabe“ zeigen die Stimmen. Das Diagramm zeigt ein vereinfachtes Beispiel.',
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
              MobileNet kennt schon viele Bildmerkmale. Du nutzt sie und gibst eigene Beispiele
              hinzu. Eine Gruppe wie „Hund“ heißt Klasse. Ein vortrainiertes Netz so
              weiterzuverwenden heißt Transfer Learning.
            </Text>
          </EntryReveal>
          <EntryReveal kind="reading" index={2} asChild>
            <Text variant="muted">
              Bilderkennung kann auch Abweichungen finden, etwa einen Riss in einem Bauteil. Das
              heißt Anomalieerkennung.
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
