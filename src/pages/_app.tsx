import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { geist } from '@/lib/fonts';
import '../index.css';

/** The native static 500 document shares the application's visual foundation. */
export default function ErrorApp({ Component, pageProps }: AppProps) {
  return (
    <div className={[geist.variable, 'app-body'].join(' ')}>
      <ThemeProvider>
        <SiteHeader />
        <Component {...pageProps} />
        <Footer />
      </ThemeProvider>
    </div>
  );
}
