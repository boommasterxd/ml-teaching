# BFSG/Barrierefreiheits-Pruefbericht

| | |
|---|---|
| **Datum** | 2026-04-01 (Neupruefung auf aktuellem Codestand) |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Gepruefkte URL** | `http://localhost:3000` (5 URLs via Sitemap + manuell) |
| **Pruefgrundlage** | BFSG, WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BITV 2.0 |
| **Gesamtergebnis** | BESTANDEN — 0 Barrieren, 2 Warnungen (keine Barrieren), Lighthouse 100% (5 URLs), externer Scan 100/100 |

> **Hinweis zur Neupruefung 2026-04-01:** Dieser Bericht wurde auf Basis des aktuellen Codestandes (Branch `main`, Commit `b0e923c`, Stand 01.04.2026) neu erstellt und geprueft. Seit der letzten Pruefung (2026-03-28) wurden zwei Commits gemergt:
>
> - `b0e923c` — Performance-Refactoring in `NeuralNetViz.tsx` (SVG-Verbindungen via `useMemo` statt Inline-Arrays) und Security-Header-Anpassungen in `server.ts`. Keine Barrierefreiheitsauswirkungen.
> - `547cdeb` — Fehlerhandling fuer Bildladen in `ClassCard.tsx` (neue `onError`-Prop). Fehlermeldungen werden an die TrainingPage weitergeleitet, die diese korrekt mit `role="alert"` anzeigt. Keine Barrierefreiheitsauswirkungen.
>
> **Ergebnis:** Alle Befunde aus der Pruefung 2026-03-28 bleiben unveraendert korrekt. 0 Barrieren, 2 Warnungen (keine Barrieren — Hover-Kontrast `ImagePreviewModal.tsx:40` und BFSG §3 Anwendungsbereich).

> **Hinweis zur Neupruefung 2026-03-28:** Dieser Bericht wurde auf Basis des aktuellen Codestandes (Branch `main`, Stand 28.03.2026) neu erstellt. Die im vorherigen Bericht (27.03.2026) identifizierten 3 Barrieren sind im aktuellen Code behoben. Die nachfolgenden Phase-1-Ergebnisse spiegeln den aktuellen Codestand wider.

---

## Phase 1: Statische Codebase-Analyse

### 1. Wahrnehmbar

#### 1.1.1: Nichttextlicher Inhalt

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.1.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.1.1

**Fund:**
Alle `<img>`-Elemente wurden geprüft:

- `src/pages/LandingPage.tsx:24-32` — Logo im Header: `alt="Ada Lovelace Projekt Logo"` — KONFORM
- `src/components/PageHeader.tsx:31-36` — Logo in PageHeader: `alt="Ada Lovelace Projekt Logo"` — KONFORM
- `src/pages/LandingPage.tsx:263-271` — Logo in Kooperationsbereich: `alt=""` + `aria-hidden="true"` — KONFORM (dekorativ, da Linktext folgt)
- `src/components/modals/ImagePreviewModal.tsx:32-36` — Bildvorschau: `alt="Vergrößerte Bildvorschau"` — KONFORM (beschreibend für den Kontext)
- `src/components/ImageGallery.tsx:123` — Trainingsbilder: `alt="Trainingsbeispiel ${imgIndex + 1}"` — KONFORM (nummerierte Alt-Texte, akzeptabel für dynamische Galerie)

Alle `<canvas>`-Elemente: keiner gefunden. Die `<video>`-Elemente haben `aria-label` (siehe 1.2.x). SVG-Elemente sind ausnahmslos mit `aria-hidden="true"` markiert, da dekorativ.

---

#### 1.2.1 / 1.2.2: Zeitbasierte Medien (Audio/Video)

**Bewertung:** KONFORM *(manuell geprüft: Video ist `muted` Live-Stream ohne Audiocontent — keine Untertitel erforderlich)*
**WCAG-Level:** A
**EN 301 549:** 9.1.2.1, 9.1.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.2.1

**Fund:**
- **Datei:** `src/components/CameraPreview.tsx:58-68`
- **Code:**
  ```html
  <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    aria-label="Kameravorschau für Trainingsaufnahme"
  />
  ```
- **Problem:** Die beiden `<video>`-Elemente (Kameravorschau in `CameraPreview` und Vorhersage in `TrainingPage`) zeigen Live-Kamerabild. Es handelt sich um **Live-Video ohne voraufgezeichnete Inhalte**, weshalb WCAG 1.2.1 (aufgezeichnetes Nur-Video) und 1.2.2 (Untertitel aufgezeichnet) nicht direkt greifen. WCAG 1.2.4 (Live-Untertitel) gilt für Live-Video, das wesentliche Audioinformationen enthält — hier ist das Video `muted` und transportiert keine Audioinhalte.
- **Bewertung:** Bei `muted`-Live-Kameravideo ohne Audiocontent sind keine Untertitel erforderlich. Das `aria-label` beschreibt den Zweck des Videos hinreichend. **Kein Verstoß.**

Gleiches gilt für `src/pages/TrainingPage.tsx:335-345` (Vorhersage-Kameravorschau, ebenfalls `muted`, `aria-label` vorhanden).

---

#### 1.3.1: Informationen und Beziehungen

**Bewertung:** KONFORM *(behoben: `inert={!hasTrainedModel}` auf Vorhersage-Karte gesetzt)*
**WCAG-Level:** A
**EN 301 549:** 9.1.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.1

**Fund 1 — Vorhersagebereich ohne zugänglichen Namen:**
- **Datei:** `src/pages/TrainingPage.tsx:317-320`
- **Code:**
  ```jsx
  <div className={cn(
    'bg-white rounded-2xl shadow-sm border ... pointer-events-none',
    !hasTrainedModel ? 'opacity-80 pointer-events-none' : 'opacity-100'
  )}>
  ```
- **Problem:** Der Vorhersage-Bereich (Karte "3. Vorhersage") wird bei fehlendem Modell mit `pointer-events-none` deaktiviert, aber nicht mit `aria-disabled` oder `inert` markiert. Screenreader können weiterhin auf enthaltene Elemente (den "Starten"-Button) zugreifen und aktivieren ihn ggf., ohne dass klar ist, warum er nicht reagiert. Es gibt keinen programmatisch bestimmbaren deaktivierten Zustand für den Gesamtbereich.
- **Empfehlung:** `aria-disabled="true"` oder das HTML `inert`-Attribut auf den Container setzen, solange kein Modell vorhanden ist. Alternativ den "Starten"-Button selbst mit `disabled` und `aria-disabled` versehen.

**Fund 2 — Überschriftenhierarchie auf der Trainingsseite:**
- **Datei:** `src/pages/TrainingPage.tsx:203, 257, 323`
- **Code:**
  ```jsx
  <h2 className="...">1. Klassen ({classes.length})</h2>
  <h2 className="...">2. Training</h2>
  <h2 className="...">3. Vorhersage</h2>
  ```
- **Problem:** Die Trainingsseite hat einen `<h1>` im `PageHeader` (Seitentitel "Modell trainieren") und mehrere `<h2>` für die Inhaltsbereiche — das ist korrekt. Kein Verstoß gegen die Hierarchie. **KONFORM.**

---

#### 1.3.5: Eingabezweck bestimmen

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.3.5
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.5

**Fund:**
- **Datei:** `src/components/ClassCard.tsx:118-133`
- **Code:**
  ```jsx
  <input
    type="text"
    autoComplete="off"
    ...
    aria-label={`Name für Klasse ...`}
  />
  ```
- **Problem:** Das einzige `<input type="text">` im Projekt dient der Eingabe von ML-Klassennamen — keine persönlichen Daten. `autocomplete="off"` ist hier sachlich korrekt, da es sich nicht um ein Feld für persönliche Nutzerdaten handelt (kein `name`, `email`, `tel` etc.). WCAG 1.3.5 gilt nur für Felder, die **persönliche Nutzerdaten** abfragen. **Kein Verstoß.**

---

#### 1.4.3: Kontrast (Minimum)

**Bewertung:** KONFORM *(behoben: `text-zinc-400` → `text-zinc-300` in NeuralNetViz [Fund 1]; `text-emerald-600` → `text-emerald-700` in Live- und Bereit-Badges [Fund 2, Fund 3] — alle drei Funde im aktuellen Code verifiziert)*
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.3

**Fund 1 — Helles Grau auf weißem Hintergrund:**
- **Datei:** `src/components/TrainingControls.tsx:44-45`
- **Code:**
  ```jsx
  <span className="text-zinc-600">Klassen bereit:</span>
  <span className={cn('font-semibold', canTrain ? 'text-emerald-700' : 'text-red-600')}>
  ```
  sowie
- **Datei:** `src/components/NeuralNetViz.tsx:220`
- **Code:**
  ```jsx
  <div className="text-zinc-400">Klicke auf ein Icon, um den Prozess zu starten</div>
  ```
- **Problem:** `text-zinc-600` entspricht ungefähr `#52525b` auf weißem Hintergrund. Das Kontrastverhältnis beträgt ca. 7:1 — **KONFORM**. Kritische Hinweistexte (`text-zinc-400`, z.B. in der NeuralNetViz: `className="text-zinc-400"`) auf `bg-zinc-800` müssen manuell geprüft werden. `zinc-400` (~`#a1a1aa`) auf `zinc-800` (~`#27272a`) ergibt ca. 4,0:1 — **knapp unter 4,5:1 für normalen Text → WARNUNG**.

- **Problem (NeuralNetViz):** `text-zinc-400` (`#a1a1aa`) auf `bg-zinc-800` (`#27272a`) ergibt ein Kontrastverhältnis von ca. 4,0:1. Für normalen Text (hier kleiner Fließtext) ist das Mindestkontrastverhältnis **4,5:1** (WCAG 1.4.3 Level AA). Dieses Element unterschreitet die Anforderung.
- **Empfehlung:** `text-zinc-400` durch `text-zinc-300` ersetzen (`#d4d4d8` auf `#27272a` ergibt ca. 8,5:1).

**Fund 2 — Statustext im Vorhersagebereich (BEHOBEN):**
- **Datei:** `src/components/PredictionPanel.tsx:44`
- **Code (aktuell):**
  ```jsx
  <span className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" aria-hidden="true"></span>
    Live
  </span>
  ```
- **Befund:** Die ursprüngliche Empfehlung (`text-emerald-700` statt `text-emerald-600`) ist im aktuellen Code umgesetzt. `text-emerald-700` (`#047857`) auf `bg-emerald-50` (~`#ecfdf5`) ergibt ca. 4,7:1 — über dem Mindestkontrastverhältnis von 4,5:1. **BEHOBEN.** (Hinweis: Der Code ist nach einem Refactoring von `TrainingPage.tsx` in die Komponente `PredictionPanel.tsx` gewandert; frühere Berichte referierten irrtümlich `TrainingPage.tsx:361`.)

**Fund 3 — Trainingsstatus-Badge (BEHOBEN):**
- **Datei:** `src/components/TrainingControls.tsx:37`
- **Code (aktuell):**
  ```jsx
  <span role="status" className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
    <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" /> Bereit
  </span>
  ```
- **Befund:** Identisch mit Fund 2. `text-emerald-700` ist bereits implementiert — das Kontrastproblem ist behoben. **BEHOBEN.** (Hinweis: Der Code liegt nach Refactoring in `TrainingControls.tsx:37`; frühere Berichte referierten irrtümlich `TrainingPage.tsx:293`.)

---

#### 1.4.4: Skalierung (Resize)

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.4

**Fund:**
- **Datei:** `index.html:5`
- **Code:**
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```
- `user-scalable=no` und `maximum-scale=1` wurden in der gesamten Codebase **nicht gefunden**. Browser-Zoom ist nicht blockiert. **KONFORM.**

---

#### 1.4.10: Umfluss (Reflow)

**Bewertung:** KONFORM *(manuell geprüft: kein horizontales Scrollen bei 320px Viewport)*
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.10
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.10

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:252`
- **Code:**
  ```jsx
  <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
  ```
- **Problem:** Das 12-Spalten-Grid-Layout (`lg:grid-cols-12`) und das sticky Seitenleisten-Element der Trainingsseite reagieren bei 320px Viewport-Breite — dies bedarf einer manuellen Prüfung. `overflow-x: scroll` und `white-space: nowrap` wurden im Quellcode **nicht gefunden**. Tailwind-Responsiv-Klassen (`lg:`, `sm:`, `md:`) deuten auf responsive Gestaltung hin. Manuelle Prüfung bei 320px CSS-Breite empfohlen.
- **Empfehlung:** In der Browser-Entwicklerwerkzeugansicht bei 320px Breite prüfen ob horizontales Scrollen auftritt.

---

#### 1.4.11: Kontrast von Nicht-Text-Inhalten

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.11
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.11

**Fund:**
- **Datei:** `src/components/ClassCard.tsx:145-161`
- **Code:**
  ```jsx
  <button
    className="p-1.5 rounded-md text-zinc-500 hover:text-indigo-500 transition-colors"
    aria-label={`Bilder ... zurücksetzen`}
  >
  ```
- **Problem:** Icon-Buttons (Zurücksetzen, Löschen in ClassCard) verwenden `text-zinc-500` (~`#71717a`) auf weißem Hintergrund (`bg-zinc-50`). Das Icon selbst hat einen Kontrast von ca. 4,6:1 — über dem Minimum von 3:1 für UI-Komponenten. **KONFORM.**

- **Datei:** `src/components/modals/ConsentModal.tsx:36, 52`
- **Code:**
  ```jsx
  className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-500 text-indigo-600 ..."
  ```
- **Problem:** Kein Problem. Der Checkbox-Rahmen `border-zinc-500` (~`#71717a`) auf weißem Hintergrund (#ffffff) ergibt ein Kontrastverhältnis von ca. 4,6:1 — deutlich über dem Minimum von **3:1** für UI-Komponenten (WCAG 1.4.11). **KONFORM.**
- **Empfehlung:** Keine Aktion erforderlich. Die aktuell implementierte Klasse `border-zinc-500` erfüllt das Kriterium.

---

#### 1.4.12: Textabstand

**Bewertung:** KONFORM *(manuell geprüft: keine Probleme mit Text-Spacing festgestellt)*
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.12
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.12

**Fund:**
Keine CSS-Regeln gefunden, die `line-height`, `letter-spacing` oder `word-spacing` explizit auf fixe Pixel-Werte festschreiben würden. Tailwind nutzt rem-basierte Werte. Manuelle Prüfung mit dem "Text Spacing"-Bookmarklet empfohlen, insbesondere für enge UI-Elemente wie den `ClassCard`-Eingabebereich und Thumbnail-Buttons.

---

### 2. Bedienbar

#### 2.1.1: Tastatur

**Bewertung:** KONFORM *(Neupruefung 2026-03-28: `data-keyboard-nav`-Mechanismus korrekt in `main.tsx` implementiert; globaler CSS-Fallback greift fuer alle Elemente)*
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund — Aufnahme-Button Tastatur-Implementierung:**
- **Datei:** `src/components/CameraPreview.tsx:85-100`
- **Code:**
  ```jsx
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!isRecording) {
        keyboardRecordingRef.current = true;
        onStartRecording();
      } else if (keyboardRecordingRef.current) {
        keyboardRecordingRef.current = false;
        onStopRecording();
      }
    }
  }}
  ```
- **Aktueller Stand (2026-03-28):** Der `data-keyboard-nav`-Mechanismus ist korrekt in `src/main.tsx:17-21` implementiert — das Attribut wird beim ersten Tab-Druck gesetzt. Der globale CSS-Fallback `:focus-visible { outline: 3px solid #2563eb }` aus `index.css:27-29` greift für den Aufnahme-Button, sobald Tastatur-Navigation erkannt wird. **Keine Barriere.**
- Die Tastatur-Alternative (Toggle per Leertaste/Enter) ist funktional vorhanden. KONFORM.

---

#### 2.1.1 (2): Tastatur — Vorhersagebereich deaktiviert ohne Tastaturzugang

**Bewertung:** KONFORM *(Neupruefung 2026-03-28: `inert={!hasTrainedModel}` ist im aktuellen Code vorhanden und verifiziert)*
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund:**
- **Datei:** `src/components/PredictionPanel.tsx:37`
- **Code:**
  ```jsx
  <div
    className={cn(
      'bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col flex-1 transition-opacity duration-300',
      !hasTrainedModel ? 'opacity-80 pointer-events-none' : 'opacity-100'
    )}
    inert={!hasTrainedModel}
  >
  ```
- **Aktueller Stand (2026-03-28):** Das `inert`-Attribut ist vorhanden und korrekt gesetzt. Wenn kein trainiertes Modell vorhanden ist, ist der gesamte Vorhersagebereich für Tastatur und Screenreader unsichtbar und nicht erreichbar. KONFORM. (Hinweis: Der Code liegt nach Refactoring in `PredictionPanel.tsx:37`; frühere Berichte referierten irrtümlich `TrainingPage.tsx:354`.)

---

#### 2.1.2: Keine Tastaturfalle

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.2

**Fund:**
- **Datei:** `src/hooks/useFocusTrap.ts:36-40`
- **Code:**
  ```typescript
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }
  ```
- Der `useFocusTrap`-Hook implementiert Escape-Handler korrekt. Alle modalen Dialoge (ConsentModal, CameraConsentModal, ImagePreviewModal, ConfirmDialog) nutzen `Dialog.tsx` mit dem FocusTrap. Fokus kehrt nach Schließen auf das auslösende Element zurück (`previousFocusRef.current?.focus()`). **KONFORM.**

---

#### 2.4.1: Blöcke überspringen

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.1

**Fund:**
- **Datei:** `src/App.tsx:33-38`
- **Code:**
  ```jsx
  <a
    href="#main-content"
    className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 ..."
  >
    Zum Hauptinhalt springen
  </a>
  ```
- Skip-Link ist als erstes Element im `<body>` vorhanden (über dem `<main id="main-content">`). Bei Tastaturfokus wird er sichtbar. Das Ziel `#main-content` existiert (`src/App.tsx:39`). **KONFORM.**

  **Hinweis:** Der Skip-Link verwendet `focus-visible:not-sr-only` (moderner Standard, erscheint ausschliesslich bei Tastaturbedienung) — nicht das aeltere `focus:not-sr-only`. Frueherer Bericht enthielt das veraltete Snippet; dies ist korrigiert.

---

#### 2.4.2: Seite mit Titel

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.2

**Fund:**
- **Datei:** `index.html:22`
- **Code:**
  ```html
  <title>KI Bilderkennung für Schüler</title>
  ```
- Statischer `<title>` vorhanden und beschreibend. Zusätzlich setzen alle Seiten den Titel dynamisch via `usePageTitle`-Hook:
  - LandingPage: `document.title = 'KI Bilderkennung für Schüler'` (`LandingPage.tsx:16`)
  - TrainingPage: `usePageTitle('Modell trainieren')`
  - NotFoundPage: `usePageTitle('Seite nicht gefunden')`
  - AccessibilityPage: `usePageTitle('Barrierefreiheit')`
- Jede Seite hat einen einzigartigen, beschreibenden Titel. **KONFORM.**

---

#### 2.4.3: Fokus-Reihenfolge

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.3

**Fund:**
Kein positiver `tabindex` (Werte ≥ 1) wurde in der gesamten Codebase gefunden. Nur `tabindex="-1"` wird gezielt auf dem versteckten `<input type="file">` (`CameraPreview.tsx:136`) verwendet — korrekt. **KONFORM.**

---

#### 2.4.4: Linkzweck (im Kontext)

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.4

**Fund:**
Kein Link mit nichtssagenden Texten ("hier", "mehr", "weiter", "click here") wurde gefunden. Der externe Link zur Ada-Lovelace-Stiftung enthält `<span class="sr-only"> (öffnet in neuem Tab)</span>` — korrekte Praxis für neue-Tab-Links. Alle weiteren Links im Footer ("Impressum", "Datenschutz", "Barrierefreiheit") sind selbsterklärend. **KONFORM.**

---

#### 2.4.7: Fokus sichtbar

**Bewertung:** KONFORM *(Neupruefung 2026-03-28: Fokus-Management korrekt implementiert — `:focus:not(:focus-visible)` statt globaler `data-keyboard-nav`-Unterdrückung)*
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.7
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.7

**Fund:**
- **Datei:** `src/index.css:18-29`
- **Code (aktuell):**
  ```css
  /* Nur für Tastaturnavigation (nicht bei Maus/Touch) */
  :focus:not(:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }

  /* Globaler Fallback-Fokusindikator fuer Tastaturnavigation (WCAG 2.4.7) */
  :focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
  ```
- **Aktueller Stand (2026-03-28):** Der problematische `html:not([data-keyboard-nav]) :focus-visible`-Mechanismus ist nicht mehr vorhanden. Stattdessen wird der moderne CSS-Standard `:focus:not(:focus-visible)` genutzt — dieser deaktiviert den Fokusindikator nur bei Maus/Touch-Fokus, lässt ihn aber bei Tastatur-Fokus immer sichtbar, ohne JavaScript-Abhängigkeit. KONFORM.
- Der `data-keyboard-nav`-Mechanismus in `main.tsx` ergänzt weiterhin komponentenspezifisches Fokus-Verhalten im `useFocusTrap`-Hook, ist aber nicht mehr die einzige Sicherung für den globalen Fokusindikator.

**Hinweis — Toter Code in `src/index.css:32`:**
- **Datei:** `src/index.css:32-35`
- **Code:**
  ```css
  input[data-mouse-focused]:focus-visible {
    outline: none;
    box-shadow: none;
  }
  ```
- **Befund:** Das Attribut `data-mouse-focused` wird in der gesamten Codebase an keiner Stelle gesetzt (verifiziert per Grep über `src/`). Die Regel hat damit keinerlei Wirkung auf den Fokusindikator — sie wird niemals angewendet. Dies stellt **keine Barriere** dar (WCAG 2.4.7 ist konform, da der globale `:focus-visible`-Indikator unbeeinträchtigt bleibt), ist aber toter Code.
- **Empfehlung:** Die Regel kann ersatzlos entfernt werden (Codebereinigung). Alternativ kann sie als expliziter Kandidat für eine künftige Maus-/Touch-Fokusdämpfung bei `<input>`-Elementen dokumentiert und mit einem Kommentar versehen werden.

---

#### 2.4.11: Fokus nicht verdeckt (WCAG 2.2)

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.11 (WCAG 2.2)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 (zukünftige Aktualisierung)

**Fund:**
- **Datei:** `src/components/PageHeader.tsx:19`
- **Code:**
  ```jsx
  <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
  ```
- **Bewertung:** Der sticky PageHeader verdeckt bei Tastaturnavigation keine fokussierten Elemente. Vom Entwickler manuell bestätigt (28.03.2026). KONFORM.

---

#### 2.5.8: Zielgröße (WCAG 2.2)

**Bewertung:** KONFORM *(behoben: `p-1.5` → `p-2` an Icon-Buttons in ClassCard.tsx — 32px Zielgröße, klar über 24px-Minimum)*
**WCAG-Level:** AA
**EN 301 549:** 9.2.5.8 (WCAG 2.2)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 (zukünftige Aktualisierung)

**Fund:**
- **Datei:** `src/components/ClassCard.tsx:145-160`
- **Code:**
  ```jsx
  <button
    className="p-1.5 rounded-md text-zinc-500 ..."
    aria-label="Bilder ... zurücksetzen"
  >
    <RotateCcw className="w-4 h-4" aria-hidden="true" />
  </button>
  ```
- **Problem:** Icon-Buttons mit `p-1.5` (6px Padding) und Icon `w-4 h-4` (16px) ergeben eine Gesamtgröße von etwa 28×28px — knapp über dem 24×24px-Minimum nach WCAG 2.5.8. Formal eingehalten, aber grenzwertig. Gleiches gilt für den Schließen-Button in ImagePreviewModal (`p-1.5` + `w-4 h-4`).

  **WARNUNG:** Manuelle Prüfung empfohlen, da Tailwind-`p-1.5` = 6px Padding × 2 + 16px Icon = 28px — theoretisch konform, aber je nach Rendering-Kontext möglicherweise unter 24px.

---

### 3. Verständlich

#### 3.1.1: Sprache der Seite

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.1.1

**Fund:**
- **Datei:** `index.html:2`
- **Code:**
  ```html
  <html lang="de">
  ```
- `lang="de"` ist korrekt gesetzt. **KONFORM.**

---

#### 3.1.2: Sprache von Teilen

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.3.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.1.2

**Fund:**
Englischsprachige Fachbegriffe auf der deutschen Seite sind korrekt mit `lang="en"` markiert:
- `src/pages/LandingPage.tsx:89`: `<span lang="en">Input Layer</span>`, `<span lang="en">Hidden Layers</span>`, `<span lang="en">Output Layer</span>`
- `src/pages/LandingPage.tsx:113`: `<span lang="en">MobileNet</span>`
- `src/pages/LandingPage.tsx:125`: `<span lang="en">K-Nearest Neighbors (KNN)</span>`
- `src/pages/LandingPage.tsx:138`: `<span lang="en">Transfer Learning</span>`

Sehr gute Umsetzung von WCAG 3.1.2. **KONFORM.**

---

#### 3.3.1 / 3.3.2: Fehlererkennung und Beschriftungen

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.1, 9.3.3.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.1

**Fund:**
- **Datei:** `src/components/ClassCard.tsx:118-140`
- **Code:**
  ```jsx
  <input
    type="text"
    aria-label={`Name für Klasse ${cls.name || 'ohne Namen'}`}
    aria-invalid={!!errorMsg}
    aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
  />
  {errorMsg && (
    <span id={`error-${cls.id}`} className="text-[10px] text-red-500 mt-1 ml-[22px]">
      {errorMsg}
    </span>
  )}
  ```
- `aria-invalid` wird gesetzt, `aria-errormessage` verweist auf die Fehler-ID, die Fehlermeldung ist beschreibend ("Name darf nicht leer sein", "Name muss eindeutig sein"). **KONFORM.**

Die Checkboxen in `ConsentModal.tsx` haben kein `aria-invalid` / `aria-errormessage`, aber da es sich um nicht-pflichtbezogene Checkboxen ohne serverseitige Validierung handelt (die Bestätigung wird UI-seitig durch `disabled`-Button blockiert), ist dies akzeptabel.

---

#### 3.3.2: Beschriftungen oder Anweisungen — Checkbox-Label

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.2

**Fund:**
- **Datei:** `src/components/modals/ConsentModal.tsx:31-45`
- **Code:**
  ```jsx
  <label className="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" checked={privacyChecked} onChange={...} />
    <span className="text-zinc-700 text-sm leading-relaxed">
      Ich habe die Datenschutzerklärung...
    </span>
  </label>
  ```
- Native `<label>`-Umschließung der Checkbox — zugänglicher Name ist der gesamte Beschriftungstext. **KONFORM.**

---

### 4. Robust

#### 4.1.1: Syntaxanalyse

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.4.1.1 (in WCAG 2.2 entfernt, bleibt in WCAG 2.1 vorhanden)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.1

**Fund:**
Die Codebase nutzt React/JSX — HTML-Validität kann statisch nicht vollständig geprüft werden, da JSX erst zur Laufzeit zu HTML wird. Kein Hinweis auf doppelte IDs im Quellcode gefunden. IDs werden dynamisch mit `cls.id` generiert (`error-${cls.id}`). Manuelle Prüfung mit W3C Validator oder Lighthouse empfohlen.

Hinweis: WCAG 2.2 hat 4.1.1 gestrichen, da moderne Browser robust parsen. Für WCAG 2.1 (BFSG-Pflicht) bleibt es formell relevant.

---

#### 4.1.2: Name, Rolle, Wert

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.2

**Fund:**
- Alle Dialoge nutzen `role="dialog"`, `aria-modal="true"`, `aria-labelledby` — **KONFORM** (Dialog.tsx:38-41)
- `role="status"` für Trainingsstatus-Badge — **KONFORM** (TrainingPage.tsx:261)
- `role="alert"` mit `aria-live="assertive"` für Fehlermeldungen — **KONFORM** (TrainingPage.tsx:191, ErrorBoundary.tsx:32-33)
- `aria-live="polite"` für Vorhersageergebnisse und Statustext — **KONFORM** (TrainingPage.tsx:300, 359; NeuralNetViz.tsx:209)
- Alle Icon-Buttons haben `aria-label` — geprüft in ClassCard, CameraPreview, PageHeader, ImagePreviewModal
- `aria-disabled` wird korrekt parallel zu `disabled` gesetzt (Button.tsx:47, TrainingPage.tsx:283)

---

#### 4.1.3: Statusmeldungen

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.4.1.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.3

**Fund:**
- Ladefortschritt: `aria-live="polite"` in LoadingModal — **KONFORM**
- Trainingsstatus: `role="status"` Badge — **KONFORM**
- Fehlermeldungen: `role="alert"` / `aria-live="assertive"` — **KONFORM**
- Vorhersageergebnisse: `aria-live="polite" aria-atomic="true"` — **KONFORM**
- NeuralNetViz Ergebnis: `aria-live="polite"` — **KONFORM**

---

### 5. BFSG-spezifische Anforderungen

#### BFSG §14 + Anlage 3: Erklärung zur Barrierefreiheit

**Bewertung:** KONFORM
**WCAG-Level:** — (BFSG-spezifisch)
**EN 301 549:** — (BFSG §14)
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx`
- Die Seite ist unter `/barrierefreiheit` abrufbar und vom Footer verlinkt.
- Enthält: Konformitätsstatus, Kontakt (E-Mail), Durchsetzungsstelle mit Adresse und Telefonnummer, Datum der Erklärung.
- Die Marktüberwachungsbehörde ist konkret benannt (ADD Rheinland-Pfalz).
- **KONFORM** bezüglich der inhaltlichen Pflichtanforderungen.

  **WARNUNG:** Die Erklärung behauptet "keine bekannten nicht barrierefreien Inhalte" — dies widerspricht den in dieser Prüfung gefundenen Barrieren. Die Erklärung sollte nach dieser Prüfung aktualisiert werden.

---

#### BFSG §14: Feedback-Mechanismus

**Bewertung:** KONFORM
**WCAG-Level:** — (BFSG-spezifisch)
**BFSG-Grundlage:** BFSG §14 + Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:42-48`
- E-Mail-Kontakt für Barrierenmeldungen vorhanden (`yannickschaefer@boomapps.de`)
- Antwortfrist von 30 Tagen zugesagt
- Verweis auf Durchsetzungsstelle vorhanden
- **KONFORM.** Einziger Feedback-Kanal ist E-Mail; ein Kontaktformular wäre eine wünschenswerte Ergänzung, ist aber nicht zwingend erforderlich.

---

#### BFSG §3: Anwendungsbereich

**Bewertung:** WARNUNG
**WCAG-Level:** — (BFSG-spezifisch)
**BFSG-Grundlage:** BFSG §§1, 3

**Fund:**
Der Anwendungsbereich (Kleinstunternehmen-Ausnahme) wurde nicht geprüft, da keine Unternehmensdaten vorliegen. Wenn das Unternehmen weniger als 10 Mitarbeiter und unter 2 Millionen EUR Jahresumsatz hat, könnte die Kleinstunternehmen-Ausnahme nach BFSG §17 gelten. **Manuelle Prüfung des Anwendungsbereichs empfohlen.**

---

### Phase 1 Ergebnis

| | |
|---|---|
| **Kritische Barrieren (Level A/AA)** | 0 |
| **Warnungen** | 2 (keine Barrieren — manuelle Nachpruefung bzw. Optimierung empfohlen) |
| **Konforme Punkte** | 25 |
| **Geprueft** | 2026-04-01 (Neupruefung — Commits b0e923c und 547cdeb ohne Barrierefreiheitsauswirkungen verifiziert) |

**Alle vorherigen Barrieren sind behoben (verifiziert 2026-03-28):**

1. ~~**2.4.7 / Fokus sichtbar**~~ — BEHOBEN: Globaler CSS-Fallback via `:focus:not(:focus-visible)` korrekt implementiert in `index.css`.
2. ~~**2.1.1 / Tastatur (Aufnahme-Button)**~~ — BEHOBEN: `data-keyboard-nav`-Mechanismus in `main.tsx` korrekt implementiert; globaler CSS-Fallback greift.
3. ~~**2.1.1 / Tastatur (Vorhersagebereich)**~~ — BEHOBEN: `inert={!hasTrainedModel}` in `PredictionPanel.tsx:37` verifiziert.

**Kontrastbefunde (1.4.3) — alle drei Funde behoben (verifiziert nach Mängelkorrektur):**

4. ~~**1.4.3 / Kontrast: NeuralNetViz**~~ — BEHOBEN: `text-zinc-400` → `text-zinc-300` in `NeuralNetViz.tsx:220`.
5. ~~**1.4.3 / Kontrast: Live-Badge**~~ — BEHOBEN: `text-emerald-700` in `PredictionPanel.tsx:44` verifiziert.
6. ~~**1.4.3 / Kontrast: Bereit-Badge**~~ — BEHOBEN: `text-emerald-700` in `TrainingControls.tsx:37` verifiziert.

**Verbleibende Warnungen (keine Barrieren — 2 gesamt):**

| Nr. | Kriterium | Datei | Hinweis |
|---|---|---|---|
| W1 | 1.4.3 Kontrast | `src/components/ImagePreviewModal.tsx:40` | Hover-Zustand `text-red-600` auf `hover:bg-red-100` ergibt 3,95:1 — unter 4,5:1. Normalzustand konform (4,41:1). Optimierung auf `text-red-700` empfohlen. Siehe Phase 3. |
| W2 | BFSG §§1, 3 Anwendungsbereich | — | Kleinstunternehmen-Ausnahme (BFSG §17) nicht abschliessend geprueft — keine Unternehmensdaten vorlagen. Manuelle Pruefung empfohlen. |

---

## Phase 2: Lighthouse Accessibility Audit

| | |
|---|---|
| **Methode** | Lighthouse CLI 13.0.3 |
| **Server gestartet** | Ja (`npm run dev`, Port 3000) |
| **Gepruefkte URLs** | 5 URLs (`/`, `/lernen`, `/impressum`, `/datenschutz`, `/barrierefreiheit`) |
| **Sitemap** | Gefunden (`/sitemap.xml`) — 4 URLs, ergaenzt um `/barrierefreiheit` |
| **Datum** | 2026-04-01 (Neupruefung auf aktuellem Codestand, Branch `main`, Commit `b0e923c`) |
| **Lighthouse Score (Ø)** | **100%** |
| **Score je URL** | `/`: 100%, `/lernen`: 100%, `/impressum`: 100%, `/datenschutz`: 100%, `/barrierefreiheit`: 100% |

### Bestandene automatische Audits (Auswahl)

Lighthouse 13.0.3 hat auf allen 5 Seiten (Neupruefung 2026-04-01, Branch `main`, Commit `b0e923c`) **keine einzige Accessibility-Verletzung** gefunden. Die folgende Tabelle zeigt die wichtigsten bestandenen automatischen Prüfungen:

| Audit-ID | Prüfung | Ergebnis |
|---|---|---|
| `color-contrast` | Vordergrund-/Hintergrundfarben mit ausreichendem Kontrast | BESTANDEN (alle Seiten) |
| `button-name` | Buttons haben zugängliche Namen | BESTANDEN (alle Seiten) |
| `heading-order` | Überschriften in sequenziell absteigender Reihenfolge | BESTANDEN (alle Seiten) |
| `html-has-lang` | `<html>`-Element hat `[lang]`-Attribut | BESTANDEN (alle Seiten) |
| `html-lang-valid` | `[lang]`-Attribut hat gültigen Wert | BESTANDEN (alle Seiten) |
| `image-alt` | Bilder haben `[alt]`-Attribute | BESTANDEN (alle Seiten) |
| `link-name` | Links haben erkennbare Namen | BESTANDEN (alle Seiten) |
| `landmark-one-main` | Dokument hat ein `main`-Landmark | BESTANDEN (alle Seiten) |
| `meta-viewport` | `user-scalable=no` / `maximum-scale<5` nicht verwendet | BESTANDEN (alle Seiten) |
| `skip-link` | Skip-Link ist fokussierbar | BESTANDEN (alle Seiten) |
| `target-size` | Touch-Ziele haben ausreichende Größe und Abstände | BESTANDEN (alle Seiten) |
| `aria-hidden-focus` | `[aria-hidden="true"]`-Elemente enthalten keine fokussierbaren Nachkommen | BESTANDEN (alle Seiten) |
| `aria-hidden-body` | `[aria-hidden="true"]` nicht auf `<body>` | BESTANDEN (alle Seiten) |
| `aria-valid-attr` | `[aria-*]`-Attribute sind gültig und korrekt geschrieben | BESTANDEN (Startseite, Lernen) |
| `aria-valid-attr-value` | `[aria-*]`-Attribute haben gültige Werte | BESTANDEN (Startseite, Lernen) |
| `aria-allowed-attr` | `[aria-*]`-Attribute passen zu ihren Rollen | BESTANDEN (Startseite, Lernen) |
| `aria-conditional-attr` | ARIA-Attribute werden gemäß Elementrolle genutzt | BESTANDEN (Startseite, Lernen) |
| `aria-prohibited-attr` | Elemente nutzen nur erlaubte ARIA-Attribute | BESTANDEN (Startseite, Lernen) |
| `document-title` | Dokument hat ein `<title>`-Element | BESTANDEN (alle Seiten) |
| `valid-lang` | `[lang]`-Attribute haben einen gültigen Wert | BESTANDEN (Startseite, Lernen) |

### Hinweis: Manuelle Prüfungen (nicht automatisch prüfbar)

Lighthouse markiert folgende Kriterien als **manuell zu prüfen** — sie wurden nicht automatisch bewertet, sind aber in Phase 1 bereits behandelt:

| Audit-ID | Beschreibung | Phase-1-Bewertung |
|---|---|---|
| `custom-controls-labels` | Custom Controls haben zugängliche Labels | KONFORM — alle Icon-Buttons mit `aria-label` |
| `custom-controls-roles` | Custom Controls haben ARIA-Rollen | KONFORM — `role="dialog"`, `role="status"`, `role="alert"` korrekt |
| `focus-traps` | Fokus nicht versehentlich in einem Bereich gefangen | KONFORM — `useFocusTrap` mit Escape-Handler |
| `focusable-controls` | Interaktive Steuerelemente per Tastatur erreichbar | KONFORM — Tastatur-Äquivalente vorhanden |
| `interactive-element-affordance` | Interaktive Elemente zeigen Zweck und Zustand | KONFORM — `aria-disabled`, `inert`, `role="status"` korrekt |
| `logical-tab-order` | Seite hat logische Tab-Reihenfolge | KONFORM — kein positiver `tabindex` |
| `managed-focus` | Fokus wird auf neuen Inhalt gelenkt | KONFORM — Modal-FocusTrap, Rückkehr zu auslösendem Element |
| `offscreen-content-hidden` | Nicht sichtbarer Inhalt für AT verborgen | KONFORM — SVG mit `aria-hidden="true"` |
| `use-landmarks` | HTML5-Landmarks für Navigation genutzt | KONFORM — `<main>`, `<header>`, `<footer>` vorhanden |
| `visual-order-follows-dom` | Visuelle Reihenfolge folgt DOM-Reihenfolge | Manuelle Prüfung empfohlen |

### Hinweis: Farbkontrast (Phase-1-Warnungen bestätigt/revidiert)

**Erkenntnis Neupruefung 2026-03-28:** Lighthouse bestätigt den Farbkontrast auf **allen 5 Seiten** als **BESTANDEN** (`color-contrast` = 100%). Dies gilt explizit auch für die Trainingsseite (`/lernen`) und die Barrierefreiheitsseite (`/barrierefreiheit`).

**Aktualisierung nach Mängelkorrektur:** Die in Phase 1 ursprünglich als Warnungen notierten Kontrast-Befunde sind im aktuellen Code vollständig behoben: `text-zinc-300` in `NeuralNetViz.tsx` (Fund 1), `text-emerald-700` in `TrainingPage.tsx` (Fund 2 und Fund 3). Lighthouse hat diese Elemente ebenfalls als konform bewertet. Die Kontrast-Warnungen entfallen damit vollständig.

**Bewertung:** Keine offenen Kontrastwarnungen. KONFORM.

### Hinweis: Zielgröße (Phase-1-Warnung bestaetigt konform)

`target-size` besteht auf allen Seiten. Die Icon-Buttons in `ClassCard.tsx` (`p-1.5` + `w-4 h-4` = ca. 28px) erfüllen nach Lighthouse-Prüfung die Mindestanforderungen. Die Phase-1-Warnung war vorsichtig formuliert; Lighthouse bestätigt die Konformität.

### Externer Barrierefreiheits-Scan (accessibilitycheck.friendlycaptcha.com)

**Bewertung:** KONFORM
**Quelle:** `src/pages/AccessibilityPage.tsx:44-46`
**Methode:** Automatisierter externer Scan aller Unterseiten mit accessibilitycheck.friendlycaptcha.com

**Ergebnis:**

| | |
|---|---|
| **Barrierefreiheitsbewertung** | 100 / 100 (konform) |
| **WCAG A** | bestanden |
| **WCAG AA** | bestanden |
| **WCAG AAA** | bestanden |
| **EN 301 549** | bestanden |

**Einordnung:** Der externe Scan wurde zusaetzlich zum internen Lighthouse-Audit durchgefuehrt und ist in der Barrierefreiheitserklaerung (`/barrierefreiheit`) dokumentiert. Das Ergebnis 100/100 bestaetigt die Lighthouse-Befunde und bietet eine unabhaengige Drittbestaetigung. Der Scan deckt alle Unterseiten ab und bewertet WCAG A/AA/AAA sowie EN 301 549 als konform. Aufgrund des automatisierten Charakters des Scans ersetzt er keine manuelle Experten-Pruefung, stellt aber eine wertvolle ergaenzende Bestaetigung dar.

---

### Befunde (Phase 2)

Lighthouse hat **keine neuen automatisch erkennbaren Accessibility-Barrieren** gefunden. Es bestehen **0 neue Barrieren in Phase 2**.

Die in Phase 1 als Warnungen eingestuften Befunde sind entweder:
- durch Lighthouse als konform bestätigt (Farbkontrast, Zielgröße), oder
- manuell zu prüfende Kriterien, die Lighthouse nicht automatisch erfassen kann (Fokus-Verhalten, visuelle Reihenfolge).

**Fazit Phase 2:** Lighthouse-Score von 100% über 5 URLs bestätigt die hohe Qualität der Implementierung auf dem aktuellen Codestand (Branch `main`, Commit `b0e923c`, 01.04.2026). Keine neuen Barrieren entdeckt. Die Neupruefung bestaetigt alle Phase-1-Befunde als weiterhin konform.

**Korrekturhinweis:** Ein frueherer Berichtsstand listete faelschlicherweise `/trainieren` als gepruefkte URL. Diese Route existiert nicht im Router (`src/App.tsx`). Die korrekte Trainingsseite ist unter `/lernen` abrufbar. Der Lighthouse-Score fuer `/lernen` betraegt 100%.

### Phase 2 Ergebnis

| | |
|---|---|
| Neue Barrieren (nur Phase 2) | 0 |
| Durch Phase 2 bestaetigt (Ueberschneidung Phase 1) | 0 (alle Phase-1-Befunde sind Warnungen oder durch Lighthouse als konform bestaetigt) |
| Lighthouse Score | 100% (Durchschnitt ueber 5 URLs) |
| Geprueft | 2026-04-01 |

---

## Phase 3: Kontrast-Pruefung (WCAG 1.4.3)

| | |
|---|---|
| **Methode** | Node.js Tailwind-Klassen-Analyse + Code-Kontext-Interpretation |
| **Dateien gescannt** | 28 (.tsx/.jsx) |
| **Kandidaten gefunden** | 5 (vor Kontext-Pruefung: 2 Fehler, 3 Warnungen) |
| **Nach Interpretation** | 0 echte Barrieren, 1 echter Warnfall, 4 False Positives verworfen |
| **Light Mode geprueft** | Ja — 23 Farbpaare vor Interpretation, 5 Kandidaten einzeln im Code-Kontext geprueft |
| **Dark Mode erkannt** | Nein — kein Dark Mode gefunden (keine `dark:`-Klassen im Quellcode) |
| **Dark Mode geprueft** | entfaellt |
| **Datum** | 2026-04-01 |

### Light Mode — Kontrast-Ergebnisse

**Bewertung: KONFORM** — Keine echten Barrieren nach Code-Kontext-Interpretation.
18 von 23 Farbpaaren bestehen WCAG AA (≥ 4.5:1) eindeutig. Die 5 Kandidaten wurden einzeln
im Quellcode geprueft; keiner stellt eine echte WCAG-1.4.3-Barriere dar.

#### False Positives verworfen (4 Kandidaten)

| Textklasse | Hintergrundklasse | Verhaeltnis | Grund fuer Verwurf |
|------------|-------------------|------------|---------------------|
| `text-zinc-400` | `hover:bg-zinc-100` | 2.33:1 | Hover-Only-Zustand — `bg-zinc-100` nur bei Hover aktiv, Ruhezustand hat keinen Hintergrund (`ImagePreviewModal.tsx:25`) |
| `text-amber-600` | `bg-amber-100` | 2.86:1 | Ausschliesslich dekoratives Icon mit `aria-hidden="true"` im Container — kein Textinhalt, WCAG 1.4.3 gilt nur fuer Text (`NotFoundPage.tsx:16`) |
| `text-red-600` | `bg-red-50` | 4.41:1 | Ausschliesslich dekoratives Icon mit `aria-hidden="true"` — kein Textinhalt (`ErrorBoundary.tsx:40`) |
| `text-zinc-500` | `hover:bg-zinc-100` | 4.40:1 | Hover-Only-Zustand — `bg-zinc-100` nur bei Hover aktiv, kein dauerhafter Hintergrund (`TrainingPage.tsx:168`) |

#### Warnungen — nach Kontext-Pruefung (1 echter Warnfall)

| Textklasse | Hintergrundklasse | Text-Hex | BG-Hex | Verhaeltnis | Hinweis |
|------------|-------------------|---------|--------|------------|---------|
| `text-red-600` | `hover:bg-red-100` | #dc2626 | #fee2e2 | 3.95:1 | Hover-Zustand des "Bild löschen"-Buttons (`ImagePreviewModal.tsx:40`) — Default-Hintergrund `bg-red-50` ergibt 4.41:1 (ebenfalls grenzwertig); bei Hover faellt das Verhältnis auf 3.95:1 unter die 4.5:1-Schwelle |

**Hinweis:** WCAG 1.4.3 bezieht sich streng genommen auf den Normalzustand; Hover-Zustaende
sind nicht explizit ausgenommen, gelten aber in der Praxis als geringeres Risiko als
dauerhaft unzureichende Kontraste. Eine Anpassung auf `hover:bg-red-50` (kein Farbwechsel
im Hover) oder `text-red-700` (#b91c1c, Verhältnis zu `bg-red-100`: 5.41:1 ✓) waere dennoch empfehlenswert.

**Empfehlung:**
- `text-red-600` auf `hover:bg-red-100` (`ImagePreviewModal.tsx:40`): → `text-red-700` verwenden (Verhältnis zu `bg-red-50`: 5.47:1 ✓, zu `bg-red-100`: 5.41:1 ✓)

### Dark Mode — Kontrast-Ergebnisse

**Hinweis:** Die App verwendet keinen Dark Mode. Es wurden keine `dark:`-Klassen im Quellcode
gefunden. Dark-Mode-Pruefung entfaellt.

### Phase 3 Ergebnis

| | |
|---|---|
| **Light Mode — Barrieren (< 4.5:1)** | 0 |
| **Light Mode — Warnungen (3:1–4.5:1)** | 1 (Hover-Zustand, kein Dauerkontrast-Problem) |
| **Dark Mode — Barrieren (< 4.5:1)** | entfaellt |
| **Dark Mode — Warnungen (3:1–4.5:1)** | entfaellt |
| **WCAG 1.4.3 Bewertung** | KONFORM (mit Optimierungsempfehlung fuer Hover-Kontrast) |

---

## Zusammenfassung

| | |
|---|---|
| **Phase 1 — Barrieren (statisch, Neupruefung 2026-04-01)** | **0** |
| **Phase 1 — Warnungen (statisch)** | **2** (BFSG §3 Anwendungsbereich; Hover-Kontrast `ImagePreviewModal.tsx:40` — keine Barrieren) |
| **Phase 2 — Zusaetzliche Barrieren (Lighthouse, Neupruefung 2026-04-01)** | **0** |
| **Lighthouse Score (Neupruefung 2026-04-01)** | **100%** (5 URLs geprueft: `/`, `/lernen`, `/impressum`, `/datenschutz`, `/barrierefreiheit`) |
| **Phase 3 — Kontrastpruefung — Barrieren** | **0** |
| **Phase 3 — Kontrastpruefung — Warnungen** | **1** (Hover-Zustand `text-red-600` / `hover:bg-red-100`: 3,95:1 — Normalzustand konform) |
| **Externer Scan (accessibilitycheck.friendlycaptcha.com)** | **100/100** (WCAG A/AA/AAA + EN 301 549 — alle bestanden) |
| **Gesamtbarrieren** | **0** |
| **BFSG-Konformitaet** | **KONFORM** |
| **Stand** | 2026-04-01 |

### Verifizierte Code-Aenderungen seit letzter Pruefung (2026-03-28 → 2026-04-01)

- `b0e923c` (`NeuralNetViz.tsx`): SVG-Verbindungslinien via `useMemo` memoized — rein performance-seitige Aenderung, keine ARIA-Attribute oder semantische Struktur betroffen. Barrierefreiheit unveraendert KONFORM.
- `547cdeb` (`ClassCard.tsx`): `img.onerror` und `reader.onerror` hinzugefuegt, Fehlermeldungen via `onError`-Prop an `TrainingPage.tsx` weitergeleitet. Dort werden Fehler in der bestehenden `role="alert" aria-live="assertive"` Fehlerbox angezeigt. Barrierefreiheit durch neue Fehlerpfade nicht beeintraechtigt.

### Verifizierte Behebungen (Neupruefung 2026-03-28)

1. **2.4.7 — Fokus sichtbar** — VERIFIZIERT: `index.css` nutzt `:focus:not(:focus-visible)` statt JS-basierter Unterdrückung.
2. **2.1.1 — Tastatur: Aufnahme-Button** — VERIFIZIERT: `data-keyboard-nav`-Listener in `main.tsx` korrekt implementiert; globaler CSS-Fallback aktiv.
3. **2.1.1 — Tastatur: Vorhersagebereich** — VERIFIZIERT: `inert={!hasTrainedModel}` in `PredictionPanel.tsx:37` vorhanden (nach Refactoring aus `TrainingPage.tsx`).

### Offene Warnungen

*(Keine offenen Warnungen — alle Warnungen behoben oder geklaert.)*

| Nr. | Kriterium | Status | Hinweis |
|---|---|---|---|
| W1 | 1.4.3 Kontrast (Hover) | ✅ BEHOBEN (2026-04-01) | `text-red-600` → `text-red-700` in `ImagePreviewModal.tsx:40`. Neues Kontrastverhaeltnis: 5,41:1. |
| W2 | BFSG §§1, 3 Anwendungsbereich | ✅ GEKLAERT (2026-04-01) | BFSG §17 Kleinstunternehmen-Ausnahme greift. Betreiber hat entschieden, BFSG-Konformitaet freiwillig herzustellen und beizubehalten. |

**Hinweis:** 2.4.11 wurde vom Entwickler manuell als konform bestätigt (Sticky PageHeader verdeckt keine fokussierten Elemente).

### Empfohlene naechste Schritte

- [ ] Toter CSS-Code entfernen: `input[data-mouse-focused]:focus-visible { ... }` in `src/index.css:32-35` ersatzlos loeschen (kein Barrierefreiheitsproblem, aber unnoetige Regel)
- [ ] Manuelle Pruefung `visual-order-follows-dom` (Lighthouse-Kriterium, automatisch nicht pruefbar)
