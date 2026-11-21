import { Html, Head, Main, NextScript } from 'next/document';
import { errorRecoveryStylesheetHref } from '@/lib/history-transition';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';

export default function ErrorDocument() {
  return (
    <Html lang="de" suppressHydrationWarning>
      <Head>
        <link
          rel="stylesheet"
          href={errorRecoveryStylesheetHref}
          media="(prefers-reduced-motion: no-preference)"
        />
        <link
          id="site-favicon"
          rel="icon"
          href="/favicon.svg"
          type="image/svg+xml"
          suppressHydrationWarning
        />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
