/**
 * Express server configuration for the Teachable Machine application.
 * Handles security headers, rate limiting, and serves the application in both
 * development (via Vite middleware) and production modes.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import compression from 'compression';

const rootDir = process.cwd();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(compression());

// Trust the first proxy (required for Traefik / reverse proxy setups)
app.set('trust proxy', 1);

// Security headers — CSP enabled in production (with TF.js rules), disabled in dev
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
      "img-src": ["'self'", "data:", "https:"],
      // Allow connections to Google for AI models (MobileNet) and assets
      "connect-src": ["'self'", "https://*.google.com", "https://*.googleapis.com", "https://tfhub.dev", "https://*.gstatic.com", "https://www.kaggle.com"]
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' }
});
app.use(limiter);

/** Configures either Vite dev middleware or static file serving and starts listening. */
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development: Vite middleware (SPA mode)
    console.log('🛠️ Starting Vite Middleware for development...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve pre-built static files
    const distPath = path.resolve(rootDir, 'dist');
    console.log(`📦 Production mode active. Serving from: ${distPath}`);

    const expressStaticGzip = (await import('express-static-gzip')).default;

    // @ts-ignore — types incomplete for express-static-gzip
    app.use(expressStaticGzip(distPath, {
      enableBrotli: true,
      orderPreference: ['br', 'gz'],
      serveStatic: {
        maxAge: '1y',
        index: false,
        immutable: true
      }
    }));

    // SPA fallback with no-cache headers for index.html
    app.get('*path', (req, res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${port} (${process.env.NODE_ENV || 'development'})`);
  });
}

setupServer();
