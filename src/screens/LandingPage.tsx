import { neuralNetworkContent } from '@/content/landing/neural-network-content';
import { learningContent } from '@/content/landing/learning-content';
/**
 * LandingPage.tsx
 *
 * Landing page of the application. Renders the hero section, a three-step
 * overview, an interactive neural-network visualization, educational content
 * about MobileNet and KNN, training tips, real-world examples, and calls to
 * action that navigate the user to the training page.
 */
import Link from 'next/link';
import SiteLogo from '@/components/SiteLogo';
import { Brain, Camera, Zap, ArrowRight } from '../components/icons';
import AnimatedLink from '@/components/AnimatedLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Full landing page composed of multiple content sections.
 *
 * Renders build-time educational content with native links to `/lernen`.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <nav
        aria-label="Hauptnavigation"
        className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between"
      >
        <Link
          href="/"
          aria-label="ML Teaching: Zur Startseite"
          className="flex items-center gap-3 hover:opacity-80 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          <SiteLogo size={40} className="h-10 w-10 object-contain" />
          <span className="font-bold text-lg text-zinc-800 hidden sm:block">ML Teaching</span>
        </Link>
      </nav>

      <div className="bg-white border-b border-zinc-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-2xl mb-6">
            <Brain className="w-10 h-10" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6">
            Entdecke <span className="text-red-600 font-bold">Künstliche Intelligenz</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10">
            Lerne spielerisch, wie Computer sehen können. Trainiere dein eigenes
            Bilderkennungsmodell direkt im Browser. Keine Programmierkenntnisse erforderlich!
          </p>
          <AnimatedLink href="/lernen" variant="cta" size="lg">
            Jetzt ausprobieren <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </AnimatedLink>
        </div>
      </div>

      <section
        aria-labelledby="section-steps"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <h2 id="section-steps" className="text-3xl font-bold text-center mb-16">
          In 3 Schritten zur eigenen KI
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          <Card variant="feature" className="text-center relative">
            <CardHeader variant="steps">
              <Badge variant="step-neutral" className="mb-6" aria-hidden="true">
                1
              </Badge>
              <Camera className="mb-4" aria-hidden="true" />
              <CardTitle as="h3" variant="steps" className="mb-3">
                Daten sammeln
              </CardTitle>
            </CardHeader>
            <CardContent variant="feature">
              <p>
                Nutze deine Kamera, um Bilder für verschiedene Kategorien aufzunehmen. Zeige der KI,
                was sie lernen soll.
              </p>
            </CardContent>
          </Card>
          <Card variant="feature" className="text-center relative">
            <CardHeader variant="steps">
              <Badge variant="step-destructive" className="mb-6" aria-hidden="true">
                2
              </Badge>
              <Brain className="mb-4" aria-hidden="true" />
              <CardTitle as="h3" variant="steps" className="mb-3">
                Modell trainieren
              </CardTitle>
            </CardHeader>
            <CardContent variant="feature">
              <p>
                Die App analysiert deine Bilder und lernt mit einem vortrainierten neuronalen Netz
                und deinen Beispielen, Muster zu unterscheiden.
              </p>
            </CardContent>
          </Card>
          <Card variant="feature" className="text-center relative">
            <CardHeader variant="steps">
              <Badge variant="step-primary" className="mb-6" aria-hidden="true">
                3
              </Badge>
              <Zap className="mb-4" aria-hidden="true" />
              <CardTitle as="h3" variant="steps" className="mb-3">
                Ausprobieren
              </CardTitle>
            </CardHeader>
            <CardContent variant="feature">
              <p>
                Teste dein Modell in Echtzeit! Halte Objekte in die Kamera und sieh, wie die KI sie
                klassifiziert.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive neural network visualization */}
      {neuralNetworkContent}
      {learningContent}
    </div>
  );
}
