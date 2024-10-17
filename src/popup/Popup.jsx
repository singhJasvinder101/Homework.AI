import React, { useState, useEffect } from 'react';
import './Popup.css';
import { Moon, Sun, Camera, Send, Loader } from 'lucide-react';

export const Popup = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [question, setQuestion] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const apiUri = 'https://op-answers.vercel.app/generate_answer'
  // const apiUri = 'http://127.0.0.1:5000/generate_answer'

  useEffect(() => {
    chrome.storage.sync.get('darkMode', (data) => {
      if (data.darkMode !== undefined) {
        setDarkMode(data.darkMode);
      }
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    chrome.storage.sync.set({ darkMode });
  }, [darkMode]);

  const handleStartOCR = () => {
    setIsScanning(true);
    setOcrProgress(0);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "START_OCR" });
      }
    });
  };

  const handleSubmitQuestion = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      const answer = data.answer || 'No answer found.';

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "SHOW_ANSWER", answer });
        }
      });
      console.log(answer);
    } catch (error) {
      console.error("Error submitting question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === 'OCR_PROGRESS') {
        setOcrProgress(message.progress * 100);
      } else if (message.action === 'OCR_RESULT') {
        setOcrResult(message.text);
        setIsScanning(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    const closeTimeout = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        window.close();
      }, 300);
    }, 300000); // 5 minutes

    return () => clearTimeout(closeTimeout);
  }, []);

  return (
    <div className={`popup-container ${darkMode ? 'dark-mode' : ''} ${isClosing ? 'closing' : ''}`}>
      <header className="popup-header">
        <h1>Homework AI</h1>
      </header>
      <main className="popup-content">
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter your question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className={`icon-button ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleSubmitQuestion}
            aria-label="Submit question"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="button-container">
          <button className={`start-ocr-button ${isScanning ? 'scanning' : ''}`} onClick={handleStartOCR} disabled={isScanning}>
            {isScanning ? <Loader size={20} className="spin" /> : <Camera size={20} />}
            <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
          </button>
        </div>
        {ocrProgress > 0 && ocrProgress < 100 && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${ocrProgress}%` }}
              role="progressbar"
              aria-valuenow={ocrProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        )}
        {ocrResult && (
          <div className="ocr-result">
            <h2>Scanned Text:</h2>
            <p>{ocrResult}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Popup;