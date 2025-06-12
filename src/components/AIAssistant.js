import React, { useState, useRef, useEffect } from 'react';
import { initializeOpenAI, createRequestParams, extractResponseText } from '../config/openai';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Salut! Sunt asistentul AI. Cum te pot ajuta astăzi?", sender: "ai" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState(null);
  const [openaiClient, setOpenaiClient] = useState(null);
  const messagesEndRef = useRef(null);
  const chatboxRef = useRef(null);

  // Initialize OpenAI client on component mount
  useEffect(() => {
    const client = initializeOpenAI();
    setOpenaiClient(client);
    
    if (!client) {
      console.error('Failed to initialize OpenAI client. Please check your API key configuration.');
    }
  }, []);

  // Handle click outside to close chatbox
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatboxRef.current && !chatboxRef.current.contains(event.target) && 
          !event.target.classList.contains('ai-assistant-button')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChatbox = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inputMessage.trim() === '') return;
    
    // Check if OpenAI client is available
    if (!openaiClient) {
      const errorMessage = "Serviciul AI nu este disponibil momentan. Te rog să verifici configurația și să reîncerci.";
      const errorResponse = { text: errorMessage, sender: "ai" };
      setMessages(prev => [...prev, errorResponse]);
      return;
    }
    
    // Add user message to chat
    const userMessage = { text: inputMessage, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Create request parameters using the configuration
      const requestParams = createRequestParams(currentMessage, previousResponseId);

      // Call OpenAI Responses API
      const response = await openaiClient.responses.create(requestParams);

      // Extract the AI response text
      const aiResponseText = extractResponseText(response);

      // Store the response ID for conversation continuity
      if (response.id) {
        setPreviousResponseId(response.id);
      }

      // Add AI response to chat
      const aiResponse = { 
        text: aiResponseText, 
        sender: "ai" 
      };
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Error calling OpenAI Responses API:', error);
      
      let errorMessage = "A apărut o eroare în procesarea cererii tale. Te rog să încerci din nou.";
      
      // Handle specific error types
      if (error.status === 401) {
        errorMessage = "Cheia API nu este validă. Te rog să contactezi administratorul.";
      } else if (error.status === 429) {
        errorMessage = "Limita de utilizare a fost atinsă. Te rog să încerci mai târziu.";
      } else if (error.status === 404) {
        errorMessage = "Modelul AI nu a fost găsit. Te rog să contactezi administratorul.";
      } else if (error.message?.includes('API key')) {
        errorMessage = "Cheia API nu este configurată corect. Te rog să contactezi administratorul.";
      } else if (error.message?.includes('quota')) {
        errorMessage = "Limita de utilizare a fost atinsă. Te rog să încerci mai târziu.";
      } else if (error.message?.includes('model')) {
        errorMessage = "Modelul AI nu este disponibil momentan. Te rog să încerci din nou.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Probleme de conectare la internet. Te rog să verifici conexiunea și să încerci din nou.";
      }
      
      const errorResponse = { 
        text: errorMessage, 
        sender: "ai" 
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset conversation function
  const resetConversation = () => {
    setMessages([
      { text: "Salut! Sunt asistentul AI. Cum te pot ajuta astăzi?", sender: "ai" }
    ]);
    setPreviousResponseId(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <button
        className="ai-assistant-button bg-[#034a76] hover:bg-[#023a5e] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg focus:outline-none transition-all duration-300"
        onClick={toggleChatbox}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chatbox */}
      {isOpen && (
        <div 
          ref={chatboxRef}
          className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden transform transition-all duration-300"
        >
          {/* Header */}
          <div className="bg-[#034a76] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="text-lg font-medium">Asistent AI</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={resetConversation}
                className="text-white hover:text-gray-200 focus:outline-none p-1 rounded transition-colors duration-200"
                title="Resetează conversația"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={toggleChatbox}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Messages Container */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    message.sender === 'user' 
                      ? 'bg-[#034a76] text-white' 
                      : 'bg-white border border-gray-300 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-300 p-2">
            <div className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Scrie un mesaj..."
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:border-[#034a76]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#034a76] hover:bg-[#023a5e] text-white px-4 py-2 rounded-r-lg focus:outline-none transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistant; 