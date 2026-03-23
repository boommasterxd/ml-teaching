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
const port = process.env.PORT || 3000;

/**
 * 1. Proxy-Trust (Essentiell für Traefik)
 * Traefik reicht die echte Besucher-IP im 'X-Forwarded-For' Header weiter.
 * Mit 'trust proxy' kann express-rate-limit die echte IP des Nutzers statt 
 * der internen Docker-IP von Traefik sehen.
 */
app.set('trust proxy', 1);

/**
 * 2. Security Header mit Helmet
 * Setzt wichtige Header wie XSS-Protection, HSTS und CSP.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // TF.js benötigt oft eval
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://*.google.com", "https://*.googleapis.com"]
    }
  }
}));

/**
 * 3. Rate Limiting (IP-basierter Brute-Force Schutz)
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 Anfragen pro Fenster
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.'
});
app.use(limiter);

const isProd = process.env.NODE_ENV === 'production';

async function setupServer() {
  if (!isProd) {
    /**
     * 4a. Development-Modus: Vite als Middleware
     */
    console.log('🛠️ Starte Vite Middleware für Entwicklung...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, 'index.html');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    /**
     * 4b. Produktions-Modus: Statische Dateien & SPA-Fallback
     */
    const distPath = path.resolve(rootDir, 'dist');
    console.log(`📦 Produktions-Modus aktiv. Diene aus: ${distPath}`);

    // Aggressives Caching für versionierte Assets (Vite Hashes)
    app.use('/assets', express.static(path.resolve(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true
    }));

    // Statische Dateien ohne Standard-Index-Handling (für SPA-Routing)
    app.use(express.static(distPath, { index: false }));

    // SPA-Fallback: Alle unbekannten Routen liefern die index.html
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'), {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server läuft auf http://0.0.0.0:${port} (${isProd ? 'Production' : 'Development'})`);
  });
}

setupServer();
