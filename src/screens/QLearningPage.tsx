import AnimatedLink from '@/components/AnimatedLink';
import { LearningChapterIntro } from '@/components/LearningChapter';
import { ArrowLeft } from '@/components/icons/arrow-left';
import { learningPaths } from '@/lib/learning-paths';

export default function QLearningPage() {
  return (
    <div className="learning-hub landing-container">
      <LearningChapterIntro title="Q-Learning verstehen">
        Die Einführung erscheint demnächst.
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
