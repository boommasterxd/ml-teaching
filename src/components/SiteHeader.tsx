import AnimatedLink from './AnimatedLink';
import SiteBrand from './SiteBrand';
import { ArrowRight } from './icons';
import { ThemeControl } from './theme/ThemeControl';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-header-inner" aria-label="Hauptnavigation">
        <SiteBrand />
        <div className="site-header-actions">
          <ThemeControl />
          <AnimatedLink
            href="/lernen"
            variant="outline"
            size="default"
            aria-label="Lernlabor öffnen"
          >
            <span className="hidden sm:inline">Lernlabor</span>
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </AnimatedLink>
        </div>
      </nav>
    </header>
  );
}
