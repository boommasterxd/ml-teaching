import type { Metadata } from 'next';
import NotFoundPage from '@/screens/NotFoundPage';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden',
  // The root metadata image is only for public content previews.
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default function NotFound() {
  return <NotFoundPage />;
}
