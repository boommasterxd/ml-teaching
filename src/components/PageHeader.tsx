import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  /** Optionaler Slot für die rechte Seite des Headers (z. B. Aktions-Buttons). */
  rightSlot?: ReactNode;
}

export default function PageHeader({ title, rightSlot }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-zinc-600 hover:text-zinc-900 transition-colors font-medium text-sm flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
          aria-label="Zurück zur Startseite"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Zurück</span>
        </button>

        <div className={`flex-1 flex items-center justify-center gap-3 ${rightSlot ? 'px-2' : 'pr-8 sm:pr-0'}`}>
          <img
            src="/ada-logo.png"
            alt="Ada Lovelace Projekt Logo"
            className="h-8 w-auto object-contain hidden lg:block"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">{title}</h1>
        </div>

        {rightSlot ?? <div className="w-10 sm:w-20" aria-hidden="true"></div>}
      </div>
    </header>
  );
}
