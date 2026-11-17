import Link from './IntentLink';
import SiteBrand from './SiteBrand';
import { EntryReveal } from './ui/entry-reveal';

/** Compact global identity and information links; consent controls belong to the workspace. */
export default function Footer() {
  return (
    <footer className="site-footer">
      <EntryReveal kind="shell" asChild>
        <div className="site-footer-inner">
          <div className="footer-brand">
            <SiteBrand />
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Yannick Schäfer &amp; Mara Tesche
            </p>
          </div>
          <nav aria-label="Rechtliche Links">
            <ul className="footer-links">
              <li>
                <Link href="/impressum" className="footer-link">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="footer-link">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/barrierefreiheit" className="footer-link">
                  Barrierefreiheit
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </EntryReveal>
    </footer>
  );
}
