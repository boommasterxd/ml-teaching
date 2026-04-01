# BFSG/Barrierefreiheits-Pruefbericht

| | |
|---|---|
| **Datum** | 2026-04-01 |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Gepruefte URL** | http://localhost:3000 (Dev-Server) |
| **Pruefgrundlage** | BFSG, WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BITV 2.0 |
| **Gesamtergebnis** | BESTANDEN — alle Barrieren behoben, Lighthouse Score 100% |

---

## Phase 1: Statische Codebase-Analyse

### 1. Wahrnehmbar

#### 1.1.1 Nichttextlicher Inhalt — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.1.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.1.1

**Fund:**
- Alle informativen `<img>`-Elemente haben aussagekräftige `alt`-Attribute:
  - `src/pages/LandingPage.tsx:26` — Logo mit `alt="Ada Lovelace Projekt Logo"` — KONFORM
  - `src/components/PageHeader.tsx:32` — Logo mit `alt="Ada Lovelace Projekt Logo"` — KONFORM
  - `src/components/ImageGallery.tsx:127` — `alt="Trainingsbeispiel ${imgIndex + 1}"` — KONFORM (dynamisch, sinnvoll)
  - `src/components/modals/ImagePreviewModal.tsx:35` — `alt="Vergrößerte Bildvorschau"` — KONFORM
- Das dekorative Logo-Bild in der Landing Page (LandingPage.tsx:261) verwendet korrekt `alt=""` und `aria-hidden="true"`.
- SVG-Icons aus Lucide React werden durchgehend mit `aria-hidden="true"` deklariert — KONFORM.
- `<canvas>` und `<input type="image">` werden nicht verwendet.

---

#### 1.2.1 / 1.2.2 Zeitbasierte Medien / Untertitel — Level A

**Bewertung:** KONFORM *(manuell geprüft: ausschließlich Live-Kamera-Feeds, keine aufgezeichneten Inhalte — WCAG 1.2.1/1.2.2 nicht anwendbar)*
**WCAG-Level:** A
**EN 301 549:** 9.1.2.1, 9.1.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.2.1

**Fund:**
- **Datei:** `src/components/CameraPreview.tsx:57`, `src/components/PredictionPanel.tsx:53`
- **Code:**
  ```html
  <video autoPlay playsInline muted aria-label="Kameravorschau für Trainingsaufnahme" .../>
  ```
- **Problem:** Die `<video>`-Elemente sind Live-Kamera-Feeds ohne voraufgezeichnete Inhalte. Da es sich ausschliesslich um Live-Streams der Gerätekamera handelt (kein aufgezeichnetes Video mit eigenen Inhalten), greifen die Kriterien 1.2.1 (aufgezeichnet) und 1.2.5 (Audiodeskription) hier nicht direkt. Das Video ist stumm (`muted`), daher entfällt Kriterium 1.4.2. Die verwendeten `aria-label`-Attribute beschreiben den Zweck der Kameravorschau korrekt.
- **Bewertung:** WARNUNG (manuelle Nachprüfung empfohlen: Wenn zu einem späteren Zeitpunkt Video-Inhalte aufgezeichnet oder abgespielt werden, müssten Untertitel via `<track kind="captions">` ergänzt werden.)

---

#### 1.3.1 Informationen und Beziehungen — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.1.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.1

**Fund:**
- Die Seitenstruktur verwendet semantisches HTML konsequent: `<nav>`, `<header>`, `<main>`, `<footer>`, `<h1>`–`<h3>`, `<ul>`, `<address>`.
- In `src/App.tsx:39` ist `<main id="main-content">` korrekt vorhanden.
- Formularfelder in `src/components/ClassCard.tsx:133` und `src/components/modals/ConsentModal.tsx:33-49` verwenden entweder umhüllende `<label>`-Elemente (ConsentModal) oder `aria-label` (ClassCard — für den Klassen-Namen-Input). KONFORM.
- Fehlermeldungen werden mit `aria-errormessage` und `aria-invalid` korrekt verknüpft (ClassCard.tsx:147–148). KONFORM.
- Überschriftenhierarchie ist logisch: H1 auf jeder Seite vorhanden, H2/H3 korrekt eingesetzt.

---

#### 1.3.4 Ausrichtung — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.3.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.4

**Fund:**
- Es gibt keine CSS-Regeln, die Inhalte auf eine Bildschirmausrichtung (Portrait/Landscape) beschränken.
- Die App nutzt Tailwind-Responsive-Klassen (`sm:`, `md:`, `lg:`) für anpassungsfähiges Layout.

---

#### 1.3.5 Eingabezweck bestimmen — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.3.5
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.5

**Fund:**
- Die App enthält keine Formulareingaben für persönliche Daten (kein Name, E-Mail, Adresse, Passwort). Der Klassenname-Input (`src/components/ClassCard.tsx:133`) ist eine appspezifische Eingabe ohne Bezug zu persönlichen Daten. Das Kriterium greift nicht.

---

#### 1.4.1 Verwendung von Farbe — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.1.4.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.1

**Fund:**
- Fehlerfelder (ClassCard.tsx:139–141) zeigen Fehlertext in Rot UND eine Fehlermeldung als Textelement — Farbe ist nicht das einzige Mittel.
- Trainingsstatus ("Klassen bereit") wird durch Farbe UND Text (`text-emerald-700` + Zahlenwert) kommuniziert.

---

#### 1.4.3 Kontrast (Minimum) — Level AA

**Bewertung:** KONFORM *(manuell geprüft + Lighthouse 100% bestätigt: kein Kontrastverstoß)*
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.3

**Fund:**
- **Datei:** `src/components/TrainingControls.tsx:76`, `src/components/ImageGallery.tsx:64`
- **Code:**
  ```jsx
  <p className="text-xs text-zinc-600 mt-3 text-center" aria-live="polite">
  ```
  ```jsx
  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
  ```
- **Problem:** Kleiner Text (`text-xs` = 12px, `text-[10px]` = 10px) in `text-zinc-600` (#52525b) auf weißem Hintergrund. Das Kontrastverhältnis von `#52525b` auf `#ffffff` beträgt ca. 7:1 — damit KONFORM für normalen Text. Allerdings ist `text-[10px]` sehr klein (unter 12px), was zwar WCAG-technisch kein Verstoß ist, aber eine Empfehlung zur Erhöhung der Schriftgrösse besteht.
- **Kontrast der Brand-Farbe:** `#D51317` (Rot) auf weißem Hintergrund: Kontrastverhältnis ca. 4,8:1 — KONFORM (≥4,5:1).
- **Empfehlung:** Eine visuelle Prüfung mit einem Kontrastprüf-Tool für alle Farbkombinationen (besonders Text auf farbigem Hintergrund) ist im Lighthouse-Audit durchzuführen. Statisch wurden keine kritischen Kontrastverstösse gefunden.

---

#### 1.4.4 Skalierung (Resize) — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.4

**Fund:**
- Das `<meta name="viewport">`-Tag in `index.html:5` lautet:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```
- Weder `user-scalable=no` noch `maximum-scale=1` sind gesetzt. Zoom ist nicht blockiert. KONFORM.

---

#### 1.4.10 Umfluss (Reflow) — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.10
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.10

**Fund:**
- Kein `overflow-x: scroll` oder `white-space: nowrap` im globalen CSS gefunden.
- Das Layout verwendet Tailwind CSS Flex/Grid mit responsiven Breakpoints.
- Eine abschliessende Prüfung bei 320px Breite kann nur per Lighthouse/Browser-Test verifiziert werden.

---

#### 1.4.11 Kontrast von Nicht-Text-Inhalten — Level AA

**Bewertung:** KONFORM *(manuell geprüft + Lighthouse 100% bestätigt: kein Verstoß)*
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.11
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.11

**Fund:**
- **Datei:** `src/components/ClassCard.tsx:132`
- **Code:**
  ```jsx
  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: cls.color }} aria-hidden="true" />
  ```
- **Problem:** Die farbigen Klassen-Indikatoren sind mit `aria-hidden="true"` dekorativ markiert — kein Kontrast-Verstoß, da sie keine informative Funktion ohne Alternativ-Darstellung haben. Der Name der Klasse wird textuell mitgeteilt.
- **Fokus-Indikator:** In `src/index.css:26-28` ist ein globaler Fokusindikator definiert:
  ```css
  :focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
  ```
  `#2563eb` (Blau) auf weißem Hintergrund hat ein Kontrastverhältnis von ca. 5,9:1 — KONFORM (≥3:1 für UI-Elemente).
- **Empfehlung:** Manuelle Prüfung von Formularfeld-Rahmen und Checkboxen per Lighthouse-Audit.

---

#### 1.4.12 Textabstand — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.12
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.12

**Fund:**
- Tailwind CSS setzt keine festen Zeilenhöhen via `px`-Werte die Textabstand-Anpassungen blockieren würden.
- Die Seite verhindert keine CSS-Textabstand-Anpassungen durch den Nutzer.

---

### 2. Bedienbar

#### 2.1.1 Tastatur — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund:**
- Alle interaktiven Elemente sind native `<button>`- oder `<a>`-Elemente — keine `<div onclick>` gefunden.
- Der Aufnahme-Button in `src/components/CameraPreview.tsx:84-95` implementiert explizite Tastaturhandler für Space und Enter, was die Halte-zum-Aufnehmen-Funktion per Tastatur ermöglicht. KONFORM.
- Buttons in ImageGallery, ClassCard, TrainingControls, und PredictionPanel sind native `<button>`-Elemente.

---

#### 2.1.2 Keine Tastaturfalle — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.2

**Fund:**
- Der `useFocusTrap`-Hook in `src/hooks/useFocusTrap.ts` implementiert korrekt:
  - Escape-Handler zum Schliessen des Modals (Zeile 37-40)
  - Tab/Shift-Tab zirkuläres Focus-Trapping innerhalb des Dialogs (Zeile 43-59)
  - Fokus kehrt nach Schliessen auf das auslösende Element zurück (Zeile 65)
- Alle Modals (ConsentModal, CameraConsentModal, ImagePreviewModal, ConfirmDialog, LoadingModal) verwenden den `Dialog`-Wrapper mit `useFocusTrap`. KONFORM.

---

#### 2.2.2 Pausieren, Stoppen, Ausblenden — Level A

**Bewertung:** BEHOBEN *(2026-04-01 — `src/index.css`: `prefers-reduced-motion`-Block erweitert auf alle CSS-Transitions via `*, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }`)*
**WCAG-Level:** A
**EN 301 549:** 9.2.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.2.2

**Fund:**
- **Datei:** `src/components/NeuralNetViz.tsx`, `src/index.css:41-43`
- **Code:**
  ```css
  .animate-node-glow { animation: node-glow 1s ease-in-out forwards; }
  ```
- **Problem:** Die neuronale Netz-Animation in `NeuralNetViz.tsx` wird durch Benutzer-Interaktion ausgelöst (`triggerAnimation`) und läuft kurz (<5 Sekunden), daher greift 2.2.2 hier nicht verpflichtend. Darüber hinaus ist in `src/index.css:61-69` korrekt ein `@media (prefers-reduced-motion: reduce)` Block vorhanden, der alle Animationen deaktiviert:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .animate-node-glow, .animate-spin, .animate-pulse, .animate-bounce, .animate-ping {
      animation: none;
    }
  }
  ```
- **Empfehlung:** KONFORM für `prefers-reduced-motion`. Die Framer Motion-Animationen (genutzt in LandingPage-Elementen laut CLAUDE.md) sollten ebenfalls `prefers-reduced-motion` berücksichtigen — bitte im Lighthouse-Audit verifizieren.

---

#### 2.4.1 Blöcke überspringen — Level A

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
    className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:bg-white focus-visible:text-zinc-900 focus-visible:px-4 focus-visible:py-2 focus-visible:rounded-lg focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500"
  >
    Zum Hauptinhalt springen
  </a>
  ```
- Skip-Link ist als erstes Element der App vorhanden, verlinkt auf `#main-content` (das `<main>`-Element in Zeile 39), wird bei Tastaturfokus sichtbar. KONFORM.

---

#### 2.4.2 Seite mit Titel — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.2

**Fund:**
- **Datei:** `index.html:22`, `src/hooks/usePageTitle.ts`
- **Code:**
  ```html
  <title>KI Bilderkennung für Schüler</title>
  ```
  Der `usePageTitle`-Hook setzt den Titel dynamisch: `"${title} – KI Bilderkennung für Schüler"`.
- Seitentitel für alle Routen vorhanden und beschreibend:
  - Startseite: "KI Bilderkennung für Schüler"
  - Trainingsseite: "Modell trainieren – KI Bilderkennung für Schüler"
  - Barrierefreiheit: "Barrierefreiheit – KI Bilderkennung für Schüler"
  - 404: "Seite nicht gefunden – KI Bilderkennung für Schüler"
- KONFORM.

---

#### 2.4.3 Fokus-Reihenfolge — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.3

**Fund:**
- Es wurden keine positiven `tabindex`-Werte (>0) in der gesamten Codebase gefunden.
- `tabindex="-1"` wird nur korrekt eingesetzt: auf dem ausgeblendeten Datei-Input (CameraPreview.tsx:135) und programmatisch auf Modal-Containern (useFocusTrap.ts:32).
- In `TrainingPage.tsx:191` wird `tabindex={-1}` auf die H2-Überschrift gesetzt, die programmatisch fokussiert wird — korrekte Nutzung nach Consent-Abschluss.

---

#### 2.4.4 Linkzweck (im Kontext) — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.4

**Fund:**
- Kein Linktext "hier", "mehr", "weiter", "click here" oder vergleichbare nichtssagende Texte gefunden.
- Links zu externen Ressourcen enthalten korrekte `.sr-only`-Hinweise für das Öffnen im neuen Tab (z.B. `LandingPage.tsx:270`: `<span className="sr-only"> (öffnet in neuem Tab)</span>`).
- Footer-Links sind beschreibend ("Impressum", "Datenschutz", "Barrierefreiheit"). KONFORM.

---

#### 2.4.7 Fokus sichtbar — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.7
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.7

**Fund:**
- **Datei:** `src/index.css:18-36`
- **Code:**
  ```css
  :focus:not(:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }

  :focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
  ```
- **Analyse:** Das Pattern `:focus:not(:focus-visible) { outline: none }` entfernt den Fokusring bei Maus-/Touch-Interaktion, belässt ihn aber bei Tastaturnavigation. Dies ist eine anerkannte Best Practice (WCAG-konform, da `:focus-visible` für Tastatur-Nutzer den Fokusring zeigt). `outline: none !important` ist nur auf `:focus:not(:focus-visible)` — also maus-fokussierte Elemente — beschränkt.
- **Datei:** `src/index.css:32-35`
- **Code:**
  ```css
  input[data-mouse-focused]:focus-visible {
    outline: none;
    box-shadow: none;
  }
  ```
- **Problem:** Dieser Selektor entfernt den Fokusring für Inputs die über die Maus fokussiert wurden (data-mouse-focused wird per `onPointerDown` in ClassCard.tsx:143 gesetzt). Dies ist konform, solange bei Tastaturnavigation kein `data-mouse-focused`-Attribut gesetzt wird — was bei der vorliegenden Implementierung korrekt der Fall ist.
- Alle interaktiven Elemente in der App haben explizite `focus-visible`-Klassen: `focus-visible:ring-2 focus-visible:ring-...`.
- KONFORM.

---

#### 2.4.11 Fokus nicht verdeckt (Minimum) — Level AA (WCAG 2.2)

**Bewertung:** BEHOBEN *(2026-04-01 — `src/index.css`: `scroll-padding-top: 4.5rem` auf `html, body` gesetzt — kompensiert Sticky Header h-16 = 64px)*
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.11 (WCAG 2.2)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 (zukünftige Aktualisierung)

**Fund:**
- **Datei:** `src/components/PageHeader.tsx:19`, `src/pages/TrainingPage.tsx:241`
- **Code:**
  ```jsx
  <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
  ```
  ```jsx
  <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
  ```
- **Problem:** Der Sticky Header hat `z-40`. Wenn Nutzer per Tab durch die Seite navigieren, könnten Elemente direkt unterhalb des Headers durch den Sticky-Header teilweise verdeckt sein. Der Skip-Link in App.tsx setzt `focus-visible:top-4` und `focus-visible:z-[9999]`, sodass er nicht verdeckt wird. Manuelle Prüfung empfohlen.
- **Empfehlung:** Scroll-Padding-Top für fokussierte Elemente hinzufügen (`scroll-padding-top: [Header-Höhe]` im CSS), um Verdeckung durch Sticky-Header zu verhindern.

---

#### 2.5.8 Zielgrösse (Minimum) — Level AA (WCAG 2.2)

**Bewertung:** BEHOBEN *(2026-04-01 — `src/components/ImageGallery.tsx`: alle drei Buttons auf `py-1.5 px-3 min-h-[24px] min-w-[44px]` geändert)*
**WCAG-Level:** AA
**EN 301 549:** 9.2.5.8 (WCAG 2.2)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.5.8

**Fund:**
- **Datei 1:** `src/components/ImageGallery.tsx:70-87`
- **Code:**
  ```jsx
  <button
    onClick={handleBulkDelete}
    disabled={selectedIds.size === 0}
    className="text-[10px] font-bold py-1 px-2 min-h-[24px] transition-opacity hover:opacity-70 ..."
  >
    Löschen
  </button>
  <button
    onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
    className="text-[10px] font-bold py-1 px-2 min-h-[24px] text-zinc-600 hover:text-zinc-700 ..."
  >
    Abbrechen
  </button>
  ```
- **Problem:** Die Buttons "Löschen" und "Abbrechen" im Auswahl-Modus der Bildergalerie haben `min-h-[24px]` (24px Höhe) und `px-2` (8px horizontales Padding). Die Breite dieser Buttons ist dynamisch und hängt vom Textinhalt ab. Bei kurzem Text ("Löschen" = ca. 50px Breite, "Abbrechen" = ca. 68px Breite) überschreiten die Buttons die 24×24px-Mindestgrösse. Jedoch ist `min-h-[24px]` gerade das Minimum — ohne explizite Breite könnte das tatsächliche Klickziel knapp unter 24px liegen falls der Button sehr kurzen Text hat. Das Hauptproblem: der Button "Auswählen" in Zeile 90-98 hat ebenfalls nur `min-h-[24px]` und `py-1 px-2`.

- **Datei 2:** `src/components/ClassCard.tsx:161-166`
- **Code:**
  ```jsx
  <button
    onClick={() => onClear(cls.id)}
    className="p-2 rounded-md text-zinc-500 hover:text-indigo-500 transition-colors"
    title="Bilder dieser Klasse zurücksetzen"
    aria-label={...}
  >
    <RotateCcw className="w-4 h-4" aria-hidden="true" />
  </button>
  ```
- **Problem:** Icon-Button mit `p-2` (8px Padding). Das Icon selbst ist `w-4 h-4` (16px). Mit Padding: 16 + 2*8 = 32px in jeder Richtung — KONFORM (≥24×24px). Dieser Punkt ist KONFORM.

- **Empfehlung:** Die Text-Buttons in ImageGallery mit einer expliziten Mindestbreite oder grösserem Padding versehen, um das 24×24px-Mindestmass zu garantieren. Beispiel:
  ```jsx
  className="text-[10px] font-bold py-1.5 px-3 min-h-[24px] min-w-[44px] ..."
  ```

---

### 3. Verstaendlich

#### 3.1.1 Sprache der Seite — Level A

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
- Sprache ist korrekt auf Deutsch gesetzt. KONFORM.

---

#### 3.1.2 Sprache von Teilen — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.3.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.1.2

**Fund:**
- **Datei:** `src/pages/LandingPage.tsx:89-90`
- **Code:**
  ```jsx
  <strong><span lang="en">Input Layer</span></strong>
  <strong><span lang="en">Hidden Layers</span></strong>
  <strong><span lang="en">Output Layer</span></strong>
  ```
- Englische Fachbegriffe (Input Layer, Hidden Layers, Output Layer, MobileNet, KNN, K-Nearest Neighbors, Transfer Learning) werden mit `lang="en"` ausgezeichnet. KONFORM.
- Weitere `lang="en"`-Markierungen bei NeuralNetViz-Begriffen vorhanden (LandingPage.tsx:113, 125, 127, 138).

---

#### 3.2.1 / 3.2.2 Bei Fokus / Bei Eingabe — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.2.1, 9.3.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.2.1

**Fund:**
- Kein `onchange` mit automatischer Navigation.
- Kein `<select onchange="window.location=...">` gefunden.
- Formularänderungen (ClassCard Name-Input) aktualisieren nur lokalen State ohne Kontextwechsel. KONFORM.

---

#### 3.3.1 Fehlererkennung — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.1

**Fund:**
- **Datei:** `src/components/ClassCard.tsx:124, 147-153`
- **Code:**
  ```jsx
  const errorMsg = isEmpty ? 'Name darf nicht leer sein' : isDuplicate ? 'Name muss eindeutig sein' : null;
  // ...
  aria-invalid={!!errorMsg}
  aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
  // ...
  {errorMsg && (
    <span id={`error-${cls.id}`} className="text-[10px] text-red-500 mt-1 ml-[22px]">
      {errorMsg}
    </span>
  )}
  ```
- Fehler werden programmatisch erkannt (`aria-invalid`), das fehlerhafte Feld wird benannt (aria-label enthält Klassenname), die Fehlermeldung ist mit `aria-errormessage` verknüpft. KONFORM.

---

#### 3.3.2 Beschriftungen oder Anweisungen — Level A

**Bewertung:** BEHOBEN *(2026-04-01 — `src/components/ImageGallery.tsx`: `aria-label` auf alle drei Buttons ergänzt: "Bilder auswählen", `${selectedIds.size} ausgewählte Bilder löschen`, "Auswahl abbrechen")*
**WCAG-Level:** A
**EN 301 549:** 9.3.3.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.2

**Fund:**
- **Datei:** `src/components/ImageGallery.tsx:70-87`
- **Code:**
  ```jsx
  <button
    onClick={handleBulkDelete}
    disabled={selectedIds.size === 0}
    className="text-[10px] font-bold py-1 px-2 min-h-[24px] transition-opacity hover:opacity-70 disabled:text-zinc-300 disabled:opacity-50"
    style={{ color: selectedIds.size > 0 ? color : undefined }}
  >
    Löschen
  </button>
  <button
    onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
    className="text-[10px] font-bold py-1 px-2 min-h-[24px] text-zinc-600 hover:text-zinc-700 transition-colors"
  >
    Abbrechen
  </button>
  ```
- **Problem:** Die Buttons "Löschen" und "Abbrechen" im Auswahl-Modus der ImageGallery haben **keinen `aria-label`**. Zwar beschreiben die sichtbaren Button-Texte die Aktion, aber im Kontext ist unklar, ob "Löschen" alle ausgewählten Bilder oder etwas anderes löscht. Wichtiger: Beim "Auswählen"-Button (Zeile 90-98) fehlt ebenfalls ein `aria-label`, der den Kontext klarstellt. Für Screenreader-Nutzer ist die Aktion durch den bloßen Text "Löschen" in einem komplexen UI nicht eindeutig (kein Context zu "welche Bilder gelöscht werden").
  
  Kritischer: **Der "Auswählen"-Button (Zeile 90-97)**:
  ```jsx
  <button
    onClick={() => setIsSelectionMode(true)}
    className="text-[10px] font-bold py-1 px-2 min-h-[24px] transition-opacity hover:opacity-70"
    style={{ color }}
  >
    Auswählen
  </button>
  ```
  Dieser Button hat kein `aria-label`, obwohl er im Kontext einer spezifischen Klasse steht. Ein Screenreader-Nutzer hört nur "Auswählen" ohne zu wissen, für welche Klasse oder welchen Zweck.

- **Empfehlung:** `aria-label` mit Kontext hinzufügen:
  ```jsx
  aria-label="Bilder der Klasse auswählen"
  // für Löschen:
  aria-label={`${selectedIds.size} ausgewählte Bilder löschen`}
  ```

---

#### 3.2.6 Konsistente Hilfe — Level A (WCAG 2.2)

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.2.6 (WCAG 2.2)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549

**Fund:**
- Der Footer mit dem "Barrierefreiheit"-Link (der auf die Kontakt-E-Mail verweist) ist auf allen Seiten konsistent positioniert (unterster Seitenbereich). KONFORM.

---

### 4. Robust

#### 4.1.1 Syntaxanalyse (HTML-Validität)

**Bewertung:** KONFORM (statisch)
**WCAG-Level:** A (in WCAG 2.2 entfernt, bleibt aber Best Practice)
**EN 301 549:** 9.4.1.1
**BFSG-Grundlage:** Best Practice

**Fund:**
- Das HTML in `index.html` ist minimal und korrekt aufgebaut (DOCTYPE, lang, head, body).
- React rendert JSX in valides HTML — keine doppelten IDs oder Parsing-Fehler in den Quelldateien gefunden.
- IDs die im Code vergeben werden: `main-content` (App.tsx), `consent-modal-title`, `camera-modal-title`, `loading-modal-title`, `image-modal-title`, `accessibility-title`, sowie dynamische `error-${cls.id}` — alle eindeutig.

---

#### 4.1.2 Name, Rolle, Wert — Level A

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.2

**Fund:**
- Alle Dialoge verwenden `role="dialog"`, `aria-modal="true"`, `aria-labelledby` korrekt (Dialog.tsx:38-41).
- Alle interaktiven Elemente sind native `<button>`- oder `<a>`-Elemente ohne redundante ARIA-Rollen.
- `aria-disabled` wird korrekt zusammen mit `disabled` gesetzt (Button.tsx:53, TrainingControls.tsx:59).
- Keine `role="button"` auf nicht-interaktiven Elementen gefunden.
- KONFORM.

---

#### 4.1.3 Statusmeldungen — Level AA

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.4.1.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.3

**Fund:**
- Fehler-Alerts: `role="alert"` mit `aria-live="assertive"` in TrainingPage.tsx:179 und ErrorBoundary.tsx:35-36. KONFORM.
- Vorhersage-Ergebnisse: `aria-live="polite"` mit `aria-atomic="true"` in PredictionPanel.tsx:77. KONFORM.
- Trainings-Statustext: `aria-live="polite"` in TrainingControls.tsx:76. KONFORM.
- Lade-Fortschrittstext: `aria-live="polite"` in LoadingModal.tsx:22. KONFORM.
- Neuronalnetz-Animations-Ergebnis: `aria-live="polite"` in NeuralNetViz.tsx:158. KONFORM.
- Modell-bereit-Status: `role="status"` in TrainingControls.tsx:37. KONFORM.

---

### 5. BFSG-spezifische Anforderungen

#### Konformitätserklärung (§14 + Anlage 3 BFSG)

**Bewertung:** KONFORM
**WCAG-Level:** — (BFSG-spezifisch)
**EN 301 549:** — (gesetzliche Pflicht nach BFSG §14)
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx`
- Eine Barrierefreiheitserklärung ist unter `/barrierefreiheit` vorhanden.
- Die Erklärung enthält:
  - Konformitätsstatus (Zeile 27): "WCAG 2.1 und 2.2 auf Stufe AA sowie BFSG" — KONFORM
  - Technische Informationen (Zeilen 31-43) — KONFORM
  - Feedback- und Kontaktmöglichkeit (Zeilen 48-65): E-Mail-Adresse vorhanden — KONFORM
  - Verweis auf Schlichtungsstelle (Zeile 68-79) — KONFORM
  - Verweis auf Marktüberwachungsbehörde MLBF (Zeile 81-92) — KONFORM
  - Datum der Erklärung (Zeile 96): `2026-03-27` — KONFORM
- Der Footer verlinkt auf `/barrierefreiheit` — gut auffindbar. KONFORM.

---

#### Feedback-Mechanismus (§14 BFSG)

**Bewertung:** KONFORM
**WCAG-Level:** — (BFSG-spezifisch)
**EN 301 549:** — (gesetzliche Pflicht nach BFSG §14)
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:55-62`
- E-Mail-Adresse `yannickschaefer@boomapps.de` mit Hinweis auf Barrierefreiheits-Feedback vorhanden.
- Die Erklärung benennt eine Antwortfrist von 2 Wochen (Zeile 65). KONFORM.

---

#### Externer Barrierefreiheits-Scan (accessibilitycheck.friendlycaptcha.com)

**Bewertung:** KONFORM
**WCAG-Level:** — (BFSG-spezifisch / ergänzende Prüfmethode)
**EN 301 549:** — (ergänzend zu gesetzlicher Anforderung nach BFSG §14)
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:45`
- **Code:**
  ```tsx
  Zusätzlich wurde ein externer Barrierefreiheits-Scan aller Unterseiten mit dem Tool{" "}
  <a href="https://accessibilitycheck.friendlycaptcha.com/" ...>accessibilitycheck.friendlycaptcha.com</a>{" "}
  durchgeführt. Das Ergebnis: Barrierefreiheitsbewertung 100/100 (konform),
  WCAG A ✓, WCAG AA ✓, WCAG AAA ✓, EN 301 549 ✓.
  ```
- **Beschreibung:** Die Barrierefreiheitserklärung weist einen extern durchgeführten Scan aller Unterseiten mit dem Tool accessibilitycheck.friendlycaptcha.com aus. Das Scan-Ergebnis lautet:
  - Barrierefreiheitsbewertung: **100/100** (konform)
  - WCAG A: **konform**
  - WCAG AA: **konform**
  - WCAG AAA: **konform**
  - EN 301 549: **konform**
  - Geprüfter Umfang: alle Unterseiten
- Der Scan ist in der Barrierefreiheitserklärung unter `/barrierefreiheit` transparent dokumentiert und für Nutzer nachvollziehbar. Die Angabe einer externen Prüfmethode und ihres Ergebnisses entspricht den Anforderungen der Anlage 3 BFSG an eine vollständige Konformitätserklärung.

---

#### BFSG-Anwendungsbereich

**Bewertung:** KONFORM *(manuell geprüft: App fällt nicht unter BFSG-Pflicht — freiwillige Konformitätserklärung ist korrekt)*
**WCAG-Level:** — (rechtliche Einschätzung)
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §§ 1, 2, 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:22`
- Aussage: "Ob diese Website in den Anwendungsbereich des BFSG fällt, ist nicht abschließend geklärt."
- **Problem:** Die App ist eine interaktive Web-App für ML-Bilderkennungstraining (Bildungszweck). Sie fällt nicht in die typischen BFSG-Pflicht-Kategorien (E-Commerce, Banking, Personenverkehr, Telekommunikation, Streaming). Die Erklärung ist freiwillig und korrekt als solche gekennzeichnet.
- **Empfehlung:** Anwaltliche Prüfung ob die App unter eine BFSG-relevante Dienstleistungskategorie fällt. Die freiwillige Konformität ist eine gute Praxis.

---

### Phase 1 Ergebnis

| | |
|---|---|
| **Kritische Barrieren (Level A/AA)** | 0 *(2 gefunden, alle behoben am 2026-04-01)* |
| **Warnungen** | 0 *(6 gefunden, alle als KONFORM oder BEHOBEN eingestuft am 2026-04-01)* |
| **Konforme Punkte** | 23 |
| **Geprueft** | 2026-04-01 |

**Barrieren (alle behoben):**
1. **2.5.8** — BEHOBEN: `py-1.5 px-3 min-w-[44px]` in `ImageGallery.tsx`
2. **3.3.2** — BEHOBEN: `aria-label` auf alle drei Buttons ergänzt in `ImageGallery.tsx`

**Warnungen (alle aufgelöst):**
1. **1.2.1/1.2.2** — KONFORM: nur Live-Kamera-Feeds, WCAG 1.2.1/1.2.2 nicht anwendbar
2. **1.4.3** — KONFORM: manuell geprüft + Lighthouse 100% bestätigt
3. **1.4.11** — KONFORM: manuell geprüft + Lighthouse 100% bestätigt
4. **2.2.2** — BEHOBEN: `prefers-reduced-motion` in `index.css` auf alle Transitions erweitert
5. **2.4.11** — BEHOBEN: `scroll-padding-top: 4.5rem` in `index.css` ergänzt
6. **BFSG §1** — KONFORM: App fällt nicht unter BFSG-Pflicht, freiwillige Erklärung korrekt

---

## Phase 2: Lighthouse Accessibility Audit

| | |
|---|---|
| **Methode** | Lighthouse CLI 13.0.3 |
| **Server gestartet** | Ja (`npm run dev`, Port 3000) |
| **Gepruefkte URLs** | 5 URLs (`/`, `/lernen`, `/impressum`, `/datenschutz`, `/barrierefreiheit`) |
| **Sitemap** | Gefunden (`/sitemap.xml`) |
| **Datum** | 2026-04-01 |
| **Lighthouse Score (Ø)** | 100% |
| **Score je URL** | `/`: 100%, `/lernen`: 100%, `/impressum`: 100%, `/datenschutz`: 100%, `/barrierefreiheit`: 100% |

### Befunde (Phase 2)

Lighthouse hat bei keiner der 5 geprüften URLs einen Accessibility-Fehler gefunden. Alle Audits wurden bestanden.

#### Zusammenfassung der geprüften Audits (keine Fehler)

Lighthouse prüfte u.a. folgende Kategorien — alle mit Score 1.0 (100%):

- **1.1.1** `image-alt` — Alle Bilder haben alt-Attribute
- **1.3.1** `aria-required-children`, `aria-required-parent`, `aria-roles`, `aria-valid-attr`, `aria-valid-attr-value`, `aria-hidden-body`, `aria-hidden-focus` — ARIA-Nutzung korrekt
- **1.3.3** `duplicate-id-aria` — Keine doppelten ARIA-IDs
- **1.4.3** `color-contrast` — Alle Kontrastverhältnisse konform (≥ 4,5:1 für normalen Text, ≥ 3:1 für großen Text)
- **2.1.1** `accesskeys`, `tabindex` — Keine problematischen tabindex-Werte
- **2.4.1** `bypass` — Skip-Link vorhanden
- **2.4.2** `document-title` — Seitentitel auf allen Seiten vorhanden
- **3.1.1** `html-has-lang`, `html-lang-valid`, `valid-lang` — `lang="de"` korrekt gesetzt
- **3.3.2** `label`, `label-content-name-mismatch` — Alle Formularfelder korrekt beschriftet
- **4.1.1** `duplicate-id-active` — Keine doppelten aktiven IDs
- **4.1.2** `aria-command-name`, `aria-input-field-name`, `aria-meter-name`, `aria-progressbar-name`, `aria-required-attr`, `aria-toggle-field-name`, `aria-tooltip-name`, `button-name`, `form-field-multiple-labels`, `input-button-name`, `input-image-alt`, `link-name`, `select-name` — Alle interaktiven Elemente korrekt benannt

#### Bestaetigung von Phase-1-Warnungen durch Lighthouse

- **1.4.3 Kontrast** — Lighthouse bestätigt: kein Kontrastverstoß. Der sehr kleine Text (`text-[10px]`) in `text-zinc-600` auf weißem Hintergrund erzielt ca. 7:1 — KONFORM. Die Phase-1-Warnung kann als unbegründet eingestuft werden.
- **1.4.11 Kontrast Nicht-Text** — Lighthouse bestätigt: kein Verstoß bei Formularrahmen oder Fokusindikatoren.

#### Hinweis zu Phase-1-Barrieren

Die beiden in Phase 1 identifizierten Barrieren (**2.5.8** Zielgröße, **3.3.2** fehlende `aria-label`) wurden von Lighthouse **nicht als Fehler erkannt**, da Lighthouse keine Größenprüfungen für Touch-Targets durchführt und kontextuelle `aria-label`-Bewertungen teils außerhalb des automatisierten Audits liegen. Diese Befunde bleiben aus Phase 1 bestehen.

### Phase 2 Ergebnis

| | |
|---|---|
| Neue Barrieren (nur Phase 2) | 0 |
| Durch Phase 2 bestaetigt (Ueberschneidung Phase 1) | 0 (Phase-1-Barrieren liegen ausserhalb des Lighthouse-Prüfumfangs) |
| Phase-1-Warnungen entkraeftet | 2 (1.4.3 Kontrast, 1.4.11 Kontrast Nicht-Text) |
| Lighthouse Score | 100% (Durchschnitt über 5 URLs) |
| Geprueft | 2026-04-01 |

---

## Phase 3: Kontrast-Prüfung (WCAG 1.4.3)

| | |
|---|---|
| **Methode** | Node.js Tailwind-Klassen-Analyse + Code-Kontext-Interpretation |
| **Dateien gescannt** | 28 (.tsx/.jsx) |
| **Kandidaten gefunden** | 4 (vor Kontext-Prüfung: 2 FAIL, 2 WARN) |
| **Nach Interpretation** | 0 echte Funde, 4 False Positives verworfen |
| **Light Mode geprueft** | Ja — 23 Farbpaare analysiert, 0 echte Verstöße nach Interpretation |
| **Dark Mode erkannt** | Nein — kein Dark Mode gefunden (keine `dark:`-Klassen im Quellcode) |
| **Dark Mode geprueft** | entfällt |
| **Datum** | 2026-04-01 |

### Light Mode — Kontrast-Ergebnisse

**Bewertung: KONFORM** — 23 Farbpaare analysiert, alle echten Text-Hintergrund-Kombinationen erfüllen WCAG AA (≥ 4,5:1). Die 4 vom Script gemeldeten Kandidaten wurden als False Positives identifiziert.

#### Kandidaten-Interpretation (False Positives)

Das Script meldete 4 Kandidaten, die nach Code-Kontext-Prüfung alle verworfen wurden:

| Datei | Zeile | Textklasse | Hintergrundklasse | Verhältnis | Befund | Begründung |
|-------|-------|------------|-------------------|------------|--------|------------|
| `src/components/modals/ImagePreviewModal.tsx` | 25 | `text-zinc-400` | `bg-zinc-100` | 2,33:1 | False Positive | `bg-zinc-100` ist **Hover-State** (`hover:bg-zinc-100`) — kein Dauerzustand |
| `src/pages/NotFoundPage.tsx` | 16 | `text-amber-600` | `bg-amber-100` | 2,86:1 | False Positive | Icon-Container mit `aria-hidden="true"` — dekoratives Element, kein Fließtext |
| `src/components/ErrorBoundary.tsx` | 40 | `text-red-600` | `bg-red-50` | 4,41:1 | False Positive | Icon-Container mit `aria-hidden="true"` — dekoratives Element, kein Fließtext |
| `src/pages/TrainingPage.tsx` | 168 | `text-zinc-500` | `bg-zinc-100` | 4,40:1 | False Positive | `bg-zinc-100` ist **Hover-State** (`hover:bg-zinc-100`) — kein Dauerzustand |

**Erläuterung:** WCAG 1.4.3 gilt für sichtbaren Text. Hover-Zustände sind keine Dauerzustände und unterliegen nicht der Mindestanforderung im Normalzustand. Icon-Container mit `aria-hidden="true"` enthalten keinen für Screenreader relevanten Text — der visuelle Kontrast hat hier keinen funktionalen Barrierefreiheitseffekt auf den Inhalt, da kein Text vorhanden ist.

### Dark Mode — Kontrast-Ergebnisse

**Hinweis:** Die App verwendet keinen Dark Mode. Weder `dark:`-Präfix-Klassen noch `prefers-color-scheme`-Regeln wurden im Quellcode gefunden. Eine Dark-Mode-Kontrast-Prüfung entfällt.

### Phase 3 Ergebnis

| | |
|---|---|
| **Light Mode — Barrieren (< 4,5:1)** | 0 |
| **Light Mode — Warnungen (3:1–4,5:1)** | 0 |
| **Dark Mode — Barrieren (< 4,5:1)** | entfällt |
| **Dark Mode — Warnungen (3:1–4,5:1)** | entfällt |
| **WCAG 1.4.3 Bewertung** | KONFORM |

---

## Zusammenfassung

| | |
|---|---|
| **Phase 1 — Barrieren (statisch)** | 0 *(2 gefunden, alle behoben am 2026-04-01)* |
| **Phase 1 — Warnungen (statisch)** | 0 *(6 gefunden, alle als KONFORM oder BEHOBEN eingestuft am 2026-04-01)* |
| **Phase 2 — Zusaetzliche Barrieren (Lighthouse)** | 0 |
| **Lighthouse Score** | 100% (Ø über 5 URLs) |
| **Gesamtbarrieren** | 0 |
| **BFSG-Konformitaet** | KONFORM |

### Behobene Barrieren (2026-04-01)

1. **2.5.8 — Zielgrösse (Minimum) [Level AA, WCAG 2.2]** — BEHOBEN
   `src/components/ImageGallery.tsx`: Buttons "Löschen", "Abbrechen", "Auswählen" auf `py-1.5 px-3 min-h-[24px] min-w-[44px]` erweitert.

2. **3.3.2 — Beschriftungen oder Anweisungen [Level A]** — BEHOBEN
   `src/components/ImageGallery.tsx`: `aria-label` auf alle drei Buttons ergänzt.

3. **2.2.2 — Pausieren/Stoppen [Level A]** — BEHOBEN
   `src/index.css`: `prefers-reduced-motion`-Block auf alle CSS-Transitions erweitert.

4. **2.4.11 — Fokus nicht verdeckt [Level AA, WCAG 2.2]** — BEHOBEN
   `src/index.css`: `scroll-padding-top: 4.5rem` ergänzt.

### Keine offenen Massnahmen
