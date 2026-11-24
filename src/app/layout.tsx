import type { Metadata, Viewport } from 'next';
import { PageTransition } from '@/components/animate-ui/components/page-transition';
import ErrorRecoveryTransitionStyles from '@/components/ErrorRecoveryTransitionStyles';
import Footer from '@/components/Footer';
import SiteHeader from '@/components/SiteHeader';
import ToastHost from '@/components/ToastHost';
import TrainingEntryProvider from '@/components/training/TrainingEntryProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { supportedColorSchemes, THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';
import { geist } from '@/lib/fonts';
import { siteConfig } from '@/lib/site';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: '%s | ML Teaching',
  },
  applicationName: siteConfig.name,
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: supportedColorSchemes,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <ErrorRecoveryTransitionStyles />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className={[geist.variable, 'app-body'].join(' ')}>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Zum Inhalt springen
          </a>
          <TrainingEntryProvider>
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="app-main">
              <PageTransition effect="flow">{children}</PageTransition>
            </main>
            <Footer />
          </TrainingEntryProvider>
          <ToastHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
