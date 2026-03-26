/**
 * Imprint page containing legal contact and ownership information.
 */
import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import PageContent from '../components/PageContent';
import { usePageTitle } from '../hooks/usePageTitle';

/** Renders the legal imprint with owner contact details. */
export default function ImprintPage() {
  usePageTitle('Impressum');

  return (
    <PageLayout>
      <PageHeader title="Impressum" />
      <PageContent labelledBy="imprint-title">
          <h1 id="imprint-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Impressum</h1>
          
          <div className="space-y-1 text-zinc-600 mb-8">
            <p className="font-semibold text-zinc-900 text-lg">Yannick Schäfer</p>
            <p>Am Mäuerchen 12</p>
            <p>67591 Mölsheim</p>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-10 mb-4 border-l-4 border-zinc-200 pl-4">Kontakt</h2>
          <div className="space-y-3 sm:space-y-2 text-zinc-600 mb-8">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-zinc-900 sm:w-20">Telefon:</span>
              <span>01575 7934851</span>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-zinc-900 sm:w-20">E-Mail:</span>
              <a href="mailto:yannickschaefer@boomapps.de" className="text-zinc-600 hover:text-zinc-900 underline transition-colors break-all sm:break-normal">yannickschaefer@boomapps.de</a>
            </p>
          </div>
      </PageContent>
    </PageLayout>
  );
}
