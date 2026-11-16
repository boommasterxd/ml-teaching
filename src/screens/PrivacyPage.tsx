import { PrivacyOverview } from '@/content/privacy/PrivacyOverview';
import { PrivacyHosting } from '@/content/privacy/PrivacyHosting';
import { PrivacyInformation } from '@/content/privacy/PrivacyInformation';
import { PrivacyCollection } from '@/content/privacy/PrivacyCollection';
import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import PageContent from '../components/PageContent';

export default function PrivacyPage() {
  return (
    <PageLayout>
      <PageHeader title="Datenschutzerklärung" />
      <PageContent labelledBy="privacy-title">
        <h1 id="privacy-title">Datenschutzerklärung</h1>
        {PrivacyOverview}
        {PrivacyHosting}
        {PrivacyInformation}
        {PrivacyCollection}
      </PageContent>
    </PageLayout>
  );
}
