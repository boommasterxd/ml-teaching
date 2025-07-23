const classifier = knnClassifier.create();
let net;
let mediaStream = null;
let isPredicting = false;
let isCapturing = false;
let classNames = [];
let allClassExamples = [];

// Hilfsfunktion zum Erstellen eines HTML-Elements
function createElement(tag, classes = [], id = '', textContent = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (classes.length > 0) element.classList.add(...classes);
    if (id) element.id = id;
    if (textContent) element.textContent = textContent;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

// Hilfsfunktion zur Verwaltung des Scrollverhaltens bei Bildvorschauen
function updateScrollBehavior(classId) {
    const previewsDiv = document.getElementById(`class-${classId}-previews`);
    if (!previewsDiv) return;
    
    const imageCount = allClassExamples[classId] ? allClassExamples[classId].length : 0;
    // Aktiviere Scrolling ab der dritten Zeile (etwa 20+ Bilder bei ~10 Bildern pro Zeile)
    if (imageCount > 20) {
        previewsDiv.classList.add('scrollable');
    } else {
        previewsDiv.classList.remove('scrollable');
    }
}

// Funktion zum Initialisieren der Webcam.
async function setupWebcam() {
    try {
        // Fordere den Kamerazugriff an
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Webcam-Stream erfolgreich abgerufen.');

        const mainWebcam = document.getElementById('webcam');
        if (mainWebcam) {
            mainWebcam.srcObject = mediaStream;
            // Warte, bis die Metadaten des Videos geladen sind, bevor es abgespielt wird
            await new Promise((resolve, reject) => {
                mainWebcam.onloadedmetadata = () => {
                    mainWebcam.play();
                    console.log('Main webcam stream loaded and playing.');
                    resolve(mainWebcam);
                };
                mainWebcam.onerror = (err) => {
                    console.error('Webcam metadata error:', err);
                    reject(new Error('Fehler beim Laden der Webcam-Metadaten.'));
                }
            });
            return mainWebcam; // Gib das Video-Element zurück, wenn alles geklappt hat
        } else {
             throw new Error("Webcam-Element nicht im HTML gefunden.");
        }
    } catch (error) {
        console.error('Fehler beim Starten der Kamera:', error);
        // Wirf den Fehler erneut, damit er in der app() Funktion gefangen werden kann
        throw error;
    }
}

// Funktion zum Hinzufügen einer neuen Klasse
async function addNewClassCard(initialName = '') {
    // Stelle sicher, dass die Webcam bereit ist, bevor eine Karte hinzugefügt wird
    if (!mediaStream) {
        alert("Bitte erlaube zuerst den Kamerazugriff.");
        return;
    }

    const classId = classNames.length;
    classNames.push(initialName || `Klasse ${classId + 1}`);
    allClassExamples[classId] = [];

    const classCard = createElement('div', ['card', 'class-card'], `class-card-${classId}`);

    const h3 = createElement('h3');
    const nameInput = createElement('input', [], `class-${classId}-name`);
    nameInput.type = 'text';
    nameInput.value = classNames[classId];
    nameInput.addEventListener('change', (e) => {
        classNames[classId] = e.target.value;
        updateTrainButtonState();
        updatePredictionDisplay();
    });
    
    const deleteButton = createElement('button', ['delete-class-btn'], `delete-class-${classId}`);
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.title = 'Klasse löschen';
    deleteButton.addEventListener('click', () => deleteClass(classId));
    
    h3.appendChild(nameInput);
    h3.appendChild(deleteButton);
    classCard.appendChild(h3);

    const webcamPreviewDiv = createElement('div', ['webcam-preview']);
    const webcamPreviewVideo = createElement('video', [], `webcam-preview-${classId}`);
    webcamPreviewVideo.autoplay = true;
    webcamPreviewVideo.playsinline = true;
    webcamPreviewVideo.muted = true;
    webcamPreviewDiv.appendChild(webcamPreviewVideo);
    classCard.appendChild(webcamPreviewDiv);

    const inputGroup = createElement('div', ['input-group']);
    const webcamButton = createElement('button', [], `add-class-${classId}`);
    webcamButton.innerHTML = '<i class="fas fa-camera"></i> Bild aufnehmen';
    
    // --- KORRIGIERT: Event Listener mit manueller Style-Kontrolle ---
    const applyActiveStyle = (btn) => {
        btn.style.backgroundColor = 'var(--primary-color-dark)';
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 10px rgba(213, 19, 23, 0.3)';
    };

    const resetStyle = (btn) => {
        // Setzt die Farbe explizit auf den ursprünglichen Wert zurück,
        // um "klebende" :hover-Styles auf Mobilgeräten zu überschreiben.
        btn.style.backgroundColor = 'var(--primary-color)'; 
        btn.style.transform = '';
        btn.style.boxShadow = '';
    };

    // Maus-Events
    webcamButton.addEventListener('mousedown', () => {
        applyActiveStyle(webcamButton);
        startCapturing(classId);
    });
    webcamButton.addEventListener('mouseup', () => {
        resetStyle(webcamButton);
        stopCapturing();
    });
    webcamButton.addEventListener('mouseleave', () => {
        // Style nur zurücksetzen und stoppen, wenn die Aufnahme aktiv war
        if (isCapturing) {
            resetStyle(webcamButton);
            stopCapturing();
        }
    });
    
    // Touch-Events für mobile Geräte
    webcamButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Verhindert Standard-Touch-Verhalten wie Scrollen oder Zoomen
        applyActiveStyle(webcamButton);
        startCapturing(classId);
    });
    webcamButton.addEventListener('touchend', () => {
        resetStyle(webcamButton);
        stopCapturing();
    });
    
    inputGroup.appendChild(webcamButton);
    classCard.appendChild(inputGroup);

    const imageCountSpan = createElement('span', ['image-count'], `class-${classId}-count`, '0 Bilder');
    classCard.appendChild(imageCountSpan);

    const imagePreviewsDiv = createElement('div', ['image-previews'], `class-${classId}-previews`);
    classCard.appendChild(imagePreviewsDiv);

    document.getElementById('class-cards-container').appendChild(classCard);

    if (mediaStream) {
        webcamPreviewVideo.srcObject = mediaStream;
        webcamPreviewVideo.play();
    }

    updateTrainButtonState();
}

// Funktion zum Löschen einer Klasse (AKTUALISIERT)
function deleteClass(classId) {
    console.log('deleteClass aufgerufen für Klasse:', classId);
    const classCard = document.getElementById(`class-card-${classId}`);
    if (classCard) classCard.remove();
    
    if (allClassExamples[classId]) {
        allClassExamples[classId].forEach(tensor => tensor?.dispose());
    }
    
    classNames[classId] = null;
    allClassExamples[classId] = null;
    isPredicting = false;
    
    updateTrainButtonState();
    updatePredictionDisplay();
    
    if (classifier.getNumClasses() > 0) {
        classifier.clearAllClasses();
        const status = document.getElementById('training-status');
        if(status) status.textContent = 'Klasse gelöscht. Bitte trainiere das Modell erneut.';
    }
    console.log('Klasse erfolgreich gelöscht');
}

// Asynchrone Aufnahmeschleife, die die UI nicht blockiert
async function captureLoop(classId) {
    if (!isCapturing) return;

    const videoElement = document.getElementById('webcam');
    if (!videoElement || !videoElement.srcObject || videoElement.paused || videoElement.ended) {
        requestAnimationFrame(() => captureLoop(classId));
        return;
    }

    let img;
    try {
        img = tf.browser.fromPixels(videoElement);
        const activation = net.infer(img, 'conv_preds');
        allClassExamples[classId].push(activation);

        const canvas = createElement('canvas');
        canvas.width = img.shape[1];
        canvas.height = img.shape[0];
        await tf.browser.toPixels(img, canvas);
        
        // Index des aktuellen Bildes für Löschfunktion
        const imageIndex = allClassExamples[classId].length - 1;
        
        // Event Listener für Canvas (Vorschau öffnen)
        canvas.addEventListener('click', () => {
            openImageModal(canvas, classId, imageIndex);
        });
        
        const previewsDiv = document.getElementById(`class-${classId}-previews`);
        if (previewsDiv) previewsDiv.appendChild(canvas);

        const countSpan = document.getElementById(`class-${classId}-count`);
        if (countSpan) countSpan.textContent = `${allClassExamples[classId].length} Bilder`;
        
        // Aktualisiere das Scrollverhalten basierend auf der Bildanzahl
        updateScrollBehavior(classId);
        
        updateTrainButtonState();
    } finally {
        img?.dispose();
    }

    // Rufe die nächste Iteration im nächsten Frame auf
    requestAnimationFrame(() => captureLoop(classId));
}

function startCapturing(classId) {
    isCapturing = true;
    document.getElementById('train-model').disabled = true;
    captureLoop(classId);
}

function stopCapturing() {
    isCapturing = false;
    updateTrainButtonState();
}

// Funktion zum Löschen eines einzelnen Bildes
function deleteImage(classId, imageIndex, canvasElement) {
    // Entferne den Tensor aus dem Speicher
    if (allClassExamples[classId][imageIndex]) {
        allClassExamples[classId][imageIndex].dispose();
    }
    
    // Entferne das Bild aus dem Array
    allClassExamples[classId].splice(imageIndex, 1);
    
    // Entferne das HTML-Element
    canvasElement.remove();
    
    // Aktualisiere die Bildanzahl
    const countSpan = document.getElementById(`class-${classId}-count`);
    if (countSpan) countSpan.textContent = `${allClassExamples[classId].length} Bilder`;
    
    // Aktualisiere die Indizes der verbleibenden Bilder
    updateImageIndices(classId);
    
    // Aktualisiere das Scrollverhalten basierend auf der neuen Bildanzahl
    updateScrollBehavior(classId);
    
    // Aktualisiere den Trainingszustand
    updateTrainButtonState();
    
    // Falls das Modell bereits trainiert war, muss es neu trainiert werden
    if (classifier.getNumClasses() > 0) {
        isPredicting = false;
        const status = document.getElementById('training-status');
        if(status) status.textContent = 'Bild entfernt. Bitte trainiere das Modell erneut.';
        updatePredictionDisplay();
    }
}

// Hilfsfunktion zum Aktualisieren der Bildindizes nach dem Löschen
function updateImageIndices(classId) {
    const previewsDiv = document.getElementById(`class-${classId}-previews`);
    if (!previewsDiv) return;
    
    const canvases = previewsDiv.querySelectorAll('canvas');
    canvases.forEach((canvas, newIndex) => {
        // Erstelle ein neues Canvas mit dem gleichen Inhalt
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        
        // Kopiere den Bildinhalt
        const ctx = newCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        
        // Kopiere CSS-Klassen
        newCanvas.className = canvas.className;
        
        // Füge Event Listener hinzu
        newCanvas.addEventListener('click', () => {
            openImageModal(newCanvas, classId, newIndex);
        });
        
        // Ersetze das alte Canvas
        canvas.parentNode.replaceChild(newCanvas, canvas);
    });
}

// Funktion zum Öffnen des Bildvorschau-Modals
function openImageModal(sourceCanvas, classId, imageIndex) {
    const modal = document.getElementById('image-modal');
    const modalCanvas = document.getElementById('modal-canvas');
    const deleteButton = document.getElementById('modal-delete');
    
    // Kopiere das Bild in das Modal-Canvas
    const ctx = modalCanvas.getContext('2d');
    modalCanvas.width = sourceCanvas.width;
    modalCanvas.height = sourceCanvas.height;
    ctx.drawImage(sourceCanvas, 0, 0);
    
    // Entferne alte Event Listener vom Lösch-Button
    const newDeleteButton = deleteButton.cloneNode(true);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
    
    // Füge neuen Event Listener hinzu
    newDeleteButton.addEventListener('click', () => {
        closeImageModal();
        deleteImage(classId, imageIndex, sourceCanvas);
    });
    
    // Zeige das Modal
    modal.style.display = 'flex';
}

// Funktion zum Schließen des Modals
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}

function updateTrainButtonState() {
    if (isCapturing) return; // Zustand nicht ändern, während aufgenommen wird
    const trainButton = document.getElementById('train-model');
    const activeClasses = classNames.filter(name => name !== null);
    let hasEnoughExamples = activeClasses.length >= 2;
    if (hasEnoughExamples) {
        for (let i = 0; i < classNames.length; i++) {
            if (classNames[i] !== null && (!allClassExamples[i] || allClassExamples[i].length < 10)) {
                hasEnoughExamples = false;
                break;
            }
        }
    }
    trainButton.disabled = !hasEnoughExamples;
}

// Asynchrones Training, das die UI nicht blockiert
async function trainModel() {
    const progressContainer = document.getElementById('training-progress-container');
    const status = document.getElementById('training-status');
    const progressBar = document.getElementById('training-progress-bar');
    const trainButton = document.getElementById('train-model');

    progressContainer.style.display = 'block';
    status.textContent = 'Bereite Trainingsdaten vor...';
    progressBar.style.width = '0%';
    trainButton.disabled = true;

    classifier.clearAllClasses();
    
    // Sammle alle Beispiele, die hinzugefügt werden müssen
    const examplesToAdd = [];
    classNames.forEach((name, classId) => {
        if (name !== null && allClassExamples[classId]) {
            allClassExamples[classId].forEach(activation => {
                examplesToAdd.push({ activation, classId });
            });
        }
    });

    status.textContent = `Trainiere mit ${examplesToAdd.length} Bildern...`;
    await tf.nextFrame(); // UI aktualisieren lassen

    for (let i = 0; i < examplesToAdd.length; i++) {
        const { activation, classId } = examplesToAdd[i];
        classifier.addExample(activation, classId);
        
        const progress = Math.round(((i + 1) / examplesToAdd.length) * 100);
        progressBar.style.width = `${progress}%`;

        if (i % 10 === 0) {
            await tf.nextFrame();
        }
    }

    status.textContent = 'Fertig mit dem Lernen!';
    trainButton.disabled = false;
    
    setTimeout(() => {
        progressContainer.style.display = 'none';
        status.textContent = '';
        progressBar.style.width = '0%';
    }, 2000);

    startPrediction();
}

function updatePredictionDisplay() {
    const predictionResults = document.getElementById('prediction-results');
    const previewCard = document.getElementById('preview-card');
    if (!predictionResults || !previewCard) return;

    isPredicting = false;
    previewCard.style.display = 'none';
    predictionResults.innerHTML = '<p class="placeholder-text">Trainiere das Modell, um Ergebnisse zu sehen!</p>';
}

async function startPrediction() {
    if (classifier.getNumClasses() === 0) {
        alert('Bitte trainiere den Computer zuerst mit Bildern!');
        return;
    }

    isPredicting = true;
    
    const previewCard = document.getElementById('preview-card');
    previewCard.style.display = 'block';

    const placeholderText = document.querySelector('.placeholder-text');
    if (placeholderText) placeholderText.style.display = 'none';
    
    document.getElementById('prediction-results').innerHTML = '';
    document.getElementById('main-webcam-container').style.display = 'flex';

    classNames.forEach((name, index) => {
        if (name !== null && allClassExamples[index]?.length > 0) {
            const barContainer = createElement('div', ['probability-bar-container']);
            const label = createElement('div', ['probability-bar-label'], '', name);
            const bar = createElement('div', ['probability-bar']);
            const fill = createElement('div', ['probability-bar-fill'], `prob-fill-${index}`);
            bar.appendChild(fill);
            barContainer.appendChild(label);
            barContainer.appendChild(bar);
            document.getElementById('prediction-results').appendChild(barContainer);
        }
    });

    predictLoop();
}

async function predictLoop() {
    if (!isPredicting) return;

    let img;
    try {
        const videoElement = document.getElementById('webcam');
        if (!videoElement || !videoElement.srcObject || videoElement.paused || videoElement.ended) {
            requestAnimationFrame(predictLoop);
            return;
        }

        img = tf.browser.fromPixels(videoElement);
        const activation = net.infer(img, 'conv_preds');
        const result = await classifier.predictClass(activation);
        activation.dispose();

        const maxConfidence = Math.max(...Object.values(result.confidences));
        const confidenceThreshold = 0.3;

        classNames.forEach((name, classId) => {
            if (name !== null) {
                const fillElement = document.getElementById(`prob-fill-${classId}`);
                if (fillElement) {
                    const confidence = result.confidences[classId] || 0;
                    fillElement.style.width = maxConfidence < confidenceThreshold ? '0%' : `${confidence * 100}%`;
                }
            }
        });
    } finally {
        img?.dispose();
        await tf.nextFrame();
        requestAnimationFrame(predictLoop);
    }
}

// Hauptfunktion der App mit neuer Lade-Logik
async function app() {
    // Hole Referenzen zu den UI-Elementen für den Lade- und Hauptbildschirm
    const loadingOverlay = document.getElementById('loading-overlay');
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const cameraStep = document.getElementById('loading-step-camera');
    const modelStep = document.getElementById('loading-step-model');

    // Hilfsfunktion, um einen Ladeschritt in der UI zu aktualisieren (Erfolg/Misserfolg)
    const updateStep = (stepElement, success, message = '') => {
        const icon = stepElement.querySelector('i');
        if (success) {
            icon.classList.remove('fa-spinner', 'fa-spin');
            icon.classList.add('fa-check-circle'); // Grüner Haken
            stepElement.classList.add('completed');
        } else {
            icon.classList.remove('fa-spinner', 'fa-spin');
            icon.classList.add('fa-times-circle'); // Rotes Kreuz
            stepElement.classList.add('failed');
            // Füge eine detailliertere Fehlermeldung hinzu, falls vorhanden
            if (message) {
                const errorSpan = createElement('span', ['error-message'], '', message);
                stepElement.appendChild(errorSpan);
            }
        }
    };

    // Definiere die beiden Lade-Aufgaben (Promises)
    const webcamPromise = setupWebcam()
        .then(webcamResult => {
            updateStep(cameraStep, true); // Update UI: Kamera erfolgreich
            return webcamResult;
        })
        .catch(err => {
            updateStep(cameraStep, false, 'Zugriff verweigert oder Kamera nicht gefunden.');
            throw err; // Wichtig: Fehler weiterwerfen, damit Promise.all fehlschlägt
        });

    const modelPromise = mobilenet.load({ version: 2, alpha: 1.0 })
        .then(loadedNet => {
            updateStep(modelStep, true); // Update UI: Modell erfolgreich
            return loadedNet;
        })
        .catch(err => {
            updateStep(modelStep, false, 'Netzwerkfehler beim Laden des Modells.');
            throw err; // Fehler weiterwerfen
        });

    // Warte, bis BEIDE Aufgaben abgeschlossen sind
    try {
        const [webcamResult, loadedNet] = await Promise.all([webcamPromise, modelPromise]);
        
        // Weise das geladene Modell der globalen Variable zu
        net = loadedNet;
        console.log('MobileNet und Kamera erfolgreich geladen. App wird gestartet.');

        // Kurze Verzögerung, damit der Benutzer die grünen Haken sieht, dann App einblenden
        setTimeout(() => {
            loadingOverlay.style.opacity = '0'; // Fade out
            // Nachdem die Animation beendet ist, das Overlay aus dem Layout entfernen
            loadingOverlay.addEventListener('transitionend', () => {
                loadingOverlay.classList.add('hidden');
            });
            
            // Hauptinhalt einblenden
            header.classList.remove('hidden');
            mainContent.classList.remove('hidden');
        }, 500);

    } catch (error) {
        console.error("Initialisierung fehlgeschlagen:", error);
        // Die Fehlermeldung wird bereits im jeweiligen Schritt angezeigt.
    }

    // Event Listener für die Buttons der App hinzufügen
    document.getElementById('add-new-class').addEventListener('click', () => addNewClassCard());
    document.getElementById('train-model').addEventListener('click', trainModel);
    
    // Event Listener für das Bildvorschau-Modal
    document.getElementById('modal-close').addEventListener('click', closeImageModal);
    document.getElementById('image-modal').addEventListener('click', (e) => {
        // Schließe Modal wenn auf den Hintergrund geklickt wird
        if (e.target.id === 'image-modal') {
            closeImageModal();
        }
    });
    
    // ESC-Taste zum Schließen des Modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
}

// Starte die App, sobald das gesamte HTML-Dokument geladen ist
document.addEventListener('DOMContentLoaded', app);
