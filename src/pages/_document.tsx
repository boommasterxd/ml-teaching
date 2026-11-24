import { Html, Head, Main, NextScript } from 'next/document';
import { ErrorRecoveryStyle } from '@/components/ErrorRecoveryTransitionStyles';
import { ERROR_RECOVERY_SPECULATION_RULES } from '@/lib/error-recovery-speculation';
import { supportedColorSchemes, THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';

export default function ErrorDocument() {
  return (
    <Html lang="de" suppressHydrationWarning>
      <Head>
        <meta name="color-scheme" content={supportedColorSchemes} />
        <ErrorRecoveryStyle enabled />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <script
          id="error-recovery-speculation"
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: ERROR_RECOVERY_SPECULATION_RULES }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
