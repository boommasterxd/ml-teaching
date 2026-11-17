import AnimatedLink from '@/components/AnimatedLink';
import { ArrowLeft } from '@/components/icons/arrow-left';
import { ArrowRight } from '@/components/icons/arrow-right';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { Heading, Text } from '@/components/ui/typography';
import { learningPaths } from '@/lib/learning-paths';
import ImageHeroArtwork from './ImageHeroArtwork';

/** The introduction and example photos remain complete in the static document. */
export default function ImageLearningHero() {
  return (
    <section
      id="image-learning-hero"
      className="image-learning-hero landing-container"
      aria-labelledby="image-learning-title"
    >
      <EntryReveal kind="navigation" asChild>
        <AnimatedLink
          href={learningPaths.hub}
          transitionTypes={['nav-back']}
          variant="ghost"
          className="-ml-3"
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Lernlabor
        </AnimatedLink>
      </EntryReveal>
      <div className="image-hero-layout">
        <EntryReveal kind="reading">
          <div className="image-hero-copy">
            <Text variant="muted">Bilderkennung verstehen</Text>
            <Heading as="h1" id="image-learning-title" className="image-hero-title">
              Du siehst eine Katze.
              <span>Was sieht die KI?</span>
            </Heading>
            <Text variant="lead">
              Das neuronale Netz MobileNet findet Merkmale wie Farben, Kanten und Muster. KNN
              vergleicht sie mit deinen Beispielen und ordnet das Bild einer Klasse zu.
            </Text>
            <AnimatedLink
              href={learningPaths.imagePractice}
              size="lg"
              className="mobile-action h-auto min-h-11 max-w-full self-start whitespace-normal"
            >
              Eigenes Bildmodell trainieren
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </AnimatedLink>
          </div>
        </EntryReveal>
        <ImageHeroArtwork />
      </div>
    </section>
  );
}
