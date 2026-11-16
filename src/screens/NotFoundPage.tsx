/**
 * 404 Not Found page shown when a user navigates to a non-existent route.
 */
import AnimatedLink from '@/components/AnimatedLink';
import { Home, AlertTriangle } from '../components/icons';
import { Heading } from '@/components/ui/typography';
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
        <EmptyMedia variant="icon">
          <AlertTriangle aria-hidden="true" />
        </EmptyMedia>
        <Heading as="h1">404 - Seite nicht gefunden</Heading>
        <EmptyDescription>
          Hoppla! Die Seite, nach der du suchst, scheint nicht zu existieren oder wurde verschoben.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <AnimatedLink href="/" variant="default" size="lg">
          <Home data-icon="inline-start" aria-hidden="true" />
          Zurück zur Startseite
        </AnimatedLink>
      </EmptyContent>
    </Empty>
  );
}
