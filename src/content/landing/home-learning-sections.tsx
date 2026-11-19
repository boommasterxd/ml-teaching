import LearningPracticeAction from '@/components/LearningPracticeAction';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { DeferredHomePreviews, HomePreview } from '@/components/home/DeferredHomePreviews';
import { RewardBoard, rewardPreviewDescription } from '@/components/home/RewardBoard';
import { InputPreviewStill } from '@/components/home/SignalArtwork';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Heading, Text } from '@/components/ui/typography';
import { learningAreas } from '@/content/learning-areas';
import { rewardPreviewId } from '@/lib/learning-paths';

function ExperimentPanel({ area, index }: { area: (typeof learningAreas)[number]; index: number }) {
  const isRewardPreview = area.id === 'q-learning';
  return (
    <ScrollReveal
      kind="reading"
      index={index}
      asChild
      className="grid min-w-0 lg:row-span-4 lg:grid-rows-subgrid"
    >
      <section
        id={isRewardPreview ? rewardPreviewId : 'bilderkennung'}
        tabIndex={isRewardPreview ? -1 : undefined}
        aria-labelledby={`home-${area.id}-title`}
      >
        <Card
          className="learning-area-card grid lg:row-span-4 lg:grid-rows-subgrid"
          data-method={area.id}
        >
          <CardHeader>
            <CardTitle as="h3" id={`home-${area.id}-title`}>
              {area.title}
            </CardTitle>
            {isRewardPreview && <CardDescription lang="en">Reinforcement Learning</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-6 lg:row-span-2 lg:grid-rows-subgrid">
            <div className="learning-area-preview home-experiment-art">
              {isRewardPreview ? (
                <HomePreview kind="reward">
                  <RewardBoard description={rewardPreviewDescription} />
                </HomePreview>
              ) : (
                <HomePreview kind="image">
                  <InputPreviewStill />
                </HomePreview>
              )}
            </div>
            <Text className="text-muted-foreground">{area.explanation}</Text>
          </CardContent>
          <CardFooter className="flex-col items-start gap-3">
            <Heading as="h4" className="text-base">
              Willst du es selbst ausprobieren?
            </Heading>
            <LearningPracticeAction area={area} />
          </CardFooter>
        </Card>
      </section>
    </ScrollReveal>
  );
}

/** Each learning method pairs its own explanation with the matching local experiment. */
export default function HomeLearningSections() {
  return (
    <section
      id="lernbereiche"
      tabIndex={-1}
      className="landing-section landing-container"
      aria-labelledby="home-experiments-title"
    >
      <ScrollReveal kind="reading" asChild className="home-experiments-heading">
        <Heading id="home-experiments-title">Zwei Arten, wie KI lernt</Heading>
      </ScrollReveal>
      <DeferredHomePreviews>
        {learningAreas.map((area, index) => (
          <ExperimentPanel key={area.id} area={area} index={index} />
        ))}
      </DeferredHomePreviews>
    </section>
  );
}
