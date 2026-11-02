# 🧠 The Teachable Machine

## Entdecke die Magie des Lernens!

Willkommen bei **The Teachable Machine** – einem interaktiven Webprojekt, das dir auf spielerische Weise die Grundlagen des maschinellen Lernens näherbringt. Dieses Projekt ist stark angelehnt an [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/). Erlebe, wie einfach es sein kann, einer Maschine beizubringen, Muster zu erkennen und Entscheidungen zu treffen, ganz ohne komplizierten Code!

## 📖 Funktionsweise der App

The Teachable Machine ist eine moderne **React-Anwendung**, die einen flüssigen und interaktiven Workflow bietet:

**1. Startseite / Landing Page (`LandingPage.tsx`)**
Die Startseite führt in die Welt des maschinellen Lernens ein. Sie enthält:
- **Interaktive Visualisierung:** Ein animiertes neuronales Netz, das den Signalfluss vom Input über Hidden Layers bis zum Output zeigt (auslösbar durch Hund/Katze-Beispiele).
- **Theoretische Grundlagen:** Einfache Erklärungen zu **MobileNet** (Feature Extraction), **KNN** (Klassifizierung durch Nachbarschaft) und **Transfer Learning**.
- **Praktische Tipps:** Anleitung für ein "schlaues" Modell (viele Bilder, verschiedene Winkel, unterschiedliches Licht).
- **Alltagsbeispiele:** Verknüpfung zu realen Anwendungen wie Face ID, autonomes Fahren und Medizin.

**2. Trainingsseite / DIY-Seite (`TrainingPage.tsx`)**
Hier findet der Machine-Learning-Workflow vollständig im Browser statt:
- **Einwilligung & Datenschutz:** Transparente Abfrage zur Nutzung der Kamera und zum Laden der lokalen KI-Modelle.
- **Klassenverwaltung:** Erstelle beliebig viele Klassen, benenne sie um oder lösche sie (inkl. Validierung).
- **Datensammlung:** Nimm Trainingsbilder per Webcam auf (Halten für Serienaufnahme) oder lade eigene Bilddateien hoch.
- **Bildverwaltung:** Eine Galerie zeigt alle aufgenommenen Bilder; per Klick können diese vergrößert oder einzeln gelöscht werden.
- **Training:** Trainiere dein Modell in Sekunden direkt auf deinem Gerät.
- **Echtzeit-Vorhersage:** Live-Klassifizierung durch die Webcam mit dynamischen Wahrscheinlichkeitsbalken für jede Klasse.
- **Kamera-Steuerung:** Unterstützung für Front- und Rückkameras auf mobilen Geräten.

## ✨ Features

*   **Modernes Framework:** Entwickelt mit React 19 für höchste Performance und Reaktivität.
*   **Interaktives Lernen:** Trainiere deine eigene "Maschine" ohne Vorkenntnisse direkt im Browser.
*   **Visuelle Rückmeldung:** Flüssige UI-Animationen mit dem motion-Paket (v12) visualisieren den Lernprozess.
*   **Vite 8 Speed:** Optimiert für blitzschnelle Ladezeiten.
*   **Responsive Design:** Nahtlose Nutzung auf Desktop, Tablet und Smartphone dank Tailwind CSS 4.
*   **Vollständiger Datenschutz:** Client-seitige Verarbeitung mit TensorFlow.js schützt deine Privatsphäre.

## 🎨 Design Language

Die Anwendung nutzt **Tailwind CSS 4** für ein konsistentes und modernes Erscheinungsbild.

**Design-Highlights**
- **Branding:** Ein markantes Rot (`#D51317`) leitet den Nutzer durch die Anwendung.
- **Benutzeroberfläche:** Ein klares, kartenbasiertes Design mit dezenten Schatten sorgt für Übersichtlichkeit.
- **Interaktionen:** Hochwertige Animationen durch das **motion-Paket (v12)** machen den Workflow greifbar.
- **Symbolik:** Präzise Icons von **Lucide React** unterstützen die intuitive Bedienung.

## 🚀 So benutzt du es

1.  **Öffne die Anwendung:** Besuche die offizielle Version:
    [Jetzt öffnen](https://theteachablemachine.boomapps.de/)

2.  **Daten sammeln:** Erstelle deine Klassen und halte den Aufnahme-Button gedrückt, um Bilder für dein Training zu sammeln.

3.  **Trainieren & Testen:** Klicke auf "Modell trainieren" und teste sofort, wie die Maschine deine Bewegungen oder Objekte erkennt.

## 💻 Entwicklung & lokales Hosting

### Voraussetzungen

*   **Node.js** (neueste Version innerhalb von 26.x)
*   **npm** oder **yarn**

### Installation

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/boommasterxd/the-teachable-machine.git
    cd the-teachable-machine
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

3.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
    Die App ist unter `http://localhost:3000` erreichbar.

4.  **Produktions-Build erstellen und starten:**
    ```bash
    npm run build
    npm start
    ```

5.  **Alternativ mit Docker:**
    ```bash
    docker build --pull -t teachable-machine .
    docker run -p 3000:3000 --env-file .env teachable-machine
    ```

## 🛠️ Technischer Stack

*   **Framework:** [React 19](https://react.dev/)
*   **Build-Tool:** [Vite 8](https://vitejs.dev/)
*   **Sprache:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
*   **Routing:** [React Router 7](https://reactrouter.com/)
*   **KI/ML:** [TensorFlow.js](https://www.tensorflow.org/js) (MobileNet & KNN Classifier)
*   **Animationen:** [motion (v12)](https://motion.dev/) (ehemals Framer Motion)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Server:** [Express](https://expressjs.com/) mit Helmet CSP und Rate Limiting

## 🤝 Mitwirken

Ideen oder Verbesserungsvorschläge? Wir freuen uns über jeden Beitrag! Erstelle einfach einen Issue oder sende einen Pull Request.

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Weitere Details findest du in der `LICENSE.txt` Datei.

---

# 🧠 The Teachable Machine (English)

## Discover the Magic of Learning!

Welcome to **The Teachable Machine** – an interactive web project that playfully introduces you to the basics of machine learning. This project is heavily inspired by [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/). Experience how easy it can be to teach a machine to recognize patterns and make decisions, all without complex code!

## 📖 How the App Works

The Teachable Machine is a modern **React application** that provides a smooth and interactive workflow:

**1. Landing Page (`LandingPage.tsx`)**
The landing page introduces the world of machine learning. It features:
- **Interactive Visualization:** An animated neural network showing the signal flow from input through hidden layers to output (triggered by dog/cat examples).
- **Theoretical Basics:** Simple explanations of **MobileNet** (feature extraction), **KNN** (classification by neighborhood), and **Transfer Learning**.
- **Practical Tips:** Guidance for a "smart" model (many images, different angles, varying light).
- **Real-World Examples:** Links to everyday applications like Face ID, autonomous driving, and medicine.

**2. Training / DIY Page (`TrainingPage.tsx`)**
This is where the machine learning workflow takes place entirely in the browser:
- **Consent & Privacy:** Transparent request for camera access and loading of local AI models.
- **Class Management:** Create as many classes as you like, rename them, or delete them (including validation).
- **Data Collection:** Capture training images via webcam (hold to record burst) or upload your own image files.
- **Image Management:** A gallery displays all captured images; click to enlarge or delete them individually.
- **Training:** Train your model in seconds directly on your device.
- **Real-Time Prediction:** Live classification through the webcam with dynamic probability bars for each class.
- **Camera Control:** Support for front and rear cameras on mobile devices.

## ✨ Features

*   **Modern Framework:** Built with React 19 for maximum performance and reactivity.
*   **Interactive Learning:** Train your own "machine" directly in the browser with no prior knowledge.
*   **Visual Feedback:** Smooth UI animations with the motion package (v12) visualize the learning process.
*   **Vite 8 Speed:** Optimized for lightning-fast loading times.
*   **Responsive Design:** Seamless use on desktop, tablet, and smartphone thanks to Tailwind CSS 4.
*   **Full Privacy:** Client-side processing with TensorFlow.js protects your privacy.

## 🎨 Design Language

The application uses **Tailwind CSS 4** for a consistent and modern appearance.

**Design Highlights**
- **Branding:** A striking red (`#D51317`) guides the user through the application.
- **User Interface:** A clear, card-based design with subtle shadows ensures clarity.
- **Interactions:** High-quality animations by the **motion package (v12)** make the workflow tangible.
- **Symbolism:** Precise icons from **Lucide React** support intuitive operation.

## 🚀 How to Use It

1.  **Open the Application:** Visit the official version:
    [Open Now](https://theteachablemachine.boomapps.de/)

2.  **Collect Data:** Create your classes and hold the record button to collect images for your training.

3.  **Train & Test:** Click "Train Model" and immediately test how the machine recognizes your movements or objects.

## 💻 Development & Local Hosting

### Prerequisites

*   **Node.js** (latest version within 26.x)
*   **npm** or **yarn**

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/boommasterxd/the-teachable-machine.git
    cd the-teachable-machine
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The app is accessible at `http://localhost:3000`.

4.  **Create Production Build and Start:**
    ```bash
    npm run build
    npm start
    ```

5.  **Alternatively with Docker:**
    ```bash
    docker build --pull -t teachable-machine .
    docker run -p 3000:3000 --env-file .env teachable-machine
    ```

## 🛠️ Technical Stack

*   **Framework:** [React 19](https://react.dev/)
*   **Build-Tool:** [Vite 8](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
*   **Routing:** [React Router 7](https://reactrouter.com/)
*   **AI/ML:** [TensorFlow.js](https://www.tensorflow.org/js) (MobileNet & KNN Classifier)
*   **Animations:** [motion (v12)](https://motion.dev/) (formerly Framer Motion)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Server:** [Express](https://expressjs.com/) with Helmet CSP and rate limiting

## 🤝 Contributing

Ideas or suggestions for improvement? We welcome all contributions! Simply create an issue or send a pull request.

## 📄 License

This project is licensed under the MIT License. More details can be found in the `LICENSE.txt` file.
