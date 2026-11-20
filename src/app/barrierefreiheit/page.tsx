import AccessibilityPage from '@/screens/AccessibilityPage';
import { pageMetadata } from '@/lib/site';
export const dynamic = 'error';
export const metadata = pageMetadata(
  'Barrierefreiheit',
  'Umgesetzte Maßnahmen, bekannte Einschränkungen und Feedbackkontakt zur Barrierefreiheit von ML Teaching.',
  '/barrierefreiheit',
);
export default function Page() {
  return <AccessibilityPage />;
}
