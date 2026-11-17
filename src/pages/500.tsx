import Head from 'next/head';
import Link from '@/components/IntentLink';
import { EntryReveal } from '@/components/ui/entry-reveal';

export default function ServerError() {
  return (
    <>
      <Head>
        <title>Seite konnte nicht geladen werden | ML Teaching</title>
      </Head>
      <main
        lang="de"
        className="flex flex-1 min-h-[60svh] flex-col items-center justify-center gap-6 p-6 text-center"
      >
        <h1 className="text-3xl font-bold">Diese Seite konnte nicht geladen werden</h1>
        <EntryReveal kind="text" asChild>
          <p className="mt-4">Bitte versuche es später erneut.</p>
        </EntryReveal>
        <EntryReveal kind="text" index={1} asChild>
          <Link href="/" className="mt-6 underline">
            Zur Startseite
          </Link>
        </EntryReveal>
      </main>
    </>
  );
}
