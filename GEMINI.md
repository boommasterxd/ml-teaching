# Gemini Projekt-spezifische Anweisungen: The Teachable Machine

Dieses Dokument enthält spezifische Anweisungen und Richtlinien für die Arbeit am Projekt "The Teachable Machine". Diese Regeln ergänzen oder überschreiben die globalen Anweisungen in der globalen `GEMINI.md`.

## 1. Projektübersicht

- **Projektname:** The Teachable Machine
- **Ziel:** Die Erstellung einer interaktiven Webanwendung, die ein Machine-Learning-Modell (Tensorflow.js) nutzt, um Benutzereingaben (Bilder, Posen, etc.) in Echtzeit zu klassifizieren und zu visualisieren.
- **Kernfunktionalität:** Die Anwendung soll eine intuitive Benutzeroberfläche bieten, um die Fähigkeiten des trainierten Modells zu demonstrieren. Ein besonderer Fokus liegt auf ansprechenden Animationen und einer klaren Benutzerführung.

## 2. Technische Vorgaben

- **Sprachen:** HTML, CSS, JavaScript (ES6+)
- **Bibliotheken:**
    - **Icons:** Font Awesome 6.7.2 (bereits im Projekt unter `src/fontawesome-free-6.7.2-web/` vorhanden).
    - **Machine Learning:** Anbindung an ein Tensorflow.js Modell..
- **Abhängigkeiten:** Alle Abhängigkeiten (wie Fonts und Icons) werden lokal verwaltet. Es sollen keine externen CDNs verwendet werden, um die Offline-Fähigkeit zu gewährleisten.

## 3. Design- und Stilrichtlinien

Das Design soll modern, sauber und zugänglich sein.

- **Schriftart:**
    - Die primäre Schriftart ist **Poppins**. Sie ist im Verzeichnis `src/fonts/` verfügbar und über `src/fonts/poppins.css` eingebunden.
    - **Fließtext:** `Poppins-Regular`
    - **Überschriften:** `Poppins-Bold` oder `Poppins-SemiBold`
    - **Hervorhebungen:** `Poppins-Medium`

- **Design Tokens (CSS Variablen):**
    - Diese Variablen sollen in `:root` in `style.css` definiert und im gesamten Projekt konsistent verwendet werden.
    - **Farben:**
        - `--primary-color: #D51317;` (Hauptfarbe für Branding, wichtige Aktionen)
        - `--primary-color-dark: #a10f12;` (Dunklere Variante für Hover-Effekte etc.)
        - `--success-color: #28a745;` (Für Erfolgsmeldungen)
        - `--danger-color: #dc3545;` (Für Fehlermeldungen und Warnungen)
        - `--background-light: #f4f7fc;` (Hintergrund der Seite)
        - `--card-background: #ffffff;` (Hintergrund für Karten und Container)
        - `--text-color: #333333;` (Standard-Textfarbe)
        - `--text-color-light: #666666;` (Für sekundären Text)
        - `--border-color: #e0e0e0;` (Für Ränder und Trennlinien)
    - **Layout & Stil:**
        - `--shadow: 0 4px 15px rgba(0, 0, 0, 0.08);` (Einheitlicher Schatten für Karten)
        - `--border-radius: 12px;` (Standard-Radius für abgerundete Ecken)
    - **Abstände (Spacing System):**
        - `--space-unit: 0.5rem;`
        - `--space-sm: var(--space-unit);` (8px)
        - `--space-md: calc(var(--space-unit) * 2);` (16px)
        - `--space-lg: calc(var(--space-unit) * 3);` (24px)
        - `--space-xl: calc(var(--space-unit) * 4);` (32px)
        - `--space-xxl: calc(var(--space-unit) * 6);` (48px)

- **Layout:**
    - Das Layout soll **responsive** sein und auf verschiedenen Bildschirmgrößen gut funktionieren.
    - CSS Flexbox und Grid sind für die Strukturierung der Hauptkomponenten zu bevorzugen.
    - Sorgen Sie für großzügige Abstände (padding, margin), um eine überladene Optik zu vermeiden.

- **Animationen:**
    - Animationen sind ein zentrales Element und in `src/animation.css` sowie `src/animation.js` definiert.
    - Sie sollen **zweckgerichtet** sein, um den Benutzerfluss zu unterstützen und Feedback zu geben (z.B. bei Ladevorgängen oder Klassifizierungsergebnissen).
    - Animationen müssen flüssig sein (z.B. durch Verwendung von `transform` und `opacity`).

- **Icons:**
    - Verwenden Sie ausschließlich Icons aus der bereitgestellten Font Awesome Bibliothek.
    - Die Einbindung erfolgt über die CSS-Klassen (z.B. `<i class="fa-solid fa-camera"></i>`).

## 4. Code-Konventionen

- **HTML:** Schreiben Sie semantisches HTML5. Verwenden Sie `main`, `section`, `article`, `nav` etc. korrekt.
- **CSS:**
    - Halten Sie sich an die Struktur in `src/style.css`.
    - Verwenden Sie klare und beschreibende Klassennamen. Eine BEM-ähnliche Namenskonvention (z.B. `.card__title--highlighted`) wird empfohlen, um die Lesbarkeit zu erhöhen.
- **JavaScript:**
    - Schreiben Sie modernen ES6+ Code.
    - Strukturieren Sie den Code in `src/script.js` logisch. Bei wachsender Komplexität sollte eine Aufteilung in Module in Betracht gezogen werden.
- **Dokumentation und Kommentare:**
    - Für den gesamten Code ist eine **ausführliche englische Dokumentation** zu erstellen (z.B. JSDoc für JavaScript-Funktionen).
    - Kommentare sollen das **Warum** hinter einer Implementierung erklären, nicht das **Was**. Unnötige Kommentare, die selbsterklärenden Code beschreiben, sind zu vermeiden.

## 5. Projektstruktur

Die bestehende Projektstruktur soll beibehalten werden:

- `src/`: Enthält alle Quellcode-Dateien der Anwendung.
    - `src/index.html`: Der Haupteinstiegspunkt der Anwendung.
    - `src/diy.html`: Vermutlich eine separate Seite für benutzerdefinierte Interaktionen.
    - `src/style.css`: Globale Stile.
    - `src/script.js`: Globale Anwendungslogik.
    - `src/animation.*`: Spezifische Dateien für Animationen des neuronalen Netzwerkes.
    - `src/images/`: Bild-Assets.
    - `src/fonts/`: Schriftart-Dateien.
    - `src/fontawesome-free-6.7.2-web/`: Font Awesome Bibliothek.
- `*.md`: Dokumentationsdateien (README, Todo, etc.).
- `LICENSE.txt`: Lizenzinformationen.
