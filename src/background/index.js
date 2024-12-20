// console.log('background is running')


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OCR_RESULT') {
    console.log('Extracted Text:', message.text);
  }
});


// from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OCR_STARTED') {
    chrome.action.setBadgeBackgroundColor({ color: '#FFD700' });
    chrome.action.setBadgeText({ text: '.' });
  } else if (message.action === 'OCR_PROGRESS') {
    chrome.action.setBadgeBackgroundColor({ color: '#FFD700' });
    chrome.action.setBadgeText({ text: `${Math.round(message.progress * 100)}%` });
  } else if (message.action === 'OCR_RESULT') {
    chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
    chrome.action.setBadgeText({ text: '.' });
  } else if (message.action === 'OCR_ERROR') {
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    chrome.action.setBadgeText({ text: 'ERR' });
  }
});


let ocrResult

// from contentscript 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "START_OCR") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "START_OCR" });
      }
    });
  } else if (message.action === "SHOW_ANSWER") {
    ocrResult = message.answer || '';
    // console.log('SHOW_ANSWER', ocrResult)
    chrome.runtime.sendMessage({ action: 'SHOW_ANSWER', answer: ocrResult });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "SHOW_ANSWER", answer: ocrResult });
      }
    });
  } else if (message.action === 'SHOW_POPUP_CONTAINER') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'SHOW_POPUP_CONTAINER', answer: ocrResult });
      }
    });
  } else if (message.action === 'CLOSE_SIDEPANEL') {
    chrome.sidePanel.setOptions({ enabled: false });
    chrome.sidePanel.setOptions({ enabled: true });
  } else if (message.action === 'OCR_TO_TEXT') { 
    // console.log("background yaad kita")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'OCR_TO_TEXT', image:message.image });
      }
    });
  }
  if (message.action === 'SET_IS_SCANNING') {
    chrome.runtime.sendMessage({ action: 'UPDATE_SCANNING_STATUS', isScanning: message.isScanning });
  }
  
  if (message.action === 'CANVAS_IMAGE') {
    chrome.runtime.sendMessage({ action: 'CANVAS_IMAGE', image: message.image });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_SCREENSHOT') {
    try {
      chrome.tabs.captureVisibleTab(null, {}, (screenshotUrl) => {
        if (chrome.runtime.lastError) {
          // console.log('Error capturing screenshot:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          // console.log('Screenshot captured:', screenshotUrl);
          sendResponse({ screenshotUrl });
        }
      });
    } catch (error) {
      console.log(error.message)
    }
    return true;
  }
});


chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.reload();
  }
});