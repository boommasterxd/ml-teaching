import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImprintPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-zinc-500 hover:text-zinc-900 transition-colors font-medium text-sm"
            aria-label="Zurück zur Startseite"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Zurück</span>
          </button>
          
          <div className="flex items-center gap-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img 
              src="/ada-logo.png" 
              alt="Ada Lovelace Projekt Logo" 
              className="h-8 w-auto object-contain hidden sm:block"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-lg font-bold text-zinc-800">Impressum</h1>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
          <p>
            Yannick Schäfer<br />
            Am Mäuerchen 12<br />
            67591 Mölsheim
          </p>

          <h2>Kontakt</h2>
          <p>
            Telefon: 01575 7934851<br />
            E-Mail: yannickschaefer@boomapps.de
          </p>

          <h2>Redaktionell verantwortlich</h2>
          <p>
            Yannick Schäfer<br />
            Am Mäuerchen 12<br />
            67591 Mölsheim
          </p>

          <p className="text-sm text-zinc-500 mt-12">
            Dieses Impressum wurde für das Projekt &quot;The Teachable Machine&quot; erstellt.
          </p>
        </div>
      </main>
    </div>
  );
}
