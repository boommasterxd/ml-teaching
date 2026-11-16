import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { Brain, Users, Zap } from '@/components/icons';
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from '@/components/ui/card';

export const neuralNetworkContent = (
  <>
    <section className="landing-band landing-section" aria-labelledby="section-neural-net">
      <div className="landing-container">
        <div className="landing-section-heading">
          <p className="eyebrow">02 / HINTER DEN MUSTERN</p>
          <h2 id="section-neural-net" className="section-heading">
            Ein Bild geht rein.
            <br />
            Eine Erkenntnis kommt raus.
          </h2>
          <p id="network-demo-intro" className="section-lead">
            Was passiert dazwischen? Folge einem Hunde- oder Katzenbild durch ein vereinfachtes
            neuronales Netz. Jede Schicht macht aus dem Signal neue Muster.
          </p>
        </div>
        <DeferredNetworkDemo />
        <div className="landing-network-key">
          <p>
            <strong>Input.</strong> Das Bild ist der Anfang.
          </p>
          <p>
            <strong>Hidden Layers.</strong> Aus Kanten werden Formen und Merkmale.
          </p>
          <p>
            <strong>Output.</strong> Das Netz liefert eine Zuordnung.
          </p>
        </div>
      </div>
    </section>

    <section className="landing-container landing-section" aria-labelledby="section-explanation">
      <div className="landing-section-heading">
        <p className="eyebrow">03 / ZWEI TECHNIKEN. EIN TEAM.</p>
        <h2 id="section-explanation" className="section-heading">
          Sehen können.
          <br />
          Unterscheiden lernen.
        </h2>
        <p className="section-lead">
          Dein Modell fängt nicht bei null an. Diese beiden Bausteine arbeiten hier zusammen.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ScrollReveal>
          <Card variant="feature">
            <CardHeader variant="explanation">
              <CardIcon tone="primary" className="mb-6">
                <Brain />
              </CardIcon>
              <CardTitle as="h3" variant="explanation" className="mb-4">
                Das Auge: <span lang="en">MobileNet</span>
              </CardTitle>
            </CardHeader>
            <CardContent variant="explanation">
              <p>
                Ein vortrainiertes neuronales Netz erkennt grundlegende Merkmale wie Kanten, Farben
                und Formen. Es übersetzt jedes Bild in eine Liste von Zahlen: einen digitalen
                Fingerabdruck.
              </p>
            </CardContent>
          </Card>
        </ScrollReveal>
        <ScrollReveal>
          <Card variant="feature">
            <CardHeader variant="explanation">
              <CardIcon tone="primary" className="mb-6">
                <Users />
              </CardIcon>
              <CardTitle as="h3" variant="explanation" className="mb-4">
                Der Vergleich: <span lang="en">KNN</span>
              </CardTitle>
            </CardHeader>
            <CardContent variant="explanation">
              <p>
                <span lang="en">K-Nearest Neighbors</span> vergleicht diesen Fingerabdruck mit
                deinen Trainingsbildern. Die ähnlichsten Beispiele stimmen darüber ab, welcher
                deiner Klassen ein neues Bild zugeordnet wird.
              </p>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
      <div className="landing-insight">
        <Zap aria-hidden="true" />
        <div>
          <h3>Vorwissen trifft deine Ideen.</h3>
          <p>
            Das nennt sich <span lang="en">Transfer Learning</span>: MobileNet bringt gelernte
            Merkmale mit. Deine Beispiele machen daraus ein eigenes kleines Experiment, direkt in
            deinem Browser.
          </p>
        </div>
      </div>
    </section>
  </>
);
