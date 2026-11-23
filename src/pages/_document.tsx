import { Html, Head, Main, NextScript } from 'next/document';
import { ErrorRecoveryStyle } from '@/components/ErrorRecoveryTransitionStyles';
import { supportedColorSchemes, THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';

const recoveryRules = JSON.stringify({
  prerender: [
    { where: { selector_matches: 'a[data-recovery-intent="home"]' }, eagerness: 'immediate' },
  ],
  prefetch: [
    { where: { selector_matches: 'a[data-recovery-intent="page"]' }, eagerness: 'immediate' },
  ],
});

export default function ErrorDocument() {
  return (
    <Html lang="de" suppressHydrationWarning>
      <Head>
        <meta name="color-scheme" content={supportedColorSchemes} />
        <ErrorRecoveryStyle enabled />
        <link
          id="site-favicon"
          rel="icon"
          href="/favicon.svg"
          type="image/svg+xml"
          suppressHydrationWarning
        />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <script
          id="error-recovery-speculation"
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: recoveryRules }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
