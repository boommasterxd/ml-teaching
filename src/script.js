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
let classifier;
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
        const allSwitchButtons = document.querySelectorAll('.camera-switch-button');

        allVideos.forEach(video => {
            video.classList.add('camera-switching');
        });

        allSwitchButtons.forEach(button => {
            button.classList.add('switching');
        });

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

        allSwitchButtons.forEach(button => {
            button.classList.remove('switching');
        });

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
        const allSwitchButtons = document.querySelectorAll('.camera-switch-button');

        allVideos.forEach(video => {
            video.classList.remove('camera-switching');
        });

        allSwitchButtons.forEach(button => {
            button.classList.remove('switching');
        });

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
        const computedStyle = window.getComputedStyle(mainWebcam);
        const currentWidth = mainWebcam.style.width || computedStyle.width;
        const currentHeight = mainWebcam.style.height || computedStyle.height;
        
        const absoluteWidth = parseInt(currentWidth) + 'px';
        const absoluteHeight = parseInt(currentHeight) + 'px';

        mainWebcam.srcObject = mediaStream;
        await new Promise((resolve, reject) => {
            mainWebcam.onloadedmetadata = async () => {
                try {
                    await mainWebcam.play();

                    if (absoluteWidth && absoluteHeight && parseInt(absoluteWidth) > 0 && parseInt(absoluteHeight) > 0) {
                        mainWebcam.style.width = absoluteWidth;
                        mainWebcam.style.height = absoluteHeight;
                        mainWebcam.style.objectFit = 'cover';
                        mainWebcam.style.maxWidth = 'none';
                        mainWebcam.style.minWidth = 'unset';
                        mainWebcam.style.minHeight = 'unset';
                    }

                    console.log('Main webcam stream updated and playing with preserved dimensions:', absoluteWidth, absoluteHeight);

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
            const computedStyle = window.getComputedStyle(video);
            const currentWidth = video.style.width || computedStyle.width;
            const currentHeight = video.style.height || computedStyle.height;
            
            const absoluteWidth = parseInt(currentWidth) + 'px';
            const absoluteHeight = parseInt(currentHeight) + 'px';

            video.srcObject = mediaStream;
            try {
                await video.play();

                if (absoluteWidth && absoluteHeight && parseInt(absoluteWidth) > 0 && parseInt(absoluteHeight) > 0) {
                    video.style.width = absoluteWidth;
                    video.style.height = absoluteHeight;
                    video.style.objectFit = 'cover';
                    video.style.maxWidth = 'none';
                    video.style.minWidth = 'unset';
                    video.style.minHeight = 'unset';
                    video.style.aspectRatio = 'unset';
                }
                
                console.log('Preview video updated with preserved dimensions:', absoluteWidth, absoluteHeight);
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
        if (status) status.textContent = 'Klasse gelöscht. Bitte trainiere das Modell erneut.';
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
        if (status) status.textContent = 'Bild entfernt. Bitte trainiere das Modell erneut.';
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
    if (modal) {
        modal.style.display = 'none';
    }
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
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModalClose = document.getElementById('legal-modal-close');
    const legalModal = document.getElementById('legal-modal');

    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('impressum');
        });
    }

    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('datenschutz');
        });
    }

    if (legalModalClose) {
        legalModalClose.addEventListener('click', closeLegalModal);
    }

    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target.id === 'legal-modal') {
                closeLegalModal();
            }
        });
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        classifier = knnClassifier.create();
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
                throw err; 
            });

        const modelPromise = mobilenet.load({ version: 2, alpha: 1.0 })
            .then(loadedNet => {
                updateStep(modelStep, true);
                return loadedNet;
            })
            .catch(err => {
                updateStep(modelStep, false, 'Netzwerkfehler beim Laden des Modells.');
                throw err; 
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

        const modalClose = document.getElementById('modal-close');
        if(modalClose) modalClose.addEventListener('click', closeImageModal);
        
        const imageModal = document.getElementById('image-modal');
        if(imageModal) imageModal.addEventListener('click', (e) => {
            if (e.target.id === 'image-modal') {
                closeImageModal();
            }
        });
    }

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
            <p>
                <strong>Externe Dienste:</strong> Die Website nutzt Cloudflare für Performance und Sicherheit, 
                IONOS für Hosting und lädt KI-Bibliotheken von CDNs. Kameradaten und Trainingsbilder 
                verlassen niemals Ihren Browser.
            </p>
        </div>
        
        <h2>1. Datenschutz auf einen Blick</h2>
        <h3>Allgemeine Hinweise</h3> <p>Die folgenden Hinweise geben einen einfachen &Uuml;berblick dar&uuml;ber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen. Ausf&uuml;hrliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgef&uuml;hrten Datenschutzerkl&auml;rung.</p>
        <h3>Datenerfassung auf dieser Website</h3> <h4>Wer ist verantwortlich f&uuml;r die Datenerfassung auf dieser Website?</h4> <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten k&ouml;nnen Sie dem Abschnitt &bdquo;Hinweis zur Verantwortlichen Stelle&ldquo; in dieser Datenschutzerkl&auml;rung entnehmen.</p> <h4>Wie erfassen wir Ihre Daten?</h4> <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.&nbsp;B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p> <p>Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.</p> <h4>Wof&uuml;r nutzen wir Ihre Daten?</h4> <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gew&auml;hrleisten. Andere Daten k&ouml;nnen zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern &uuml;ber die Website Vertr&auml;ge geschlossen oder angebahnt werden k&ouml;nnen, werden die &uuml;bermittelten Daten auch f&uuml;r Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.</p> <h4>Welche Rechte haben Sie bez&uuml;glich Ihrer Daten?</h4> <p>Sie haben jederzeit das Recht, unentgeltlich Auskunft &uuml;ber Herkunft, Empf&auml;nger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben au&szlig;erdem ein Recht, die Berichtigung oder L&ouml;schung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, k&ouml;nnen Sie diese Einwilligung jederzeit f&uuml;r die Zukunft widerrufen. Au&szlig;erdem haben Sie das Recht, unter bestimmten Umst&auml;nden die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zust&auml;ndigen Aufsichtsbeh&ouml;rde zu.</p> <p>Hierzu sowie zu weiteren Fragen zum Thema Datenschutz k&ouml;nnen Sie sich jederzeit an uns wenden.</p>
        <h2>2. Hosting</h2>
        <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
        <h3>IONOS</h3> <p>Anbieter ist die IONOS SE, Elgendorfer Str. 57, 56410 Montabaur (nachfolgend IONOS). Wenn Sie unsere Website besuchen, erfasst IONOS verschiedene Logfiles inklusive Ihrer IP-Adressen. Details entnehmen Sie der Datenschutzerkl&auml;rung von IONOS: <a href="https://www.ionos.de/terms-gtc/terms-privacy" target="_blank" rel="noopener noreferrer">https://www.ionos.de/terms-gtc/terms-privacy</a>.</p> <p>Die Verwendung von IONOS erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer m&ouml;glichst zuverl&auml;ssigen Darstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und &sect; 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endger&auml;t des Nutzers (z.&nbsp;B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.</p>

        <h4>Auftragsverarbeitung</h4> <p>Wir haben einen Vertrag &uuml;ber Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gew&auml;hrleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.</p>

        <h3>Cloudflare</h3>
        <p>Wir nutzen den Service von Cloudflare. Anbieter ist die Cloudflare Inc., 101 Townsend St., San Francisco, CA 94107, USA (nachfolgend „Cloudflare").</p>
        <p>Cloudflare bietet ein weltweit verteiltes Content Delivery Network mit DNS an. Dabei wird technisch der Informationstransfer zwischen Ihrem Browser und unserer Website über das Netzwerk von Cloudflare geleitet. Das versetzt Cloudflare in die Lage, den Datenverkehr zwischen Ihrem Browser und unserer Website zu analysieren und als Filter zwischen unseren Servern und potenziell bösartigem Datenverkehr aus dem Internet zu dienen. Hierbei kann Cloudflare auch Cookies oder sonstige Technologien zur Wiedererkennung von Internetnutzern einsetzen, die jedoch allein zum hier beschriebenen Zweck verwendet werden.</p>
        <p>Die Verwendung von Cloudflare beruht auf unserem berechtigten Interesse an einer möglichst fehlerfreien und sicheren Bereitstellung unseres Webangebotes (Art. 6 Abs. 1 lit. f DSGVO).</p>
        <p>Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt. Details finden Sie hier: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a>.</p>
        <p>Weitere Informationen zum Datenschutz bei Cloudflare finden Sie unter: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a>.</p>

        <h2>3. Allgemeine Hinweise und Pflicht&shy;informationen</h2>
        <h3>Datenschutz</h3> <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer pers&ouml;nlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerkl&auml;rung.</p> <p>Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen. Die vorliegende Datenschutzerkl&auml;rung erl&auml;utert, welche Daten wir erheben und wof&uuml;r wir sie nutzen. Sie erl&auml;utert auch, wie und zu welchem Zweck das geschieht.</p> <p>Wir weisen darauf hin, dass die Daten&uuml;bertragung im Internet (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitsl&uuml;cken aufweisen kann. Ein l&uuml;ckenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht m&ouml;glich.</p>
        <h3>Hinweis zur verantwortlichen Stelle</h3> <p>Die verantwortliche Stelle f&uuml;r die Datenverarbeitung auf dieser Website ist:</p> <p>Yannick Sch&auml;fer<br />
        Am M&auml;uerchen 12,<br />
        67591 M&ouml;lsheim</p>

        <p>Telefon: +49 (0) 1575 7934851<br />
        E-Mail: yannickschaefer@boomapps.de</p>
        <p>Verantwortliche Stelle ist die nat&uuml;rliche oder juristische Person, die allein oder gemeinsam mit anderen &uuml;ber die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen, E-Mail-Adressen o. &Auml;.) entscheidet.</p>

        <h3>Speicherdauer</h3> <p>Soweit innerhalb dieser Datenschutzerkl&auml;rung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck f&uuml;r die Datenverarbeitung entf&auml;llt. Wenn Sie ein berechtigtes L&ouml;schersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gel&ouml;scht, sofern wir keine anderen rechtlich zul&auml;ssigen Gr&uuml;nde f&uuml;r die Speicherung Ihrer personenbezogenen Daten haben (z.&nbsp;B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die L&ouml;schung nach Fortfall dieser Gr&uuml;nde.</p>
        <h3>Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</h3> <p>Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer ausdr&uuml;cklichen Einwilligung in die &Uuml;bertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung au&szlig;erdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen in Ihr Endger&auml;t (z.&nbsp;B. via Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zus&auml;tzlich auf Grundlage von &sect; 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserf&uuml;llung oder zur Durchf&uuml;hrung vorvertraglicher Ma&szlig;nahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erf&uuml;llung einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. &Uuml;ber die jeweils im Einzelfall einschl&auml;gigen Rechtsgrundlagen wird in den folgenden Abs&auml;tzen dieser Datenschutzerkl&auml;rung informiert.</p>
        <h3>Empf&auml;nger von personenbezogenen Daten</h3> <p>Im Rahmen unserer Gesch&auml;ftst&auml;tigkeit arbeiten wir mit verschiedenen externen Stellen zusammen. Dabei ist teilweise auch eine &Uuml;bermittlung von personenbezogenen Daten an diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an externe Stellen weiter, wenn dies im Rahmen einer Vertragserf&uuml;llung erforderlich ist, wenn wir gesetzlich hierzu verpflichtet sind (z.&nbsp;B. Weitergabe von Daten an Steuerbeh&ouml;rden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten unserer Kunden nur auf Grundlage eines g&uuml;ltigen Vertrags &uuml;ber Auftragsverarbeitung weiter. Im Falle einer gemeinsamen Verarbeitung wird ein Vertrag &uuml;ber gemeinsame Verarbeitung geschlossen.</p>
        <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3> <p>Viele Datenverarbeitungsvorg&auml;nge sind nur mit Ihrer ausdr&uuml;cklichen Einwilligung m&ouml;glich. Sie k&ouml;nnen eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtm&auml;&szlig;igkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unber&uuml;hrt.</p>
        <h3>Widerspruchsrecht gegen die Datenerhebung in besonderen F&auml;llen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3> <p>WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GR&Uuml;NDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH F&Uuml;R EIN AUF DIESE BESTIMMUNGEN GEST&Uuml;TZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER DATENSCHUTZERKL&Auml;RUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR K&Ouml;NNEN ZWINGENDE SCHUTZW&Uuml;RDIGE GR&Uuml;NDE F&Uuml;R DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN &Uuml;BERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUS&Uuml;BUNG ODER VERTEIDIGUNG VON RECHTSANSPR&Uuml;CHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).</p> <p>WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH F&Uuml;R DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).</p>
        <h3>Beschwerde&shy;recht bei der zust&auml;ndigen Aufsichts&shy;beh&ouml;rde</h3> <p>Im Falle von Verst&ouml;&szlig;en gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbeh&ouml;rde, insbesondere in dem Mitgliedstaat ihres gew&ouml;hnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutma&szlig;lichen Versto&szlig;es zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.</p>
        <h3>Recht auf Daten&shy;&uuml;bertrag&shy;barkeit</h3> <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erf&uuml;llung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem g&auml;ngigen, maschinenlesbaren Format aush&auml;ndigen zu lassen. Sofern Sie die direkte &Uuml;bertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.</p>
        <h3>Auskunft, Berichtigung und L&ouml;schung</h3> <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft &uuml;ber Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empf&auml;nger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder L&ouml;schung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten k&ouml;nnen Sie sich jederzeit an uns wenden.</p>
        <h3>Recht auf Einschr&auml;nkung der Verarbeitung</h3> <p>Sie haben das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu k&ouml;nnen Sie sich jederzeit an uns wenden. Das Recht auf Einschr&auml;nkung der Verarbeitung besteht in folgenden F&auml;llen:</p> <ul> <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, ben&ouml;tigen wir in der Regel Zeit, um dies zu &uuml;berpr&uuml;fen. F&uuml;r die Dauer der Pr&uuml;fung haben Sie das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li> <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtm&auml;&szlig;ig geschah/geschieht, k&ouml;nnen Sie statt der L&ouml;schung die Einschr&auml;nkung der Datenverarbeitung verlangen.</li> <li>Wenn wir Ihre personenbezogenen Daten nicht mehr ben&ouml;tigen, Sie sie jedoch zur Aus&uuml;bung, Verteidigung oder Geltendmachung von Rechtsanspr&uuml;chen ben&ouml;tigen, haben Sie das Recht, statt der L&ouml;schung die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li> <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abw&auml;gung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen &uuml;berwiegen, haben Sie das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li> </ul> <p>Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschr&auml;nkt haben, d&uuml;rfen diese Daten &ndash; von ihrer Speicherung abgesehen &ndash; nur mit Ihrer Einwilligung oder zur Geltendmachung, Aus&uuml;bung oder Verteidigung von Rechtsanspr&uuml;chen oder zum Schutz der Rechte einer anderen nat&uuml;rlichen oder juristischen Person oder aus Gr&uuml;nden eines wichtigen &ouml;ffentlichen Interesses der Europ&auml;ischen Union oder eines Mitgliedstaats verarbeitet werden.</p>
        <h3>SSL- bzw. TLS-Verschl&uuml;sselung</h3> <p>Diese Seite nutzt aus Sicherheitsgr&uuml;nden und zum Schutz der &Uuml;bertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschl&uuml;sselung. Eine verschl&uuml;sselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von &bdquo;http://&ldquo; auf &bdquo;https://&ldquo; wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.</p> <p>Wenn die SSL- bzw. TLS-Verschl&uuml;sselung aktiviert ist, k&ouml;nnen die Daten, die Sie an uns &uuml;bermitteln, nicht von Dritten mitgelesen werden.</p>
        <h2>4. Datenerfassung auf dieser Website</h2>
        
        <h3>Kamerazugriff und lokale Bildverarbeitung</h3>
        <p>Diese Anwendung verwendet die Kamera Ihres Geräts, um Bilder für das Training von Machine Learning-Modellen aufzunehmen. Der Kamerazugriff erfolgt ausschließlich nach Ihrer ausdrücklichen Einwilligung und wird über die WebRTC-API Ihres Browsers realisiert.</p>
        <p><strong>Wichtiger Hinweis zum Datenschutz:</strong> Alle aufgenommenen Bilder und Kameradaten werden ausschließlich lokal in Ihrem Browser verarbeitet und gespeichert. Es findet keine Übertragung von Kamerabildern oder persönlichen Daten an unsere Server oder Dritte statt.</p>
        <p>Die Rechtsgrundlage für den Kamerazugriff ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Sie können diese Einwilligung jederzeit in den Browsereinstellungen widerrufen.</p>
        
        <h3>Machine Learning und KI-Modelle</h3>
        <p>Diese Website nutzt verschiedene Machine Learning-Technologien zur Bilderkennung und -klassifikation:</p>
        <ul>
            <li><strong>TensorFlow.js:</strong> Eine JavaScript-Bibliothek für maschinelles Lernen, die direkt in Ihrem Browser ausgeführt wird.</li>
            <li><strong>MobileNet:</strong> Ein vortrainiertes neuronales Netzwerk zur Bilderkennung, das als Basis für die Merkmalserkennung dient.</li>
            <li><strong>KNN-Klassifikator:</strong> Ein k-Nearest-Neighbor-Algorithmus zur Klassifikation Ihrer Trainingsbilder.</li>
        </ul>
        <p><strong>Lokale Verarbeitung:</strong> Alle KI-Modelle werden vollständig lokal in Ihrem Browser ausgeführt. Die Modelle werden über Content Delivery Networks (CDN) geladen, aber alle Berechnungen, Trainings- und Vorhersageprozesse finden ausschließlich auf Ihrem Gerät statt.</p>
        <p><strong>Keine Datenübertragung:</strong> Weder die von Ihnen aufgenommenen Bilder noch die trainierten Modelle oder deren Ergebnisse werden an externe Server übertragen. Alle Daten verbleiben in Ihrem Browser und werden beim Schließen der Anwendung automatisch gelöscht.</p>
        <p>Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO sowie unserem berechtigten Interesse an der Bereitstellung innovativer Bildungstools nach Art. 6 Abs. 1 lit. f DSGVO.</p>

        <h3>Server-Log-Dateien</h3> <p>Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns &uuml;bermittelt. Dies sind:</p> <ul> <li>Browsertyp und Browserversion</li> <li>verwendetes Betriebssystem</li> <li>Referrer URL</li> <li>Hostname des zugreifenden Rechners</li> <li>Uhrzeit der Serveranfrage</li> <li>IP-Adresse</li> </ul> <p>Eine Zusammenf&uuml;hrung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.</p> <p>Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website &ndash; hierzu m&uuml;ssen die Server-Log-Files erfasst werden.</p>
        <h2>5. Analyse-Tools und Werbung</h2>
        <h3>IONOS WebAnalytics</h3> <p>Diese Website nutzt die Analysedienste von IONOS WebAnalytics (im Folgenden: IONOS). Anbieter ist die 1&amp;1 IONOS SE, Elgendorfer Stra&szlig;e 57, D &ndash; 56410 Montabaur. Im Rahmen der Analysen mit IONOS k&ouml;nnen u.&nbsp;a. Besucherzahlen und &ndash;verhalten (z.&nbsp;B. Anzahl der Seitenaufrufe, Dauer eines Webseitenbesuchs, Absprungraten), Besucherquellen (d. h., von welcher Seite der Besucher kommt), Besucherstandorte sowie technische Daten (Browser- und Betriebssystemversionen) analysiert werden. Zu diesem Zweck speichert IONOS insbesondere folgende Daten:</p> <ul> <li>Referrer (zuvor besuchte Webseite)</li> <li>angeforderte Webseite oder Datei</li> <li>Browsertyp und Browserversion</li> <li>verwendetes Betriebssystem</li> <li>verwendeter Ger&auml;tetyp</li> <li>Uhrzeit des Zugriffs</li> <li>IP-Adresse in anonymisierter Form (wird nur zur Feststellung des Orts des Zugriffs verwendet)</li> </ul> <p>Die Datenerfassung erfolgt laut IONOS vollst&auml;ndig anonymisiert, sodass sie nicht zu einzelnen Personen zur&uuml;ckverfolgt werden kann. Cookies werden von IONOS WebAnalytics nicht gespeichert.</p> <p>Die Speicherung und Analyse der Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der statistischen Analyse des Nutzerverhaltens, um sowohl sein Webangebot als auch seine Werbung zu optimieren. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und &sect; 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endger&auml;t des Nutzers (z.&nbsp;B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.</p> <p>Weitere Informationen zur Datenerfassung und Verarbeitung durch IONOS WebAnalytics entnehmen Sie der Datenschutzerklaerung von IONOS unter folgendem Link: <a href="https://www.ionos.de/terms-gtc/datenschutzerklaerung/" target="_blank" rel="noopener noreferrer">https://www.ionos.de/terms-gtc/datenschutzerklaerung/</a></p>

        <h4>Auftragsverarbeitung</h4> <p>Wir haben einen Vertrag &uuml;ber Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gew&auml;hrleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.</p>
        <h2>6. Plugins und Tools</h2>
        <h3>Google Fonts (lokales Hosting)</h3> <p>Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Google Fonts, die von Google bereitgestellt werden. Die Google Fonts sind lokal installiert. Eine Verbindung zu Servern von Google findet dabei nicht statt.</p> <p>Weitere Informationen zu Google Fonts finden Sie unter <a href="https://developers.google.com/fonts/faq" target="_blank" rel="noopener noreferrer">https://developers.google.com/fonts/faq</a> und in der Datenschutzerkl&auml;rung von Google: <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy?hl=de</a>.</p>
        <h3>Font Awesome (lokales Hosting)</h3> <p>Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten Font Awesome. Font Awesome ist lokal installiert. Eine Verbindung zu Servern von Fonticons, Inc. findet dabei nicht statt.</p> <p>Weitere Informationen zu Font Awesome finden Sie in der Datenschutzerkl&auml;rung f&uuml;r Font Awesome unter: <a href="https://fontawesome.com/privacy" target="_blank" rel="noopener noreferrer">https://fontawesome.com/privacy</a>.</p>
        
        <h3>TensorFlow.js und Machine Learning Bibliotheken</h3>
        <p>Diese Website lädt TensorFlow.js und verwandte Machine Learning-Bibliotheken von Content Delivery Networks (CDN). Diese Bibliotheken ermöglichen die lokale Ausführung von KI-Modellen direkt in Ihrem Browser.</p>
        <p><strong>Geladene Bibliotheken über CDN (jsDelivr):</strong></p>
        <ul>
            <li>TensorFlow.js (v4.20.0) - Hauptbibliothek für maschinelles Lernen</li>
            <li>TensorFlow.js Data (v4.20.0) - Datenverarbeitungsbibliothek</li>
            <li>MobileNet (v2.1.0) - Vortrainiertes Bilderkennungsmodell</li>
            <li>KNN-Classifier (v1.2.2) - Klassifikationsalgorithmus</li>
        </ul>
        <p>Beim Laden dieser Bibliotheken von cdn.jsdelivr.net können technische Daten wie Ihre IP-Adresse an jsDelivr übertragen werden. Dies geschieht automatisch beim ersten Besuch der Website und dient ausschließlich der technischen Bereitstellung der erforderlichen JavaScript-Dateien.</p>
        <p>jsDelivr ist ein kostenloses CDN, das von ProspectOne betrieben wird. Weitere Informationen zum Datenschutz finden Sie unter: <a href="https://www.jsdelivr.com/privacy-policy-jsdelivr-net" target="_blank" rel="noopener noreferrer">https://www.jsdelivr.com/privacy-policy-jsdelivr-net</a>.</p>
        <p>Die Verwendung erfolgt auf Grundlage unseres berechtigten Interesses an der Bereitstellung einer funktionsfähigen Webanwendung (Art. 6 Abs. 1 lit. f DSGVO).</p>
        <p>Nach dem Laden werden alle ML-Operationen vollständig lokal in Ihrem Browser ausgeführt, ohne weitere Datenübertragung an externe Server.</p>

        <p>Quelle: <a href="https://www.e-recht24.de">https://www.e-recht24.de</a></p>
    `;
}

/**
 * Application Entry Point
 * Starts the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', app);

window.addEventListener('load', () => {
    // Prevents a flicker of the header on page reload when scrolled down
    if (document.body.classList.contains('is-loading')) {
        document.body.classList.remove('is-loading');
    }
});
