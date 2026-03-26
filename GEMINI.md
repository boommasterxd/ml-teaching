# GEMINI.md - The Teachable Machine

## Projekt-Übersicht
**The Teachable Machine** ist ein interaktives Bildungsprojekt, das Nutzern die Grundlagen des maschinellen Lernens spielerisch näherbringt. Es ermöglicht das Trainieren und Testen von Bilderkennungsmodellen direkt im Webbrowser, ohne dass Daten an externe Server übertragen werden. Das Projekt ist inspiriert von Googles Teachable Machine.

### Haupttechnologien
- **Frontend-Framework:** [React 19](https://react.dev/)
- **Build-Tool:** [Vite 8](https://vitejs.dev/)
- **Programmiersprache:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **KI/ML:** [TensorFlow.js](https://www.tensorflow.org/js) (nutzt MobileNet v2 zur Merkmalsextraktion und einen KNN-Klassifikator)
- **Animationen:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Architektur
Die Anwendung ist eine **Full-Stack SPA** mit Express-Server und React-Frontend:

- `server.ts`: Express-Server mit Helmet CSP, Rate Limiting und Compression. Im Dev-Modus wird Vite als Middleware eingebunden. Im Produktionsmodus werden pre-komprimierte Dateien aus `dist/` mit 1-Jahr-Cache für Assets ausgeliefert.
- `src/main.tsx`: Einstiegspunkt der Anwendung.
- `src/App.tsx`: Zentrales Routing mit `react-router-dom`, Seiten werden lazy geladen (Code-Splitting pro Route).
- `src/pages/`: Enthält die Hauptkomponenten der Anwendung:
    - `LandingPage.tsx`: Einführung in ML mit interaktiven Visualisierungen.
    - `TrainingPage.tsx`: Kernseite — Consent-Dialog → MobileNet-/KNN-Laden → Kamera/Upload-Erfassung → Training → Live-Klassifizierung. Gesamte ML-Logik läuft clientseitig.
    - `ImprintPage.tsx`, `PrivacyPage.tsx`, `AccessibilityPage.tsx`: Rechtliche Informationen und Barrierefreiheitserklärung.
- `src/hooks/`: Accessibility-Hooks: `useFocusTrap` (Modals), `useScrollLock` (Modal-Scroll).
- `src/lib/utils.ts`: `cn()` Utility (clsx + tailwind-merge) für bedingte Klassen.

**Build-Output:**
- `dist/` — Client-Build (Vite), mit separaten Chunks für React, TensorFlow, Framer Motion, Lucide
- `dist-server/` — Server-Build (tsc mit `tsconfig.server.json`, Module: NodeNext)

## Entwicklung und Build-Prozesse

### Wichtige Befehle
- **Abhängigkeiten installieren:** `npm install`
- **Entwicklungsserver starten:** `npm run dev` (erreichbar unter `http://localhost:3000`)
- **Produktions-Build erstellen:** `npm run build`
- **Typen prüfen:** `npm run lint`
- **Build-Ordner bereinigen:** `npm run clean`

### Umgebungskonfiguration
- Das Projekt läuft standardmäßig auf Port 3000.
- Der Host ist auf `0.0.0.0` gesetzt, um den Zugriff im lokalen Netzwerk (z.B. für Tests auf Mobilgeräten) zu ermöglichen.

## Konfiguration

- **`vite.config.ts`**: Chunk-Splitting, Image-Optimierung (PNG/JPEG/WebP Quality 80), gzip- und brotli-Komprimierung.
- **`tsconfig.server.json`**: Erweitert `tsconfig.json`, setzt `module: NodeNext` und `outDir: dist-server`. Der Server verwendet ESM.
- **`.env.example`**: `PORT`, `NODE_ENV`, `DOMAIN_NAME` — werden im Server und im Dockerfile verwendet.
- **`server.ts` CSP**: `connect-src` erlaubt Google APIs und TensorFlow Hub (Modell-Downloads). `script-src` benötigt `unsafe-inline` und `wasm-unsafe-eval` für TensorFlow.js/WASM.

## Deployment

```bash
docker build -t teachable-machine .
docker run -p 3000:3000 --env-file .env teachable-machine
```

Das Dockerfile nutzt einen Multi-Stage Alpine-Build. Der Container läuft als `node`-User (non-root).

## Konventionen und Best Practices
- **Styling:** Tailwind CSS 4 Klassen direkt in Komponenten. Klassen-Komposition immer über `cn()` aus `src/lib/utils.ts`. Brand-Farbe: `#D51317`.
- **Typisierung:** Konsequente Nutzung von TypeScript-Interfaces für ML-Datenstrukturen (Klassen, Bilder, Vorhersagen).
- **ML-Workflow:** Alle Inferenz- und Trainingsschritte erfolgen clientseitig. MobileNet dient als "Auge" (Feature Extractor), während KNN die Klassifizierung übernimmt.
- **Komponenten:** Funktionale React-Komponenten mit Hooks (`useState`, `useEffect`, `useRef`).
- **Icons:** Verwendung von Lucide-React Icons für eine konsistente UI.
- **Barrierefreiheit:** WCAG 2.1 AA / BFSG-konform. Bei Modalen `useFocusTrap` verwenden. Alle interaktiven Elemente benötigen ARIA-Labels.

## Wichtige Dateien
- `package.json`: Projekt-Abhängigkeiten und Skripte.
- `vite.config.ts`: Vite-Konfiguration inklusive Tailwind-Plugin, Chunk-Splitting und Komprimierung.
- `tsconfig.json` / `tsconfig.server.json`: TypeScript-Konfiguration für Client und Server.
- `metadata.json`: Deklariert Kamera-Berechtigungen für die Plattform-Integration (`requestFramePermissions: ["camera"]`).
- `public/`: Statische Assets wie Logos.
