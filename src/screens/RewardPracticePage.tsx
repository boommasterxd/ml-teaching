import AnimatedLink from '@/components/AnimatedLink';
import RewardExperiment from '@/components/home/RewardExperiment';
import { ArrowLeft } from '@/components/icons/arrow-left';
import { Card } from '@/components/ui/card';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { Heading, Text } from '@/components/ui/typography';
import { learningPaths } from '@/lib/learning-paths';
import { rewardPracticeComingSoon } from '@/content/learning-areas';

export default function RewardPracticePage() {
  return (
    <div className="learning-hub landing-container reward-practice">
      <div className="reward-practice-intro">
        <AnimatedLink
          href={learningPaths.hub}
          transitionTypes={['nav-back']}
          variant="link"
          className="h-auto min-h-11 px-0"
          navigationIcon={{
            content: <ArrowLeft data-icon="inline-start" aria-hidden="true" />,
            position: 'start',
          }}
        >
          Zum Lernlabor
        </AnimatedLink>
        <div className="space-y-4">
          <Heading as="h1" className="reward-practice-title">
            {rewardPracticeComingSoon ? 'Lernen durch Belohnung' : 'Belohnungen ausprobieren'}
          </Heading>
          <EntryReveal kind="reading" asChild>
            {rewardPracticeComingSoon ? (
              <Text>Die Übung ist noch nicht verfügbar.</Text>
            ) : (
              <Text>Wähle ein Ziel. Vergleiche die Wege zum Stern und zum Schatz.</Text>
            )}
          </EntryReveal>
        </div>
      </div>
      {!rewardPracticeComingSoon && (
        <EntryReveal asChild>
          <Card className="w-full max-w-[38rem] p-[clamp(1rem,3vw,2rem)]">
            <RewardExperiment />
          </Card>
        </EntryReveal>
      )}
    </div>
  );
}
