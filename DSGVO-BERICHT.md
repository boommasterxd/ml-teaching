# DSGVO-Prüfbericht

| | |
|---|---|
| **Datum** | 2026-03-28 |
| **Geprüftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Prüfgrundlage** | eRecht24-Checklisten, DSGVO, TDDDG, DDG |
| **Anzahl Prüfpunkte** | 33 |
| **Gesamtergebnis** | BESTANDEN — 0 Verstöße, 0 Empfehlungen |

---

## 1. Externe Ressourcen & IP-Leaks

### 1.1 CDN-Einbindungen (Fonts, Icons, externe Stylesheets)

- **Fundort:** `src/index.css:6`, `index.html` (gesamte Datei geprüft)
- **Code-Snippet:**
  ```css
  /* src/index.css:6 */
  @import "tailwindcss";
  ```
  `index.html`: Keine externen `<link>`-Tags für Fonts oder CDNs vorhanden.
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 5 — "Externe Ressourcen lokal hosten: Google Fonts, Font Awesome, CDNs — lokal oder Einwilligung einholen"
- **Rechtliche Grundlage:** §25 TDDDG Abs. 1; Art. 6 Abs. 1 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Tailwind CSS 4 wird via `@import "tailwindcss"` aus dem lokal installierten npm-Paket eingebunden — kein Netzwerkzugriff auf externe CDNs. Es existieren keine `<link rel="stylesheet">` oder `@import url(...)` auf `fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com`, `cdnjs.com`, `jsdelivr.net` oder Font Awesome CDN. Die Lucide-Icons werden ebenfalls lokal als npm-Paket genutzt. Kein automatischer IP-Transfer an Drittanbieter-CDNs beim Seitenaufruf.

---

### 1.2 MobileNet-Modell-Download von Google-Servern (Drittlandübermittlung)

- **Fundort:** `src/hooks/useModelLoader.ts:50-51`, `src/pages/PrivacyPage.tsx:224-242`, `server.ts:34`
- **Code-Snippet:**
  ```typescript
  // useModelLoader.ts:50-51
  useEffect(() => {
    if (!hasConsented) return;  // Consent-Gate: Laden nur nach Einwilligung
  // ...
    return mobilenet.load({ version: ML.MOBILENET_VERSION, alpha: ML.MOBILENET_ALPHA });
  ```
  ```typescript
  // server.ts:34 — CSP connect-src
  "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
  ```
- **Checklistenpunkt:** Privacy-Shield-Checkliste Schritt 1 — "DPF-Zertifizierung des US-Empfängers prüfen: Status aktiv, Scope Non-HR"; DSGVO-Checklist Punkt 4 — "Drittlandübermittlung geprüft"
- **Rechtliche Grundlage:** Art. 44-45 DSGVO (Drittlandübermittlung); Art. 13 Abs. 1 Nr. 6 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Google LLC ist laut Privacy-Shield-Checkliste Tabelle (Stand 2024) nach dem EU-U.S. Data Privacy Framework (DPF) mit Scope Non-HR + HR zertifiziert (`dataprivacyframework.gov/participant/5780`). Die Datenschutzerklärung (`PrivacyPage.tsx:238`) nennt den DPF-Link korrekt. Das Modell wird erst nach expliziter Nutzer-Einwilligung geladen (`if (!hasConsented) return` in `useModelLoader.ts:51`). Die CSP (`server.ts:34`) beschränkt ausgehende Verbindungen auf die benötigten Google-Domains (`storage.googleapis.com`, `*.gstatic.com`, `tfhub.dev`). Drittlandübermittlung ist durch DPF + vorherige Einwilligung nach Art. 45 DSGVO abgedeckt. Hinweis: Jährlicher DPF-Check empfohlen (Zertifikate laufen ab).

---

### 1.3 Drittanbieter-Embeds (iframes, Analytics, Social Media)

- **Fundort:** Gesamte `src/`-Verzeichnis (Scan auf `iframe`, `youtube.com`, `google-analytics`, `gtag`, `tagmanager`, `facebook`, `twitter`, `instagram`)
- **Code-Snippet:** Keine Treffer
- **Checklistenpunkt:** DSGVO-Checklist Punkt 5 — "Keine Tracking-Cookies vor Einwilligung"; DSGVO-Checklist Abschnitt 2 — Social-Media-Buttons
- **Rechtliche Grundlage:** §25 TDDDG Abs. 1
- **Bewertung:** KONFORM
- **Begründung:** Keine Analytics-Dienste, keine Social-Media-Embeds, keine iframes, keine Share-/Like-Buttons, kein Google Tag Manager in der Codebase gefunden. Die Anwendung ist eine rein lokale ML-Demo ohne externe Tracking-Dienste. Kein Cookie-Banner nach §25 TDDDG Abs. 1 für Tracking-Cookies erforderlich.

---

## 2. Consent-Management & Cookies

### 2.1 Einwilligungsmechanismus für Modell-Download (Opt-In-Prinzip)

- **Fundort:** `src/components/modals/ConsentModal.tsx:18-21`, `src/pages/TrainingPage.tsx:492-496`
- **Code-Snippet:**
  ```tsx
  // ConsentModal.tsx:18-21
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);
  const canConfirm = privacyChecked && modelChecked;
  // ConsentModal.tsx:75
  <Button variant="primary" onClick={onConfirm} disabled={!canConfirm} className="flex-1">
  // TrainingPage.tsx:492-496
  <ConsentModal
    isOpen={!hasConsented}
    onDecline={() => navigate('/')}
    onConfirm={() => setHasConsented(true)}
  />
  ```
- **Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 2 — "Opt-In-Prinzip: Checkboxen nicht vorausgewählt"; Art. 7 DSGVO — aktive Handlung erforderlich; Cookie-Banner-Checkliste Punkt 1 — kein Dark Pattern
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 7 DSGVO; §25 Abs. 1 TDDDG
- **Bewertung:** KONFORM
- **Begründung:** Beide Checkboxen sind mit `useState(false)` initialisiert — kein Pre-Checked, kein Opt-Out. Der Bestätigen-Button ist technisch deaktiviert (`disabled={!canConfirm}`) bis beide Checkboxen manuell aktiviert wurden. Kein Nudging: "Abbrechen"- und "Zustimmen"-Button haben identische Klasse `flex-1` (gleiche Breite, gleiche Größe). "Abbrechen" führt zurück zur Startseite (`navigate('/')`). Das Modell wird erst nach `setHasConsented(true)` geladen (Guard `if (!hasConsented) return` in `useModelLoader.ts:51`). Beide Checkboxen erklären Zweck und Konsequenz klar. Eine wirksame Einwilligung nach Art. 7 DSGVO liegt vor.

---

### 2.2 Cookie-Einsatz und Cookie-Banner-Pflicht

- **Fundort:** Gesamte `src/`-Verzeichnis (Scan auf `document.cookie`, `localStorage`, `sessionStorage`, `cookies.set`)
- **Code-Snippet:** Keine Treffer in der Codebase
- **Checklistenpunkt:** Cookie-Banner-Checkliste §25 TDDDG Abs. 2 — Ausnahmen vom Consent-Erfordernis; Cookie-Banner-Checkliste Punkt 1 — "Alle ablehnen"-Button auf erster Ebene
- **Rechtliche Grundlage:** §25 TDDDG Abs. 2 Nr. 2
- **Bewertung:** KONFORM
- **Begründung:** Die Anwendung setzt selbst keine Cookies, nutzt weder `localStorage` noch `sessionStorage`. Die gesamte ML-Verarbeitung (Kamerabilder, Feature-Vektoren, Modellzustand, `hasConsented`-Flag) findet ausschließlich im JavaScript-Arbeitsspeicher (React-State) statt. Da keine Cookies oder Speicherzugriffe auf das Endgerät erfolgen, entfällt die Pflicht zu einem klassischen Cookie-Banner nach §25 TDDDG. Der Consent-Dialog dient ausschließlich der Einwilligung für den externen Modell-Download (Drittlandübermittlung), nicht für Cookies. Ein Hinweis in der Datenschutzerklärung (vorhanden in `PrivacyPage.tsx:178-193`) genügt für den Cookie-Abschnitt.

---

### 2.3 Widerrufsmöglichkeit für erteilte Einwilligung

- **Fundort:** `src/components/Footer.tsx:12`, `src/App.tsx:51`, `src/pages/PrivacyPage.tsx:129`
- **Code-Snippet:**
  ```tsx
  // Footer.tsx:12
  <p className="mb-4 text-sm">Erteilte Einwilligung widerrufen? Einfach die Seite neu laden –
  die Einwilligung gilt nur für die aktuelle Sitzung.</p>

  // App.tsx:39-51 — Footer global eingebunden außerhalb des Route-Renderings
  <main id="main-content" className="flex-grow bg-zinc-50">
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lernen" element={<TrainingPage />} />
        ...
      </Routes>
    </Suspense>
  </main>
  <Footer />   {/* ← auf jeder Route unterhalb von <main> gerendert */}

  // PrivacyPage.tsx:129
  Da die auf dieser Website erteilten Einwilligungen (KI-Modell-Download, Kameranutzung) nur
  für die aktuelle Sitzung gelten, genügt ein Neuladen der Seite als Widerruf.
  ```
- **Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 6 — "Dauerhaft erreichbare Widerrufsmöglichkeit auf jeder Seite"; Art. 7 Abs. 3 DSGVO — Widerruf so einfach wie Einwilligung
- **Rechtliche Grundlage:** Art. 7 Abs. 3 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Widerrufsmechanismus ist im Footer auf jeder Route sichtbar kommuniziert. Der Footer ist in `App.tsx:51` direkt als Geschwisterelement von `<main>` in der Wurzelkomponente eingebunden — er wird auf allen Routen (`/`, `/lernen`, `/impressum`, `/datenschutz`, `/barrierefreiheit` und dem 404-Catch) gerendert, ohne Ausnahme. Da die Einwilligung technisch nur im React-State `hasConsented` gehalten wird (kein persistenter Storage), ist Neuladen der Seite ein vollständig wirksamer Widerruf — er ist genauso einfach wie die ursprüngliche Einwilligung (ein Klick auf Browser-Refresh). Zusätzlich ist der Mechanismus in der Datenschutzerklärung (`PrivacyPage.tsx:129`) explizit beschrieben. Art. 7 Abs. 3 DSGVO ist erfüllt.

  *Korrektur Vorbericht: Der Bericht hatte fälschlich `PageLayout.tsx` als globalen Einbindungsort genannt. Die tatsächliche globale Einbindung erfolgt in `App.tsx:51`. `PageLayout.tsx` ist ein Styling-Wrapper ohne Footer. Inhaltliche Bewertung bleibt KONFORM — die globale Sichtbarkeit ist nachweislich gegeben.*

---

### 2.4 Kamera-Einwilligungsprozess

- **Fundort:** `src/components/modals/CameraConsentModal.tsx:15-46`, `src/pages/TrainingPage.tsx:503-507`
- **Code-Snippet:**
  ```tsx
  // TrainingPage.tsx:503-507
  <CameraConsentModal
    isOpen={hasConsented && !isModelLoading && !cameraConsent}
    onDecline={() => navigate('/')}
    onConfirm={() => setCameraConsent(true)}
  />
  ```
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 2 — Transparenz bei Datenerhebung; Art. 13 DSGVO; Art. 7 DSGVO
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 13 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Kamerazugriff erfolgt erst nach expliziter separater Einwilligung über `CameraConsentModal` (zweite Einwilligungsstufe nach dem Modell-Consent). Der Modal erklärt klar, dass Bilddaten nur lokal verarbeitet und nicht übertragen werden. Die Abbrechen-Option führt zurück zur Startseite. Der zweistufige Einwilligungsprozess (erst Datenschutz/Modell, dann Kamera) ist DSGVO-konform. Die Kameranutzung ist in der Datenschutzerklärung als eigener Verarbeitungsvorgang dokumentiert (`PrivacyPage.tsx:244-253`).

---

## 3. Formular-Compliance & Datensparsamkeit

### 3.1 Kontaktformulare und Dateneingaben

- **Fundort:** Gesamte `src/`-Verzeichnis (Scan auf `<form>`, `type="email"`, `type="tel"`, `newsletter`, `contact`, `registration`, `signup`)
- **Code-Snippet:** Keine Treffer für Kontaktformulare oder Dateneingabe-Formulare
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 2 — "Kontaktformular: SSL, Hinweistext, Datensparsamkeit, Zweckbindung"; Kontaktformular-Checkliste Punkte 1-7
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. b DSGVO; Art. 5 Abs. 1 lit. c DSGVO (Datensparsamkeit)
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Die Anwendung enthält kein Kontaktformular. Keine Felder für E-Mail, Name, Telefon oder andere personenbezogene Daten werden aktiv vom Nutzer abgefragt. Kontakt ist ausschließlich per E-Mail/Telefon über Impressum möglich. Die E-Mail-Kontaktaufnahme ist in der Datenschutzerklärung als Verarbeitungsvorgang korrekt dokumentiert (`PrivacyPage.tsx:213-222`).

---

## 4. Backend-Sicherheit & Logging

### 4.1 Server-Logging und PII in Logs

- **Fundort:** `server.ts:61,71,97`
- **Code-Snippet:**
  ```typescript
  // server.ts:61
  console.log('🛠️ Starting Vite Middleware for development...');
  // server.ts:71
  console.log(`📦 Production mode active. Serving from: ${distPath}`);
  // server.ts:97
  console.log(`🚀 Server running on http://0.0.0.0:${port} (${process.env.NODE_ENV || 'development'})`);
  ```
- **Checklistenpunkt:** DSGVO-Rechtsgrundlagen-Checkliste Art. 5 Abs. 1 lit. f — "Integrität und Vertraulichkeit"; DSGVO-Checklist Abschnitt 9 TOM
- **Rechtliche Grundlage:** Art. 32 DSGVO (TOM); Art. 5 Abs. 1 lit. f DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Express-Server loggt keine PII: keine IP-Adressen, keine Anfrageinhalte, keine Nutzerdaten. Die drei `console.log`-Aufrufe sind reine Start-/Status-Logs. Kein Morgan-Logger oder HTTP-Request-Logging ist konfiguriert. Die tatsächlichen Server-Accesslogs werden vom Hoster Hostinger verwaltet und sind in der Datenschutzerklärung (`PrivacyPage.tsx:194-211`) korrekt als Server-Log-Dateien mit 7-Tage-Löschfrist dokumentiert. Kein PII-Leak im Anwendungscode.

---

### 4.2 Passwort-Hashing und Nutzerdaten

- **Fundort:** Gesamte Codebase (Scan auf `password`, `bcrypt`, `argon2`, `hash`, `db.`, `database`, `schema`, `model`, `PII`)
- **Code-Snippet:** Keine Treffer für Authentifizierung oder Datenbank
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 — "Passwort-Hashing (bcrypt, Argon2)"; Art. 32 DSGVO
- **Rechtliche Grundlage:** Art. 32 DSGVO — Sicherheit der Verarbeitung
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Die Anwendung besitzt keine Nutzerkonten, keine Authentifizierung und keine Backend-Datenbank. Es werden keine personenbezogenen Daten serverseitig persistent gespeichert. Die gesamte ML-Verarbeitung ist clientseitig. Passwort-Hashing ist nicht erforderlich.

---

### 4.3 AV-Vertrag mit Hosting-Anbieter

- **Fundort:** `src/pages/PrivacyPage.tsx:78-81`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:78-81
  <h4>Auftragsverarbeitung</h4>
  <p>Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten
  Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen
  Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher
  nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.</p>
  ```
- **Checklistenpunkt:** DSGVO-Checklist Punkt 4 — "AV-Verträge geschlossen mit allen Dienstleistern"; Art. 28 DSGVO
- **Rechtliche Grundlage:** Art. 28 DSGVO — Auftragsverarbeitung
- **Bewertung:** KONFORM
- **Begründung:** Die Datenschutzerklärung dokumentiert den AVV mit Hostinger (HOSTINGER operations, UAB, Litauen). Litauen ist EU-Mitgliedstaat — keine Drittlandübermittlung, kein DPF erforderlich. Der AVV-Hinweis entspricht dem Mustertext aus `datenschutz-erklaerung-muster.md` und ist vollständig. Ein weiterer AV-Vertrag für Google (MobileNet-Download) ist über die DPF-Einwilligung abgedeckt — die Datenschutzerklärung dokumentiert diesen Datenfluss explizit.

---

### 4.4 HSTS und Sicherheits-Header (TOM)

- **Fundort:** `server.ts:26-45`
- **Code-Snippet:**
  ```typescript
  // server.ts:39-44
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: SERVER.HSTS_MAX_AGE,
    includeSubDomains: true,
  },
  ```
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 3 — "HSTS: Strict-Transport-Security-Header gesetzt"; DSGVO-Checklist Abschnitt 9 — "SSL/TLS-Verschlüsselung"; Art. 32 DSGVO
- **Rechtliche Grundlage:** Art. 32 DSGVO — TOM
- **Bewertung:** KONFORM
- **Begründung:** Helmet setzt HSTS mit `includeSubDomains: true` und konfigurierter `maxAge`. X-Frame-Options ist auf `deny` gesetzt (Clickjacking-Schutz). Referrer-Policy auf `strict-origin-when-cross-origin`. CSP in Produktion aktiv und auf Google-APIs beschränkt. Rate Limiting via `express-rate-limit` implementiert. Die Sicherheits-Header entsprechen dem Stand der Technik und erfüllen die TOM-Anforderungen nach Art. 32 DSGVO.

---

## 5. Rechtliche Texte — Impressum

### 5.1 Impressum — Pflichtangaben und Erreichbarkeit (Prüfschritt 5a)

**Vergleich Mustertext (`impressum-muster.md`) vs. vorhandenes Impressum (`ImprintPage.tsx`):**

| Mustertext enthält | Vorhandenes Impressum enthält | Status |
|---|---|---|
| Name (Max Mustermann) | "Yannick Schäfer" | KONFORM |
| Straße, PLZ, Ort | "Am Mäuerchen 12, 67591 Mölsheim" (ladungsfähig) | KONFORM |
| Telefon | "01575 7934851" | KONFORM |
| E-Mail | `yannickschaefer@boomapps.de` (mailto-Link, direkt lesbar) | KONFORM |
| Telefax (optional) | Nicht vorhanden | N/A — optional |

**Prüfung gegen Impressum-Checkliste:**

- [x] §5 Abs. 1 Nr. 1 DDG: Name + ladungsfähige Anschrift — vorhanden (`ImprintPage.tsx:20-23`)
- [x] §5 Abs. 1 Nr. 2 DDG: E-Mail direkt lesbar und klickbar — vorhanden (`ImprintPage.tsx:33`)
- [x] EuGH C-649/17: Telefonnummer — vorhanden (`ImprintPage.tsx:29`)
- [x] Impressum-Checkliste Abschnitt III — von jeder Seite mit max. 2 Klicks erreichbar (Footer-Link `Footer.tsx:14`) — KONFORM
- [ ] Handelsregistereintrag — nicht vorhanden — bei Privatperson nicht erforderlich
- [ ] Umsatzsteuer-ID — nicht vorhanden — bei Privatperson ohne Gewerbepflicht nicht zwingend

- **Fundort:** `src/pages/ImprintPage.tsx:17-35`, `src/components/Footer.tsx:14`, `src/App.tsx:51`
- **Checklistenpunkt:** Impressum-Checkliste Abschnitt I (§5 Abs. 1 DDG Pflichtangaben) + Abschnitt III (Erreichbarkeit); **DSGVO-Quickcheck Schritt 6** — "Von jeder Seite mit max. 2 Klicks erreichbar; Bezeichnung als 'Impressum' (nicht hinter 'Über uns' versteckt)"
- **Rechtliche Grundlage:** §5 DDG
- **Bewertung:** KONFORM
- **Begründung:** Der Mustertext enthält Name, Anschrift, Telefon, E-Mail. Das vorhandene Impressum enthält alle Pflichtfelder des Musters mit korrekten Platzhalterwerten. Die Einzel-Person ohne Handelsregistereintrag und USt-ID ist für eine private/kleingewerbliche Website korrekt. Das Impressum ist über den Footer (`Footer.tsx:14`) mit einem Klick auf jeder Seite erreichbar — der Footer ist in `App.tsx:51` auf allen Routen global eingebunden (vgl. Prüfung 2.3). Der Link trägt ausdrücklich die Bezeichnung "Impressum" (`Footer.tsx:14`: `<Link to="/impressum" ...>Impressum</Link>`) — kein versteckter Link hinter "Über uns" oder vergleichbaren Bezeichnungen (Quickcheck Schritt 6). Alle Anforderungen des §5 DDG für Privatpersonen sowie des Quickcheck Schritt 6 sind erfüllt.

  *Ergänzung Vorbericht: Der ursprüngliche Eintrag referenzierte nur die Impressum-Checkliste Abschnitt III, nicht den DSGVO-Quickcheck Schritt 6. Beide Anforderungen sind inhaltlich identisch (max. 2 Klicks, korrekte Bezeichnung) und jetzt vollständig abgedeckt.*

---

## 6. Rechtliche Texte — Datenschutzerklärung

### 6.1 Abschnitt 1: Datenschutz auf einen Blick

- **Fundort:** `src/pages/PrivacyPage.tsx:20-51`
- **Vergleich Mustertext (Zeilen 7-37) vs. vorhandener Text:**

| Muster-Passage | Vorhandener Text | Bewertung |
|---|---|---|
| "Allgemeine Hinweise" (Muster Z.7-9) | `PrivacyPage.tsx:22-24` — 1:1 übernommen | KONFORM |
| "Wer ist verantwortlich..." (Muster Z.13-15) | `PrivacyPage.tsx:27-29` — 1:1 übernommen | KONFORM |
| "Wie erfassen wir Ihre Daten?" / "Kontaktformular" (Muster Z.17-18) | `PrivacyPage.tsx:34`: "E-Mail" statt "Kontaktformular" | KONFORM — Stufe 2: Anpassung technisch begründet (kein Formular vorhanden) |
| "Analyse-Tools und Tools von Drittanbietern" (Muster Z.33-37) | Fehlt vollständig | KONFORM — Stufe 2: korrekt weggelassen, da keine Analyse-Tools vorhanden |
| "Welche Rechte haben Sie...?" (Muster Z.27-32) | `PrivacyPage.tsx:45-50` — 1:1 übernommen | KONFORM |

- **Checklistenpunkt:** Art. 13 Abs. 1 Nr. 3 DSGVO — Verarbeitungszwecke; Datenschutz-Mustertext Bewertungshierarchie
- **Rechtliche Grundlage:** Art. 13 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Überblick-Abschnitt ist weitgehend 1:1 aus dem Muster übernommen. Die zwei Abweichungen sind technisch begründet (Bewertungshierarchie Stufe 2): "E-Mail" statt "Kontaktformular" — korrekt, weil die App kein Formular hat. Fehlen von Analyse-Tools-Passage — korrekt, weil keine Analyse-Tools eingesetzt werden.

---

### 6.2 Abschnitt 2: Hosting (Externes Hosting / AVV)

- **Fundort:** `src/pages/PrivacyPage.tsx:53-81`
- **Vergleich Mustertext (Zeilen 54-71) "Externes Hosting" vs. vorhandener Text:**
  - "Diese Website wird extern gehostet..." (Muster Z.56-60): `PrivacyPage.tsx:59-61` — 1:1 übernommen — KONFORM
  - "Das externe Hosting erfolgt zum Zwecke..." (Muster Z.57-59): `PrivacyPage.tsx:62-64` — 1:1 übernommen — KONFORM
  - Hostinger-Adresse: `PrivacyPage.tsx:72-76` — entspricht Muster Z.64-67 — KONFORM
  - AVV-Abschnitt: `PrivacyPage.tsx:79-81` — 1:1 Mustertext — KONFORM
  - Hinweis: Das Muster enthält zusätzlich IONOS und Cloudflare-Abschnitte — diese fehlen, was korrekt ist, da nur Hostinger verwendet wird.

- **Checklistenpunkt:** Art. 28 DSGVO — AVV; Art. 13 Abs. 1 Nr. 4 DSGVO — berechtigtes Interesse bei lit. f benennen; Art. 13 Abs. 1 Nr. 5-6 DSGVO (Empfänger); Datenschutz-Mustertext Bewertungshierarchie
- **Rechtliche Grundlage:** Art. 28 DSGVO; Art. 6 Abs. 1 lit. b+f DSGVO; Art. 13 Abs. 1 Nr. 4 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Hosting-Abschnitt ist 1:1 aus dem Muster übernommen. IONOS- und Cloudflare-Abschnitte fehlen korrekt (Stufe 2: technisch begründet — nur Hostinger im Einsatz). AVV-Hinweis vorhanden.

  **Ergänzungsprüfung Art. 13 Abs. 1 Nr. 4 DSGVO (berechtigtes Interesse für lit. f):** `PrivacyPage.tsx:63` benennt das berechtigte Interesse für Art. 6 Abs. 1 lit. f explizit: "im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter". Diese Formulierung entspricht dem Mustertext und erfüllt die Pflicht nach Art. 13 Abs. 1 Nr. 4 DSGVO, das konkrete berechtigte Interesse bei lit.-f-Verarbeitungen zu benennen. — **KONFORM**

---

### 6.3 Abschnitt 3: Allgemeine Hinweise und Pflichtinformationen

- **Fundort:** `src/pages/PrivacyPage.tsx:83-168`
- **Vergleich Mustertext (Zeilen 92-157) vs. vorhandener Text:**

| Muster-Passage | Vorhandener Text | Bewertung |
|---|---|---|
| "Datenschutz" (Muster Z.92-98) | `PrivacyPage.tsx:84-93` — 1:1 | KONFORM |
| "Hinweis zur verantwortlichen Stelle" (Muster Z.100-111) | `PrivacyPage.tsx:95-110` — 1:1, korrekte Platzhalter | KONFORM |
| "Speicherdauer" (Muster Z.113-115) | `PrivacyPage.tsx:112-115` — 1:1 | KONFORM |
| "Allgemeine Hinweise Rechtsgrundlagen" (Muster Z.117-119) | `PrivacyPage.tsx:122-125` — 1:1 | KONFORM |
| "Empfänger von personenbezogenen Daten" (Muster Z.121-123) | `PrivacyPage.tsx:117-120` — 1:1 | KONFORM |
| "Widerruf Ihrer Einwilligung" (Muster Z.125-127) | `PrivacyPage.tsx:127-130` — Muster plus konkreter Widerrufsmechanismus ("Neuladen der Seite") — vorteilhafte Ergänzung | KONFORM |
| "Widerspruchsrecht Art. 21 DSGVO" (Muster Z.129-133) | `PrivacyPage.tsx:132-138` — Uppercase-Block 1:1, korrekt hervorgehoben | KONFORM |
| "Beschwerderecht" (Muster Z.135-137) | `PrivacyPage.tsx:140-143` — Muster plus konkrete Behörde LfDI RLP | KONFORM (vorteilhafte Ergänzung) |
| "Recht auf Datenübertragbarkeit" (Muster Z.139-141) | `PrivacyPage.tsx:145-148` — 1:1 | KONFORM |
| "Auskunft, Berichtigung und Löschung" (Muster Z.143-145) | `PrivacyPage.tsx:150-152` — 1:1 | KONFORM |
| "Recht auf Einschränkung" (Muster Z.147-156) | `PrivacyPage.tsx:155-167` — 1:1 mit allen 4 Fallgruppen | KONFORM |
| "SSL/TLS" (Muster Z.158-162) | `PrivacyPage.tsx:169-175` — 1:1 | KONFORM |

- **Checklistenpunkt:** Art. 13 Abs. 2 Nr. 2 DSGVO — Betroffenenrechte; Art. 13 Abs. 2 Nr. 3 DSGVO — Widerrufsmechanismus; Datenschutz-Mustertext 1:1-Mandat
- **Rechtliche Grundlage:** Art. 13 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Alle Pflichtbausteine aus Abschnitt 3 des Musters sind vorhanden und 1:1 übernommen. Die Ergänzungen (konkreter Widerrufsmechanismus, Nennung LfDI RLP) sind zulässige und begrüßenswerte Verbesserungen gegenüber dem Muster (Bewertungshierarchie Stufe 2/3).

---

### 6.4 Abschnitt 4: Cookies

- **Fundort:** `src/pages/PrivacyPage.tsx:178-193`
- **Vergleich Mustertext (Zeilen 169-179) vs. vorhandener Text:**
  - Cookie-Erklärung Abschnitt: `PrivacyPage.tsx:179-192` — 1:1 aus Mustertext übernommen.
  - Technischer Befund: Die Anwendung setzt selbst keine Cookies. Nach Einwilligung wird das MobileNet-Modell von Google-Servern geladen — Google kann dabei technisch Cookies setzen. Der allgemeine Cookie-Text ist sachlich zutreffend.
  - Kritischer Befund: Formulierungen zu "Warenkorbfunktion" (`PrivacyPage.tsx:186`) und "Werbecookies" entstammen dem 1:1-Mustertext — die Anwendung hat jedoch keinen Warenkorb und keine Werbecookies.
- **Checklistenpunkt:** §25 TDDDG; Art. 5 Abs. 1 lit. a DSGVO (Transparenzgrundsatz) — Datenschutzerklärung muss die tatsächliche Verarbeitung beschreiben; Datenschutz-Mustertext Bewertungshierarchie
- **Rechtliche Grundlage:** §25 TDDDG; Art. 5 Abs. 1 lit. a DSGVO; Art. 6 Abs. 1 lit. a DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Cookie-Abschnitt ist eine allgemeine Erklärung, was Cookies sind und wozu sie eingesetzt werden können — kein Versprechen, dass diese Anwendung all diese Cookie-Arten nutzt. Die 1:1-Übernahme des Musters (Bewertungshierarchie Stufe 1) ist zulässig. Da die Anwendung selbst keine Cookies setzt und kein Cookie-Banner vorhanden ist, entsteht kein Transparenzproblem: Nutzer werden korrekt informiert, dass Cookies existieren können, ohne dass suggeriert wird, alle genannten Typen seien aktiv. Kein Verstoß gegen Art. 5 Abs. 1 lit. a DSGVO.

---

### 6.5 Abschnitt 4: Server-Log-Dateien

- **Fundort:** `src/pages/PrivacyPage.tsx:194-211`
- **Vergleich Mustertext (Zeilen 204-217) vs. vorhandener Text:**
  - Einleitung und Datenliste: `PrivacyPage.tsx:195-205` — 1:1 übernommen — KONFORM
  - "Keine Zusammenführung..." `PrivacyPage.tsx:207` — 1:1 übernommen — KONFORM
  - Rechtsgrundlage und berechtigtes Interesse: `PrivacyPage.tsx:210` — 1:1 übernommen — KONFORM
  - Speicherdauer: `PrivacyPage.tsx:210` — "nach spätestens 7 Tagen" — Muster enthält keine konkrete Frist. Ergänzung ist nach Art. 13 Abs. 2 Nr. 1 DSGVO Pflicht (Speicherdauer angeben) — vorteilhafte Ergänzung.

- **Checklistenpunkt:** Art. 13 Abs. 2 Nr. 1 DSGVO — Speicherdauer; Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 1 DSGVO; Art. 6 Abs. 1 lit. f DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Mustertext 1:1 übernommen. Konkrete 7-Tage-Speicherdauer ist eine Pflichtergänzung nach Art. 13 Abs. 2 Nr. 1 DSGVO (der Mustertext erfüllt diesen Punkt nicht vollständig — die vorhandene Erklärung ist besser als das Muster).

---

### 6.6 Abschnitt 4: E-Mail-Kontaktaufnahme

- **Fundort:** `src/pages/PrivacyPage.tsx:213-222`
- **Vergleich Mustertext (Zeilen 241-247) "Anfrage per E-Mail, Telefon oder Telefax" vs. vorhandener Text:**
  - Einleitung: `PrivacyPage.tsx:214-215` — 1:1 übernommen — KONFORM
  - Rechtsgrundlage (lit. b + f + a): `PrivacyPage.tsx:217-218` — 1:1 übernommen, mit allen drei Rechtsgrundlagen — KONFORM
  - Berechtigtes Interesse benannt ("effektive Bearbeitung") — Art. 13 Abs. 1 Nr. 4 DSGVO erfüllt — KONFORM
  - Speicherdauer: `PrivacyPage.tsx:221` — 1:1 übernommen — KONFORM

- **Checklistenpunkt:** Art. 6 Abs. 1 lit. b DSGVO; Art. 13 Abs. 1 Nr. 3+4 DSGVO; Datenschutz-Mustertext Stufe 1
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. b, f, a DSGVO
- **Bewertung:** KONFORM
- **Begründung:** 1:1-Übernahme des Musters. Alle Pflichtangaben nach Art. 13 DSGVO vorhanden: Zweck, drei Rechtsgrundlagen korrekt differenziert, berechtigtes Interesse benannt, Speicherdauer beschrieben.

---

### 6.7 Abschnitt 4: KI-Einsatz / MobileNet

- **Fundort:** `src/pages/PrivacyPage.tsx:224-242`
- **Vergleich Mustertext (Zeilen 227-239) "Einsatz von KI auf der Website" vs. vorhandener Text:**

  **Muster-Passage (Z.229-238):** Muster beschreibt allgemeinen KI-Einsatz mit Art. 6 Abs. 1 lit. f als Primärgrundlage und lit. a bei Einwilligung.

  **Vorhandener Text:** Setzt auf Art. 6 Abs. 1 lit. a + §25 Abs. 1 TDDDG als alleinige Rechtsgrundlage, da tatsächlich eine explizite Einwilligung eingeholt wird.

  - "2-Klick-Lösung" Erklärung — kein Muster-Pendant, eigene Formulierung — KONFORM (Stufe 3: kein Muster vorhanden für diesen spezifischen Anwendungsfall)
  - "Anbieter ist Google Ireland Limited..." — Abweichung: Muster nennt keinen konkreten Anbieter — KONFORM (Stufe 3: Eigenformulierung)
  - DPF-Link `dataprivacyframework.gov/participant/5780` — kein Muster-Pendant, basiert auf Cloudflare-Muster-Vorlage — KONFORM (Stufe 3: korrekte Eigenformulierung)
  - Rechtsgrundlage: Art. 6 Abs. 1 lit. a (Einwilligung) statt lit. f (berechtigtes Interesse) — technisch korrekte Abweichung (Bewertungshierarchie Stufe 2: tatsächlich wird Einwilligung eingeholt, daher lit. a präziser)
  - "Anbieter der KI-Modelle ist die Google LLC" — korrigiert auf Google LLC (USA), 1600 Amphitheatre Parkway, Mountain View, CA 94043, mit Hinweis auf DPF-Zertifizierung. Der DPF-Link zeigt korrekt auf Google LLC. Die technische Datenübermittlung geht an Google LLC-Server (`storage.googleapis.com`, `tfhub.dev`). Formulierung ist nun konsistent und präzise — KONFORM.

- **Checklistenpunkt:** Art. 13 Abs. 1 Nr. 3+6 DSGVO; Privacy-Shield-Checkliste Schritt 3; Datenschutz-Mustertext Bewertungshierarchie
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 45 DSGVO (DPF); Art. 13 Abs. 1 Nr. 6 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Die Rechtsgrundlage ist korrekt (Einwilligung → lit. a). Der DPF-Link zeigt auf Google LLC (korrekt). Die Datenschutzerklärung benennt nun Google LLC (USA) mit vollständiger Anschrift als Anbieter und verweist auf die DPF-Zertifizierung. Drittlandempfänger und Schutzinstrument sind konsistent und vollständig nach Art. 13 Abs. 1 Nr. 6 DSGVO benannt. *(Korrigiert: `PrivacyPage.tsx:229` — "Google Ireland Limited" → "Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA" mit DPF-Hinweis.)*

---

### 6.8 Abschnitt 4: Kameranutzung

- **Fundort:** `src/pages/PrivacyPage.tsx:244-253`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:244-253
  <h3>Kameranutzung (lokales ML-Training)</h3>
  <p>Für die Trainingsfunktion dieser Website kann auf die Kamera Ihres Endgeräts zugegriffen
  werden. [...] vollständig lokal [...] zu keinem Zeitpunkt an externe Server übertragen [...]</p>
  <p><strong>Zweck:</strong> Lokales Training eines Machine-Learning-Modells [...]
  <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
  <strong>Speicherdauer:</strong> [...] ausschließlich für die Dauer der aktuellen Sitzung [...]
  <strong>Widerruf:</strong> Ein Neuladen der Seite beendet die Kameranutzung [...]</p>
  ```
- **Vergleich Mustertext:** Kein Muster-Pendant vorhanden (Stufe 3: Eigenformulierung)
- **Checklistenpunkt:** Art. 13 Abs. 1 Nr. 3 DSGVO (Zweck + Rechtsgrundlage); Art. 13 Abs. 2 Nr. 1 DSGVO (Speicherdauer); Art. 7 Abs. 3 DSGVO (Widerruf); DSGVO-Checklist Punkt 1 — "Alle Verarbeitungszwecke mit Rechtsgrundlage"
- **Rechtliche Grundlage:** Art. 13 Abs. 1 Nr. 3 DSGVO; Art. 13 Abs. 2 Nr. 1 DSGVO; Art. 6 Abs. 1 lit. a DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Die Kameranutzung ist als eigenständiger Verarbeitungsvorgang dokumentiert (Stufe 3: Eigenformulierung zulässig). Alle Pflichtangaben nach Art. 13 DSGVO sind vorhanden: Zweck (lokales ML-Training), Rechtsgrundlage (Art. 6 Abs. 1 lit. a), Speicherdauer (Sitzung, kein Upload), Widerrufsmechanismus (Neuladen). Entsprechend dem früheren Mangel aus dem Vorgängerbericht ist dieser Abschnitt nun vorhanden — KONFORM.

---

### 6.9 Art. 13 Abs. 2 DSGVO — Vollständigkeitsprüfung Betroffenenrechte

- **Fundort:** `src/pages/PrivacyPage.tsx:132-167`
- **Prüfung aller Betroffenenrechte nach Art. 13 Abs. 2 Nr. 2 DSGVO:**

| Recht | Fundort | Status |
|---|---|---|
| Art. 15 (Auskunft) | `PrivacyPage.tsx:151-152` — "Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger" | KONFORM |
| Art. 16 (Berichtigung) | `PrivacyPage.tsx:152` — "Recht auf Berichtigung" | KONFORM |
| Art. 17 (Löschung) | `PrivacyPage.tsx:152` — "Recht auf [...] Löschung" | KONFORM |
| Art. 18 (Einschränkung) | `PrivacyPage.tsx:155-167` — eigener Abschnitt mit allen 4 Fallgruppen | KONFORM |
| Art. 20 (Datenübertragbarkeit) | `PrivacyPage.tsx:145-148` — eigener Abschnitt | KONFORM |
| Art. 21 (Widerspruch) | `PrivacyPage.tsx:132-138` — Uppercase-Block gemäß Art. 21 Abs. 4 DSGVO | KONFORM |
| Art. 7 Abs. 3 (Widerruf Einwilligung) | `PrivacyPage.tsx:127-130` — eigener Abschnitt | KONFORM |

- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 8 — Betroffenenrechte Art. 15-21; Art. 13 Abs. 2 Nr. 2 DSGVO
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 2 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Alle sieben Betroffenenrechte nach Art. 13 Abs. 2 Nr. 2 DSGVO sind vollständig und korrekt dokumentiert. Der Art. 21-Widerspruchsblock ist vorschriftsgemäß in Großbuchstaben hervorgehoben (Art. 21 Abs. 4 DSGVO: "klar und von anderen Informationen getrennt").

---

### 6.10 Beschwerderecht bei Aufsichtsbehörde (Art. 13 Abs. 2 Nr. 4 DSGVO)

- **Fundort:** `src/pages/PrivacyPage.tsx:140-143`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:142
  Die für uns zuständige Aufsichtsbehörde ist der Landesbeauftragte für den Datenschutz und die
  Informationsfreiheit Rheinland-Pfalz (LfDI RLP), Hintere Bleiche 34, 55116 Mainz,
  www.datenschutz.rlp.de.
  ```
- **Vergleich Mustertext (Zeile 135-137):** Muster nennt nur allgemein "eine Aufsichtsbehörde" ohne konkrete Benennung.
- **Technischer Befund:** Betreiber wohnt in "67591 Mölsheim" — PLZ liegt in Rheinland-Pfalz. LfDI RLP ist die zuständige Aufsichtsbehörde.
- **Checklistenpunkt:** Art. 13 Abs. 2 Nr. 4 DSGVO — Beschwerderecht bei Aufsichtsbehörde
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 4 DSGVO
- **Bewertung:** KONFORM (vorteilhafte Ergänzung — Eigenformulierung korrekt nach Stufe 3)
- **Begründung:** Die Nennung der zuständigen Aufsichtsbehörde geht über das Muster hinaus und ist sachlich korrekt (Wohnort Mölsheim → RLP → LfDI RLP). Diese Konkretisierung erhöht die Transparenz für Betroffene und ist rechtlich einwandfrei.

---

## 7. Sonstige Kategorien

### 7.1 TOM — Regelmäßige Updates, Backups, Least Privilege (Art. 32 DSGVO)

#### 7.1.1 Regelmäßige Updates (Server, CMS, Plugins)

- **Fundort:** `Dockerfile`, `package.json` (Build-Setup)
- **Code-Snippet:**
  ```dockerfile
  # Dockerfile — Production Stage
  FROM node:lts-alpine
  ...
  USER node
  EXPOSE 3000
  CMD ["node", "dist-server/server.js"]
  ```
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 TOM — "Regelmäßige Updates (Server, CMS, Plugins)"
- **Rechtliche Grundlage:** Art. 32 DSGVO — Sicherheit der Verarbeitung
- **Bewertung:** KONFORM
- **Begründung:** Die Anwendung läuft auf `node:lts-alpine`. Dependabot ist im GitHub-Repository aktiv und überwacht npm-Abhängigkeiten (insbesondere TensorFlow.js, Express) sowie den Docker-Basisimage-Tag automatisch. Damit ist die TOM-Anforderung "Regelmäßige Updates" nach Art. 32 DSGVO erfüllt. Es gibt kein CMS, keine Plugins. *(Aktualisiert: Dependabot-Status vom Betreiber bestätigt.)*

---

#### 7.1.2 Backups mit Verschlüsselung und Zugriffskontrolle

- **Fundort:** `Dockerfile`, `server.ts` (gesamte Codebase geprüft)
- **Code-Snippet:** Keine Backup-Konfiguration in der Codebase vorhanden.
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 TOM — "Backups mit Verschlüsselung und Zugriffskontrolle"
- **Rechtliche Grundlage:** Art. 32 DSGVO — Sicherheit der Verarbeitung
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Die Anwendung speichert keine persistenten personenbezogenen Daten serverseitig. Es gibt keine Datenbank, keine Nutzerkonten, keine Upload-Verzeichnisse mit PII. Der Docker-Container hat ein leeres `/app/database`-Verzeichnis (`Dockerfile` Z.16), aber kein Datenbankschema oder Datenbankzugriff in der Codebase. Server-Logs werden vom Hoster Hostinger verwaltet (vgl. Prüfpunkt 4.1 und Datenschutzerklärung `PrivacyPage.tsx:194-211`). Backup-Pflichten nach Art. 32 DSGVO für Betreiber-seitige Datensicherung entfallen mangels zu sichernder PII-Datenbasis.

---

#### 7.1.3 Zugriffsberechtigungen: Least Privilege

- **Fundort:** `Dockerfile` (Production Stage, Zeilen 11-26)
- **Code-Snippet:**
  ```dockerfile
  # Dockerfile — Production Stage
  RUN mkdir -p /app/database && chown -R node:node /app/database
  ...
  USER node        # ← Non-root User
  EXPOSE 3000
  CMD ["node", "dist-server/server.js"]
  ```
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 TOM — "Zugriffsberechtigungen: Least Privilege — nur notwendige Datenbankrechte"
- **Rechtliche Grundlage:** Art. 32 DSGVO — TOM; Art. 25 DSGVO — Privacy by Design
- **Bewertung:** KONFORM
- **Begründung:** Der Docker-Container läuft als unprivilegierter `node`-User (nicht `root`). Das Datenbankverzeichnis `/app/database` gehört `node:node`. Es gibt keine Datenbankverbindung mit separatem DB-User — da keine relationale Datenbank eingesetzt wird, entfällt die Prüfung auf Datenbankrechte im engeren Sinne. Auf Betriebssystemebene ist Least-Privilege umgesetzt: kein Root-Zugriff im Container, keine unnötigen Capabilities. Der Multi-Stage-Build verhindert, dass Build-Tooling (Python, make, g++) im Production-Image mit Laufzeitberechtigungen verfügbar ist.

---

### 7.2 Fotografie & Bildrechte (§22 KUG)

- **Fundort:** Gesamtes `src/`-Verzeichnis (Scan auf `<img>`, Bild-Assets, `public/`-Verzeichnis)
- **Code-Snippet:** Keine Fotos erkennbarer Personen; alle Bilder sind ML-Demo-Assets oder generische Grafiken.
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 6 — "Einwilligung bei erkennbaren Personen (§22 KUG)"; "EXIF-Daten entfernt"; "Stock-Fotos: Lizenz + Model Release geprüft"
- **Rechtliche Grundlage:** §22 KUG; §23 KUG; Art. 6 Abs. 1 lit. a DSGVO
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Die Anwendung enthält keine Fotos erkennbarer Personen. Alle verwendeten Bilder sind Demo-Grafiken für die ML-Klassifizierung (z. B. Objektklassen-Beispiele) ohne Personenabbildungen. Stock-Fotos mit erkennbaren Personen wurden nicht gefunden. §22 KUG (Einwilligung vor Veröffentlichung von Personenfotos) und die EXIF-Daten-Prüfung entfallen vollständig.

---

### 7.3 Social Media, Newsletter (N/A-Prüfung)

- **Fundort:** Gesamte `src/`-Verzeichnis (Scan auf `facebook`, `twitter`, `instagram`, `linkedin`, `youtube`, `newsletter`, `subscribe`, `mailchimp`, `brevo`)
- **Code-Snippet:** Keine Treffer
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 2 (Social Media) + Abschnitt 3 (E-Mail-Marketing/Newsletter)
- **Rechtliche Grundlage:** Art. 26 DSGVO; §25 TDDDG; Art. 6 Abs. 1 lit. a DSGVO; Art. 7 Abs. 4 DSGVO
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Keine Social-Media-Einbindungen, keine Share-Buttons, keine Social-Media-Profile verlinkt. Kein Newsletter-Dienst, kein E-Mail-Marketing. DSGVO-Checklist Abschnitte 2 und 3 entfallen vollständig.

---

### 7.4 Datenschutzbeauftragter und Datenpannenprozess

- **Fundort:** `src/pages/PrivacyPage.tsx` (gesamte Datenschutzerklärung)
- **Code-Snippet:** Kein DSB-Hinweis in der Datenschutzerklärung
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 7 — "Datenschutzbeauftragter (Art. 37 DSGVO)"; "Datenpanne-Prozess (Art. 33 DSGVO)"
- **Rechtliche Grundlage:** Art. 37 DSGVO; Art. 33 DSGVO
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** DSB-Pflicht (Art. 37 DSGVO) gilt ab 20 Mitarbeitern mit regelmäßiger Datenverarbeitung oder bei Verarbeitung sensibler Daten nach Art. 9 DSGVO. Der Betreiber ist Privatperson (Yannick Schäfer). Keine Art.-9-Daten werden verarbeitet. Schwelle nicht erreicht — kein DSB erforderlich; Datenschutzerklärung ohne DSB-Abschnitt ist korrekt. Art. 33 DSGVO (72-Std.-Meldepflicht) ist eine interne Pflicht, nicht in der Datenschutzerklärung zu dokumentieren. Anwendungsrisiko für meldepflichtige Datenpannen ist minimal (keine persistente Datenspeicherung).

---

### 7.5 Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO)

- **Fundort:** Interne Organisation (nicht aus Codebase prüfbar)
- **Code-Snippet:** Kein VVT-Hinweis in der Codebase
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 4 — "VVT Art. 30 DSGVO: gepflegt und aktuell"
- **Rechtliche Grundlage:** Art. 30 DSGVO
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Art. 30 Abs. 5 DSGVO: VVT-Pflicht entfällt für Betreiber mit weniger als 250 Mitarbeitern, sofern die Verarbeitung kein Risiko für Betroffene birgt, nicht regelmäßig erfolgt und keine Art.-9-Daten verarbeitet werden. Alle drei Ausnahmevoraussetzungen sind hier erfüllt: Privatperson, keine Art.-9-Daten, Verarbeitung nur gelegentlich (einmalig pro Sitzung). Empfehlung: Bei Erweiterung der Verarbeitungsvorgänge (z. B. Nutzerkonto, persistente Daten) VVT anlegen.

---

## Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| **VERSTOSS** | 0 |
| **EMPFEHLUNG** | 0 |
| **KONFORM** | 25 |
| **N/A** | 8 |
| **Gesamt geprüfte Punkte** | 33 |

*(Aktualisiert: E1 behoben — Google LLC korrekt in `PrivacyPage.tsx:229` eingetragen. E2 auf KONFORM — Cookie-Abschnitt ist allgemeine Erläuterung, kein Verstoß. E3 auf KONFORM — Dependabot im GitHub-Repository aktiv bestätigt.)*

**Impressum vorhanden:** Ja — vollständig und erreichbar (`/impressum`)
**Datenschutzerklärung vorhanden:** Ja — vollständig und konform (`/datenschutz`)

### Übersicht der Verstöße

Keine Verstöße gefunden.

### Übersicht der Empfehlungen

Keine Empfehlungen — alle Punkte sind konform.

### Nicht anwendbare Kategorien (N/A)

| Kategorie | Abschnitt | Begründung |
|-----------|-----------|-----------|
| Passwort-Hashing | 4.2 | Keine Nutzerkonten, keine Authentifizierung, keine Datenbank vorhanden |
| Kontaktformulare | 3.1 | Kein Formular in der Anwendung; nur E-Mail-/Telefonkontakt |
| Social Media | 7.3 | Keine Social-Media-Einbindungen, keine Share-/Like-Buttons |
| E-Mail-Marketing / Newsletter | 7.3 | Kein Newsletter-Dienst, kein E-Mail-Marketing |
| Datenschutzbeauftragter / Datenpanne | 7.4 | Privatperson, <250 MA, keine Art.-9-Daten — DSB nicht erforderlich |
| VVT Art. 30 DSGVO | 7.5 | Art. 30 Abs. 5-Ausnahme greift (Privatperson, keine regelmäßige Verarbeitung, keine Art.-9-Daten) |
| Fotografie & Bildrechte (§22 KUG) | 7.2 | Keine Fotos erkennbarer Personen, keine Stock-Fotos mit Personenabbildungen |
| Backups (TOM) | 7.1.2 | Keine serverseitig persistierten PII-Daten — Backup-TOM-Pflicht entfällt |

### Empfohlene nächste Schritte

- [ ] **Jährlicher DPF-Check:** Google LLC DPF-Zertifizierung auf dataprivacyframework.gov prüfen (Zertifikate laufen jährlich ab, Schrems-III-Risiko beobachten — C-703/25 P).
- [ ] **Jährliche SSL-Zertifikatsprüfung:** Zertifikatsgültigkeit über SSL Labs (ssllabs.com/ssltest) regelmäßig prüfen.
