/**
 * Privacy policy page that outlines how user data is handled, 
 * emphasizing local processing and transparency regarding external KI models.
 */
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12" role="main" aria-label="Datenschutzerklärung">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm prose prose-zinc max-w-none">
          <h1 className="text-3xl font-bold mb-8 text-zinc-900">Datenschutzerklärung</h1>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-zinc-800 border-b border-zinc-100 pb-2">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Allgemeine Hinweise</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Datenerfassung auf dieser Website</h3>
          <h4 className="text-lg font-bold mt-6 mb-3 text-zinc-800">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.
          </p>

          <h4 className="text-lg font-bold mt-6 mb-3 text-zinc-800">Wie erfassen wir Ihre Daten?</h4>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.&nbsp;B. um Daten handeln, die Sie uns per E-Mail zukommen lassen.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
          </p>

          <h4 className="text-lg font-bold mt-6 mb-3 text-zinc-800">Wofür nutzen wir Ihre Daten?</h4>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.
          </p>

          <h4 className="text-lg font-bold mt-6 mb-3 text-zinc-800">Welche Rechte haben Sie bezüglich Ihrer Daten?</h4>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-zinc-800 border-b border-zinc-100 pb-2">2. Hosting</h2>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Externes Hosting</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters / der Hoster gespeichert. Hierbei kann es sich v.&nbsp;a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO). Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers (z.&nbsp;B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten befolgen.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wir setzen folgenden Hoster ein:
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            HOSTINGER operations, UAB<br />
            Švitrigailos str. 34, Vilnius 03230 Litauen<br />
            Phone: +37064503378<br />
            Email: domains@hostinger.com
          </p>

          <h4 className="text-lg font-bold mt-6 mb-3 text-zinc-800">Auftragsverarbeitung</h4>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-zinc-800 border-b border-zinc-100 pb-2">3. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Datenschutz</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wir weisen darauf hin, dass die Datenübertragung im Internet (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Hinweis zur verantwortlichen Stelle</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4 font-medium">
            Yannick Schäfer<br />
            Am Mäuerchen 12<br />
            67591 Mölsheim
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Telefon: 01575 7934851<br />
            E-Mail: yannickschaefer@boomapps.de
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Speicherdauer</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z.B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Empfänger von personenbezogenen Daten</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich ist, wenn wir gesetzlich hierzu verpflichtet sind (z. B. Weitergabe von Daten an Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten unserer Kunden nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung weiter. Im Falle einer gemeinsamen Verarbeitung wird ein Vertrag über gemeinsame Verarbeitung geschlossen.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen in Ihr Endgerät (z.B. via Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich auf Grundlage von § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser Datenschutzerklärung informiert.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800 uppercase">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
          <p className="text-zinc-600 leading-relaxed mb-4 font-bold">
            WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4 font-bold">
            WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Recht auf Datenübertragbarkeit</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Auskunft, Berichtigung und Löschung</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Recht auf Einschränkung der Verarbeitung</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-zinc-600">
            <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
            <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht, können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.</li>
            <li>Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
            <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
          </ul>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">SSL- bzw. TLS-Verschlüsselung</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-zinc-800 border-b border-zinc-100 pb-2">4. Datenerfassung auf dieser Website</h2>
          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Cookies</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Unsere Internetseiten verwenden so genannte „Cookies“. Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Cookies können von uns (First-Party-Cookies) oder von Drittunternehmen stammen (sog. Third-Party-Cookies). Third-Party-Cookies ermöglichen die Einbindung bestimmter Dienstleistungen von Drittunternehmen innerhalb von Webseiten (z.&nbsp;B. Cookies zur Abwicklung von Zahlungsdienstleistungen).
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind technisch notwendig, da bestimmte Webseitenfunktionen ohne diese nicht funktionieren würden (z.&nbsp;B. die Warenkorbfunktion oder die Anzeige von Videos). Andere Cookies können zur Auswertung des Nutzerverhaltens oder zu Werbezwecken verwendet werden.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z.&nbsp;B. für die Warenkorbfunktion) oder zur Optimierung der Website (z.&nbsp;B. Cookies zur Messung des Webpublikums) erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von notwendigen Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste. Sofern eine Einwilligung zur Speicherung von Cookies und vergleichbaren Wiedererkennungstechnologien abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage dieser Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG); die Einwilligung ist jederzeit widerrufbar.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Server-Log-Dateien</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-zinc-600">
            <li>Browsertyp und Browserversion</li>
            <li>verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Anfrage per E-Mail, Telefon oder Telefax</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde; die Einwilligung ist jederzeit widerrufbar.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere gesetzliche Aufbewahrungsfristen – bleiben unberührt.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-zinc-800">Einsatz von KI auf der Website (2-Klick-Lösung)</h3>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Diese Website nutzt clientseitige KI-Modelle zur Bilderkennung (MobileNet). Um Ihre Privatsphäre zu schützen, werden diese Modelle nicht automatisch beim Laden der Website, sondern erst nach Ihrer ausdrücklichen Zustimmung (2-Klick-Lösung) von Servern des Anbieters Google geladen.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Erst wenn Sie die KI-Funktionen aktiv starten und der damit verbundenen Datenübertragung zustimmen, wird eine Verbindung zu den Servern von Google hergestellt und Ihre IP-Adresse an Google übertragen. Die eigentliche Verarbeitung der Bilddaten erfolgt jedoch auch nach dem Laden der Modelle ausschließlich lokal in Ihrem Browser; es findet zu keinem Zeitpunkt ein Upload von privatem Bildmaterial auf externe Server statt.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Die Nutzung dieser KI-gestützten Funktionen erfolgt auf Grundlage Ihrer Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit für die Zukunft widerrufen.
          </p>
          <p className="text-zinc-600 leading-relaxed mb-4">
            Wenn Sie auf unserer Website mit Elementen interagieren, in denen künstliche Intelligenz zum Einsatz kommt, werden Ihre Eingaben inklusive Metadaten verarbeitet, um die gewünschte Analyse oder Reaktion lokal zu generieren. Wir haben ein berechtigtes Interesse daran (Art. 6 Abs. 1 lit. f DSGVO), moderne und datenschutzfreundliche Technologien einzusetzen, die eine lokale Verarbeitung ermöglichen.
          </p>
        </div>
      </main>
    </div>
  );
}
