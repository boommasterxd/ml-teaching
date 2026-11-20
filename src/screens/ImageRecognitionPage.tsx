import { Camera } from '@/components/icons/camera';
import { Users } from '@/components/icons/users';
import { Zap } from '@/components/icons/zap';
import LearningCard from '@/components/LearningCard';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { Heading, Text } from '@/components/ui/typography';
import {
  ImageTechniqueSection,
  ImageAnimationSection,
} from '@/content/landing/neural-network-content';
import { LearningContent } from '@/content/landing/learning-content';
import ImageLearningHero from '@/components/image-hero/ImageLearningHero';
import '@/content/landing/image-chapter.css';

const steps = [
  {
    number: '01',
    Icon: Camera,
    title: 'Bilder sammeln',
    text: 'Lege Klassen an und füge für jede Klasse Bilder hinzu: mit der Kamera oder per Upload.',
  },
  {
    number: '02',
    Icon: Users,
    title: 'Modell trainieren',
    text: 'Starte das Training. Das Modell lernt, deine Klassen anhand der Bildmerkmale zu unterscheiden.',
  },
  {
    number: '03',
    Icon: Zap,
    title: 'Ergebnis testen',
    text: 'Zeige der Kamera ein neues Bild. Bei Verwechslungen helfen zusätzliche Trainingsbilder.',
  },
];

/** The complete image-learning journey stays build-rendered and independent of the workspace. */
export default function ImageRecognitionPage() {
  return (
    <div className="landing-page image-chapter">
      <ImageLearningHero />
      <ImageTechniqueSection />
      <ImageAnimationSection />
      <section
        id="so-funktionierts"
        className="landing-section landing-container"
        aria-labelledby="section-steps"
      >
        <ScrollReveal kind="text">
          <div className="landing-section-heading">
            <Text variant="muted">03 / Selbst ausprobieren</Text>
            <Heading id="section-steps">So trainierst du dein Modell.</Heading>
            <Text variant="lead">
              Sammle Bilder, trainiere das Modell und teste es mit neuen Aufnahmen.
            </Text>
          </div>
        </ScrollReveal>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ number, Icon, title, text }, index) => (
            <ScrollReveal key={number} kind="surface" index={index}>
              <LearningCard title={title} description={text} icon={Icon} marker={number} />
            </ScrollReveal>
          ))}
        </div>
      </section>
      <LearningContent />
    </div>
  );
}
