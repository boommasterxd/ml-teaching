'use client';
import Button from '@/components/Button';
import { Card } from '@/components/ui/card';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { EmptyContent, EmptyDescription } from '@/components/ui/empty';
import { Heading } from '@/components/ui/typography';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card role="alert" className="public-error-surface">
      <Heading as="h1">Diese Seite konnte nicht geladen werden</Heading>
      <EntryReveal kind="text">
        <EmptyContent>
          <EmptyDescription>Bitte versuche es erneut.</EmptyDescription>
          <Button onClick={reset}>Erneut versuchen</Button>
        </EmptyContent>
      </EntryReveal>
    </Card>
  );
}
