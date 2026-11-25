import localFont from 'next/font/local';

export const geist = localFont({
  src: '../app/fonts/geist-latin.woff2',
  variable: '--font-geist',
  display: 'optional',
  preload: false,
  weight: '100 900',
});
