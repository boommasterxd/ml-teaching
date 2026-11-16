import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import PageContent from '../components/PageContent';

export default function ImprintPage() {
  return (
    <PageLayout>
      <PageHeader title="Impressum" />
      <PageContent labelledBy="imprint-title">
        <h1 id="imprint-title">Impressum</h1>

        <div>
          <p>Yannick Schäfer</p>
          <p>Am Mäuerchen 12</p>
          <p>67591 Mölsheim</p>
        </div>

        <h2>Kontakt</h2>
        <div>
          <p>
            <span>Telefon:</span> <a href="tel:+4915757934851">01575 7934851</a>
          </p>
          <p>
            <span>E-Mail:</span>{' '}
            <a href="mailto:yannickschaefer@boomapps.de">yannickschaefer@boomapps.de</a>
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
