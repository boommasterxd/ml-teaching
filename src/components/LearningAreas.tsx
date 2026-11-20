import AnimatedLink from '@/components/AnimatedLink';
import LearningPracticeAction from '@/components/LearningPracticeAction';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LearningAreaArtwork from '@/components/home/LearningAreaArtwork';
import ScrollReveal from '@/components/hero/ScrollReveal';
import { learningAreas } from '@/content/learning-areas';

/** Learning cards retain SSG content and native button links with intent preparation. */
export default function LearningAreas({
  idPrefix,
  headingLevel = 'h2',
}: {
  idPrefix: string;
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <div className="learning-areas">
      {learningAreas.map((area, index) => (
        <ScrollReveal
          key={area.id}
          kind="reading"
          index={index}
          className="learning-area-reveal h-full"
        >
          <Card className="learning-area-card h-full" data-method={area.id}>
            <CardHeader>
              <CardTitle as={headingLevel} id={`${idPrefix}-${area.id}-title`}>
                {area.title}
              </CardTitle>
              <CardDescription id={`${idPrefix}-${area.id}-description`}>
                {area.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="learning-area-preview">
              <LearningAreaArtwork area={area.id} />
            </CardContent>
            <CardFooter className="learning-area-actions mt-auto flex-wrap justify-start gap-2">
              <LearningPracticeAction area={area} id={`${idPrefix}-${area.id}-action`} />
              {!area.introduction.comingSoon && (
                <AnimatedLink
                  href={area.introduction.href}
                  variant="outline"
                  size="lg"
                  className="mobile-action h-auto min-h-11 max-w-full whitespace-normal"
                >
                  {area.introduction.label}
                </AnimatedLink>
              )}
            </CardFooter>
          </Card>
        </ScrollReveal>
      ))}
    </div>
  );
}
