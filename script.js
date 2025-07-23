const classifier = knnClassifier.create();
let net;
let mediaStream = null;
let isPredicting = false;
let isCapturing = false;
let classNames = [];
let allClassExamples = [];
let currentFacingMode = 'user'; // 'user' für Frontkamera, 'environment' für Rückkamera
let availableCameras = [];
let isSwitchingCamera = false; // Verhindert mehrfache Kamerawechsel während Animation

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

// Funktion zum Ermitteln verfügbarer Kameras
async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter(device => device.kind === 'videoinput');
        console.log('Verfügbare Kameras:', availableCameras.length);
        
        // Aktualisiere Button-Sichtbarkeit
        updateCameraSwitchButtonVisibility(availableCameras.length > 1);
        
        return availableCameras.length > 1; // Gibt true zurück, wenn mehr als eine Kamera verfügbar ist
    } catch (error) {
        console.error('Fehler beim Ermitteln der verfügbaren Kameras:', error);
        updateCameraSwitchButtonVisibility(false);
        return false;
    }
}

// Funktion zum Aktualisieren der Button-Sichtbarkeit
function updateCameraSwitchButtonVisibility(hasMultipleCameras) {
    const switchButton = document.getElementById('camera-switch-btn');
    if (switchButton) {
        switchButton.style.display = hasMultipleCameras ? 'flex' : 'none';
    }
}

// Funktion zum Aktualisieren aller Event-Listener basierend auf Kamera-Verfügbarkeit
async function updateAllCameraSwitchListeners() {
    const hasMultipleCameras = await getAvailableCameras();
    
    // Entferne alle bestehenden Event-Listener Markierungen
    const allVideos = document.querySelectorAll('video[data-camera-switch-listener]');
    allVideos.forEach(video => {
        video.removeAttribute('data-camera-switch-listener');
    });
    
    // Setze neue Event-Listener basierend auf aktueller Verfügbarkeit
    const mainWebcam = document.getElementById('webcam');
    if (mainWebcam) {
        await addCameraSwitchListener(mainWebcam);
    }
    
    const previewVideos = document.querySelectorAll('[id^="webcam-preview-"]');
    for (const video of previewVideos) {
        await addCameraSwitchListener(video);
    }
}

// Funktion zum Wechseln zwischen Front- und Rückkamera mit Animation
async function switchCamera() {
    // Verhindere mehrfache Aufrufe während einer Animation
    if (isSwitchingCamera) {
        console.log('Kamerawechsel bereits im Gange - Aufruf ignoriert');
        return;
    }
    
    try {
        isSwitchingCamera = true;
        const wasPredicting = isPredicting;
        
        // Stoppe temporär die Vorhersage
        if (wasPredicting) {
            isPredicting = false;
            console.log('Vorhersage temporär gestoppt für Kamerawechsel');
        }
        
        // Starte die Animation auf allen Video-Elementen
        const allVideos = document.querySelectorAll('video');
        const switchButton = document.getElementById('camera-switch-btn');
        
        // Füge Animations-Klassen hinzu
        allVideos.forEach(video => {
            video.classList.add('camera-switching');
        });
        
        if (switchButton) {
            switchButton.classList.add('switching');
        }
        
        // Warte bis etwa 1/3 der Animation (früherer Wechsel für Ladezeit)
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Stoppe den aktuellen Stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }

        // Wechsle die Facing-Mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        console.log('Wechsle zu Kamera:', currentFacingMode === 'user' ? 'Frontkamera' : 'Rückkamera');

        // Starte die Webcam mit der neuen Facing-Mode
        await setupWebcamWithFacingMode(currentFacingMode);
        
        // Warte bis die Animation vollständig abgeschlossen ist
        await new Promise(resolve => setTimeout(resolve, 650));
        
        // Entferne Animations-Klassen
        allVideos.forEach(video => {
            video.classList.remove('camera-switching');
        });
        
        if (switchButton) {
            switchButton.classList.remove('switching');
        }
        
        // Starte die Vorhersage wieder, falls sie vorher aktiv war
        if (wasPredicting) {
            setTimeout(() => {
                isPredicting = true;
                console.log('Vorhersage wieder gestartet nach Kamerawechsel');
                // Starte die Vorhersageschleife neu
                requestAnimationFrame(predictLoop);
            }, 200);
        }
        
        console.log('Kamera erfolgreich gewechselt zu:', currentFacingMode === 'user' ? 'Frontkamera' : 'Rückkamera');
    } catch (error) {
        console.error('Fehler beim Wechseln der Kamera:', error);
        
        // Entferne Animations-Klassen bei Fehler
        const allVideos = document.querySelectorAll('video');
        const switchButton = document.getElementById('camera-switch-btn');
        
        allVideos.forEach(video => {
            video.classList.remove('camera-switching');
        });
        
        if (switchButton) {
            switchButton.classList.remove('switching');
        }
        
        // Falls der Wechsel fehlschlägt, versuche zur ursprünglichen Kamera zurückzukehren
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        try {
            await setupWebcamWithFacingMode(currentFacingMode);
            // Vorhersage wieder starten, falls sie vorher aktiv war
            if (isPredicting === false) {
                setTimeout(() => {
                    isPredicting = true;
                    requestAnimationFrame(predictLoop);
                }, 200);
            }
        } catch (fallbackError) {
            console.error('Fehler beim Zurückwechseln zur ursprünglichen Kamera:', fallbackError);
        }
    } finally {
        // Stelle sicher, dass der Lock immer zurückgesetzt wird
        isSwitchingCamera = false;
    }
}

// Erweiterte setupWebcam-Funktion mit Facing-Mode-Unterstützung
async function setupWebcamWithFacingMode(facingMode = 'user') {
    try {
        // Konfiguration für getUserMedia
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        // Fordere den Kamerazugriff mit der spezifizierten Facing-Mode an
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`Webcam-Stream mit ${facingMode === 'user' ? 'Frontkamera' : 'Rückkamera'} erfolgreich abgerufen.`);

        // Aktualisiere alle Video-Elemente
        await updateAllVideoElements();

        return document.getElementById('webcam');
    } catch (error) {
        console.error('Fehler beim Starten der Kamera mit Facing-Mode:', error);
        throw error;
    }
}

// Funktion zum Aktualisieren aller Video-Elemente mit dem neuen Stream
async function updateAllVideoElements() {
    const mainWebcam = document.getElementById('webcam');
    const wasPredicting = isPredicting;
    
    // Stoppe temporär die Vorhersage während des Stream-Wechsels
    if (wasPredicting) {
        isPredicting = false;
    }
    
    if (mainWebcam && mediaStream) {
        // Speichere die aktuellen Dimensionen, falls vorhanden
        const currentWidth = mainWebcam.style.width || mainWebcam.offsetWidth;
        const currentHeight = mainWebcam.style.height || mainWebcam.offsetHeight;
        
        mainWebcam.srcObject = mediaStream;
        await new Promise((resolve, reject) => {
            mainWebcam.onloadedmetadata = async () => {
                try {
                    await mainWebcam.play();
                    
                    // Stelle sicher, dass die Dimensionen konsistent bleiben
                    if (currentWidth && currentHeight) {
                        mainWebcam.style.width = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth;
                        mainWebcam.style.height = typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight;
                    }
                    
                    console.log('Main webcam stream updated and playing.');
                    
                    // Füge Doppelklick-Listener hinzu (nur wenn mehrere Kameras verfügbar)
                    await addCameraSwitchListener(mainWebcam);
                    
                    resolve(mainWebcam);
                } catch (error) {
                    console.error('Fehler beim Abspielen der Webcam:', error);
                    reject(error);
                }
            };
            mainWebcam.onerror = (err) => {
                console.error('Webcam metadata error:', err);
                reject(new Error('Fehler beim Laden der Webcam-Metadaten.'));
            }
        });
    }

    // Aktualisiere auch alle Klassen-Webcam-Previews
    const previewVideos = document.querySelectorAll('[id^="webcam-preview-"]');
    for (const video of previewVideos) {
        if (mediaStream) {
            // Speichere die aktuellen Dimensionen für Preview-Videos
            const currentWidth = video.style.width || video.offsetWidth;
            const currentHeight = video.style.height || video.offsetHeight;
            
            video.srcObject = mediaStream;
            try {
                await video.play();
                
                // Stelle sicher, dass die Dimensionen konsistent bleiben
                if (currentWidth && currentHeight) {
                    video.style.width = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth;
                    video.style.height = typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight;
                }
            } catch (error) {
                console.error('Fehler beim Abspielen des Preview-Videos:', error);
            }
            // Füge Doppelklick-Listener zu Klassen-Webcam-Previews hinzu (nur wenn mehrere Kameras verfügbar)
            await addCameraSwitchListener(video);
        }
    }
    
    // Wichtig: Starte die Vorhersage NICHT automatisch wieder - das macht die switchCamera Funktion
    console.log('Alle Video-Elemente wurden aktualisiert');
}

// Funktion zum Hinzufügen von Doppelklick-Event-Listenern zu Video-Elementen
async function addCameraSwitchListener(videoElement) {
    // Prüfe, ob der Event-Listener bereits hinzugefügt wurde
    if (videoElement.hasAttribute('data-camera-switch-listener')) {
        return;
    }
    
    // Prüfe, ob mehrere Kameras verfügbar sind
    const hasMultipleCameras = await getAvailableCameras();
    
    if (hasMultipleCameras) {
        videoElement.addEventListener('dblclick', async (e) => {
            e.preventDefault();
            console.log('Doppelklick auf Video erkannt - versuche Kamera zu wechseln');
            await switchCamera();
        });
        
        // Füge einen visuellen Hinweis hinzu (Cursor-Style)
        videoElement.style.cursor = 'pointer';
        videoElement.title = 'Doppelklick um zwischen Kameras zu wechseln';
    } else {
        // Entferne Cursor-Style wenn keine mehreren Kameras verfügbar
        videoElement.style.cursor = 'default';
        videoElement.title = '';
    }
    
    // Markiere das Element als bereits verarbeitet
    videoElement.setAttribute('data-camera-switch-listener', 'true');
}

// Funktion zum Initialisieren der Webcam.
async function setupWebcam() {
    try {
        // Verwende die neue setupWebcamWithFacingMode Funktion
        const webcamElement = await setupWebcamWithFacingMode(currentFacingMode);
        
        // Überprüfe verfügbare Kameras und konfiguriere Button
        await getAvailableCameras();
        
        // Füge Event Listener zum Switch-Button hinzu
        const switchButton = document.getElementById('camera-switch-btn');
        if (switchButton && !switchButton.hasAttribute('data-listener-added')) {
            switchButton.addEventListener('click', async () => {
                await switchCamera();
            });
            switchButton.setAttribute('data-listener-added', 'true');
        }
        
        return webcamElement;
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
        
        // Füge Doppelklick-Listener auch für Klassen-Webcam-Previews hinzu (nur wenn mehrere Kameras verfügbar)
        await addCameraSwitchListener(webcamPreviewVideo);
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
    
    // Überprüfe, ob das Video tatsächlich Daten liefert
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
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
    } catch (error) {
        console.error('Fehler in captureLoop:', error);
    } finally {
        img?.dispose();
    }

    // Rufe die nächste Iteration im nächsten Frame auf, nur wenn noch capturing aktiv ist
    if (isCapturing) {
        requestAnimationFrame(() => captureLoop(classId));
    }
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
    
    setTimeout(async () => {
        progressContainer.style.display = 'none';
        status.textContent = '';
        progressBar.style.width = '0%';
        await startPrediction();
    }, 2000);
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

    // Füge Doppelklick-Listener zum Haupt-Webcam-Element hinzu (nur wenn mehrere Kameras verfügbar)
    const mainWebcam = document.getElementById('webcam');
    if (mainWebcam) {
        await addCameraSwitchListener(mainWebcam);
    }

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
        
        // Überprüfe, ob das Video-Element existiert und bereit ist
        if (!videoElement || !videoElement.srcObject || videoElement.paused || videoElement.ended) {
            requestAnimationFrame(predictLoop);
            return;
        }
        
        // Überprüfe, ob das Video tatsächlich Daten liefert
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
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
    } catch (error) {
        console.error('Fehler in predictLoop:', error);
        // Bei Fehlern kurz warten, bevor der nächste Versuch gestartet wird
        setTimeout(() => {
            if (isPredicting) {
                requestAnimationFrame(predictLoop);
            }
        }, 100);
        return;
    } finally {
        img?.dispose();
        await tf.nextFrame();
    }
    
    // Nur fortfahren, wenn Vorhersage noch aktiv ist
    if (isPredicting) {
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
    
    // Event Listener für das Legal-Modal
    document.getElementById('impressum-link').addEventListener('click', (e) => {
        e.preventDefault();
        openLegalModal('impressum');
    });
    
    document.getElementById('datenschutz-link').addEventListener('click', (e) => {
        e.preventDefault();
        openLegalModal('datenschutz');
    });
    
    document.getElementById('legal-modal-close').addEventListener('click', closeLegalModal);
    document.getElementById('legal-modal').addEventListener('click', (e) => {
        // Schließe Modal wenn auf den Hintergrund geklickt wird
        if (e.target.id === 'legal-modal') {
            closeLegalModal();
        }
    });
    
    // ESC-Taste zum Schließen der Modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
            closeLegalModal();
        }
    });
}

// Legal Modal Funktionalität
function openLegalModal(type) {
    const modal = document.getElementById('legal-modal');
    const title = document.getElementById('legal-modal-title');
    const body = document.getElementById('legal-modal-body');
    
    if (type === 'impressum') {
        title.textContent = 'Impressum';
        body.innerHTML = getImpressumContent();
    } else if (type === 'datenschutz') {
        title.textContent = 'Datenschutzerklärung';
        body.innerHTML = getDatenschutzContent();
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Verhindert Scrollen im Hintergrund
}

function closeLegalModal() {
    const modal = document.getElementById('legal-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Erlaubt wieder Scrollen
}

function getImpressumContent() {
    return `
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
            <strong>Verantwortlich für den Inhalt:</strong><br>
            Yannick Schäfer<br>
            Am Mäuerchen 12<br>
            67591 Mölsheim<br>
            Deutschland
        </p>
        
        <h2>Kontakt</h2>
        <p>
            <strong>E-Mail:</strong> yannickschaefer@boomapps.de<br>
            <strong>Telefon:</strong> +4915757934851
        </p>
        
        <h2>Verantwortlich für journalistisch-redaktionelle Inhalte</h2>
        <p>
            Verantwortlich für journalistisch-redaktionelle Inhalte gem. § 18 Abs. 2 MStV:<br>
            Yannick Schäfer<br>
            Am Mäuerchen 12, 67591 Mölsheim
        </p>
        
        <h2>EU-Streitschlichtung</h2>
        <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank">
                https://ec.europa.eu/consumers/odr/
            </a><br>
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
        
        <h2>Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
        <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
            Verbraucherschlichtungsstelle teilzunehmen.
        </p>
        
        <h2>Zentrale Kontaktstelle nach dem Digital Services Act - DSA (Verordnung (EU) 2022/065)</h2>
        <p>
            Unsere zentrale Kontaktstelle für Nutzer und Behörden nach Art. 11, 12 DSA erreichen Sie wie folgt:<br>
            E-Mail: yannickschaefer@boomapps.de
        </p>
        
        <h2>Hinweise zur Website</h2>
        <p>
            Diese Anwendung nutzt Künstliche Intelligenz (KI) zur Bilderkennung. Alle Datenverarbeitung 
            erfolgt lokal in Ihrem Browser. Es werden keine Bilder oder persönlichen Daten an externe 
            Server übertragen.
        </p>
        
        <p>
            Die Anwendung verwendet TensorFlow.js und vortrainierte Modelle für maschinelles Lernen. 
            Diese Technologien ermöglichen es, direkt im Browser ohne externe Datenübertragung zu arbeiten.
        </p>
    `;
}

function getDatenschutzContent() {
    return `
        <div class="highlight-box">
            <h3><i class="fas fa-shield-alt"></i> Datenschutz-Kurzfassung</h3>
            <p>
                <strong>Diese Anwendung respektiert Ihre Privatsphäre vollständig:</strong>
                Alle Daten (Kamerabilder, KI-Modelle) werden ausschließlich lokal in Ihrem Browser verarbeitet. 
                Es findet keine Übertragung an externe Server statt.
            </p>
        </div>
        
        <h2>1. Datenschutz auf einen Blick</h2>
        
        <h3>Allgemeine Hinweise</h3>
        <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
            passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
            persönlich identifiziert werden können.
        </p>
        
        <h3>Datenerfassung auf dieser Website</h3>
        <p>
            <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
            können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
        </p>
        
        <p>
            <strong>Wie erfassen wir Ihre Daten?</strong><br>
            Diese Anwendung verwendet ausschließlich lokale Datenverarbeitung. Ihre Kamerabilder und erstellten 
            KI-Modelle verlassen nie Ihren Browser und werden nicht an externe Server übertragen.
        </p>
        
        <h2>2. Hosting und Content Delivery Networks (CDN)</h2>
        
        <h3>Externes Hosting</h3>
        <p>
            Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, 
            die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.
        </p>
        
        <h3>TensorFlow.js und Machine Learning Bibliotheken</h3>
        <p>
            Diese Anwendung lädt die folgenden externen JavaScript-Bibliotheken:
        </p>
        <ul>
            <li>TensorFlow.js von cdn.jsdelivr.net</li>
            <li>MobileNet Modell von cdn.jsdelivr.net</li>
            <li>KNN-Classifier von cdn.jsdelivr.net</li>
            <li>Font Awesome Icons von cdnjs.cloudflare.com</li>
        </ul>
        <p>
            Diese Bibliotheken werden einmalig beim Laden der Seite heruntergeladen. Danach erfolgt die gesamte 
            Datenverarbeitung lokal in Ihrem Browser.
        </p>
        
        <h2>3. Kameranutzung und Bildverarbeitung</h2>
        
        <h3>Webcam-Zugriff</h3>
        <p>
            Diese Anwendung fordert Zugriff auf Ihre Kamera an, um Bilder für das maschinelle Lernen zu erfassen. 
            Folgende Prinzipien gelten:
        </p>
        <ul>
            <li><strong>Lokale Verarbeitung:</strong> Alle Kamerabilder werden ausschließlich in Ihrem Browser verarbeitet</li>
            <li><strong>Keine Übertragung:</strong> Kamerabilder werden niemals an externe Server gesendet</li>
            <li><strong>Temporäre Speicherung:</strong> Bilder werden nur temporär im Browser-Speicher gehalten</li>
            <li><strong>Vollständige Kontrolle:</strong> Sie bestimmen, welche Bilder aufgenommen werden</li>
            <li><strong>Sofortiges Löschen:</strong> Beim Schließen der Anwendung werden alle Daten gelöscht</li>
        </ul>
        
        <h3>KI-Modell Training</h3>
        <p>
            Das Training der Künstlichen Intelligenz erfolgt vollständig in Ihrem Browser mittels TensorFlow.js. 
            Die trainierten Modelle verlassen niemals Ihren Computer.
        </p>
        
        <h2>4. Allgemeine Hinweise und Pflichtinformationen</h2>
        
        <h3>Datenschutz</h3>
        <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
            personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzbestimmungen sowie 
            dieser Datenschutzerklärung.
        </p>
        
        <h3>Hinweis zur verantwortlichen Stelle</h3>
        <p>
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
        </p>
        <p>
            Yannick Schäfer<br>
            Am Mäuerchen 12<br>
            67591 Mölsheim<br>
            E-Mail: yannickschaefer@boomapps.de
        </p>
        
        <h3>Speicherdauer</h3>
        <p>
            Da alle Daten ausschließlich lokal in Ihrem Browser verarbeitet werden, gibt es keine dauerhafte 
            Speicherung auf externen Servern. Alle Daten werden beim Schließen der Anwendung automatisch gelöscht.
        </p>
        
        <h2>5. Ihre Rechte</h2>
        
        <p>
            Sie haben jederzeit das Recht:
        </p>
        <ul>
            <li>unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten</li>
            <li>Berichtigung oder Löschung dieser Daten zu verlangen</li>
            <li>eine Einschränkung der Datenverarbeitung zu verlangen</li>
            <li>der Datenverarbeitung zu widersprechen</li>
            <li>sich bei einer Aufsichtsbehörde zu beschweren</li>
        </ul>
        
        <p>
            Da diese Anwendung keine personenbezogenen Daten dauerhaft speichert, sind die meisten dieser Rechte 
            durch die Architektur der Anwendung bereits gewährleistet.
        </p>
        
        <h2>6. Browser-Einstellungen und Kamera-Berechtigung</h2>
        
        <p>
            Sie können die Kamera-Berechtigung jederzeit in Ihren Browser-Einstellungen widerrufen. Die Anwendung 
            funktioniert ohne Kamerazugriff nicht, respektiert aber Ihre Entscheidung vollständig.
        </p>
        
        <h2>7. Kontakt</h2>
        
        <p>
            Bei Fragen zum Datenschutz können Sie sich jederzeit an uns wenden:
        </p>
        <p>
            E-Mail: yannickschaefer@boomapps.de<br>
            Die Kontaktdaten finden Sie im Impressum.
        </p>
        
        <p><em>Stand: Januar 2025</em></p>
    `;
}

// Starte die App, sobald das gesamte HTML-Dokument geladen ist
document.addEventListener('DOMContentLoaded', app);
