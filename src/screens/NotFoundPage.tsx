/**
 * 404 Not Found page shown when a user navigates to a non-existent route.
 */
import AnimatedLink from '@/components/AnimatedLink';
import { Home } from '../components/icons/home';
import { AlertTriangle } from '../components/icons/alert-triangle';
import { Heading } from '@/components/ui/typography';
import { EntryReveal } from '@/components/ui/entry-reveal';
import {
  Empty,
  EmptyHeader,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@/components/ui/empty';

/** Displays a 404 message with a button to navigate back to the home page. */
export default function NotFoundPage() {
  return (
    <Empty className="min-h-[80vh]">
      <EmptyHeader>
        <EntryReveal kind="text" className="self-center">
          <EmptyMedia variant="icon">
            <AlertTriangle aria-hidden="true" />
          </EmptyMedia>
        </EntryReveal>
        <Heading as="h1">404 - Seite nicht gefunden</Heading>
        <EntryReveal kind="text" index={1} asChild>
          <EmptyDescription>
            Hoppla! Die Seite, nach der du suchst, scheint nicht zu existieren oder wurde
            verschoben.
          </EmptyDescription>
        </EntryReveal>
      </EmptyHeader>
      <EmptyContent>
        <EntryReveal kind="text" index={2}>
          <AnimatedLink href="/" transitionTypes={['nav-back']} variant="default" size="lg">
            <Home data-icon="inline-start" aria-hidden="true" />
            Zurück zur Startseite
          </AnimatedLink>
        </EntryReveal>
      </EmptyContent>
    </Empty>
  );
}
