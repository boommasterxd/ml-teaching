import Head from 'next/head';
import Link from 'next/link';

export default function ServerError() {
  return (
    <>
      <Head>
        <title>Seite konnte nicht geladen werden | ML Teaching</title>
      </Head>
      <main
        lang="de"
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      >
        <h1 className="text-3xl font-bold">Diese Seite konnte nicht geladen werden</h1>
        <p className="mt-4">Bitte versuche es später erneut.</p>
        <Link href="/" className="mt-6 underline">
          Zur Startseite
        </Link>
      </main>
    </>
  );
}
