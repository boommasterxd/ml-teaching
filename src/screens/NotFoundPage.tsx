import AnimatedLink from '@/components/AnimatedLink';
import { Home } from '@/components/icons/home';
import PublicErrorScene from '@/components/PublicErrorScene';
import ErrorGlassArtwork from '@/components/hero/ErrorGlassArtwork';
import { errorDigitsPosterImages } from '@/components/hero/poster-assets';

export default function NotFoundPage() {
  return (
    <PublicErrorScene
      artwork={<ErrorGlassArtwork digits sources={errorDigitsPosterImages} />}
      code="404"
      title="Seite nicht gefunden"
      description="Vielleicht wurde die Seite verschoben oder der Link ist veraltet."
    >
      <AnimatedLink href="/" transitionTypes={['nav-back']} size="lg">
        <Home data-icon="inline-start" aria-hidden="true" />
        Zurück zur Startseite
      </AnimatedLink>
    </PublicErrorScene>
  );
}
