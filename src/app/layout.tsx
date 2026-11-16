import type { Metadata, Viewport } from 'next';
import { ViewTransition } from 'react';
import Footer from '@/components/Footer';
import SiteHeader from '@/components/SiteHeader';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';
import { geist, spaceGrotesk } from '@/lib/fonts';
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
  icons: { icon: '/favicon.svg', apple: '/apple-icon.png' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#151417' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className={[geist.variable, spaceGrotesk.variable, 'app-body'].join(' ')}>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Zum Inhalt springen
          </a>
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="app-main">
            <ViewTransition name="page-content">{children}</ViewTransition>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
