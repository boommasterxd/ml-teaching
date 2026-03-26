/**
 * Accessibility statement page according to BFSG §14 + Anlage 3.
 */
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessibilityPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Barrierefreiheit – KI Bilderkennung für Schüler';
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20 hyphens-auto break-words">
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

          <div className="flex-1 flex items-center justify-center gap-3 pr-8 sm:pr-0">
            <img
              src="/ada-logo.png"
              alt="Ada Lovelace Projekt Logo"
              className="h-8 w-auto object-contain hidden lg:block"
              referrerPolicy="no-referrer"
            />
            <p className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">Barrierefreiheitserklärung</p>
          </div>

          <div className="w-10 sm:w-20"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12" aria-labelledby="accessibility-title">
        <div className="bg-white p-6 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
          <h1 id="accessibility-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">
            Barrierefreiheitserklärung
          </h1>

          <p className="text-zinc-600 leading-relaxed mb-6">
            Diese Barrierefreiheitserklärung gilt für die Website <strong>KI Bilderkennung für Schüler</strong> (the-teachable-machine) und wurde gemäß § 14 des Barrierefreiheitsstärkungsgesetzes (BFSG) in Verbindung mit Anlage 3 erstellt.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Konformitätsstatus</h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Diese Website ist <strong>voll konform</strong> mit den Anforderungen der <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.1 Level AA, WCAG 2.2 Level AA sowie den einschlägigen Anforderungen der EN 301 549 und des BFSG.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Bekannte nicht barrierefreie Inhalte</h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Zum Zeitpunkt der letzten Prüfung sind keine nicht barrierefreien Inhalte bekannt.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Feedback und Kontakt</h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sind Ihnen Barrieren auf dieser Website aufgefallen? Haben Sie Schwierigkeiten beim Zugriff auf bestimmte Inhalte oder Funktionen? Wir freuen uns über Ihr Feedback und helfen Ihnen gerne weiter.
          </p>
          <div className="space-y-2 text-zinc-600 mb-6">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-zinc-900 sm:w-20">E-Mail:</span>
              <a
                href="mailto:yannickschaefer@boomapps.de"
                className="text-zinc-600 hover:text-zinc-900 underline transition-colors break-all sm:break-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                aria-label="E-Mail für Barrierefreiheits-Feedback an Yannick Schäfer schreiben"
              >
                yannickschaefer@boomapps.de
              </a>
            </p>
          </div>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wir bemühen uns, Ihr Anliegen innerhalb von 30 Tagen zu beantworten.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Durchsetzungsverfahren</h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wenn Sie nach Kontaktaufnahme mit uns keine zufriedenstellende Antwort erhalten haben, können Sie sich an die zuständige Durchsetzungsstelle wenden:
          </p>
          <address className="not-italic text-zinc-600 leading-relaxed mb-4 pl-4 border-l-2 border-zinc-100">
            <p className="font-semibold text-zinc-800">Marktüberwachungsbehörde gemäß BFSG</p>
            <p>Für weitere Informationen wenden Sie sich an die zuständige Behörde in Ihrem Bundesland.</p>
          </address>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Datum der Erklärung</h2>
          <p className="text-zinc-600 leading-relaxed">
            Diese Erklärung wurde am <time dateTime="2026-03-26">26. März 2026</time> erstellt und zuletzt überprüft.
          </p>
        </div>
      </main>
    </div>
  );
}
