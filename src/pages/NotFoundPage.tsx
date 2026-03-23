/**
 * 404 Not Found page shown when a user navigates to a non-existent route.
 */
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>
      
      <h1 className="text-4xl font-bold text-zinc-900 mb-4">404 - Seite nicht gefunden</h1>
      
      <p className="text-zinc-600 max-w-md mb-8 leading-relaxed">
        Hoppla! Die Seite, nach der du suchst, scheint nicht zu existieren oder wurde verschoben.
      </p>
      
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
      >
        <Home className="w-5 h-5" />
        Zurück zur Startseite
      </button>
    </div>
  );
}
