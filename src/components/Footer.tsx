/**
 * Footer component that displays the application footer with links to legal pages
 * and information about local data processing.
 */
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-zinc-50 py-12 text-center text-zinc-600 border-t border-zinc-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <p className="mb-4">Alle Daten werden lokal in deinem Browser verarbeitet. Es werden keine Bilder auf Server hochgeladen.</p>
        <div className="flex gap-6 text-sm mb-4">
          <Link to="/impressum" className="hover:text-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm">Datenschutz</Link>
          <Link to="/barrierefreiheit" className="hover:text-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 rounded-sm">Barrierefreiheit</Link>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} Yannick Schäfer &amp; Mara Tesche</p>
      </div>
    </footer>
  );
}
