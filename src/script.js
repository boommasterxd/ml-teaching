/**
 * The Teachable Machine - A Browser-Based Machine Learning Application
 * 
 * This application allows users to create and train their own machine learning models
 * for image classification directly in their web browser using TensorFlow.js and MobileNet.
 * All processing happens locally - no data is sent to external servers.
 * 
 * Key Features:
 * - Real-time camera input
 * - Multiple class training
 * - Local image processing
 * - Camera switching (front/back)
 * - Responsive UI with touch support
 * 
 * Dependencies:
 * - TensorFlow.js
 * - MobileNet pre-trained model
 * - KNN Classifier
 * 
 * This project is inspired by Google's Teachable Machine and aims to provide a similar
 * user-friendly interface for training machine learning models in the browser.
 * 
 * See the README for more details on setup and usage.
 * 
 * @author Yannick Schäfer
 * @version 1.0.0
 */

// Global Application State
const classifier = knnClassifier.create();
let net;
let mediaStream = null;
let isPredicting = false;
let isCapturing = false;
let classNames = [];
let allClassExamples = [];
let currentFacingMode = 'user';
let availableCameras = [];
let isSwitchingCamera = false;

/**
 * Utility function to create HTML elements with optional properties
 * 
 * @param {string} tag - HTML tag name
 * @param {Array} classes - Array of CSS classes to add
 * @param {string} id - Element ID
 * @param {string} textContent - Text content for the element
 * @param {string} innerHTML - HTML content for the element
 * @returns {HTMLElement} Created DOM element
 */
function createElement(tag, classes = [], id = '', textContent = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (classes.length > 0) element.classList.add(...classes);
    if (id) element.id = id;
    if (textContent) element.textContent = textContent;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

/**
 * Updates scroll behavior for image previews based on the number of images
 * Enables scrolling when there are more than 20 images (approximately 3 rows)
 * 
 * @param {number} classId - The class identifier
 */
function updateScrollBehavior(classId) {
    const previewsDiv = document.getElementById(`class-${classId}-previews`);
    if (!previewsDiv) return;
    
    const imageCount = allClassExamples[classId] ? allClassExamples[classId].length : 0;
    if (imageCount > 20) {
        previewsDiv.classList.add('scrollable');
    } else {
        previewsDiv.classList.remove('scrollable');
    }
}

/**
 * Detects and stores available camera devices
 * Updates UI button visibility based on camera availability
 * 
 * @returns {Promise<boolean>} True if multiple cameras are available
 */
async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter(device => device.kind === 'videoinput');
        console.log('Available cameras:', availableCameras.length);
        
        updateCameraSwitchButtonVisibility(availableCameras.length > 1);
        
        return availableCameras.length > 1;
    } catch (error) {
        console.error('Error detecting available cameras:', error);
        updateCameraSwitchButtonVisibility(false);
        return false;
    }
}

/**
 * Updates visibility of camera switch buttons based on camera availability
 * Shows buttons only when multiple cameras are detected
 * 
 * @param {boolean} hasMultipleCameras - Whether multiple cameras are available
 */
function updateCameraSwitchButtonVisibility(hasMultipleCameras) {
    const switchButton = document.getElementById('camera-switch-btn');
    if (switchButton) {
        switchButton.style.display = hasMultipleCameras ? 'flex' : 'none';
    }
    
    const classButtons = document.querySelectorAll('[id^="camera-switch-btn-"]');
    classButtons.forEach(button => {
        button.style.display = hasMultipleCameras ? 'flex' : 'none';
    });
}

/**
 * Updates all camera switch event listeners based on current camera availability
 * Refreshes listeners when camera configuration changes
 */
async function updateAllCameraSwitchListeners() {
    const hasMultipleCameras = await getAvailableCameras();
    
    const allVideos = document.querySelectorAll('video[data-camera-switch-listener]');
    allVideos.forEach(video => {
        video.removeAttribute('data-camera-switch-listener');
    });
    
    const mainWebcam = document.getElementById('webcam');
    if (mainWebcam) {
        await addCameraSwitchListener(mainWebcam);
    }
    
    const previewVideos = document.querySelectorAll('[id^="webcam-preview-"]');
    for (const video of previewVideos) {
        await addCameraSwitchListener(video);
    }
}

/**
 * Switches between front and back camera with smooth animation
 * Prevents multiple simultaneous camera switches and handles errors gracefully
 * Temporarily pauses prediction during switch to avoid conflicts
 */
async function switchCamera() {
    if (isSwitchingCamera) {
        console.log('Camera switch already in progress - call ignored');
        return;
    }
    
    try {
        isSwitchingCamera = true;
        const wasPredicting = isPredicting;
        
        if (wasPredicting) {
            isPredicting = false;
            console.log('Prediction temporarily stopped for camera switch');
        }
        
        const allVideos = document.querySelectorAll('video');
        const switchButton = document.getElementById('camera-switch-btn');
        
        allVideos.forEach(video => {
            video.classList.add('camera-switching');
        });
        
        if (switchButton) {
            switchButton.classList.add('switching');
        }
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }

        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        console.log('Switching to camera:', currentFacingMode === 'user' ? 'Front camera' : 'Back camera');

        await setupWebcamWithFacingMode(currentFacingMode);
        
        await new Promise(resolve => setTimeout(resolve, 650));
        
        allVideos.forEach(video => {
            video.classList.remove('camera-switching');
        });
        
        if (switchButton) {
            switchButton.classList.remove('switching');
        }
        
        if (wasPredicting) {
            setTimeout(() => {
                isPredicting = true;
                console.log('Prediction restarted after camera switch');
                requestAnimationFrame(predictLoop);
            }, 200);
        }
        
        console.log('Camera successfully switched to:', currentFacingMode === 'user' ? 'Front camera' : 'Back camera');
    } catch (error) {
        console.error('Error switching camera:', error);
        
        const allVideos = document.querySelectorAll('video');
        const switchButton = document.getElementById('camera-switch-btn');
        
        allVideos.forEach(video => {
            video.classList.remove('camera-switching');
        });
        
        if (switchButton) {
            switchButton.classList.remove('switching');
        }
        
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        try {
            await setupWebcamWithFacingMode(currentFacingMode);
            if (isPredicting === false) {
                setTimeout(() => {
                    isPredicting = true;
                    requestAnimationFrame(predictLoop);
                }, 200);
            }
        } catch (fallbackError) {
            console.error('Error reverting to original camera:', fallbackError);
        }
    } finally {
        isSwitchingCamera = false;
    }
}

/**
 * Sets up webcam with specified facing mode (front or back camera)
 * Configures media constraints and initializes video stream
 * 
 * @param {string} facingMode - Camera facing mode ('user' for front, 'environment' for back)
 * @returns {Promise<HTMLVideoElement>} The main webcam video element
 */
async function setupWebcamWithFacingMode(facingMode = 'user') {
    try {
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`Webcam stream with ${facingMode === 'user' ? 'front camera' : 'back camera'} successfully obtained.`);

        await updateAllVideoElements();

        return document.getElementById('webcam');
    } catch (error) {
        console.error('Error starting camera with facing mode:', error);
        throw error;
    }
}

/**
 * Updates all video elements with the new media stream
 * Preserves video dimensions and adds necessary event listeners
 * Temporarily pauses prediction during stream updates
 */
async function updateAllVideoElements() {
    const mainWebcam = document.getElementById('webcam');
    const wasPredicting = isPredicting;
    
    if (wasPredicting) {
        isPredicting = false;
    }
    
    if (mainWebcam && mediaStream) {
        const currentWidth = mainWebcam.style.width || mainWebcam.offsetWidth;
        const currentHeight = mainWebcam.style.height || mainWebcam.offsetHeight;
        
        mainWebcam.srcObject = mediaStream;
        await new Promise((resolve, reject) => {
            mainWebcam.onloadedmetadata = async () => {
                try {
                    await mainWebcam.play();
                    
                    if (currentWidth && currentHeight) {
                        mainWebcam.style.width = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth;
                        mainWebcam.style.height = typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight;
                    }
                    
                    console.log('Main webcam stream updated and playing.');
                    
                    await addCameraSwitchListener(mainWebcam);
                    
                    resolve(mainWebcam);
                } catch (error) {
                    console.error('Error playing webcam:', error);
                    reject(error);
                }
            };
            mainWebcam.onerror = (err) => {
                console.error('Webcam metadata error:', err);
                reject(new Error('Error loading webcam metadata.'));
            }
        });
    }

    const previewVideos = document.querySelectorAll('[id^="webcam-preview-"]');
    for (const video of previewVideos) {
        if (mediaStream) {
            const currentWidth = video.style.width || video.offsetWidth;
            const currentHeight = video.style.height || video.offsetHeight;
            
            video.srcObject = mediaStream;
            try {
                await video.play();
                
                if (currentWidth && currentHeight) {
                    video.style.width = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth;
                    video.style.height = typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight;
                }
            } catch (error) {
                console.error('Error playing preview video:', error);
            }
            await addCameraSwitchListener(video);
        }
    }
    
    console.log('All video elements have been updated');
}

/**
 * Adds double-click event listeners to video elements for camera switching
 * Only adds listeners when multiple cameras are available
 * Provides visual feedback with cursor styles and tooltips
 * 
 * @param {HTMLVideoElement} videoElement - Video element to add listener to
 */
async function addCameraSwitchListener(videoElement) {
    if (videoElement.hasAttribute('data-camera-switch-listener')) {
        return;
    }
    
    const hasMultipleCameras = await getAvailableCameras();
    
    if (hasMultipleCameras) {
        videoElement.addEventListener('dblclick', async (e) => {
            e.preventDefault();
            await switchCamera();
        });
        
        videoElement.style.cursor = 'pointer';
        videoElement.title = 'Doppelklick um zwischen Kameras zu wechseln';
    } else {
        videoElement.style.cursor = 'default';
        videoElement.title = '';
    }
    
    videoElement.setAttribute('data-camera-switch-listener', 'true');
}

/**
 * Initializes the webcam with the current facing mode
 * Sets up camera detection and switch button event listeners
 * 
 * @returns {Promise<HTMLVideoElement>} The webcam video element
 */
async function setupWebcam() {
    try {
        const webcamElement = await setupWebcamWithFacingMode(currentFacingMode);
        
        await getAvailableCameras();
        
        const switchButton = document.getElementById('camera-switch-btn');
        if (switchButton && !switchButton.hasAttribute('data-listener-added')) {
            switchButton.addEventListener('click', async () => {
                switchButton.classList.add('clicked');
                
                setTimeout(() => {
                    switchButton.classList.remove('clicked');
                }, 600);
                
                await switchCamera();
            });
            switchButton.setAttribute('data-listener-added', 'true');
        }
        
        return webcamElement;
    } catch (error) {
        console.error('Error starting camera:', error);
        throw error;
    }
}

/**
 * Creates a new class card with webcam preview and capture functionality
 * Includes camera switching, touch support, and image management
 * Ensures webcam is ready before allowing class creation
 * 
 * @param {string} initialName - Initial name for the class (optional)
 */
async function addNewClassCard(initialName = '') {
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
    
    const cameraSwitchButton = createElement('button', ['camera-switch-button', 'bottom-right'], `camera-switch-btn-${classId}`);
    cameraSwitchButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    cameraSwitchButton.title = 'Kamera wechseln';
    cameraSwitchButton.style.display = 'none'; 
    
    cameraSwitchButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        cameraSwitchButton.classList.add('clicked');
        
        setTimeout(() => {
            cameraSwitchButton.classList.remove('clicked');
        }, 600);
        
        switchCamera();
    });
    
    webcamPreviewDiv.appendChild(webcamPreviewVideo);
    webcamPreviewDiv.appendChild(cameraSwitchButton);
    classCard.appendChild(webcamPreviewDiv);

    const inputGroup = createElement('div', ['input-group']);
    const webcamButton = createElement('button', [], `add-class-${classId}`);
    webcamButton.innerHTML = '<i class="fas fa-camera"></i> Bild aufnehmen';
    
    const applyActiveStyle = (btn) => {
        btn.style.backgroundColor = 'var(--primary-color-dark)';
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 10px rgba(213, 19, 23, 0.3)';
    };

    const resetStyle = (btn) => {
        btn.style.backgroundColor = 'var(--primary-color)'; 
        btn.style.transform = '';
        btn.style.boxShadow = '';
    };

    webcamButton.addEventListener('mousedown', () => {
        applyActiveStyle(webcamButton);
        startCapturing(classId);
    });
    webcamButton.addEventListener('mouseup', () => {
        resetStyle(webcamButton);
        stopCapturing();
    });
    webcamButton.addEventListener('mouseleave', () => {
        if (isCapturing) {
            resetStyle(webcamButton);
            stopCapturing();
        }
    });
    
    webcamButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
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
        
        await addCameraSwitchListener(webcamPreviewVideo);
        
        const hasMultipleCameras = await getAvailableCameras();
        updateCameraSwitchButtonVisibility(hasMultipleCameras);
    }

    updateTrainButtonState();
    
    if (isPredicting) {
        stopPredictionAndShowRetrain();
    }
}

/**
 * Deletes a class and all associated training data
 * Properly disposes of TensorFlow tensors to prevent memory leaks
 * Updates UI state and stops prediction if active
 * 
 * @param {number} classId - The ID of the class to delete
 */
function deleteClass(classId) {
    console.log('deleteClass called for class:', classId);
    const classCard = document.getElementById(`class-card-${classId}`);
    if (classCard) classCard.remove();
    
    if (allClassExamples[classId]) {
        allClassExamples[classId].forEach(tensor => tensor?.dispose());
    }
    
    classNames[classId] = null;
    allClassExamples[classId] = null;
    
    updateTrainButtonState();
    
    if (isPredicting) {
        stopPredictionAndShowRetrain();
    } else {
        updatePredictionDisplay();
    }
    
    if (classifier.getNumClasses() > 0) {
        classifier.clearAllClasses();
        const status = document.getElementById('training-status');
        if(status) status.textContent = 'Klasse gelöscht. Bitte trainiere das Modell erneut.';
    }
    console.log('Class successfully deleted');
}

/**
 * Asynchronous image capture loop that doesn't block the UI
 * Captures images from webcam feed and processes them with MobileNet
 * Creates canvas previews and manages training data
 * 
 * @param {number} classId - The class ID to capture images for
 */
async function captureLoop(classId) {
    if (!isCapturing) return;

    const videoElement = document.getElementById('webcam');
    if (!videoElement || !videoElement.srcObject || videoElement.paused || videoElement.ended) {
        requestAnimationFrame(() => captureLoop(classId));
        return;
    }
    
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
        
        const imageIndex = allClassExamples[classId].length - 1;
        
        canvas.addEventListener('click', () => {
            openImageModal(canvas, classId, imageIndex);
        });
        
        const previewsDiv = document.getElementById(`class-${classId}-previews`);
        if (previewsDiv) previewsDiv.appendChild(canvas);

        const countSpan = document.getElementById(`class-${classId}-count`);
        if (countSpan) countSpan.textContent = `${allClassExamples[classId].length} Bilder`;
        
        updateScrollBehavior(classId);
        
        updateTrainButtonState();
    } catch (error) {
        console.error('Error in captureLoop:', error);
    } finally {
        img?.dispose();
    }

    if (isCapturing) {
        requestAnimationFrame(() => captureLoop(classId));
    }
}

/**
 * Starts the image capture process for a specific class
 * Disables train button during capture to prevent conflicts
 * 
 * @param {number} classId - The class ID to start capturing for
 */
function startCapturing(classId) {
    isCapturing = true;
    document.getElementById('train-model').disabled = true;
    captureLoop(classId);
}

/**
 * Stops the image capture process
 * Re-enables UI elements and updates button states
 */
function stopCapturing() {
    isCapturing = false;
    updateTrainButtonState();
}

/**
 * Deletes a single image from a class
 * Properly manages tensor disposal and updates image indices
 * Triggers model retraining requirement notification
 * 
 * @param {number} classId - The class ID containing the image
 * @param {number} imageIndex - Index of the image to delete
 * @param {HTMLCanvasElement} canvasElement - Canvas element to remove
 */
function deleteImage(classId, imageIndex, canvasElement) {
    if (allClassExamples[classId][imageIndex]) {
        allClassExamples[classId][imageIndex].dispose();
    }
    
    allClassExamples[classId].splice(imageIndex, 1);
    
    canvasElement.remove();
    
    const countSpan = document.getElementById(`class-${classId}-count`);
    if (countSpan) countSpan.textContent = `${allClassExamples[classId].length} Bilder`;
    
    updateImageIndices(classId);
    
    updateScrollBehavior(classId);
    
    updateTrainButtonState();
    
    if (classifier.getNumClasses() > 0) {
        if (isPredicting) {
            stopPredictionAndShowRetrain();
        } else {
            updatePredictionDisplay();
        }
        const status = document.getElementById('training-status');
        if(status) status.textContent = 'Bild entfernt. Bitte trainiere das Modell erneut.';
    }
}

/**
 * Updates image indices after deletion to maintain proper event listeners
 * Recreates canvas elements with correct click handlers
 * 
 * @param {number} classId - The class ID to update indices for
 */
function updateImageIndices(classId) {
    const previewsDiv = document.getElementById(`class-${classId}-previews`);
    if (!previewsDiv) return;
    
    const canvases = previewsDiv.querySelectorAll('canvas');
    canvases.forEach((canvas, newIndex) => {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        
        const ctx = newCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        
        newCanvas.className = canvas.className;
        
        newCanvas.addEventListener('click', () => {
            openImageModal(newCanvas, classId, newIndex);
        });
        
        canvas.parentNode.replaceChild(newCanvas, canvas);
    });
}

/**
 * Opens the image preview modal for detailed view and deletion
 * Sets up modal content and event handlers
 * 
 * @param {HTMLCanvasElement} sourceCanvas - Canvas element containing the image
 * @param {number} classId - The class ID of the image
 * @param {number} imageIndex - Index of the image in the class
 */
function openImageModal(sourceCanvas, classId, imageIndex) {
    const modal = document.getElementById('image-modal');
    const modalCanvas = document.getElementById('modal-canvas');
    const deleteButton = document.getElementById('modal-delete');
    
    const ctx = modalCanvas.getContext('2d');
    modalCanvas.width = sourceCanvas.width;
    modalCanvas.height = sourceCanvas.height;
    ctx.drawImage(sourceCanvas, 0, 0);
    
    const newDeleteButton = deleteButton.cloneNode(true);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
    
    newDeleteButton.addEventListener('click', () => {
        closeImageModal();
        deleteImage(classId, imageIndex, sourceCanvas);
    });
    
    modal.style.display = 'flex';
}

/**
 * Closes the image preview modal
 */
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}

/**
 * Updates the state of the train button based on current conditions
 * Requires at least 2 active classes with minimum 10 images each
 * Prevents state changes during active image capture
 */
function updateTrainButtonState() {
    if (isCapturing) return;
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

/**
 * Asynchronous model training that doesn't block the UI
 * Displays progress feedback and manages classifier state
 * Automatically starts prediction after successful training
 */
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

/**
 * Updates prediction display to show placeholder when no model is trained
 * Resets prediction state and hides preview elements
 */
function updatePredictionDisplay() {
    const predictionResults = document.getElementById('prediction-results');
    const previewCard = document.getElementById('preview-card');
    if (!predictionResults || !previewCard) return;

    isPredicting = false;
    previewCard.style.display = 'none';
    predictionResults.innerHTML = '<p class="placeholder-text">Trainiere das Modell, um Ergebnisse zu sehen!</p>';
}

/**
 * Stops prediction and displays retrain warning message
 * Called when classes are modified and model needs retraining
 */
function stopPredictionAndShowRetrain() {
    if (isPredicting) {
        isPredicting = false;
        
        const predictionResults = document.getElementById('prediction-results');
        const previewCard = document.getElementById('preview-card');
        
        if (predictionResults && previewCard) {
            // Zeige Hinweistext an
            predictionResults.innerHTML = '<p class="retrain-warning">Klassen wurden geändert. Bitte trainiere das Modell erneut, um Vorhersagen zu erhalten!</p>';
            
            console.log('Prediction stopped - classes were modified');
        }
    }
}

/**
 * Starts the prediction process after successful model training
 * Sets up UI elements and initializes the prediction loop
 * Creates probability bars for each trained class
 */
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

/**
 * Main prediction loop that runs real-time classification
 * Processes webcam frames and updates probability displays
 * Includes confidence threshold to filter low-confidence predictions
 */
async function predictLoop() {
    if (!isPredicting) return;

    let img;
    try {
        const videoElement = document.getElementById('webcam');
        
        if (!videoElement || !videoElement.srcObject || videoElement.paused || videoElement.ended) {
            requestAnimationFrame(predictLoop);
            return;
        }
        
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
        console.error('Error in predictLoop:', error);
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
    
    if (isPredicting) {
        requestAnimationFrame(predictLoop);
    }
}

/**
 * Main application initialization function
 * Handles parallel loading of webcam and MobileNet model
 * Manages loading UI states and error handling
 * Sets up all application event listeners
 */
async function app() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const cameraStep = document.getElementById('loading-step-camera');
    const modelStep = document.getElementById('loading-step-model');

    const updateStep = (stepElement, success, message = '') => {
        const icon = stepElement.querySelector('i');
        if (success) {
            icon.classList.remove('fa-spinner', 'fa-spin');
            icon.classList.add('fa-check-circle');
            stepElement.classList.add('completed');
        } else {
            icon.classList.remove('fa-spinner', 'fa-spin');
            icon.classList.add('fa-times-circle');
            stepElement.classList.add('failed');
            if (message) {
                const errorSpan = createElement('span', ['error-message'], '', message);
                stepElement.appendChild(errorSpan);
            }
        }
    };

    const webcamPromise = setupWebcam()
        .then(webcamResult => {
            updateStep(cameraStep, true);
            return webcamResult;
        })
        .catch(err => {
            updateStep(cameraStep, false, 'Zugriff verweigert oder Kamera nicht gefunden.');
            throw err; // Wichtig: Fehler weiterwerfen, damit Promise.all fehlschlägt
        });

    const modelPromise = mobilenet.load({ version: 2, alpha: 1.0 })
        .then(loadedNet => {
            updateStep(modelStep, true);
            return loadedNet;
        })
        .catch(err => {
            updateStep(modelStep, false, 'Netzwerkfehler beim Laden des Modells.');
            throw err; // Fehler weiterwerfen
        });

    try {
        const [webcamResult, loadedNet] = await Promise.all([webcamPromise, modelPromise]);
        
        net = loadedNet;
        console.log('MobileNet and camera successfully loaded. Starting app.');

        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.addEventListener('transitionend', () => {
                loadingOverlay.classList.add('hidden');
            });
            
            header.classList.remove('hidden');
            mainContent.classList.remove('hidden');
        }, 500);

    } catch (error) {
        console.error("Initialization failed:", error);
    }

    document.getElementById('add-new-class').addEventListener('click', () => addNewClassCard());
    document.getElementById('train-model').addEventListener('click', trainModel);
    
    document.getElementById('modal-close').addEventListener('click', closeImageModal);
    document.getElementById('image-modal').addEventListener('click', (e) => {
        if (e.target.id === 'image-modal') {
            closeImageModal();
        }
    });
    
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
        if (e.target.id === 'legal-modal') {
            closeLegalModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
            closeLegalModal();
        }
    });
}

/**
 * Legal Modal Management Functions
 * Handles display of legal information (Impressum and Privacy Policy)
 */

/**
 * Opens the legal modal with specified content type
 * Prevents background scrolling while modal is open
 * 
 * @param {string} type - Content type ('impressum' or 'datenschutz')
 */
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
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the legal modal and restores background scrolling
 */
function closeLegalModal() {
    const modal = document.getElementById('legal-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Returns the German legal imprint content
 * @returns {string} HTML content for Impressum
 */
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

/**
 * Returns the German privacy policy content
 * Comprehensive privacy documentation for local data processing
 * 
 * @returns {string} HTML content for privacy policy
 */
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

/**
 * Application Entry Point
 * Starts the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', app);
