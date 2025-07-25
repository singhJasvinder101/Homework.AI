import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SidePanel.css';
import { Moon, Sun, Camera, FileText, Image, Send, Trash2, Loader, Images, FilePlus, CopyMinus } from 'lucide-react';
import Tesseract from 'tesseract.js';
import useTypewriter from '../hooks/useTypewriter';
import Markdown from 'react-markdown';
import Tooltip from '../components/Tooltip/Tooltip';
import Badge from '../components/Badge/Badge';

const Message = React.memo(({ message }) => {
  let content = "";
  if (message && message.role === 'assistant' && message.content) {
    console.log(message.content, typeof message.content)
    if (typeof message.content === 'object') {
      message.content = JSON.stringify(message.content);
    }
    const parsedContent = JSON.parse(message.content);
    content = (`
${parsedContent?.greeting ? `${parsedContent.greeting}\n` : '\n'}
${parsedContent?.final_answer ? `**Answer**: ${parsedContent.final_answer}\n` : '\n'}
${parsedContent?.answer ? `**Answer**: ${parsedContent.answer}\n` : '\n'}
${parsedContent?.explanation ? `**Explanation**: ${parsedContent.explanation}\n` : '\n'}
${parsedContent?.solution ? `**Solution**: ${parsedContent.solution}\n` : '\n'}
${parsedContent?.difficulty_level ? `**Difficulty**: ${parsedContent.difficulty_level}\n` : '\n'}
${parsedContent?.solution_steps && parsedContent.solution_steps.length
        ? '**Steps**:\n' + parsedContent.solution_steps.map(step => `- ${step}`).join('\n')
        : ''}
${parsedContent?.closing_note ? `${parsedContent.closing_note}\n` : '\n'}
    `)

    console.log(content)


  } else if (message.role === 'user') {
    content = message.content;
  }


  console.log(typeof content)
  return (
    <div className={`message ${message.role}`}>
      {content && <Markdown className="message-content">
        {
          typeof content === 'string' ? content : JSON.stringify("")
        }
      </Markdown>}
      {message.image && <img src={message.image} alt="OCR Result" className="ocr-image" />}
    </div>
  );
});

export const SidePanel = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: JSON.stringify({
        greeting: "Hi! Is there any question I can help you with?",
        closing_note: "Have a great day!"
      })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionId, setSessionId] = useState(null); // Store session_id
  const bottomRef = useRef(null);
  const processingRef = useRef(false);
  const dragCounter = useRef(0);
  // const apiUri = 'http://127.0.0.1:5000';
  const apiUri = 'https://homework-ai-tau.vercel.app';

  console.log(sessionId)

  const getAllMessages = async () => {
    const response = await fetch(apiUri + "/api/chat_history/" + sessionId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log(data)
    return data;
  }
  useEffect(() => {
    // get messages
    const fetchMessages = async (sessionId) => {
      try {
        const response = await getAllMessages(sessionId);
        console.log(response.message)
        if (Array.isArray(response.history)) {
          // console.log(JSON.parse(response.history[0].content))
          setMessages(() => response.history.filter((_, idx) => idx !== 0));
        } else if (response.message == "50 per 1 hour") {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: JSON.stringify({
                final_answer: 'You can only send 50 request per hour. Please wait a moment and try again.',
              }),
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages()
  }, [sessionId])

  console.log(messages)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Load sessionId from chrome.storage.local
    chrome.storage.local.get(['sessionId']).then((result) => {
      setSessionId(result.sessionId || null);
      console.log('Fetched sessionId:', result.sessionId);
    });
  }, [sessionId]);

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
          setMessages((prev) => [...prev, { role: 'assistant', content: request.answer }]);
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

        // Only add the user message, the answer will come via SHOW_ANSWER2
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: text, image: image || null }
        ]);

        processingRef.current = false;
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
        setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
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
      const response = await fetch(apiUri + "/api/generate_answer", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, session_id: sessionId }),
      });
      const data = await response.json();
      console.log(data)
      if (data.session_id && data.session_id !== sessionId) {
        console.log(data)
        setSessionId(data.session_id);
        chrome.storage.local.set({ sessionId: data.session_id });
        console.log('Session ID updated:', data.session_id);
      }
      return data;
    } catch (error) {
      console.error("Error submitting question:", error);
      return { final_answer: 'An error occurred', solution_steps: ['Please try again'] };
    }
  }, [sessionId]);

  const handleImageUpload = useCallback((event, draggedFile = null) => {
    if (isProcessingImage || isSubmitting) return;

    let file;
    if (draggedFile) {
      file = draggedFile;
    } else if (event?.target?.files?.length > 0) {
      file = event.target.files[0];
    } else {
      return;
    }
    if (!file || !file.type.startsWith('image/')) {
      setMessages(prev => [...prev, { role: 'assistant', content: { final_answer: 'Please upload an image file', solution_steps: [] } }]);
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();

    reader.onload = () => {
      const imageDataUrl = reader.result;
      setMessages((prev) => [...prev, { role: 'user', content: "Processing image...", image: imageDataUrl }]);

      chrome.runtime.sendMessage({
        action: 'OCR_TO_TEXT',
        image: imageDataUrl
      });
    };

    reader.onerror = () => {
      setMessages((prev) => [...prev, { role: 'assistant', content: { final_answer: 'Error processing image', solution_steps: ['Please try again'] } }]);
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

  // useEffect(() => {
  //   const closeTimeout = setTimeout(() => {
  //     setIsClosing(true);
  //     setTimeout(() => {
  //       window.close();
  //     }, 300);
  //   }, 300000); // 5 minutes

  // return () => clearTimeout(closeTimeout);
  // }, []);

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
            <Message
              className={message.role === "assistant" ? "assistant" : "user"}
              key={`${message.role}-${index}`}
              message={message}
            />
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

        <footer className="footer">Powered by Homework assistant</footer>
      </main>
    </div>
  );
};

export default SidePanel;