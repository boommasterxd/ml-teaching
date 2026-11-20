import Head from 'next/head';
import AnimatedLink from '@/components/AnimatedLink';
import { contourPreloads } from '@/components/hero/contour-poster';
import { errorRingPosterImages } from '@/components/hero/poster-assets';
import ErrorGlassArtwork from '@/components/hero/ErrorGlassArtwork';
import PublicErrorScene from '@/components/PublicErrorScene';

export default function ServerError() {
  return (
    <>
      <Head>
        <title>Seite konnte nicht geladen werden | ML Teaching</title>
        {contourPreloads(errorRingPosterImages).map(({ src, ...props }) => (
          <link
            key={props.media}
            rel="preload"
            {...props}
            href={props.imageSrcSet ? undefined : src}
          />
        ))}
      </Head>
      <main id="main-content" tabIndex={-1} className="app-main">
        <PublicErrorScene
          code="500"
          title="Diese Seite konnte nicht geladen werden"
          description="Bitte versuche es später erneut."
          artwork={<ErrorGlassArtwork sources={errorRingPosterImages} preload={false} />}
        >
          <AnimatedLink href="/" size="lg">
            Zur Startseite
          </AnimatedLink>
        </PublicErrorScene>
      </main>
    </>
  );
}
