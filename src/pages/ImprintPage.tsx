/**
 * Imprint page containing legal contact and ownership information.
 */
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImprintPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20 hyphens-auto break-words">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-zinc-500 hover:text-zinc-900 transition-colors font-medium text-sm flex-shrink-0"
            aria-label="Zurück zur Startseite"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Zurück</span>
          </button>
          
          <div className="flex-1 flex items-center justify-center gap-3 pr-8 sm:pr-0">
            <img 
              src="/ada-logo.png" 
              alt="Ada Lovelace Projekt Logo" 
              className="h-8 w-auto object-contain hidden lg:block"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">Impressum</h1>
          </div>
          
          <div className="w-10 sm:w-20"></div> {/* Spacer for centering balance */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12" role="main" aria-labelledby="imprint-title">
        <div className="bg-white p-6 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
          <h1 id="imprint-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Impressum</h1>
          
          <div className="space-y-1 text-zinc-600 mb-8">
            <p className="font-semibold text-zinc-900 text-lg">Yannick Schäfer</p>
            <p>Am Mäuerchen 12</p>
            <p>67591 Mölsheim</p>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Kontakt</h2>
          <div className="space-y-3 sm:space-y-2 text-zinc-600 mb-8">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-zinc-900 sm:w-20">Telefon:</span>
              <span>01575 7934851</span>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-zinc-900 sm:w-20">E-Mail:</span>
              <a href="mailto:yannickschaefer@boomapps.de" className="text-zinc-600 hover:text-zinc-900 underline transition-colors break-all sm:break-normal" aria-label="E-Mail an Yannick Schäfer schreiben">yannickschaefer@boomapps.de</a>
            </p>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Redaktionell verantwortlich</h2>
          <div className="space-y-1 text-zinc-600">
            <p className="font-semibold text-zinc-900 text-lg">Yannick Schäfer</p>
            <p>Am Mäuerchen 12</p>
            <p>67591 Mölsheim</p>
          </div>
        </div>
      </main>
    </div>
  );
}
