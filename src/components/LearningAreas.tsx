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
import { Text } from '@/components/ui/typography';
import { learningAreas } from '@/content/learning-areas';

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
      {learningAreas.map(({ id, title, description, steps, href, action }, index) => (
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
            <CardContent className="flex flex-col gap-5">
              <Text variant="small">Das machst du selbst:</Text>
              <ol className="learning-area-steps">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </CardContent>
            <CardFooter className="mt-auto justify-center">
              <AnimatedLink
                href={href}
                id={`${idPrefix}-${id}-action`}
                size="lg"
                className="mobile-action h-auto min-h-11 max-w-full whitespace-normal"
              >
                {action} <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </AnimatedLink>
            </CardFooter>
          </Card>
        </ScrollReveal>
      ))}
    </div>
  );
}
