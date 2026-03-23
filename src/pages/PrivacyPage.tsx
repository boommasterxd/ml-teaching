import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
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
            <h1 className="text-lg font-bold text-zinc-800">Datenschutzerklärung</h1>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
          <h2>1. Datenschutz auf einen Blick</h2>
          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>

          <h2>2. Datenerfassung auf dieser Website</h2>
          <h3>Kamerazugriff und Bilddaten</h3>
          <p>
            Diese Anwendung nutzt die Kamera Ihres Geräts, um Bilder für das Training eines Machine-Learning-Modells aufzunehmen. 
            <strong>Wichtig: Alle aufgenommenen Bilder und das Training des Modells finden ausschließlich lokal in Ihrem Browser statt.</strong> 
            Es werden zu keinem Zeitpunkt Bilder oder Kameradaten an unsere Server oder Server von Dritten übertragen.
          </p>

          <h3>Laden von KI-Modellen (TensorFlow.js)</h3>
          <p>
            Um die Bilderkennung zu ermöglichen, verwendet diese Anwendung ein vortrainiertes neuronales Netz (MobileNet) über die Bibliothek TensorFlow.js. 
            Die Modelldateien (Gewichte) werden beim Start des Trainings von den Servern von Google (Google Cloud Storage / TFHub) heruntergeladen. 
            Dabei wird Ihre IP-Adresse an Google übertragen, da dies technisch für den Download der Dateien notwendig ist.
            Wir haben auf der Trainingsseite eine explizite Checkbox eingerichtet, damit Sie diesem Download vorab zustimmen können.
          </p>

          <h3>Server-Log-Dateien</h3>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
          </p>
          <ul>
            <li>Browsertyp und Browserversion</li>
            <li>verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p>
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
          </p>

          <h2>3. Ihre Rechte</h2>
          <p>
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.
          </p>
        </div>
      </main>
    </div>
  );
}
