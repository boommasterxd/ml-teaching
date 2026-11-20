import AnimatedLink from '@/components/AnimatedLink';
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
      className="landing-container"
      aria-labelledby="image-learning-title"
    >
      <div className="image-hero-layout">
        <EntryReveal kind="reading">
          <div className="image-hero-copy">
            <Text variant="muted" className="image-chapter-label">
              Bilderkennung verstehen
            </Text>
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
