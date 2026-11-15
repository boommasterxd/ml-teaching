import NeuralNetViz from '@/components/NeuralNetViz';
import { Brain, Users, Zap } from '@/components/icons';
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from '@/components/ui/card';
export const neuralNetworkContent = (
  <>
    <section
      aria-labelledby="section-neural-net"
      className="py-20 bg-zinc-900 text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 dot-pattern" aria-hidden="true"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 id="section-neural-net" className="text-3xl font-bold mb-6">
            Wie lernt ein Computer?
          </h2>
          <p className="text-zinc-300 max-w-3xl mx-auto text-lg">
            Um zu verstehen, was er sieht, nutzt ein Computer ein sogenanntes künstliches neuronales
            Netz. Das ist eine Technik, die sich an der Arbeitsweise unseres Gehirns orientiert. Ein
            solches Netz besteht aus Schichten (Layers) von &quot;Neuronen&quot;. Bilder werden an
            die{' '}
            <strong>
              <span lang="en">Input Layer</span>
            </strong>{' '}
            übergeben. Die{' '}
            <strong>
              <span lang="en">Hidden Layers</span>
            </strong>{' '}
            erkennen Muster (wie Kanten, Formen, Ohren). Die{' '}
            <strong>
              <span lang="en">Output Layer</span>
            </strong>{' '}
            liefert das finale Ergebnis. Probier es aus!
          </p>
        </div>

        <NeuralNetViz />
      </div>
    </section>

    {/* Explanation section for students */}
    <section aria-labelledby="section-explanation" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 id="section-explanation" className="text-3xl font-bold mb-6 text-zinc-900">
            Wie funktioniert das hier genau?
          </h2>
          <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
            Ein Blick unter die Haube – einfach erklärt für dich! Wir nutzen zwei clevere Techniken,
            die wie ein Team zusammenarbeiten, damit dein Computer sehen lernt.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-stretch">
          <Card variant="explanation">
            <div
              className="absolute top-0 right-0 size-32 bg-destructive-soft-hover rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110"
              aria-hidden="true"
            />
            <CardHeader variant="explanation">
              <CardIcon tone="destructive" variant="standalone" className="mb-6">
                <Brain />
              </CardIcon>
              <CardTitle as="h3" variant="explanation" className="mb-4">
                1. Das &quot;Auge&quot; <br />
                <span className="text-destructive text-lg">
                  Neuronales Netz (<span lang="en">MobileNet</span>)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent variant="explanation" className="relative z-10">
              <p>
                Stell dir vor, du hast ein riesiges digitales Gehirn, das schon Millionen von
                Bildern gesehen hat. In unserer App nutzen wir ein vorgefertigtes{' '}
                <strong>Neuronales Netz</strong>. Es ist wie ein Auge, das bereits gelernt hat,
                grundlegende Dinge wie Kanten, Farben und Formen zu erkennen.
                <br />
                <br />
                Wenn du ein Bild mit der Kamera aufnimmst, schaut sich dieses Netz das Bild an und
                erstellt einen einzigartigen <strong>&quot;Fingerabdruck&quot;</strong> (eine lange
                Liste aus Zahlen) davon.
              </p>
            </CardContent>
          </Card>

          <Card variant="explanation">
            <div
              className="absolute top-0 right-0 size-32 bg-primary-soft rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110"
              aria-hidden="true"
            />
            <CardHeader variant="explanation">
              <CardIcon tone="primary" variant="standalone" className="mb-6">
                <Users />
              </CardIcon>
              <CardTitle as="h3" variant="explanation" className="mb-4">
                2. Der &quot;Entscheider&quot; <br />
                <span className="text-primary text-lg">
                  <span lang="en">K-Nearest Neighbors (KNN)</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent variant="explanation" className="relative z-10">
              <p>
                <span lang="en">KNN</span> steht für{' '}
                <strong>
                  <span lang="en">K-Nearest Neighbors</span>
                </strong>{' '}
                (auf Deutsch: die K-nächsten Nachbarn). Stell dir vor, du bist neu in einer Schule
                und suchst Freunde. Du schaust, wer ähnliche Hobbys hat wie du. Genau das macht KNN!
                <br />
                <br />
                Wenn die Kamera ein neues Bild sieht, vergleicht KNN den Fingerabdruck dieses Bildes
                mit allen Bildern, die du vorher beim Training aufgenommen hast. Es sucht die
                Bilder, die am ähnlichsten sind (die &quot;Nachbarn&quot;). Wenn die meisten dieser
                Nachbarn zur Klasse &quot;Hund&quot; gehören, sagt der Computer: &quot;Das ist ein
                Hund!&quot;
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transfer learning explanation */}
        <div className="mt-12 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 sm:p-12 rounded-3xl text-white text-center relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-10 dot-pattern" aria-hidden="true"></div>
          <Zap
            className="w-12 h-12 text-yellow-400 mx-auto mb-6 relative z-10"
            aria-hidden="true"
          />
          <h3 className="text-2xl font-bold mb-4 relative z-10">
            Warum geht das so schnell? (<span lang="en">Transfer Learning</span>)
          </h3>
          <p className="text-zinc-300 leading-relaxed max-w-3xl mx-auto relative z-10 text-lg">
            Normalerweise braucht eine KI Tausende von Bildern und tagelanges Training. Wir nutzen
            einen Trick namens{' '}
            <strong>
              <span lang="en">Transfer Learning</span>
            </strong>
            . Das Neuronale Netz (das Auge) bringt schon sein ganzes Vorwissen mit. Der
            KNN-Algorithmus (der Entscheider) merkt sich einfach nur noch deine paar neuen Bilder
            und vergleicht sie blitzschnell. So lernt dein Modell in Sekunden direkt hier in deinem
            Browser!
          </p>
        </div>
      </div>
    </section>
  </>
);
