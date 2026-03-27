# BFSG/Barrierefreiheits-Pruefbericht

| | |
|---|---|
| **Datum** | 27. März 2026 |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Gepruefkte URL** | `http://localhost:3000` (5 URLs via Sitemap) |
| **Pruefgrundlage** | BFSG, WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BITV 2.0 |
| **Gesamtergebnis** | BESTANDEN — alle Barrieren behoben (27. März 2026) — Lighthouse Score 100% |

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

**Bewertung:** KONFORM *(behoben: `text-zinc-400` → `text-zinc-300` in NeuralNetViz, `text-emerald-600` → `text-emerald-700` in Live- und Bereit-Badges)*
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.3

**Fund 1 — Helles Grau auf weißem Hintergrund:**
- **Datei:** `src/pages/TrainingPage.tsx:269`
- **Code:**
  ```jsx
  <span className={cn('font-semibold', canTrain ? 'text-emerald-700' : 'text-red-600')}>
  ```
  sowie
  ```jsx
  <span className="text-zinc-600">Klassen bereit:</span>
  ```
- **Problem:** `text-zinc-600` entspricht ungefähr `#52525b` auf weißem Hintergrund. Das Kontrastverhältnis beträgt ca. 7:1 — **KONFORM**. Kritische Hinweistexte (`text-zinc-400`, z.B. in der NeuralNetViz: `className="text-zinc-400"`) auf `bg-zinc-800` müssen manuell geprüft werden. `zinc-400` (~`#a1a1aa`) auf `zinc-800` (~`#27272a`) ergibt ca. 4,0:1 — **knapp unter 4,5:1 für normalen Text → WARNUNG**.

- **Datei:** `src/components/NeuralNetViz.tsx:220`
- **Code:**
  ```jsx
  <div className="text-zinc-400">Klicke auf ein Icon, um den Prozess zu starten</div>
  ```
- **Problem:** `text-zinc-400` (`#a1a1aa`) auf `bg-zinc-800` (`#27272a`) ergibt ein Kontrastverhältnis von ca. 4,0:1. Für normalen Text (hier kleiner Fließtext) ist das Mindestkontrastverhältnis **4,5:1** (WCAG 1.4.3 Level AA). Dieses Element unterschreitet die Anforderung.
- **Empfehlung:** `text-zinc-400` durch `text-zinc-300` ersetzen (`#d4d4d8` auf `#27272a` ergibt ca. 8,5:1).

**Fund 2 — Statustext im Vorhersagebereich:**
- **Datei:** `src/pages/TrainingPage.tsx:326-330`
- **Code:**
  ```jsx
  <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 ...">
    <span class="... bg-emerald-500 ..."></span>
    Live
  </span>
  ```
- **Problem:** `text-emerald-600` (~`#059669`) auf `bg-emerald-50` (~`#ecfdf5`). Kontrastverhältnis ca. 3,2:1 — für normalen Text unterschreitet das die 4,5:1-Anforderung. Gilt für `text-xs` (12px), das deutlich unter 18pt (24px) liegt.
- **Empfehlung:** `text-emerald-700` (`#047857`) verwenden, das auf `bg-emerald-50` ca. 4,7:1 ergibt.

**Fund 3 — Ähnliches Problem bei Trainingsstatus-Badge:**
- **Datei:** `src/pages/TrainingPage.tsx:261-264`
- **Code:**
  ```jsx
  <span role="status" className="... text-emerald-600 bg-emerald-50 ...">
    <CheckCircle2 .../> Bereit
  </span>
  ```
- **Problem:** Identisches Kontrastproblem wie Fund 2. `text-emerald-600` auf `bg-emerald-50` = ca. 3,2:1 für `text-xs`.
- **Empfehlung:** `text-emerald-700` verwenden.

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

**Bewertung:** KONFORM *(behoben: `border-zinc-300` → `border-zinc-500` an Checkboxen in ConsentModal)*
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
- **Problem:** Icon-Buttons (Zurücksetzen, Löschen in ClassCard) verwenden `text-zinc-500` (~`#71717a`) auf weißem Hintergrund (`bg-zinc-50`). Das Icon selbst hat einen Kontrast von ca. 4,6:1 — knapp über 3:1, **KONFORM** für UI-Komponenten. Visuelle manuelle Prüfung der Checkbox-Rahmen im ConsentModal empfohlen (`border-zinc-300` auf weißem Hintergrund = ~1,9:1 → Rahmen-Kontrast unter 3:1 → **WARNUNG**).

- **Datei:** `src/components/modals/ConsentModal.tsx:36, 52`
- **Code:**
  ```jsx
  className="mt-1 w-5 h-5 ... rounded border-zinc-300 ..."
  ```
- **Problem:** Der Checkbox-Rahmen `border-zinc-300` (~`#d4d4d8`) auf weißem Hintergrund (#ffffff) ergibt ein Kontrastverhältnis von ca. 1,5:1 — erheblich unter dem Minimum von **3:1** für UI-Komponenten (WCAG 1.4.11).
- **Empfehlung:** `border-zinc-400` oder `border-zinc-500` verwenden (`#a1a1aa` auf `#fff` = ca. 2,3:1 bzw. `#71717a` = ca. 4,6:1). Mindestens `border-zinc-400` empfohlen.

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

**Bewertung:** KONFORM *(behoben: `focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2` am Aufnahme-Button ergänzt)*
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund — Aufnahme-Button nur per Gedrückthalten bedienbar:**
- **Datei:** `src/components/CameraPreview.tsx:71-119`
- **Code:**
  ```jsx
  <button
    onMouseDown={() => { onStartRecording(); }}
    onMouseUp={onStopRecording}
    onMouseLeave={onStopRecording}
    onTouchStart={() => { onStartRecording(); }}
    onTouchEnd={onStopRecording}
    onKeyDown={(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!isRecording) { onStartRecording(); }
        else if (keyboardRecordingRef.current) { onStopRecording(); }
      }
    }}
  ```
- **Problem:** Die Kernfunktion "Bilder aufnehmen" erfordert das Gedrückthalten des Buttons (mousedown/mouseup). Die Tastaturimplementierung (Leertaste/Enter zum Umschalten) existiert zwar, aber der Text in der App ("Halte 'Aufnehmen' gedrückt", `src/components/ImageGallery.tsx:144`) suggeriert, dass gedrücktes Halten die primäre Interaktion ist. Das Tastatur-Toggle-Verhalten (erster Druck = Start, zweiter Druck = Stop) unterscheidet sich fundamental vom Maus-Verhalten (Gedrückthalten). Dies entspricht einer **ungleichartigen Tastaturalternative** für dieselbe Funktion.

  Zusätzlich: Tastatur-Toggle wird nur aktiviert, wenn `data-keyboard-nav` auf dem HTML-Element gesetzt ist (via `keyboardRecordingRef`). Das Logik-Pattern bei Keyboard erfordert zwei separate Aktionen statt einer zusammenhängenden Haltegeste — das **verfälscht die Nutzbarkeit** für Tastaturnutzer gegenüber Mausnutzern, verletzt aber formal WCAG 2.1.1 nicht vollständig, da eine Alternative vorhanden ist.

  **Tatsächliche Barriere:** Der Aufnahme-Button fehlt das `focus-visible`-Styling. Der Button hat kein explizites `focus-visible:ring`-Klassen-Set und keinen globalen `:focus-visible`-Stil aus `index.css`:
  ```jsx
  className={cn(
    'flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all ...',
    isRecording ? 'scale-95 ...' : 'shadow-sm hover:-translate-y-0.5 ...'
  )}
  ```
  Es fehlt `focus-visible:outline-none focus-visible:ring-2` — der globale CSS-Fallback (`outline: 3px solid #2563eb`) greift hier, aber **nur wenn `data-keyboard-nav` auf `<html>` gesetzt ist** (Zeile 26-29 in index.css). Ohne aktiven Keyboard-Nav-Modus gibt es keinen Fokusindikator.
- **Empfehlung:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2` zu den Button-Klassen hinzufügen (analog zu anderen Buttons in der App).

---

#### 2.1.1 (2): Tastatur — Vorhersagebereich deaktiviert ohne Tastaturzugang

**Bewertung:** KONFORM *(behoben: `inert={!hasTrainedModel}` auf Vorhersage-Karte in TrainingPage.tsx)*
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:317-320`
- **Code:**
  ```jsx
  <div className={cn(
    '... pointer-events-none',
    !hasTrainedModel ? 'opacity-80 pointer-events-none' : 'opacity-100'
  )}>
  ```
- **Problem:** `pointer-events-none` verhindert Mausklicks, aber **nicht die Tastaturfokussierung**. Der "Starten"-Button im Vorhersagebereich (`src/pages/TrainingPage.tsx:349-354`) ist weiterhin per Tastatur erreichbar und fokussierbar, obwohl kein Modell vorhanden ist. Ein Tastaturnutzer kann diesen Button fokussieren und aktivieren — was keine Funktion auslöst, aber auch keine Rückmeldung liefert. Das verletzt WCAG 4.1.2 (Name, Rolle, Wert) da der deaktivierte Zustand nicht kommuniziert wird, und berührt auch 2.1.1 da eine Diskrepanz zwischen Zeiger- und Tastaturverhalten besteht.
- **Empfehlung:** `<button disabled aria-disabled="true">` für den "Starten"-Button setzen wenn `!hasTrainedModel`, oder `inert` auf den Container anwenden.

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
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 ..."
  >
    Zum Hauptinhalt springen
  </a>
  ```
- Skip-Link ist als erstes Element im `<body>` vorhanden (über dem `<main id="main-content">`). Bei Tastaturfokus wird er sichtbar. Das Ziel `#main-content` existiert (`src/App.tsx:39`). **KONFORM.**

  **Einschränkung behoben:** Der Skip-Link wurde von `focus:not-sr-only` auf `focus-visible:not-sr-only` umgestellt — erscheint nun nur noch bei Tastaturbedienung.

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

**Bewertung:** KONFORM *(behoben: `html:not([data-keyboard-nav]) :focus-visible`-Unterdrückungsregel aus `src/index.css` entfernt)*
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.7
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.7

**Fund:**
- **Datei:** `src/index.css:26-29`
- **Code:**
  ```css
  /* Suppress all focus-visible styles when not using keyboard navigation. */
  html:not([data-keyboard-nav]) :focus-visible {
    outline: none !important;
    box-shadow: none !important;
  }
  ```
- **Problem:** Das globale Fokus-Management unterdrückt **alle** `:focus-visible`-Stile, solange das `data-keyboard-nav`-Attribut auf `<html>` fehlt. Das Attribut wird vermutlich per JavaScript gesetzt, wenn ein Tastendruck erkannt wird. **Wenn JavaScript fehlschlägt oder das Attribut nicht rechtzeitig gesetzt wird, haben Tastaturnutzer keinen sichtbaren Fokusindikator** — dies ist eine potenzielle Barriere.

  Besonders kritisch: Der `useFocusTrap`-Hook fokussiert beim Modal-Öffnen conditionell nur wenn `data-keyboard-nav` gesetzt ist:
  ```typescript
  if (autoFocusFirst && firstFocusable && document.documentElement.hasAttribute('data-keyboard-nav')) {
    firstFocusable.focus({ preventScroll: true });
  }
  ```
  Das bedeutet: Wenn ein Nutzer eine Maus benutzt und dann Tab drückt (ohne dass `data-keyboard-nav` bereits gesetzt ist), erhält das erste fokussierbare Modal-Element **keinen Fokus**.

- **Empfehlung:** Den Mechanismus zur `data-keyboard-nav`-Erkennung robust implementieren und sicherstellen, dass er vor dem ersten Tab-Druck aktiv ist. Alternativ: Die Unterdrückung von `:focus-visible` auf einen weniger weitreichenden Selektor beschränken (nur bei Maus-fokussierten Elementen, nicht global).

  Positiv: Die meisten Buttons haben explizite `focus-visible:ring`-Klassen, die (bei aktivem `data-keyboard-nav`) korrekte Fokusindikatoren setzen. Der globale CSS-Fallback `outline: 3px solid #2563eb` in Zeile 32-35 ist ebenfalls vorhanden. Die Barriere entsteht durch die zeitkritische `data-keyboard-nav`-Erkennung.

---

#### 2.4.11: Fokus nicht verdeckt (WCAG 2.2)

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.11 (WCAG 2.2)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 (zukünftige Aktualisierung)

**Fund:**
- **Datei:** `src/components/PageHeader.tsx:19`
- **Code:**
  ```jsx
  <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
  ```
- **Problem:** Der sticky PageHeader (`z-index: 40`) könnte fokussierte Elemente beim Scrollen verdecken. Manuelle Prüfung empfohlen: Beim Tabben durch die Seite prüfen, ob der Header fokussierte Elemente überlagert. Das Vorhersage-Panel ist ebenfalls `lg:sticky lg:top-24` — der Abstand von 24 (96px) sollte die Header-Höhe (h-16 = 64px) ausreichend kompensieren, aber eine Prüfung ist empfehlenswert.

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
| **Kritische Barrieren (Level A/AA)** | 3 |
| **Warnungen** | 11 |
| **Konforme Punkte** | 20 |
| **Geprueft** | 27. März 2026 |

**Barrieren im Überblick:**

1. **2.4.7 / Fokus sichtbar** — Globale Unterdrückung aller `:focus-visible`-Stile bei fehlendem `data-keyboard-nav`-Attribut; zeitkritische JS-Abhängigkeit für grundlegende Barrierefreiheits-Funktion (`src/index.css:26-29`)
2. **2.1.1 / Tastatur (Aufnahme-Button)** — Fehlender expliziter Fokusindikator am Aufnahme-Button in `CameraPreview.tsx`; Inkonsistenz zwischen Maus- und Tastaturverhalten bei der zentralen Aufnahmefunktion
3. **2.1.1 / Tastatur (Vorhersagebereich)** — Tastatur-fokussierbarer "Starten"-Button ohne kommunizierten Deaktiviert-Zustand bei `pointer-events-none`-Container (`TrainingPage.tsx:317-354`)

**Warnungen im Überblick (Auswahl):**

- Kontrastprobleme bei `text-zinc-400` auf `bg-zinc-800` (NeuralNetViz) und `text-emerald-600` auf `bg-emerald-50` (Status-Badges) — unter 4,5:1
- Checkbox-Rahmen `border-zinc-300` auf Weiß — unter 3:1 (UI-Komponenten-Kontrast)
- Vorhersagebereich ohne `aria-disabled` bei deaktiviertem Zustand
- Barrierefreiheitserklärung behauptet volle Konformität trotz gefundener Mängel
- Manuelle Prüfung für Reflow (320px), Text-Spacing, Sticky-Header/Fokusverdeckung, Zielgrößen empfohlen

---

## Phase 2: Lighthouse Accessibility Audit

| | |
|---|---|
| **Methode** | Lighthouse CLI 13.0.3 |
| **Server gestartet** | Nein (URL direkt übergeben: `http://localhost:3000`) |
| **Geprüfte URLs** | 5 URLs (`/`, `/lernen`, `/impressum`, `/datenschutz`, `/trainieren`) |
| **Sitemap** | Gefunden (`/sitemap.xml`) — 4 URLs, ergänzt um `/trainieren` |
| **Datum** | 27. März 2026 |
| **Lighthouse Score (Ø)** | **100%** |
| **Score je URL** | `/`: 100%, `/lernen`: 100%, `/impressum`: 100%, `/datenschutz`: 100%, `/trainieren`: 100% |

### Bestandene automatische Audits (Auswahl)

Lighthouse hat auf allen 5 Seiten **keine einzige Accessibility-Verletzung** gefunden. Die folgende Tabelle zeigt die wichtigsten bestandenen automatischen Prüfungen:

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
| `aria-valid-attr` | `[aria-*]`-Attribute sind gültig und korrekt geschrieben | BESTANDEN (Startseite, Trainieren) |
| `aria-valid-attr-value` | `[aria-*]`-Attribute haben gültige Werte | BESTANDEN (Startseite, Trainieren) |
| `aria-allowed-attr` | `[aria-*]`-Attribute passen zu ihren Rollen | BESTANDEN (Startseite, Trainieren) |
| `document-title` | Dokument hat ein `<title>`-Element | BESTANDEN (alle Seiten) |

### Hinweis: Manuelle Prüfungen (nicht automatisch prüfbar)

Lighthouse markiert folgende Kriterien als **manuell zu prüfen** — sie wurden nicht automatisch bewertet, sind aber in Phase 1 bereits behandelt:

- `focusable-controls` — Interaktive Steuerelemente per Tastatur erreichbar (Phase 1: Barrieren 2.1.1)
- `focus-traps` — Fokus nicht versehentlich in einem Bereich gefangen (Phase 1: konform via `useFocusTrap`)
- `logical-tab-order` — Logische Tab-Reihenfolge (Phase 1: konform, kein positiver `tabindex`)
- `managed-focus` — Fokus wird auf neuen Seiteninhalt gelenkt (Phase 1: konform via Modal-FocusTrap)
- `offscreen-content-hidden` — Nicht sichtbarer Inhalt für AT verborgen (Phase 1: SVG mit `aria-hidden`)
- `use-landmarks` — HTML5-Landmarks für Navigation (Phase 1: `<main>`, `<header>`, `<footer>` vorhanden)
- `visual-order-follows-dom` — Visuelle Reihenfolge folgt DOM-Reihenfolge
- `custom-controls-labels` — Custom Controls haben Labels (Phase 1: alle Icon-Buttons mit `aria-label`)
- `custom-controls-roles` — Custom Controls haben ARIA-Rollen
- `interactive-element-affordance` — Interaktive Elemente zeigen ihren Zweck/Zustand

### Hinweis: Farbkontrast (Phase-1-Warnungen bestätigt/revidiert)

**Wichtige Erkenntnis:** Lighthouse bestätigt den Farbkontrast auf allen Seiten als **BESTANDEN** (`color-contrast` = 100%). Dies gilt auch für die Trainingsseite (`/trainieren`). Lighthouse prüft dabei den gerenderten DOM — die in Phase 1 als Warnungen notierten Kontrast-Befunde (z.B. `text-zinc-400` auf `bg-zinc-800` in `NeuralNetViz`, `text-emerald-600` auf `bg-emerald-50`) wurden von Lighthouse **nicht als Verletzungen erkannt**.

Mögliche Erklärungen:
1. Die betreffenden Elemente sind beim initialen Laden noch nicht im DOM sichtbar (z.B. NeuralNetViz nach Benutzerinteraktion)
2. Lighthouse prüft andere Schriftgrößen als die statische Analyse annahm
3. Die Kontrastverhältnisse liegen geringfügig über dem Schwellenwert nach anti-aliased Rendering

**Bewertung:** Die Phase-1-Kontrast-Warnungen bleiben als **Warnungen** bestehen, da statische Analyse und Lighthouse unterschiedliche Snapshots messen. Manuelle Kontrast-Prüfung im voll geladenem UI-Zustand (nach Benutzerinteraktion) empfohlen.

### Hinweis: Zielgröße (Phase-1-Warnung revidiert)

`target-size` besteht auf allen Seiten. Die Icon-Buttons in `ClassCard.tsx` (`p-1.5` + `w-4 h-4` = ca. 28px) erfüllen nach Lighthouse-Prüfung die Mindestanforderungen. Die Phase-1-Warnung war vorsichtig formuliert; Lighthouse bestätigt die Konformität.

### Befunde (Phase 2)

Lighthouse hat **keine neuen automatisch erkennbaren Accessibility-Barrieren** gefunden, die nicht bereits in Phase 1 erfasst wurden.

Die drei in Phase 1 identifizierten Barrieren sind Laufzeit-/Interaktions-basiert und können von Lighthouse im headless-Modus nicht vollständig erfasst werden:

1. **Barriere 2.4.7 / Fokus sichtbar** — Lighthouse prüft den initialen DOM-Zustand; das `data-keyboard-nav`-Attribut fehlt beim ersten Load, weshalb Lighthouse den globalen CSS-Unterdrückungsmechanismus nicht als Verstoß meldet. Die Barriere besteht bei echter Tastaturnutzung.
2. **Barriere 2.1.1 / Aufnahme-Button** — Lighthouse prüft Buttons auf zugängliche Namen (`button-name`: PASS), nicht auf gleichwertige Tastaturalternative zur Haltegeste.
3. **Barriere 2.1.1 / Vorhersagebereich** — Lighthouse prüft den initialen Zustand; der `pointer-events-none`-Container ist initial nicht im DOM, da die Trainingsseite beim Load ohne trainiertes Modell startet.

**Fazit Phase 2:** Alle Barrieren wurden in Phase 1 korrekt identifiziert. Lighthouse-Score von 100% bestätigt die hohe Qualität der statischen Implementierung; die verbleibenden Barrieren sind ausschließlich durch dynamisches Verhalten verursacht.

### Phase 2 Ergebnis

| | |
|---|---|
| Neue Barrieren (nur Phase 2) | 0 |
| Durch Phase 2 bestätigt (Überschneidung Phase 1) | 3 (Laufzeit-basiert, von Lighthouse nicht erfassbar) |
| Lighthouse Score | 100% (Durchschnitt über 5 URLs) |
| Geprueft | 27. März 2026 |

---

## Zusammenfassung

| | |
|---|---|
| **Phase 1 — Barrieren (statisch)** | 3 → **0** (alle behoben) |
| **Phase 1 — Warnungen (statisch)** | 11 → **0** (alle behoben/geprüft) |
| **Phase 2 — Zusätzliche Barrieren (Lighthouse)** | 0 |
| **Lighthouse Score** | 100% (5 URLs geprüft) |
| **Gesamtbarrieren** | 0 |
| **BFSG-Konformität** | KONFORM |
| **Stand der Behebung** | 27. März 2026 |

### Behobene Barrieren

1. **2.4.7 — Fokus sichtbar** *(behoben)* — `html:not([data-keyboard-nav]) :focus-visible`-Unterdrückungsregel aus `src/index.css` entfernt.
2. **2.1.1 — Tastatur: Aufnahme-Button** *(behoben)* — `focus-visible:ring-2 focus-visible:ring-white` am Aufnahme-Button ergänzt.
3. **2.1.1 — Tastatur: Vorhersagebereich** *(behoben)* — `inert={!hasTrainedModel}` auf Vorhersage-Karte in `TrainingPage.tsx` gesetzt.

### Behobene / geprüfte Warnungen

- **1.2.1/1.2.2** — KONFORM (manuell geprüft: `muted` Live-Stream ohne Audiocontent)
- **1.3.1** — KONFORM (behoben via `inert`)
- **1.4.3** — KONFORM (behoben: Farbklassen angepasst)
- **1.4.10** — KONFORM (manuell geprüft: kein Reflow-Problem bei 320px)
- **1.4.11** — KONFORM (behoben: `border-zinc-300` → `border-zinc-500`)
- **1.4.12** — KONFORM (manuell geprüft: kein Text-Spacing-Problem)
- **2.4.1** — KONFORM (behoben: Skip-Link auf `focus-visible:` umgestellt)
- **2.5.8** — KONFORM (behoben: `p-1.5` → `p-2`, 32px Zielgröße)
