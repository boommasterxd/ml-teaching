/**
 * Express server configuration for the Teachable Machine application.
 * Handles security headers, rate limiting, and serves the application in both
 * development (via Vite middleware) and production modes.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// ESM-compatible path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();

const app = express();
const port = Number(process.env.PORT) || 3000;

/**
 * 1. Proxy Trust (Essential for Traefik)
 */
app.set('trust proxy', 1);

/**
 * 2. Security Headers with Helmet
 * CSP is active in production (with TF.js rules), inactive in dev.
 */
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://*.google.com", "https://*.googleapis.com"]
    }
  } : false,
  crossOriginEmbedderPolicy: false,
}));

/**
 * 3. Rate Limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' }
});
app.use(limiter);

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    /**
     * 4a. Development Mode: Vite Middleware (SPA Mode)
     */
    console.log('🛠️ Starting Vite Middleware for development...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    /**
     * 4b. Production Mode: Serving the build output
     */
    const distPath = path.resolve(rootDir, 'dist');
    console.log(`📦 Production mode active. Serving from: ${distPath}`);

    // Static files with aggressive caching (Vite Assets)
    app.use(express.static(distPath, {
      maxAge: '1y',
      index: false,
      immutable: true
    }));

    // SPA Fallback with cache-control headers
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
