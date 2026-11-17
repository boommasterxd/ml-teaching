import HeaderLearningLink from './HeaderLearningLink';
import SiteBrand from './SiteBrand';
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
            <HeaderLearningLink />
          </div>
        </nav>
      </EntryReveal>
    </header>
  );
}
