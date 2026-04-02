/**
 * AccessibilityPage.tsx
 *
 * Renders the statutory accessibility declaration (Barrierefreiheitserklärung)
 * as required by the BFSG (Barrierefreiheitsstärkungsgesetz).
 * Includes conformance status, technical stack, contact information,
 * and arbitration authority details.
 *
 * @exports AccessibilityPage - Default export, rendered at route `/barrierefreiheit`.
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
          Erklärung zur Barrierefreiheit
        </h1>

        <p className="text-zinc-600 leading-relaxed mb-6">
          Diese Erklärung zur Barrierefreiheit ist eine freiwillige Erklärung. Das Barrierefreiheitsstärkungsgesetz (BFSG) gilt primär für Wirtschaftsakteure im elektronischen Geschäftsverkehr, Bankwesen und Personenverkehr. Ob diese Website in den Anwendungsbereich des BFSG fällt, ist nicht abschließend geklärt.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Konformitätsstatus</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Diese Website ist mit den Anforderungen der Web Content Accessibility Guidelines (<abbr title="Web Content Accessibility Guidelines">WCAG</abbr>) 2.1 und 2.2 auf Stufe AA sowie dem Barrierefreiheitsstärkungsgesetz (BFSG), nach unserem Wissen, konform. Alle bekannten Barrieren wurden behoben (Stand: März 2026).
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Technische Informationen</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Die Barrierefreiheit dieser Website wurde anhand der folgenden Technologien sichergestellt:
        </p>
        <ul className="list-disc list-inside text-zinc-600 leading-relaxed mb-4 space-y-1 pl-2">
          <li>HTML5 mit semantischen Elementen</li>
          <li><abbr title="Accessible Rich Internet Applications">ARIA</abbr> (Accessible Rich Internet Applications)</li>
          <li>CSS3 / Tailwind CSS 4</li>
          <li>JavaScript / TypeScript / React</li>
          <li>TensorFlow.js (WebAssembly)</li>
        </ul>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Die Prüfung erfolgte durch statische Code-Analyse sowie einen Lighthouse Accessibility Audit (Score: 100&nbsp;%) auf allen Unterseiten.
        </p>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Zusätzlich wurde ein externer Barrierefreiheits-Scan aller Unterseiten mit dem Tool <a href="https://accessibilitycheck.friendlycaptcha.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">accessibilitycheck.friendlycaptcha.com<span className="sr-only"> (öffnet in neuem Tab)</span></a> durchgeführt. Das Ergebnis: Barrierefreiheitsbewertung 100/100 (konform), WCAG A ✓, WCAG AA ✓, WCAG AAA ✓, EN 301 549 ✓.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Feedback und Kontakt</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Haben Sie Schwierigkeiten beim Zugriff auf Inhalte dieser Website oder bemerken Sie eine Barriere, die wir übersehen haben? Bitte melden Sie Barrierefreiheitsprobleme an:
        </p>
        <div className="space-y-2 text-zinc-600 mb-6">
          <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-zinc-900 sm:w-20">E-Mail:</span>
            <a
              href="mailto:yannickschaefer@boomapps.de"
              className="text-indigo-600 hover:text-indigo-800 underline transition-colors break-all sm:break-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
            >
              yannickschaefer@boomapps.de
              <span className="sr-only"> (Barrierefreiheits-Feedback schreiben)</span>
            </a>
          </p>
        </div>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Wir bemühen uns, Rückmeldungen zu Barrierefreiheitsproblemen innerhalb von 2 Wochen zu beantworten und festgestellte Mängel zeitnah zu beheben.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Schlichtungsverfahren</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Sie können sich an die zuständige Schlichtungsstelle wenden, die im Rahmen des jeweiligen Landes-Behindertengleichstellungsgesetzes eingerichtet wurde. Ziel dieses Verfahrens ist es, eine einvernehmliche Lösung zwischen Ihnen und dem Betreiber der Internetseite oder mobilen Anwendung zu erreichen. Die Schlichtung ist kostenlos und erfordert keinen Rechtsbeistand.
        </p>
        <address className="not-italic text-zinc-600 leading-relaxed mb-4 pl-4 border-l-2 border-zinc-100">
          <p className="font-semibold text-zinc-800">Landesbeauftragte für die Belange von Menschen mit Behinderung</p>
          <p>Ellen Kubica</p>
          <p>Bauhofstraße 9</p>
          <p>55116 Mainz</p>
          <p>Telefon: <a href="tel:+4961311650342" className="text-indigo-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">06131 16-5342</a></p>
          <p>E-Mail: <a href="mailto:durchsetzungsstelle@mastd.rlp.de" className="text-indigo-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">durchsetzungsstelle@mastd.rlp.de</a></p>
        </address>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Beschwerde bei der Marktüberwachungsbehörde gemäß dem Barrierefreiheitsstärkungsgesetz (BFSG)</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Falls Sie der Meinung sind, dass die Anforderungen der Barrierefreiheit gemäß dem BFSG nicht eingehalten werden, können Sie eine Beschwerde bei der zuständigen Marktüberwachungsbehörde einreichen. Diese Behörde prüft den Sachverhalt und kann gegebenenfalls Maßnahmen zur Herstellung der Barrierefreiheit anordnen.
        </p>
        <address className="not-italic text-zinc-600 leading-relaxed mb-4 pl-4 border-l-2 border-zinc-100">
          <p className="font-semibold text-zinc-800">Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und Dienstleistungen (MLBF)</p>
          <p>c/o Ministerium für Arbeit, Soziales, Gesundheit und Gleichstellung Sachsen-Anhalt</p>
          <p>Postfach 39 11 55</p>
          <p>39135 Magdeburg</p>
          <p>Telefon: <a href="tel:+493915676970" className="text-indigo-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">0391 567 6970</a></p>
          <p>E-Mail: <a href="mailto:mlbf@ms.sachsen-anhalt.de" className="text-indigo-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">mlbf@ms.sachsen-anhalt.de</a></p>
        </address>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Datum dieser Erklärung</h2>
        <p className="text-zinc-600 leading-relaxed">
          Diese Erklärung zur Barrierefreiheit wurde am <time dateTime="2026-03-27">27. März 2026</time> erstellt.
        </p>
      </PageContent>
    </PageLayout>
  );
}
