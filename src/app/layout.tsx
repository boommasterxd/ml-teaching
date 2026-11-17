import type { Metadata, Viewport } from 'next';
import { PageTransition } from '@/components/animate-ui/components/page-transition';
import Footer from '@/components/Footer';
import SiteHeader from '@/components/SiteHeader';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';
import { geist } from '@/lib/fonts';
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
  icons: { apple: '/apple-icon.png' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link
          id="site-favicon"
          rel="icon"
          href="/favicon.svg"
          type="image/svg+xml"
          suppressHydrationWarning
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className={[geist.variable, 'app-body'].join(' ')}>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Zum Inhalt springen
          </a>
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="app-main">
            <PageTransition effect="flow">{children}</PageTransition>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
