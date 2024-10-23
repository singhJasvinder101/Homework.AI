console.log('background is running')


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


// from contentscript 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "START_OCR") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "START_OCR" });
      }
    });
  } else if (message.action === "SHOW_ANSWER") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "SHOW_ANSWER", answer: ocrResult });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, {}, (screenshotUrl) => {
      console.log(screenshotUrl)
      sendResponse({ screenshotUrl });
    });
    return true; // Indicates that you wish to send a response asynchronously
  }
});

