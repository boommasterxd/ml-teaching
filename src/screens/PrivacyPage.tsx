import { PrivacyOverview } from '@/content/privacy/PrivacyOverview';
import { PrivacyHosting } from '@/content/privacy/PrivacyHosting';
import { PrivacyInformation } from '@/content/privacy/PrivacyInformation';
import { PrivacyCollection } from '@/content/privacy/PrivacyCollection';
import PageLayout from '../components/PageLayout';
import PageContent from '../components/PageContent';

export default function PrivacyPage() {
  return (
    <PageLayout page="privacy">
      <PageContent id="privacy-document" labelledBy="privacy-title" title="Datenschutzerklärung">
        {PrivacyOverview}
        {PrivacyHosting}
        {PrivacyInformation}
        {PrivacyCollection}
      </PageContent>
    </PageLayout>
  );
}
