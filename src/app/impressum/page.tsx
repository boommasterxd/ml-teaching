import ImprintPage from '@/screens/ImprintPage';
import { pageMetadata } from '@/lib/site';
export const dynamic = 'error';
export const metadata = pageMetadata(
  'Impressum',
  'Angaben zum Betreiber und Kontaktmöglichkeiten für das private Lernprojekt ML Teaching.',
  '/impressum',
);
export default function Page() {
  return <ImprintPage />;
}
