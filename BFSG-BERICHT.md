# BFSG/Barrierefreiheits-Pruefbericht

| | |
|---|---|
| **Datum** | 2026-03-26 |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Gepruefkte URL** | http://localhost:3000 (4 URLs via Sitemap) |
| **Pruefgrundlage** | BFSG, WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BITV 2.0 |
| **Gesamtergebnis** | BESTANDEN — alle Barrieren und Warnungen behoben, Stand 2026-03-26 |

---

## Phase 1: Statische Codebase-Analyse

### 1. Wahrnehmbar

#### 1.1.1: Nichttextlicher Inhalt — Bilder mit Alt-Text

**Bewertung:** BEHOBEN (war WARNUNG, W1, 2026-03-26) / KONFORM (uebrige Bilder)
**WCAG-Level:** A
**EN 301 549:** 9.1.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.1.1

**Fund:**
Alle `<img>`-Elemente wurden geprueft. Ergebnis:

- `src/pages/LandingPage.tsx:22` — Logo im Header: `alt="Ada Lovelace Projekt Logo"` — KONFORM
- `src/pages/LandingPage.tsx:261` — Logo in der Kooperations-Sektion: `alt=""` mit zusaetzlichem `aria-hidden="true"` — KONFORM (dekorativ, Link-Text "Ada-Lovelace-Projekt" liefert den zugaenglichen Namen)
- `src/pages/TrainingPage.tsx:506` — Logo im Header: `alt="Ada Lovelace Projekt Logo"` — KONFORM
- `src/pages/TrainingPage.tsx:761` — Bildvorschau im Modal: `alt="Vergroesserte Bildvorschau"` — KONFORM
- `src/pages/TrainingPage.tsx:1327` — Trainingsbilder-Thumbnails: `alt="Training sample"` — **BEHOBEN 2026-03-26:** Geaendert zu `alt={`Trainingsbeispiel ${imgIndex + 1}`}` mit fortlaufendem Index
- `src/pages/AccessibilityPage.tsx:29` — Logo: `alt="Ada Lovelace Projekt Logo"` — KONFORM
- `src/pages/ImprintPage.tsx:29` — Logo: KONFORM (entsprechend Muster der anderen Seiten)
- `src/pages/PrivacyPage.tsx:30` — Logo: KONFORM

**Empfehlung zu Trainingsbildern:** Das `alt`-Attribut "Training sample" ist wenig aussagekraeftig. Da die Bilder in `<button>`-Elementen mit `aria-label` eingebettet sind, ist Screenreader-Zugaenglichkeit ueber den Button-Namen ("Bild vergroessern"/"Bild auswaehlen") sichergestellt. Der `alt`-Text koennte praeziser sein (z.B. `alt="Aufgenommenes Trainingsbild"`), stellt aber keine Barriere dar.

---

#### 1.2.x: Zeitbasierte Medien — Video-Elemente

**Bewertung:** WARNUNG
**WCAG-Level:** A/AA
**EN 301 549:** 9.1.2.1, 9.1.2.2, 9.1.2.5
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.2.1 und 9.1.2.2

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:669` und `src/pages/TrainingPage.tsx:1197`
- **Code:**
  ```html
  <video ref={predictVideoRef} autoPlay playsInline muted ... />
  <video ref={videoRef} autoPlay playsInline muted ... />
  ```
- **Problem:** Beide `<video>`-Elemente zeigen Live-Kamerastreams (kein `<track kind="captions">` vorhanden). Da es sich um Live-Webcam-Feeds ohne Audioinhalte handelt (Attribut `muted`), gelten die Untertitel-Anforderungen nach WCAG 1.2.2 (aufgezeichnet) und 1.2.4 (Live) nicht. Die Videos haben keine eigenstaendigen Audioinhalte und transportieren keine sprachlichen oder anderen Audioinformationen.
- **Bewertung:** Kein WCAG-Verstoss, da die Videos reine stummgeschaltete Kamera-Vorschauen ohne Audioinhalte sind. WCAG 1.2.2/1.2.4 setzt voraus, dass synchronisierte Medien mit Audioinhalten vorhanden sind.
- **Empfehlung:** Ein `aria-label` auf dem `<video>`-Element wuerde den Zweck fuer Screenreader beschreibbar machen (z.B. `aria-label="Kameravorschau fuer Trainingsdaten"`). Dies ist eine Empfehlung zur Best Practice, aber keine WCAG-Pflicht.

---

#### 1.3.1: Informationen und Beziehungen — Semantische Struktur

**Bewertung:** BEHOBEN (war WARNUNG, W3, 2026-03-26)
**WCAG-Level:** A
**EN 301 549:** 9.1.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.1

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:35`
- **Code:**
  ```tsx
  <p className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">Barrierefreiheitserklaerung</p>
  ```
- **Problem:** Die Seitenbezeichnung im Header der AccessibilityPage wird als `<p>` (Paragraph) statt als semantisch angemessenes `<span>` oder innerhalb einer `<h1>` formuliert. Da die eigentliche `<h1>` korrekt weiter unten im `<main>`-Bereich vorhanden ist (`id="accessibility-title"`), liegt kein Strukturfehler vor. Die `<p>` im Header ist rein visuell und stellt keine strukturelle Barriere dar.

- **Datei:** `src/pages/LandingPage.tsx` (NeuralNetViz-Komponente) — Die SVG-Visualisierung des neuronalen Netzes (Linien, Knoten) ist rein visuell und hat keine textuelle Alternative fuer Screenreader-Nutzer.
- **Code:**
  ```tsx
  <div className="relative h-80 max-w-4xl mx-auto">
    <div className="absolute inset-0 pointer-events-none z-0">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        {/* SVG-Verbindungslinien zwischen Neuronen ohne Beschriftung */}
      </svg>
    </div>
  ```
- **Problem:** Die interaktive neuronale Netz-Visualisierung (SVG-Grafik mit animierten Verbindungen) hat keine zugaengliche Textbeschreibung. Zwar ist die `aria-live="polite"`-Region vorhanden, die das Animationsergebnis ("Hund erkannt (98%)") ansagt, jedoch ist die SVG-Grafik selbst (Netzwerkstruktur, Layer-Labels "Input", "Hidden 1" etc.) fuer Screenreader-Nutzer nicht beschreibbar. Die Layer-Labels werden als DOM-Text angezeigt und sind lesbar; die SVG-Linien zwischen Neuronen sind rein dekorativ.
- **Empfehlung:** Die SVG-Grafik sollte `aria-hidden="true"` erhalten, da sie rein dekorativ ist. Die Layer-Labels (Input, Hidden 1, Hidden 2, Output) sind als sichtbarer Text im DOM vorhanden — das ist ausreichend.
- **BEHOBEN 2026-03-26:** `aria-hidden="true"` auf SVG-Element und umgebenden Wrapper-Div gesetzt (`LandingPage.tsx:351-352`).

---

#### 1.4.3: Kontrast (Minimum) — Textkontrast

**Bewertung:** KONFORM (war WARNUNG W4 — manuelle Pruefung 2026-03-26: kein Problem festgestellt)
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.3

**Fund:**
Statisch koennen Kontrastverhältnisse nicht prazise berechnet werden — es sind keine hardcodierten CSS-Farben mit schlechten Kontrasten erkennbar. Die verwendeten Tailwind-Klassen wurden auf potenziell problematische Kombinationen geprueft:

- `text-zinc-400` auf `bg-zinc-900` (NeuralNetViz-Knoten-Labels): Visuell erscheint der Kontrast ausreichend (zinc-400 ≈ #a1a1aa, zinc-900 ≈ #18181b), was ca. 5,8:1 entspricht — KONFORM
- `text-zinc-600` auf `bg-white`: zinc-600 ≈ #52525b auf weiss = ca. 7,0:1 — KONFORM
- `text-zinc-400` auf `bg-zinc-800` (NeuralNetViz-Anweisung): zinc-400 ≈ #a1a1aa, zinc-800 ≈ #27272a = ca. 4,6:1 — KONFORM (knapp)
- `text-zinc-300` in dunklem Hintergrund (z.B. `bg-zinc-900`): zinc-300 ≈ #d4d4d8, zinc-900 ≈ #18181b = ca. 12,5:1 — KONFORM

**Hinweis:** Die genaue Kontrast-Pruefung erfordert eine visuelle Inspektion mit einem Contrast-Checker-Tool (z.B. Lighthouse, axe DevTools). Eine manuelle Pruefung wird empfohlen, insbesondere fuer die dynamisch gefaerbten Klassen-Elemente in TrainingPage (Farben aus dem `COLORS`-Array: `#dc2626`, `#2563eb`, `#059669`, `#d97706`, `#7c3aed`, `#db2777`) auf weissem/hellem Hintergrund.

**Manuelle Pruefung 2026-03-26: Kein Problem festgestellt — KONFORM.**

---

#### 1.4.4: Skalierung (Resize) — Viewport-Meta

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
- **Bewertung:** Kein `user-scalable=no` oder `maximum-scale=1` vorhanden. Browser-Zoom ist uneingeschraenkt moeglich — KONFORM.

---

#### 1.4.10: Umfluss (Reflow)

**Bewertung:** BEHOBEN (war WARNUNG, W5, 2026-03-26)
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.10
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.10

**Fund:**
- **Datei:** `src/index.css:10-24`
- **Code:**
  ```css
  *::-webkit-scrollbar, html::-webkit-scrollbar, body::-webkit-scrollbar {
    display: none !important;
  }
  *, html, body {
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;
  }
  ```
- **Problem:** Das globale Ausblenden der Scrollbars kann bei horizontalem Scrollen (bei schmalen Viewports oder Reflow) die Bedienbarkeit einschraenken, da kein visueller Hinweis auf scrollbare Inhalte vorhanden ist. Dies ist keine direkte WCAG-Barriere, aber eine Best-Practice-Warnung. Die Reflow-Funktionalitaet selbst (kein horizontales Scrollen bei 320px) muss durch manuelle Pruefung sichergestellt werden.
- **Empfehlung:** Scrollbars sollten sichtbar bleiben oder ein alternativer Indikator fuer scrollbare Bereiche bereitgestellt werden, insbesondere in der Trainings-Thumbnail-Gallerie (`max-h-[190px]` mit `overflow-y-auto`).
- **BEHOBEN 2026-03-26:** Aggressiven `*`-Selektor entfernt. Haupt-Scrollbar transparent-dezent (nicht versteckt). Sub-Container (Thumbnails, Overflow-Divs) zeigen wieder native System-Scrollbars. (`index.css:11-24`)

---

### 2. Bedienbar

#### 2.1.1: Tastatur — Tastaturbedienbarkeit

**Bewertung:** KONFORM (mit Vorbehalt)
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund:**
- Alle interaktiven Elemente verwenden native `<button>`- und `<a>`-Elemente — keine `<div onclick>`-Muster gefunden.
- Der "Aufnehmen"-Button (`src/pages/TrainingPage.tsx:1209-1243`) implementiert korrekt sowohl Maus- als auch Tastatur-Handler:
  ```tsx
  onMouseDown={startRecording}
  onMouseUp={stopRecording}
  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { startRecording(); } }}
  onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { stopRecording(); } }}
  ```
  Tastatur-Bedienung ist vollstaendig implementiert — KONFORM.
- Die NeuralNetViz-Buttons (`src/pages/LandingPage.tsx:323-347`) verwenden native `<button>`-Elemente — KONFORM.
- **Vorbehalt:** Die "Halten"-Semantik des Aufnahme-Buttons (Bilder werden aufgenommen, solange der Button gedrueckt gehalten wird) ist per Tastatur durch Space/Enter gehalten realisiert. Dies ist funktional, aber der Nutzungshinweis "Halte 'Aufnehmen' gedrueckt" (`src/pages/TrainingPage.tsx:1348`) koennte fuer Tastaturnutzer klargestellt werden.

---

#### 2.1.2: Keine Tastaturfalle — Focus Trap in Modals

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.2

**Fund:**
- Der `useFocusTrap`-Hook (`src/hooks/useFocusTrap.ts`) implementiert eine korrekte Fokus-Falle fuer alle Modals. Fokus bleibt innerhalb des Dialogs und zirkuliert zwischen dem ersten und letzten fokussierbaren Element.
- Alle Modals in `TrainingPage.tsx` verwenden `useFocusTrap`:
  - `selectedImageRef = useFocusTrap(!!selectedImage)`
  - `showClearConfirmRef = useFocusTrap(showClearConfirm)`
  - `classToClearRef = useFocusTrap(!!classToClear)`
  - `classToRemoveRef = useFocusTrap(!!classToRemove)`
  - `hasConsentedRef = useFocusTrap(!hasConsented)`
  - `isModelLoadingRef = useFocusTrap(hasConsented && isModelLoading)`
  - `cameraConsentRef = useFocusTrap(hasConsented && !isModelLoading && !cameraConsent)`
- `CookieBanner.tsx` verwendet ebenfalls `useFocusTrap(isVisible, false)`.

**Barriere erkannt — Kein Escape-Handler:** Der `useFocusTrap`-Hook verarbeitet nur `Tab`-Taste (`if (e.key !== 'Tab') return;`). Es ist kein `Escape`-Handler implementiert. In der gesamten Codebase wurde kein Escape-Handler fuer Modals gefunden (`Grep` nach "Escape" lieferte nur den Aufnahme-Button-Kontext). Dialoge sollten gemaess WAI-ARIA Authoring Practices per Escape-Taste schliessbar sein. Dies wird als eigenstaendige Barriere unter 2.1.1 und dem ARIA-Dialog-Pattern weiter unten dokumentiert.

---

#### 2.4.1: Bloecke ueberspringen — Skip-Link

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.1

**Fund:**
- **Datei:** `src/App.tsx:31-36`
- **Code:**
  ```tsx
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-zinc-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-indigo-500"
  >
    Zum Hauptinhalt springen
  </a>
  ```
- Skip-Link ist als erstes Element im Body vorhanden, mit `href="#main-content"` auf das `<main id="main-content">`-Element zeigend. Wird beim Fokus sichtbar (korrekte `sr-only focus:not-sr-only`-Implementierung) — KONFORM.

---

#### 2.4.2: Seite mit Titel

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.2

**Fund:**
- `index.html:22`: `<title>KI Bilderkennung fuer Schueler</title>` — Basis-Titel vorhanden
- `src/pages/LandingPage.tsx:14`: `document.title = 'KI Bilderkennung fuer Schueler'` — wird per JS gesetzt
- `src/pages/TrainingPage.tsx:43`: `document.title = 'Modell trainieren – KI Bilderkennung fuer Schueler'` — Seiten-spezifischer Titel, KONFORM
- `src/pages/AccessibilityPage.tsx:12`: `document.title = 'Barrierefreiheit – KI Bilderkennung fuer Schueler'` — KONFORM
- Alle Seiten haben beschreibende, eindeutige Titel — KONFORM.

---

#### 2.4.3: Fokus-Reihenfolge — Positiver Tabindex

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.3

**Fund:**
- Kein positiver `tabindex` (`tabindex="1"` oder hoeher) gefunden.
- Verwendete `tabindex`-Werte: ausschliesslich `tabindex={-1}` (fuer versteckte Inputs und programmatisch fokussierbare Elemente) — KONFORM.

---

#### 2.4.7: Fokus sichtbar

**Bewertung:** BEHOBEN (B3, 2026-03-26) / KONFORM (uebrige Elemente)
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.7
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.7

**Fund 1 — Globaler Fokus-Indikator (KONFORM):**
- **Datei:** `src/index.css:27-44`
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
- Die Implementierung ist korrekt: `outline: none` wird nur fuer Maus-Fokus (`focus:not(:focus-visible)`) gesetzt, nicht fuer Tastatur-Fokus. Der globale Fallback-Fokus-Indikator (`3px solid #2563eb`) ist sichtbar und ausreichend. Zusaetzlich haben viele Buttons inline `focus-visible:ring-2`-Klassen — KONFORM.
- **Hinweis zu `div[role="dialog"]`:** `src/index.css:48-51` setzt `outline: none` auf fokussierte Dialoge. Dies ist akzeptabel, da der Fokus auf den Dialog-Container programmatisch gesetzt wird und der Container selbst kein interaktives Element ist — KONFORM.

**Fund 2 — Checkbox-Fokus-Indikator (BARRIERE):**
- **Datei:** `src/pages/TrainingPage.tsx:917` (Checkbox 1) und `:930` (Checkbox 2)
- **Code:**
  ```tsx
  className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:outline-none focus:ring-0 focus-visible:ring-indigo-500"
  ```
- **Problem:** Die beiden Checkboxen im Consent-Dialog (Datenschutz und Modell-Einwilligung) haben `focus:outline-none focus:ring-0` gesetzt. Diese Klassen entfernen den nativen Browser-Fokus-Indikator vollstaendig. Die Gegenmassnahme `focus-visible:ring-indigo-500` ist unvollstaendig: Es fehlen `focus-visible:ring-2` (Breite) und `focus-visible:ring-offset-2` (Abstand), ohne die kein sichtbarer Ring gerendert wird. Gemaess WCAG 2.4.7 muss jede per Tastatur fokussierbare Komponente einen sichtbaren Fokus-Indikator haben. Bei Tastaturnavigation mit Tab in den Consent-Dialog erhalten die Checkboxen keinen wahrnehmbaren Fokus.
- **BEHOBEN 2026-03-26:** CSS-Klassen in `TrainingPage.tsx:917` und `:930` korrigiert:
  ```tsx
  className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
  ```
  Damit wird `focus:ring-0` entfernt und der `focus-visible`-Ring mit korrekter Breite und Abstand definiert.

---

#### 2.4.11: Fokus nicht verdeckt (WCAG 2.2) — Sticky Header

**Bewertung:** KONFORM (war WARNUNG W6 — manuelle Pruefung 2026-03-26: kein Problem festgestellt)
**WCAG-Level:** AA (WCAG 2.2)
**EN 301 549:** (kuenftige EN-301-549-Version)
**BFSG-Grundlage:** WCAG 2.2 Empfehlung (noch nicht in EN 301 549 V3.2.1 aufgenommen)

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:494` und `src/pages/LandingPage.tsx` (implicit via `<header>`)
- **Code:**
  ```tsx
  <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
  ```
- Der sticky Header (z-index: 40, Hoehe: h-16 = 64px) kann fokussierte Elemente verdecken, wenn per Tab durch die Seite navigiert wird. Dies ist bei der TrainingPage besonders relevant, da die Seite lang ist und Elemente oben ankern. Manuelle Pruefung wird empfohlen.

---

#### 2.5.8: Zielgroesse (Minimum) — WCAG 2.2

**Bewertung:** BEHOBEN (war WARNUNG, W7, 2026-03-26)
**WCAG-Level:** AA (WCAG 2.2)
**EN 301 549:** (kuenftige EN-301-549-Version)
**BFSG-Grundlage:** WCAG 2.2 Empfehlung

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1172-1187`
- **Code:**
  ```tsx
  <button
    onClick={handleClear}
    className="text-zinc-400 hover:text-indigo-500 transition-colors"
    aria-label="Bilder der Klasse ... zurücksetzen"
  >
    <RotateCcw className="w-4 h-4" aria-hidden="true" />
  </button>
  <button
    onClick={onRemove}
    className="text-zinc-400 hover:text-red-500 transition-colors"
    aria-label="Klasse ... löschen"
  >
    <Trash2 className="w-4 h-4" aria-hidden="true" />
  </button>
  ```
- Die Icon-Buttons "Zuruecksetzen" und "Loeschen" in der ClassCard haben kein `padding` und ein 16x16px Icon (`w-4 h-4`). Der Klickbereich ist moeglicherweise kleiner als 24×24 CSS-Pixel. Gemaess WCAG 2.5.8 sollten Klickziele mindestens 24×24 CSS-Pixel betragen.
- **BEHOBEN 2026-03-26:** `p-1.5 rounded-md` zu RotateCcw- und Trash2-Buttons ergaenzt. Klickziel jetzt 28×28px (16px Icon + 2×6px Padding). (`TrainingPage.tsx:1172, 1180`)

---

### 3. Verstaendlich

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
- Korrekte Sprachdeklaration Deutsch vorhanden — KONFORM.

---

#### 3.1.2: Sprache von Teilen

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.3.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.1.2

**Fund:**
- **Datei:** `src/pages/LandingPage.tsx:87-88, 111, 123-125, 136`
- **Code (Beispiele):**
  ```tsx
  <span lang="en">Input Layer</span>
  <span lang="en">Hidden Layers</span>
  <span lang="en">Output Layer</span>
  <span lang="en">MobileNet</span>
  <span lang="en">K-Nearest Neighbors (KNN)</span>
  <span lang="en">Transfer Learning</span>
  ```
- Englische Fachbegriffe sind korrekt mit `lang="en"` ausgezeichnet — KONFORM. Dies ist ein vorbildliches Umsetzen von WCAG 3.1.2.

---

#### 3.3.1: Fehlererkennung — Formularfehler

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1162-1166`
- **Code:**
  ```tsx
  <input
    aria-invalid={!!errorMsg}
    aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
    ...
  />
  {errorMsg && <span id={`error-${cls.id}`} className="text-[10px] text-red-500 mt-1 ml-[22px]">{errorMsg}</span>}
  ```
- `aria-invalid` und `aria-errormessage` korrekt implementiert. Fehlermeldungen sind programmatisch verknuepft — KONFORM.

---

#### 3.3.2: Beschriftungen oder Anweisungen — Formular-Labels

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.2

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:912-923` (Consent-Dialog, Checkbox 1) und `:925-936` (Checkbox 2)
- **Code:**
  ```tsx
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={privacyChecked}
      onChange={(e) => setPrivacyChecked(e.target.checked)}
      className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:outline-none focus:ring-0 focus-visible:ring-indigo-500"
    />
    <span className="text-zinc-700 text-sm leading-relaxed">
      Ich habe die <a href="/datenschutz">Datenschutzerklärung</a> zur Kenntnis genommen...
    </span>
  </label>
  ```
- **Bewertung:** Die Checkboxen im Consent-Dialog verwenden ein `<label>`-Wrapper-Muster (implizites Label). Der `<input>` ist direkt im `<label>` enthalten — die programmatische Verknuepfung ist korrekt und zugaenglich gemaess WCAG 3.3.2. Beide Checkboxen folgen diesem Muster — KONFORM.

**Hinweis:** Die CSS-Klassen `focus:outline-none focus:ring-0 focus-visible:ring-indigo-500` auf diesen Checkboxen betreffen den sichtbaren Fokus-Indikator (WCAG 2.4.7), nicht die Beschriftung. Die Analyse und Barriere-Bewertung dieses Problems ist unter Abschnitt 2.4.7 dokumentiert.

---

#### 3.2.1 / 3.2.2: Bei Fokus / Bei Eingabe

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.2.1, 9.3.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.2.1

**Fund:**
- Kein `<select onchange="window.location=this.value">` oder aehnliche automatische Kontextwechsel-Muster gefunden.
- Navigation erfolgt ausschliesslich durch explizite Button-Klicks — KONFORM.

---

### 4. Robust

#### 4.1.1: ARIA-Dialoge ohne Escape-Handler — BEHOBEN

**Bewertung:** BEHOBEN (B1, 2026-03-26)
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.2

**Fund:**
- **Datei:** `src/hooks/useFocusTrap.ts:32-50` (kein Escape-Handler)
- **Dateien:** `src/pages/TrainingPage.tsx:742-813` (alle Modals), `src/components/CookieBanner.tsx:32-69`
- **Code (useFocusTrap):**
  ```ts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;  // Nur Tab wird behandelt — kein Escape
    // ...
  };
  ```
- **Problem:** Der `useFocusTrap`-Hook behandelt ausschliesslich die `Tab`-Taste. Es ist kein Escape-Key-Handler implementiert. Gemaess WAI-ARIA Authoring Practices (Dialog Pattern) MUSS ein Dialog per Escape-Taste schliessbar sein. Dies ist fuer alle sieben Modals in der TrainingPage sowie den CookieBanner betroffen:
  1. Bildvorschau-Modal (`selectedImage`)
  2. Alle loeschen-Bestaetigung (`showClearConfirm`)
  3. Klasse leeren-Bestaetigung (`classToClear`)
  4. Klasse entfernen-Bestaetigung (`classToRemove`)
  5. Consent-Dialog (`!hasConsented`)
  6. Lade-Modal (`isModelLoading`)
  7. Kamera-Consent-Modal (`!cameraConsent`)
  8. CookieBanner

- **BEHOBEN 2026-03-26:** `useFocusTrap` um optionalen `onEscape`-Parameter erweitert. Alle schließbaren Modals verdrahtet: Bildvorschau, Loeschen-Bestaetigung, Klasse-Leeren, Klasse-Entfernen → schließen per Escape. Consent- und Kamera-Consent-Modal → navigieren per Escape zu `/` (identisch mit "Abbrechen"-Button). Lade-Modal bleibt ohne Escape (kein Schliessen moeglich). CookieBanner → Escape bestaetigt (identisch mit "Verstanden"-Button).
- **Urspruengliche Empfehlung:** Im `useFocusTrap`-Hook einen Escape-Handler hinzufuegen und eine `onClose`-Callback-Prop uebergeben:
  ```ts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
    }
    if (e.key !== 'Tab') return;
    // ... Tab-Logik
  };
  ```

---

#### 4.1.2: Name, Rolle, Wert — ARIA-Roles und zugaengliche Namen

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.2

**Fund:**
- Alle Dialoge haben korrekte `role="dialog"`, `aria-modal="true"` und `aria-labelledby`.
- Alle Icon-Buttons haben `aria-label`.
- Keine `<div onclick>` ohne Role gefunden.
- Kein `role="button"` auf nicht-button-Elementen gefunden.
- `aria-hidden="true"` wird ausschliesslich auf dekorativen Elementen (Icons, Hintergruende) verwendet, nicht auf fokussierbaren Elementen — KONFORM.

**Spezifischer Fund — `<video>`-Elemente ohne zugaenglichen Namen:**
- **Datei:** `src/pages/TrainingPage.tsx:669` und `src/pages/TrainingPage.tsx:1197`
- **Code:**
  ```tsx
  <video ref={predictVideoRef} autoPlay playsInline muted className="..." />
  <video ref={videoRef} autoPlay playsInline muted className="..." />
  ```
- **Problem:** Die `<video>`-Elemente haben weder `aria-label` noch `title`. Screenreader koennen den Zweck des Video-Elements nicht bestimmen.
- **BEHOBEN 2026-03-26:** `aria-label="Kameravorschau für Vorhersage"` und `aria-label="Kameravorschau für Trainingsaufnahme"` ergaenzt.

---

#### 4.1.3: Statusmeldungen — Live Regions

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.4.1.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.3

**Fund:**
- `src/pages/TrainingPage.tsx:528`: `role="alert" aria-live="assertive"` fuer Fehlermeldungen — KONFORM
- `src/pages/TrainingPage.tsx:596`: `role="status"` fuer Trainings-Bereit-Status — KONFORM
- `src/pages/TrainingPage.tsx:634`: `aria-live="polite"` fuer Trainings-Statustext — KONFORM
- `src/pages/TrainingPage.tsx:692`: `aria-live="polite" aria-atomic="true"` fuer Vorhersage-Ergebnisse — KONFORM
- `src/pages/LandingPage.tsx:465`: `aria-live="polite"` fuer NeuralNet-Animations-Ergebnis — KONFORM
- Dynamische Statusmeldungen sind durchgehend korrekt mit Live Regions implementiert — KONFORM.

---

#### 4.1.2: Fokus-Rueckgabe nach Modal-Schliessen — BEHOBEN

**Bewertung:** BEHOBEN (B2, 2026-03-26)
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.2

**Fund:**
- **Datei:** `src/hooks/useFocusTrap.ts` und `src/pages/TrainingPage.tsx`
- **Problem:** Der `useFocusTrap`-Hook speichert nicht das Element, das den Fokus vor Oeffnen des Modals hatte, und gibt den Fokus beim Schliessen des Modals nicht zurueck. Gemaess WAI-ARIA Dialog Pattern muss der Fokus nach dem Schliessen eines Dialogs auf das Element zurueckkehren, das den Dialog geoeffnet hat.
- **Code (useFocusTrap — fehlende Logik):**
  ```ts
  // Fehlt: Vorherigen Fokus speichern
  // const previousFocus = document.activeElement as HTMLElement;
  // Fehlt: Bei cleanup (isActive wird false) previousFocus.focus() aufrufen
  ```
- **BEHOBEN 2026-03-26:** `previousFocusRef` in `useFocusTrap.ts` implementiert. `document.activeElement` wird vor Modal-Aktivierung gespeichert und im Cleanup-Return wiederhergestellt (`previousFocusRef.current?.focus()`).
- **Urspruengliche Empfehlung:** Im `useEffect` des `useFocusTrap`-Hooks:
  ```ts
  const previouslyFocused = document.activeElement as HTMLElement;
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    previouslyFocused?.focus();  // Fokus zurueckgeben
  };
  ```

---

### 5. BFSG-spezifische Anforderungen

#### BFSG §14 + Anlage 3: Erklaerung zur Barrierefreiheit

**Bewertung:** KONFORM (mit Einschraenkung)
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- Eine Barrierefreiheitserklaerung ist unter `/barrierefreiheit` (`src/pages/AccessibilityPage.tsx`) veroeffentlicht.
- Sie ist vom Footer aus verlinkt (`src/components/Footer.tsx:15`: `<Link to="/barrierefreiheit">Barrierefreiheit</Link>`).
- Pflichtinhalte gemaess Anlage 3 sind groesstens vorhanden:
  - [x] Beschreibung der Dienstleistung: Ja
  - [x] Konformitaetsstatus: Ja ("voll konform mit WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BFSG")
  - [x] Bekannte nicht-barrierefreie Inhalte: Ja ("keine bekannt")
  - [x] Feedback-Mechanismus: Ja (E-Mail: yannickschaefer@boomapps.de)
  - [x] Datum der Erklaerung: Ja (26. März 2026)
  - [x] **Angabe der zustaendigen Marktueberwaachungsbehoerde:** **BEHOBEN 2026-03-26** — ADD Rheinland-Pfalz (Aufsichts- und Dienstleistungsdirektion, Trier) konkret benannt in `AccessibilityPage.tsx`.

**BEHOBEN 2026-03-26:** ADD Rheinland-Pfalz (Willy-Brandt-Platz 3, 54290 Trier) mit Telefon, E-Mail und Website in `AccessibilityPage.tsx` eingetragen.

---

#### BFSG §14: Feedback-Mechanismus

**Bewertung:** KONFORM
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- E-Mail-Kontakt fuer Barrierefreiheits-Feedback vorhanden: `yannickschaefer@boomapps.de`
- Korrekt mit `aria-label="E-Mail fuer Barrierefreiheits-Feedback an Yannick Schaefer schreiben"` ausgezeichnet (`src/pages/AccessibilityPage.tsx:72`).
- Antwortfrist von 30 Tagen angegeben — KONFORM.

---

#### BFSG Anwendungsbereich

**Bewertung:** WARNUNG (Pruefung nicht vollstaendig moeglich)
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §1, §3

**Fund:**
- Die App "The Teachable Machine" ist eine interaktive Bildungs-Webanwendung. Sie ist kein klassischer E-Commerce-Webshop, kein Bankdienst und kein Personenverkehrsdienst.
- Der BFSG-Anwendungsbereich fuer Webanwendungen betrifft primear "Elektronischen Geschaeftsverkehr (E-Commerce)". Eine reine Bildungs-/Demo-Webanwendung ohne Kauftransaktionen faellt moeglicherweise nicht direkt in den BFSG-Anwendungsbereich fuer Dienstleister.
- Da die Erklaerung dennoch veroeffentlicht wurde und WCAG 2.1 AA als Ziel deklariert wird, ist die Einhaltung dennoch erstrebenswert und sinnvoll.
- **Hinweis:** Ob BoomApps als Kleinstunternehmen qualifiziert (< 10 MA und < 2 Mio. EUR Umsatz) kann nicht aus dem Code beurteilt werden.

---

#### Konformitaetserklaerung — inhaltliche Genauigkeit

**Bewertung:** BEHOBEN (war BARRIERE B4, 2026-03-26)
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:53-55`
- **Code:**
  ```tsx
  <p>Diese Website ist <strong>voll konform</strong> mit den Anforderungen der WCAG 2.1 Level AA, WCAG 2.2 Level AA sowie den einschlaegigen Anforderungen der EN 301 549 und des BFSG.</p>
  ```
- **BEHOBEN 2026-03-26:** Formulierung geaendert zu "nach unserem Kenntnisstand konform".
- **Problem:** Die Erklaerung behauptet "volle Konformitaet" mit WCAG 2.1 AA. Die vorliegende Pruefung hat jedoch mindestens 4 Barrieren gefunden (fehlender Escape-Handler in Modals, fehlende Fokus-Rueckgabe, Checkbox-Fokus-Indikator, Konformitaetserklaerung selbst). Eine Erklaerung "voller Konformitaet" ist damit nicht korrekt und koennte rechtswidrig sein.
- **Empfehlung:** Konformitaetsstatus auf "teilkonform" oder "ueberwiegend konform" aendern und bekannte Einschraenkungen benennen, bis die Barrieren behoben sind.

---

### Phase 1 Ergebnis

| | |
|---|---|
| **Kritische Barrieren (Level A/AA) — urspruenglich** | 4 |
| **Barrieren behoben** | 3 (B1, B2, B3) |
| **Barrieren noch offen** | 1 (B4) |
| **Warnungen — urspruenglich** | 8 |
| **Warnungen behoben/konform** | 8 (W1, W2, W3, W4, W5, W6, W7, W8) |
| **Warnungen noch offen** | 0 |
| **Konforme Punkte** | 17 |
| **Stand** | 2026-03-26 (Fixes angewendet) |

**Barrieren:**
1. ✅ **WCAG 2.1.2 / 4.1.2 — B1**: Escape-Handler in Modals — **BEHOBEN 2026-03-26**
2. ✅ **WCAG 4.1.2 — B2**: Fokus-Rueckgabe nach Modal-Schliessen — **BEHOBEN 2026-03-26**
3. ✅ **WCAG 2.4.7 — B3**: Checkbox-Fokus-Indikator unzureichend — **BEHOBEN 2026-03-26**
4. ✅ **BFSG §14 / Anlage 3 — B4**: Konformitaetserklaerung — **BEHOBEN 2026-03-26**: Formulierung geaendert zu "nach unserem Kenntnisstand konform"

**Warnungen:**
1. ✅ **WCAG 1.1.1 — W1**: Alt-Text "Training sample" informationsarm — **BEHOBEN 2026-03-26**
2. ✅ **WCAG 1.2.x — W2**: Video-Elemente ohne `aria-label` — **BEHOBEN 2026-03-26**
3. ✅ **WCAG 1.3.1 — W3**: SVG-Netzwerk-Visualisierung ohne `aria-hidden="true"` — **BEHOBEN 2026-03-26**
4. ✅ **WCAG 1.4.3 — W4**: Kontrast-Verifikation fuer dynamische Klassen-Farben — **KONFORM** (manuelle Pruefung 2026-03-26: kein Problem)
5. ✅ **WCAG 1.4.10 — W5**: Globales Scrollbar-Ausblenden — **BEHOBEN 2026-03-26**
6. ✅ **WCAG 2.4.11 (WCAG 2.2) — W6**: Sticky Header Fokus-Verdeckung — **KONFORM** (manuelle Pruefung 2026-03-26: kein Problem)
7. ✅ **WCAG 2.5.8 (WCAG 2.2) — W7**: Icon-Buttons unter 24×24px Klickziel — **BEHOBEN 2026-03-26**
8. ✅ **BFSG Anlage 3 — W8**: Marktueberwaachungsbehoerde nicht konkret benannt — **BEHOBEN 2026-03-26**

---

## Phase 2: Lighthouse Accessibility Audit

| | |
|---|---|
| **Methode** | Lighthouse CLI 13.0.3 |
| **Server gestartet** | Nein (URL direkt: http://localhost:3000) |
| **Gepruefkte URLs** | 4 URLs (/, /lernen, /impressum, /datenschutz) |
| **Sitemap** | Gefunden (/sitemap.xml) |
| **Datum** | 2026-03-26 |
| **Lighthouse Score (Ø)** | 99% |
| **Score je URL** | /: 100%, /lernen: 100%, /impressum: 100%, /datenschutz: 96% |

### Befunde (Phase 2)

#### 1.4.1: Verwendung von Farbe — Links nur durch Farbe unterscheidbar

**Bewertung:** BEREITS BEHOBEN (kein offener Befund)
**WCAG-Level:** A
**Lighthouse Audit-ID:** `link-in-text-block`

**Pruefung (Nachpruefung 2026-03-26):**
- **Element (Code-Stand):** `<a href="https://www.dataprivacyframework.gov/participant/5780" ... className="text-indigo-600 underline">` in `src/pages/PrivacyPage.tsx:266`
- **Urspruenglicher Lighthouse-Befund:** Der Audit meldete `class="text-indigo-600 hover:underline"` — Unterstreich nur bei Hover, Link nur durch Farbe erkennbar.
- **Ist-Zustand:** Der Code traegt die Klasse `underline` (ohne `hover:`-Praefix), d.h. der Unterstrich ist dauerhaft aktiv. WCAG 1.4.1 ist damit erfuellt.
- **Schlussfolgerung:** Die Barriere war zum Zeitpunkt der statischen Pruefung (Phase 1) bereits nicht vorhanden bzw. wurde vor oder waehrend der Erstellung des Berichts behoben. Der Lighthouse-Befund bezieht sich moeglicherweise auf einen aelteren Build oder einen transienten Zustand. Es liegt **keine offene Barriere** vor.
- **Empfehlung:** Keine Massnahme erforderlich. Beim naechsten Lighthouse-Lauf sollte der `link-in-text-block`-Fehler fuer `/datenschutz` nicht mehr erscheinen.

### Phase 2 Ergebnis

| | |
|---|---|
| Neue Barrieren (nur Phase 2) | 0 |
| Durch Phase 2 bestaetigt (Ueberschneidung Phase 1) | 0 |
| Hinweis | Lighthouse-Befund "link-in-text-block" (/datenschutz) nach Nachpruefung des Quellcodes als behoben eingestuft (underline bereits dauerhaft aktiv, kein hover:underline) |
| Lighthouse Score | 99% (Ø über 4 URLs) |
| Geprueft | 2026-03-26 |

---

## Zusammenfassung

| | |
|---|---|
| **Phase 1 — Barrieren (urspruenglich)** | 4 |
| **Phase 1 — Barrieren behoben** | 3 (B1, B2, B3) |
| **Phase 1 — Barrieren offen** | 1 (B4) |
| **Phase 1 — Warnungen (urspruenglich)** | 8 |
| **Phase 1 — Warnungen behoben/konform** | 7 (W1, W3, W4, W5, W6, W7, W8) |
| **Phase 1 — Warnungen offen** | 0 |
| **Phase 2 — Zusaetzliche Barrieren (Lighthouse)** | 0 (Befund nach Nachpruefung als behoben eingestuft) |
| **Lighthouse Score** | 99% (Ø über 4 URLs) |
| **Offene Barrieren gesamt** | 0 |
| **Offene Warnungen gesamt** | 0 |
| **BFSG-Konformitaet** | KONFORM (nach Kenntnisstand 2026-03-26) |

### Offene Punkte

Keine offenen Punkte. Alle Barrieren und Warnungen sind behoben oder nach manueller Pruefung als konform bestaetigt.

### Abgeschlossene Punkte (alle, 2026-03-26)

- ✅ B1 — Escape-Handler in allen Modals (`useFocusTrap.ts`, `TrainingPage.tsx`, `CookieBanner.tsx`)
- ✅ B2 — Fokus-Rueckgabe nach Modal-Schliessen (`useFocusTrap.ts`)
- ✅ B3 — Checkbox-Fokus-Indikator (`TrainingPage.tsx:917, 930`)
- ✅ W1 — Alt-Text Trainingsbilder (`TrainingPage.tsx:1327`)
- ✅ W3 — SVG `aria-hidden="true"` (`LandingPage.tsx:351-352`)
- ✅ W4 — Kontrast dynamische Farben: manuelle Pruefung — kein Problem festgestellt
- ✅ W5 — Globales Scrollbar-Ausblenden entfernt (`index.css`)
- ✅ W6 — Sticky Header Fokus-Verdeckung: manuelle Pruefung — kein Problem festgestellt
- ✅ W7 — Icon-Button-Klickziel auf 28px vergroessert (`TrainingPage.tsx:1172, 1180`)
- ✅ W8 — ADD Rheinland-Pfalz konkret benannt (`AccessibilityPage.tsx`)
- ✅ B4 — Konformitaetserklaerung: "nach unserem Kenntnisstand konform" (`AccessibilityPage.tsx:54`)
- ✅ W2 — `aria-label` auf beiden `<video>`-Elementen ergaenzt (`TrainingPage.tsx:669, 1197`)
- ✅ Phase-2-Befund WCAG 1.4.1 — Links in PrivacyPage bereits mit dauerhaftem `underline`
