/**
 * AccessibilityPage.tsx
 *
 * Renders the voluntary accessibility statement for a private, non-commercial
 * project not covered by BFSG obligations.
 *
 * @exports AccessibilityPage - Default export, rendered at route `/barrierefreiheit`.
 */
import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import PageContent from '../components/PageContent';
import { usePageTitle } from '../hooks/usePageTitle';

/** Renders the voluntary accessibility statement with implemented measures and contact info. */
export default function AccessibilityPage() {
  usePageTitle('Barrierefreiheit');

  return (
    <PageLayout>
      <PageHeader title="Barrierefreiheit" />
      <PageContent labelledBy="accessibility-title">
        <h1 id="accessibility-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">
          Barrierefreiheit
        </h1>

        <p className="text-zinc-600 leading-relaxed mb-6">
          Diese Seite informiert freiwillig über die Barrierefreiheitsmaßnahmen dieser Website. Das Barrierefreiheitsstärkungsgesetz (BFSG) richtet sich an Wirtschaftsakteure, die Produkte oder Dienstleistungen im Rahmen einer wirtschaftlichen Tätigkeit anbieten. Diese Website ist ein privates Projekt und wird nicht kommerziell betrieben. Eine gesetzliche Pflicht nach dem BFSG besteht daher nicht.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Mein Anspruch</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Ich möchte, dass diese Website für alle Menschen zugänglich ist, unabhängig von körperlichen Einschränkungen oder verwendeten Hilfsmitteln. Ich orientiere mich dabei freiwillig an den Web Content Accessibility Guidelines (<abbr title="Web Content Accessibility Guidelines">WCAG</abbr>) 2.1 und 2.2 auf Stufe AA. Bekannte Barrieren wurden behoben (zuletzt geprüft: April 2026). Trotz sorgfältiger Umsetzung können einzelne Einschränkungen nicht vollständig ausgeschlossen werden.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Umgesetzte Maßnahmen</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Bei der Entwicklung dieser Website wurden unter anderem folgende Maßnahmen umgesetzt:
        </p>
        <ul className="list-disc list-inside text-zinc-600 leading-relaxed mb-4 space-y-1 pl-2">
          <li>Semantisches HTML5 für eine klare Dokumentstruktur</li>
          <li><abbr title="Accessible Rich Internet Applications">ARIA</abbr>-Attribute für Screenreader-Unterstützung</li>
          <li>Sichtbare Fokusindikatoren für Tastaturnavigation</li>
          <li>Ausreichende Farbkontraste für alle Texte</li>
          <li>Skip-Link zum Überspringen der Navigation</li>
          <li>Responsive Design für verschiedene Bildschirmgrößen</li>
        </ul>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Die Prüfung erfolgte durch statische Code-Analyse sowie einen Lighthouse Accessibility Audit (Score: 100&nbsp;%) auf allen Unterseiten. Ergänzend wurde ein automatisierter Scan mit{' '}
          <a
            href="https://accessibilitycheck.friendlycaptcha.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline hover:text-indigo-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
          >
            accessibilitycheck.friendlycaptcha.com
            <span className="sr-only"> (öffnet in neuem Tab)</span>
          </a>{' '}
          durchgeführt (Ergebnis: 100/100, WCAG A ✓, WCAG AA ✓, WCAG AAA ✓, EN 301 549 ✓). Automatisierte Tests ersetzen keine vollständige manuelle Prüfung.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Feedback</h2>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Haben Sie Schwierigkeiten beim Zugriff auf Inhalte dieser Website oder bemerken Sie eine Barriere? Ich freue mich über Ihre Rückmeldung:
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
          Ich bemühe mich, Rückmeldungen zeitnah zu beantworten und festgestellte Mängel zu beheben.
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Stand</h2>
        <p className="text-zinc-600 leading-relaxed">
          Diese Seite wurde zuletzt im <time dateTime="2026-04">April 2026</time> aktualisiert.
        </p>
      </PageContent>
    </PageLayout>
  );
}
