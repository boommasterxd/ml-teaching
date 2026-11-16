import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { Brain, Users } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';

const techniques = [
  {
    title: 'MobileNet',
    Icon: Brain,
    descriptions: [
      'Ein Foto besteht für den Computer aus vielen farbigen Bildpunkten. MobileNet verarbeitet sie in mehreren Schritten: Zuerst erfasst es einfache Merkmale wie helle und dunkle Kanten. Spätere Schichten verbinden solche Merkmale zu komplizierteren Mustern. Die Kästchen bei „Kanten“ und „Muster“ zeigen das vereinfacht.',
      'Am Ende entsteht eine Liste von Zahlen, der sogenannte Merkmalsvektor. Er beschreibt die gefundenen Bildmerkmale. Dafür stehen die kleinen Balken bei „Zahlen“. MobileNet berechnet diese Liste direkt in deinem Browser. Ob dein Bild zu „Hund“ oder „Katze“ gehört, entscheidet anschließend KNN.',
    ],
  },
  {
    title: 'KNN',
    Icon: Users,
    descriptions: [
      'KNN heißt „K-Nearest Neighbors“, auf Deutsch etwa „die K nächsten Nachbarn“. Hier ist K gleich drei: KNN sucht die drei Trainingsbilder, deren Zahlenlisten dem neuen Bild am ähnlichsten sind. Jedes dieser Beispiele hat von dir bereits einen Namen bekommen, etwa „Hund“ oder „Katze“.',
      'Im Diagramm stehen die Kreise und Quadrate für solche Beispiele. Die Raute ist das neue Bild. Die Linien verbinden es mit seinen drei nächsten Nachbarn. Sind zwei davon Hunde und einer eine Katze, gewinnt „Hund“ mit zwei Stimmen. Genau das zeigen die Balken bei „Ausgabe“. Die Lage der Punkte ist ein vereinfachtes Beispiel, keine echte Messung von MobileNet.',
    ],
  },
];

export const neuralNetworkContent = (
  <>
    <section className="landing-band" aria-labelledby="section-neural-net">
      <div className="landing-container landing-section">
        <ScrollReveal>
          <div className="landing-section-heading">
            <Badge variant="secondary">02 / Bilderkennung</Badge>
            <Heading id="section-neural-net">Vom Bild zur Zuordnung.</Heading>
            <Text id="network-demo-intro" variant="lead">
              Wähle Hund oder Katze. Folge dem Bild durch MobileNet, den Nachbarvergleich und die
              Ausgabe.
            </Text>
          </div>
        </ScrollReveal>
        <DeferredNetworkDemo />
        <Text variant="muted" className="mt-4">
          Vereinfachtes Beispiel mit generierten Bildern und erfundenen Merkmalswerten.
        </Text>
      </div>
    </section>
    <section
      className="landing-container landing-section landing-technique-layout"
      aria-labelledby="section-explanation"
    >
      <ScrollReveal>
        <div className="landing-technique-copy">
          <div className="flex flex-col gap-5">
            <Text variant="muted">03 / Die Technik</Text>
            <Heading id="section-explanation">MobileNet und KNN</Heading>
            <Text variant="lead">
              Du zeigst ein neues Bild. MobileNet beschreibt, was darin zu sehen ist, mit Zahlen.
              KNN vergleicht diese Zahlen mit deinen Beispielen und ordnet das Bild einer Gruppe zu.
            </Text>
          </div>
          <Text variant="muted">
            MobileNet wurde schon mit vielen Bildern trainiert. Du nutzt seine bereits gelernten
            Bildmerkmale und gibst eigene Beispiele für deine Gruppen hinzu. Eine solche Gruppe
            heißt Klasse, zum Beispiel „Hund“. Das Nutzen eines vortrainierten Netzes nennt man
            Transfer Learning. MobileNet selbst wird hier nicht neu trainiert.
          </Text>
        </div>
      </ScrollReveal>
      <ScrollReveal>
        <ItemGroup aria-label="Bausteine des Modells" className="landing-technique-items">
          {techniques.map(({ title, Icon, descriptions }, index) => (
            <div key={title} role="listitem" className="landing-technique-item">
              {index > 0 && <Separator />}
              <Item className="items-start p-0">
                <ItemMedia variant="icon">
                  <Icon aria-hidden="true" />
                </ItemMedia>
                <ItemContent className="gap-3">
                  <ItemTitle>
                    <h3>{title}</h3>
                  </ItemTitle>
                  {descriptions.map((description) => (
                    <ItemDescription key={description} className="line-clamp-none">
                      {description}
                    </ItemDescription>
                  ))}
                </ItemContent>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </ScrollReveal>
    </section>
  </>
);
