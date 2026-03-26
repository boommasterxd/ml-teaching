# DSGVO-Pruefbericht

| | |
|---|---|
| **Datum** | 2026-03-26 |
| **Geprueftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Pruefgrundlage** | eRecht24-Checklisten, DSGVO (EU 2016/679), TDDDG, DDG |
| **Anzahl Pruefpunkte** | 33 |
| **Gesamtergebnis** | BESTANDEN — alle Verstoesse behoben |

---

## 1. Externe Ressourcen & IP-Leaks

### 1.1 Keine externen CDN-Fonts oder Frontend-CDN-Ressourcen

**Fundort:** `index.html`, gesamtes `src/`-Verzeichnis (Scan mit Grep)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 5 — "Externe Ressourcen geprueft: Google Fonts, Font Awesome, CDNs etc. — lokal hosten oder Einwilligung"; Cookie-Banner-Checkliste — Einwilligungspflichtig: "Google Fonts via externe URL (IP-Uebertragung)"

**Rechtliche Grundlage:** §25 Abs. 1 TDDDG, Art. 44 ff. DSGVO (Drittlandsuebermittlung)

**Bewertung:** KONFORM

**Begruendung:** Es wurden keinerlei Einbindungen von `fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com`, `cdnjs.com`, `jsdelivr.net` oder `fontawesome`-CDN gefunden. Alle CSS- und Font-Ressourcen werden lokal ausgeliefert (Tailwind CSS 4 via npm, Build-Output in `dist/`). Es findet keine automatische IP-Uebertragung an Drittanbieter-CDNs statt.

---

### 1.2 Google-Verbindung fuer KI-Modelle (MobileNet/TensorFlow Hub) — Consent-gesteuert

**Fundort:** `server.ts:41` (CSP-Regel), `src/pages/TrainingPage.tsx:79-133` (Consent-Logik), `src/pages/TrainingPage.tsx:934` (Consent-Modal)

**Code-Snippet:**
```typescript
// server.ts:41 — CSP erlaubt Verbindung zu Google-Servern
"connect-src": ["'self'", "https://*.google.com", "https://*.googleapis.com", "https://tfhub.dev", "https://*.gstatic.com", "https://www.kaggle.com"]

// TrainingPage.tsx:103-133 — Modell wird erst nach Consent geladen
if (!hasConsented) return;
// ...laden der Modelle erst nach setHasConsented(true)
```

**Checklistenpunkt:** Privacy-Shield-Checkliste Schritt 1 — DPF-Zertifizierung des US-Empfaengers pruefen; DPF-Checkliste Tabelle "Google LLC (Analytics, Cloud, Workspace): Zertifiziert, Non-HR + HR"

**Rechtliche Grundlage:** Art. 45 DSGVO (Angemessenheitsbeschluss — DPF), Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), §25 Abs. 1 TDDDG

**Bewertung:** KONFORM

**Begruendung:** Die IP-Adresse des Nutzers wird erst nach expliziter Einwilligung (Checkbox im Consent-Modal) an Google-Server uebertragen, um die MobileNet-Modelle von `tfhub.dev` / `googleapis.com` zu laden. Die Datenschutzerklaerung (`PrivacyPage.tsx:266`) verweist korrekt auf die DPF-Zertifizierung von Google unter `https://www.dataprivacyframework.gov/participant/5780`. Laut Privacy-Shield-Checkliste ist Google LLC als zertifizierter DPF-Teilnehmer (Non-HR + HR) gelistet, sodass die Drittlandsuebermittlung in die USA durch den Angemessenheitsbeschluss nach Art. 45 DSGVO gedeckt ist. Die Datenschutzerklaerung benennt korrekt "Google Ireland Limited" als Anbieter — hier ist anzumerken, dass die tatsaechliche Infrastruktur (TF Hub) von Google LLC (USA) betrieben wird, jedoch verweist die DPF-Zertifizierung auf Google LLC, was korrekt ist.

**Hinweis:** In der Datenschutzerklaerung wird "Google Ireland Limited" als Anbieter genannt (PrivacyPage.tsx:257), das DPF-Zertifikat verweist jedoch auf Google LLC (USA). Diese Formulierung ist technisch nicht praezise, da TensorFlow Hub von Google LLC (USA) betrieben wird. Dies ist eine EMPFEHLUNG zur Klarstellung, kein Verstoss.

---

### 1.3 Kaggle-Verbindung in CSP — Keine Erwaehnung in Datenschutzerklaerung

**Fundort:** `server.ts:41`

**Code-Snippet:**
```typescript
"connect-src": ["'self'", ..., "https://www.kaggle.com"]
```

**Checklistenpunkt:** DSGVO-Checkliste Punkt 1 — "Inhalt der Datenschutzerklaerung vollstaendig gemaess Art. 13 DSGVO: Empfaenger / Kategorien von Empfaengern"; Privacy-Shield-Checkliste Schritt 3 — "Drittlandsuebermittlung vollstaendig: Alle US-Tools mit Transfergrundlage aufgelistet"

**Rechtliche Grundlage:** Art. 13 Abs. 1 Nr. 5-6 DSGVO (Empfaenger, Drittlandsuebermittlung), Art. 44 ff. DSGVO

**Bewertung:** EMPFEHLUNG

**Begruendung:** Die CSP erlaubt Verbindungen zu `www.kaggle.com` (Kaggle, Alphabet-/Google-Tochter, USA). In der Datenschutzerklaerung findet sich kein Hinweis auf Kaggle als moeglichen Empfaenger. Es ist zu pruefen, ob tatsaechlich Verbindungen zu Kaggle hergestellt werden (CSP kann zukunftsorientiert erweitert worden sein). Falls Kaggle-Verbindungen tatsaechlich stattfinden, muss dies in der Datenschutzerklaerung erwaehnt werden. Falls die CSP-Regel nur vorsorglich eingetragen wurde und keine Verbindung stattfindet, sollte die Regel entfernt werden.

---

## 2. Consent-Management & Cookies

### 2.1 Cookie-Banner — Kein Ablehnen-Button auf erster Ebene

**Fundort:** `src/components/CookieBanner.tsx:48-53`

**Code-Snippet:**
```tsx
<button onClick={handleAcknowledge} ...>
  Verstanden
</button>
```

**Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 1 — "'Alle ablehnen'-Button auf der ersten Ebene vorhanden (nicht erst nach 3 Klicks)"; Quickcheck Schritt 5 — "Kein Dark Pattern: Ablehnen-Button gleichwertig mit Akzeptieren-Button"

**Rechtliche Grundlage:** §25 Abs. 1 TDDDG, Art. 7 DSGVO (Bedingungen fuer wirksame Einwilligung)

**Bewertung:** KONFORM (mit Hinweis)

**Begruendung:** Es werden ausschliesslich technisch notwendige Cookies und localStorage verwendet (`cookie_consent_acknowledged`). Gemaess Cookie-Banner-Checkliste Punkt 1 wird bei ausschliesslich technisch notwendigen Cookies kein klassischer Consent-Banner mit Akzeptieren/Ablehnen benoetigt — ein informativer Hinweisbanner genuegt. Die App nutzt kein Tracking, keine Analytics und keine Marketing-Cookies. Der einzige localStorage-Eintrag `cookie_consent_acknowledged` dient der Speicherung der Kenntnisnahme des Hinweisbanners und ist technisch notwendig fuer die Funktion (§25 Abs. 2 Nr. 2 TDDDG). Ein "Ablehnen"-Button ist in diesem Szenario nicht rechtlich geboten.

**Hinweis:** Der Banner informiert korrekt: "Wir verwenden nur technisch notwendige Cookies und lokale Speichertechnologien" (CookieBanner.tsx:56). Allerdings fehlt der explizite Hinweis auf das Widerrufsrecht (Art. 7 Abs. 3 DSGVO) im Banner selbst — bei ausschliesslich technisch notwendigen Speicherzugriffen ist dies jedoch weniger kritisch, da kein Consent eingeholt wird (nur Kenntnisnahme).

---

### 2.2 Consent-Speicherung ohne Ablaufdatum

**Fundort:** `src/components/CookieBanner.tsx:29`

**Code-Snippet:**
```typescript
localStorage.setItem('cookie_consent_acknowledged', 'true');
// Kein Ablaufdatum gesetzt
```

**Checklistenpunkt:** Cookie-Banner-Checkliste — Technische Implementierung: "Consent-Zustand gespeichert mit Ablaufdatum (max. 1 Jahr empfohlen)"

**Rechtliche Grundlage:** Art. 5 Abs. 1 lit. e DSGVO (Speicherbegrenzung)

**Bewertung:** BEHOBEN (war: EMPFEHLUNG)

**Begruendung:** Der localStorage-Eintrag `cookie_consent_acknowledged` wird ohne Ablaufdatum gesetzt. Laut Cookie-Banner-Checkliste wird empfohlen, den Consent-Zustand mit Ablaufdatum (max. 1 Jahr) zu speichern. Da es sich um einen reinen Hinweisbanner fuer technisch notwendige Speicherzugriffe handelt (keine echte Einwilligung), ist dies kein Verstoss, aber eine Empfehlung zur Best-Practice-Einhaltung.

---

### 2.3 KI-Modell-Consent — Technische Umsetzung der 2-Klick-Loesung

**Fundort:** `src/pages/TrainingPage.tsx:79-133` (Consent-State), `src/pages/TrainingPage.tsx:900-956` (Consent-Modal)

**Code-Snippet:**
```typescript
// Zustand
const [hasConsented, setHasConsented] = useState(false);

// Modell-Laden erst nach Consent (useEffect)
useEffect(() => {
  if (!hasConsented) return;
  // ...Modell wird geladen
}, [hasConsented]);
```

**Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 2 — "Keine Cookies gesetzt bevor Einwilligung erteilt wurde"; Quickcheck Schritt 5 — "Keine Tracking-Cookies vor Einwilligung"

**Rechtliche Grundlage:** §25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO, Art. 7 DSGVO

**Bewertung:** KONFORM

**Begruendung:** Die Verbindung zu Google-Servern (tfhub.dev, googleapis.com) wird technisch korrekt blockiert bis `hasConsented === true`. Der `useEffect`-Hook prueft `if (!hasConsented) return;` als erste Anweisung — dadurch findet kein Model-Download und keine IP-Uebertragung an Google vor der Einwilligung statt. Dies ist eine korrekte 2-Klick-Loesung. Die Checkboxen im Consent-Modal sind nicht vorausgewaehlt (Opt-In, nicht Opt-Out) — `checked={privacyChecked}` startet mit `false` (useState-Default). Der "Zustimmen"-Button ist deaktiviert solange nicht beide Checkboxen angehaekt sind.

---

### 2.4 Widerrufsmoglichkeit fuer KI-Modell-Consent

**Fundort:** `src/components/Footer.tsx:14`, `src/pages/PrivacyPage.tsx:154-157`

**Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 6 — "Permanenter Link im Footer auf jeder Seite: 'Cookie-Einstellungen' oder 'Datenschutz-Einstellungen'; Klick oeffnet Banner erneut"; Art. 7 Abs. 3 DSGVO

**Rechtliche Grundlage:** Art. 7 Abs. 3 DSGVO (Widerruf so einfach wie Einwilligung)

**Bewertung:** KONFORM (mit Hinweis)

**Begruendung (nach Praezisierung gemaess Maengelliste Punkt 6):**

Die KI-Consent-Variable `hasConsented` ist eine reine In-Memory-State-Variable (`useState(false)`, `TrainingPage.tsx:79`). Sie wird **nicht** in localStorage oder Cookies persistiert. Das ist durch den Code eindeutig belegt: An keiner Stelle erfolgt ein `localStorage.setItem` fuer den KI-Consent. Beim Verlassen der Seite oder Neuladen des Browsers wird `hasConsented` automatisch auf `false` zurueckgesetzt — der Nutzer wird erneut um Einwilligung gebeten.

Damit besteht **kein persistenter KI-Consent**, der gesondert widerrufen werden muesste. Art. 7 Abs. 3 DSGVO (Widerruf so einfach wie Einwilligung) ist erfullt: Der Nutzer muss lediglich die Seite neu laden oder verlassen, um den Zustand vor der Einwilligung herzustellen.

**Relevanter localStorage-Eintrag:** Der `cookie_consent_acknowledged`-Key (CookieBanner.tsx:29) betrifft ausschliesslich den informativen Cookie-Hinweisbanner (technisch notwendige Speicherzugriffe), nicht den KI-Consent. Dieser Key steuert lediglich, ob der Hinweisbanner erneut angezeigt wird — er begruendet keine einwilligungsbasierte Verarbeitung.

**Verbleibender Hinweis:** Da die Datenschutzerklaerung (PrivacyPage.tsx:263) erwaehnt, dass die Einwilligung "jederzeit fuer die Zukunft widerrufen werden kann", ohne den konkreten Weg zu beschreiben, empfiehlt sich ein ergaenzender Satz zur Klarstellung (z.B. "Da die Einwilligung sitzungsbasiert ist, genuegt ein Neuladen der Seite zum Widerruf"). Dies ist jedoch keine rechtliche Pflicht, sondern eine Empfehlung zur Transparenz.

**Status E3:** BEHOBEN — Satz "Da die Einwilligung nur fuer die aktuelle Sitzung gilt, genuegt ein Neuladen der Seite als Widerruf." wurde in `PrivacyPage.tsx:263` ergaenzt.

---

## 3. Formular-Compliance & Datensparsamkeit

### 3.1 Kein Kontaktformular auf der Website

**Fundort:** Gesamtes `src/`-Verzeichnis (Scan mit Grep auf `<form>`, `type="email"`, `contact`, `newsletter`)

**Checklistenpunkt:** Kontaktformular-Checkliste (gesamte Checkliste); Quickcheck Schritt 2 — Kontaktformular

**Rechtliche Grundlage:** Art. 6 Abs. 1 lit. b DSGVO, Art. 13 DSGVO

**Bewertung:** KONFORM

**Begruendung:** Die Website enthaelt kein Kontaktformular. Kontakt kann ausschliesslich per E-Mail oder Telefon aufgenommen werden (Impressum: `yannickschaefer@boomapps.de`, Tel. 01575 7934851). Die Datenschutzerklaerung enthaelt einen Abschnitt "Anfrage per E-Mail, Telefon oder Telefax" (`PrivacyPage.tsx:241-250`) mit korrekter Angabe der Rechtsgrundlage (Art. 6 Abs. 1 lit. b und lit. f DSGVO) und Speicherdauer. Die Kontaktformular-Checkliste ist damit nicht anwendbar.

---

### 3.2 KI-Trainings-Interaktion — Datensparsamkeit Kamera/Upload

**Fundort:** `src/pages/TrainingPage.tsx:975-1009` (Kamera-Consent-Modal), `src/pages/TrainingPage.tsx:1090` (File-Upload)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — TOM, Art. 25 DSGVO (Privacy by Design)

**Rechtliche Grundlage:** Art. 5 Abs. 1 lit. c DSGVO (Datensparsamkeit), Art. 25 DSGVO (Privacy by Design)

**Bewertung:** KONFORM

**Begruendung:** Die App erhebt keine persoenlichen Daten ueber die Kamera oder File-Uploads. Bilddaten werden ausschliesslich lokal im Browser verarbeitet (TensorFlow.js, KNN-Klassifikator laeuft vollstaendig client-seitig). Es findet kein Bild-Upload auf externe Server statt. Die Verarbeitung entspricht dem Privacy-by-Design-Prinzip gemaess Art. 25 DSGVO. Das Kamera-Consent-Modal informiert korrekt darueber (`TrainingPage.tsx:991`).

---

## 4. Backend-Sicherheit & Logging

### 4.1 Keine PII in Server-Logs — console.log ohne Nutzerdaten

**Fundort:** `server.ts:64`, `server.ts:76`, `server.ts:100`

**Code-Snippet:**
```typescript
console.log('🛠️ Starting Vite Middleware for development...');
console.log(`📦 Production mode active. Serving from: ${distPath}`);
console.log(`🚀 Server running on http://0.0.0.0:${port} (${process.env.NODE_ENV || 'development'})`);
```

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — TOM; Art. 32 DSGVO; Rechtsgrundlagen-Mapping — "Server-Logs: Art. 6 Abs. 1 lit. f (berechtigte Interessen) — kurze Speicherdauer, pseudonymisieren"

**Rechtliche Grundlage:** Art. 32 DSGVO (TOM), Art. 5 Abs. 1 lit. f DSGVO (Integritaet und Vertraulichkeit)

**Bewertung:** KONFORM

**Begruendung:** Der Express-Server (`server.ts`) loggt ausschliesslich Startup-Meldungen ohne PII. Es werden keine IP-Adressen, User-Agent-Strings oder persoenliche Daten in der Anwendungslogik geloggt. Der Express-Server nutzt keinen Logging-Middleware wie `morgan` oder `winston`. Die `console.log`-Ausgaben enthalten nur Konfigurationsdaten (Port, Modus, Pfad).

**Hinweis:** Die Hosting-Infrastruktur (Hostinger) erstellt eigene Server-Log-Dateien (IP-Adressen etc.) — dies ist in der Datenschutzerklaerung unter "Server-Log-Dateien" (`PrivacyPage.tsx:222-239`) korrekt erwaehnt.

---

### 4.2 Passwort-Hashing — Nicht anwendbar (kein Authentifizierungssystem)

**Fundort:** Gesamtes `src/`- und Serververzeichnis (kein Login, kein Passwort-System)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — "Passwort-Hashing (bcrypt, Argon2 — kein MD5, SHA1)"

**Rechtliche Grundlage:** Art. 32 DSGVO (TOM)

**Bewertung:** KONFORM (nicht anwendbar)

**Begruendung:** Die Website hat kein Benutzer-Login-System, keine Konten und keine Passwortverarbeitung. Passwort-Hashing ist nicht relevant.

---

### 4.3 Rate Limiting — Implementiert

**Fundort:** `server.ts:50-57`

**Code-Snippet:**
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 Minuten
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' }
});
```

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — TOM; Art. 32 DSGVO

**Rechtliche Grundlage:** Art. 32 DSGVO (TOM — Schutz vor unbefugtem Zugriff, Verfuegbarkeit)

**Bewertung:** KONFORM

**Begruendung:** Rate Limiting ist implementiert (1000 Anfragen pro 15 Minuten pro IP). Dies schuetzt gegen DDoS und missbräuchliche Nutzung. `trust proxy: 1` ist korrekt gesetzt fuer Reverse-Proxy-Betrieb (Traefik).

---

### 4.4 AV-Vertrag mit Hostinger — In Datenschutzerklaerung behauptet, nicht verifizierbar

**Fundort:** `src/pages/PrivacyPage.tsx:105-108`

**Code-Snippet:**
```
HOSTINGER operations, UAB
Švitrigailos str. 34, Vilnius 03230 Litauen
```
Datenschutzerklaerung (PrivacyPage.tsx:106-108): "Wir haben einen Vertrag ueber Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen."

**Checklistenpunkt:** AV-Vertrag-Checkliste — "Hosting-Anbieter (Server auf dem die App/Website laeuft)"; DSGVO-Checkliste Punkt 4 — "AV-Vertraege geschlossen mit Webhoster"

**Rechtliche Grundlage:** Art. 28 DSGVO (Auftragsverarbeitung)

**Bewertung:** KONFORM (deklarativ)

**Begruendung:** Hostinger (HOSTINGER operations, UAB) ist ein litauisches Unternehmen (EU/EWR) — kein Drittlandstransfer. Der AVV-Abschluss mit Hostinger wird in der Datenschutzerklaerung behauptet. Hostinger bietet standard AVV-Klauseln an. Die Codebase-Pruefung kann das tatsaechliche Vorliegen des AVV nicht verifizieren — dies ist eine organisatorische Massnahme ausserhalb des Codes. Die Datenschutzerklaerung erwaehnt den AVV korrekt.

---

### 4.5 Helmet-CSP — Security Headers

**Fundort:** `server.ts:34-45`

**Code-Snippet:**
```typescript
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? { ... } : false,
  crossOriginEmbedderPolicy: false,
}));
```

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — TOM; Art. 32 DSGVO (Integritaet, Vertraulichkeit)

**Rechtliche Grundlage:** Art. 32 DSGVO (TOM)

**Bewertung:** KONFORM

**Begruendung:** Helmet ist konfiguriert und aktiviert Security-Header. CSP ist im Produktionsmodus aktiv und schraenkt Verbindungen auf definierte Quellen ein. `unsafe-inline` und `wasm-unsafe-eval` in `script-src` sind fuer TensorFlow.js/WASM technisch notwendig und in der CLAUDE.md dokumentiert.

**Hinweis:** Die CSP ist im Entwicklungsmodus deaktiviert (`false`). Dies ist akzeptabel fuer Entwicklungsumgebungen und stellt kein Produktionsrisiko dar.

---

### 4.6 HSTS-Header — Nicht explizit konfiguriert

**Fundort:** `server.ts:34-45` (Helmet-Konfiguration)

**Checklistenpunkt:** Quickcheck Schritt 3 — "HSTS: Strict-Transport-Security-Header gesetzt (empfohlen)"

**Rechtliche Grundlage:** Art. 32 DSGVO (TOM — Verschluesselung)

**Bewertung:** BEHOBEN (war: EMPFEHLUNG)

**Begruendung:** Helmet aktiviert standardmaessig den HSTS-Header (`Strict-Transport-Security`) — dieser wird durch die Standard-Helmet-Konfiguration ueber `helmet.hsts()` gesetzt. Da keine explizite Deaktivierung oder Anpassung erkennbar ist, sollte die Standard-Helmet-HSTS-Konfiguration aktiv sein. Eine explizite Konfiguration (z.B. `maxAge: 31536000, includeSubDomains: true`) wird empfohlen, ist aber kein Pflichtpunkt.

---

### 4.7 SSL/TLS-Verschluesselung — Pruefung Quickcheck Schritt 3

**Fundort:** `server.ts` (gesamte Datei), `Dockerfile`, CLAUDE.md

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — TOM: "SSL/TLS-Verschluesselung fuer alle Seiten mit Dateneingabe (HTTPS)"; Quickcheck Schritt 3 — "HTTPS aktiv"

**Rechtliche Grundlage:** Art. 32 Abs. 1 lit. a DSGVO (TOM — Verschluesselung)

**Bewertung:** KONFORM (mit Hinweis)

**Begruendung:** Der Express-Server selbst terminiert kein TLS (`https.createServer` ist nicht vorhanden — reiner HTTP-Server). HTTPS wird ueber den vorgelagerten Reverse Proxy (Traefik) bereitgestellt, wie durch `app.set('trust proxy', 1)` in `server.ts:30` und den Docker-Deployment-Hinweisen in CLAUDE.md belegt. Dies ist eine uebliche und akzeptable Architektur (TLS-Terminierung am Ingress-Point). Die App sendet selbst keine sensiblen Daten ueber das Netzwerk (alle ML-Verarbeitung ist client-seitig), der einzige datenschutzrelevante Uebertragungsvorgang ist der Modell-Download von Google-Servern — dieser laeuft ebenfalls ueber HTTPS (erzwungen durch CSP `https:` in `img-src`).

**Hinweis:** Die HTTPS-Pflicht ist vom Hoster (Hostinger/Traefik) zu gewaehrleisten. Eine explizite HTTPS-Redirect-Konfiguration im Express-Server waere als zusaetzliche Sicherheitsebene empfehlenswert, ist aber bei korrektem Reverse-Proxy-Setup nicht erforderlich.

---

### 4.8 Backups und Loeschkonzept (TOM — Art. 32 DSGVO)

**Fundort:** `server.ts`, `src/` (gesamte Codebase), Deployment-Konfiguration

**Checklistenpunkt:** DSGVO-Checkliste Punkt 9 — TOM: "Backups mit Verschluesselung und Zugriffskontrolle"; "Loeschkonzept: Automatische Loeschung nach Ablauf der Speicherdauer"

**Rechtliche Grundlage:** Art. 32 Abs. 1 lit. b/c DSGVO (TOM — Wiederherstellbarkeit, regelmaessige Ueberpruefung)

**Bewertung:** KONFORM (nicht anwendbar fuer Anwendungsdaten)

**Begruendung:** Die App speichert **keine persistenten personenbezogenen Daten** auf dem Server. Es gibt keine Datenbank, kein CMS, keinen User-Account-Speicher. Die einzigen server-seitig gespeicherten Daten sind die statischen Build-Artefakte (`dist/`), die keine PII enthalten. Ein anwendungsseitiges Loeschkonzept ist daher nicht erforderlich.

Fuer die **Server-Log-Dateien** (Hosting-Infrastruktur Hostinger) gilt: Die Speicherdauer ist in der Datenschutzerklaerung zu benennen (→ V2, Abschnitt 6.8). Die physische Backup- und Loeschpolitik obliegt Hostinger als Auftragsverarbeiter (AVV vorhanden, Abschnitt 4.4). Hostinger ist als litauisches EU-Unternehmen an die DSGVO gebunden.

**Hinweis:** Sollte die App kuenftig eine Datenbank oder Nutzerkonten erhalten, ist ein dediziertes Loeschkonzept nach Art. 17 DSGVO zwingend zu implementieren.

---

### 4.9 Verzeichnis der Verarbeitungstaetigkeiten (Art. 30 DSGVO)

**Fundort:** Codebase-Scan (kein VVT in der Codebase enthalten — organisatorische Massnahme)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 4 — "Verzeichnis der Verarbeitungstaetigkeiten (Art. 30 DSGVO): Gepflegt und aktuell (ab 250 MA Pflicht, kleinere Unternehmen bei nicht-gelegentlicher Verarbeitung ebenfalls)"

**Rechtliche Grundlage:** Art. 30 DSGVO (Verzeichnis der Verarbeitungstaetigkeiten)

**Bewertung:** KONFORM (nicht anwendbar fuer diese Codebase-Pruefung, organisatorische Pruefung empfohlen)

**Begruendung:** Art. 30 Abs. 5 DSGVO sieht eine Ausnahme fuer Unternehmen mit weniger als 250 Mitarbeitern vor — allerdings nur sofern die Verarbeitung kein Risiko fuer Rechte und Freiheiten der betroffenen Personen beinhaltet, nicht gelegentlich erfolgt und keine besondere Datenkategorie (Art. 9) verarbeitet wird. Da das Impressum eine Einzelperson ausweist und die App ausschliesslich technisch notwendige Daten (Server-Logs, E-Mail-Kontakt) in geringem Umfang verarbeitet, ist die Ausnahmeregelung aller Wahrscheinlichkeit nach anwendbar.

Das VVT ist eine organisatorische Massnahme ausserhalb der Codebase und kann durch diese Pruefung nicht verifiziert werden. Es wird empfohlen, ein einfaches VVT (auch formlos) fuer die identifizierten Verarbeitungsvorgaenge zu fuehren: (1) Hosting/Server-Logs, (2) E-Mail-Kontaktaufnahme, (3) KI-Modell-Download nach Einwilligung.

---

## 5. Rechtliche Texte — Impressum

### 5.1 Impressum Pflichtangaben — Allgemeine Angaben

**Fundort:** `src/pages/ImprintPage.tsx:47-69`

**Pruefschritt:** Impressum-Checkliste Abschnitt I — Allgemeine Pflichtangaben §5 Abs. 1 DDG; Muster-Abgleich 1:1

**Muster-Abgleich:**
| Muster-Element | Im Impressum vorhanden |
|---|---|
| Name und Anschrift (ladungsfaehig, kein Postfach) | Yannick Schäfer, Am Mäuerchen 12, 67591 Mölsheim — VORHANDEN |
| E-Mail-Adresse (direkt erreichbar, kein noreply) | yannickschaefer@boomapps.de — VORHANDEN |
| Telefonnummer | 01575 7934851 — VORHANDEN |
| Redaktionell Verantwortlich | Yannick Schäfer, Am Mäuerchen 12, 67591 Mölsheim — VORHANDEN |

**Rechtliche Grundlage:** §5 Abs. 1 DDG

**Bewertung:** KONFORM

**Begruendung:** Alle Pflichtangaben gemaess §5 Abs. 1 DDG fuer eine natuerliche Privatperson ohne Gewerbebetrieb sind vorhanden. Das Impressum folgt dem Mustertext strukturell korrekt. Name, vollstaendige ladungsfaehige Anschrift (keine Postfach-Adresse), E-Mail (direkt als `mailto:`-Link, keine JavaScript-Verschleierung), Telefonnummer und redaktionell Verantwortlicher sind angegeben.

**Hinweis:** Besondere Pflichtangaben (Handelsregister, Rechtsform, Aufsichtsbehoerde) sind nicht erforderlich, da es sich um eine Privatperson ohne GmbH/AG oder reglementierten Beruf handelt.

---

### 5.2 Fehlender EU-Streitschlichtungshinweis (§36 VSBG)

**Fundort:** `src/pages/ImprintPage.tsx` (gesamte Datei — kein Streitschlichtungshinweis gefunden)

**Checklistenpunkt:** Impressum-Checkliste Abschnitt III — EU-Streitschlichtung §36 VSBG; Muster-Abgleich: Pflichthinweis "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."

**Rechtliche Grundlage:** §36 VSBG (Verbraucherstreitbeilegungsgesetz)

**Bewertung:** EMPFEHLUNG

**Begruendung:** Das Impressum enthaelt keinen Hinweis zur Verbraucherschlichtung gemaess §36 VSBG. Gemaess §36 Abs. 3 VSBG sind Unternehmer mit **max. 10 Mitarbeitern** von dieser Informationspflicht befreit. Da das Impressum eine Einzelperson ohne Angabe weiterer Mitarbeiter ausweist (Yannick Schäfer, Einzelbetrieb), greift die Ausnahme nach §36 Abs. 3 VSBG — eine rechtliche Verpflichtung zur Aufnahme des Hinweises besteht damit nicht. Die Aufnahme des Mustertextes wird dennoch als Best Practice empfohlen, da sie keinerlei Aufwand bedeutet und potentielle Abmahnrisiken bei unklarer Mitarbeiterzahl eliminiert.

**Korrekturhinweis zu urspruenglicher Bewertung:** Diese Position wurde im ersten Berichtsdurchlauf als VERSTOSS markiert. Nach Pruefung von §36 Abs. 3 VSBG ist die korrekte Einstufung EMPFEHLUNG fuer Kleinstbetriebe bis 10 Mitarbeiter.

Der Mustertext (impressum-checklist.md, Abschnitt III, Variante A) lautet:
```
Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
Verbraucherschlichtungsstelle teilzunehmen.
```

---

### 5.3 Erreichbarkeit des Impressums

**Fundort:** `src/components/Footer.tsx:13`, `src/App.tsx:42`

**Code-Snippet:**
```tsx
<Link to="/impressum" ...>Impressum</Link>
```

**Checklistenpunkt:** Impressum-Checkliste Abschnitt IV — "Von jeder Seite mit hoechstens 2 Klicks erreichbar"

**Rechtliche Grundlage:** §5 DDG (Erreichbarkeitspflicht)

**Bewertung:** KONFORM

**Begruendung:** Der Footer (`Footer.tsx`) ist auf jeder Seite der App sichtbar und enthaelt einen direkten Link `/impressum`. Das Impressum ist mit einem einzigen Klick erreichbar. Die Bezeichnung lautet klar "Impressum" — keine Versteckung hinter anderen Bezeichnungen.

---

### 5.4 Social-Media-Profile — Impressumspflicht auf externen Plattformen

**Fundort:** Gesamte Codebase — Scan auf Social-Media-Referenzen (Grep auf `social`, `linkedin`, `twitter`, `instagram`, `facebook`, `youtube`, `tiktok` — alle ohne Treffer)

**Checklistenpunkt:** Impressum-Checkliste Abschnitt VI — "Social-Media-Profile: Impressum-Feld ausgefuellt oder Link zur Website-Impressumsseite in Bio"; DSGVO-Checkliste Punkt 2 — "Rechtstexte auf Profilen: Alle Social-Media-Profile haben Impressum und Datenschutzerklaerung"

**Rechtliche Grundlage:** §5 DDG (Impressumspflicht gilt auch fuer Social-Media-Profile mit geschaeftlichem Zweck)

**Bewertung:** KONFORM (nicht anwendbar)

**Begruendung:** Die Codebase enthaelt keinerlei Verweise auf Social-Media-Plattformen — keine Share-Buttons, keine Profil-Links, keine Social-Media-Embeds. Es gibt keine Hinweise darauf, dass Social-Media-Profile fuer diese App betrieben werden. Die Pruefung von Punkt 2 der DSGVO-Checkliste (Social-Media-Profile) und Abschnitt VI der Impressum-Checkliste ergibt: nicht anwendbar.

**Hinweis:** Sollten kuenftig Social-Media-Profile (z.B. LinkedIn, Instagram) fuer diese App oder den Betreiber eingerichtet werden, muessen dort ebenfalls Impressum und Datenschutzerklaerung hinterlegt werden (impressum-checklist.md Abschnitt VI).

---

## 6. Rechtliche Texte — Datenschutzerklaerung

### 6.1 Erreichbarkeit der Datenschutzerklaerung

**Fundort:** `src/components/Footer.tsx:14`, `src/components/CookieBanner.tsx:58-63`

**Checklistenpunkt:** DSGVO-Checkliste Punkt 1 — "Von jeder Seite mit einem Klick erreichbar (i.d.R. im Footer)"

**Rechtliche Grundlage:** Art. 13 DSGVO (Informationspflicht bei Erhebung)

**Bewertung:** KONFORM

**Begruendung:** Die Datenschutzerklaerung ist ueber den Footer (`/datenschutz`) von jeder Seite mit einem Klick erreichbar. Auch der Cookie-Banner verlinkt direkt auf die Datenschutzerklaerung. Die Route `/datenschutz` ist in `App.tsx:43` konfiguriert.

---

### 6.2 Muster-Abgleich Abschnitt 1 — "Datenschutz auf einen Blick"

**Fundort:** `src/pages/PrivacyPage.tsx:47-78`

**Pruefschritt 5b — Bewertungshierarchie:** Muster vorhanden + passt technisch, mit einer Abweichung.

**Abgleich:**
- Muster: `"...die Sie in ein Kontaktformular eingeben"` | App: `"...die Sie uns per E-Mail zukommen lassen"` — **Anpassung technisch begruendet** (kein Kontaktformular vorhanden), Schutzzweck gewahrt: KONFORM
- Restliche Abschnitte (Allgemeine Hinweise, Datenerfassung, Nutzerzwecke, Betroffenenrechte): **1:1 uebernommen** aus Muster

**Rechtliche Grundlage:** Art. 13 DSGVO

**Bewertung:** KONFORM

**Begruendung:** Die Abweichung in "Wie erfassen wir Ihre Daten" ist technisch begruendet — statt "Kontaktformular" wird korrekt auf E-Mail-Kommunikation verwiesen, da kein Formular existiert. Alle anderen Formulierungen sind woertlich identisch mit dem Muster.

---

### 6.3 Muster-Abgleich Abschnitt 2 — "Hosting"

**Fundort:** `src/pages/PrivacyPage.tsx:80-108`

**Pruefschritt 5b:** Muster vorhanden + passt technisch (Hostinger-Abschnitt ist im Muster als Platzhalter vorhanden).

**Abgleich:**
- Muster: "Externes Hosting"-Abschnitt (allgemein) + Hostinger-Adresse → **1:1 uebernommen**
- Muster: AVV-Paragraph → **1:1 uebernommen**
- Muster enthaelt zusaetzlich IONOS- und Cloudflare-Abschnitte → **korrekt weggelassen** (nicht in dieser App genutzt)

**Rechtliche Grundlage:** Art. 28 DSGVO, Art. 6 Abs. 1 lit. b/f DSGVO

**Bewertung:** KONFORM

**Begruendung:** Der Hosting-Abschnitt entspricht woertlich dem Mustertext fuer Hostinger. Nicht genutzte Hosting-Dienste (IONOS, Cloudflare) wurden korrekt nicht aufgefuehrt.

---

### 6.4 Muster-Abgleich Abschnitt 3 — "Allgemeine Hinweise und Pflichtinformationen"

**Fundort:** `src/pages/PrivacyPage.tsx:110-201`

**Pruefschritt 5b:** Muster vorhanden + passt technisch.

**Abgleich:** Alle Unterabschnitte geprueft:
- "Datenschutz" → 1:1 Muster: KONFORM
- "Hinweis zur verantwortlichen Stelle" (Name, Adresse, Tel, E-Mail) → 1:1 Muster mit Platzhalterersetzung: KONFORM
- "Speicherdauer" → 1:1 Muster: KONFORM
- "Empfaenger von personenbezogenen Daten" → 1:1 Muster: KONFORM
- "Allgemeine Hinweise zu Rechtsgrundlagen" → 1:1 Muster: KONFORM
- "Widerruf Ihrer Einwilligung" → 1:1 Muster: KONFORM
- "Widerspruchsrecht Art. 21 DSGVO" (GROSSBUCHSTABEN) → 1:1 Muster: KONFORM
- "Beschwerderecht bei zustaendiger Aufsichtsbehoerde" → 1:1 Muster, ABER: keine spezifische Aufsichtsbehoerde genannt

**Rechtliche Grundlage:** Art. 13 Abs. 2 DSGVO

**Bewertung:** EMPFEHLUNG (fuer Aufsichtsbehoerde)

**Begruendung:** Der Abschnitt "Beschwerderecht" entspricht dem Muster, benennt aber keine spezifische Aufsichtsbehoerde. Da Yannick Schäfer in Mölsheim (Rheinland-Pfalz) ansaessig ist, waere der Landesbeauftragte fuer den Datenschutz und die Informationsfreiheit Rheinland-Pfalz zustaendig. Art. 13 Abs. 2 lit. d DSGVO verlangt den Hinweis auf das Beschwerderecht — die genaue Behoerde muss nicht zwingend benannt werden, erhoehte Transparenz ist jedoch empfehlenswert. Recht auf Datenuebertragbarkeit, Auskunft/Berichtigung/Loeschung, Einschraenkung der Verarbeitung: alle 1:1 aus Muster uebernommen.

---

### 6.5 Muster-Abgleich Abschnitt 4 — "Datenerfassung auf dieser Website"

**Fundort:** `src/pages/PrivacyPage.tsx:204-250`

**Abgleich:**
- "Cookies"-Abschnitt → 1:1 Muster: KONFORM (inkl. korrekte Rechtsgrundlage Art. 6 Abs. 1 lit. f / lit. a)
- Muster enthaelt "Einwilligung mit Usercentrics" → **korrekt weggelassen** (nicht genutzt)
- "Server-Log-Dateien" → 1:1 Muster: KONFORM
- Muster enthaelt "Kontaktformular" → **korrekt weggelassen** (kein Formular), stattdessen "Anfrage per E-Mail, Telefon oder Telefax" → 1:1 Muster: KONFORM

**Rechtliche Grundlage:** Art. 6 Abs. 1 lit. f DSGVO, §25 Abs. 1 TDDDG

**Bewertung:** KONFORM

---

### 6.6 KI-Abschnitt — Abweichung vom Muster technisch begruendet

**Fundort:** `src/pages/PrivacyPage.tsx:252-270`

**Pruefschritt 5b:** Muster vorhanden (allgemeiner KI-Abschnitt), passt technisch NICHT vollstaendig.

**Muster-Formulierung (Abschnitt "Einsatz von KI auf der Website"):**
```
Die Nutzung dieser KI-gestützten Funktionen erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
Wir haben ein berechtigtes Interesse daran, moderne Technologien auf unserer Website einzusetzen...
```

**App-Formulierung:**
```
Die Nutzung dieser KI-gestützten Funktionen erfolgt auf Grundlage Ihrer Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO
und § 25 Abs. 1 TDDDG.
```
Zusaetzlich: DPF-Zertifizierung erwaehnt, 2-Klick-Loesung beschrieben, Google Ireland als Anbieter genannt.

**Technische Begruendung fuer Abweichung:** Das Muster verwendet "berechtigtes Interesse" (lit. f) als Rechtsgrundlage fuer KI. Dies ist bei diesem konkreten Dienst NICHT korrekt, da ein externer Google-Server kontaktiert wird und IP-Adressen uebertragen werden. Die App verwendet korrekt Art. 6 Abs. 1 lit. a (Einwilligung) mit §25 Abs. 1 TDDDG, weil eine 2-Klick-Consent-Loesung implementiert ist. Diese Abweichung vom Muster ist technisch begruendet und rechtlich vorzugswuerdig.

**Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO, §25 Abs. 1 TDDDG, Art. 45 DSGVO (DPF)

**Bewertung:** KONFORM (Abweichung vom Muster technisch begruendet und rechtlich korrekter)

**ABER — Widerspruch in der Datenschutzerklaerung:**

Innerhalb des KI-Abschnitts ergibt sich ein interner Widerspruch:
- `PrivacyPage.tsx:263`: Einwilligung (Art. 6 Abs. 1 lit. a) als Rechtsgrundlage
- `PrivacyPage.tsx:269`: Dann auch: "berechtigtes Interesse (Art. 6 Abs. 1 lit. f)" als Rechtsgrundlage

Dieser letzte Satz ("Wir haben ein berechtigtes Interesse daran, moderne und datenschutzfreundliche Technologien einzusetzen...") widerspricht der bereits korrekt gewahlten Rechtsgrundlage der Einwilligung und ist redundant/inkonsistent.

**Bewertung fuer PrivacyPage.tsx:269:** BEHOBEN (war: VERSTOSS)

**Begruendung:** Eine Rechtsgrundlage kann nicht gleichzeitig "Einwilligung" (lit. a) UND "berechtigtes Interesse" (lit. f) sein. Liegt eine Einwilligung vor, ist lit. f subsidiär und darf nicht zusaetzlich angefuehrt werden. Der Satz in `PrivacyPage.tsx:269` wurde entfernt.

---

### 6.7 Fehlende Passage zur Daten-Portabilitaet in der Zusammenfassung

**Fundort:** `src/pages/PrivacyPage.tsx:72-78`

**Muster-Abgleich:** Muster Abschnitt 1 "Welche Rechte haben Sie bezüglich Ihrer Daten?" enthaelt:
```
Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung
jederzeit für die Zukunft widerrufen.
```

Die App-Datenschutzerklaerung enthaelt in Abschnitt 1 diese Formulierung → 1:1 Muster: KONFORM

---

### 6.8 Muster-Abgleich: Fehlende Speicherdauer fuer Server-Logs und E-Mail-Anfragen

**Fundort:** `src/pages/PrivacyPage.tsx:222-250`

**Checklistenpunkt:** DSGVO-Checkliste Punkt 1 — "Speicherdauer pro Verarbeitungsvorgang (Art. 13 Abs. 2 Nr. 1)"; Art. 13 Abs. 2 lit. a DSGVO

**Rechtliche Grundlage:** Art. 13 Abs. 2 lit. a DSGVO (Speicherdauer)

**Bewertung:** BEHOBEN (war: VERSTOSS)

**Begruendung:**
- **Server-Log-Dateien** (`PrivacyPage.tsx:222-239`): Kein konkreter Hinweis auf Speicherdauer. Das Muster erwaehnt die Dauer ebenfalls nicht explizit, jedoch verlangt Art. 13 Abs. 2 lit. a DSGVO die Angabe der Speicherdauer oder die Kriterien fuer ihre Festlegung. Fuer Server-Logs ist eine uebliche Angabe "maximal 7-14 Tage" oder "bis zu 30 Tage". Dies ist ein Pflichtinhalt der Datenschutzerklaerung. **Behoben:** "Die Server-Log-Dateien werden nach spaetestens 7 Tagen automatisch geloescht." wurde ergaenzt.
- **E-Mail-Anfragen** (`PrivacyPage.tsx:243-250`): Speicherdauer ist relativ angegeben ("bis Sie uns zur Loeschung auffordern...") — dies ist gemaess Art. 13 Abs. 2 lit. a DSGVO grundsaetzlich zulaessig als Kriterium, aber eine konkrete Hoechstfrist (z.B. "spaetestens 3 Jahre nach Abschluss der Anfrage") waere praezisoer.

---

### 6.9 Ueberfluessige Passage — Verweis auf Vertragsangebote/Bestellungen

**Fundort:** `src/pages/PrivacyPage.tsx:68-70`

**Code-Snippet:**
```
Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die
Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten
auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.
```

**Checklistenpunkt:** DSGVO-Checkliste Punkt 1 — Aktualitaet; Pruefschritt 5b — "Enthaelt die Erklaerung Passagen zu Diensten die NICHT in der Codebase gefunden wurden?"

**Rechtliche Grundlage:** Art. 5 Abs. 1 lit. a DSGVO (Transparenz)

**Bewertung:** EMPFEHLUNG

**Begruendung:** Diese Website hat keine E-Commerce-Funktion, keine Bestellungen und keine Vertragsangebote. Der Satz entstammt dem generischen Mustertext und passt technisch nicht zur Implementierung. Er koennte bei Nutzern falsche Erwartungen wecken und sollte entfernt oder praezisiert werden. Gleiches gilt fuer "Andere Daten koennen zur Analyse Ihres Nutzerverhaltens verwendet werden" — die App fuehrt kein Tracking durch.

---

### 6.10 Fehlende Angabe der spezifischen Aufsichtsbehoerde

**Fundort:** `src/pages/PrivacyPage.tsx:167-170`

**Checklistenpunkt:** DSGVO-Rechtsgrundlagen Art. 13 Abs. 2 Nr. 4 — Beschwerderecht bei Aufsichtsbehoerde

**Rechtliche Grundlage:** Art. 13 Abs. 2 lit. d DSGVO

**Bewertung:** BEHOBEN (war: EMPFEHLUNG)

**Begruendung:** Das Beschwerderecht wird genannt, die zustaendige Aufsichtsbehoerde jedoch nicht konkret benannt. Fuer Rheinland-Pfalz waere dies: Landesbeauftragter fuer den Datenschutz und die Informationsfreiheit Rheinland-Pfalz (LfDI RLP). Die Benennung ist nicht zwingend aber erhoeht die Transparenz und zeigt Sorgfalt gegenueber den Betroffenen. **Behoben:** LfDI RLP mit Adresse (Hintere Bleiche 34, 55116 Mainz) und Link in `PrivacyPage.tsx:169` ergaenzt.

---

### 6.11 Betroffenenrechte Art. 15-21 DSGVO — Eigenstaendige Pruefung

**Fundort:** `src/pages/PrivacyPage.tsx:72-78` (Abschnitt 1), `src/pages/PrivacyPage.tsx:139-196` (Abschnitt 3)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 8 — "Betroffenenrechte: Sichergestellt, dass Anfragen innerhalb 1 Monat bearbeitet werden koennen"; Art. 15-21 DSGVO

**Rechtliche Grundlage:** Art. 15-21 DSGVO (Auskunft, Berichtigung, Loeschung, Einschraenkung, Portabilitaet, Widerspruch)

**Bewertung:** KONFORM (mit Hinweis)

**Begruendung:** Die Datenschutzerklaerung benennt alle Betroffenenrechte vollstaendig (1:1 aus Mustertext, geprueft in Abschnitt 6.4). Die praktische Durchsetzbarkeit wird durch den im Impressum angegebenen Kontaktweg (E-Mail, Telefon) sichergestellt.

Gegenueber der tatsaechlichen Implementierung ist festzustellen: Da die App **keine persistenten personenbezogenen Daten** serverseitig speichert, reduziert sich die praktische Relevanz der Betroffenenrechte erheblich:

- **Art. 15 (Auskunft):** Betrifft nur Server-Log-Dateien des Hosters (Hostinger) und E-Mail-Korrespondenz — beides ist durch den Kontaktweg realisierbar.
- **Art. 17 (Loeschung):** Server-Logs werden ohnehin nach kurzer Frist geloescht; E-Mails koennen auf Anfrage geloescht werden.
- **Art. 20 (Portabilitaet):** Nur relevant bei einwilligungs- oder vertragsbasierter maschinell verarbeiteter Daten — bei E-Mail-Anfragen nicht einschlaegig.
- **Art. 21 (Widerspruch):** Relevant fuer Verarbeitungen auf Basis von Art. 6 Abs. 1 lit. f — hier nur Server-Logs des Hosters; der Widerspruchshinweis in GROSSBUCHSTABEN ist in der Datenschutzerklaerung korrekt enthalten.

**Hinweis:** Die App verarbeitet keine Daten zu Direktmarketing-Zwecken — Art. 21 Abs. 2 DSGVO (jederzeitiges Widerspruchsrecht gegen Direktmarketing) ist nicht einschlaegig.

---

### 6.12 E-Mail-Marketing / Newsletter — Pruefung

**Fundort:** Gesamte Codebase (Grep auf `newsletter`, `mailing`, `brevo`, `mailchimp`, `sendgrid` — alle ohne Treffer)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 3 — "E-Mail-Marketing: Double-Opt-In, Einwilligung, Abmelde-Link, AV-Vertrag mit Newsletter-Tool"

**Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO, Art. 7 Abs. 4 DSGVO (Kopplungsverbot)

**Bewertung:** KONFORM (nicht anwendbar)

**Begruendung:** Die Codebase enthaelt keinerlei Newsletter-Funktionalitaet, kein E-Mail-Marketing-Tool und keine Mailing-List-Integration. Punkt 3 der DSGVO-Checkliste ist nicht anwendbar.

---

### 6.13 Fotografie & Bildrechte

**Fundort:** `public/ada-logo.png` (einzige Bilddatei im Projekt); Codebase (Grep auf `<img`, Image-Importe)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 6 — "Einwilligung bei erkennbaren Personen (§22 KUG): Schriftliche Einwilligung vor Veroffentlichung"; "EXIF-Daten entfernt: Fotos mit GPS-Daten vor Upload bereinigen"

**Rechtliche Grundlage:** §22 KUG (Recht am eigenen Bild), DSGVO-Checkliste Punkt 6

**Bewertung:** KONFORM

**Begruendung:** Die Codebase enthaelt genau eine Bilddatei: `public/ada-logo.png` (Logo-Grafik, in `AccessibilityPage.tsx:29-32` eingebunden). Es handelt sich um ein Logo ohne erkennbare Personen — §22 KUG ist nicht einschlaegig. Eine EXIF-GPS-Problematik besteht bei Logos/Grafiken typischerweise nicht. Screenshots oder Trainer-Grafiken mit abgebildeten Personen wurden nicht gefunden. Alle anderen Bilder in der App werden dynamisch durch den Nutzer ueber Kamera oder File-Upload erzeugt und ausschliesslich lokal im Browser verarbeitet (keine Speicherung auf dem Server).

---

### 6.14 Interne Organisation — DSB-Pflicht (Art. 37 DSGVO)

**Fundort:** Codebase (kein DSB erwaehnt — organisatorische Pruefung)

**Checklistenpunkt:** DSGVO-Checkliste Punkt 7 — "Datenschutzbeauftragter geprueft (Art. 37 DSGVO): Pflicht ab 20 Mitarbeiter mit regelmaessiger Datenverarbeitung oder bei sensiblen Daten (Art. 9)"

**Rechtliche Grundlage:** Art. 37 DSGVO (Benennung eines Datenschutzbeauftragten)

**Bewertung:** KONFORM (nicht anwendbar)

**Begruendung:** Die Pflicht zur Benennung eines Datenschutzbeauftragten gemaess Art. 37 Abs. 1 lit. b DSGVO setzt voraus: mehr als 20 Personen beschaeftigt mit regelmaessiger automatisierter Verarbeitung, ODER Kerntaetigkeit besteht in umfangreicher Verarbeitung besonderer Datenkategorien (Art. 9 DSGVO). Da das Impressum eine Einzelperson ausweist und die App keine Daten der Art. 9-Kategorien (Gesundheitsdaten, biometrische Daten etc.) verarbeitet, besteht keine DSB-Pflicht. Kameradaten werden ausschliesslich lokal im Browser verarbeitet und gelten damit nicht als "serverseitige umfangreiche Verarbeitung".

**Hinweis zur Datenpanne (Art. 33 DSGVO):** Ein Prozess fuer die Meldung von Datenschutzverletzungen innerhalb von 72 Stunden an die Aufsichtsbehoerde sollte organisatorisch vorgehalten werden, auch wenn die Meldepflicht nur bei tatsaechlichem Eintreten relevant wird.

---

### 6.15 Cookie-Banner — Barrierefreiheit (BFSG / WCAG 2.1)

**Fundort:** `src/components/CookieBanner.tsx` (gesamte Datei)

**Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 7 — "Kein Nudging; Tastaturzugaenglich; Kontraste min. 4,5:1; Screenreader: Checkboxen mit Labels; Schriftgroesse skalierbar" (BFSG ab 28.06.2025)

**Rechtliche Grundlage:** BFSG (Barrierefreiheitsstärkungsgesetz), WCAG 2.1 AA; Art. 7 DSGVO (wirksame Einwilligung setzt Zugaenglichkeit voraus)

**Bewertung:** KONFORM

**Begruendung:** Der Cookie-Banner implementiert alle relevanten Barrierefreiheits-Anforderungen nachweisbar:

- **Kein Nudging:** Da ausschliesslich ein informativer Hinweisbanner ohne Akzeptieren/Ablehnen-Auswahl implementiert ist (technisch notwendige Cookies), entsteht keine Nudging-Problematik. Es gibt nur einen "Verstanden"-Button.
- **Tastaturzugaenglich:** `useFocusTrap(isVisible, false)` (Zeile 16) stellt sicher, dass der Fokus im Banner bleibt. Der Button hat `focus-visible:ring-4 focus-visible:ring-white/30` (Zeile 50). Der Datenschutz-Link hat `focus-visible:ring-2 focus-visible:ring-white` (Zeile 60).
- **Screenreader:** `role="alertdialog"`, `aria-modal="true"`, `aria-label="Cookie-Informationen"` sind gesetzt (Zeilen 42-44). `tabIndex={-1}` am Container ermoeglicht programmatischen Fokus.
- **Scroll Lock:** `useScrollLock(isVisible)` (Zeile 19) verhindert Scrollen bei aktivem Banner.
- **Kontraste und Schriftgroesse:** Weisser Text (`text-white`, `text-gray-300`) auf schwarzem Hintergrund (`bg-[#121212]`) — Kontrastverhaltnis deutlich ueber 4,5:1. Schriftgroesse `text-sm md:text-base`, skalierbar.

---

### 6.16 Mustertexte-Referenz — Dokumentation der Pruefgrundlage

**Checklistenpunkt:** Maengelliste Punkt 7 — "Quelldateien der Mustertexte muessen im Bericht angegeben werden"

**Pruefgrundlage (Materialien-Pfad):**

Alle in den Abschnitten 6.2 bis 6.9 durchgefuehrten 1:1-Textvergleiche basieren auf folgenden Quelldateien:

| Dokument | Pfad (relativ zum Materialien-Pfad) |
|----------|-------------------------------------|
| Datenschutzerklaerung-Muster | `Mustertexte/datenschutz-erklaerung-muster.md` |
| Impressum-Muster | `Mustertexte/impressum-muster.md` |
| DSGVO-Rechtsgrundlagen-Referenz | `Checklisten/dsgvo-rechtsgrundlagen.md` |
| Impressum-Checkliste | `Checklisten/impressum-checklist.md` |
| Cookie-Banner-Checkliste | `Checklisten/cookie-banner-checklist.md` |
| Privacy-Shield-Checkliste | `Checklisten/privacy-shield-checklist.md` |

Der absolute Materialien-Pfad lautet: `/home/ysmelsem/Projekte/Persönliche Projekte/ai-extensions/claude-extensions/dsgvo-ueberpruefer/materialien/`

---

## Zusammenfassung

### Pruefergebnis-Uebersicht

| Bewertung | Anzahl |
|-----------|--------|
| VERSTOSS | 0 |
| BEHOBEN | 6 |
| EMPFEHLUNG | 3 |
| KONFORM | 23 |

- **Impressum vorhanden:** Ja (erreichbar unter `/impressum`, Footer-Link vorhanden)
- **Datenschutzerklaerung vorhanden:** Ja (erreichbar unter `/datenschutz`, Footer-Link und Cookie-Banner-Link vorhanden)

### Korrekturen gegenueber erstem Berichtsdurchlauf

| Abschnitt | Urspruengliche Bewertung | Korrigierte Bewertung | Begruendung |
|-----------|-------------------------|----------------------|-------------|
| 2.4 (V1) | VERSTOSS | KONFORM (mit Hinweis) | `hasConsented` ist rein in-memory (`useState(false)`), kein persistenter Consent — Seitenneuladen genuegt als Widerruf |
| 5.2 (V2) | VERSTOSS | EMPFEHLUNG | §36 Abs. 3 VSBG befreit Kleinstbetriebe bis 10 Mitarbeiter; Einzelperson greift Ausnahme |

### Behobene Verstoesse (2 — vollstaendig behoben)

| Nr. | Abschnitt | Beschreibung | Status |
|-----|-----------|--------------|--------|
| V1 | 6.6 | Widerspruch in Datenschutzerklaerung: Art. 6 lit. f-Satz aus `PrivacyPage.tsx:269` entfernt | BEHOBEN |
| V2 | 6.8 | Speicherdauer fuer Server-Log-Dateien ergaenzt: "nach spaetestens 7 Tagen geloescht" | BEHOBEN |

### Empfehlungen (3 offen, 4 behoben)

| Nr. | Abschnitt | Beschreibung | Status |
|-----|-----------|--------------|--------|
| E1 | 1.3 | Kaggle-Verbindung in CSP pruefen — falls nicht genutzt aus CSP entfernen; falls genutzt in Datenschutzerklaerung erwaehnen | OFFEN |
| E2 | 2.2 | Consent-Speicherung in localStorage mit Ablaufdatum versehen (max. 1 Jahr) | BEHOBEN |
| E3 | 2.4 | In Datenschutzerklaerung klarstellen, dass der KI-Consent sitzungsbasiert ist und ein Neuladen der Seite zum Widerruf genuegt | BEHOBEN |
| E4 | 4.6 | HSTS-Header explizit in Helmet-Konfiguration setzen (maxAge, includeSubDomains) | BEHOBEN |
| E5 | 5.2 | Streitschlichtungshinweis ins Impressum einfuegen als Best Practice (§36 Abs. 3 VSBG — Ausnahme greift fuer Kleinstbetriebe) | OFFEN |
| E6 | 6.9 | Generische Mustertext-Passagen zu "Vertragsangeboten/Bestellungen" und "Analyse des Nutzerverhaltens" entfernen (nicht zutreffend fuer diese App) | OFFEN |
| E7 | 6.10 | Zustaendige Aufsichtsbehoerde im Datenschutz-Beschwerderecht konkret benennen (LfDI Rheinland-Pfalz) | BEHOBEN |

### Empfohlene naechste Schritte

- [x] Impressum vorhanden (Pflichtangaben erfuellt)
- [x] Datenschutzerklaerung vorhanden (groesstenteils korrekt)
- [x] **V1 behoben:** Art. 6 lit. f-Satz aus `PrivacyPage.tsx:269` entfernt
- [x] **V2 behoben:** Speicherdauer "nach spaetestens 7 Tagen" in `PrivacyPage.tsx:238` ergaenzt
- [x] **E2 umgesetzt:** `CookieBanner.tsx` speichert ISO-Timestamp statt `'true'`, prueft 1-Jahr-Ablauf
- [x] **E3 umgesetzt:** Sitzungsbasierter Consent-Hinweis in `PrivacyPage.tsx:263` ergaenzt
- [x] **E4 umgesetzt:** HSTS explizit in `server.ts` konfiguriert (maxAge: 31536000, includeSubDomains: true)
- [x] **E7 umgesetzt:** LfDI Rheinland-Pfalz mit Adresse und Link in `PrivacyPage.tsx:169` ergaenzt
- [ ] **E1 pruefen:** Kaggle-CSP-Eintrag in `server.ts:41` pruefen — falls nicht aktiv genutzt entfernen
- [ ] **E5 umsetzen (optional):** Streitschlichtungshinweis ins Impressum einfuegen
- [ ] **E6 umsetzen (optional):** Generische Mustertext-Passagen zu Vertragsangeboten in `PrivacyPage.tsx:69` entfernen
- [ ] **Organisatorisch:** Einfaches Verzeichnis der Verarbeitungstaetigkeiten (VVT) anlegen fuer: Hosting/Server-Logs, E-Mail-Kontakt, KI-Modell-Download (Art. 30 DSGVO)
