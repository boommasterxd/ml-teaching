import AnimatedLink from '@/components/AnimatedLink';
import Button from '@/components/Button';
import { ArrowRight } from '@/components/icons/arrow-right';
import type { learningAreas } from '@/content/learning-areas';

const actionClass = 'mobile-action h-auto min-h-11 max-w-full justify-self-start whitespace-normal';

export default function LearningPracticeAction({
  area,
  id,
}: {
  area: (typeof learningAreas)[number];
  id?: string;
}) {
  if (area.comingSoon) {
    return (
      <Button
        id={id}
        disabled
        lang="en"
        variant="secondary"
        size="lg"
        className={`${actionClass} learning-action-pending`}
      >
        Coming Soon
      </Button>
    );
  }
  return (
    <AnimatedLink
      id={id}
      href={area.href}
      size="lg"
      className={actionClass}
      trainingIcon={{
        content: <ArrowRight data-icon="inline-end" aria-hidden="true" />,
        position: 'end',
      }}
    >
      {area.action}
    </AnimatedLink>
  );
}
