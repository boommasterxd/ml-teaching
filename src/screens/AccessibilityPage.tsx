import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import PageContent from '../components/PageContent';

export default function AccessibilityPage() {
  return (
    <PageLayout>
      <PageHeader title="Barrierefreiheit" />
      <PageContent labelledBy="accessibility-title">
        <h1 id="accessibility-title">Barrierefreiheit</h1>
        <p>
          Diese Seite informiert freiwillig über die Barrierefreiheitsmaßnahmen dieser Website. Das
          Barrierefreiheitsstärkungsgesetz (BFSG) richtet sich an Wirtschaftsakteure, die Produkte
          oder Dienstleistungen im Rahmen einer wirtschaftlichen Tätigkeit anbieten. Diese Website
          ist ein privates Projekt und wird nicht kommerziell betrieben. Eine gesetzliche Pflicht
          nach dem BFSG besteht daher nicht.
        </p>
        <h2>Mein Anspruch</h2>
        <p>
          Ich möchte, dass diese Website für alle Menschen zugänglich ist, unabhängig von
          körperlichen Einschränkungen oder verwendeten Hilfsmitteln. Ich orientiere mich dabei
          freiwillig an den Web Content Accessibility Guidelines (WCAG) 2.2 auf Stufe AA.
        </p>
        <h2>Umgesetzte Maßnahmen</h2>
        <p>Bei der Entwicklung dieser Website wurden unter anderem folgende Maßnahmen umgesetzt:</p>
        <ul>
          <li>Semantisches HTML für eine klare Dokumentstruktur</li>
          <li>Beschriftungen und Statusmeldungen für unterstützende Technologien</li>
          <li>Sichtbare Fokusindikatoren für die Tastaturnavigation</li>
          <li>Skip-Link zum Überspringen der Navigation</li>
          <li>Responsive Darstellung für verschiedene Bildschirmgrößen</li>
        </ul>
        <h2>Bekannte Einschränkungen</h2>
        <p>Nach aktuellem Kenntnisstand sind keine Barrieren bekannt.</p>
        <h2>Feedback</h2>
        <p>
          Haben Sie Schwierigkeiten beim Zugriff auf Inhalte dieser Website oder bemerken Sie eine
          Barriere? Ich freue mich über Ihre Rückmeldung:
        </p>
        <p>
          E-Mail: <a href="mailto:yannickschaefer@boomapps.de">yannickschaefer@boomapps.de</a>
        </p>
        <p>
          Ich bemühe mich, Rückmeldungen zeitnah zu beantworten und festgestellte Mängel zu beheben.
        </p>
        <h2>Stand</h2>
        <p>
          Diese Seite wurde zuletzt im <time dateTime="2026-11-16">November 2026</time>{' '}
          aktualisiert.
        </p>
        <p>
          Automatisierte Prüfungen können Barrieren übersehen. Auch bei sorgfältiger Umsetzung kann
          vollständige Barrierefreiheit nicht garantiert werden.
        </p>
      </PageContent>
    </PageLayout>
  );
}
