import PageLayout from '../components/PageLayout';
import PageContent from '../components/PageContent';

export default function AccessibilityPage() {
  return (
    <PageLayout page="accessibility">
      <PageContent labelledBy="accessibility-title" title="Barrierefreiheit">
        <p>
          Diese Seite informiert freiwillig über die Barrierefreiheitsmaßnahmen dieser Website.
          BoomApps stellt ML Teaching als kostenloses Lernangebot bereit. Über diese Website werden
          keine Verbraucherverträge angebahnt oder abgeschlossen. Für dieses Angebot besteht daher
          keine Pflicht nach dem BFSG.
        </p>
        <h2>Unser Anspruch</h2>
        <p>
          Wir möchten, dass diese Website für alle Menschen zugänglich ist, unabhängig von
          körperlichen Einschränkungen oder verwendeten Hilfsmitteln. Wir orientieren uns dabei
          freiwillig an den Web Content Accessibility Guidelines (WCAG) 2.2 auf Stufe AA.
        </p>
        <h2>Umgesetzte Maßnahmen</h2>
        <p>Bei der Entwicklung dieser Website wurden unter anderem folgende Maßnahmen umgesetzt:</p>
        <ul>
          <li>Semantisches HTML für eine klare Dokumentstruktur</li>
          <li>Beschriftungen und Statusmeldungen für unterstützende Technologien</li>
          <li>Sichtbare Fokusindikatoren für die Tastaturnavigation</li>
          <li>Skip-Link zum Überspringen der Navigation</li>
          <li>Per Tastatur bedienbare Navigation durch Bildersammlung, Training und Vorhersage</li>
          <li>
            Bei aktivierter Systemeinstellung für reduzierte Bewegung erscheinen Inhalte ohne
            Einblendanimation. Die Lernschleife und die automatischen Lernbeispiele auf der
            Startseite pausieren.
          </li>
          <li>Responsive Darstellung für verschiedene Bildschirmgrößen</li>
        </ul>
        <h2>Bekannte Einschränkungen</h2>
        <p>Folgende Einschränkungen sind bekannt:</p>
        <ul>
          <li>
            Im Merkmalsraum der Live-Vorhersage sind die Verteilung der Trainingsbilder und die
            Position des Kamerabilds nur grafisch erkennbar. Die vorhergesagte Klasse und die
            Prozentwerte sind auch als Text verfügbar.
          </li>
        </ul>
        <p>Bei Schwierigkeiten nutzen Sie bitte den unten angegebenen Kontakt.</p>
        <h2>Feedback</h2>
        <p>
          Haben Sie Schwierigkeiten beim Zugriff auf Inhalte dieser Website oder bemerken Sie eine
          Barriere? Wir freuen uns über Ihre Rückmeldung:
        </p>
        <p>
          E-Mail: <a href="mailto:yannickschaefer@boomapps.de">yannickschaefer@boomapps.de</a>
        </p>
        <p>
          Wir bemühen uns, Rückmeldungen zeitnah zu beantworten und festgestellte Mängel zu beheben.
        </p>
        <h2>Stand</h2>
        <p>
          Diese Seite wurde zuletzt im <time dateTime="2026-11-20">November 2026</time>{' '}
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
