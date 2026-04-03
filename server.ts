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

/**
 * Validates that all mandatory environment variables are present at startup.
 * Follows a crash-fast strategy: missing variables indicate a misconfigured
 * deployment (e.g. missing `.env` in a container) that cannot be recovered from
 * at runtime. Exiting immediately surfaces the problem early rather than allowing
 * the server to run silently in a broken state.
 */
const REQUIRED_ENV = ['NODE_ENV'] as const;
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('ERROR: The following environment variables are missing:');
  missingEnv.forEach((key) => console.error(`  - ${key}`));
  process.exit(1);
}

const rootDir = process.cwd();

const app = express();
app.disable('x-powered-by');
const port = Number(process.env.PORT) || 3000;

app.use(compression());
app.use(express.json({ limit: '500kb' }));

// Trust the first proxy (required for Traefik / reverse proxy setups)
app.set('trust proxy', 1);

/**
 * Configures HTTP security headers via Helmet.
 *
 * Content Security Policy (CSP):
 * - Production: enforced (hard block). Allows `wasm-unsafe-eval` in `script-src`
 *   because TensorFlow.js compiles a WASM module at runtime even when WebGL is
 *   the primary backend. `connect-src` is scoped to Google Storage, gstatic,
 *   TensorFlow Hub, and Kaggle — all required for MobileNet model downloads.
 * - Development: report-only mode (violations are logged, not blocked). Vite
 *   violations (inline scripts, HMR WebSocket) are expected noise in this mode.
 *
 * Additional headers:
 * - `Cross-Origin-Embedder-Policy` is disabled because TF.js loads model weights
 *   cross-origin (Google Storage, TF Hub), which COEP would block.
 * - `Cross-Origin-Opener-Policy` is set to `same-origin` to isolate the browsing context.
 * - `X-Frame-Options` is set to `DENY` to prevent clickjacking.
 * - HSTS is enabled with a 1-year max-age, subdomain inclusion, and preload.
 */
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      // Deny-by-default: every resource type not listed below is blocked
      "default-src": ["'none'"],
      "script-src": ["'self'", "'wasm-unsafe-eval'"],
      "style-src": ["'self'"],
      // data: is required for camera captures (canvas.toDataURL)
      "img-src": ["'self'", "data:"],
      // Scoped to Google Storage, TensorFlow Hub, and Kaggle for MobileNet model downloads
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      // TensorFlow.js spawns Web Workers via blob: URLs
      "worker-src": ["blob:"],
      // WebRTC camera stream
      "media-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      // Override Helmet's default font-src (which includes https:) to block external fonts
      "font-src": ["'self'"],
      "upgrade-insecure-requests": [],
    }
  } : {
    reportOnly: true,
    directives: {
      "default-src": ["'none'"],
      "script-src": ["'self'", "'wasm-unsafe-eval'"],
      "style-src": ["'self'"],
      // data: is required for camera captures (canvas.toDataURL)
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      "worker-src": ["blob:"],
      "media-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      // Override Helmet's default font-src (which includes https:) to block external fonts
      "font-src": ["'self'"],
      "upgrade-insecure-requests": [],
    },
  },
  // COEP is disabled because TensorFlow.js loads model weights cross-origin (Google Storage, TF Hub)
  crossOriginEmbedderPolicy: false,
  // COOP: isolates the browsing context to prevent cross-origin window access
  crossOriginOpenerPolicy: { policy: 'same-origin' },
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

/**
 * Global rate limiter applied to all incoming requests.
 * Limits each IP address to `SERVER.RATE_LIMIT_MAX_REQUESTS` requests within
 * a sliding window of `SERVER.RATE_LIMIT_WINDOW_MS` milliseconds (default: 300
 * requests per 15-minute window). Exceeding the limit returns a 429 response
 * with a German-language error message for end users. Standard `RateLimit-*`
 * headers are sent; legacy `X-RateLimit-*` headers are suppressed.
 * Proxy trust validation is enabled to correctly identify client IPs behind
 * Traefik or other reverse proxies.
 */
const globalLimiter = rateLimit({
  windowMs: SERVER.RATE_LIMIT_WINDOW_MS,
  max: SERVER.RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Zu viele Anfragen von dieser IP, bitte versuche es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true, xForwardedForHeader: true },
});
app.use(globalLimiter);

/**
 * Handles unhandled promise rejections by logging and terminating the process.
 *
 * Deliberately exits with code 1 (crash-fast strategy): an unhandled rejection
 * signals an unexpected state that cannot be safely recovered from. Keeping the
 * server alive in that state risks silent data corruption or inconsistent
 * behaviour, so a clean exit and a process-supervisor restart is preferable.
 */
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
