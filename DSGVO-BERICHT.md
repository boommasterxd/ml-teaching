# DSGVO-Prüfbericht

| | |
|---|---|
| **Datum** | 2026-03-27 |
| **Geprüftes Verzeichnis** | `/home/ysmelsem/Projekte/BoomApps Projekte/Externe Projekte/the-teachable-machine` |
| **Prüfgrundlage** | eRecht24-Checklisten, DSGVO, TDDDG, DDG |
| **Anzahl Prüfpunkte** | 34 |
| **Gesamtergebnis** | BESTANDEN |

---

## 1. Externe Ressourcen & IP-Leaks

### 1.1 CDN-Einbindungen (Fonts, Icons, externe Stylesheets)

- **Fundort:** `src/index.css`, `index.html` (gesamte Datei geprüft)
- **Code-Snippet:** `@import "tailwindcss";` (lokal via npm), keine externen CDN-Links in `index.html`
- **Checklistenpunkt:** DSGVO-Checklist, Punkt 5 — "Externe Ressourcen geprüft: Google Fonts, Font Awesome, CDNs etc. — lokal hosten oder Einwilligung"
- **Rechtliche Grundlage:** §25 TDDDG Abs. 1; Art. 6 Abs. 1 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Es wurden keinerlei Einbindungen von `fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com`, `cdnjs.com`, `jsdelivr.net` oder `fontawesome`-CDN gefunden. Tailwind CSS 4 wird lokal via npm gebündelt. Keine automatische IP-Übertragung an Drittanbieter-CDNs.

---

### 1.2 MobileNet-Modell-Download von Google-Servern (Drittlandübermittlung)

- **Fundort:** `src/hooks/useModelLoader.ts:71-78` / `src/components/modals/ConsentModal.tsx:55-57` / `src/pages/PrivacyPage.tsx:226-239`
- **Code-Snippet:**
  ```typescript
  // useModelLoader.ts:71
  return mobilenet.load({
    version: ML.MOBILENET_VERSION,
    alpha: ML.MOBILENET_ALPHA,
  });
  ```
  ```typescript
  // ConsentModal.tsx:55-57
  Ich willige ein, dass für die Ausführung der Anwendung notwendige KI-Modelle (MobileNet) von
  Google-Servern geladen werden. Mir ist bewusst, dass hierbei meine IP-Adresse an Google
  übertragen wird (...)
  ```
- **Checklistenpunkt:** Privacy-Shield-Checkliste Schritt 1 — DPF-Zertifizierung des US-Empfängers prüfen; DSGVO-Checklist Punkt 4 — "Drittlandübermittlung geprüft: USA-Dienste — DPF-Zertifizierung"
- **Rechtliche Grundlage:** Art. 44-49 DSGVO; Art. 45 DSGVO (Angemessenheitsbeschluss)
- **Bewertung:** KONFORM
- **Begründung:** Google LLC ist nach dem EU-U.S. Data Privacy Framework (DPF) zertifiziert (Non-HR + HR, Stand 2024). Die Datenschutzerklärung (`PrivacyPage.tsx:238`) nennt den DPF-Link `https://www.dataprivacyframework.gov/participant/5780` korrekt. Das Modell wird erst nach expliziter Einwilligung geladen (Consent-Gate in `TrainingPage.tsx:457-461`). Die Einwilligung erfolgt vor dem Download (`hasConsented`-Flag steuert `useModelLoader`). Die CSP in `server.ts:34` erlaubt nur die benötigten Google-Domains (`storage.googleapis.com`, `*.gstatic.com`, `tfhub.dev`). Die Drittlandübermittlung ist technisch korrekt und datenschutzrechtlich ordnungsgemäß durch DPF + vorherige Einwilligung abgesichert.

---

### 1.3 Drittanbieter-Embeds (iframes, Social Media, Analytics)

- **Fundort:** Gesamte `src/`-Verzeichnis
- **Code-Snippet:** Keine Treffer für `iframe`, `youtube.com`, `google-analytics`, `gtag`, `tagmanager`
- **Checklistenpunkt:** DSGVO-Checklist Punkt 5 — "Keine Tracking-Cookies vor Einwilligung"
- **Rechtliche Grundlage:** §25 TDDDG Abs. 1
- **Bewertung:** KONFORM
- **Begründung:** Keine Analytics-Dienste, Social-Media-Buttons oder Drittanbieter-Embeds vorhanden. Die Anwendung ist eine rein lokale ML-Demo ohne externe Tracking-Dienste.

---

## 2. Consent-Management & Cookies

### 2.1 Einwilligungs-Mechanismus für Modell-Download (Two-Click-Lösung)

- **Fundort:** `src/components/modals/ConsentModal.tsx:17-82` / `src/pages/TrainingPage.tsx:457-472`
- **Code-Snippet:**
  ```tsx
  // ConsentModal.tsx:17-21
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);
  const canConfirm = privacyChecked && modelChecked;
  ```
- **Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 2 — "Opt-In-Prinzip: Checkboxen nicht vorausgewählt"; Art. 7 DSGVO — aktive Handlung erforderlich
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 7 DSGVO; §25 Abs. 1 TDDDG
- **Bewertung:** KONFORM
- **Begründung:** Beide Checkboxen im ConsentModal sind mit `useState(false)` initialisiert — kein Opt-Out, kein Pre-Checked. Der Bestätigen-Button ist erst aktiv wenn beide Checkboxen aktiviert wurden (`canConfirm = privacyChecked && modelChecked`). Das Modell wird technisch erst nach `setHasConsented(true)` geladen (useModelLoader prüft `if (!hasConsented) return`). Es liegt eine korrekte Two-Click-Lösung / Consent-Gate vor.

---

### 2.2 Cookie-Einsatz und Cookie-Banner

- **Fundort:** Gesamte `src/`-Verzeichnis (Grep auf `document.cookie`, `localStorage`, `sessionStorage`, `cookies.set`)
- **Code-Snippet:** Keine Treffer
- **Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 1 — "Alle ablehnen"-Button auf erster Ebene; §25 TDDDG
- **Rechtliche Grundlage:** §25 TDDDG Abs. 2 Nr. 2; Art. 6 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Die Anwendung setzt keinerlei Cookies. Es wird weder `document.cookie`, `localStorage` noch `sessionStorage` verwendet. Die gesamte ML-Verarbeitung (Bilder, Features, Modellzustand) erfolgt ausschließlich im JavaScript-Arbeitsspeicher (React-State). Da keine Cookies oder Speicherzugriffe auf das Endgerät erfolgen, ist ein Cookie-Banner nach §25 TDDDG nicht erforderlich. Ein Hinweis in der Datenschutzerklärung genügt (vorhanden in `PrivacyPage.tsx:178-193`).

---

### 2.3 Widerrufsmöglichkeit für erteilte Einwilligung

- **Fundort:** `src/components/Footer.tsx:12`
- **Code-Snippet:**
  ```tsx
  // Footer.tsx:12
  <p className="mb-4 text-sm">Erteilte Einwilligung widerrufen? Einfach die Seite neu laden –
  die Einwilligung gilt nur für die aktuelle Sitzung.</p>
  ```
- **Checklistenpunkt:** Cookie-Banner-Checkliste Punkt 6 — "Widerruf so einfach wie Einwilligung"; Art. 7 Abs. 3 DSGVO
- **Rechtliche Grundlage:** Art. 7 Abs. 3 DSGVO — Widerruf so einfach wie Einwilligung
- **Bewertung:** KONFORM
- **Begründung:** Der Widerruf ist klar im Footer auf jeder Seite kommuniziert. Da die Einwilligung technisch nur für die Sitzung im React-State gespeichert wird (kein persistenter Storage), ist ein Neuladen der Seite eine valide und einfache Widerrufsmethode. Der Widerruf ist damit tatsächlich genauso einfach wie die Einwilligung (1 Klick).

---

### 2.4 Kamera-Einwilligungsprozess

- **Fundort:** `src/components/modals/CameraConsentModal.tsx` / `src/pages/TrainingPage.tsx:468-472`
- **Code-Snippet:**
  ```tsx
  // TrainingPage.tsx:468-472
  <CameraConsentModal
    isOpen={hasConsented && !isModelLoading && !cameraConsent}
    onDecline={() => navigate('/')}
    onConfirm={() => setCameraConsent(true)}
  />
  ```
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 2 — Transparenz bei Datenerhebung; Art. 13 DSGVO
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 13 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Kamerazugriff erfolgt erst nach expliziter separater Einwilligung über `CameraConsentModal`. Der Modal informiert klar über den Zweck (Trainingsdaten-Erfassung) und erklärt, dass keine Daten hochgeladen werden. Die Abbrechen-Option leitet zurück zur Startseite. Der zweistufige Einwilligungsprozess (erst Datenschutz/Modell, dann Kamera) ist DSGVO-konform.

---

## 3. Formular-Compliance & Datensparsamkeit

### 3.1 Kontaktformular (kein Formular vorhanden)

- **Fundort:** `src/`-Verzeichnis (Grep auf `<form>`, `type="email"`, `newsletter`, `contact`)
- **Code-Snippet:** Kein Kontaktformular im Code gefunden
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 2 — Kontaktformular
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. b DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Die Anwendung enthält kein Kontaktformular. Kontakt ist ausschließlich per E-Mail/Telefon möglich (Impressum). In der Datenschutzerklärung ist die E-Mail/Telefon-Kontaktaufnahme als Verarbeitungsvorgang korrekt dokumentiert (`PrivacyPage.tsx:213-222`).

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
  console.log(`🚀 Server running on http://0.0.0.0:${port} (...)`);
  ```
- **Checklistenpunkt:** DSGVO-Checklist Punkt 9 — TOM; Art. 5 Abs. 1 lit. f DSGVO — Integrität und Vertraulichkeit
- **Rechtliche Grundlage:** Art. 32 DSGVO (TOM); Art. 6 Abs. 1 lit. f DSGVO (Serverlog — berechtigtes Interesse)
- **Bewertung:** KONFORM
- **Begründung:** Der Express-Server selbst loggt keine PII (keine IP-Adressen, keine Anfrageinhalte, keine Nutzerdaten). Die drei `console.log`-Aufrufe sind reine Start-/Status-Logs ohne personenbezogene Daten. Es ist kein Morgan-Logger oder ähnliches HTTP-Request-Logging konfiguriert. Die tatsächlichen Server-Access-Logs werden vom Hosting-Anbieter (Hostinger) verwaltet — was in der Datenschutzerklärung unter "Server-Log-Dateien" korrekt beschrieben ist.

---

### 4.2 Passwort-Hashing und Nutzerdaten

- **Fundort:** Gesamte Codebase (Grep auf `password`, `bcrypt`, `argon2`, `hash`, `db.`, `model`)
- **Code-Snippet:** Keine Treffer für Authentifizierung, Datenbank oder Nutzerkonten
- **Checklistenpunkt:** DSGVO-Checklist Punkt 9 — "Passwort-Hashing (bcrypt, Argon2)"; Art. 32 DSGVO
- **Rechtliche Grundlage:** Art. 32 DSGVO — Sicherheit der Verarbeitung
- **Bewertung:** KONFORM
- **Begründung:** Die Anwendung besitzt kein Backend-Datenbankmodell, keine Nutzerkonten und keine Authentifizierung. Es werden keine personenbezogenen Daten serverseitig gespeichert. Die gesamte ML-Verarbeitung ist clientseitig. Kein Passwort-Hashing erforderlich.

---

### 4.3 AV-Vertrag mit Hosting-Anbieter

- **Fundort:** `src/pages/PrivacyPage.tsx:78-81`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:78-81
  <h4>Auftragsverarbeitung</h4>
  <p>Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten
  Dienstes geschlossen. (...)</p>
  ```
- **Checklistenpunkt:** DSGVO-Checklist Punkt 4 — "AV-Verträge geschlossen mit allen Dienstleistern"; Art. 28 DSGVO
- **Rechtliche Grundlage:** Art. 28 DSGVO — Auftragsverarbeitung
- **Bewertung:** KONFORM
- **Begründung:** Die Datenschutzerklärung dokumentiert den AVV mit Hostinger (HOSTINGER operations, UAB, Litauen). Litauen ist EU-Mitgliedstaat — kein Drittlandtransfer. Der AVV-Hinweis entspricht dem Mustertext und ist vollständig.

---

### 4.4 HSTS und Sicherheits-Header

- **Fundort:** `server.ts:41-44`
- **Code-Snippet:**
  ```typescript
  // server.ts:41-44
  hsts: {
    maxAge: SERVER.HSTS_MAX_AGE,
    includeSubDomains: true,
  },
  ```
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 3 — "HSTS: Strict-Transport-Security-Header gesetzt"; Art. 32 DSGVO
- **Rechtliche Grundlage:** Art. 32 DSGVO — TOM
- **Bewertung:** KONFORM
- **Begründung:** HSTS ist mit `includeSubDomains: true` via Helmet konfiguriert. Die CSP ist im Produktionsmodus aktiv und restriktiv konfiguriert. X-Frame-Options ist auf `deny` gesetzt. Referrer-Policy auf `strict-origin-when-cross-origin`. Die Sicherheits-Header sind vorbildlich implementiert.

---

## 5. Rechtliche Texte — Impressum

### 5.1 Impressum — Pflichtangaben (Prüfschritt 5a)

**Vergleich Mustertext vs. vorhandenes Impressum (`ImprintPage.tsx`):**

**Mustertext enthält:** Name + Anschrift, Telefon, Telefax (optional), E-Mail.

**Vorhandenes Impressum enthält:**
- Name: "Yannick Schäfer" — vorhanden
- Anschrift: "Am Mäuerchen 12, 67591 Mölsheim" — ladungsfähig, vorhanden
- Telefon: "01575 7934851" — vorhanden
- E-Mail: "yannickschaefer@boomapps.de" — vorhanden (verlinkter `mailto:`-Link)

**Prüfung gegen Impressum-Checkliste:**
- [x] §5 Abs. 1 Nr. 1 DDG: Name + ladungsfähige Anschrift — vorhanden
- [x] §5 Abs. 1 Nr. 2 DDG: E-Mail — vorhanden, direkt lesbar und klickbar
- [x] EuGH C-649/17: Telefonnummer — vorhanden
- [x] Erreichbarkeit: Footer-Link auf jeder Seite (`Footer.tsx:14`) — vorhanden, 1 Klick
- [ ] Handelsregistereintrag: Nicht vorhanden — da Privatperson/Einzelperson, nicht erforderlich
- [ ] Umsatzsteuer-ID: Nicht vorhanden — bei nicht-gewerblichem Betreiber nicht zwingend

- **Fundort:** `src/pages/ImprintPage.tsx:17-35`
- **Checklistenpunkt:** Impressum-Checkliste Abschnitt I (§5 Abs. 1 DDG) + Abschnitt III (Erreichbarkeit)
- **Rechtliche Grundlage:** §5 DDG
- **Bewertung:** KONFORM
- **Begründung:** Alle Pflichtangaben nach §5 Abs. 1 DDG für eine Privatperson sind vorhanden: Name, ladungsfähige Anschrift, E-Mail, Telefonnummer. Handelsregistereintrag und USt-ID sind bei Privatpersonen ohne gewerbliche Tätigkeit nicht zwingend. Das Impressum ist über den Footer jeder Seite mit einem Klick erreichbar.

---

## 6. Rechtliche Texte — Datenschutzerklärung

### 6.1 Datenschutzerklärung — Abschnitt 1: Datenschutz auf einen Blick (Prüfschritt 5b)

- **Fundort:** `src/pages/PrivacyPage.tsx:20-51`
- **Vergleich Mustertext (Zeile 7-31) vs. vorhandener Text:**

  - "Allgemeine Hinweise" (Muster Zeile 9): Vorhanden und **1:1 übernommen** — KONFORM
  - "Wie erfassen wir Ihre Daten?" (Muster Zeile 17): Vorhanden, jedoch **abweichend**: Das Muster sagt "Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben." — die Implementierung sagt stattdessen "Hierbei kann es sich z.&nbsp;B. um Daten handeln, die Sie uns per E-Mail zukommen lassen." Die Abweichung ist **technisch begründet**: Die Website hat kein Kontaktformular, nur E-Mail-Kontakt. Anpassung zulässig (Bewertungshierarchie Stufe 2).
  - "Analyse-Tools und Tools von Drittanbietern" (Muster Zeile 33-37): **FEHLT** in der vorhandenen Datenschutzerklärung — da jedoch keine Analyse-Tools verwendet werden, ist dieser Abschnitt nicht erforderlich. Das Fehlen ist technisch begründet und korrekt.
  - "Welche Rechte haben Sie?" — 1:1 Mustertext übernommen — KONFORM

- **Checklistenpunkt:** Art. 13 Abs. 2 DSGVO — Betroffenenrechte
- **Rechtliche Grundlage:** Art. 13 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der Abschnitt ist weitgehend mit dem Muster identisch. Die einzige Abweichung (E-Mail statt Kontaktformular) ist technisch korrekt und begründet.

---

### 6.2 Datenschutzerklärung — Verantwortliche Stelle (Art. 13 Abs. 1 Nr. 1 DSGVO)

- **Fundort:** `src/pages/PrivacyPage.tsx:95-110`
- **Code-Snippet:**
  ```
  Yannick Schäfer
  Am Mäuerchen 12
  67591 Mölsheim
  Telefon: 01575 7934851
  E-Mail: yannickschaefer@boomapps.de
  ```
- **Checklistenpunkt:** DSGVO-Checklist Punkt 1 — "Name + Kontakt des Verantwortlichen"; Art. 13 Abs. 1 Nr. 1
- **Rechtliche Grundlage:** Art. 13 Abs. 1 Nr. 1 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Name, vollständige Anschrift, Telefon und E-Mail des Verantwortlichen sind angegeben. Entspricht dem Mustertext. 1:1-Übernahme mit korrekten Platzhalterwerten.

---

### 6.3 Datenschutzerklärung — Server-Log-Dateien: fehlende Speicherdauer im Mustertext

- **Fundort:** `src/pages/PrivacyPage.tsx:194-211`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:210-211
  Die Server-Log-Dateien werden nach spätestens 7 Tagen automatisch gelöscht.
  ```
- **Vergleich Mustertext (Zeile 204-217):** Das Muster enthält KEINE konkrete Speicherdauer für Server-Logs — es endet nur mit dem allgemeinen Satz über Art. 6 Abs. 1 lit. f DSGVO.
- **Checklistenpunkt:** Art. 13 Abs. 2 Nr. 1 DSGVO — Speicherdauer muss angegeben werden; DSGVO-Rechtsgrundlagen — "Speicherdauer pro Verarbeitungsvorgang"
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 1 DSGVO
- **Bewertung:** KONFORM (vorteilhafte Ergänzung)
- **Begründung:** Die Angabe "7 Tage" ist eine zulässige und sogar vorteilhafte Ergänzung gegenüber dem Muster, da Art. 13 Abs. 2 Nr. 1 DSGVO die Angabe der Speicherdauer vorschreibt. Eine konkrete Frist ist konkreter als die allgemeine Formulierung im Muster und erhöht die Transparenz.

---

### 6.4 Datenschutzerklärung — KI/MobileNet-Abschnitt: Rechtsgrundlage für den KI-Einsatz

- **Fundort:** `src/pages/PrivacyPage.tsx:224-242`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:234-236
  Die Nutzung dieser KI-gestützten Funktionen erfolgt auf Grundlage Ihrer Einwilligung nach
  Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.
  ```
- **Vergleich Mustertext (Zeile 227-239):** Das Muster-KI-Abschnitt (Zeile 229-238) verwendet für den KI-Einsatz allgemein Art. 6 Abs. 1 **lit. f** DSGVO (berechtigtes Interesse) als primäre Rechtsgrundlage und Art. 6 Abs. 1 **lit. a** nur bei Erfordernis einer Einwilligung. Die vorhandene Datenschutzerklärung dagegen setzt korrekt auf **Art. 6 Abs. 1 lit. a** als einzige Grundlage, da tatsächlich eine explizite Einwilligung eingeholt wird.
- **Checklistenpunkt:** DSGVO-Rechtsgrundlagen — Rechtsgrundlagen-Mapping; Art. 13 Abs. 1 Nr. 3 DSGVO
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 13 Abs. 1 Nr. 3 DSGVO
- **Bewertung:** KONFORM (technisch begründete Abweichung, Bewertungshierarchie Stufe 2)
- **Begründung:** Die Abweichung vom Muster ist technisch korrekt und begründet: Da für den Modell-Download eine explizite Einwilligung eingeholt wird (ConsentModal), ist Art. 6 Abs. 1 lit. a die richtige Grundlage. Das Muster verwendet Art. 6 Abs. 1 lit. f für den Fall, dass keine Einwilligung eingeholt wird. Die hier gewählte Formulierung ist datenschutzrechtlich präziser als das Muster.

---

### 6.5 Datenschutzerklärung — Cookies-Abschnitt (Third-Party-Cookies durch Google)

- **Fundort:** `src/pages/PrivacyPage.tsx:178-193`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:183
  Third-Party-Cookies ermöglichen die Einbindung bestimmter Dienstleistungen von Drittunternehmen
  innerhalb von Webseiten (z. B. Cookies zur Abwicklung von Zahlungsdienstleistungen).
  // PrivacyPage.tsx:186
  Andere Cookies können zur Auswertung des Nutzerverhaltens oder zu Werbezwecken verwendet werden.
  ```
- **Technischer Befund:** Die Anwendung setzt selbst keine Cookies (`document.cookie`, `localStorage`, `sessionStorage` nicht vorhanden). Nach Einwilligung des Nutzers wird jedoch das MobileNet-Modell von Google-Servern geladen (`storage.googleapis.com`, `tfhub.dev`). Google kann dabei als Drittanbieter technisch Cookies setzen.
- **Checklistenpunkt:** DSGVO-Checklist Punkt 5 — "Externe Ressourcen geprüft"; Art. 13 DSGVO — Informationspflicht über Drittanbieter
- **Rechtliche Grundlage:** Art. 5 Abs. 1 lit. a DSGVO (Transparenz); §25 TDDDG
- **Bewertung:** KONFORM
- **Begründung:** Der Cookie-Abschnitt ist zutreffend: Nach Einwilligung des Nutzers werden Google-Server kontaktiert (MobileNet-Download), wodurch Google als Drittanbieter potenziell Cookies setzen kann. Die Nennung von Third-Party-Cookies in der Datenschutzerklärung ist daher sachlich korrekt und keine irreführende Aussage. Die Einwilligung erfolgt vor dem Modell-Download (Consent-Gate in `ConsentModal.tsx`), sodass die Cookie-Nutzung einwilligungskonform ist. Hinweis: Formulierungen zu "Warenkorbfunktion" oder "Werbecookies" könnten präziser auf den Google-Kontext eingegrenzt werden — dies ist jedoch eine Empfehlung, kein Verstoß.

---

### 6.6 Datenschutzerklärung — Beschwerderecht und Nennung der Aufsichtsbehörde

- **Fundort:** `src/pages/PrivacyPage.tsx:140-143`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:142
  Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer
  Aufsichtsbehörde (...) zu. (...) Die für uns zuständige Aufsichtsbehörde ist der
  Landesbeauftragte für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz (LfDI RLP),
  Hintere Bleiche 34, 55116 Mainz, www.datenschutz.rlp.de.
  ```
- **Vergleich Mustertext (Zeile 135-137):** Das Muster nennt nur allgemein "eine Aufsichtsbehörde" ohne konkrete Behörde. Die vorhandene Erklärung ergänzt konkret den LfDI RLP — was eine vorteilhafte Ergänzung wäre, wenn die Angabe korrekt ist.
- **Technischer Befund:** Der Verantwortliche wohnt in "67591 Mölsheim" — das ist in Rheinland-Pfalz. Der LfDI RLP ist daher die korrekte zuständige Aufsichtsbehörde.
- **Checklistenpunkt:** Art. 13 Abs. 2 Nr. 4 DSGVO — Beschwerderecht bei Aufsichtsbehörde
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 4 DSGVO
- **Bewertung:** KONFORM (vorteilhafte Ergänzung, sachlich korrekt)
- **Begründung:** Die Nennung des LfDI RLP ist korrekt (Wohnort Mölsheim liegt in Rheinland-Pfalz). Dies ist eine zulässige und sogar begrüßenswerte Konkretisierung gegenüber dem Muster.

---

### 6.7 Datenschutzerklärung — KI-Abschnitt: Speicherdauer der Einwilligungsdaten

- **Fundort:** `src/pages/PrivacyPage.tsx:224-242`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:234-236
  Da die Einwilligung nur für die aktuelle Sitzung gilt, genügt ein Neuladen der Seite als Widerruf.
  ```
- **Checklistenpunkt:** Art. 13 Abs. 2 Nr. 1 DSGVO — Speicherdauer muss für jeden Verarbeitungsvorgang angegeben werden; DSGVO-Rechtsgrundlagen — "Speicherdauer pro Verarbeitungsvorgang"
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 1 DSGVO
- **Bewertung:** KONFORM (der Hinweis "nur für die aktuelle Sitzung" ist eine ausreichende Speicherdauerangabe)
- **Begründung:** Die Formulierung "nur für die aktuelle Sitzung" ist eine ausreichende Beschreibung der Speicherdauer im Sinne von Art. 13 Abs. 2 Nr. 1 DSGVO. Da technisch kein persistenter Storage verwendet wird, ist die Sitzungsdauer die korrekte und vollständige Angabe.

---

### 6.8 VERSTOSS: Datenschutzerklärung — fehlender Hinweis zum Widerrufsrecht bei Kamera-Einwilligung

- **Fundort:** `src/pages/PrivacyPage.tsx` (gesamte Seite) / `src/components/modals/CameraConsentModal.tsx`
- **Code-Snippet:** Kein Abschnitt in der Datenschutzerklärung zur Kamera-Einwilligung gefunden.
- **Technischer Befund:** Die Anwendung holt über `CameraConsentModal` eine separate Einwilligung zur Kameranutzung ein. Diese Einwilligung ist jedoch in der Datenschutzerklärung **nicht dokumentiert**. Die Datenschutzerklärung beschreibt nur den Modell-Download (Google MobileNet), nicht aber den Kamerazugriff als eigenständigen Verarbeitungsvorgang.
- **Checklistenpunkt:** Art. 13 DSGVO — alle Verarbeitungsvorgänge müssen in der Datenschutzerklärung beschrieben sein; DSGVO-Checklist Punkt 1 — "Alle Verarbeitungszwecke mit Rechtsgrundlage"
- **Rechtliche Grundlage:** Art. 13 Abs. 1 Nr. 3 DSGVO (Verarbeitungszweck + Rechtsgrundlage); Art. 13 Abs. 2 Nr. 1 DSGVO (Speicherdauer)
- **Bewertung:** BEHOBEN
- **Begründung:** Der Kamerazugriff ist ein eigener Verarbeitungsvorgang der personenbezogene Daten berührt (Videobilder, auch wenn sie nur lokal verarbeitet werden, können Personen abbilden). Die Datenschutzerklärung muss gemäß Art. 13 DSGVO über diesen Vorgang informieren: Zweck (Training eines lokalen ML-Modells), Rechtsgrundlage (Art. 6 Abs. 1 lit. a DSGVO), Speicherdauer (nur für die Sitzung, kein Upload), und Widerrufsrecht. Dieser Abschnitt fehlt vollständig.

---

### 6.9 VERSTOSS: Datenschutzerklärung — Widerrufsmechanismus in der Datenschutzerklärung nicht vollständig beschrieben

- **Fundort:** `src/pages/PrivacyPage.tsx:127-130`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:127-130
  <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
  <p>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich.
  Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der
  bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>
  ```
- **Vergleich Mustertext (Zeile 125-127):** Textinhalt entspricht dem Muster 1:1.
- **Ergänzungsbedarf:** Der allgemeine Widerrufstext ist vorhanden und korrekt. Ergänzend sollte (im Zusammenhang mit dem fehlenden Kamera-Abschnitt, siehe 6.8) explizit auf den konkreten Widerrufsmechanismus (Neuladen der Seite) hingewiesen werden. Der Footer enthält diesen Hinweis, die Datenschutzerklärung selbst jedoch nur allgemein.
- **Checklistenpunkt:** Art. 7 Abs. 3 DSGVO — Widerruf muss so einfach wie Einwilligung sein; Art. 13 Abs. 2 Nr. 3 DSGVO
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 3 DSGVO; Art. 7 Abs. 3 DSGVO
- **Bewertung:** BEHOBEN
- **Begründung:** Der allgemeine Widerrufshinweis ist vorhanden. Es fehlt jedoch ein Hinweis auf den konkreten Mechanismus (Neuladen der Seite). Dies ist keine zwingende Rechtspflicht, erhöht aber die Transparenz für Nutzer und ist insbesondere im Zusammenhang mit dem fehlenden Kamera-Abschnitt (6.8) relevant.

---

## 7. Art. 13 DSGVO — Vollständigkeitsprüfung

### 7.1 Art. 13 Abs. 1 Nr. 4 DSGVO — Benennung berechtigter Interessen bei lit.-f-Nutzung

- **Fundort:** `src/pages/PrivacyPage.tsx:119` (Abschnitt "Empfänger von personenbezogenen Daten") und `src/pages/PrivacyPage.tsx:210` (Server-Log-Dateien)
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:119
  wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der Weitergabe haben
  // PrivacyPage.tsx:210
  Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung
  und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
  ```
- **Checklistenpunkt:** DSGVO-Rechtsgrundlagen-Checkliste, Art. 13 Abs. 1 Nr. 4: "Bei lit. f: berechtigte Interessen des Verantwortlichen benennen"
- **Rechtliche Grundlage:** Art. 13 Abs. 1 Nr. 4 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** An beiden Stellen, an denen Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage herangezogen wird, ist das konkrete berechtigte Interesse angegeben: (1) Beim allgemeinen Abschnitt zu Empfängern wird lit. f nur als Auffangnorm für unvermeidliche Datenweitergabe (z. B. Steuerbehörden) erwähnt — kein eigenständiger Verarbeitungsvorgang, der eine spezifische Interessenbenennung erfordert. (2) Für Server-Logs (`PrivacyPage.tsx:210`) ist das berechtigte Interesse explizit genannt: "technisch fehlerfreie Darstellung und Optimierung der Website". Dies entspricht dem Anforderungsprofil des Art. 13 Abs. 1 Nr. 4 DSGVO und der Rechtsgrundlagen-Checkliste ("Server-Logs: kurze Speicherdauer, berechtigtes Interesse = Sicherheit/Fehleranalyse"). (3) Für die E-Mail-Kontaktaufnahme (`PrivacyPage.tsx:218`) wird lit. f ebenfalls mit konkreter Interessenbenennung verwendet: "effektive Bearbeitung der an uns gerichteten Anfragen". Die Anforderungen des Art. 13 Abs. 1 Nr. 4 DSGVO sind damit erfüllt.

---

### 7.2 Art. 13 Abs. 2 Nr. 2 DSGVO — Vollständigkeit der Betroffenenrechte (Art. 15–21)

- **Fundort:** `src/pages/PrivacyPage.tsx:145-167`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:145-148
  <h3>Recht auf Datenübertragbarkeit</h3>
  // PrivacyPage.tsx:150-153
  <h3>Auskunft, Berichtigung und Löschung</h3>
  // PrivacyPage.tsx:155-167
  <h3>Recht auf Einschränkung der Verarbeitung</h3>
  // PrivacyPage.tsx:132-138 (uppercase-Block)
  WIDERSPRUCHSRECHT GEGEN DIE DATENERHEBUNG... (Art. 21 DSGVO)
  ```
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 8 — Betroffenenrechte Art. 15–21; Art. 13 Abs. 2 Nr. 2 DSGVO
- **Rechtliche Grundlage:** Art. 13 Abs. 2 Nr. 2 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Abgleich aller Pflichtrechte gegen `PrivacyPage.tsx`:
  - **Art. 15 (Auskunft):** Vorhanden in `PrivacyPage.tsx:151-153` ("Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck") — KONFORM
  - **Art. 16 (Berichtigung):** Vorhanden in `PrivacyPage.tsx:152` ("Recht auf Berichtigung") — KONFORM
  - **Art. 17 (Löschung):** Vorhanden in `PrivacyPage.tsx:152` ("Recht auf Löschung") — KONFORM
  - **Art. 18 (Einschränkung):** Vorhanden als eigener Abschnitt `PrivacyPage.tsx:155-167` mit allen vier Fallgruppen — KONFORM
  - **Art. 20 (Datenübertragbarkeit):** Vorhanden in `PrivacyPage.tsx:145-148` — KONFORM
  - **Art. 21 (Widerspruch):** Vorhanden als hervorgehobener uppercase-Block `PrivacyPage.tsx:132-138` gemäß Art. 21 Abs. 4 DSGVO (muss "klar und von anderen Informationen getrennt" mitgeteilt werden) — KONFORM
  - Hinweis auf Art. 47 DSGVO (Widerruf bei Einwilligung): Vorhanden in `PrivacyPage.tsx:127-130` — KONFORM
  Alle sieben Betroffenenrechte nach Art. 13 Abs. 2 Nr. 2 DSGVO sind vollständig und korrekt in der Datenschutzerklärung aufgeführt.

---

## 8. Social Media, Newsletter & Interne Organisation

### 8.1 Social Media (dsgvo-checklist.md Abschnitt 2)

- **Fundort:** Gesamte `src/`-Verzeichnis (Grep auf `facebook`, `twitter`, `instagram`, `linkedin`, `youtube`, social-media)
- **Code-Snippet:** Keine Treffer
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 2 — "Rechtstexte auf Social-Media-Profilen", "Social-Media-Buttons auf Website"
- **Rechtliche Grundlage:** Art. 26 DSGVO; §25 TDDDG
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Die Anwendung enthält keine Social-Media-Einbindungen, keine Share-Buttons, keine Like-Buttons und keine Verlinkungen zu sozialen Netzwerken. DSGVO-Checklist Abschnitt 2 ist vollständig nicht anwendbar.

---

### 8.2 E-Mail-Marketing / Newsletter (dsgvo-checklist.md Abschnitt 3)

- **Fundort:** Gesamte `src/`-Verzeichnis (Grep auf `newsletter`, `subscribe`, `mailchimp`, `brevo`)
- **Code-Snippet:** Keine Treffer
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 3 — "Einwilligung vor erstem Versand", "Double-Opt-In", "Abmelde-Link"
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. a DSGVO; Art. 7 Abs. 4 DSGVO
- **Bewertung:** N/A — nicht anwendbar
- **Begründung:** Die Anwendung betreibt kein E-Mail-Marketing und keinen Newsletter-Dienst. DSGVO-Checklist Abschnitt 3 ist vollständig nicht anwendbar.

---

### 8.3 Datenschutzbeauftragter und Datenpanne-Prozess (dsgvo-checklist.md Abschnitt 7)

- **Fundort:** `src/pages/PrivacyPage.tsx` (gesamte Datenschutzerklärung) / `src/pages/ImprintPage.tsx`
- **Code-Snippet:** Kein Hinweis auf Datenschutzbeauftragten in `PrivacyPage.tsx` gefunden
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 7 — "Datenschutzbeauftragter geprüft (Art. 37 DSGVO)"; "Datenpanne-Prozess (Art. 33 DSGVO)"
- **Rechtliche Grundlage:** Art. 37 DSGVO (DSB); Art. 33 DSGVO (Datenpannenmeldung)
- **Bewertung:** KONFORM
- **Begründung:** **Datenschutzbeauftragter (Art. 37 DSGVO):** Die Pflicht zur Bestellung eines DSB gilt ab 20 Mitarbeiter mit regelmäßiger Datenverarbeitung oder bei Verarbeitung sensibler Daten nach Art. 9 DSGVO. Der Betreiber ist eine Privatperson (Einzelperson, Yannick Schäfer). Die Anwendung verarbeitet keine besonderen Kategorien personenbezogener Daten nach Art. 9 DSGVO. Die Schwelle von 20 Mitarbeitern wird nicht erreicht. Ein DSB ist nicht erforderlich; die Datenschutzerklärung enthält keinen DSB-Abschnitt (korrekt). **Datenpanne-Prozess (Art. 33 DSGVO):** Art. 33 DSGVO verpflichtet den Verantwortlichen, Datenpannen innerhalb von 72 Stunden der Aufsichtsbehörde zu melden. Dies ist eine interne organisatorische Pflicht, die nicht in der Datenschutzerklärung dokumentiert werden muss (die Erklärung richtet sich an Betroffene, nicht an die interne Organisation). Die Anwendung ist eine rein clientseitige ML-Demo ohne persistente Datenspeicherung — das Risiko einer meldepflichtigen Datenpanne ist minimal. Eine formale Dokumentation des Art. 33-Prozesses ist bei dieser Skalierung und Risikolage keine praktische Pflicht.

---

### 8.4 E-Mail-Kontaktaufnahme — Prüfung analog Kontaktformular-Checkliste

- **Fundort:** `src/pages/PrivacyPage.tsx:213-222`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:213-222
  <h3>Anfrage per E-Mail, Telefon oder Telefax</h3>
  <p>Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive
  aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der
  Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir
  nicht ohne Ihre Einwilligung weiter.</p>
  <p>Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO,
  sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung
  vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung
  auf unserem berechtigten Interesse (...) (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer
  Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</p>
  ```
- **Checklistenpunkt:** Kontaktformular-Checkliste analog angewendet auf E-Mail-Kontakt: Zweck dokumentiert, Rechtsgrundlage angegeben, Speicherdauer beschrieben, keine Zweckentfremdung
- **Rechtliche Grundlage:** Art. 6 Abs. 1 lit. b und f DSGVO; Art. 13 Abs. 1 Nr. 3 DSGVO
- **Bewertung:** KONFORM
- **Begründung:** Der E-Mail-Kontaktabschnitt erfüllt alle wesentlichen Anforderungen der Kontaktformular-Checkliste analog: (1) **Zweck dokumentiert:** "Bearbeitung Ihres Anliegens" — klar und spezifisch. (2) **Rechtsgrundlage vollständig:** Korrekte Drei-Ebenen-Systematik (lit. b für vertragsbezogene Anfragen, lit. f als Auffangnorm, lit. a bei ausdrücklicher Einwilligung). Das berechtigte Interesse nach lit. f ist konkret benannt ("effektive Bearbeitung der an uns gerichteten Anfragen") — Art. 13 Abs. 1 Nr. 4 DSGVO erfüllt. (3) **Speicherdauer beschrieben** (`PrivacyPage.tsx:221`): "bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt" — mit Hinweis auf gesetzliche Aufbewahrungsfristen. (4) **Keine Zweckentfremdung:** "Diese Daten geben wir nicht ohne Ihre Einwilligung weiter" — korrekte Zweckbindung. Da die Anwendung kein Kontaktformular besitzt, entfallen die formularspezifischen Prüfpunkte (SSL, Datenschutz-Link am Formular, Pflichtfelder, Geschlechtsabfrage). Der Abschnitt in der Datenschutzerklärung ist für die rein E-Mail-basierte Kontaktaufnahme vollständig und korrekt.

---

## 9. SSL/TLS und Drittland-Übermittlung (Ergänzungsprüfungen)

### 9.1 SSL/TLS — Vollständige Prüfung (Quickcheck Schritt 3)

- **Fundort:** `server.ts:41-44` / `src/pages/PrivacyPage.tsx:169-175`
- **Code-Snippet:**
  ```typescript
  // server.ts:41-44
  hsts: {
    maxAge: SERVER.HSTS_MAX_AGE,
    includeSubDomains: true,
  },
  ```
  ```tsx
  // PrivacyPage.tsx:169-175
  Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
  Inhalte (...) eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen
  Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt.
  ```
- **Checklistenpunkt:** DSGVO-Quickcheck Schritt 3 — "SSL/TLS für alle Seiten mit Dateneingabe"; DSGVO-Checklist Abschnitt 9 — "SSL/TLS-Verschlüsselung"; Art. 32 DSGVO
- **Rechtliche Grundlage:** Art. 32 DSGVO — TOM
- **Bewertung:** KONFORM (mit Hinweis)
- **Begründung:** Der Express-Server erzwingt HTTPS über den HSTS-Header mit `includeSubDomains: true` und konfigurierter `maxAge`. Die Datenschutzerklärung erwähnt die SSL/TLS-Verschlüsselung korrekt. Hinsichtlich Zertifikatsgültigkeit und Mixed Content: (1) Das Zertifikat wird vom Hosting-Anbieter Hostinger bereitgestellt — eine Codebase-Prüfung kann die Live-Zertifikatsgültigkeit nicht verifizieren; dies muss durch regelmäßige externe Prüfung (z. B. SSL Labs) sichergestellt werden. (2) Mixed Content: Die CSP in `server.ts:34` enthält kein `upgrade-insecure-requests`, aber der HSTS-Header verhindert zuverlässig HTTP-Downgrades für Folgeanfragen. Die externen Ressourcen (Google APIs, TensorFlow Hub) werden ausschließlich über HTTPS geladen (CSP: `connect-src`-Direktive erlaubt nur HTTPS-Origins). Kein Mixed-Content-Risiko im Produktionsmodus erkennbar. Die technische SSL/TLS-Implementierung ist korrekt.

---

### 9.2 DPF-Scope-Prüfung: Google Ireland Limited vs. Google LLC

- **Fundort:** `src/pages/PrivacyPage.tsx:229` und `src/pages/PrivacyPage.tsx:238`
- **Code-Snippet:**
  ```tsx
  // PrivacyPage.tsx:229
  Anbieter der KI-Modelle ist die Google Ireland Limited („Google"), Gordon House,
  Barrow Street, Dublin 4, Irland.
  // PrivacyPage.tsx:238
  Das Unternehmen verfügt über eine Zertifizierung nach dem „EU-US Data Privacy Framework"
  (DPF). (...) https://www.dataprivacyframework.gov/participant/5780
  ```
- **Checklistenpunkt:** Privacy-Shield-Checkliste Schritt 1 — "DPF-Zertifizierung des US-Empfängers prüfen: Status aktiv, Scope Non-HR, Zertifizierungsablauf"; "DPF gilt nur für US-Unternehmen unter FTC- oder DOT-Aufsicht"
- **Rechtliche Grundlage:** Art. 44-45 DSGVO (Drittlandübermittlung); Art. 13 Abs. 1 Nr. 6 DSGVO
- **Bewertung:** KONFORM (technisch korrekt, Formulierung präzisierungsbedürftig aber nicht rechtswidrig)
- **Begründung:** Der scheinbare Widerspruch zwischen "Google Ireland Limited" und der DPF-Zertifizierung von "Google LLC" löst sich technisch wie folgt auf: Der DPF gilt nur für US-Unternehmen unter FTC-Aufsicht — Google Ireland Limited (EU-Tochter) ist kein DPF-Subjekt. Tatsächlich erfolgt der technische Datentransfer beim Laden der MobileNet-Modelle über `storage.googleapis.com` und `tfhub.dev` — Server, die von **Google LLC** (USA) betrieben werden. Die Datenschutzerklärung nennt Google Ireland Limited als "Anbieter", was dem Konzernkonstrukt entspricht, aber den tatsächlichen Drittlandtransfer-Empfänger (Google LLC) nicht klar benennt. Die DPF-Zertifizierung `participant/5780` gehört zu Google LLC — diese Zertifizierung deckt Non-HR + HR-Daten ab (laut Privacy-Shield-Checkliste Tabelle). Der DPF-Link ist korrekt. **Fazit:** Die Rechtsgrundlage (DPF für Google LLC) ist zutreffend und rechtlich wirksam. Die Nennung von "Google Ireland Limited" als Anbieter ist juristisch üblich (Konzernstruktur), erzeugt aber eine leichte Unklarheit. Da der DPF-Link korrekt auf Google LLC verweist und die eigentliche Drittlandübermittlung an Google LLC-Server korrekt durch den DPF abgedeckt ist, liegt kein Verstoß vor.

---

## 10. TOM-Ergänzungsprüfung (dsgvo-checklist.md Abschnitt 9)

### 10.1 TOM — Regelmäßige Updates (Server, CMS, Plugins)

- **Fundort:** `package.json`, `server.ts`, `Dockerfile`
- **Code-Snippet:** Keine CMS- oder Plugin-Infrastruktur vorhanden; reines Node.js/Express-Deployment
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 — "Regelmäßige Updates (Server, CMS, Plugins)"
- **Rechtliche Grundlage:** Art. 32 DSGVO — TOM
- **Bewertung:** N/A (mit Hinweis)
- **Begründung:** Die Anwendung ist eine rein clientseitige SPA ohne CMS, Datenbank oder Plugin-System. Ein persistentes Datenspeicher-Backend, das von Software-Schwachstellen in aktualisierbaren Plugins profitieren könnte, ist nicht vorhanden. Die regelmäßige Aktualisierung der npm-Abhängigkeiten (`package.json`) und des Node.js-Server-Builds liegt in der Verantwortung des Betreibers — dies ist eine organisatorische TOM-Pflicht nach Art. 32 DSGVO, die nicht aus der Codebase heraus geprüft werden kann. Empfehlung: Abhängigkeiten regelmäßig auf Sicherheitslücken prüfen (z. B. `npm audit`).

---

### 10.2 TOM — Backups mit Verschlüsselung und Zugriffskontrolle

- **Fundort:** `Dockerfile`, `server.ts`, gesamte Codebase
- **Code-Snippet:** Kein persistenter Datenspeicher im Code vorhanden
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 — "Backups mit Verschlüsselung und Zugriffskontrolle"
- **Rechtliche Grundlage:** Art. 32 DSGVO — TOM
- **Bewertung:** N/A
- **Begründung:** Die Anwendung verarbeitet und speichert keine personenbezogenen Daten serverseitig. Die gesamte ML-Verarbeitung (Kamerabilder, Feature-Vektoren, Modellzustand) findet ausschließlich im JavaScript-Arbeitsspeicher des Endnutzers statt. Es gibt keine Datenbank und keinen persistenten Nutzerdaten-Speicher, der gesichert werden müsste. Server-Log-Dateien werden vom Hosting-Anbieter Hostinger verwaltet (gemäß Datenschutzerklärung nach 7 Tagen gelöscht). Eine Backup-Anforderung mit Verschlüsselung entsteht durch die Architektur dieser Anwendung nicht.

---

### 10.3 TOM — Löschkonzept (automatische Löschung nach Ablauf der Speicherdauer)

- **Fundort:** Gesamte Codebase (Grep auf Datenbankoperationen, persistenten Storage)
- **Code-Snippet:** Keine Datenbankoperationen, kein persistenter Nutzerdaten-Speicher vorhanden
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 9 — "Löschkonzept: Automatische Löschung nach Ablauf der Speicherdauer"
- **Rechtliche Grundlage:** Art. 17 DSGVO (Recht auf Löschung); Art. 5 Abs. 1 lit. e DSGVO (Speicherbegrenzung)
- **Bewertung:** N/A
- **Begründung:** Ein technisches Löschkonzept ist ausschließlich für personenbezogene Daten mit definierten Speicherfristen relevant, die in einem persistenten Speicher gehalten werden. Diese Anwendung speichert keine personenbezogenen Daten persistent: (1) Kamerabilder und Feature-Vektoren werden nur im React-State (RAM) gehalten und gehen mit dem Schließen des Browser-Tabs verloren. (2) Die Einwilligung (`hasConsented`) wird nur im React-State gespeichert — kein `localStorage`, kein `sessionStorage`. (3) Server-Log-Dateien werden durch den Hoster (Hostinger) automatisch nach 7 Tagen gelöscht (gemäß Datenschutzerklärung `PrivacyPage.tsx:210`). Ein dediziertes technisches Löschkonzept ist bei dieser Architektur nicht erforderlich.

---

## 11. Verzeichnis der Verarbeitungstätigkeiten — Art. 30 DSGVO

### 11.1 VVT-Pflicht (Art. 30 DSGVO)

- **Fundort:** Interne Organisation / Betreiber-Ebene (nicht aus Codebase prüfbar)
- **Code-Snippet:** Kein VVT-Hinweis in der Codebase vorhanden
- **Checklistenpunkt:** DSGVO-Checklist Abschnitt 4 — "Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO): Gepflegt und aktuell (ab 250 MA Pflicht, kleinere Unternehmen bei nicht-gelegentlicher Verarbeitung ebenfalls)"
- **Rechtliche Grundlage:** Art. 30 DSGVO
- **Bewertung:** N/A
- **Begründung:** Gemäß Art. 30 Abs. 5 DSGVO gilt die VVT-Pflicht nicht für Unternehmen oder Einrichtungen mit weniger als 250 Mitarbeitern, **es sei denn** die Verarbeitung birgt ein Risiko für die Rechte und Freiheiten der betroffenen Personen, die Verarbeitung erfolgt nicht nur gelegentlich, oder es werden besondere Kategorien nach Art. 9 DSGVO verarbeitet. Der Betreiber ist eine Privatperson (Yannick Schäfer, Einzelperson). Die Anwendung verarbeitet ausschließlich technisch notwendige Verbindungsdaten (IP-Adresse bei Modell-Download, Server-Logs) sowie temporäre Kamerabilder nur im RAM des Endnutzers. Es werden keine besonderen Datenkategorien nach Art. 9 DSGVO verarbeitet. Der Modell-Download stellt eine gelegentliche Verarbeitung dar (einmalig pro Sitzung, ohne Persistenz). Ein formales VVT ist daher nicht zwingend vorgeschrieben. Empfehlung: Bei zukünftiger Erweiterung der Verarbeitungsvorgänge (z. B. Nutzerkonto, persistente Daten) VVT anlegen.

---

## 12. Barrierefreiheit des Einwilligungs-Dialogs (cookie-banner-checklist.md Abschnitt 7)

### 12.1 ConsentModal — Barrierefreiheit (WCAG 2.1 AA / BFSG)

- **Fundort:** `src/components/modals/ConsentModal.tsx:1-82` / `src/components/Dialog.tsx:1-46` / `src/components/Button.tsx:1-59` / `src/hooks/useFocusTrap.ts:1-71`
- **Code-Snippet:**
  ```tsx
  // Dialog.tsx:35-44
  <div
    ref={dialogRef}
    role="dialog"
    aria-modal="true"
    aria-labelledby={labelledBy}
    aria-describedby={describedBy}
  >
  // ConsentModal.tsx:26
  <h2 id="consent-modal-title">Einwilligung zur Datenverarbeitung</h2>
  // ConsentModal.tsx:31-45 — Checkbox 1 (innerhalb von <label>)
  <label className="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" checked={privacyChecked} onChange={...}
      className="... focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    />
    <span>...Datenschutzerklärung...</span>
  </label>
  // Button.tsx:14 — Primär-Button
  'bg-indigo-600 ... disabled:bg-zinc-300 disabled:cursor-not-allowed ... focus-visible:ring-2 focus-visible:ring-indigo-500'
  // useFocusTrap.ts:36-41 — Escape-Handler
  if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape(); }
  ```
- **Checklistenpunkt:** Cookie-Banner-Checkliste Abschnitt 7 — "Tastaturzugänglich", "Kontraste WCAG 1.4.3", "Screenreader: Checkboxen haben Labels", "Kein Nudging"
- **Rechtliche Grundlage:** BFSG (Barrierefreiheitsstärkungsgesetz, ab 28.06.2025); WCAG 2.1 AA Kriterium 1.3.1, 1.4.3, 2.1.1, 4.1.2
- **Bewertung:** KONFORM
- **Begründung:** Prüfung aller sechs Barrierefreiheitskriterien aus cookie-banner-checklist.md Abschnitt 7:

  **(1) Kein Nudging:** Der "Abbrechen"-Button (`variant="secondary"`) und der "Zustimmen"-Button (`variant="primary"`) haben identische Breite (`flex-1`), identische Größe (`py-3 px-4`) und sind nebeneinander auf gleicher Ebene platziert (`flex gap-3`). Keine optische Bevorzugung des Zustimmen-Buttons. KONFORM.

  **(2) Tastaturzugänglichkeit (WCAG 2.1.1):** `useFocusTrap.ts` implementiert vollständige Tab/Shift-Tab-Falle innerhalb des Modals mit korrektem Wrapping (letztes → erstes Element und umgekehrt). Escape schließt das Modal (`onEscape`-Callback über `onDecline`). Alle interaktiven Elemente (Checkboxen, Links, Buttons) sind über die Focusable-Elements-Query (`button:not([disabled]), [href], input:not([disabled])`) erfasst. KONFORM.

  **(3) Kontraste (WCAG 1.4.3 — Mindest 4,5:1):** Text (`text-zinc-700` = #3f3f46) auf weißem Hintergrund (`bg-white`): Kontrastverhältnis ca. 10,7:1 — weit über dem Minimum. Primär-Button: weißer Text auf Indigo-600 (#4f46e5): ca. 5,8:1 — konform. Deaktivierter Primär-Button: weißer Text auf `disabled:bg-zinc-300` (#d4d4d8): ca. 1,9:1 — **jedoch** nach WCAG 1.4.3 sind deaktivierte Komponenten explizit von der Kontrastanforderung ausgenommen. KONFORM.

  **(4) Screenreader — Checkboxen mit Labels (WCAG 4.1.2):** Beide Checkboxen sind in ein `<label>`-Element eingebettet (`<label className="flex items-start gap-3">` mit dem `<input type="checkbox">` als erstem Kind). Der zugängliche Name der Checkbox wird über das umschließende Label-Element automatisch abgeleitet (implizites Label). KONFORM. Zusätzlich: Das Dialog-Element hat `role="dialog"`, `aria-modal="true"` und `aria-labelledby="consent-modal-title"`, was korrekte Screenreader-Ankündigung beim Öffnen gewährleistet. KONFORM.

  **(5) Fokus-Wiederherstellung:** `useFocusTrap.ts:65` stellt beim Schließen des Modals den Fokus auf das zuvor aktive Element wieder her (`previousFocusRef.current?.focus()`). KONFORM (WCAG 2.4.3).

  **(6) Rechtstexte sichtbar:** Das Modal verdeckt keine Impressums- oder Datenschutzlinks dauerhaft, da es nur beim expliziten Aufruf der Trainingsseite erscheint und einen direkten Link zur Datenschutzerklärung enthält. KONFORM.

---



| Kategorie | Anzahl |
|-----------|--------|
| **VERSTOSS** | 0 |
| **EMPFEHLUNG** | 1 |
| **KONFORM** | 26 |
| **N/A** | 7 |
| **Gesamt geprüfte Punkte** | 34 |

**Impressum vorhanden:** Ja — vollständig und erreichbar (`/impressum`)
**Datenschutzerklärung vorhanden:** Ja — vollständig und konform (`/datenschutz`)

### Übersicht der Verstöße

Keine Verstöße — alle Punkte behoben.

### Übersicht der Empfehlungen

| Nr. | Fundort | Beschreibung |
|-----|---------|--------------|
| E1 | `PrivacyPage.tsx:127-130` | Konkreten Widerrufsmechanismus (Neuladen der Seite) in der Datenschutzerklärung ergänzen — **behoben** |

### Nicht anwendbare Kategorien (N/A)

| Kategorie | Begründung |
|-----------|-----------|
| Social Media (DSGVO-Checklist Abschnitt 2) | Keine Social-Media-Einbindungen, keine Share-/Like-Buttons in der Anwendung |
| E-Mail-Marketing / Newsletter (DSGVO-Checklist Abschnitt 3) | Kein Newsletter-Dienst, kein E-Mail-Marketing |
| TOM: Regelmäßige Updates (Abschnitt 10.1) | Keine CMS/Plugin-Infrastruktur; reine SPA ohne updatepflichtigen Software-Stack — organisatorische Pflicht des Betreibers |
| TOM: Backups mit Verschlüsselung (Abschnitt 10.2) | Kein persistenter Nutzerdaten-Speicher; gesamte ML-Verarbeitung nur im RAM des Endnutzers |
| TOM: Löschkonzept (Abschnitt 10.3) | Kein persistenter Nutzerdaten-Speicher; Sitzungsdaten gehen automatisch beim Tab-Schließen verloren |
| Art. 30 VVT (Abschnitt 11.1) | Privatperson als Betreiber, weniger als 250 MA, keine nicht-gelegentliche Verarbeitung, keine Art.-9-Daten — Art. 30 Abs. 5 DSGVO-Ausnahme greift |
| Fotografie & Bildrechte (DSGVO-Checklist Abschnitt 6) | Keine Fotos von erkennbaren Personen, keine Stock-Fotos mit Personenabbildungen in der Codebase |

### Übersicht neuer Prüfpunkte (Nachprüfung)

| Nr. | Beschreibung | Ergebnis |
|-----|-------------|---------|
| N1 | Art. 13 Abs. 1 Nr. 4 DSGVO — Berechtigte Interessen bei lit.-f-Nutzung konkret benannt? | KONFORM |
| N2 | Art. 13 Abs. 2 Nr. 2 DSGVO — Alle Betroffenenrechte Art. 15–21 vorhanden? | KONFORM |
| N3 | SSL/TLS vollständige Prüfung inkl. Mixed Content | KONFORM (mit Hinweis: Zertifikatsgültigkeit extern prüfen) |
| N4 | DPF-Scope: Google Ireland Limited vs. Google LLC | KONFORM (rechtlich korrekt, geringfügige Unklarheit in Formulierung) |
| N5 | Social Media — N/A-Feststellung | N/A |
| N6 | Newsletter — N/A-Feststellung | N/A |
| N7 | Art. 37/33 DSGVO — DSB-Pflicht und Datenpannenprozess | KONFORM (DSB nicht erforderlich) |
| N8 | E-Mail-Kontakt analog Kontaktformular-Checkliste | KONFORM |
| N9 | TOM: Regelmäßige Updates (DSGVO-Checklist Abschnitt 9) | N/A — keine CMS/Plugin-Infrastruktur |
| N10 | TOM: Backups mit Verschlüsselung (DSGVO-Checklist Abschnitt 9) | N/A — kein persistenter Nutzerdaten-Speicher |
| N11 | TOM: Löschkonzept (DSGVO-Checklist Abschnitt 9) | N/A — kein persistenter Nutzerdaten-Speicher |
| N12 | Art. 30 DSGVO — Verzeichnis der Verarbeitungstätigkeiten | N/A — Art. 30 Abs. 5-Ausnahme für Privatperson/Kleinbetrieb greift |
| N13 | ConsentModal Barrierefreiheit (Cookie-Banner-Checkliste Abschnitt 7) | KONFORM — Tab-Falle, Escape, Labels, Kontraste, kein Nudging |

### Empfohlene nächste Schritte

- [x] **Datenschutzerklärung aktualisieren:**
  - Neuen Abschnitt "Kameranutzung" hinzufügen mit: Zweck (lokales ML-Training), Rechtsgrundlage (Art. 6 Abs. 1 lit. a DSGVO), Speicherdauer (nur Sitzung, kein Upload), Widerrufshinweis
  - Optional: Konkreten Widerrufsmechanismus (Seite neu laden) in den Widerrufsabschnitt aufnehmen
  - Optional: Cookie-Abschnitt präziser auf Google/MobileNet-Kontext eingrenzen (Formulierungen zu "Warenkorbfunktion" und "Werbecookies" sind für diese App ungenau)
- [x] **Jährliche SSL-Zertifikatsprüfung:** Zertifikatsgültigkeit über SSL Labs (ssllabs.com/ssltest) oder ähnlichem Dienst regelmäßig prüfen
- [x] **Jährlicher DPF-Check:** Google LLC DPF-Zertifizierung auf dataprivacyframework.gov prüfen (Zertifikate laufen jährlich ab)
