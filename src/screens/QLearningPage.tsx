import AnimatedLink from '@/components/AnimatedLink';
import { LearningChapterIntro } from '@/components/LearningChapter';
import { ArrowLeft } from '@/components/icons/arrow-left';
import { comingSoonLabel } from '@/content/learning-areas';
import { learningPaths } from '@/lib/learning-paths';

export default function QLearningPage() {
  return (
    <div className="learning-hub landing-container">
      <LearningChapterIntro title="Q-Learning verstehen">
        <span lang="en">{comingSoonLabel}</span>
      </LearningChapterIntro>
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
    </div>
  );
}
