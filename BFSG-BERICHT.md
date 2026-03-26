# BFSG/Barrierefreiheits-Pruefbericht

| | |
|---|---|
| **Datum** | 2026-03-26 |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Gepruefkte URL** | http://localhost:3000/ (4 URLs geprüft: `/`, `/lernen`, `/impressum`, `/datenschutz`) |
| **Pruefgrundlage** | BFSG, WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BITV 2.0 |
| **Gesamtergebnis** | NICHT BESTANDEN — 6 Barrieren (4 aus Phase 1 + 2 aus Lighthouse) |

---

## Phase 1: Statische Codebase-Analyse

### 1. Wahrnehmbar

---

#### 1.1.1: Nichttextlicher Inhalt

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.1.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.1.1

**Fund:**
- **Datei:** `src/pages/LandingPage.tsx:22-27`
- **Code:**
  ```tsx
  <img
    src="/ada-logo.png"
    alt="Ada Lovelace Projekt Logo"
    className="h-10 w-auto object-contain"
    referrerPolicy="no-referrer"
  />
  ```
- **Bewertung:** Informatives Bild im Navigationsbereich hat beschreibenden Alt-Text. Korrekt.

**Weitere konforme Fundstellen:**
- `src/pages/TrainingPage.tsx:500-504` — Logo-Bild mit `alt="Ada Lovelace Projekt Logo"`. Korrekt.
- `src/pages/AccessibilityPage.tsx:29-34` — Logo-Bild mit `alt="Ada Lovelace Projekt Logo"`. Korrekt.
- `src/pages/ImprintPage.tsx:29-34` — Logo-Bild mit `alt="Ada Lovelace Projekt Logo"`. Korrekt.
- `src/pages/LandingPage.tsx:261-266` — Dekoratives Bild in der Kooperationssektion mit `alt=""` und `aria-hidden="true"`. Korrekt fuer dekorative Bilder.
- `src/pages/TrainingPage.tsx:755-759` — Trainings-Vorschaubild mit `alt="Vergrößerte Bildvorschau"`. Ausreichend.
- `src/pages/TrainingPage.tsx:1318` — Trainings-Thumbnail `alt="Training sample"`. Funktionell akzeptabel (Thumbnails von Nutzerdaten).

Alle SVG-Icons der Lucide-Bibliothek werden konsistent mit `aria-hidden="true"` ausgeblendet, da sie rein dekorativ sind und der zugaengliche Name durch begleitenden Text oder `aria-label` am Button-Element bereitgestellt wird.

---

#### 1.2.2: Untertitel (aufgezeichnet)

**Bewertung:** KONFORM (nicht anwendbar)
**WCAG-Level:** A
**EN 301 549:** 9.1.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.2.2

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:663-672` und `src/pages/TrainingPage.tsx:1188-1197`
- **Code:**
  ```tsx
  <video
    ref={predictVideoRef}
    autoPlay
    playsInline
    muted
    ...
  />
  ```
- **Problem/Bewertung:** Beide `<video>`-Elemente sind Live-Webcam-Streams ohne aufgezeichneten Inhalt. Sie zeigen ausschliesslich den aktuellen Kamera-Feed zur Trainingsdatenerfassung. Es gibt keine aufgezeichneten Videoinhalte mit Audio, die Untertitel erfordern wuerden. Das Kriterium 1.2.2 (aufgezeichnet) ist daher nicht anwendbar. Das Kriterium 1.2.4 (Untertitel live) gilt nicht fuer diesen Anwendungsfall, da der Stream nicht inhaltlich kommuniziert sondern als Werkzeug zur Bilderkennung dient.

---

#### 1.3.1: Informationen und Beziehungen

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.1.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.1

**Fund:**
- Semantische HTML-Elemente werden korrekt eingesetzt: `<nav>`, `<header>`, `<main>`, `<footer>`, `<section>`, `<h1>`-`<h3>` in logischer Hierarchie.
- Auf der LandingPage: `<nav>` fuer die Navigation, `<header>` fuer den Hero-Bereich, mehrere `<section>`-Elemente fuer inhaltliche Abschnitte, `<footer>` im Footer-Component.
- Formularfelder auf der TrainingPage haben korrekte `aria-label`-Attribute und `aria-invalid`/`aria-errormessage`-Verknuepfungen.
- Modale Dialoge verwenden `role="dialog"`, `aria-modal="true"` und `aria-labelledby` mit passenden `id`-Attributen.

---

#### 1.3.4: Ausrichtung

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.3.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.4

**Fund:** Kein `orientation`-Lock in CSS oder JavaScript gefunden. Die Anwendung ist fuer beide Ausrichtungen konzipiert (responsive Design mit Tailwind CSS Breakpoints).

---

#### 1.3.5: Eingabezweck bestimmen

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.1.3.5
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.5

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1143-1155`
- **Code:**
  ```tsx
  <input
    type="text"
    value={cls.name}
    onChange={(e) => onUpdateName(e.target.value)}
    className={...}
    placeholder="Klassenname"
    aria-label={`Name für Klasse ${cls.name || 'ohne Namen'}`}
    aria-invalid={!!errorMsg}
    aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
  />
  ```
- **Problem:** Das Texteingabefeld hat kein `autocomplete`-Attribut. Da es sich um einen Klassennamen (benutzerdefinierter Inhalt, kein persoenliches Datum) handelt, ist `autocomplete="off"` oder ein beschreibender Wert empfehlenswert. Da dieses Feld keinen der WCAG-vorgeschriebenen Eingabezwecke (Name, E-Mail, Adresse etc.) erfuellt, ist dies eine Warnung und kein Verstoss.
- **Empfehlung:** `autocomplete="off"` explizit setzen, um Browser-Autovervollstaendigung zu unterdruecken und die Absicht klar zu kommunizieren.

---

#### 1.4.3: Kontrast (Minimum)

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.3

**Fund (statische Analyse — manuelle Pruefung erforderlich):**
- **Datei:** `src/pages/LandingPage.tsx:83`
- **Code:**
  ```tsx
  <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
  ```
- **Problem:** Tailwind-Farbe `text-zinc-400` (#a1a1aa) auf dem dunklen Hintergrund `bg-zinc-900` (#18181b): Das Kontrastverhaltnis betraegt ca. 3.7:1 fuer normalen Text — dies liegt unter dem WCAG-Mindesterfordernis von 4.5:1. Manuelle Bestaetigung via Contrast-Checker-Tool empfohlen.

- **Datei:** `src/pages/TrainingPage.tsx:474`, `src/pages/LandingPage.tsx:474`
- **Code:**
  ```tsx
  <div className="text-zinc-400 animate-pulse">Verarbeite Signal...</div>
  ```
- **Problem:** `text-zinc-400` auf `bg-zinc-800` (#27272a): Ca. 3.1:1 — unter dem WCAG-Mindest von 4.5:1 fuer normalen Text.

- **Datei:** `src/pages/TrainingPage.tsx:699-710` (Vorhersage-Ergebnisse)
- **Code:**
  ```tsx
  <span className="w-20 truncate font-semibold text-zinc-600">{c.name}</span>
  ```
- **Bewertung:** `text-zinc-600` (#52525b) auf weissem Hintergrund: ~7.1:1 — konform.

**Empfehlung:** `text-zinc-400` auf dunklen Hintergruenden durch `text-zinc-300` ersetzen (hoeherer Kontrast). Vollstaendige Kontrastpruefung mit Lighthouse oder einem dedizierten Contrast-Checker-Tool durchfuehren.

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
- **Bewertung:** Kein `user-scalable=no` oder `maximum-scale=1` im Viewport-Meta-Tag gefunden. Browser-Zoom ist nicht blockiert. Konform.

---

#### 1.4.10: Umfluss (Reflow)

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.10
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.10

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1296`
- **Code:**
  ```tsx
  <div className="flex-1 relative h-[190px] max-h-[190px] bg-zinc-50/50 rounded-xl border border-zinc-100 p-2 overflow-y-auto">
  ```
- **Problem:** Das Bilder-Grid in der ClassCard hat eine fixe Hoehe von 190px. Bei 400% Zoom koennte es zu Darstellungsproblemen kommen. Manuelle Pruefung bei 320px Breite erforderlich.

- **Datei:** `src/pages/LandingPage.tsx:349`
- **Code:**
  ```tsx
  <div className="relative h-80 max-w-4xl mx-auto">
  ```
- **Problem:** Das NeuralNetViz-SVG hat eine fixe Hoehe von `h-80` (320px). Bei kleinen Bildschirmen oder hohem Zoom koennte der Inhalt abgeschnitten werden. Manuelle Pruefung empfohlen.

---

#### 1.4.11: Kontrast von Nicht-Text-Inhalten

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.11
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.11

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1297-1335`
- **Code:**
  ```tsx
  className="... border border-zinc-100 ..."
  ```
- **Problem:** Rahmen von `border-zinc-100` (#f4f4f5) auf weissem Hintergrund hat sehr geringes Kontrastverhaltnis (unter 3:1). Visuelle Identifizierung des Containers koennte fuer Nutzer mit Seheinschraenkung erschwert sein. Manuelle Pruefung empfohlen.

---

### 2. Bedienbar

---

#### 2.1.1: Tastatur

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1200-1233`
- **Code:**
  ```tsx
  <button
    onMouseDown={startRecording}
    onMouseUp={stopRecording}
    onMouseLeave={stopRecording}
    onTouchStart={startRecording}
    onTouchEnd={stopRecording}
    onTouchCancel={stopRecording}
    onKeyDown={(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startRecording();
      }
    }}
    onKeyUp={(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        stopRecording();
      }
    }}
    ...
  >
  ```
- **Bewertung:** KONFORM. Der Aufnahme-Button implementiert sowohl Maus/Touch-Events als auch Tastatur-Handler (Space/Enter). Tastaturnutzer koennen Bilder aufnehmen. Positiv.

**Weiteres Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:509-516`
- **Code:**
  ```tsx
  <button
    onClick={toggleCamera}
    className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors flex-shrink-0"
    title="Kamera wechseln"
    aria-label="Kamera wechseln"
  >
  ```
- **Bewertung:** WARNUNG — Kein `:focus-visible`-Ring auf diesem Button. Das globale CSS in `src/index.css` definiert `:focus-visible { outline: 3px solid #2563eb; }`. Dieser Button hat jedoch keine eigene `focus-visible:`-Klasse und haengt damit ausschliesslich vom globalen Fallback ab. Das globale CSS-Muster `:focus:not(:focus-visible) { outline: none !important; }` entfernt den Outline bei Maus-Klick korrekt. Der globale Fallback sollte greifen, aber es fehlt an expliziter Implementierung fuer diesen Button im Vergleich zu anderen Buttons die explizit `focus-visible:ring-2` verwenden.

---

#### 2.1.1: Tastatur — alert() Verwendung

**Bewertung:** BARRIERE
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1, 9.4.1.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.1.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:436`
- **Code:**
  ```tsx
  alert("Bitte sammle für alle Klassen mindestens 10 Bilder.");
  ```
- **Datei:** `src/pages/TrainingPage.tsx:444`
- **Code:**
  ```tsx
  alert("Bitte gib allen Klassen einen Namen.");
  ```
- **Datei:** `src/pages/TrainingPage.tsx:449`
- **Code:**
  ```tsx
  alert("Bitte gib allen Klassen einen eindeutigen Namen.");
  ```
- **Problem:** Native `alert()`-Dialoge werden fuer Validierungsfehlermeldungen beim Modelltraining verwendet. `alert()` ist aus WCAG-Perspektive problematisch, weil:
  1. Der Fokus kehrt nach Schliessen moeglicherweise nicht korrekt zum ausloesenden Element zurueck (browserabhaengig).
  2. `alert()` ist nicht ueber ARIA steuerbar und nicht in den eigenen Accessibility-Baum der Anwendung integriert.
  3. Es gibt keine konsistente ARIA-Live-Region-Ansage fuer Screenreader im Anwendungskontext.
  4. Verstoss gegen WCAG 4.1.3 (Statusmeldungen) — Fehlermeldungen sollten programmatisch ueber `role="alert"` oder `aria-live="assertive"` kommuniziert werden, nicht ueber Browser-eigene Dialoge.
- **Empfehlung:** `alert()` durch ein zugaengliches Inline-Fehlermeldungs-Pattern ersetzen:
  ```tsx
  <div role="alert" aria-live="assertive" className="...">
    {validationError}
  </div>
  ```

---

#### 2.2.2: Pausieren, Stoppen, Ausblenden

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.2.2.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.2.2

**Hintergrund:** WCAG 2.2.2 (Level A) verlangt, dass bewegte, blinkende oder scrollende Inhalte, die automatisch gestartet werden und laenger als 5 Sekunden andauern, pausiert, gestoppt oder ausgeblendet werden koennen. Fuer Inhalte, die kuerzer als 5 Sekunden oder nur waehrend einer Nutzerinteraktion aktiv sind, gilt die Ausnahme.

**Fund — Laufende Animationen:**

- **Datei:** `src/App.tsx:22`
- **Code:**
  ```tsx
  <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-200 border-t-red-600"></div>
  ```
- **Bewertung:** KONFORM. Lade-Spinner der App-Initialisierung. Dieser ist nur kurzzeitig waehrend des initialen Ladens sichtbar und haelt nicht ueber 5 Sekunden unter normalen Bedingungen an. Faellt unter die Zeitausnahme.

- **Datei:** `src/pages/LandingPage.tsx:474`
- **Code:**
  ```tsx
  <div className="text-zinc-400 animate-pulse">Verarbeite Signal...</div>
  ```
- **Bewertung:** WARNUNG. Die `animate-pulse`-Animation laeuft kontinuierlich solange die KI-Vorhersage aktiv ist (Kamera-Modus). Da die Aktivierungsdauer vom Nutzerverhalten abhaengt und potenziell deutlich laenger als 5 Sekunden andauert, waere ein Stopp-Mechanismus theoretisch erforderlich. Jedoch hat der Nutzer durch Deaktivierung des Kamera-Modus implizit die Moeglichkeit, die Animation zu beenden. Ein expliziter Pausier-Button fehlt, ist aber nicht zwingend, solange der gesamte Kontext (Kamera an/aus) vom Nutzer steuerbar ist. Manuelle Verifikation empfohlen, ob der Nutzerfluss die Anforderung inhaltlich erfuellt.

- **Datei:** `src/pages/TrainingPage.tsx:620`
- **Code:**
  ```tsx
  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Trainiere...</>
  ```
- **Bewertung:** KONFORM. Trainings-Spinner ist nur waehrend des aktiven Trainingsprozesses sichtbar, der typischerweise wenige Sekunden dauert. Kein dauerhafter Autostart.

- **Datei:** `src/pages/TrainingPage.tsx:655`
- **Code:**
  ```tsx
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
  ```
- **Bewertung:** WARNUNG. Der pulsierende grüne Punkt zeigt den aktiven Kamera-Status an und laeuft kontinuierlich solange die Kamera aktiv ist. Auch hier gilt: Der Nutzer kann die Kamera deaktivieren, was die Animation stoppt. Echter Pausier-Mechanismus fehlt, aber Funktionskontext erlaubt implizite Steuerung.

- **Datei:** `src/pages/TrainingPage.tsx:962`
- **Code:**
  ```tsx
  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" aria-hidden="true" />
  ```
- **Bewertung:** KONFORM. Modaler Lade-Spinner nur waehrend asynchroner Operationen sichtbar. Kein Dauerstart.

- **Datei:** `src/pages/TrainingPage.tsx:1232`
- **Code:**
  ```tsx
  <Camera className={cn("w-4 h-4 mr-2", isRecording && "animate-pulse")} />
  ```
- **Bewertung:** KONFORM. Animation ist an `isRecording`-Zustand geknuepft und nur waehrend aktiver Bildaufnahme durch Nutzer sichtbar (Nutzer haelt Taste gedrueckt). Keine automatisch gestartete Dauerbewegung.

**Gesamtbewertung:** Kein eindeutiger Level-A-Verstoss identifiziert. Die kontinuierlich laufenden `animate-pulse`-Animationen (LandingPage.tsx:474 und TrainingPage.tsx:655) erfuellen die 5-Sekunden-Schwelle bei laengerer Nutzung. Da beide Animationen jedoch an nutzergesteuerte Modi (Kamera aktiv / KI-Vorhersage aktiv) geknuepft sind, ist ein expliziter Pause-Button nicht zwingend erforderlich — der Nutzer kann den jeweiligen Modus jederzeit deaktivieren. Empfehlung: Dies im Rahmen eines manuellen Tests verifikieren.

---

#### 2.4.1: Bloecke ueberspringen

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
- **Bewertung:** Skip-Link ist korrekt implementiert. Er ist das erste Element im Body-Render-Baum, per Tastatur erreichbar, visuell sichtbar wenn fokussiert, und verlinkt auf `#main-content` welches auf dem `<main>`-Element gesetzt ist. Konform.

---

#### 2.4.2: Seite mit Titel

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.2

**Fund:**
- `index.html:22`: `<title>KI Bilderkennung für Schüler</title>` — Basis-Titel. Konform.
- `src/pages/LandingPage.tsx:14`: `document.title = 'KI Bilderkennung für Schüler';` — Dynamisch gesetzt. Konform.
- `src/pages/TrainingPage.tsx:43`: `document.title = 'Modell trainieren – KI Bilderkennung für Schüler';` — Eindeutig und beschreibend. Konform.
- `src/pages/ImprintPage.tsx:12`: `document.title = 'Impressum – KI Bilderkennung für Schüler';` — Konform.
- `src/pages/PrivacyPage.tsx`: `document.title = 'Datenschutz – KI Bilderkennung für Schüler';` — Konform.
- `src/pages/AccessibilityPage.tsx:12`: `document.title = 'Barrierefreiheit – KI Bilderkennung für Schüler';` — Konform.
- `src/pages/NotFoundPage.tsx:12`: `document.title = 'Seite nicht gefunden – KI Bilderkennung für Schüler';` — Konform.

Alle Seiten haben eindeutige, beschreibende Titel. Vollstaendig konform.

---

#### 2.4.3: Fokus-Reihenfolge

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.3

**Fund:** Kein positiver `tabindex`-Wert (tabindex="1" oder hoeher) gefunden. Das `tabIndex={-1}` auf dem versteckten File-Input (`src/pages/TrainingPage.tsx:1251`) ist korrekt — das Element ist bewusst aus der Tab-Reihenfolge entfernt, da es ueber einen Button ausgeloest wird. Die Fokus-Traps in den Modalen sind korrekt implementiert (Hook `useFocusTrap`).

---

#### 2.4.4: Linkzweck (im Kontext)

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.4

**Fund:** Keine nichtssagenden Linktexte wie "hier", "mehr", "weiter" oder "click here" gefunden. Links haben beschreibenden Text oder explizite `aria-label`-Attribute:
- `aria-label="E-Mail für Barrierefreiheits-Feedback an Yannick Schäfer schreiben"` — sehr gut.
- `aria-label="E-Mail an Yannick Schäfer schreiben"` — gut.
- Footer-Links: "Impressum", "Datenschutz", "Barrierefreiheit" — klar und beschreibend.

---

#### 2.4.7: Fokus sichtbar

**Bewertung:** BARRIERE
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.7
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.7

**Fund — Konformes Grundmuster (globales CSS):**
- **Datei:** `src/index.css:32-35`
- **Code:**
  ```css
  :focus:not(:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }
  ```
- **Datei:** `src/index.css:38-41`
- **Code:**
  ```css
  :focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
  ```
- **Bewertung:** Das Muster `:focus:not(:focus-visible) { outline: none }` ist ein akzeptiertes modernes Pattern. Es entfernt den Fokus-Ring nur bei Maus-Interaktion (`:focus-visible` greift nicht bei Maus-Klick), haelt ihn aber bei Tastaturnavigation sichtbar (`:focus-visible` greift). Der globale Fallback `3px solid #2563eb` ist fuer Elemente die ihn nicht ueberschreiben ausreichend sichtbar.

**Fund — BARRIERE: CTA-Buttons deaktivieren globalen Fallback ohne ausreichenden Ersatz:**
- **Datei:** `src/pages/LandingPage.tsx:44-49`
- **Code:**
  ```tsx
  <button
    onClick={() => navigate('/lernen')}
    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/30"
  >
    Jetzt ausprobieren <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
  </button>
  ```
- **Problem:** Die Tailwind-Klasse `focus-visible:outline-none` deaktiviert explizit den globalen CSS-Fallback `outline: 3px solid #2563eb`. Als Ersatz wird `focus-visible:ring-4 focus-visible:ring-red-600/30` eingesetzt — ein roter Ring mit 30 % Opazitaet auf einem roten Button-Hintergrund (`bg-red-600`). Das Kontrastverhaltnis dieses Fokus-Indikators ist unzureichend: ein halbtransparenter roter Ring auf rotem Untergrund ist fuer Nutzer mit Farbsehschwaeche oder eingeschraenktem Sehvermoegen praktisch nicht wahrnehmbar.

- **Datei:** `src/pages/LandingPage.tsx:240-245`
- **Code:**
  ```tsx
  <button
    onClick={() => navigate('/lernen')}
    className="... focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/30"
  >
    Jetzt ausprobieren ...
  </button>
  ```
- **Problem:** Identisches Problem. Auch dieser zweite CTA-Button (Abschnitt "Erste Schritte") deaktiviert den globalen Outline-Fallback und ersetzt ihn durch denselben zu transparenten Ring.

- **Empfehlung:** Fokus-Ring mit ausreichendem Kontrast zum Hintergrund verwenden. WCAG 2.4.7 verlangt Sichtbarkeit; die praktisch unsichtbare 30%-Opazitaet erfuellt dies nicht:
  ```tsx
  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600
  ```
  Alternativ: `focus-visible:ring-red-600` auf 100 % Opazitaet anheben und `ring-offset-2` hinzufuegen um den Ring sichtbar vom Buttonhintergrund abzusetzen.

**Fund — Vertretbare Ausnahme: Dialog-Container:**
- **Datei:** `src/index.css:44-47`
- **Code:**
  ```css
  div[role="dialog"]:focus,
  div[role="dialog"]:focus-visible {
    outline: none;
  }
  ```
- **Bewertung:** KONFORM (Ausnahme). Modaler Dialog-Container erhaelt programmatischen Fokus durch den Focus-Trap-Hook, soll aber keinen sichtbaren Ring haben, da der Fokus sofort an das erste interaktive Kind-Element weitergegeben wird. Dies ist vertretbar, erfordert aber manuelle Verifikation.

**Hinweis WCAG 2.2 / 2.4.11:** Der transparente Fokus-Ring der CTA-Buttons ist auch unter WCAG 2.2 Kriterium 2.4.11 (Fokus nicht verdeckt, Level AA) relevant, da ein Fokus-Indikator, der optisch nicht existiert, als "vollstaendig verdeckt" einzustufen ist. Fuer BFSG-Konformitaet gemaess EN 301 549 ist WCAG 2.1 AA die Mindestpflicht; 2.4.11 wird als erweiterter Hinweis erwaehnt.

---

### 3. Verstaendlich

---

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
- **Bewertung:** Korrekte Sprachauszeichnung `lang="de"` vorhanden. Konform.

---

#### 3.1.2: Sprache von Teilen

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.3.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.1.2

**Fund:**
- **Datei:** `src/pages/LandingPage.tsx:87-88`
- **Code:**
  ```tsx
  <strong><span lang="en">Input Layer</span></strong>
  <strong><span lang="en">Hidden Layers</span></strong>
  <strong><span lang="en">Output Layer</span></strong>
  ```
- **Weitere Fundstellen:** `lang="en"` ist konsequent fuer englische Fachbegriffe eingesetzt (MobileNet, KNN, K-Nearest Neighbors, Transfer Learning). Das ist Best Practice und geht ueber die Mindestanforderung hinaus. Hervorragend konform.

---

#### 3.2.1: Bei Fokus

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.2.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.2.1

**Fund:** Kein `onFocus`-Handler mit Navigation oder unerwarteten Kontextwechseln gefunden. Keine `<select onchange="window.location=...">` Patterns gefunden.

---

#### 3.3.1: Fehlererkennung

**Bewertung:** BARRIERE
**WCAG-Level:** A
**EN 301 549:** 9.3.3.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:436, 444, 449`
- **Code:**
  ```tsx
  alert("Bitte sammle für alle Klassen mindestens 10 Bilder.");
  alert("Bitte gib allen Klassen einen Namen.");
  alert("Bitte gib allen Klassen einen eindeutigen Namen.");
  ```
- **Problem:** Fehler beim Modelltraining werden ausschliesslich ueber native `alert()`-Dialoge kommuniziert. Diese sind:
  1. Nicht mit dem ausloesenden Formular-Element verknuepft (kein `aria-describedby`, kein `aria-errormessage`)
  2. Identifizieren das fehlerhafte Element nicht programmatisch
  3. Bieten dem Screenreader-Nutzer keinen Rueckweg zum fehlerhaften Element
  4. Verschwinden nach OK-Klick ohne Spur — kein persistenter Fehlerhinweis im DOM
- **Empfehlung:** Fehlermeldungen als Inline-Elemente mit `role="alert"` oder `aria-live="assertive"` nahe am ausloesenden Button einblenden und das fehlerhafte Kriterium (z.B. die Klasse mit zu wenig Bildern) hervorheben:
  ```tsx
  {validationError && (
    <div role="alert" className="text-sm text-red-600 mt-2">
      {validationError}
    </div>
  )}
  ```

---

#### 3.3.2: Beschriftungen oder Anweisungen

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.2

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1143-1155`
- **Code:**
  ```tsx
  <input
    type="text"
    ...
    aria-label={`Name für Klasse ${cls.name || 'ohne Namen'}`}
    aria-invalid={!!errorMsg}
    aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
  />
  ```
- **Bewertung:** Alle Eingabefelder haben zugaengliche Namen ueber `aria-label`. Fehler werden mit `aria-invalid` und `aria-errormessage` verknuepft. Konform.

**Einwilligungs-Checkboxen:**
- **Datei:** `src/pages/TrainingPage.tsx:906-930`
- Die Checkboxen sind in `<label>`-Elemente eingebettet (`<label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" .../><span>...</span></label>`). Das ist das korrekte HTML-Pattern fuer zugaengliche Checkboxen. Konform.

---

#### 3.3.3: Fehlerempfehlung

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.3.3.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.3

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:436, 444, 449`
- **Problem:** Die bestehenden `alert()`-Meldungen geben zwar einen Hinweis auf das Problem ("mindestens 10 Bilder"), bieten aber keine konkreten Korrekturvorschlaege oder Navigation zur problematischen Klasse.
- **Empfehlung:** Nach Umstellung auf Inline-Fehlermeldungen (siehe 3.3.1) konkrete Klassen benennen: "Klasse 1 hat nur 5 Bilder. Bitte nimm mindestens 10 Bilder auf."

---

#### 3.3.4: Fehlervermeidung (rechtlich, finanziell)

**Bewertung:** KONFORM (nicht anwendbar im klassischen Sinne — mit Hinweis)
**WCAG-Level:** AA
**EN 301 549:** 9.3.3.4
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.4

**Hintergrund:** WCAG 3.3.4 (Level AA) gilt fuer Web-Seiten, auf denen Nutzereingaben **rechtliche Verpflichtungen** eingehen oder **finanzielle Transaktionen** ausloesen. In diesen Faellen muessen Eingaben pruefbar (Uebersicht vor Absenden), korrigierbar (Moeglichkeit zur Aenderung) und widerrufbar (Rueckgaengig-Funktion) sein.

**Fund — Einwilligungs-Checkboxen (Datenschutz-Modal):**
- **Datei:** `src/pages/TrainingPage.tsx:895-944`
- **Code:**
  ```tsx
  <div role="dialog" aria-modal="true" aria-labelledby="consent-modal-title">
    <h2 id="consent-modal-title">Einwilligung zur Datenverarbeitung</h2>
    <label>
      <input type="checkbox" checked={privacyChecked} onChange={...} />
      Ich habe die Datenschutzerklärung zur Kenntnis genommen ...
    </label>
    <label>
      <input type="checkbox" checked={modelChecked} onChange={...} />
      Ich willige ein, dass ... KI-Modelle (MobileNet) von Google-Servern geladen werden ...
    </label>
    <button onClick={() => setHasConsented(true)} disabled={!privacyChecked || !modelChecked}>
      Einwilligen und fortfahren
    </button>
  </div>
  ```
- **Bewertung:** Das Einwilligungs-Modal stellt eine datenschutzrechtliche Zustimmungshandlung dar. Es ist zu prufen, ob 3.3.4 hier formal greift:
  1. **Rechtliche Verpflichtung:** Die Einwilligung ist freiwillig und begruendet keine Vertragspflicht des Nutzers. Die Anwendung ist kostenlos und ohne Registrierung. Keine finanziellen Transaktionen.
  2. **Pruefbarkeit:** Der Nutzer sieht die vollstaendigen Einwilligungstexte vor dem Abklicken im Modal. Eine implizite Uebersicht ist gegeben.
  3. **Korrigierbarkeit:** Der Nutzer kann die Checkboxen beliebig oft an- und abhaken. Der "Einwilligen"-Button ist erst aktiv wenn beide Boxen angekreuzt sind. Kein unbeabsichtigtes Abschicken moeglich.
  4. **Widerrufbarkeit:** Der "Abbrechen"-Button beendet den Prozess ohne Einwilligung. Eine nachtraegliche Widerrufsoption ist nicht implementiert, was bei einer DSGVO-Einwilligung formal sinnvoll waere, aber ausserhalb des Anwendungsbereichs von WCAG 3.3.4 liegt.

**Gesamtbewertung:** WCAG 3.3.4 ist im klassischen Sinne (Finanztransaktion, Vertragsabschluss) auf diese Anwendung nicht anwendbar — es gibt keinen Kauf, keine Registrierung, keine rechtsverbindliche Transaktion. Die Einwilligung zur Datenverarbeitung stellt keine Verpflichtung des Nutzers dar, sondern eine Voraussetzung fuer die Nutzung. Da der Betreiber die BFSG-Konformitaet anstrebt, wird die Pruefung des Kriteriums dokumentiert, aber kein Verstoss festgestellt. Die bestehende Implementierung (Uebersicht vor Bestaetigunng, Korrigierbarkeit, Abbrechen-Moeglichkeit) entspricht Best Practice.

**Hinweis fuer Upload-Funktion:**
- **Datei:** `src/pages/TrainingPage.tsx:1251` (Hidden File-Input fuer Bild-Upload)
- Der Upload von Trainingsdaten ist eine technische Nutzereingabe. Hochgeladene Bilder werden ausschliesslich lokal verarbeitet und nicht auf Server uebertragen (gemaess Einwilligungstext). Es entsteht keine rechtliche oder finanzielle Transaktion. WCAG 3.3.4 ist nicht anwendbar.

---

### 4. Robust

---

#### 4.1.1: Syntaxanalyse

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.4.1.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.1

**Fund:**
- Keine doppelten statischen `id`-Attribute in den Quelldateien gefunden.
- **Datei:** `src/pages/TrainingPage.tsx:1154, 1157`
- **Code:**
  ```tsx
  aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
  ...
  {errorMsg && <span id={`error-${cls.id}`} ...>{errorMsg}</span>}
  ```
- **Bewertung:** Dynamische IDs werden korrekt und einzigartig pro Klasse generiert (`cls.id` ist eindeutig). Konform.
- **Hinweis:** Die Validitaet des gerenderten HTML kann vollstaendig nur per Lighthouse oder W3C-Validator nach dem Build geprueft werden.

---

#### 4.1.2: Name, Rolle, Wert

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.2

**Hinweis zur Abgrenzung:** Die CTA-Buttons (`LandingPage.tsx:44-49` und `LandingPage.tsx:240-245`), die einen unzureichenden Fokus-Indikator aufweisen, wurden in einer frueheren Berichtsversion faelschlicherweise unter diesem Kriterium dokumentiert. Der unzureichende Fokus-Indikator betrifft die **visuelle Erkennbarkeit des Fokus** und ist ausschliesslich unter **WCAG 2.4.7 (Fokus sichtbar)** zu bewerten. Kriterium 4.1.2 behandelt die programmatische Bestimmbarkeit von **Name, Rolle und Wert** von UI-Komponenten — nicht ihre visuelle Darstellung im fokussierten Zustand. Die Barriere ist im Abschnitt 2.4.7 korrekt dokumentiert.

**Geprueft und konform:**
- Alle `role="dialog"`-Elemente haben `aria-labelledby` mit passenden `id`-Attributen. Konform.
- `aria-modal="true"` ist auf allen Modaldialogen gesetzt. Konform.
- `aria-live="polite"` und `aria-atomic="true"` sind korrekt fuer dynamische Vorhersage-Ergebnisse eingesetzt. Konform.
- `aria-invalid` und `aria-errormessage` werden korrekt zusammen eingesetzt. Konform.
- Alle Buttons haben entweder sichtbaren Text oder explizite `aria-label`-Attribute als zugaenglichen Namen. Konform.
- SVG-Icons sind konsequent mit `aria-hidden="true"` versehen; der zugaengliche Name wird durch begleitenden Text oder `aria-label` am uebergeordneten Element bereitgestellt. Konform.

---

#### 4.1.3: Statusmeldungen

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.4.1.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.4.1.3

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:590-593`
- **Code:**
  ```tsx
  {hasTrainedModel && (
    <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
      <CheckCircle2 className="w-3 h-3 mr-1" /> Bereit
    </span>
  )}
  ```
- **Problem:** Der "Bereit"-Status nach erfolgreichem Training erscheint visuell, hat aber kein `role="status"` oder `aria-live`-Attribut. Screenreader werden nicht ueber den erfolgreichen Abschluss des Trainings informiert.

- **Datei:** `src/pages/TrainingPage.tsx:628-640`
- **Code:**
  ```tsx
  <p className="text-xs text-zinc-600 mt-3 text-center" aria-live="polite">
    {isTraining ? "Bitte warten..." : ...}
  </p>
  ```
- **Bewertung:** KONFORM — Der Trainings-Status-Text hat `aria-live="polite"`. Gut.

- **Empfehlung fuer "Bereit"-Badge:** `role="status"` hinzufuegen oder in die bestehende `aria-live`-Region integrieren.

---

### 5. BFSG-spezifische Anforderungen

---

#### BFSG §14 + Anlage 3: Erklaerung zur Barrierefreiheit

**Bewertung:** BARRIERE
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §14 Abs. 1 Nr. 2 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx`
- Eine dedizierte Barrierefreiheitserklarungsseite unter `/barrierefreiheit` ist vorhanden.
- Sie ist im Footer unter `src/components/Footer.tsx:15` verlinkt: `<Link to="/barrierefreiheit">Barrierefreiheit</Link>`. Leicht auffindbar.
- Inhalt der Erklaerung (Stand 2026-03-26):
  - Konformitaetsstatus: `"voll konform"` — aktuell falsch (diese Pruefung hat Barrieren identifiziert).
  - Bekannte Barrieren: `"keine bekannt"` — widerlegt durch diese Pruefung.
  - Feedback-Mechanismus: E-Mail `yannickschaefer@boomapps.de` — vorhanden und zugaenglich.
  - Antwortfrist: 30 Tage — angegeben.
  - Marktueberwaachungsbehoerde: Nur allgemeiner Hinweis ("zustaendige Behoerde in Ihrem Bundesland") — konkrete Benennung fehlt.
  - Datum: `2026-03-26` — aktuell.

**Problem 1 — Falscher Konformitaetsstatus (BARRIERE):**
- **Datei:** `src/pages/AccessibilityPage.tsx:53-55`
- **Code:**
  ```tsx
  Diese Website ist <strong>voll konform</strong> mit den Anforderungen der WCAG 2.1 Level AA ...
  ```
- Diese Angabe ist nach Abschluss dieser Pruefung nachweislich falsch. Die Erklaerung muss den tatsaechlichen Status korrekt wiedergeben. Gemaess Anlage 3 BFSG sind drei Konformitaetsstufen vorgesehen:
  - **"Voll konform"**: Keine Nichtkonformitaeten oder Ausnahmen.
  - **"Teilweise konform"**: Einige Anforderungen nicht erfuellt, mit konkreter Begruendung.
  - **"Nicht konform"**: Ueberwiegende Nichtkonformitaet.
- Da mehrere Level-A und Level-AA-Barrieren identifiziert wurden (alert()-Dialoge, Fokus-Indikator, Farb-Differenzierung), ist der korrekte Status **"Teilweise konform"** oder **"Nicht konform"**.

  **Erforderliche Textaenderung in `AccessibilityPage.tsx` (Zeile 53-55):**
  ```tsx
  Diese Website ist <strong>teilweise konform</strong> mit den Anforderungen der WCAG 2.1 Level AA ...
  Folgende Anforderungen werden derzeit nicht erfüllt (Stand 2026-03-26):
  ```

**Problem 2 — Fehlende Auflistung bekannter Barrieren (BARRIERE):**
- **Datei:** `src/pages/AccessibilityPage.tsx:57-60`
- **Code:**
  ```tsx
  Zum Zeitpunkt der letzten Prüfung sind keine nicht barrierefreien Inhalte bekannt.
  ```
- Gemaess Anlage 3 BFSG muessen bekannte Nichtkonformitaeten mit Begruendung aufgefuehrt werden. Folgende Barrieren muessen in der Erklaerung als bekannte Einschraenkungen eingetragen werden:

  | Barriere | WCAG-Kriterium | Fundort | Status |
  |---|---|---|---|
  | Fehlermeldungen beim Modelltraining ueber native alert()-Dialoge statt ARIA-konformer Inline-Meldungen | 2.1.1 / 3.3.1 / 4.1.3 | `/lernen` | Behebung geplant |
  | Fokus-Indikator der CTA-Buttons (30 % Opazitaet auf rotem Hintergrund) kaum erkennbar | 2.4.7 | `/` | Behebung geplant |
  | Link im Datenschutztext nur durch Farbe vom umgebenden Text unterscheidbar | 1.4.1 | `/datenschutz` | Behebung geplant |
  | Sichtbarer E-Mail-Linktext nicht im zugaenglichen Namen (aria-label) des Links enthalten | 2.5.3 | `/impressum` | Behebung geplant |

  **Erforderliche Textaenderung in `AccessibilityPage.tsx`:** Abschnitt "Bekannte nicht barrierefreie Inhalte" durch obige Liste oder gleichwertige textliche Beschreibung ersetzen. Formulierungsbeispiel:
  ```
  Folgende Inhalte und Funktionen sind derzeit nicht vollständig barrierefrei zugänglich:
  1. Fehlermeldungen beim Modelltraining (/lernen): ...
  2. Fokus-Indikator der Hauptaktions-Buttons (Startseite): ...
  3. Externer Link im Datenschutztext (/datenschutz): ...
  4. E-Mail-Link im Impressum (/impressum): ...
  ```

**Problem 3 — Fehlende konkrete Benennung der Marktueberwaachungsbehoerde (BARRIERE):**
- **Datei:** `src/pages/AccessibilityPage.tsx:86-89`
- **Code:**
  ```tsx
  <p className="font-semibold text-zinc-800">Marktüberwachungsbehörde gemäß BFSG</p>
  <p>Für weitere Informationen wenden Sie sich an die zuständige Behörde in Ihrem Bundesland.</p>
  ```
- Gemaess Anlage 3 BFSG muss die zustaendige Marktueberwaachungsbehoerde **namentlich und mit Adresse** angegeben werden. Ein allgemeiner Hinweis auf "die Behoerde in Ihrem Bundesland" erfuellt diese Anforderung nicht.

  **Konkrete Behoerde fuer BFSG-Dienstleistungen (elektronischer Geschaeftsverkehr):**
  Nach BFSG §§ 28-31 sind fuer Dienstleistungen des elektronischen Geschaeftsverkehrs die **Marktueberwaachungsbehoerden der Laender** zustaendig. Die zustaendige Behoerde richtet sich nach dem Niederlassungsort des Anbieters.

  Da die Anwendung von BoomApps (Yannick Schaefer) betrieben wird und der Niederlassungsort aus dem Impressum entnommen werden muss, ist die zustaendige Behoerde des jeweiligen Bundeslandes einzutragen.

  **Allgemeine Anlaufstelle fuer Beschwerden und Auskunft (bundesweit):**
  Eine zentrale Marktueberwaachungsbehoerde fuer alle BFSG-Dienstleistungen ist noch nicht abschliessend etabliert. Die Bundeslaender benennen eigene Behoerden. Als erster Kontakt wird oft die **Bundesnetzagentur** fuer Telekommunikationsdienste bzw. die **ZVEI-Koordinierungsstelle** empfohlen. Fuer E-Commerce-Dienstleistungen ist typischerweise die Gewerbeaufsicht / Marktueberwaachungsbehoerde des jeweiligen Bundeslandes zustaendig.

  **Erforderliche Textaenderung in `AccessibilityPage.tsx` (Zeile 86-89):** Den Platzhaltertext durch die tatsaechlich zustaendige Behoerde ersetzen. Bis zur abschliessenden Klaerung kann folgende Formulierung gemaess aktueller Rechtslage verwendet werden:
  ```tsx
  <address>
    <p className="font-semibold text-zinc-800">Marktüberwachungsbehörde gemäß BFSG</p>
    <p>Die zuständige Marktüberwachungsbehörde für Dienstleistungen gemäß BFSG
    richtet sich nach dem Bundesland des Anbieters. Für BoomApps (Niederlassung: [Bundesland einsetzen])
    ist zuständig:</p>
    <p>[Name der Landesbehörde]<br />
    [Anschrift]<br />
    [Telefon, E-Mail]</p>
  </address>
  ```
  Ersatzweise kann auf die offizielle BFSG-Informationsseite des BMAS (Bundesministerium fuer Arbeit und Soziales) verwiesen werden: `https://www.bmas.de/barrierefreiheitsstaerkungsgesetz`.

---

#### BFSG §14: Feedback-Mechanismus

**Bewertung:** KONFORM
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §14 i.V.m. Anlage 3

**Fund:**
- **Datei:** `src/pages/AccessibilityPage.tsx:69-76`
- **Code:**
  ```tsx
  <a
    href="mailto:yannickschaefer@boomapps.de"
    ...
    aria-label="E-Mail für Barrierefreiheits-Feedback an Yannick Schäfer schreiben"
  >
    yannickschaefer@boomapps.de
  </a>
  ```
- Ein E-Mail-Kontakt fuer Barrieren-Meldungen ist vorhanden und zugaenglich verlinkt. Der Link hat einen beschreibenden `aria-label`. Konform.

---

#### BFSG Anwendungsbereich

**Bewertung:** WARNUNG (manuelle Pruefung erforderlich)
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §§ 1, 2

**Fund:**
- Die Website ist eine Bildungsanwendung (KI-Lernplattform fuer Schueler). Es ist zu pruefen, ob das Angebot unter den Anwendungsbereich des BFSG faellt (insbesondere als "Dienstleistung im Bereich elektronischer Geschaeftsverkehr" oder aehnliches).
- Die Betreiber (Yannick Schaefer, BoomApps) muessen selbst pruefen, ob sie die Kleinstunternehmen-Ausnahme in Anspruch nehmen koennen (< 10 Mitarbeiter UND < 2 Mio. EUR Umsatz).
- Die Barrierefreiheitserklarung auf der Website deutet darauf hin, dass der Betreiber das BFSG als anwendbar betrachtet.

---

### Phase 1 Ergebnis

| | |
|---|---|
| Kritische Barrieren (Level A/AA) | 4 |
| Warnungen | 10 |
| Konforme Punkte | 18 |
| Geprueft | 2026-03-26 |
| Korrektur / Erweiterung | 2026-03-26 (Maengelliste vom bericht-validierer abgearbeitet) |

**Barrieren-Uebersicht (aktualisiert):**
1. **2.1.1 / 4.1.3 — alert()-Dialoge fuer Fehlermeldungen** (`TrainingPage.tsx:436, 444, 449`): Native `alert()`-Aufrufe sind nicht ARIA-konform und integrieren Fehlermeldungen nicht zugaenglich in den Screenreader-Kontext.
2. **3.3.1 — Fehlererkennung unzureichend** (`TrainingPage.tsx:436, 444, 449`): Fehler beim Training werden nicht programmatisch mit dem fehlerhaften Bereich verknuepft und nach Schliessen des Dialogs nicht persistent angezeigt.
3. **2.4.7 — Fokus-Indikator unzureichend** (`LandingPage.tsx:44-49, 240-245`): Die CTA-Buttons deaktivieren den globalen Fokus-Outline (`focus-visible:outline-none`) und ersetzen ihn durch einen zu transparenten Ring (30% Opazitaet auf rotem Hintergrund), der fuer Nutzer mit Seheinschraenkung kaum erkennbar ist. *(Korrektur: Wurde in der vorherigen Berichtsversion faelschlicherweise unter 4.1.2 gefuehrt. Korrekte Primaeerzuordnung ist 2.4.7 — Fokus sichtbar.)*
4. **BFSG §14 i.V.m. Anlage 3 — Erklaerung zur Barrierefreiheit inhaltlich nicht konform** (`AccessibilityPage.tsx`): Drei Pflichtinhalte sind fehlerhaft oder fehlend: (a) Konformitaetsstatus "voll konform" ist nach Pruefungsergebnis falsch, (b) bekannte Barrieren sind nicht aufgelistet, (c) Marktueberwaachungsbehoerde ist nicht konkret benannt. *(Neu identifiziert bei Bearbeitung der Maengelliste.)*

---

## Phase 2: Lighthouse Accessibility Audit

| | |
|---|---|
| **Methode** | Lighthouse CLI 13.0.3 |
| **Server gestartet** | Nein (URL direkt übergeben: http://localhost:3000/) |
| **Geprüfte URLs** | 4 URLs (`/`, `/lernen`, `/impressum`, `/datenschutz`) |
| **Sitemap** | Gefunden (`/sitemap.xml`) |
| **Datum** | 2026-03-26 |
| **Lighthouse Score (Ø)** | 99% |
| **Score je URL** | `/`: 100%, `/lernen`: 100%, `/impressum`: 100%, `/datenschutz`: 96% |

### Befunde (Phase 2)

---

#### 1.4.1: Verwendung von Farbe

**Bewertung:** BARRIERE
**WCAG-Level:** A
**Lighthouse Audit-ID:** `link-in-text-block`

**Fund:**
- **Seite:** `http://localhost:3000/datenschutz`
- **Element:** `<a href="https://www.dataprivacyframework.gov/participant/5780" class="text-indigo-600 hover:underline">`
- **Selector:** `main.max-w-3xl > div.bg-white > p.text-zinc-600 > a.text-indigo-600`
- **Problem:** Der Link in einem Fließtextblock (`p.text-zinc-600`) ist ausschließlich durch Farbe (Indigo auf Grau) vom umgebenden Text unterscheidbar. Es fehlt ein nicht-farbbasiertes visuelles Merkmal im Ruhezustand (z.B. Unterstreichung, Fettschrift, Umrandung). Die Unterstreichung (`hover:underline`) erscheint erst beim Hover — für Tastatur- und Touchscreen-Nutzer ohne Hover-State ist der Link im Fließtext nicht von normalem Text unterscheidbar. Dies verletzt WCAG 1.4.1, das verlangt, dass Farbe nicht das einzige visuelle Mittel zur Informationsvermittlung ist.
- **Empfehlung:** `underline`-Klasse ohne Hover-Bedingung setzen (also `underline` statt `hover:underline`) oder einen zusätzlichen nicht-farbbasierten Indikator ergänzen (z.B. `font-semibold underline`).

---

#### 2.5.3: Sichtbares Label im zugänglichen Namen

**Bewertung:** BARRIERE
**WCAG-Level:** A
**Lighthouse Audit-ID:** `label-content-name-mismatch`

**Fund:**
- **Seite:** `http://localhost:3000/impressum`
- **Element:** `<a href="mailto:yannickschaefer@boomapps.de" aria-label="E-Mail an Yannick Schäfer schreiben">`
- **Selector:** `div.bg-white > div.space-y-3 > p.flex > a.text-zinc-600`
- **Problem:** Der sichtbare Linktext lautet `yannickschaefer@boomapps.de`, der zugängliche Name (via `aria-label`) lautet jedoch `"E-Mail an Yannick Schäfer schreiben"`. Der zugängliche Name enthält den sichtbaren Text nicht als Teilstring. Dies verletzt WCAG 2.5.3, das fordert, dass der zugängliche Name die im sichtbaren Label enthaltene Textsequenz enthält — damit Spracheingabe-Nutzer (z.B. Dragon NaturallySpeaking) den Link durch Vorlesen des sichtbaren Textes aktivieren können. Ein Nutzer der sagt "Klicke yannickschaefer@boomapps.de" wird den Link nicht treffen, weil der zugängliche Name abweicht.
- **Empfehlung:** `aria-label` anpassen, sodass die E-Mail-Adresse darin enthalten ist, z.B. `aria-label="E-Mail an Yannick Schäfer schreiben: yannickschaefer@boomapps.de"`. Alternativ `aria-label` entfernen und den sichtbaren Text als zugänglichen Namen verwenden (mit visuellem Kontext aus der Umgebung).

---

### Phase 2 Ergebnis

| | |
|---|---|
| Neue Barrieren (nur Phase 2) | 2 |
| Durch Phase 2 bestätigt (Überschneidung Phase 1) | 0 |
| Lighthouse Score | 99% (Ø über 4 URLs) |
| Geprüft | 2026-03-26 |

---

## Zusammenfassung

| | |
|---|---|
| **Phase 1 — Barrieren (statisch)** | 4 |
| **Phase 1 — Warnungen (statisch)** | 10 |
| **Phase 2 — Zusätzliche Barrieren (Lighthouse)** | 2 |
| **Lighthouse Score** | 99% (Ø über 4 URLs) |
| **Gesamtbarrieren** | 6 |
| **BFSG-Konformität** | NICHT KONFORM |

*Hinweis: Phase-1-Zahlen wurden durch Abarbeitung einer Mängelliste vom bericht-validierer aktualisiert (2026-03-26). Die Barriere unter 2.4.7 ersetzt die fehlzugeordnete Barriere unter 4.1.2 aus dem ursprünglichen Bericht. Neu hinzugekommen: BFSG §14-Barriere (Erklärung zur Barrierefreiheit inhaltlich nicht konform). Neu geprüft und dokumentiert: WCAG 2.2.2 (Animationen) und WCAG 3.3.4 (Fehlervermeidung).*

### Schwerwiegende Barrieren (sofortiger Handlungsbedarf)

1. **2.1.1 / 4.1.3 — alert()-Dialoge für Fehlermeldungen** (`TrainingPage.tsx:436, 444, 449`): Native `alert()`-Aufrufe sind nicht ARIA-konform und integrieren Fehlermeldungen nicht zugänglich in den Screenreader-Kontext. Fokusrückgabe nach Schließen browserabhängig.

2. **3.3.1 — Fehlererkennung unzureichend** (`TrainingPage.tsx:436, 444, 449`): Fehler beim Training werden nicht programmatisch mit dem fehlerhaften Bereich verknüpft und nach Schließen des Dialogs nicht persistent angezeigt.

3. **2.4.7 — Fokus-Indikator unzureichend** (`LandingPage.tsx:44-49, 240-245`): CTA-Buttons deaktivieren den globalen Fokus-Outline (`focus-visible:outline-none`) und ersetzen ihn durch einen zu transparenten Ring (30% Opazität auf rotem Hintergrund), der visuell kaum wahrnehmbar ist.

4. **BFSG §14 i.V.m. Anlage 3 — Erklärung zur Barrierefreiheit inhaltlich nicht konform** (`AccessibilityPage.tsx`): Drei Pflichtinhalte sind fehlerhaft: Konformitätsstatus ist fälschlicherweise "voll konform", bekannte Barrieren sind nicht aufgelistet, zuständige Marktüberwachungsbehörde ist nicht konkret benannt.

5. **1.4.1 — Link nur durch Farbe unterscheidbar** (`/datenschutz`): Externer Link im Fließtext ist ausschließlich durch Farbe vom umliegenden Text unterscheidbar; Unterstreichung erscheint erst beim Hover.

6. **2.5.3 — Sichtbares Label nicht im zugänglichen Namen** (`/impressum`): `aria-label` des E-Mail-Links enthält die sichtbare E-Mail-Adresse nicht — Spracheingabe-Nutzer können den Link nicht per Vorlesen des sichtbaren Textes aktivieren.

### Empfohlene nächste Schritte

- [ ] Manuelle Korrekturen mit hoher Priorität:
  - `TrainingPage.tsx`: `alert()`-Aufrufe durch Inline-Fehlermeldungen mit `role="alert"` ersetzen (behebt Barriere 1 und 2 gleichzeitig)
  - `LandingPage.tsx`: Fokus-Ring der CTA-Buttons auf ausreichend sichtbaren Kontrast ändern, z.B. `focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600` (behebt Barriere 3)
  - `AccessibilityPage.tsx`: Konformitätsstatus auf "Teilweise konform" ändern, bekannte Barrieren auflisten, konkrete Marktüberwachungsbehörde eintragen (behebt Barriere 4)
  - `PrivacyPage` / Datenschutz-Seite: `hover:underline` auf dauerhaftes `underline` ändern (behebt Barriere 5)
  - `ImprintPage.tsx`: `aria-label` des E-Mail-Links so anpassen, dass er die sichtbare E-Mail-Adresse enthält (behebt Barriere 6)
- [ ] Manuelle Prüfung empfohlen:
  - Kontrastprüfung `text-zinc-400` auf dunklen Hintergründen (Warnungen 1.4.3 und 1.4.11)
  - Reflow-Test bei 400% Zoom auf `TrainingPage` (Warnung 1.4.10)
  - Verifikation dass kontinuierliche `animate-pulse`-Animationen (LandingPage, TrainingPage) durch Nutzersteuerung des Kamera-Modus implizit stoppbar sind (Warnung 2.2.2)
