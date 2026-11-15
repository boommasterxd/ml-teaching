/**
 * Site-wide footer with links to legal pages and a note about local data processing.
 */
import Link from 'next/link';

/** Renders the application footer with imprint, privacy, and accessibility links. */
export default function Footer() {
  return (
    <footer className="bg-zinc-50 py-12 text-center text-zinc-600 border-t border-zinc-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <p className="mb-4">
          Deine Trainingsbilder und Vorhersagen bleiben im Browser. Es werden keine Bilder auf
          Server hochgeladen.
        </p>
        <p className="mb-4 text-sm">
          Einwilligung widerrufen und lokale Trainingsdaten verwerfen:{' '}
          <a
            href="/lernen"
            aria-label="Lernseite neu laden und Einwilligung widerrufen"
            className="underline hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm"
          >
            Lernseite neu laden
          </a>
          .
        </p>
        <nav aria-label="Rechtliche Links">
          <ul className="flex flex-wrap justify-center gap-6 text-sm mb-4 list-none p-0 m-0">
            <li>
              <Link
                href="/impressum"
                className="hover:text-zinc-800 underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Impressum
              </Link>
            </li>
            <li>
              <Link
                href="/datenschutz"
                className="hover:text-zinc-800 underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Datenschutz
              </Link>
            </li>
            <li>
              <Link
                href="/barrierefreiheit"
                className="hover:text-zinc-800 underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Barrierefreiheit
              </Link>
            </li>
          </ul>
        </nav>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Yannick Schäfer &amp; Mara Tesche
        </p>
      </div>
    </footer>
  );
}
