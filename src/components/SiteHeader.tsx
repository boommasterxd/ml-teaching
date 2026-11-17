import AnimatedLink from './AnimatedLink';
import SiteBrand from './SiteBrand';
import { ArrowRight } from './icons/arrow-right';
import { ThemeControl } from './theme/ThemeControl';
import { EntryReveal } from './ui/entry-reveal';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <EntryReveal kind="shell" asChild>
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
      </EntryReveal>
    </header>
  );
}
