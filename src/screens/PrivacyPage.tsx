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
        <h1
          id="privacy-title"
          className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4"
        >
          Datenschutzerklärung
        </h1>
        {PrivacyOverview}
        {PrivacyHosting}
        {PrivacyInformation}
        {PrivacyCollection}
      </PageContent>
    </PageLayout>
  );
}
