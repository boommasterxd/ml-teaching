/**
 * 404 Not Found page shown when a user navigates to a non-existent route.
 */
import AnimatedLink from '@/components/AnimatedLink';
import { Home, AlertTriangle } from '../components/icons';

/** Displays a 404 message with a button to navigate back to the home page. */
export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10" aria-hidden="true" />
      </div>

      <h1 className="text-4xl font-bold text-zinc-900 mb-4">404 - Seite nicht gefunden</h1>

      <p className="text-zinc-600 max-w-md mb-8 leading-relaxed">
        Hoppla! Die Seite, nach der du suchst, scheint nicht zu existieren oder wurde verschoben.
      </p>

      <AnimatedLink href="/" variant="primary" size="lg">
        <Home data-icon="inline-start" aria-hidden="true" />
        Zurück zur Startseite
      </AnimatedLink>
    </div>
  );
}
