import Head from 'next/head';
import AnimatedLink from '@/components/AnimatedLink';
import { Card } from '@/components/ui/card';
import { EntryReveal } from '@/components/ui/entry-reveal';
import { EmptyDescription } from '@/components/ui/empty';
import { Heading } from '@/components/ui/typography';

export default function ServerError() {
  return (
    <>
      <Head>
        <title>Seite konnte nicht geladen werden | ML Teaching</title>
      </Head>
      <main lang="de" className="public-error-frame">
        <Card className="public-error-surface">
          <Heading as="h1">Diese Seite konnte nicht geladen werden</Heading>
          <EntryReveal kind="text" asChild>
            <EmptyDescription>Bitte versuche es später erneut.</EmptyDescription>
          </EntryReveal>
          <EntryReveal kind="text" index={1}>
            <AnimatedLink href="/" size="lg">
              Zur Startseite
            </AnimatedLink>
          </EntryReveal>
        </Card>
      </main>
    </>
  );
}
