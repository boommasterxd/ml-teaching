import LearningAreas from '@/components/LearningAreas';
import { LearningChapterIntro, LearningPrompt } from '@/components/LearningChapter';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { Heading } from '@/components/ui/typography';

/** Required learning-area selection stays available before client hydration. */
export default function LearningHubPage() {
  return (
    <div className="learning-hub landing-container">
      <LearningChapterIntro title="Dein Lernlabor">
        Wie lernt eine KI, was du von ihr willst? Beim Bildtraining gibst du ihr Bilder mit Namen.
        Beim Lernen durch Belohnung zeigen Punkte einer Spielfigur, welche Wege sich lohnen. Das
        Lernlabor ist kostenlos.
      </LearningChapterIntro>
      <LearningAreas idPrefix="hub" />
      <section className="learning-hub-ideas" aria-labelledby="hub-ideas-title">
        <EntryReveal kind="text" asChild>
          <Heading id="hub-ideas-title">Zum Weiterforschen</Heading>
        </EntryReveal>
        <div className="learning-hub-prompts">
          <LearningPrompt title="Erkennt dein Modell die Tasse auch woanders?">
            Fotografiere eine Tasse auf einem Heft und einen Stift auf dem Tisch. Sammle für beide
            Klassen mehrere Bilder. Trainiere dein Modell und teste dann die Tasse auf dem Tisch.
            Verwechselt es sie? Ergänze Fotos von beiden Gegenständen auf beiden Unterlagen und
            probiere es noch einmal.
          </LearningPrompt>
          <LearningPrompt title="Lohnt sich der längere Weg?">
            Stell dir vor, eine Spielfigur braucht sieben Schritte zum Stern und sechs zum Schatz.
            Beide Ziele bringen zehn Punkte. Welches Ziel lohnt sich mehr, wenn jeder Schritt einen
            Punkt kostet?
          </LearningPrompt>
        </div>
      </section>
    </div>
  );
}
