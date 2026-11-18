import Link from './IntentLink';
import SiteBrand from './SiteBrand';
import { EntryReveal } from './ui/entry-reveal';
import { headerLegalLinks } from '@/content/site-navigation';

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
              {headerLegalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </EntryReveal>
    </footer>
  );
}
