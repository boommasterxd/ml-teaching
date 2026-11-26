import PrivacyPage from '@/screens/PrivacyPage';
import { pageMetadata } from '@/lib/site';
export const dynamic = 'error';
export const metadata = pageMetadata(
  'Datenschutz',
  'Informationen zu Hosting, Modell-Download, Einwilligung und lokaler Bildverarbeitung bei ML Teaching sowie zu Ihren Datenschutzrechten.',
  '/datenschutz',
);
export default function Page() {
  return <PrivacyPage />;
}
