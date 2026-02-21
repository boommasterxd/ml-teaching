# 🧠 The Teachable Machine

## Entdecke die Magie des Lernens!

Willkommen bei **The Teachable Machine** – einem interaktiven Webprojekt, das dir auf spielerische Weise die Grundlagen des maschinellen Lernens näherbringt. Dieses Projekt ist stark angelehnt an [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/). Erlebe, wie einfach es sein kann, einer Maschine beizubringen, Muster zu erkennen und Entscheidungen zu treffen, ganz ohne komplizierten Code!

## 📖 Was die App macht

The Teachable Machine besteht aus zwei Seiten:

**1. Startseite / Erklärungsseite (`index.html`)**
Die Startseite erklärt Neueinsteigern, wie maschinelles Lernen funktioniert. Sie enthält:
- Eine kurze Einführung, was die App ist und wofür sie gedacht ist.
- Eine Schritt-für-Schritt-Anleitung (Daten sammeln → Modell trainieren → Ausprobieren).
- Eine interaktive, animierte Visualisierung eines neuronalen Netzes: Nutzer können per Klick auf „Hund" oder „Katze" verfolgen, wie ein Signal durch die Schichten (Input → Hidden → Output) fließt.
- Eine erklärende Box, die die einzelnen Layer des neuronalen Netzes beschreibt.
- Einen Call-to-Action-Button, der direkt zur interaktiven Trainingsseite führt.

**2. Trainingsseite / DIY-Seite (`diy.html`)**
Hier findet der eigentliche Machine-Learning-Workflow statt – vollständig im Browser:
- **Daten sammeln:** Nutzer legen beliebig viele Klassen an (z.B. „Meine Hand", „Kaffeetasse") und nehmen per Webcam Trainingsbilder auf. Einzelne Bilder können durch Antippen vergrößert und gelöscht werden.
- **Modell trainieren:** Mit einem Klick auf „Modell trainieren" wird ein KNN-Klassifikator auf den aufgenommenen Bildern trainiert. Ein Fortschrittsbalken gibt visuelles Feedback.
- **Echtzeit-Vorhersage:** Nach dem Training zeigt die Kamera in Echtzeit an, welche Klasse die KI erkennt – inklusive Wahrscheinlichkeitsbalken für jede Klasse.
- **Kamera wechseln:** Auf Geräten mit mehreren Kameras (z.B. Smartphones) kann mit einem Button zwischen Front- und Rückkamera umgeschaltet werden.
- **Datenschutz:** Alle Bild- und Modelldaten bleiben ausschließlich auf dem Gerät des Nutzers – es werden keinerlei Daten an externe Server übertragen.

## ✨ Features

*   **Interaktives Lernen:** Trainiere deine eigene "Maschine" direkt im Browser.
*   **Visuelle Rückmeldung:** Sieh sofort, wie deine Maschine lernt und sich anpasst.
*   **Einfache Bedienung:** Keine Vorkenntnisse in KI oder Programmierung erforderlich.
*   **Ansprechendes Design:** Eine intuitive und moderne Benutzeroberfläche.
*   **Animiertes neuronales Netz:** Interaktive Visualisierung eines neuronalen Netzes auf der Startseite.
*   **Mehrere Klassen:** Beliebig viele Erkennungsklassen anlegen und trainieren.
*   **Kamerawechsel:** Unterstützung für Front- und Rückkamera auf mobilen Geräten.
*   **Vollständig offline-fähig:** Keine externen Abhängigkeiten zur Laufzeit (außer dem TF.js-Laden beim ersten Start).

## 🎨 Design Language

Das Design der App folgt einer modernen, klaren und zugänglichen Designsprache.

**Farben**
| Token | Wert | Verwendung |
|---|---|---|
| `--primary-color` | `#D51317` | Hauptfarbe (Branding, Buttons, Hervorhebungen) |
| `--primary-color-dark` | `#a10f12` | Hover-Zustände, Gradients |
| `--success-color` | `#28a745` | Erfolgsmeldungen, abgeschlossene Schritte |
| `--danger-color` | `#dc3545` | Fehler, Warnungen, Löschen-Aktionen |
| `--background-light` | `#f4f7fc` | Seitenhintergrund |
| `--card-background` | `#ffffff` | Karten- und Containerhintergrund |
| `--text-color` | `#333333` | Standardtext |
| `--text-color-light` | `#666666` | Sekundärer / ergänzender Text |
| `--border-color` | `#e0e0e0` | Ränder, Trennlinien |

**Typografie**
- Schriftart: **Poppins** (lokal eingebunden, keine externe Quelle)
- Überschriften: `Poppins-Bold` / `Poppins-SemiBold`
- Fließtext: `Poppins-Regular`
- Hervorhebungen: `Poppins-Medium`

**Layout**
- Einspaltiges, zentriertes Layout (`max-width: 800px`) für optimale Lesbarkeit auf allen Geräten.
- Karten-basiertes UI: Inhalte sind in weißen Karten mit abgerundeten Ecken (`border-radius: 12px`) und einem dezenten Schatten gruppiert.
- Großzügige Abstände durch ein konsistentes Spacing-System (CSS-Variablen `--space-sm` bis `--space-xxl`).
- Vollständig **responsive**: Angepasste Layouts für Desktop, Tablet und Smartphone, inklusive spezieller Anpassungen für sehr kleine Bildschirme (< 375 px).

**Animationen**
- Header-Elemente fahren beim Laden mit `fadeInDown`, `fadeInUp` und `fadeInLeft` ein.
- Karten erscheinen mit einer `popIn`-Animation (Scale + Opacity).
- Der Trainingsfortschrittsbalken hat animierte Streifen (`progress-bar-stripes`).
- Kamerawechsel werden mit einer `cameraFlip`-Animation (3D-Rotation) visualisiert.
- Schaltflächen reagieren auf Klicks mit `buttonClickSpin`.
- Das neuronale Netz auf der Startseite zeigt eine sequenzielle Aktivierungsanimation durch alle Schichten.
- Hover-Effekte auf Karten: leichtes Anheben (`translateY(-5px)`).

## 🚀 So benutzt du es

Die Nutzung von The Teachable Machine ist kinderleicht!

1.  **Öffne die Anwendung:** Klicke einfach auf den folgenden Link (oder öffne die `index.html` Datei, wenn du das Projekt lokal hostest):
    [Jetzt öffnen](https://theteachablemachine.boomapps.de/)

2.  **Interagiere und Lehre:** Befolge die Anweisungen auf dem Bildschirm, um deiner Maschine Daten zu präsentieren und sie zu trainieren. Experimentiere mit verschiedenen Eingaben und beobachte, wie sich das Verhalten der Maschine ändert.

3.  **Viel Spaß beim Entdecken!**

## 💻 Selbst hosten

Du möchtest The Teachable Machine auf deinem eigenen System ausführen oder weiterentwickeln? Kein Problem! Befolge diese einfachen Schritte:

### Voraussetzungen

*   Ein moderner Webbrowser (Chrome, Firefox, Edge, Safari).
*   Optional: Git, um das Repository zu klonen.

### Installation

1.  **Repository klonen (empfohlen):**
    ```bash
    git clone https://github.com/boommasterxd/the-teachable-machine.git
    cd the-teachable-machine
    ```
    *Falls du Git nicht nutzen möchtest, kannst du das Projekt auch als ZIP-Datei herunterladen und entpacken.*

2.  **Anwendung starten:**
    Öffne einfach die Datei `index.html` in deinem bevorzugten Webbrowser. Du kannst dies tun, indem du die Datei direkt im Browser ziehst oder über das Menü "Datei" -> "Datei öffnen" gehst.

    ```bash
    # Beispiel für Linux/macOS
    open index.html

    # Beispiel für Windows
    start index.html
    ```

    Die Anwendung sollte nun in deinem Browser geladen werden.

### Wichtiger Hinweis für das Hosting

Bitte beachte, dass du die Daten im Impressum und in der Datenschutzerklärung anpassen musst, um den gesetzlichen Anforderungen zu entsprechen.

## 🛠️ Verwendete Technologien

*   **HTML5:** Für die Struktur der Webseiten.
*   **CSS3:** Für das Styling und das ansprechende Design.
*   **JavaScript:** Für die interaktive Logik und die "Teachable Machine"-Funktionalität.
*   **TensorFlow.js:** Eine JavaScript-Bibliothek für maschinelles Lernen, die es ermöglicht, ML-Modelle direkt im Browser zu entwickeln und auszuführen. Dies ist die Kerntechnologie, die das Training und die Inferenz der "Maschine" ermöglicht.
*   **Font Awesome:** Für Icons (lokal eingebunden).
*   **Google Fonts (Poppins):** Für eine moderne Typografie (lokal eingebunden).

## 🤝 Mitwirken

Ideen oder Verbesserungsvorschläge? Wir freuen uns über jeden Beitrag! Erstelle einfach einen Issue oder sende einen Pull Request.

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Weitere Details findest du in der `LICENSE.txt` Datei.

---

# 🧠 The Teachable Machine (English Version)

## Discover the Magic of Learning!

Welcome to **The Teachable Machine** – an interactive web project that playfully introduces you to the basics of machine learning. This project is heavily inspired by [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/). Experience how easy it can be to teach a machine to recognize patterns and make decisions, all without complex code!

## 📖 What the App Does

The Teachable Machine consists of two pages:

**1. Landing / Explanation Page (`index.html`)**
The landing page explains machine learning to newcomers. It includes:
- A short introduction explaining what the app is and what it is meant for.
- A step-by-step guide (collect data → train model → try it out).
- An interactive, animated visualization of a neural network: users can click "Dog" or "Cat" to watch a signal flow through the layers (Input → Hidden → Output).
- An explanatory box describing the individual layers of the neural network.
- A call-to-action button leading directly to the interactive training page.

**2. Training / DIY Page (`diy.html`)**
This is where the actual machine learning workflow takes place – entirely in the browser:
- **Collect data:** Users create as many classes as they like (e.g. "My Hand", "Coffee Cup") and capture training images using the webcam. Individual images can be tapped to enlarge and delete them.
- **Train the model:** With a click on "Train model", a KNN classifier is trained on the captured images. A progress bar provides visual feedback.
- **Real-time prediction:** After training, the camera shows in real time which class the AI recognizes – including probability bars for each class.
- **Switch camera:** On devices with multiple cameras (e.g. smartphones), a button allows switching between front and rear camera.
- **Privacy:** All image and model data stays exclusively on the user's device – no data is ever sent to external servers.

## ✨ Features

*   **Interactive Learning:** Train your own "machine" directly in the browser.
*   **Visual Feedback:** See immediately how your machine learns and adapts.
*   **Easy to Use:** No prior knowledge of AI or programming required.
*   **Appealing Design:** An intuitive and modern user interface.
*   **Animated neural network:** Interactive visualization of a neural network on the landing page.
*   **Multiple classes:** Create and train as many recognition classes as you like.
*   **Camera switching:** Support for front and rear camera on mobile devices.
*   **Fully offline-capable:** No external runtime dependencies (except loading TF.js on first start).

## 🎨 Design Language

The app's design follows a modern, clean, and accessible design language.

**Colors**
| Token | Value | Usage |
|---|---|---|
| `--primary-color` | `#D51317` | Primary color (branding, buttons, highlights) |
| `--primary-color-dark` | `#a10f12` | Hover states, gradients |
| `--success-color` | `#28a745` | Success messages, completed steps |
| `--danger-color` | `#dc3545` | Errors, warnings, delete actions |
| `--background-light` | `#f4f7fc` | Page background |
| `--card-background` | `#ffffff` | Card and container background |
| `--text-color` | `#333333` | Default text |
| `--text-color-light` | `#666666` | Secondary / supplementary text |
| `--border-color` | `#e0e0e0` | Borders, dividers |

**Typography**
- Font: **Poppins** (locally embedded, no external source)
- Headings: `Poppins-Bold` / `Poppins-SemiBold`
- Body text: `Poppins-Regular`
- Emphasis: `Poppins-Medium`

**Layout**
- Single-column, centered layout (`max-width: 800px`) for optimal readability on all devices.
- Card-based UI: content is grouped in white cards with rounded corners (`border-radius: 12px`) and a subtle shadow.
- Generous spacing through a consistent spacing system (CSS variables `--space-sm` to `--space-xxl`).
- Fully **responsive**: adapted layouts for desktop, tablet, and smartphone, including special adjustments for very small screens (< 375 px).

**Animations**
- Header elements slide in on load with `fadeInDown`, `fadeInUp`, and `fadeInLeft`.
- Cards appear with a `popIn` animation (scale + opacity).
- The training progress bar features animated stripes (`progress-bar-stripes`).
- Camera switches are visualised with a `cameraFlip` animation (3D rotation).
- Buttons respond to clicks with `buttonClickSpin`.
- The neural network on the landing page shows a sequential activation animation through all layers.
- Hover effects on cards: slight lift (`translateY(-5px)`).

## 🚀 How to Use It

Using The Teachable Machine is super easy!

1.  **Open the Application:** Simply click on the following link (or open the `index.html` file if you are hosting the project locally):
    [Open Now](https://theteachablemachine.boomapps.de/)

2.  **Interact and Teach:** Follow the on-screen instructions to present data to your machine and train it. Experiment with different inputs and observe how the machine's behavior changes.

3.  **Have Fun Exploring!**

## 💻 Self-Hosting

Do you want to run or develop The Teachable Machine on your own system? No problem! Follow these simple steps:

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   Optional: Git to clone the repository.

### Installation

1.  **Clone the Repository (recommended):**
    ```bash
    git clone https://github.com/boommasterxd/the-teachable-machine.git
    cd the-teachable-machine
    ```
    *If you don't want to use Git, you can also download the project as a ZIP file and unpack it.*

2.  **Start the Application:**
    Simply open the `index.html` file in your preferred web browser. You can do this by dragging the file directly into the browser or by going to the "File" -> "Open File" menu.

    ```bash
    # Example for Linux/macOS
    open index.html

    # Example for Windows
    start index.html
    ```

    The application should now load in your browser.

### Important Note for Hosting

Please note that you must adjust the data in the impressum (legal notice) and privacy policy to comply with legal requirements.

## 🛠️ Technologies Used

*   **HTML5:** For the structure of the web pages.
*   **CSS3:** For styling and appealing design.
*   **JavaScript:** For interactive logic and the "Teachable Machine" functionality.
*   **TensorFlow.js:** A JavaScript library for machine learning that enables the development and execution of ML models directly in the browser. This is the core technology that allows the "machine" to be trained and to perform inference.
*   **Font Awesome:** For icons (locally embedded).
*   **Google Fonts (Poppins):** For modern typography (locally embedded).

## 🤝 Contributing

Ideas or suggestions for improvement? We welcome all contributions! Simply create an issue or send a pull request.

## 📄 License

This project is licensed under the MIT License. More details can be found in the `LICENSE.txt` file.
