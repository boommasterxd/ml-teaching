import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// ESM-kompatible Pfadauflösung
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();

const app = express();
const port = Number(process.env.PORT) || 3000;

/**
 * 1. Proxy-Trust (Essentiell für Traefik)
 */
app.set('trust proxy', 1);

/**
 * 2. Security Header mit Helmet
 * CSP ist in Produktion aktiv (mit TF.js Regeln), in Dev inaktiv.
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
  message: { error: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.' }
});
app.use(limiter);

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    /**
     * 4a. Development-Modus: Vite Middleware (SPA-Mode)
     */
    console.log('🛠️ Starte Vite Middleware für Entwicklung...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    /**
     * 4b. Produktions-Modus: 1:1 wie Kickbox-Projekt
     */
    const distPath = path.resolve(rootDir, 'dist');
    console.log(`📦 Produktions-Modus aktiv. Diene aus: ${distPath}`);

    // Statische Dateien mit aggressivem Caching (Vite Assets)
    app.use(express.static(distPath, {
      maxAge: '1y',
      index: false,
      immutable: true
    }));

    // SPA-Fallback mit exakt den gleichen Cache-Headern wie Kickbox
    app.get('*path', (req, res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server läuft auf http://0.0.0.0:${port} (${process.env.NODE_ENV || 'development'})`);
  });
}

setupServer();
