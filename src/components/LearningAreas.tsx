import AnimatedLink from '@/components/AnimatedLink';
import { ArrowRight } from '@/components/icons/arrow-right';
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
import { learningPaths } from '@/lib/learning-paths';

/** Learning cards retain SSG content and centered native button links with intent preparation. */
export default function LearningAreas({
  idPrefix,
  headingLevel = 'h2',
}: {
  idPrefix: string;
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <div className="learning-areas">
      {learningAreas.map(({ id, title, description, href, action }, index) => (
        <ScrollReveal key={id} kind="reading" index={index} className="learning-area-reveal h-full">
          <Card className="learning-area-card h-full">
            <CardHeader>
              <CardTitle as={headingLevel} id={`${idPrefix}-${id}-title`}>
                {title}
              </CardTitle>
              <CardDescription id={`${idPrefix}-${id}-description`}>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <LearningAreaArtwork area={id} />
            </CardContent>
            <CardFooter className="mt-auto flex-wrap justify-center gap-2">
              <AnimatedLink
                href={href}
                id={`${idPrefix}-${id}-action`}
                size="lg"
                className="mobile-action h-auto min-h-11 max-w-full whitespace-normal"
              >
                {action} <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </AnimatedLink>
              {id === 'images' && (
                <AnimatedLink
                  href={learningPaths.images}
                  variant="outline"
                  size="lg"
                  className="mobile-action h-auto min-h-11 max-w-full whitespace-normal"
                >
                  Bilderkennung verstehen
                </AnimatedLink>
              )}
            </CardFooter>
          </Card>
        </ScrollReveal>
      ))}
    </div>
  );
}
