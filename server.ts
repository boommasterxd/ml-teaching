/**
 * server.ts
 *
 * Express server for the Teachable Machine application. Configures security
 * headers (Helmet CSP), rate limiting, gzip/brotli compression, and serves
 * the SPA either via Vite dev middleware or pre-built static files in production.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import compression from 'compression';
import { SERVER } from './server.constants.js';

// Fail fast if mandatory environment variables are absent to prevent
// silent misconfiguration in deployed containers.
const REQUIRED_ENV = ['NODE_ENV'] as const;
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('ERROR: The following environment variables are missing:');
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

// Security headers — CSP enforced in production (with TF.js rules), report-only in dev
// wasm-unsafe-eval is required: TF.js compiles a WASM module even when WebGL is the primary backend
// Dev note: Vite-related violations (inline scripts, HMR websocket) are expected noise in report-only mode
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'wasm-unsafe-eval'"],
      "img-src": ["'self'", "data:", "https:"],
      // Scoped to Google Storage, TensorFlow Hub, and Kaggle for MobileNet model downloads
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    }
  } : {
    reportOnly: true,
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'wasm-unsafe-eval'"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    },
  },
  // COEP is disabled because TensorFlow.js loads model weights cross-origin (Google Storage, TF Hub)
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: SERVER.HSTS_MAX_AGE,
    includeSubDomains: true,
    preload: true,
  },
}));

/**
 * Sets the `Permissions-Policy` response header to restrict browser feature access.
 * Only `camera` is allowed (required for WebRTC capture); all other sensitive APIs
 * (microphone, geolocation, payment) are explicitly disabled.
 */
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  next();
});

// Rate limiting — applied to /api/ routes only.
// Window: 15 minutes, ceiling: 1 500 requests per IP per window.
const globalLimiter = rateLimit({
  windowMs: SERVER.RATE_LIMIT_WINDOW_MS,
  max: SERVER.RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Zu viele Anfragen von dieser IP, bitte versuche es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true, xForwardedForHeader: true },
});
app.use(globalLimiter);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

/**
 * Bootstraps the Express server.
 *
 * In development mode, attaches Vite as middleware so HMR and on-demand
 * compilation work without a separate build step. In production, serves
 * pre-compressed static files from `dist/` with long-lived cache headers
 * and an SPA fallback for client-side routing.
 *
 * Binds to `0.0.0.0` so the server is reachable inside Docker containers.
 */
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
    app.get('*path', (_req, res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler — must be registered after all routes
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${port} (${process.env.NODE_ENV || 'development'})`);
  });
}

setupServer();
