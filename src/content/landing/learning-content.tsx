import AnimatedLink from '@/components/AnimatedLink';
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from '@/components/ui/card';
import {
  ImagePlus,
  Lightbulb,
  Camera,
  Smartphone,
  Car,
  Stethoscope,
  ArrowRight,
} from '@/components/icons';

export const learningContent = (
  <>
    <section aria-labelledby="section-tips" className="py-20 bg-zinc-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="section-tips" className="text-3xl font-bold mb-6 text-zinc-900">
            Tipps für ein schlaues Modell
          </h2>
          <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
            Damit dein Computer nicht durcheinanderkommt, braucht er gutes Training. Hier sind drei
            goldene Regeln für perfekte Bilder:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card variant="feature" className="text-center">
            <CardHeader variant="feature">
              <CardIcon tone="success" className="mb-6">
                <ImagePlus />
              </CardIcon>
              <CardTitle as="h3" variant="feature" className="mb-3" lang="de">
                1. Viele Bilder
              </CardTitle>
            </CardHeader>
            <CardContent variant="feature">
              <p>
                Je mehr Bilder du aufnimmst, desto besser! Ein Baby lernt auch nicht nach einem
                einzigen Mal, wie ein Hund aussieht. Versuche mindestens 15-20 Bilder pro Klasse zu
                machen.
              </p>
            </CardContent>
          </Card>

          <Card variant="feature" className="text-center">
            <CardHeader variant="feature">
              <CardIcon tone="warning" className="mb-6">
                <Lightbulb />
              </CardIcon>
              <CardTitle as="h3" variant="feature" className="mb-3" lang="de">
                2. Verschiedene Winkel
              </CardTitle>
            </CardHeader>
            <CardContent variant="feature">
              <p>
                Zeige das Objekt von vorne, von der Seite, von oben und von unten. Wenn der Computer
                eine Tasse nur von oben kennt, erkennt er sie von der Seite vielleicht nicht wieder!
              </p>
            </CardContent>
          </Card>

          <Card variant="feature" className="text-center">
            <CardHeader variant="feature">
              <CardIcon tone="accent" className="mb-6">
                <Camera />
              </CardIcon>
              <CardTitle as="h3" variant="feature" className="mb-3" lang="de">
                3. Unterschiedliches Licht
              </CardTitle>
            </CardHeader>
            <CardContent variant="feature">
              <p>
                Achte darauf, dass der Hintergrund nicht immer gleich ist und das Licht mal heller,
                mal dunkler ist. Sonst lernt der Computer vielleicht nur dein Zimmer kennen, aber
                nicht das Objekt!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <section aria-labelledby="section-examples" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="section-examples" className="text-3xl font-bold mb-6 text-zinc-900">
            Wo findest du das im Alltag?
          </h2>
          <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
            Bilderkennung ist keine Zukunftsmusik mehr. Du nutzt sie wahrscheinlich schon jeden Tag!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6">
            <div
              className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6"
              aria-hidden="true"
            >
              <Smartphone className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-800">Face ID & Filter</h3>
            <p className="text-zinc-600">
              Dein Handy entsperrt sich, weil es dein Gesicht erkennt. Und lustige Snapchat-Filter
              wissen genau, wo deine Nase und Augen sind.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div
              className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6"
              aria-hidden="true"
            >
              <Car className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-800">Selbstfahrende Autos</h3>
            <p className="text-zinc-600">
              Autos nutzen Kameras und KI, um Straßenschilder, Fußgänger und andere Autos zu
              erkennen, damit sie sicher fahren können.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div
              className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6"
              aria-hidden="true"
            >
              <Stethoscope className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-800">Medizin</h3>
            <p className="text-zinc-600">
              Bilderkennung kann medizinisches Fachpersonal bei der Auswertung von Röntgenbildern
              unterstützen. Die Beurteilung bleibt Aufgabe von Fachleuten.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      aria-labelledby="section-cta"
      className="py-24 bg-zinc-900 text-white px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 dot-pattern" aria-hidden="true"></div>
      <div className="max-w-3xl mx-auto relative z-10">
        <h2 id="section-cta" className="text-3xl md:text-5xl font-bold mb-6">
          Bereit für dein eigenes Experiment?
        </h2>
        <p className="text-xl text-zinc-400 mb-10">
          Du hast gelernt, wie KI sieht und entscheidet. Jetzt ist es Zeit, dein eigenes Modell zu
          trainieren und auszuprobieren!
        </p>
        <AnimatedLink href="/lernen" variant="cta" size="xl">
          Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </AnimatedLink>
      </div>
    </section>
  </>
);
