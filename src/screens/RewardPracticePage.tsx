import AnimatedLink from '@/components/AnimatedLink';
import RewardExperiment from '@/components/home/RewardExperiment';
import { ArrowLeft } from '@/components/icons/arrow-left';
import { Heading, Text } from '@/components/ui/typography';
import { learningPaths } from '@/lib/learning-paths';

export default function RewardPracticePage() {
  return (
    <div className="learning-hub landing-container">
      <div className="mx-auto max-w-lg space-y-6">
        <AnimatedLink
          href={learningPaths.hub}
          transitionTypes={['nav-back']}
          variant="link"
          className="h-auto min-h-11 px-0"
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" /> Zum Lernlabor
        </AnimatedLink>
        <div className="space-y-4">
          <Heading as="h1">Belohnungen ausprobieren</Heading>
          <Text>
            Wähle ein Ziel und vergleiche die Beispielwege der Figur zum Stern und zum Schatz.
          </Text>
        </div>
        <RewardExperiment />
      </div>
    </div>
  );
}
