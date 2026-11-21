import type { InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import AnimatedLink from '@/components/AnimatedLink';
import { errorRingPosterImages } from '@/components/hero/poster-assets';
import ErrorGlassArtwork from '@/components/hero/ErrorGlassArtwork';
import PublicErrorScene from '@/components/PublicErrorScene';

export function getStaticProps() {
  return { props: { poster: errorRingPosterImages } };
}

export default function ServerError({ poster }: InferGetStaticPropsType<typeof getStaticProps>) {
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
          artwork={<ErrorGlassArtwork sources={poster} preload={false} />}
        >
          <AnimatedLink href="/" size="lg">
            Zur Startseite
          </AnimatedLink>
        </PublicErrorScene>
      </main>
    </>
  );
}
