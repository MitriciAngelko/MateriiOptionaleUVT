import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const MaterieModal = ({ materie, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  const [isInscris, setIsInscris] = useState(false);
  const [loading, setLoading] = useState(false);

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
          {/* ... restul codului ... */}

          {user && !isInscris && (
            <button
              onClick={handleInscriere}
              disabled={!areLocuriLibere || loading}
              className={`w-full mt-4 px-4 py-2 rounded-md transition-colors
                ${!areLocuriLibere || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#034a76] text-white hover:bg-[#023557]'}`}
            >
              {loading ? 'Se procesează...' : 
               !areLocuriLibere ? 'Locuri epuizate' : 
               'Înscriere'}
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