import type { Metadata, Viewport } from 'next';
import { ViewTransition } from 'react';
import Footer from '@/components/Footer';
import { siteConfig } from '@/lib/site';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'ML Teaching – KI-Bilderkennung im Browser lernen',
    template: '%s | ML Teaching',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  icons: { icon: '/favicon.svg', apple: '/brain-192.webp' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#18181b' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 antialiased">
        <a href="#main-content" className="skip-link">
          Zum Inhalt springen
        </a>
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 outline-none">
          <ViewTransition name="page-content">{children}</ViewTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
