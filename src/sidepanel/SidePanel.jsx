import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SidePanel.css';
import { Moon, Sun, Camera, FileText, Image, Send, Trash2, Loader, Images, FilePlus, CopyMinus, ArrowLeftRight } from 'lucide-react';
import Tesseract from 'tesseract.js';
import useTypewriter from '../hooks/useTypewriter';
import Markdown from 'react-markdown';
import Tooltip from '../components/Tooltip/Tooltip';
import Badge from '../components/Badge/Badge';


const Message = React.memo(({ message }) => {
  const content = message.role === 'ai' ? useTypewriter(message.content) : message.content;

  return (
    <div className={`message ${message.role}`}>
      {content && <Markdown className="message-content">{content}</Markdown>}
      {message.image && <img src={message.image} alt="OCR Result" className="ocr-image" />}
    </div>
  );
});


export const SidePanel = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! Is there any question I can help you with?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modelCount, setModelCount] = useState(1);
  const bottomRef = useRef(null)

  const processingRef = useRef(false);
  const dragCounter = useRef(0);
  // const apiUri = 'https://op-answers.vercel.app/generate_answer';
  // const apiUri = 'http://127.0.0.1:5000/generate_answer'
  const apiUri = 'https://homework-ai-tau.vercel.app/generate_answer'

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
  }, [messages]);


  useEffect(() => {
    chrome.storage.local.get(["modelCount"]).then((result) => {
      const count = result.modelCount || 1; // Default to 1
      console.log("Fetched modelCount:", count);
      setModelCount(count);
    });
  }, []);


  console.log(modelCount)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);


  useEffect(() => {
    chrome.storage.sync.get('darkMode', (data) => {
      if (data.darkMode !== undefined) {
        setDarkMode(data.darkMode);
      }
    });

    const handleMessage = (request) => {
      switch (request.action) {
        case 'UPDATE_SCANNING_STATUS':
          setIsScanning(request.isScanning);
          break;
        case 'OCR_PROGRESS':
          setOcrProgress(request.progress * 100);
          break;
        case 'OCR_RESULT':
          setIsScanning(false);
          break;
        case 'CANVAS_IMAGE2':
          if (!processingRef.current) {
            setMessages((prev) => [...prev, { role: 'user', content: request.text, image: request.image || null }]);
          }
          break;
        case 'SHOW_ANSWER2':
          setMessages((prev) => [...prev, { role: 'ai', content: request.answer }]);
          setIsSubmitting(false);
          break;
        default:
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    const handleOCRToText = async (request, sender, sendResponse) => {
      if (request.action === 'OCR_RESULT2' && !processingRef.current) {
        const { text, image } = request;
        processingRef.current = true;

        try {
          setIsSubmitting(true);
          const answer = await handleSubmitQuestion(text);
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: text },
            { role: 'ai', content: answer }
          ]);
        } catch (error) {
          console.error('Error processing OCR text:', error);
          setMessages((prev) => [
            ...prev,
            { role: 'ai', content: 'Sorry, there was an error processing your image.' }
          ]);
        } finally {
          setIsSubmitting(false);
          setIsScanning(false);
          setIsProcessingImage(false);
          processingRef.current = false;
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleOCRToText);
    return () => {
      chrome.runtime.onMessage.removeListener(handleOCRToText);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    chrome.storage.sync.set({ darkMode });
  }, [darkMode]);

  const handleStartOCR = useCallback(() => {
    if (isScanning || isProcessingImage) return;

    setIsScanning(true);
    setOcrProgress(0);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "START_OCR" });
      }
    });
  }, [isScanning, isProcessingImage]);

  const handleSend = useCallback(async () => {
    if (inputMessage.trim() && !isSubmitting) {
      try {
        setIsSubmitting(true);
        setMessages((prev) => [...prev, { role: 'user', content: inputMessage }]);
        const answer = await handleSubmitQuestion(inputMessage);
        setMessages((prev) => [...prev, { role: 'ai', content: answer }]);
        setInputMessage('');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [inputMessage, isSubmitting]);

  const handleShowPopup = useCallback(() => {
    chrome.runtime.sendMessage({ action: 'CLOSE_SIDEPANEL' });
    chrome.runtime.sendMessage({ action: 'SHOW_POPUP_CONTAINER' });
  }, []);

  const handleSubmitQuestion = useCallback(async (question) => {
    try {
      const response = await fetch(apiUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, model_count: modelCount }),
      });
      const data = await response.json();
      return data.answer || 'No answer found.';
    } catch (error) {
      console.error("Error submitting question:", error);
      return "An error occurred. Please try again.";
    }
  }, [modelCount]);

  const handleImageUpload = useCallback((event, draggedFile = null) => {
    if (isProcessingImage || isSubmitting) return;

    // let file = event.target.files[0] ?? drag_file;
    let file;
    if (draggedFile) {
      file = draggedFile;
    } else if (event?.target?.files?.length > 0) {
      file = event.target.files[0];
    } else {
      return;
    }
    if (!file || !file.type.startsWith('image/')) {
      setMessages(prev => [...prev, { role: 'ai', content: "Please drop an image file." }]);
      return
    };

    setIsProcessingImage(true);
    const reader = new FileReader();

    reader.onload = () => {
      const imageDataUrl = reader.result;
      setMessages((prev) => [...prev, { role: 'user', content: "Processing image...", image: imageDataUrl }]);

      // Send to background only once
      chrome.runtime.sendMessage({
        action: 'OCR_TO_TEXT',
        image: imageDataUrl
      });
    };

    reader.onerror = () => {
      setMessages((prev) => [...prev, { role: 'ai', content: "Error processing image. Please try again." }]);
      setIsProcessingImage(false);
    };

    reader.readAsDataURL(file);
  }, [isProcessingImage, isSubmitting]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    dragCounter.current = 0;

    if (isProcessingImage || isSubmitting) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(null, files[0]);
    }
  }, [isProcessingImage, isSubmitting, handleImageUpload]);

  useEffect(() => {
    const container = document.querySelector('.popup-container');
    if (container) {
      container.addEventListener('dragenter', handleDragEnter);
      container.addEventListener('dragleave', handleDragLeave);
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('drop', handleDrop);

      return () => {
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
      };
    }
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  // Add these styles to your CSS file
  const dragOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  };

  const dragOverlayTextStyle = {
    color: 'white',
    fontSize: '1.5rem',
    padding: '2rem',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
  };

  const handleChangeAi = useCallback(() => {
    const newModelCount = modelCount === 1 ? 2 : 1;
    setModelCount(newModelCount);
    chrome.storage.local.set({ modelCount: newModelCount }).then(() => {
      console.log("modelCount updated to:", newModelCount);
    });
  }, [modelCount]);


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
      {isDragging && (
        <div style={dragOverlayStyle}>
          <div style={dragOverlayTextStyle}>
            Drop image here
          </div>
        </div>
      )}
      <header className="header">
        <div className="header-title">
          <div className="profile-icon"></div>
          <h1>Homework AI</h1>
        </div>
      </header>
      <main className="popup-content">
        <div ref={bottomRef} className="message-area">
          {messages.map((message, index) => (
            <Message className={message.role === "ai" ? "ai" : "user"} key={`${message.role}-${index}`} message={message} />
          ))}
        </div>

        {isScanning && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${ocrProgress}%` }}></div>
          </div>
        )}

        <div className="input-area">
          <div className="action-buttons">
            <Tooltip content='Start Capture'>
              <button
                className="action-button"
                onClick={handleStartOCR}
                disabled={isScanning || isProcessingImage}
              >
                {
                  isScanning ?
                    <Loader className="icon spin" /> :
                    <Camera className="icon" />
                }
              </button>
            </Tooltip>
            <Tooltip content='Popup Screen' >
              <button onClick={handleShowPopup} className="action-button">
                <CopyMinus className="icon" />
              </button>
            </Tooltip>
            <Tooltip content='Add Document' >
              <button disabled className="action-button">
                <FilePlus className="icon" />
              </button>
            </Tooltip>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="action-button"
              style={{ display: 'none' }}
              id="upload-image"
              disabled={isProcessingImage || isSubmitting}
            />
            <Tooltip content='Add Image' >
              <button className="action-button" >
                <label htmlFor="upload-image" className="">
                  <Images className="icon" />
                </label>
              </button>
            </Tooltip>
            <Tooltip content='Delete Chat' >
              <button className="action-button" onClick={() => setMessages([])}>
                <Trash2 className="icon" />
              </button>
            </Tooltip>
            <Tooltip content='Switch AI' >
              <button onClick={handleChangeAi} className="action-button">
                <Badge>{modelCount === 1 ? '1' : '2'}</Badge>
                <ArrowLeftRight className="icon" />
              </button>
            </Tooltip>
          </div>
          <div className="input-container">
            <input
              type="text"
              placeholder="Type your question here..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isSubmitting}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isSubmitting || !inputMessage.trim()}
            >
              <Send className="icon" />
            </button>
          </div>
        </div>

        <footer className="footer">Powered by Homework AI</footer>
      </main>
    </div>
  );
};

export default SidePanel;