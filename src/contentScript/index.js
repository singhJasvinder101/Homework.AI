console.info('Content script is running');
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';
import './content.css';
import '../components/AnswerPopup/index.css';
import { cameraIcon, sendIcon } from '../components/icons/icons';

// const apiUri = 'https://op-answers.vercel.app/generate_answer'
// const apiUri = 'https://homework-ai-tau.vercel.app/generate_answer'
const apiUri = 'http://127.0.0.1:5000/api/generate_answer'
let popupContainer = null;

let isScanning = false;
let isSubmitting = false;
let ocrProgress = 0;
let question = '';
let ocrResult = '';
let isRendered = false;
let backgroundAnswer = false;
let isAllowPopupContainer = false;
let isAllowedPopupContainer = false;
let modelCount;
let sessionId = null; // Store session_id for context

// Load modelCount and sessionId from chrome.storage.local
chrome.storage.local.get(['modelCount', 'sessionId']).then((result) => {
    modelCount = result.modelCount || 1;
    sessionId = result.sessionId || null;
    console.info(`Model count retrieved: ${modelCount}, Session ID: ${sessionId}`);
});

// Listen for changes to modelCount and sessionId
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.modelCount) {
            modelCount = changes.modelCount.newValue;
            console.info(`Model count updated to: ${modelCount}`);
        }
        if (changes.sessionId) {
            sessionId = changes.sessionId.newValue;
            console.info(`Session ID updated to: ${sessionId}`);
        }
    }
});

window.addEventListener('beforeunload', () => {
    chrome.runtime.sendMessage({ action: 'SET_IS_SCANNING', isScanning: false });
});

const createElement = (tag, className, content = '', id) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (id) element.id = id;
    if (content) element.innerHTML = content;
    return element;
};

const ocr_toText = async (image) => {
    const { data: { text } } = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                chrome.runtime.sendMessage({ action: 'OCR_PROGRESS', progress: m.progress });
            }
        }
    });
    return text;
}

const cleanUp = () => {
    document.body.removeChild(popupContainer);
    let overlay = document.querySelector('.ocr-overlay');
    let selectionElement = document.querySelector('.selection-box');
    popupContainer = null;
    if (overlay) {
        document.body.removeChild(overlay);
        overlay = null;
    }
    if (selectionElement) {
        document.body.removeChild(selectionElement);
        selectionElement = null;
    }
}

const handleCross = (popupContainer) => {
    isAllowPopupContainer = false;
    const crossIcon = popupContainer.querySelector('.cross-icon');
    crossIcon.addEventListener('click', () => {
        popupContainer.classList.add('closing');
        setTimeout(cleanUp, 500);
    });
}

const renderPopup = (position = { x: 910, y: 223 }, apiData = null, isSubmitting = false, isScanning = false, ocrProgress = 0) => {
    if (!popupContainer) return;
    isRendered = true;

    popupContainer.innerHTML = '';

    const header = createElement('div', 'popup-header', '<h1>Homework AI</h1><span class="cross-icon">x</span>');
    header.id = "popup-header";
    const main = createElement('main', 'popup-content');
    main.id = "popup-content";

    const inputContainer = createElement('div', 'input-container');
    inputContainer.id = "input-container"
    const input = createElement('input', 'inp', '');
    input.id = "inp"
    input.placeholder = 'Enter your question';

    input.addEventListener('input', (e) => {
        question = e.target.value;
    });

    const submitButton = createElement('button', 'icon-button', '');
    submitButton.id = "icon-button";
    submitButton.disabled = isSubmitting;
    submitButton.addEventListener('click', handleSubmitQuestion);

    submitButton.appendChild(sendIcon);

    inputContainer.appendChild(input);
    inputContainer.appendChild(submitButton);

    const ocrButton = createElement('button', 'start-ocr-button', isScanning ? 'Scanning...' : 'Scan');
    ocrButton.appendChild(cameraIcon);
    ocrButton.disabled = isScanning;
    ocrButton.addEventListener('click', handleStartOCR);

    main.appendChild(header);
    main.appendChild(inputContainer);
    main.appendChild(ocrButton);

    if (apiData) {
        // Display API response data
        let parsedContent = apiData;
        if (typeof apiData === 'string') {
            try {
                parsedContent = JSON.parse(apiData);
            } catch (e) {
                console.error('Failed to parse apiData:', e);
                parsedContent = { final_answer: 'Error parsing response', solution_steps: ['Please try again'] };
            }
        }

        const resultDiv = createElement(
            'div',
            'ocr-result',
            `
            <p class="answer-heading">
                <span>Answer</span>
                ${parsedContent.difficulty_level ? `<span class="level">${parsedContent.difficulty_level}</span>` : ''}
            </p>
            ${parsedContent.final_answer ? `<p><strong>Final Answer:</strong> ${parsedContent.final_answer}</p>` : ''}
            ${parsedContent.explanation ? `<p><strong>Explanation:</strong> ${parsedContent.explanation}</p>` : ''}
            ${parsedContent.solution ? `<p><strong>Solution:</strong> ${parsedContent.solution}</p>` : ''}
            `,
            'ocr-result'
        );
        main.appendChild(resultDiv);
    }

    popupContainer.appendChild(main);

    handleCross(popupContainer);
};

const handleStartOCR = () => {
    ocrProgress = 0;
    chrome.runtime.sendMessage({ action: "START_OCR" });
};

const handleSubmitQuestion = async () => {
    if (!question) return;

    isSubmitting = true;
    renderPopup(null, null, isSubmitting, isScanning, ocrProgress);

    try {
        const response = await fetch(apiUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, session_id: sessionId }),
        });

        const data = await response.json();
        console.log(response)
        if (data.session_id && data.session_id !== sessionId) {
            sessionId = data.session_id;
            chrome.storage.local.set({ sessionId });
            console.info(`Session ID updated: ${sessionId}`);
        }

        chrome.runtime.sendMessage({ action: 'SHOW_ANSWER', answer: data });

        question = '';
        renderPopup(null, data, isSubmitting, isScanning, ocrProgress);
    } catch (error) {
        console.error("Error submitting question:", error);
        renderPopup(null, { final_answer: 'Error occurred', solution_steps: ['Failed to fetch answer'] }, isSubmitting, isScanning, ocrProgress);
    } finally {
        isSubmitting = false;
    }
};

const createPopupContainer = (position) => {
    if (popupContainer) {
        document.body.removeChild(popupContainer);
    }

    if (!isAllowedPopupContainer) return;
    const correctedX = position.x + window.scrollX;
    const correctedY = position.y + window.scrollY - 150;

    popupContainer = document.createElement('div');
    popupContainer.id = 'popup-container';
    popupContainer.style.position = 'absolute';
    popupContainer.style.top = `${correctedY}px`;
    popupContainer.style.left = `${correctedX}px`;
    popupContainer.style.zIndex = 1000000000;
    popupContainer.style.backgroundColor = `white`;
    popupContainer.style.padding = `20px`;
    popupContainer.style.borderRadius = `1rem`;
    document.body.appendChild(popupContainer);
};

// Selection Overlay logic
let isSelecting = false;
let startPoint = { x: 0, y: 0 };
let selectionBox = { x: 0, y: 0, width: 0, height: 0 };
let selectionElement = null;
let overlay = null

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'START_OCR') {
        handleStartSelection();
    } else if (message.action === 'SHOW_ANSWER') {
        const { answer } = message;
        const defaultPosition = { x: 910, y: 223 };

        if (!popupContainer) {
            createPopupContainer(defaultPosition);
        }

        renderPopup(defaultPosition, answer, isSubmitting, isScanning, ocrProgress);
    } else if (message.action === 'OCR_PROGRESS') {
        isScanning = true;
    } else if (message.action === 'SHOW_POPUP_CONTAINER') {
        isAllowedPopupContainer = true;
        const { answer } = message;
        const defaultPosition = { x: 910, y: 223 };
        createPopupContainer(defaultPosition);
        renderPopup(defaultPosition, answer, isSubmitting, isScanning, ocrProgress);
    } else if (message.action === 'OCR_TO_TEXT') {
        const { image } = message;
        ocr_toText(image).then(text => {
            chrome.runtime.sendMessage({ action: 'OCR_RESULT2', text, image });
        })
    }
});

const handleStartSelection = () => {
    isSelecting = true;
    selectionBox = { x: 0, y: 0, width: 0, height: 0 };

    const existingOverlay = document.querySelector('.ocr-overlay');
    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
    }
    if (selectionElement) {
        document.body.removeChild(selectionElement);
        selectionElement = null;
    }

    overlay = createElement('div', 'ocr-overlay');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.cursor = 'crosshair';
    overlay.style.zIndex = '10000';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    document.body.appendChild(overlay);

    selectionElement = createElement('div', 'selection-box');
    selectionElement.style.position = 'fixed';
    selectionElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    selectionElement.style.zIndex = '10001';
    selectionElement.style.pointerEvents = 'none';
    document.body.appendChild(selectionElement);

    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
};

const updateOverlayClip = () => {
    if (!overlay) return;

    const clipPath = `polygon(
        0% 0%,
        0% 100%,
        ${selectionBox.x}px 100%,
        ${selectionBox.x}px ${selectionBox.y}px,
        ${selectionBox.x + selectionBox.width}px ${selectionBox.y}px,
        ${selectionBox.x + selectionBox.width}px ${selectionBox.y + selectionBox.height}px,
        ${selectionBox.x}px ${selectionBox.y + selectionBox.height}px,
        ${selectionBox.x}px 100%,
        100% 100%,
        100% 0%
    )`;

    overlay.style.clipPath = clipPath;
};

const handleMouseDown = (e) => {
    if (!isSelecting) return;
    startPoint = { x: e.clientX, y: e.clientY };
    selectionBox = { x: startPoint.x, y: startPoint.y, width: 0, height: 0 };
    updateSelectionElement();
    updateOverlayClip();

    if (popupContainer) {
        popupContainer.style.visibility = 'hidden';
    }
};

const handleMouseMove = (e) => {
    if (!isSelecting || e.buttons !== 1) return;
    selectionBox = {
        x: Math.min(startPoint.x, e.clientX),
        y: Math.min(startPoint.y, e.clientY),
        width: Math.abs(e.clientX - startPoint.x),
        height: Math.abs(e.clientY - startPoint.y),
    };
    updateSelectionElement();
    updateOverlayClip();
};

const createBubble = (position) => {
    const bubble = createElement('div', 'bubble_homeworkai');
    bubble.style.position = 'fixed';
    bubble.style.backgroundColor = 'white';
    bubble.style.border = '3px solid #6c5ce7';
    bubble.style.borderRadius = '50%';
    bubble.style.width = '13px';
    bubble.style.height = '13px';
    bubble.style.zIndex = '10002';
    bubble.style.pointerEvents = 'none';

    bubble.style.left = `${position.x}px`;
    bubble.style.top = `${position.y}px`;

    return bubble;
};

const updateBubbles = () => {
    const existingBubbles = document.querySelectorAll('.bubble_homeworkai');
    existingBubbles.forEach(bubble => bubble.remove());

    const bubblePositions = [
        { x: selectionBox.x - 10, y: selectionBox.y - 10 }, // Top-left
        { x: selectionBox.x + selectionBox.width - 10, y: selectionBox.y - 10 }, // Top-right
        { x: selectionBox.x - 10, y: selectionBox.y + selectionBox.height - 10 }, // Bottom-left
        { x: selectionBox.x + selectionBox.width - 10, y: selectionBox.y + selectionBox.height - 10 }, // Bottom-right
        { x: selectionBox.x + selectionBox.width / 2 - 10, y: selectionBox.y - 10 }, // Top-center
        { x: selectionBox.x + selectionBox.width / 2 - 10, y: selectionBox.y + selectionBox.height - 10 }, // Bottom-center
        { x: selectionBox.x - 10, y: selectionBox.y + selectionBox.height / 2 - 10 }, // Middle-left
        { x: selectionBox.x + selectionBox.width - 10, y: selectionBox.y + selectionBox.height / 2 - 10 }, // Middle-right
    ];

    bubblePositions.forEach(position => {
        const bubble = createBubble(position);
        document.body.appendChild(bubble);
    });
};

const deleteBubbles = () => {
    const existingBubbles = document.querySelectorAll('.bubble_homeworkai');
    existingBubbles.forEach(bubble => bubble.remove());
}

const updateSelectionElement = () => {
    if (selectionElement) {
        selectionElement.style.left = `${selectionBox.x}px`;
        selectionElement.style.top = `${selectionBox.y}px`;
        selectionElement.style.width = `${selectionBox.width}px`;
        selectionElement.style.height = `${selectionBox.height}px`;
        selectionElement.style.pointerEvents = 'none';
        selectionElement.style.border = "1px solid #6c5ce7";
        selectionElement.style.boxShadow = "0 0 5px rgba(108, 92, 231, 0.5)";

        updateBubbles()
    }
};

let isLoading = true
const handleMouseUp = async (e) => {
    if (!isSelecting) return;
    isSelecting = false;
    deleteBubbles();

    const popupPosition = { x: e.clientX, y: e.clientY };

    const MIN_WIDTH = 10;
    const MIN_HEIGHT = 10;

    if (selectionBox.width < MIN_WIDTH || selectionBox.height < MIN_HEIGHT) {
        let overlay = document.querySelector('.ocr-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        if (selectionElement) {
            document.body.removeChild(selectionElement);
            selectionElement = null;
        }
        chrome.runtime.sendMessage({ action: 'SET_IS_SCANNING', isScanning: false });
        return;
    }

    let overlay = document.querySelector('.ocr-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
        createPopupContainer(popupPosition);
    }
    if (selectionElement) {
        document.body.removeChild(selectionElement);
        selectionElement = null;
    }

    isLoading = true;
    if (popupContainer && isLoading) {
        popupContainer.innerHTML = "<h5>Loading...</h5>";
        popupContainer.style.visibility = 'visible';
    }

    chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' }, async (response) => {
        try {
            const screenshotUrl = response.screenshotUrl;

            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = screenshotUrl;

            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = selectionBox.width;
                canvas.height = selectionBox.height;

                context.drawImage(
                    img,
                    selectionBox.x, selectionBox.y,
                    selectionBox.width, selectionBox.height,
                    0, 0,
                    selectionBox.width, selectionBox.height
                );

                chrome.runtime.sendMessage({ action: 'CANVAS_IMAGE2', image: canvas.toDataURL() });

                const { data: { text } } = await Tesseract.recognize(canvas.toDataURL(), 'eng', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            chrome.runtime.sendMessage({ action: 'OCR_PROGRESS', progress: m.progress });
                        }
                    }
                });

                chrome.runtime.sendMessage({ action: 'OCR_RESULT', text });

                const response = await fetch(apiUri, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: text, session_id: sessionId }),
                });

                const data = await response.json();
                if (data.session_id && data.session_id !== sessionId) {
                    sessionId = data.session_id;
                    chrome.storage.local.set({ sessionId });
                    console.info(`Session ID updated: ${sessionId}`);
                }

                chrome.runtime.sendMessage({ action: 'SHOW_ANSWER2', answer: data });
                chrome.runtime.sendMessage({ action: 'SHOW_ANSWER', answer: data });
                if (isAllowPopupContainer) displayAnswerContainer(data, popupPosition);

            };

            img.onerror = (error) => {
                console.error('Error loading image:', error);
            };

        } catch (error) {
            console.error('Error during OCR:', error);
            chrome.runtime.sendMessage({ action: 'OCR_ERROR', error: error.message });
        }
    });
};

const renderPopupWithOptions = (position, ocrText) => {
    if (!popupContainer) return;

    popupContainer.innerHTML = '';

    const header = createElement('div', 'popup-header', '<h1>Homework AI</h1>');

    const tickButton = createElement('button', 'tick-button', '✔️', 'tick-button');
    const crossButton = createElement('button', 'cross-button', '❌', 'cross-button');

    tickButton.addEventListener('click', () => {
        handleSubmitQuestion(ocrText);
        cleanUp();
    });

    crossButton.addEventListener('click', () => {
        cleanUp();
        handleStartSelection();
    });

    const optionsContainer = createElement('div', 'options-container');
    optionsContainer.appendChild(tickButton);
    optionsContainer.appendChild(crossButton);

    popupContainer.appendChild(header);
    popupContainer.appendChild(optionsContainer);
};

const displayAnswerContainer = (answer, position) => {
    renderPopup(position, answer);
};