import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';

const ChatPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 py-6">
      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Înapoi la pagina principală
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Asistent Generare CV
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Discută cu asistentul nostru virtual pentru a genera CV-ul potrivit pentru tine
          </p>
        </div>

        <ChatInterface />

        <div className="mt-4 text-center text-sm text-gray-500">
          Asistentul virtual te va ghida prin procesul de creare a CV-ului tău
        </div>
      </div>
    </div>
  );
};

export default ChatPage;