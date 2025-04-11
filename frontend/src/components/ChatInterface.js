import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';

// Componenta pentru bula de mesaj
const ChatBubble = ({ message, isUser }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`flex items-start max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-100 ml-2' : 'bg-gray-100 mr-2'
      }`}>
        {isUser ? <User size={20} className="text-blue-600" /> : <Bot size={20} className="text-gray-600" />}
      </div>
      <div className={`p-3 rounded-lg ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
      }`}>
        {message}
      </div>
    </div>
  </div>
);

// Componenta pentru indicatorul de scriere
const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-3 max-w-[100px] bg-gray-100 rounded-lg mb-4">
    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
    <span className="text-sm text-gray-600">Typing</span>
  </div>
);

// Componenta principală de chat
const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    // Adaugă mesajul utilizatorului
    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputMessage('');

    // Simulează răspunsul botului
    setIsTyping(true);
    
    // Simulează un delay pentru răspuns
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: userMessage, isUser: false }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot size={24} className="text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">Asistent Generare CV</h2>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            message={message.text}
            isUser={message.isUser}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Scrie un mesaj..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            disabled={!inputMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;