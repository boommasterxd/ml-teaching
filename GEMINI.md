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
Die Anwendung folgt einer modernen Single-Page-Application (SPA) Struktur:
- `src/main.tsx`: Einstiegspunkt der Anwendung.
- `src/App.tsx`: Zentrales Routing mit `react-router-dom`.
- `src/pages/`: Enthält die Hauptkomponenten der Anwendung:
    - `LandingPage.tsx`: Einführung in ML mit interaktiven Visualisierungen.
    - `TrainingPage.tsx`: Der eigentliche Workflow zum Sammeln von Daten und Trainieren des Modells.
    - `ImprintPage.tsx` & `PrivacyPage.tsx`: Rechtliche Informationen.
- `src/lib/utils.ts`: Gemeinsam genutzte Hilfsfunktionen (z.B. für Tailwind-Klassenzusammenführung).

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

## Konventionen und Best Practices
- **Styling:** Verwendung von Tailwind CSS 4 Hilfsklassen direkt in den Komponenten.
- **Typisierung:** Konsequente Nutzung von TypeScript-Interfaces für ML-Datenstrukturen (Klassen, Bilder, Vorhersagen).
- **ML-Workflow:** Alle Inferenz- und Trainingsschritte erfolgen clientseitig. MobileNet dient als "Auge" (Feature Extractor), während KNN die Klassifizierung übernimmt.
- **Komponenten:** Funktionale React-Komponenten mit Hooks (`useState`, `useEffect`, `useRef`).
- **Icons:** Verwendung von Lucide-React Icons für eine konsistente UI.

## Wichtige Dateien
- `package.json`: Projekt-Abhängigkeiten und Skripte.
- `vite.config.ts`: Vite-Konfiguration inklusive Tailwind-Plugin und Alias-Definitionen.
- `tsconfig.json`: TypeScript-Compiler-Konfiguration.
- `metadata.json`: Metadaten für die Plattform-Integration (z.B. Kameraberechtigungen).
- `public/`: Statische Assets wie Logos.
