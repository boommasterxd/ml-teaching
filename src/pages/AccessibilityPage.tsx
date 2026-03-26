/**
 * Accessibility statement page (BFSG §14 + Annex 3 / WCAG 2.1 AA compliance).
 */
import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import PageContent from '../components/PageContent';
import { usePageTitle } from '../hooks/usePageTitle';

/** Renders the accessibility declaration with conformance status and contact info. */
export default function AccessibilityPage() {
  usePageTitle('Barrierefreiheit');

  return (
    <PageLayout>
      <PageHeader title="Barrierefreiheitserklärung" />
      <PageContent labelledBy="accessibility-title">
          <h1 id="accessibility-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">
            Barrierefreiheitserklärung
          </h1>

          <p className="text-zinc-600 leading-relaxed mb-6">
            Diese Barrierefreiheitserklärung gilt für die Website <strong>KI Bilderkennung für Schüler</strong> (the-teachable-machine) und wurde gemäß § 14 des Barrierefreiheitsstärkungsgesetzes (BFSG) in Verbindung mit Anlage 3 erstellt.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Konformitätsstatus</h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Diese Website ist nach unserem Kenntnisstand <strong>konform</strong> mit den Anforderungen der <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.1 Level AA, WCAG 2.2 Level AA sowie den einschlägigen Anforderungen der EN 301 549 und des BFSG.
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
              >
                yannickschaefer@boomapps.de
                <span className="sr-only"> (Barrierefreiheits-Feedback schreiben)</span>
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
            <p className="font-semibold text-zinc-800">Aufsichts- und Dienstleistungsdirektion (ADD) Rheinland-Pfalz</p>
            <p>Willy-Brandt-Platz 3</p>
            <p>54290 Trier</p>
            <p>Telefon: <a href="tel:+4965194940" className="text-indigo-600 underline">0651 9494-0</a></p>
            <p>E-Mail: <a href="mailto:poststelle@add.rlp.de" className="text-indigo-600 underline">poststelle@add.rlp.de</a></p>
            <p>Website: <a href="https://add.rlp.de" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">add.rlp.de<span className="sr-only"> (öffnet in neuem Tab)</span></a></p>
          </address>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Datum der Erklärung</h2>
          <p className="text-zinc-600 leading-relaxed">
            Diese Erklärung wurde am <time dateTime="2026-03-26">26. März 2026</time> erstellt und zuletzt überprüft.
          </p>
      </PageContent>
    </PageLayout>
  );
}
