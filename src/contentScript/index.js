console.info('Content script is running');
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';
import './content.css';
import '../components/AnswerPopup/index.css';
import { cameraIcon, sendIcon } from '../components/icons/icons';



// const apiUri = 'https://op-answers.vercel.app/generate_answer'
// const apiUri = 'https://homework-ai-tau.vercel.app/generate_answer'
const apiUri = 'http://127.0.0.1:5000/generate_answer'
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



chrome.storage.local.get(['modelCount']).then((result) => {
    console.log(result)
    modelCount = result.modelCount || 1;
    console.info(`Model count retrieved: ${modelCount}`);
})
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.modelCount) {
        modelCount = changes.modelCount.newValue;
        console.info(`Model count updated to: ${modelCount}`);
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

const renderPopup = (position = { x: 910, y: 223 }, ocrResult = '', isSubmitting = false, isScanning = false, ocrProgress = 0) => {
    console.log(backgroundAnswer)
    if (!popupContainer) return;
    isRendered = true;

    console.log("Rendering popup...");
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

    if (ocrResult || backgroundAnswer) {
        console.log("hello")
        const plainTextResult = ocrResult
            .replace(/([*_~#`>|])/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\n{2,}/g, '\n');

        const levelMatch = plainTextResult.match(/(?:Level|level):\s*(.+)/);
        const level = levelMatch && levelMatch[1].trim();
        const answerMatch = plainTextResult.match(/Answer:\s*(.*)/s);

        const resultDiv = createElement(
            'div',
            'ocr-result',
            `<p class="answer-heading"><span></span> ${level ? `<span class="level">${level}</span>` : ''}</p>
                <p>${answerMatch ? answerMatch[0].replace("Answer:", '') : 'Answer not found'}</p>`,
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
    isSubmitting = true;
    renderPopup(null, ocrResult, isSubmitting, isScanning, ocrProgress);

    try {
        console.log(modelCount)
        const response = await fetch(apiUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, model_count: modelCount }),
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
        renderPopup(null, ocrResult, isSubmitting, isScanning, ocrProgress);
    }
};


const createPopupContainer = (position) => {
    if (popupContainer) {
        document.body.removeChild(popupContainer);
    }
    
    if (!isAllowedPopupContainer) return;
    console.log(position)
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
        console.log("ïncoming")
        handleStartSelection();
    } else if (message.action === 'SHOW_ANSWER') {
        const { answer } = message;
        console.log(answer)
        ocrResult = answer
        const defaultPosition = { x: 910, y: 223 };

        if (!popupContainer) {
            createPopupContainer(defaultPosition);
        }

        renderPopup(defaultPosition, answer, isSubmitting, isScanning, ocrProgress);
    } else if (message.action === 'OCR_PROGRESS') {
        isScanning = true;
    } else if (message.action === 'SHOW_POPUP_CONTAINER') {
        // console.log("SHOW_POPUP_CONTAINER") // required tabs query
        isAllowedPopupContainer = true;
        const { answer } = message;
        const defaultPosition = { x: 910, y: 223 };
        createPopupContainer(defaultPosition);
        renderPopup(defaultPosition, answer, isSubmitting, isScanning, ocrProgress);
    } else if (message.action === 'OCR_TO_TEXT') {
        const { image } = message;
        console.log("coming from backrgound")
        ocr_toText(image).then(text => {
            console.log(text)
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

                console.log(canvas.toDataURL())
                chrome.runtime.sendMessage({ action: 'CANVAS_IMAGE2', image: canvas.toDataURL() });

                const { data: { text } } = await Tesseract.recognize(canvas.toDataURL(), 'eng', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            chrome.runtime.sendMessage({ action: 'OCR_PROGRESS', progress: m.progress });
                        }
                    }
                });

                chrome.runtime.sendMessage({ action: 'OCR_RESULT', text });

                // Here we render the popup with the tick and cross
                // renderPopupWithOptions(popupPosition, text);
                console.log(modelCount)
                const response = await fetch(apiUri, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: text, model_count: modelCount }),
                });

                const data = await response.json();
                const answer = data.answer || 'No answer found.';

                chrome.runtime.sendMessage({ action: 'SHOW_ANSWER2', answer });
                chrome.runtime.sendMessage({ action: 'SHOW_ANSWER', answer });
                if (isAllowPopupContainer) displayAnswerContainer(answer, popupPosition);

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
