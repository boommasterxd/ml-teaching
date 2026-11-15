import type { AppProps } from 'next/app';
import '../index.css';

/** The native static 500 document shares the application's visual foundation. */
export default function ErrorApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
