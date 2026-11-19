import Head from 'next/head';
import AnimatedLink from '@/components/AnimatedLink';
import PublicErrorScene from '@/components/PublicErrorScene';

export default function ServerError() {
  return (
    <>
      <Head>
        <title>Seite konnte nicht geladen werden | ML Teaching</title>
      </Head>
      <main id="main-content" tabIndex={-1} className="app-main">
        <PublicErrorScene
          code="500"
          title="Diese Seite konnte nicht geladen werden"
          description="Bitte versuche es später erneut."
        >
          <AnimatedLink href="/" size="lg">
            Zur Startseite
          </AnimatedLink>
        </PublicErrorScene>
      </main>
    </>
  );
}
