import React, { useState, useRef, useEffect } from 'react';
import './DocumentChatbot.css';

const dummyResponses = {
  'primary endpoint': 'Based on the document analysis, the primary endpoint is mentioned in Section 4.2 but lacks explicit definition. According to ICH E6(R2) Section 6.9.4, the primary endpoint should be clearly defined and specified. I recommend adding: "The primary endpoint is the change from baseline in [specific measure] at [timepoint], measured using [validated instrument]."',
  'informed consent': 'The informed consent section (Section 4.8) is missing a clear statement that the trial involves research. ICH E6(R2) Section 4.8.1 requires an explicit statement about research involvement and purpose explanation. Consider adding: "This study is a research trial designed to evaluate [specific purpose]."',
  'safety': 'The safety monitoring section (5.3) mentions adverse event reporting but doesn\'t specify timelines. ICH E6(R2) Section 4.11.1 requires immediate reporting of serious adverse events. Recommendation: "All serious adverse events will be reported to the sponsor within 24 hours of the investigator becoming aware of the event."',
  'compliance': 'Your document has been analyzed against ICH E6(R2) and CDSCO CT Rules 2019. Overall compliance score is 78%. There are 2 critical issues, 5 major issues, and 8 minor issues identified. The critical issues are in the Study Objectives and Informed Consent sections.',
  'guidelines': 'This document has been checked against ICH E6(R2) Good Clinical Practice and CDSCO New Drugs and Clinical Trials Rules, 2019. These are the primary regulatory frameworks for clinical trials in India.',
  'default': 'I\'m analyzing your document for regulatory compliance. I can help you with questions about specific sections, compliance findings, regulatory requirements, or provide suggestions for improvements. What would you like to know?'
};

function DocumentChatbot({ document }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `Hello! I've analyzed ${document.name}. I can answer questions about the document content, compliance findings, and provide regulatory guidance. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, response] of Object.entries(dummyResponses)) {
      if (lowerQuery.includes(key)) {
        return response;
      }
    }
    
    return dummyResponses.default;
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: generateResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What are the critical compliance issues?',
    'Explain the primary endpoint requirement',
    'What guidelines were used for analysis?',
    'How can I improve the informed consent section?'
  ];

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  return (
    <div className="document-chatbot">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div>
            <h3>AI Document Assistant</h3>
            <p>Ask questions about your document</p>
          </div>
        </div>
        <span className="status-indicator">
          <span className="status-dot"></span>
          Online
        </span>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-questions">
        <p>Quick questions:</p>
        <div className="quick-questions-list">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="quick-question-btn"
              onClick={() => handleQuickQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="chatbot-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about compliance, sections, or regulatory requirements..."
          rows="1"
        />
        <button 
          className="send-btn"
          onClick={handleSend}
          disabled={!inputValue.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default DocumentChatbot;
