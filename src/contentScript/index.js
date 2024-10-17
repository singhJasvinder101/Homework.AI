console.info('Content script is running');
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';
import './content.css';
import '../components/AnswerPopup/index.css';


// TODO: APi url change

const apiUri = 'https://op-answers.vercel.app/generate_answer'
// const apiUri = 'http://127.0.0.1:5000/generate_answer'
let popupContainer = null;

let isScanning = false;
let isSubmitting = false; 
let ocrProgress = 0; 
let question = ''; 
let ocrResult = ''; 
let isRendered = false;


const createElement = (tag, className, content = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
};

const handleCross = (popupContainer) => { 
    const crossIcon = popupContainer.querySelector('.cross-icon');
    crossIcon.addEventListener('click', () => {
        document.body.removeChild(popupContainer);
        popupContainer = null;
    });
}

const renderPopup = (position, ocrResult = '', isSubmitting = false, isScanning = false, ocrProgress = 0) => {
    if (!popupContainer) return;
    isRendered = true;

    console.log("Rendering popup...");
    popupContainer.innerHTML = '';

    const header = createElement('header', 'popup-header', '<h1>Homework AI</h1><span class="cross-icon">x</span>');
    const main = createElement('main', 'popup-content');

    const inputContainer = createElement('div', 'input-container');
    const input = createElement('input', 'inp', '');
    input.placeholder = 'Enter your question';

    input.addEventListener('input', (e) => {
        question = e.target.value;
    });

    const submitButton = createElement('button', 'icon-button', isSubmitting ? 'wait..' : 'Go');
    submitButton.disabled = isSubmitting;
    submitButton.addEventListener('click', handleSubmitQuestion);

    inputContainer.appendChild(input);
    inputContainer.appendChild(submitButton);

    const ocrButton = createElement('button', 'start-ocr-button', isScanning ? 'Scanning...' : 'Scan');
    ocrButton.disabled = isScanning;
    ocrButton.addEventListener('click', handleStartOCR);

    main.appendChild(header);
    main.appendChild(inputContainer);
    main.appendChild(ocrButton);


    if (ocrResult) {
        const resultDiv = createElement('div', 'ocr-result', `<h2 class="answer-heading">ANSWER <span class="level">${ocrResult.split('Level:')[1]}</span></h2><p>${ocrResult.split('Level:')[0]}</p>`);
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
    isSubmitting = true;
    renderPopup(null, ocrResult, isSubmitting, isScanning, ocrProgress); // Update the UI to reflect submission status

    try {
        const response = await fetch(apiUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();
        const answer = data.answer || 'No answer found.';
        ocrResult = answer;

        chrome.runtime.sendMessage({ action: 'SHOW_ANSWER', answer });

        question = '';
    } catch (error) {
        console.error("Error submitting question:", error);
    } finally {
        isSubmitting = false;
        renderPopup(null, ocrResult, isSubmitting, isScanning, ocrProgress); // Update the UI after submission completes
    }
};


const createPopupContainer = (position) => {

    if (popupContainer) {
        // Removing the previous popup if it exists
        document.body.removeChild(popupContainer);
    }

    console.log(position)
    const correctedX = position.x + window.scrollX;
    const correctedY = position.y + window.scrollY - 150;

    popupContainer = document.createElement('div');
    popupContainer.id = 'popup-container';
    popupContainer.style.position = 'absolute';
    popupContainer.style.top = `${correctedY}px`;
    popupContainer.style.left = `${correctedX}px`;
    popupContainer.style.zIndex = 1000000000;
    popupContainer.style.width = `300px`;
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

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'START_OCR') {
        console.log("ïncoming")
        handleStartSelection();
    } else if (message.action === 'SHOW_ANSWER') {
        const { answer } = message;
        displayAnswerContainer(answer);
    } else if (message.action === 'OCR_PROGRESS') {
        isScanning = true;
    }
});

// Handling selection for OCR
const handleStartSelection = () => {
    isSelecting = true;
    selectionBox = { x: 0, y: 0, width: 0, height: 0 };

    const overlay = createElement('div', 'ocr-overlay');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.cursor = 'crosshair';
    overlay.style.zIndex = '9999';
    document.body.appendChild(overlay);

    selectionElement = createElement('div', 'selection-box');
    selectionElement.style.position = 'fixed';
    selectionElement.style.border = '2px dashed white';
    selectionElement.style.pointerEvents = 'none';
    selectionElement.style.zIndex = '10000';
    document.body.appendChild(selectionElement);

    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
};

// Mouse event handlers for selection
const handleMouseDown = (e) => {
    if (!isSelecting) return;
    startPoint = { x: e.clientX, y: e.clientY };
    selectionBox = { x: startPoint.x, y: startPoint.y, width: 0, height: 0 };
    updateSelectionElement();

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
};

const updateSelectionElement = () => {
    if (selectionElement) {
        selectionElement.style.left = `${selectionBox.x}px`;
        selectionElement.style.top = `${selectionBox.y}px`;
        selectionElement.style.width = `${selectionBox.width}px`;
        selectionElement.style.height = `${selectionBox.height}px`;
    }

    popupContainer.style.zIndex = -1000000000;
};

const handleMouseUp = async (e) => {
    if (!isSelecting) return;
    isSelecting = false;

    const popupPosition = { x: e.clientX, y: e.clientY };

    const overlay = document.querySelector('.ocr-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
        createPopupContainer(popupPosition);
    }
    if (selectionElement) {
        document.body.removeChild(selectionElement);
        selectionElement = null;
    }
    if (popupContainer) {
        popupContainer.style.visibility = 'visible';
    }

    try {
        const canvas = await html2canvas(document.body, {
            x: selectionBox.x,
            y: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
        });

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
            body: JSON.stringify({ question: text }),
        });

        const data = await response.json();
        const answer = data.answer || 'No answer found.';
        displayAnswerContainer(answer, popupPosition);

    } catch (error) {
        console.error('Error during OCR:', error);
        chrome.runtime.sendMessage({ action: 'OCR_ERROR', error: error.message });
    }
};

const displayAnswerContainer = (answer, position) => {
    renderPopup(position, answer);
};
