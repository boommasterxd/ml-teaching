import localFont from 'next/font/local';

export const geist = localFont({
  src: '../app/fonts/geist-latin.woff2',
  variable: '--font-geist',
  display: 'swap',
  weight: '400 700',
});

export const spaceGrotesk = localFont({
  src: '../app/fonts/space-grotesk-latin.woff2',
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: '400 700',
});
