/**
 * 404 Not Found page shown when a user navigates to a non-existent route.
 */
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import Button from '../components/Button';

/** Displays a 404 message with a button to navigate back to the home page. */
export default function NotFoundPage() {
  const navigate = useNavigate();
  usePageTitle('Seite nicht gefunden');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10" aria-hidden="true" />
      </div>

      <h1 className="text-4xl font-bold text-zinc-900 mb-4">404 - Seite nicht gefunden</h1>

      <p className="text-zinc-600 max-w-md mb-8 leading-relaxed">
        Hoppla! Die Seite, nach der du suchst, scheint nicht zu existieren oder wurde verschoben.
      </p>

      <Button variant="primary" size="lg" onClick={() => navigate('/')}>
        <Home className="w-5 h-5 mr-2" aria-hidden="true" />
        Zurück zur Startseite
      </Button>
    </div>
  );
}
