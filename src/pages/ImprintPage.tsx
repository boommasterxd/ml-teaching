/**
 * Imprint page containing legal contact and ownership information.
 */
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12" role="main" aria-labelledby="imprint-title">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
          <h1 id="imprint-title" className="text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Impressum</h1>
          
          <div className="space-y-1 text-zinc-600 mb-8">
            <p className="font-semibold text-zinc-900 text-lg">Yannick Schäfer</p>
            <p>Am Mäuerchen 12</p>
            <p>67591 Mölsheim</p>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Kontakt</h2>
          <div className="space-y-2 text-zinc-600 mb-8">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 w-20">Telefon:</span>
              <span>01575 7934851</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 w-20">E-Mail:</span>
              <a href="mailto:yannickschaefer@boomapps.de" className="text-zinc-600 hover:text-zinc-900 underline transition-colors" aria-label="E-Mail an Yannick Schäfer schreiben">yannickschaefer@boomapps.de</a>
            </p>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Redaktionell verantwortlich</h2>
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
