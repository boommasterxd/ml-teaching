/**
 * LandingPage.tsx
 *
 * Landing page of the application. Renders the hero section, a three-step
 * overview, an interactive neural-network visualization, educational content
 * about MobileNet and KNN, training tips, real-world examples, and calls to
 * action that navigate the user to the training page.
 */
import { useNavigate } from 'react-router-dom';
import { Brain, Camera, Zap, ArrowRight, Users, ImagePlus, Lightbulb, Car, Smartphone, Stethoscope } from 'lucide-react';
import Button from '../components/Button';
import NeuralNetViz from '../components/NeuralNetViz';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * Full landing page composed of multiple content sections.
 *
 * Sets the document title on mount and provides navigation to `/lernen`
 * via two call-to-action buttons.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  usePageTitle('');

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Top navigation */}
      <nav aria-label="Hauptnavigation" className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2">
          <img
            src="/ada-logo.webp"
            srcSet="/ada-logo-48.webp 48w, /ada-logo-96.webp 96w"
            sizes="40px"
            alt="Ada Lovelace Projekt Logo"
            className="h-10 w-auto object-contain"
            width="40"
            height="40"
            fetchPriority="high"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-lg text-zinc-800 hidden sm:block">KI Bilderkennung</span>
        </a>
      </nav>

      {/* Hero section */}
      <div className="bg-white border-b border-zinc-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-2xl mb-6">
            <Brain className="w-10 h-10" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6">
            Entdecke <span className="text-red-600 font-bold">Künstliche Intelligenz</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10">
            Lerne spielerisch, wie Computer sehen können. Trainiere dein eigenes Bilderkennungsmodell direkt im Browser. Keine Programmierkenntnisse erforderlich!
          </p>
          <Button variant="cta" size="lg" onClick={() => navigate('/lernen')}>
            Jetzt ausprobieren <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Three-step overview */}
      <section aria-labelledby="section-steps" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 id="section-steps" className="text-3xl font-bold text-center mb-16">In 3 Schritten zur eigenen KI</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center relative">
            <div className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold" aria-hidden="true">1</div>
            <Camera className="w-10 h-10 mx-auto text-zinc-400 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-3">Daten sammeln</h3>
            <p className="text-zinc-600">Nutze deine Kamera, um Bilder für verschiedene Kategorien aufzunehmen. Zeige der KI, was sie lernen soll.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center relative">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold" aria-hidden="true">2</div>
            <Brain className="w-10 h-10 mx-auto text-zinc-400 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-3">Modell trainieren</h3>
            <p className="text-zinc-600">Die App analysiert deine Bilder und trainiert ein neuronales Netz, um die Muster zu erkennen.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center relative">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold" aria-hidden="true">3</div>
            <Zap className="w-10 h-10 mx-auto text-zinc-400 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-3">Ausprobieren</h3>
            <p className="text-zinc-600">Teste dein Modell in Echtzeit! Halte Objekte in die Kamera und sieh, wie die KI sie klassifiziert.</p>
          </div>
        </div>
      </section>

      {/* Interactive neural network visualization */}
      <section aria-labelledby="section-neural-net" className="py-20 bg-zinc-900 text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} aria-hidden="true"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 id="section-neural-net" className="text-3xl font-bold mb-6">Wie lernt ein Computer?</h2>
            <p className="text-zinc-300 max-w-3xl mx-auto text-lg">
              Um zu verstehen, was er sieht, nutzt ein Computer ein sogenanntes künstliches neuronales Netz. 
              Das ist eine Technik, die sich an der Arbeitsweise unseres Gehirns orientiert. 
              Ein solches Netz besteht aus Schichten (Layers) von "Neuronen". 
              Bilder werden an die <strong><span lang="en">Input Layer</span></strong> übergeben. Die <strong><span lang="en">Hidden Layers</span></strong> erkennen Muster (wie Kanten, Formen, Ohren).
              Die <strong><span lang="en">Output Layer</span></strong> liefert das finale Ergebnis. Probier es aus!
            </p>
          </div>

          <NeuralNetViz />
        </div>
      </section>

      {/* Explanation section for students */}
      <section aria-labelledby="section-explanation" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="section-explanation" className="text-3xl font-bold mb-6 text-zinc-900">Wie funktioniert das hier genau?</h2>
            <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
              Ein Blick unter die Haube – einfach erklärt für dich! Wir nutzen zwei clevere Techniken, die wie ein Team zusammenarbeiten, damit dein Computer sehen lernt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Neural network explanation */}
            <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110" aria-hidden="true" />
              <Brain className="w-12 h-12 text-red-500 mb-6 relative z-10" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-4 text-zinc-800 relative z-10">1. Das "Auge" <br/><span className="text-red-600 text-lg">Neuronales Netz (<span lang="en">MobileNet</span>)</span></h3>
              <p className="text-zinc-600 leading-relaxed relative z-10">
                Stell dir vor, du hast ein riesiges digitales Gehirn, das schon Millionen von Bildern gesehen hat. In unserer App nutzen wir ein vorgefertigtes <strong>Neuronales Netz</strong>. Es ist wie ein Auge, das bereits gelernt hat, grundlegende Dinge wie Kanten, Farben und Formen zu erkennen. 
                <br/><br/>
                Wenn du ein Bild mit der Kamera aufnimmst, schaut sich dieses Netz das Bild an und erstellt einen einzigartigen <strong>"Fingerabdruck"</strong> (eine lange Liste aus Zahlen) davon.
              </p>
            </div>

            {/* KNN explanation */}
            <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110" aria-hidden="true" />
              <Users className="w-12 h-12 text-blue-500 mb-6 relative z-10" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-4 text-zinc-800 relative z-10">2. Der "Entscheider" <br/><span className="text-blue-600 text-lg"><span lang="en">K-Nearest Neighbors (KNN)</span></span></h3>
              <p className="text-zinc-600 leading-relaxed relative z-10">
                <span lang="en">KNN</span> steht für <strong><span lang="en">K-Nearest Neighbors</span></strong> (auf Deutsch: die K-nächsten Nachbarn). Stell dir vor, du bist neu in einer Schule und suchst Freunde. Du schaust, wer ähnliche Hobbys hat wie du. Genau das macht KNN! 
                <br/><br/>
                Wenn die Kamera ein neues Bild sieht, vergleicht KNN den Fingerabdruck dieses Bildes mit allen Bildern, die du vorher beim Training aufgenommen hast. Es sucht die Bilder, die am ähnlichsten sind (die "Nachbarn"). Wenn die meisten dieser Nachbarn zur Klasse "Hund" gehören, sagt der Computer: "Das ist ein Hund!"
              </p>
            </div>
          </div>

          {/* Transfer learning explanation */}
          <div className="mt-12 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 sm:p-12 rounded-3xl text-white text-center relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} aria-hidden="true"></div>
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-6 relative z-10" aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-4 relative z-10">Warum geht das so schnell? (<span lang="en">Transfer Learning</span>)</h3>
            <p className="text-zinc-300 leading-relaxed max-w-3xl mx-auto relative z-10 text-lg">
              Normalerweise braucht eine KI Tausende von Bildern und tagelanges Training. Wir nutzen einen Trick namens <strong><span lang="en">Transfer Learning</span></strong>. Das Neuronale Netz (das Auge) bringt schon sein ganzes Vorwissen mit. Der KNN-Algorithmus (der Entscheider) merkt sich einfach nur noch deine paar neuen Bilder und vergleicht sie blitzschnell. So lernt dein Modell in Sekunden direkt hier in deinem Browser!
            </p>
          </div>
        </div>
      </section>

      {/* Tips for a smart model */}
      <section aria-labelledby="section-tips" className="py-20 bg-zinc-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="section-tips" className="text-3xl font-bold mb-6 text-zinc-900">Tipps für ein schlaues Modell</h2>
            <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
              Damit dein Computer nicht durcheinanderkommt, braucht er gutes Training. Hier sind drei goldene Regeln für perfekte Bilder:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                <ImagePlus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800 break-words hyphens-auto" lang="de">1. Viele Bilder</h3>
              <p className="text-zinc-600">
                Je mehr Bilder du aufnimmst, desto besser! Ein Baby lernt auch nicht nach einem einzigen Mal, wie ein Hund aussieht. Versuche mindestens 15-20 Bilder pro Klasse zu machen.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800 break-words hyphens-auto" lang="de">2. Verschiedene Winkel</h3>
              <p className="text-zinc-600">
                Zeige das Objekt von vorne, von der Seite, von oben und von unten. Wenn der Computer eine Tasse nur von oben kennt, erkennt er sie von der Seite vielleicht nicht wieder!
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800 break-words hyphens-auto" lang="de">3. Unterschiedliches Licht</h3>
              <p className="text-zinc-600">
                Achte darauf, dass der Hintergrund nicht immer gleich ist und das Licht mal heller, mal dunkler ist. Sonst lernt der Computer vielleicht nur dein Zimmer kennen, aber nicht das Objekt!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-world examples */}
      <section aria-labelledby="section-examples" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="section-examples" className="text-3xl font-bold mb-6 text-zinc-900">Wo findest du das im Alltag?</h2>
            <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
              Bilderkennung ist keine Zukunftsmusik mehr. Du nutzt sie wahrscheinlich schon jeden Tag!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <Smartphone className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Face ID & Filter</h3>
              <p className="text-zinc-600">
                Dein Handy entsperrt sich, weil es dein Gesicht erkennt. Und lustige Snapchat-Filter wissen genau, wo deine Nase und Augen sind.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <Car className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Selbstfahrende Autos</h3>
              <p className="text-zinc-600">
                Autos nutzen Kameras und KI, um Straßenschilder, Fußgänger und andere Autos zu erkennen, damit sie sicher fahren können.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <Stethoscope className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Medizin</h3>
              <p className="text-zinc-600">
                Ärzte nutzen Bilderkennung, um auf Röntgenbildern Krankheiten viel schneller und genauer zu entdecken als das menschliche Auge.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final call to action */}
      <section aria-labelledby="section-cta" className="py-24 bg-zinc-900 text-white px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} aria-hidden="true"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 id="section-cta" className="text-3xl md:text-5xl font-bold mb-6">Bereit für dein eigenes Experiment?</h2>
          <p className="text-xl text-zinc-400 mb-10">
            Du hast gelernt, wie KI sieht und entscheidet. Jetzt ist es Zeit, dein eigenes Modell zu trainieren und auszuprobieren!
          </p>
          <Button variant="cta" size="lg" onClick={() => navigate('/lernen')} className="hover:scale-105 shadow-xl shadow-red-900/20 font-bold px-10 py-5 text-xl">
            Jetzt ausprobieren <ArrowRight className="ml-2 w-6 h-6" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* Collaboration section */}
      <section aria-label="Kooperation" className="bg-white py-16 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <p className="text-zinc-600 mb-6 font-medium">
            Entwickelt in Zusammenarbeit mit dem
          </p>
          <a
            href="https://ada-lovelace.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 hover:opacity-90 transition-opacity rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <img
              src="/ada-logo.webp"
              srcSet="/ada-logo-96.webp 96w, /ada-logo-192.webp 192w"
              sizes="96px"
              alt=""
              aria-hidden="true"
              className="h-24 w-auto object-contain"
              width="96"
              height="96"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span className="text-zinc-600 font-bold border-b border-transparent group-hover:border-zinc-300 transition-all">
              Ada-Lovelace-Projekt<span className="sr-only"> (öffnet in neuem Tab)</span>
            </span>
          </a>        </div>
      </section>
      </div>
      );
      }
