import LearningAreas from '@/components/LearningAreas';
import { Heading } from '@/components/ui/typography';

/** Required learning-area selection stays available before client hydration. */
export default function LearningHubPage() {
  return (
    <div className="learning-hub landing-container">
      <div className="landing-section-heading">
        <Heading as="h1">Dein Lernlabor</Heading>
      </div>
      <LearningAreas idPrefix="hub" />
    </div>
  );
}
