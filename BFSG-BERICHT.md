# BFSG/Barrierefreiheits-Pruefbericht

| | |
|---|---|
| **Datum** | 2026-03-26 |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Gepruefkte URL** | http://localhost:3000/ |
| **Pruefgrundlage** | BFSG, WCAG 2.1 AA, WCAG 2.2 AA, EN 301 549, BITV 2.0 |
| **Gesamtergebnis** | NICHT BESTANDEN — 5 Barrieren (davon 3 Level A, 1 Level AA, 1 BFSG §14) |

---

## Phase 1: Statische Codebase-Analyse

**Scope:** React/TypeScript SPA mit 4 Seiten (LandingPage, TrainingPage, ImprintPage, PrivacyPage), Footer, CookieBanner und NotFoundPage. Kein serverseitiges Rendering, keine separaten HTML-Seiten ausser `index.html`.

---

### 1. Wahrnehmbar

#### 1.1.1: Nichttextlicher Inhalt

**Bewertung:** KONFORM (mit Anmerkung)
**WCAG-Level:** A
**EN 301 549:** 9.1.1.1

**Befunde:**

- **Datei:** `src/pages/LandingPage.tsx:18-22`
- **Code:**
  ```html
  <img
    src="/ada-logo.png"
    alt="Ada Lovelace Projekt Logo"
    ...
  />
  ```
- **Bewertung:** KONFORM — Logo im Navigations-Link hat beschreibendes alt-Attribut.

- **Datei:** `src/pages/LandingPage.tsx:257-262`
- **Code:**
  ```html
  <img
    src="/ada-logo.png"
    alt=""
    aria-hidden="true"
    ...
  />
  ```
- **Bewertung:** KONFORM — Das zweite Logo-Bild in der Kooperations-Sektion ist korrekt mit leerem alt und `aria-hidden="true"` als dekorativ markiert, da der verlinkende Text "Ada-Lovelace-Projekt" als Linktext dient.

- **Datei:** `src/pages/TrainingPage.tsx:1313`
- **Code:**
  ```html
  <img src={img.dataUrl} alt="Training sample" className="w-full h-full object-cover" />
  ```
- **Bewertung:** WARNUNG — Der alt-Text "Training sample" ist auf Englisch, obwohl die App auf Deutsch ist. Zudem ist "Training sample" wenig informativ; im Kontext eines ML-Trainingsdaten-Thumbnails aber funktional akzeptabel. Empfehlung: Deutschen alt-Text verwenden, z.B. "Trainingsbild".

- **Datei:** `src/pages/ImprintPage.tsx:25-29`, `src/pages/PrivacyPage.tsx:26-30`, `src/pages/TrainingPage.tsx:496-500`
- **Code:**
  ```html
  <img
    src="/ada-logo.png"
    alt="Ada Lovelace Projekt Logo"
    ...
  />
  ```
- **Bewertung:** KONFORM — Konsistentes alt-Attribut auf allen Header-Logo-Instanzen.

**Lucide-Icons:** Alle dekorativen SVG-Icons (Brain, Camera, Zap, ArrowRight, Dog, Cat, etc.) tragen durchgängig `aria-hidden="true"`. KONFORM.

---

#### 1.2.1 / 1.2.2: Zeitbasierte Medien (Video)

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.1.2.1, 9.1.2.2

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:659-668`, `src/pages/TrainingPage.tsx:1184-1193`
- **Code:**
  ```html
  <video
    ref={predictVideoRef}
    autoPlay
    playsInline
    muted
    className="w-full h-full object-cover rounded-xl"
  />
  ```
- **Problem:** Die `<video>`-Elemente zeigen Live-Kamera-Feeds (Trainings- und Vorhersage-Ansichten). Da es sich um Live-Kamerastreams handelt (kein voraufgezeichneter Inhalt), greift WCAG 1.2.2 (Untertitel für aufgezeichnete Videos) nicht. WCAG 1.2.4 (Untertitel live) gilt nur bei Live-Übertragungen mit Sprache/Audio. Da die Videos muted sind und keinen Informationsinhalt per Audio transportieren, ist kein Handlungsbedarf für Untertitel gegeben. Beide Videos fehlen jedoch `aria-label` oder `title` zur Identifikation durch Screenreader.
- **Empfehlung:** Ein `aria-label`-Attribut hinzufügen, z.B. `aria-label="Kamera-Vorschau für Trainingsbilder"` und `aria-label="Kamera für Vorhersage"`, damit der Videobereich für Screenreader-Nutzende erkennbar ist.

---

#### 1.4.3: Kontrast (Minimum)

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.3
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.4.3

**Fund 1:**
- **Datei:** `src/pages/TrainingPage.tsx:624`, `src/pages/LandingPage.tsx` (mehrere Stellen)
- **Code:**
  ```html
  <p className="text-xs text-zinc-600 mt-3 text-center" aria-live="polite">
  ```
- **Problem:** `text-zinc-600` entspricht ungefähr `#52525b`. Auf weißem Hintergrund (`bg-white`) ergibt dies ein geschätztes Kontrastverhältnis von ca. 7:1 — KONFORM für normalen Text. Jedoch ist `text-xs` (12px) sehr klein; bei dieser Größe ist 4,5:1 erforderlich. Nach visueller Einschätzung ist der Kontrast ausreichend, eine Lighthouse-Prüfung wird empfohlen.

**Fund 2:**
- **Datei:** `src/pages/LandingPage.tsx:79`
- **Code:**
  ```html
  <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
  ```
- **Problem:** `text-zinc-400` entspricht ungefähr `#a1a1aa`. Auf dem dunklen Hintergrund `bg-zinc-900` (`#18181b`) ergibt dies ein geschätztes Kontrastverhältnis von ca. 6,4:1 — wahrscheinlich KONFORM. Manuelle Prüfung mit Lighthouse/Contrast-Checker empfohlen.

**Fund 3 (kritisch):**
- **Datei:** `src/pages/TrainingPage.tsx:1282-1286`
- **Code:**
  ```html
  <button
    onClick={() => setIsSelectionMode(true)}
    className="text-[10px] font-bold transition-opacity hover:opacity-70"
    style={{ color: cls.color }}
  >
    Auswählen
  </button>
  ```
- **Problem:** Die Klassenfarben sind dynamisch (`COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777']`). Auf weißem Hintergrund (`bg-white`): `#d97706` (Amber/Orange) hat ca. 3:1 Kontrastverhältnis — unterschreitet die 4,5:1-Anforderung für normalen Text. Bei `text-[10px]` ist der Text sogar kleiner als 12px, was die Anforderung noch kritischer macht. Eine statische Code-Analyse kann den exakten Kontrast nicht berechnen, daher wird dies als Warnung eingestuft; manuelle Prüfung ist nötig.
- **Empfehlung:** Alle Klassenfarben gegen 4,5:1 auf weißem Hintergrund prüfen. Ggf. dunklere Varianten der Farben für Text verwenden oder eine Fallback-Farbe definieren.

---

#### 1.4.4: Skalierung (Resize)

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.4

**Fund:**
- **Datei:** `index.html:5`
- **Code:**
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```
- **Problem:** Kein `user-scalable=no` oder `maximum-scale=1` vorhanden. Zoom ist nicht blockiert. KONFORM.

---

#### 1.4.10: Umfluss (Reflow)

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.1.4.10

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1291`
- **Code:**
  ```html
  <div className="flex-1 relative h-[190px] max-h-[190px] bg-zinc-50/50 rounded-xl border border-zinc-100 p-2 overflow-y-auto">
  ```
- **Problem:** Das Thumbnail-Grid in der ClassCard hat eine feste Höhe `h-[190px]`. Bei 320px Breite und 400% Zoom könnte das Layout in dieser Komponente horizontal scrollbar werden. Manuelle Prüfung bei 320px CSS-Breite empfohlen.
- **Empfehlung:** Prüfen ob bei sehr schmalen Viewports ein horizontales Scrollen entsteht; ggf. responsive Anpassungen vornehmen.

---

### 2. Bedienbar

#### 2.1.1: Tastatur

**Bewertung:** KONFORM (mit Anmerkungen)
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1

**Befunde:**

- Alle interaktiven Elemente verwenden native `<button>` und `<a>`-Elemente — keine klickbaren `<div>`- oder `<span>`-Elemente ohne Rolle gefunden.
- Der Aufnahme-Button in `ClassCard` (TrainingPage.tsx:1196-1230) implementiert zusätzlich zu `onMouseDown`/`onMouseUp` auch `onKeyDown`/`onKeyUp` für Space und Enter — KONFORM.
- Der `<input type="file">` (TrainingPage.tsx:1239-1247) ist mit `className="hidden"` ausgeblendet und wird durch den Upload-Button ausgelöst. Das ist ein gängiges Muster, der Button selbst ist per Tastatur erreichbar — KONFORM.

**Anmerkung:** Die `<video>`-Elemente sind nicht per Tastatur bedienbar, was für Live-Kamerastreams ohne Playback-Kontrollen akzeptabel ist (muted, autoPlay).

---

#### 2.1.1: Tastatur — Vorhersage-Start-Button

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.2.1.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:671-677`
- **Code:**
  ```html
  <button
    onClick={startPredicting}
    className="px-5 py-2.5 bg-white text-zinc-900 rounded-full text-sm font-bold ..."
  >
    <Play className="w-4 h-4 mr-2 fill-current" aria-hidden="true" /> Starten
  </button>
  ```
- **Problem:** Der "Starten"-Button hat keinen `aria-label` und keinen expliziten `focus-visible`-Stil. Da `focus:not(:focus-visible)` in `index.css` den Standard-Outline entfernt und kein `focus-visible`-Ring für diesen Button definiert ist, könnte der Fokusindikator fehlen. Manuelle Prüfung empfohlen.
- **Empfehlung:** `focus-visible:ring-2 focus-visible:ring-indigo-500` zur Button-Klasse hinzufügen.

---

#### 2.4.1: Blöcke überspringen (Skip-Link)

**Bewertung:** BARRIERE
**WCAG-Level:** A
**EN 301 549:** 9.2.4.1
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.1

**Fund:**
- **Datei:** `index.html`, `src/App.tsx`, alle Seiten-Komponenten
- **Code:** Kein Skip-Link vorhanden. Das erste Element im `<body>` ist `<div id="root">`, gefolgt von React-Rendering ohne Skip-Link.
- **Problem:** Es fehlt ein "Zum Inhalt springen"-Link als erstes fokussierbares Element im Body. Tastaturnutzende und Screenreader-Nutzende müssen bei jedem Seitenaufruf die gesamte Navigation durchlaufen, bevor sie den Hauptinhalt erreichen. Die Seiten haben sticky Header-Navigationen.
- **Empfehlung:** Einen visuell versteckten, bei Fokus sichtbaren Skip-Link als erstes Element einfügen:
  ```html
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg">
    Zum Inhalt springen
  </a>
  ```
  und das `<main>`-Element mit `id="main-content"` versehen.

---

#### 2.4.2: Seite mit Titel

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.2.4.2

**Fund:**
- **Datei:** `index.html:22`
- **Code:**
  ```html
  <title>KI Bilderkennung für Schüler</title>
  ```
- **Problem:** Es gibt nur einen einzigen `<title>` in `index.html` für die gesamte SPA. Die Unterseiten (Impressum, Datenschutz, TrainingPage, 404) haben keinen eigenen `<title>`. Bei Navigation zwischen den Routen bleibt der Titel immer "KI Bilderkennung für Schüler", unabhängig vom Inhalt der aktuellen Seite. Screenreader-Nutzende und Browsertabs können die aktuelle Seite nicht am Titel identifizieren.
- **Empfehlung:** Den `<title>` dynamisch per React-Helmet, `useEffect` mit `document.title = ...` oder einer Routing-Bibliothek bei jedem Seitenwechsel aktualisieren. Beispiel:
  ```tsx
  // In ImprintPage.tsx
  useEffect(() => { document.title = 'Impressum — KI Bilderkennung für Schüler'; }, []);
  // In TrainingPage.tsx
  useEffect(() => { document.title = 'Modell trainieren — KI Bilderkennung für Schüler'; }, []);
  ```

---

#### 2.4.3: Fokus-Reihenfolge

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.2.4.3

**Befunde:**
- Kein `tabindex` mit positivem Wert (>0) gefunden — KONFORM.
- Der CookieBanner erhält `tabIndex={-1}` auf dem Container und nutzt einen Focus-Trap (`useFocusTrap`-Hook) — korrekte Implementierung.
- Alle Modals in TrainingPage nutzen `useFocusTrap` — korrekte Fokus-Verwaltung.

---

#### 2.4.7: Fokus sichtbar

**Bewertung:** BARRIERE
**WCAG-Level:** AA
**EN 301 549:** 9.2.4.7
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.2.4.7

**Fund:**
- **Datei:** `src/index.css:32-35`
- **Code:**
  ```css
  :focus:not(:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }
  ```
- **Problem:** Diese Regel ist für sich betrachtet korrekt (entfernt nur den Fokus bei Maus-Klick, nicht bei Tastaturnavigation). Das eigentliche Problem ist, dass zahlreiche Buttons und interaktive Elemente *keinen* expliziten `:focus-visible`-Stil definieren. Konkrete Problemfälle:

  1. **Datei:** `src/pages/TrainingPage.tsx:671` — "Starten"-Button (Vorhersage): kein `focus-visible`-Ring.
  2. **Datei:** `src/pages/TrainingPage.tsx:711` — "Stoppen"-Button: kein `focus-visible`-Ring.
  3. **Datei:** `src/pages/TrainingPage.tsx:787-795` — "Abbrechen"/"Unwiderruflich löschen"-Buttons in Modals: kein `focus-visible`-Ring.
  4. **Datei:** `src/pages/LandingPage.tsx:236-241` — Zweiter CTA-Button "Jetzt ausprobieren": kein `focus-visible`-Ring (nur der erste CTA-Button hat einen).
  5. **Datei:** `src/pages/NotFoundPage.tsx:22-28` — "Zurück zur Startseite"-Button: kein `focus-visible`-Ring.
  6. **Datei:** `src/pages/TrainingPage.tsx:1260-1288` — "Löschen"/"Abbrechen"/"Auswählen"-Buttons im Thumbnail-Bereich: kein `focus-visible`-Ring.

- **Weiterer Fund:**
  - **Datei:** `src/index.css:38-40`
  - **Code:**
    ```css
    div[role="dialog"]:focus {
      outline: none;
    }
    ```
  - **Problem:** Diese Regel entfernt den Outline für alle Dialog-Container wenn sie fokussiert werden. Obwohl Dialog-Container selbst keinen sichtbaren Fokus benötigen (der Fokus sollte auf interaktive Elemente im Dialog verschoben werden), ist es dennoch ein Hinweis auf eine globale Fokus-Unterdrückung.

- **Empfehlung:** Für alle Buttons ohne expliziten `focus-visible`-Stil einen Ring hinzufügen:
  ```html
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
  ```
  Eine globale Tailwind-CSS-Konfiguration oder ein `@layer base`-Block könnte alle Buttons standardmäßig mit einem sichtbaren Fokus-Ring versehen.

---

#### 2.4.11: Fokus nicht verdeckt (WCAG 2.2)

**Bewertung:** WARNUNG
**WCAG-Level:** AA (WCAG 2.2)
**EN 301 549:** 9.2.4.11

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:484`, `src/pages/ImprintPage.tsx:13`, `src/pages/PrivacyPage.tsx:14`
- **Code:**
  ```html
  <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
  ```
- **Problem:** Sticky Header mit `z-40`. Beim Tabben durch Formularfelder oder Links unter dem Header könnten fokussierte Elemente teilweise verdeckt werden. Manuelle Tastaturprüfung empfohlen.
- **Empfehlung:** `scroll-padding-top` in der CSS-Konfiguration setzen, damit fokussierte Elemente nicht hinter dem Sticky-Header verschwinden:
  ```css
  html {
    scroll-padding-top: 5rem; /* Höhe des Headers */
  }
  ```

---

#### 2.5.8: Zielgröße Minimum (WCAG 2.2)

**Bewertung:** WARNUNG
**WCAG-Level:** AA (WCAG 2.2)
**EN 301 549:** 9.2.5.8

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1159-1173`
- **Code:**
  ```html
  <button
    onClick={handleClear}
    className="text-zinc-400 hover:text-indigo-500 transition-colors"
    ...
  >
    <RotateCcw className="w-4 h-4" aria-hidden="true" />
  </button>
  <button
    onClick={onRemove}
    className="text-zinc-400 hover:text-red-500 transition-colors"
    ...
  >
    <Trash2 className="w-4 h-4" aria-hidden="true" />
  </button>
  ```
- **Problem:** Die Icon-Buttons (RotateCcw, Trash2) haben das Icon `w-4 h-4` (16×16px) ohne Padding auf dem Button selbst. Die Klickfläche beträgt damit weniger als 24×24 CSS-Pixel (WCAG 2.2 Mindestanforderung). Diese Buttons sind in der ClassCard-Kopfzeile positioniert.
- **Empfehlung:** Den Buttons ausreichend Padding hinzufügen: `p-2` ergibt 16+8+8=32px Gesamtgröße:
  ```html
  className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors rounded"
  ```

---

### 3. Verständlich

#### 3.1.1: Sprache der Seite

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.1.1

**Fund:**
- **Datei:** `index.html:2`
- **Code:**
  ```html
  <html lang="de">
  ```
- **Bewertung:** KONFORM — Sprache ist korrekt als Deutsch deklariert.

---

#### 3.1.2: Sprache von Teilen

**Bewertung:** WARNUNG
**WCAG-Level:** AA
**EN 301 549:** 9.3.1.2

**Fund:**
- **Datei:** `src/pages/LandingPage.tsx:107, 119, 132`
- **Code:**
  ```html
  <span className="text-red-600 text-lg">Neuronales Netz (MobileNet)</span>
  <span className="text-blue-600 text-lg">K-Nearest Neighbors (KNN)</span>
  <h3>Warum geht das so schnell? (Transfer Learning)</h3>
  ```
- **Problem:** Englische Fachbegriffe wie "MobileNet", "K-Nearest Neighbors", "Transfer Learning", "Input Layer", "Hidden Layers", "Output Layer" sind eingebettet in deutschen Text ohne `lang="en"`. Screenreader könnten diese falsch aussprechen.
- **Empfehlung:** Englische Fachbegriffe mit `lang="en"` markieren:
  ```html
  <span lang="en">K-Nearest Neighbors</span>
  <span lang="en">Transfer Learning</span>
  ```
  (Ausnahme: Eigennamen und eingebürgerte Begriffe wie "Browser" müssen nicht markiert werden.)

---

#### 3.3.1: Fehlererkennung

**Bewertung:** KONFORM
**WCAG-Level:** A
**EN 301 549:** 9.3.3.1

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:1148-1153`
- **Code:**
  ```html
  <input
    ...
    aria-invalid={!!errorMsg}
    aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
  />
  ...
  {errorMsg && <span id={`error-${cls.id}`} className="text-[10px] text-red-500 mt-1 ml-[22px]">{errorMsg}</span>}
  ```
- **Bewertung:** KONFORM — Fehler werden mit `aria-invalid` und `aria-errormessage` programmatisch kommuniziert. Fehlermeldungen sind konkret ("Name darf nicht leer sein", "Name muss eindeutig sein").

---

#### 3.3.2: Beschriftungen oder Anweisungen

**Bewertung:** BARRIERE
**WCAG-Level:** A
**EN 301 549:** 9.3.3.2
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.3.3.2

**Fund 1:**
- **Datei:** `src/pages/TrainingPage.tsx:1239-1247`
- **Code:**
  ```html
  <input
    type="file"
    ref={fileInputRef}
    onChange={handleFileUpload}
    accept="image/*"
    multiple
    className="hidden"
    aria-label="Bilder hochladen"
  />
  ```
- **Problem:** Das `<input type="file">` ist mit `className="hidden"` visuell versteckt. Es hat zwar ein `aria-label`, aber es ist programmatisch versteckt (`hidden` in CSS entfernt es aus dem Accessibility-Tree je nach Implementierung). Es gibt zwei Upload-Buttons die beide das gleiche `aria-label="Bilder hochladen"` tragen (Zeile 1235 und 1246). Screenreader würden zwei identische Labels für scheinbar zwei verschiedene Interaktionselemente hören. Das tatsächliche `<input type="file">` ist per CSS ausgeblendet und soll durch den Button (Zeile 1231) aktiviert werden — dieses Muster ist gebräuchlich, aber das doppelte `aria-label` ist verwirrend.
- **Empfehlung:** Das versteckte `<input type="file">` sollte `aria-hidden="true"` erhalten (da der sichtbare Button die Funktion übernimmt), oder das Input sollte mit dem Button über `aria-controls` verknüpft sein.

**Fund 2:**
- **Datei:** `src/pages/TrainingPage.tsx:1139-1151`
- **Code:**
  ```html
  <input
    type="text"
    value={cls.name}
    onChange={(e) => onUpdateName(e.target.value)}
    className="..."
    placeholder="Klassenname"
    aria-label={`Name für Klasse ${cls.name || 'ohne Namen'}`}
    ...
  />
  ```
- **Problem:** Das Text-Input hat sowohl `placeholder` als auch `aria-label`. Das `aria-label` ist dynamisch und ändert sich mit dem Klassennamen: `"Name für Klasse ohne Namen"` (wenn leer). Das ist akzeptabel — KONFORM nach genauerer Betrachtung.

---

#### 3.3.2: Zustimmungs-Checkboxen ohne label-Element

**Bewertung:** KONFORM (technisch)
**WCAG-Level:** A
**EN 301 549:** 9.3.3.2

**Fund:**
- **Datei:** `src/pages/TrainingPage.tsx:902-926`
- **Code:**
  ```html
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={privacyChecked}
      ...
    />
    <span className="text-zinc-700 text-sm leading-relaxed">
      Ich habe die <a href="/datenschutz" ...>Datenschutzerklärung</a> ...
    </span>
  </label>
  ```
- **Bewertung:** KONFORM — Checkboxen sind in `<label>`-Elementen eingebettet, was eine korrekte programmatische Verknüpfung herstellt.

---

### 4. Robust

#### 4.1.2: Name, Rolle, Wert

**Bewertung:** KONFORM (mit Hinweis)
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2

**Befunde:**

- Alle Dialog-Modals tragen `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (und teils `aria-describedby`) — KONFORM.
- Der CookieBanner verwendet korrekt `role="alertdialog"`, `aria-modal="true"`, `aria-label` — KONFORM.
- Alle Buttons haben entweder sichtbaren Textinhalt oder `aria-label` — KONFORM.
- **Datei:** `src/pages/LandingPage.tsx:461`
- **Code:**
  ```html
  <div className="mt-12 text-center h-16" aria-live="polite">
  ```
- **Bewertung:** KONFORM — Ergebnis-Anzeige der Neural-Net-Visualisierung nutzt `aria-live="polite"` korrekt.

**Hinweis (nicht barrierewirksam):**
- **Datei:** `src/pages/TrainingPage.tsx:816-817`
- **Code:**
  ```html
  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
    <RotateCcw className="w-6 h-6" />
  </div>
  ```
- **Problem:** Dieses dekorative Warn-Icon in den Modals fehlt das `aria-hidden="true"`. Es ist zwar nicht fokussierbar, sollte aber für Screenreader als dekorativ markiert werden (vgl. ähnliche Elemente in anderen Modals die korrekt `aria-hidden="true"` tragen).
- **Empfehlung:** `aria-hidden="true"` auf dem `<div>` oder dem SVG-Icon hinzufügen (Zeilen 816, 859).

---

#### 4.1.3: Statusmeldungen

**Bewertung:** KONFORM
**WCAG-Level:** AA
**EN 301 549:** 9.4.1.3

**Befunde:**

- **Datei:** `src/pages/TrainingPage.tsx:624` — Trainingsstatus-Text trägt `aria-live="polite"` — KONFORM.
- **Datei:** `src/pages/TrainingPage.tsx:682` — Vorhersage-Ergebnisse tragen `aria-live="polite"` und `aria-atomic="true"` — KONFORM.
- **Datei:** `src/pages/TrainingPage.tsx:960` — Lade-Status trägt `aria-live="polite"` — KONFORM.
- **Datei:** `src/pages/LandingPage.tsx:461` — Neural-Net-Animations-Ergebnis trägt `aria-live="polite"` — KONFORM.

---

#### 4.1.2: Heading-Hierarchie

**Bewertung:** BARRIERE
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2 (i.V.m. 1.3.1)
**BFSG-Grundlage:** BFSG §3 i.V.m. EN 301 549 9.1.3.1 und 9.4.1.2

**Fund 1 — ImprintPage:**
- **Datei:** `src/pages/ImprintPage.tsx:31`, `src/pages/ImprintPage.tsx:40`
- **Code:**
  ```html
  <!-- Im Header: -->
  <h1 className="...">Impressum</h1>
  <!-- Im Hauptinhalt: -->
  <h1 id="imprint-title" className="...">Impressum</h1>
  ```
- **Problem:** Es gibt **zwei** `<h1>`-Elemente auf der Impressum-Seite: eines im Header und eines im Inhaltsbereich. WCAG 1.3.1 und Best Practice fordern genau eine `<h1>` pro Seite. Das zweite, dekorative `<h1>` im Header sollte semantisch nicht als `<h1>` ausgezeichnet sein.

**Fund 2 — PrivacyPage:**
- **Datei:** `src/pages/PrivacyPage.tsx:32`, `src/pages/PrivacyPage.tsx:41`
- **Code:**
  ```html
  <!-- Im Header: -->
  <h1 className="...">Datenschutzerklärung</h1>
  <!-- Im Hauptinhalt: -->
  <h1 className="...">Datenschutzerklärung</h1>
  ```
- **Problem:** Identisches Problem — zwei `<h1>`-Elemente auf der Datenschutz-Seite.

**Fund 3 — TrainingPage:**
- **Datei:** `src/pages/TrainingPage.tsx:502`, `src/pages/TrainingPage.tsx:530`, `src/pages/TrainingPage.tsx:582`, `src/pages/TrainingPage.tsx:646`
- **Code:**
  ```html
  <!-- Im Header: -->
  <h1 className="...">Modell trainieren</h1>
  <!-- Im Hauptinhalt: -->
  <h2 className="...">1. Klassen ({classes.length})</h2>
  <h2 className="...">2. Training</h2>
  <h2 className="...">3. Vorhersage</h2>
  ```
- **Bewertung:** Nur eine `<h1>` — KONFORM für TrainingPage.

**Empfehlung für ImprintPage und PrivacyPage:** Den `<h1>` im Sticky-Header durch ein `<span>` oder `<p>` ersetzen (visuell identisch, semantisch korrekt):
```html
<!-- Statt: -->
<h1 className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">Impressum</h1>
<!-- Besser: -->
<p className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1" aria-hidden="true">Impressum</p>
```
Da der `<main>`-Inhalt bereits eine `<h1>` mit der Überschrift enthält, ist die Header-Überschrift redundant und kann mit `aria-hidden="true"` ausgeblendet werden.

---

#### 4.1.2: LandingPage — Fehlende `<main>`-Landmark

**Bewertung:** WARNUNG
**WCAG-Level:** A
**EN 301 549:** 9.4.1.2 (i.V.m. 1.3.1)

**Fund:**
- **Datei:** `src/pages/LandingPage.tsx`
- **Problem:** Die LandingPage verwendet `<nav>`, `<header>`, `<section>`, `<footer>` (via Footer-Komponente) — aber keinen `<main>`-Landmark. Der Hauptinhalt ist in einem `<div className="min-h-screen ...">` enthalten. Screenreader-Nutzende, die direkt zu `<main>` navigieren wollen, finden keinen Einstiegspunkt.
- **Hinweis:** `src/App.tsx:30` enthält `<main className="flex-grow">`, das alle Seiten-Komponenten wrapping. Da `<LandingPage>` selbst kein `<main>` definiert, ist das `<main>` in App.tsx aktiv. Dies könnte zu verschachtelten Strukturen führen wenn TrainingPage und ImprintPage/PrivacyPage ihre eigenen `<main>`-Elemente haben, die dann innerhalb des äusseren `<main>` liegen.
- **Problem:** In `src/App.tsx:30` ist `<main>` als äusserer Container definiert, aber TrainingPage, ImprintPage und PrivacyPage definieren jeweils ihr eigenes `<main>` — **verschachtelte `<main>`-Elemente** sind ungültig nach HTML-Spezifikation.
- **Empfehlung:** Das `<main>` in `src/App.tsx` durch ein `<div>` ersetzen, damit jede Seite ihr eigenes semantisch korrektes `<main>` tragen kann. Die LandingPage sollte ebenfalls ein `<main>` erhalten.

---

### 5. BFSG-spezifische Anforderungen

#### BFSG §3, §14 + Anlage 3: Informationen zur Barrierefreiheit (Konformitätserklärung)

**Bewertung:** BARRIERE
**WCAG-Level:** —
**EN 301 549:** —
**BFSG-Grundlage:** BFSG §14 Abs. 1 Nr. 2 i.V.m. Anlage 3

**Fund:**
- Keine Seite zur Barrierefreiheit vorhanden. Kein Link im Footer, keine Erklärung zur Barrierefreiheit, keine Informationen nach Anlage 3 BFSG.
- **Datei:** `src/components/Footer.tsx:13-14`
- **Code:**
  ```html
  <Link to="/impressum" ...>Impressum</Link>
  <Link to="/datenschutz" ...>Datenschutz</Link>
  ```
- **Problem:** Im Footer sind nur "Impressum" und "Datenschutz" verlinkt. Eine Barrierefreiheitserklärung (nach §14 BFSG + Anlage 3) fehlt vollständig. Diese muss enthalten:
  1. Allgemeine Beschreibung der Dienstleistung und ihrer Barrierefreiheit
  2. Beschreibung, wie die Barrierefreiheitsanforderungen erfüllt werden
  3. Nicht konforme Aspekte mit Begründung
  4. Angabe der zuständigen Marktüberwachungsbehörde
- **Empfehlung:** Eine Seite `/barrierefreiheit` erstellen und im Footer verlinken. Diese Seite muss die Pflichtinformationen nach Anlage 3 BFSG enthalten.

---

#### BFSG §14 + Anlage 3: Feedback-Mechanismus

**Bewertung:** WARNUNG
**WCAG-Level:** —
**BFSG-Grundlage:** BFSG §14 + Anlage 3 (Feedback-Mechanismus)

**Fund:**
- **Datei:** `src/pages/ImprintPage.tsx:56`
- **Code:**
  ```html
  <a href="mailto:yannickschaefer@boomapps.de" ...>yannickschaefer@boomapps.de</a>
  ```
- **Problem:** Eine E-Mail-Adresse im Impressum ist technisch ein Feedback-Mechanismus. Allerdings ist dieser nicht explizit als Kanal zur Meldung von Barrierefreiheitsproblemen ausgewiesen. BFSG §14 + Anlage 3 fordert einen erkennbaren Weg für Nutzer, Barrieren zu melden.
- **Empfehlung:** In der Barrierefreiheitserklärung explizit auf die E-Mail-Adresse als Kontaktkanal für Barrierefreiheits-Feedback hinweisen. Optional ein dediziertes Kontaktformular oder eine separate E-Mail-Adresse für Barrierefreiheitsmeldungen einrichten.

---

#### BFSG §3 (3): Kleinstunternehmen-Ausnahme

**Hinweis:**
- **BFSG-Grundlage:** BFSG §3 Abs. 3 i.V.m. §2

Das Unternehmen (BoomApps, Yannick Schäfer) könnte als Kleinstunternehmen (< 10 MA, < 2 Mio. EUR Jahresumsatz) von den BFSG-Pflichten für Dienstleistungen ausgenommen sein. Ob diese Ausnahme zutrifft, kann durch eine statische Code-Analyse nicht bestimmt werden und muss rechtlich geprüft werden. Sollte die Ausnahme nicht gelten, sind alle oben genannten BFSG-spezifischen Anforderungen verbindlich.

---

### Phase 1 Ergebnis

| | |
|---|---|
| **Kritische Barrieren (Level A/AA)** | 5 |
| **Warnungen** | 10 |
| **Konforme Punkte** | 15 |
| **Geprueft** | 2026-03-26 |

**Barrieren im Überblick:**

| Nr. | Kriterium | Beschreibung | Ort |
|-----|-----------|--------------|-----|
| 1 | WCAG 2.4.1 (Level A) | Kein Skip-Link vorhanden | Alle Seiten |
| 2 | WCAG 2.4.7 (Level AA) | Fehlende Fokus-Indikatoren auf mehreren Buttons | TrainingPage, LandingPage, NotFoundPage |
| 3 | WCAG 1.3.1 / 4.1.2 (Level A) | Doppelte `<h1>`-Elemente | ImprintPage, PrivacyPage |
| 4 | WCAG 3.3.2 (Level A) | Doppeltes `aria-label` auf verstecktem File-Input | TrainingPage |
| 5 | BFSG §14 + Anlage 3 | Fehlende Barrierefreiheitserklärung | Footer / keine Seite |

**Warnungen im Überblick:**

| Nr. | Kriterium | Beschreibung | Ort |
|-----|-----------|--------------|-----|
| 1 | WCAG 1.1.1 (Level A) | Alt-Text auf Englisch ("Training sample") | TrainingPage |
| 2 | WCAG 1.2.1 (Level A) | Fehlende `aria-label` auf Video-Elementen | TrainingPage |
| 3 | WCAG 1.4.3 (Level AA) | Dynamische Klassenfarben ggf. unzureichender Kontrast | TrainingPage |
| 4 | WCAG 1.4.10 (Level AA) | Festes Thumbnail-Grid ggf. kein Reflow bei 320px | TrainingPage |
| 5 | WCAG 2.4.2 (Level A) | Seitentitel nicht dynamisch pro Route | Alle Seiten (SPA) |
| 6 | WCAG 2.4.11 (Level AA, WCAG 2.2) | Sticky Header könnte Fokus verdecken | TrainingPage, ImprintPage, PrivacyPage |
| 7 | WCAG 2.5.8 (Level AA, WCAG 2.2) | Icon-Buttons unter 24×24px | TrainingPage ClassCard |
| 8 | WCAG 3.1.2 (Level AA) | Englische Fachbegriffe ohne `lang="en"` | LandingPage |
| 9 | WCAG 4.1.2 / 1.3.1 (Level A) | Verschachtelte `<main>`-Elemente / fehlende `<main>` in LandingPage | App.tsx, LandingPage |
| 10 | BFSG §14 + Anlage 3 | E-Mail als Feedback-Kanal nicht als Barrierefreiheits-Kontakt ausgewiesen | ImprintPage |

---

## Phase 2: Lighthouse Accessibility Audit

| | |
|---|---|
| **Methode** | Lighthouse CLI 13.0.3 |
| **Server gestartet** | Nein (URL direkt übergeben) |
| **Gepruefkte URL** | http://localhost:3000/ |
| **Datum** | 2026-03-26 |
| **Lighthouse Score** | 100% |

### Befunde (Phase 2)

Lighthouse hat bei diesem Audit **keine** Accessibility-Fehler gefunden. Alle 25 automatisch prüfbaren Accessibility-Audits wurden bestanden.

#### Bestandene Audits (Auszug relevanter Prüfpunkte)

| Audit-ID | Beschreibung | Ergebnis |
|---|---|---|
| `color-contrast` | Vordergrund-/Hintergrundfarben haben ausreichendes Kontrastverhältnis | BESTANDEN |
| `button-name` | Buttons haben zugängliche Namen | BESTANDEN |
| `image-alt` | Bild-Elemente haben `[alt]`-Attribute | BESTANDEN |
| `heading-order` | Überschriften erscheinen in absteigender Reihenfolge | BESTANDEN |
| `html-has-lang` | `<html>`-Element hat `[lang]`-Attribut | BESTANDEN |
| `landmark-one-main` | Dokument hat ein `<main>`-Landmark | BESTANDEN |
| `aria-hidden-focus` | `[aria-hidden="true"]`-Elemente enthalten keine fokussierbaren Elemente | BESTANDEN |
| `aria-dialog-name` | Elemente mit `role="dialog"` haben zugängliche Namen | BESTANDEN |
| `link-name` | Links haben erkennbare Namen | BESTANDEN |
| `tabindex` | Kein Element hat einen `[tabindex]`-Wert größer als 0 | BESTANDEN |
| `target-size` | Touch-Ziele haben ausreichende Größe und Abstände | BESTANDEN |
| `meta-viewport` | `[user-scalable="no"]` wird nicht verwendet | BESTANDEN |
| `document-title` | Dokument hat ein `<title>`-Element | BESTANDEN |

**Hinweis zur Heading-Order:** Lighthouse meldet die Heading-Reihenfolge als BESTANDEN. Dies steht nicht im Widerspruch zum Phase-1-Befund (doppelte `<h1>`-Elemente auf Imprint- und PrivacyPage), da Lighthouse zur Laufzeit nur die gerenderte Startseite (LandingPage unter `/`) prüft, auf der nur eine korrekte `<h1>` existiert. Die ImprintPage und PrivacyPage werden bei diesem Single-URL-Audit nicht mit einbezogen.

**Hinweis zu `color-contrast`:** Lighthouse bestätigt, dass alle auf der LandingPage gerenderten Farben ausreichenden Kontrast haben. Der Phase-1-Befund zu dynamischen Klassenfarben auf der TrainingPage (WCAG 1.4.3, Warnung Nr. 3) bleibt bestehen, da Lighthouse nur die Startseite prüft.

**Hinweis zu `landmark-one-main`:** Lighthouse meldet ein `<main>`-Landmark als vorhanden. Das Phase-1-Befund zu verschachtelten `<main>`-Elementen (Warnung Nr. 9) bezieht sich auf andere Routen (TrainingPage, ImprintPage, PrivacyPage).

**Hinweis zu `document-title`:** Lighthouse prüft das Vorhandensein eines `<title>`-Elements (BESTANDEN). Das Phase-1-Problem der fehlenden dynamischen Seitentitel pro Route (WCAG 2.4.2, Warnung Nr. 5) ist damit nicht abgedeckt — Lighthouse prüft nicht ob der Titel bei SPA-Navigation aktualisiert wird.

#### Durch Phase 1 identifizierte Befunde, die Lighthouse NICHT abdeckt

Die folgenden Phase-1-Barrieren wurden durch den Lighthouse-Audit weder bestaetigt noch widerlegt (da sie ausserhalb des automatischen Pruefumfangs liegen):

| Phase-1-Barriere | Grund für fehlende Lighthouse-Abdeckung |
|---|---|
| WCAG 2.4.1 — Kein Skip-Link | Lighthouse prüft Skip-Links nicht automatisch |
| WCAG 2.4.7 — Fehlende Fokus-Indikatoren | Lighthouse prüft `:focus-visible`-Stile nicht |
| WCAG 3.3.2 — Doppeltes `aria-label` auf File-Input | Nur auf TrainingPage, nicht auf geprüfter Route |
| BFSG §14 — Fehlende Barrierefreiheitserklärung | Inhaltliche/rechtliche Anforderung, nicht automatisch prüfbar |

### Phase 2 Ergebnis

| | |
|---|---|
| Neue Barrieren (nur Phase 2) | 0 |
| Durch Phase 2 bestaetigt (Überschneidung Phase 1) | 0 (keine Lighthouse-Fehler) |
| Lighthouse Score | 100% |
| Geprueft | 2026-03-26 |

---

## Zusammenfassung

| | |
|---|---|
| **Phase 1 — Barrieren (statisch)** | 5 |
| **Phase 1 — Warnungen (statisch)** | 10 |
| **Phase 2 — Zusätzliche Barrieren (Lighthouse)** | 0 |
| **Lighthouse Score** | 100% |
| **Gesamtbarrieren** | 5 |
| **BFSG-Konformität** | NICHT KONFORM |

### Schwerwiegende Barrieren (sofortiger Handlungsbedarf)

Die folgenden 5 Barrieren müssen behoben werden, um BFSG-Konformität zu erreichen:

| Nr. | WCAG-Level | Kriterium | Beschreibung | Betroffene Dateien |
|-----|-----------|-----------|---|---|
| 1 | A | WCAG 2.4.1 | Kein Skip-Link vorhanden — Tastatur- und Screenreader-Nutzende müssen die gesamte Navigation bei jedem Aufruf durchlaufen | `index.html`, `src/App.tsx` |
| 2 | AA | WCAG 2.4.7 | Fehlende sichtbare Fokus-Indikatoren auf zahlreichen Buttons (Starten, Stoppen, Modals, CTA, Thumbnail-Bereich) | `TrainingPage.tsx`, `LandingPage.tsx`, `NotFoundPage.tsx` |
| 3 | A | WCAG 1.3.1 / 4.1.2 | Doppelte `<h1>`-Elemente (je eine im Header + Hauptinhalt) | `ImprintPage.tsx`, `PrivacyPage.tsx` |
| 4 | A | WCAG 3.3.2 | Doppeltes `aria-label` auf verstecktem File-Input — Screenreader hören zwei identische Labels für scheinbar verschiedene Interaktionselemente | `TrainingPage.tsx` |
| 5 | — | BFSG §14 + Anlage 3 | Fehlende Barrierefreiheitserklärung im Footer — gesetzliche Pflichtangabe nach BFSG | `Footer.tsx`, keine dedizierte Seite |

### Empfohlene nächste Schritte

- [ ] **Automatisch / schnell behebbar:**
  - Skip-Link in `index.html` oder `App.tsx` einfügen (1 Stunde)
  - Doppeltes `<h1>` in `ImprintPage.tsx` und `PrivacyPage.tsx` — Header-`<h1>` durch `<p aria-hidden="true">` ersetzen (30 Minuten)
  - Verstecktes `<input type="file">` in `TrainingPage.tsx` mit `aria-hidden="true"` versehen (15 Minuten)

- [ ] **Manuelle Korrekturen:**
  - Fokus-Indikatoren (`focus-visible:ring-2`) für alle betroffenen Buttons ergänzen — globale Tailwind-Konfiguration empfohlen (2-4 Stunden)
  - Barrierefreiheitserklärung nach BFSG §14 + Anlage 3 erstellen und im Footer verlinken (2-4 Stunden rechtliche Aufbereitung + 1 Stunde technische Umsetzung)

- [ ] **Warnungen (empfohlen, nicht zwingend für BFSG-Konformität):**
  - Seitentitel dynamisch pro Route setzen (WCAG 2.4.2)
  - `aria-label` auf Video-Elemente (WCAG 1.2.1)
  - Englische Fachbegriffe mit `lang="en"` markieren (WCAG 3.1.2)
  - Sticky-Header `scroll-padding-top` setzen (WCAG 2.4.11)
  - Icon-Button-Padding erhöhen auf mindestens 24×24px (WCAG 2.5.8)
  - Verschachtelte `<main>`-Elemente bereinigen (HTML-Spezifikation)
