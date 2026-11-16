import { Html, Head, Main, NextScript } from 'next/document';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';

export default function ErrorDocument() {
  return (
    <Html lang="de" suppressHydrationWarning>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
