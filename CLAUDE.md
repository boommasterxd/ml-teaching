# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Eine interaktive Web-App, die Besuchern erklärt, wie Machine Learning (Transfer Learning mit MobileNet + KNN) funktioniert. Nutzer können direkt im Browser ein ML-Modell trainieren – vollständig clientseitig, ohne Daten an einen Server zu senden.

## Wichtige Befehle

```bash
npm run dev          # Entwicklungsserver (Port 3000, TSX + Vite HMR)
npm run build        # Produktions-Build (Client + Server)
npm run build:client # Nur Vite-Build
npm run build:server # Nur TypeScript-Server-Build (→ dist-server/)
npm run lint         # TypeScript-Typcheck ohne Emission
npm run clean        # dist/ und dist-server/ löschen
```

Es gibt keine automatisierten Tests (kein Test-Runner konfiguriert).

## Architektur

**Full-Stack SPA** mit Express-Server und React-Frontend:

- **`server.ts`** — Express-Server mit Helmet CSP, Rate Limiting und Compression. Im Dev-Modus wird Vite als Middleware eingebunden. Im Produktionsmodus werden pre-komprimierte Dateien aus `dist/` mit 1-Jahr-Cache für Assets ausgeliefert.
- **`src/App.tsx`** — React-Router-Setup mit lazy-geladenen Seiten (Code-Splitting pro Route).
- **`src/pages/TrainingPage.tsx`** — Kernseite der App: Consent-Dialog → MobileNet-/KNN-Laden → Kamera/Upload-Erfassung → Training → Live-Klassifizierung. Die gesamte ML-Logik läuft hier client-seitig mit TensorFlow.js.
- **`src/pages/LandingPage.tsx`** — Hero-Seite mit interaktiver Neural-Network-Visualisierung.
- **`src/hooks/`** — Hooks für ML-Pipeline, Kamera, Modals und Accessibility.
- **`src/lib/utils.ts`** — `cn()` Utility (clsx + tailwind-merge) für bedingte Klassen.
- **`src/constants.ts`** — Alle Magic Numbers zentral: `ML`, `CAMERA`, `ANIMATION`, `MODEL_LOAD_RETRY`, `PREDICTION`.

**Routen:**
- `/` → `LandingPage`
- `/lernen` → `TrainingPage`
- `/impressum`, `/datenschutz`, `/barrierefreiheit` → statische Seiten
- `*` → `NotFoundPage`

`App.tsx` umschließt den gesamten Router mit `ErrorBoundary` (React Error Boundary als letzter Fangpunkt für unbehandelte Render-Fehler).

**ML-Pipeline in `TrainingPage.tsx`** (Hook-Komposition):
- `useModelLoader` — lädt MobileNet + KNN-Classifier mit Retry-Logik
- `useCameraStream` — WebRTC-Stream, front/back-Kamera-Toggle
- `useImageFeatureExtraction` — MobileNet-Feature-Vektor aus Video-/Bild-Frame (224×224 Canvas)
- `useClassManagement` — CRUD für `MLClass[]`-State mit `invalidateModel`-Callback
- `useModelTraining` — KNN-Training auf Feature-Vektoren
- `usePredictionLoop` — 15 FPS Inferenz-Schleife
- `useConsentFlow` / `useModalState` — Modal-Sequenz (Datenschutz → Kamera-Consent → Laden)
- `useAppError` — typisiertes Fehler-State-Management mit `AppError` (`category` + `message`); ersetzt einfaches `useState<string | null>`
- `useNeuralNetAnimation` — Animations-Loop für die Neural-Network-Visualisierung auf der `LandingPage`

**Modal-Pattern:** Alle Modals nutzen `Dialog.tsx` als Basis (Focus-Trap + Scroll-Lock + ARIA). Modals in `TrainingPage.tsx` werden über eine diskriminierte Union in `useModalState` verwaltet (`ModalState` = `'none' | 'imagePreview' | 'clearConfirm' | 'clearClass' | 'removeClass'`).

**Typen:** `src/types/ml.ts` definiert `MLImage` (id, dataUrl, featureArray), `MLClass`, `Prediction`. `src/types/errors.ts` definiert `AppError` mit `ErrorCategory` (`'model' | 'camera' | 'training' | 'prediction' | 'validation'`).

**Build-Output:**
- `dist/` — Client-Build (Vite), mit separaten Chunks für React, TensorFlow, Framer Motion, Lucide
- `dist-server/` — Server-Build (tsc mit `tsconfig.server.json`, Module: NodeNext)

## Konfiguration

- **`vite.config.ts`**: Chunk-Splitting, Image-Optimierung (PNG/JPEG/WebP Quality 80), gzip- und brotli-Komprimierung.
- **`tsconfig.server.json`**: Erweitert `tsconfig.json`, setzt `module: NodeNext` und `outDir: dist-server`. Der Server verwendet ESM.
- **`.env.example`**: `PORT`, `NODE_ENV`, `DOMAIN_NAME` — werden im Server und im Dockerfile verwendet.
- **`server.ts` CSP**: `connect-src` erlaubt Google APIs und TensorFlow Hub (Modell-Downloads). `script-src` benötigt `unsafe-inline` und `wasm-unsafe-eval` für TensorFlow.js/WASM.

## Plattform-Integration

`metadata.json` im Root deklariert Kamera-Berechtigungen für die Claude.ai-Plattform (`requestFramePermissions: ["camera"]`). Bei Änderungen am Kamera-Zugriff diese Datei aktualisieren.

## Deployment

```bash
docker build -t teachable-machine .
docker run -p 3000:3000 --env-file .env teachable-machine
```

Das Dockerfile nutzt einen Multi-Stage Alpine-Build. Der Container läuft als `node`-User (non-root).

## Design

- Brand-Farbe: `#D51317` (Rot)
- Tailwind CSS 4 mit `@import "tailwindcss"` in `src/index.css`
- Klassen-Komposition immer über `cn()` aus `src/lib/utils.ts`
- Animationen mit Framer Motion

## Barrierefreiheit

WCAG 2.1 AA / BFSG-konform. Bei Modalen `useFocusTrap` verwenden. Skip-to-Content-Link ist in `index.html` vorhanden. Alle interaktiven Elemente benötigen ARIA-Labels.
