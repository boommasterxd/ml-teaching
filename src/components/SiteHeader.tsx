import SiteNavigation from './SiteNavigation';
import SiteBrand from './SiteBrand';
import SiteHeaderSurface from './SiteHeaderSurface';
import { ThemeControl } from './theme/ThemeControl';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <SiteHeaderSurface />
      <nav className="site-header-inner" aria-label="Hauptnavigation">
        <SiteBrand />
        <SiteNavigation />
        <div className="site-header-actions">
          <ThemeControl />
        </div>
      </nav>
    </header>
  );
}
