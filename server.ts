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
app.use(express.json({ limit: '500kb', type: ['application/json', 'application/csp-report'] }));

// Trust the first proxy (required for Traefik / reverse proxy setups)
app.set('trust proxy', 1);

/**
 * Configures HTTP security headers via Helmet.
 *
 * Content Security Policy (CSP):
 * - Production: enforced (hard block). `connect-src` is scoped to Google Storage,
 *   gstatic, TensorFlow Hub, and Kaggle — all required for MobileNet model downloads.
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
      // wasm-unsafe-eval is intentionally omitted: the app forces the WebGL backend of TensorFlow.js,
      // not the WASM backend. Omitting it reduces the CSP attack surface.
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      // data: is required for camera captures (canvas.toDataURL)
      "img-src": ["'self'", "data:"],
      // Scoped to Google Storage, TensorFlow Hub, and Kaggle for MobileNet model downloads
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      // TensorFlow.js spawns Web Workers via blob: URLs
      "worker-src": ["blob:"],
      // Camera uses srcObject (not URL-based src) — media-src does not apply to WebRTC
      "media-src": ["'none'"],
      "object-src": ["'none'"],
      // No <base> tag in the app — 'none' prevents base-tag injection via XSS
      "base-uri": ["'none'"],
      // No form submissions in the app
      "form-action": ["'none'"],
      "frame-ancestors": ["'none'"],
      // Override Helmet's default font-src (which includes https:) to block external fonts
      "font-src": ["'self'"],
      // Explicitly block inline event handlers (onclick=, onerror=, …)
      "script-src-attr": ["'none'"],
      // Explicitly block inline style attributes (style="…")
      "style-src-attr": ["'none'"],
      "upgrade-insecure-requests": [],
      "report-uri": [SERVER.CSP_REPORT_PATH],
    }
  } : {
    reportOnly: true,
    directives: {
      "default-src": ["'none'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      // data: is required for camera captures (canvas.toDataURL)
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
      "worker-src": ["blob:"],
      "media-src": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'none'"],
      "form-action": ["'none'"],
      "frame-ancestors": ["'none'"],
      "font-src": ["'self'"],
      "script-src-attr": ["'none'"],
      "style-src-attr": ["'none'"],
      "upgrade-insecure-requests": [],
      "report-uri": [SERVER.CSP_REPORT_PATH],
    },
  },
  // COEP is disabled because TensorFlow.js loads model weights cross-origin (Google Storage, TF Hub)
  crossOriginEmbedderPolicy: false,
  // COOP: isolates the browsing context to prevent cross-origin window access
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: {
    maxAge: SERVER.HSTS_MAX_AGE,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  xXssProtection: false,
}));

/**
 * Sets the `Permissions-Policy` response header to restrict browser feature access.
 * Only `camera` is allowed (required for WebRTC capture); all other sensitive APIs
 * are explicitly disabled.
 */
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(), ' +
    'usb=(), bluetooth=(), serial=(), display-capture=(), ' +
    'xr-spatial-tracking=(), accelerometer=(), gyroscope=(), ' +
    'magnetometer=(), ambient-light-sensor=(), battery=(), ' +
    'autoplay=(), fullscreen=(), web-share=(), midi=(), ' +
    'picture-in-picture=(), gamepad=(), publickey-credentials-get=(), ' +
    'screen-wake-lock=(), idle-detection=(), storage-access=(), ' +
    'window-management=(), local-fonts=(), compute-pressure=(), ' +
    'speaker-selection=(), document-domain=(), encrypted-media=(), ' +
    'browsing-topics=(), attribution-reporting=()',
  );
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
 * Receives Content Security Policy violation reports from browsers and logs
 * them to stdout (visible in Docker container logs via `docker logs`).
 *
 * Security notes:
 * - Own rate limiter (50 req/15min per IP) to prevent abuse independent of the global limiter.
 * - Inline body parser with 10kb limit (overrides the global 500kb limit for this route).
 * - Only pre-defined fields are extracted and logged — no blind pass-through of the full body.
 * - Returns 204 No Content with no response body to avoid info leakage.
 *
 * No auth or CSRF protection is needed: browsers send CSP reports as anonymous
 * fire-and-forget POSTs with no cookies or session context. The endpoint only
 * logs — it never mutates state. A CSRF token cannot be used here because
 * browsers do not include custom tokens in CSP reports.
 */
const cspReportLimiter = rateLimit({
  windowMs: SERVER.CSP_REPORT_RATE_LIMIT_WINDOW_MS,
  max: SERVER.CSP_REPORT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true, xForwardedForHeader: true },
});

app.post(
  SERVER.CSP_REPORT_PATH,
  cspReportLimiter,
  express.json({ limit: SERVER.CSP_REPORT_MAX_BODY_SIZE, type: ['application/csp-report', 'application/json'] }),
  (req, res) => {
    const report = req.body?.['csp-report'] ?? req.body;
    if (report && typeof report === 'object') {
      console.warn('[CSP-Violation]', JSON.stringify({
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        documentUri: report['document-uri'],
        timestamp: new Date().toISOString(),
      }));
    }
    res.status(204).end();
  }
);

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
