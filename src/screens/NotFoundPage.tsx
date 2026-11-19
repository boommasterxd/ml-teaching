import AnimatedLink from '@/components/AnimatedLink';
import { Home } from '@/components/icons/home';
import PublicErrorScene from '@/components/PublicErrorScene';

export default function NotFoundPage() {
  return (
    <PublicErrorScene
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
