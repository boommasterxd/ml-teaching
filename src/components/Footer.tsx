import Link from 'next/link';
import SiteBrand from './SiteBrand';
import { Separator } from './ui/separator';

/** Keeps local processing, withdrawal and legal navigation available on every route. */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <SiteBrand />
          <div className="footer-local">
            <p>
              Deine Trainingsbilder und Vorhersagen bleiben im Browser. Es werden keine Bilder auf
              Server hochgeladen.
            </p>
          </div>
        </div>
        <p className="footer-withdrawal">
          Einwilligung widerrufen und lokale Trainingsdaten verwerfen:{' '}
          <a
            href="/lernen"
            aria-label="Lernseite neu laden und Einwilligung widerrufen"
            className="footer-link"
          >
            Lernseite neu laden
          </a>
          .
        </p>
        <Separator />
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Yannick Schäfer &amp; Mara Tesche</p>
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
      </div>
    </footer>
  );
}
