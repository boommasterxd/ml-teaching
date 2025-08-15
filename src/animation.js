document.addEventListener('DOMContentLoaded', () => {
    const animationPlaceholder = document.getElementById('animation-placeholder');
    if (!animationPlaceholder) return;

    // Get all necessary elements from the DOM
    const dogBtn = animationPlaceholder.querySelector('#dog-btn');
    const catBtn = animationPlaceholder.querySelector('#cat-btn');
    const outputText = animationPlaceholder.querySelector('#output-text');
    const svgContainer = animationPlaceholder.querySelector('.connections');
    const networkWrapper = animationPlaceholder.querySelector('.network-wrapper');
    const allNodes = animationPlaceholder.querySelectorAll('.node');
    const dogIconContainer = animationPlaceholder.querySelector('#dog-icon-container');
    const catIconContainer = animationPlaceholder.querySelector('#cat-icon-container');
    const outputDisplay = animationPlaceholder.querySelector('#output-display');
    
    let allConnections = [];

    /**
     * Draws an SVG line between two points.
     * @param {number} x1 - Start X-coordinate.
     * @param {number} y1 - Start Y-coordinate.
     * @param {number} x2 - End X-coordinate.
     * @param {number} y2 - End Y-coordinate.
     * @param {object} attributes - Data attributes for the line.
     */
    function drawLine(x1, y1, x2, y2, attributes) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.classList.add('connection');
        for (const key in attributes) {
            line.dataset[key] = attributes[key];
        }
        svgContainer.appendChild(line);
        allConnections.push(line);
    }

    /**
     * Calculates and draws all connections in the neural network.
     * This function is called once the layout is stable.
     */
    function drawConnections() {
        if (!networkWrapper || !svgContainer) return;
        
        svgContainer.innerHTML = '';
        allConnections = [];

        const wrapperRect = networkWrapper.getBoundingClientRect();

        /**
         * Gets the center coordinates of an element relative to the wrapper.
         * Used for connections BETWEEN layers.
         * @param {HTMLElement} element - The HTML element.
         * @returns {{x: number, y: number}} - The relative coordinates.
         */
        const getCenterCoords = (element) => {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left - wrapperRect.left + rect.width / 2,
                y: rect.top - wrapperRect.top + rect.height / 2,
            };
        };

        // --- ADJUSTMENT FOR EDGE CONNECTIONS ---

        // 1. Connections from input icons to the input layer
        const inputNodes = Array.from(animationPlaceholder.querySelectorAll('.input-layer .node'));
        const dogIconRect = dogIconContainer.getBoundingClientRect();
        const catIconRect = catIconContainer.getBoundingClientRect();

        // Start points at the right edge of the icons (vertically centered)
        const dogIconStartPoint = {
            x: dogIconRect.right - wrapperRect.left,
            y: dogIconRect.top - wrapperRect.top + dogIconRect.height / 2
        };
        const catIconStartPoint = {
            x: catIconRect.right - wrapperRect.left,
            y: catIconRect.top - wrapperRect.top + catIconRect.height / 2
        };
        
        // Connect to the left edge of each input node
        inputNodes.forEach(node => {
            const nodeRect = node.getBoundingClientRect();
            const nodeEndPoint = {
                x: nodeRect.left - wrapperRect.left,
                y: nodeRect.top - wrapperRect.top + nodeRect.height / 2
            };
            drawLine(dogIconStartPoint.x, dogIconStartPoint.y, nodeEndPoint.x, nodeEndPoint.y, { sourceType: 'image', sourceId: 'dog' });
            drawLine(catIconStartPoint.x, catIconStartPoint.y, nodeEndPoint.x, nodeEndPoint.y, { sourceType: 'image', sourceId: 'cat' });
        });

        // 2. Connections between layers remain centered
        const layers = [
            { name: 'input', nodes: inputNodes },
            { name: 'h1', nodes: Array.from(animationPlaceholder.querySelectorAll('.hidden-layer-1 .node')) },
            { name: 'h2', nodes: Array.from(animationPlaceholder.querySelectorAll('.hidden-layer-2 .node')) },
            { name: 'output', nodes: Array.from(animationPlaceholder.querySelectorAll('.output-layer .node')) },
        ];

        for (let i = 0; i < layers.length - 1; i++) {
            layers[i].nodes.forEach(startNode => {
                const startCenter = getCenterCoords(startNode); // Center to center
                layers[i+1].nodes.forEach(endNode => {
                    const endCenter = getCenterCoords(endNode); // Center to center
                    drawLine(startCenter.x, startCenter.y, endCenter.x, endCenter.y, { sourceType: 'layer', sourceLayer: layers[i].name });
                });
            });
        }

        // 3. Connection from the output node to the output display
        const outputNode = animationPlaceholder.querySelector('#output-node');
        const outputNodeRect = outputNode.getBoundingClientRect();
        const outputDisplayRect = outputDisplay.getBoundingClientRect();

        // Start at the right edge of the output node
        const outputNodeStartPoint = {
            x: outputNodeRect.right - wrapperRect.left,
            y: outputNodeRect.top - wrapperRect.top + outputNodeRect.height / 2
        };

        // End at the left edge of the output display
        const outputDisplayEndPoint = {
            x: outputDisplayRect.left - wrapperRect.left,
            y: outputDisplayRect.top - wrapperRect.top + outputDisplayRect.height / 2
        };

        drawLine(outputNodeStartPoint.x, outputNodeStartPoint.y, outputDisplayEndPoint.x, outputDisplayEndPoint.y, { sourceType: 'layer', sourceLayer: 'output' });
    }

    /**
     * A helper function that waits for a specified time (Promise-based).
     * @param {number} ms - Milliseconds to wait.
     */
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Starts the complete animation sequence from input to output.
     * @param {string} inputType - 'dog' or 'cat'.
     * @param {string} outputValue - The text to be displayed ('Hund' or 'Katze').
     */
    async function startAnimation(inputType, outputValue) {
        dogBtn.disabled = true;
        catBtn.disabled = true;
        
        allNodes.forEach(node => node.classList.remove('active'));
        allConnections.forEach(conn => conn.classList.remove('active'));
        dogIconContainer.classList.remove('active');
        catIconContainer.classList.remove('active');
        outputDisplay.classList.remove('active');
        outputText.textContent = '...';

        const animationDelay = 200;

        const selectedIcon = inputType === 'dog' ? dogIconContainer : catIconContainer;
        selectedIcon.classList.add('active');
        await sleep(animationDelay);
        
        allConnections.forEach(conn => {
            if (conn.dataset.sourceType === 'image' && conn.dataset.sourceId === inputType) {
                conn.classList.add('active');
            }
        });
        await sleep(animationDelay);

        const layerConfigs = [
            { name: 'input', class: 'input-layer' },
            { name: 'h1', class: 'hidden-layer-1' },
            { name: 'h2', class: 'hidden-layer-2' },
            { name: 'output', class: 'output-layer' }
        ];

        for (const config of layerConfigs) {
            animationPlaceholder.querySelectorAll(`.${config.class} .node`).forEach(node => node.classList.add('active'));
            await sleep(animationDelay);
            
            allConnections.forEach(conn => {
                if (conn.dataset.sourceType === 'layer' && conn.dataset.sourceLayer === config.name) {
                    conn.classList.add('active');
                }
            });
            await sleep(animationDelay);
        }

        outputDisplay.classList.add('active');
        outputText.textContent = outputValue;
        
        dogBtn.disabled = false;
        catBtn.disabled = false;
    }

    // Event listeners for the buttons
    dogBtn.addEventListener('click', () => startAnimation('dog', 'Hund'));
    catBtn.addEventListener('click', () => startAnimation('cat', 'Katze'));

    // This ensures that the connections are drawn only after all assets (like fonts)
    // and CSS animations on the parent container have finished.
    const parentCard = animationPlaceholder.closest('.card');

    const initDrawing = () => {
        requestAnimationFrame(drawConnections);
    };

    // A promise that resolves when the fonts are ready.
    const fontsReadyPromise = document.fonts.ready;
    
    // A promise that resolves when the parent card's entry animation is complete.
    const animationEndPromise = new Promise(resolve => {
        if (parentCard) {
            const animationName = getComputedStyle(parentCard).animationName;
            // If there's no animation, resolve immediately.
            if (animationName === 'none') {
                resolve();
            } else {
                // Otherwise, wait for the animation to end.
                parentCard.addEventListener('animationend', resolve, { once: true });
            }
        } else {
            // If there's no parent card, resolve immediately.
            resolve();
        }
    });

    // Wait for both fonts and animations to be ready before drawing the connections.
    Promise.all([fontsReadyPromise, animationEndPromise]).then(initDrawing);

    // Redraw connections on window resize to adapt to layout changes.
    window.addEventListener('resize', drawConnections);
});
