const config = {
  routes: ['/', '/lernen', '/impressum', '/datenschutz', '/barrierefreiheit'],
  errorRoutes: ['/404', '/500'],
  browserMaxAgeSeconds: 300,
  policies: {
    base: {
      'default-src': ["'none'"],
      'script-src': ["'strict-dynamic'"],
      'script-src-attr': ["'none'"],
      'style-src': ["'self'"],
      'style-src-attr': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'none'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'font-src': ["'self'"],
      'connect-src': [
        "'self'",
        'https://storage.googleapis.com',
        'https://www.gstatic.com',
        'https://tfhub.dev',
        'https://www.kaggle.com',
      ],
      'frame-src': ["'none'"],
      'media-src': ["'self'", 'blob:'],
      'worker-src': ["'none'"],
      'manifest-src': ["'self'"],
    },
    ssg: {},
    ssr: {},
  },
};

export default config;
