import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const MaterieModal = ({ materie, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  const [isInscris, setIsInscris] = useState(false);

  useEffect(() => {
    // Verifică dacă studentul este deja înscris
    setIsInscris(materie.studentiInscrisi?.some(student => student.id === user?.uid) || false);
  }, [materie, user]);

  const handleInscriere = async () => {
    // ...existing code...
  };

  const locuriDisponibile = materie.locuriDisponibile || 0;
  const locuriOcupate = materie.studentiInscrisi?.length || 0;
  const areLocuriLibere = locuriOcupate < locuriDisponibile;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-[#034a76]">{materie.nume}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Status badge */}
          <div className="mb-4">
            {materie.status === 'promovat' || materie.nota >= 5 ? (
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                Promovat
              </span>
            ) : materie.status === 'nepromovat' || (materie.nota > 0 && materie.nota < 5) ? (
              <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                Nepromovat
              </span>
            ) : (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                Neevaluat
              </span>
            )}
          </div>

          {user && !isInscris && (
            <button
              onClick={handleInscriere}
              disabled={!areLocuriLibere}
              className={`w-full mt-4 px-4 py-2 rounded-md transition-colors
                ${!areLocuriLibere
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#034a76] text-white hover:bg-[#023557]'}`}
            >
              {!areLocuriLibere ? 'Locuri epuizate' : 'Înscriere'}
            </button>
          )}

          {isInscris && (
            <div className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-md text-center">
              Ești înscris la această materie
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterieModal; 