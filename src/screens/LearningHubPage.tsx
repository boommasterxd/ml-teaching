import LearningAreas from '@/components/LearningAreas';
import { LearningChapterIntro, LearningPrompt } from '@/components/LearningChapter';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { Heading } from '@/components/ui/typography';

/** Required learning-area selection stays available before client hydration. */
export default function LearningHubPage() {
  return (
    <div className="learning-hub landing-container">
      <LearningChapterIntro title="Dein Lernlabor">
        Trainiere eine KI mit deinen Bildern. Schau dir an, wie eine Spielfigur aus Punkten lernt.
        Das Lernlabor ist kostenlos.
      </LearningChapterIntro>
      <LearningAreas idPrefix="hub" />
      <section className="learning-hub-ideas" aria-labelledby="hub-ideas-title">
        <EntryReveal kind="text" asChild>
          <Heading id="hub-ideas-title">Zum Weiterforschen</Heading>
        </EntryReveal>
        <div className="learning-hub-prompts">
          <LearningPrompt title="Erkennt dein Modell die Tasse auch woanders?">
            Fotografiere eine Tasse auf einem Heft und einen Stift auf dem Tisch. Sammle mindestens
            zehn Bilder pro Gegenstand. Trainiere dein Modell und teste die Tasse auf dem Tisch.
            Erkennt es die Tasse falsch? Fotografiere beide Gegenstände auf beiden Unterlagen und
            trainiere erneut.
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
