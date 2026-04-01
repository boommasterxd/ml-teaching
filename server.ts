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
import { SERVER } from './server.constants.js';

const REQUIRED_ENV = ['NODE_ENV'] as const;
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('FEHLER: Folgende Umgebungsvariablen fehlen:');
  missingEnv.forEach((key) => console.error(`  - ${key}`));
  process.exit(1);
}

const rootDir = process.cwd();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(compression());
app.use(express.json({ limit: '500kb' }));

// Trust the first proxy (required for Traefik / reverse proxy setups)
app.set('trust proxy', 1);

// Security headers — CSP enabled in production (with TF.js rules), disabled in dev
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      // unsafe-inline + wasm-unsafe-eval required for TensorFlow.js
      "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
      "img-src": ["'self'", "data:", "https:"],
      // Scoped to specific Google services needed for MobileNet model downloads
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: SERVER.HSTS_MAX_AGE,
    includeSubDomains: true,
  },
}));

// Rate limiting — applied to /api/ routes only
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  message: { error: 'Zu viele Anfragen von dieser IP, bitte versuche es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true, xForwardedForHeader: true },
});
app.use('/api/', globalLimiter);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

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

    const expressStaticGzip = (
      await import('express-static-gzip') as unknown as {
        default: (root: string, options: unknown) => express.RequestHandler;
      }
    ).default;

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
