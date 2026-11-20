import PageLayout from '../components/PageLayout';
import PageContent from '../components/PageContent';

export default function ImprintPage() {
  return (
    <PageLayout page="imprint">
      <PageContent labelledBy="imprint-title" title="Impressum">
        <h2>Adresse</h2>
        <div className="legal-contact-details">
          <p>Yannick Schäfer</p>
          <p>Am Mäuerchen 12</p>
          <p>67591 Mölsheim</p>
        </div>

        <h2>Kontakt</h2>
        <div className="legal-contact-details">
          <p>
            <span>Telefon:</span> <a href="tel:+4915757934851">01575 7934851</a>
          </p>
          <p>
            <span>E-Mail:</span>{' '}
            <a href="mailto:yannickschaefer@boomapps.de">yannickschaefer@boomapps.de</a>
          </p>
        </div>
        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </PageContent>
    </PageLayout>
  );
}
