import React from 'react';

const MaterieDetailsModal = ({ materie, onClose }) => {
  if (!materie) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">{materie.nume}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Informații Generale</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Facultate</label>
                <p className="mt-1 text-gray-800">{materie.facultate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Specializare</label>
                <p className="mt-1 text-gray-800">{materie.specializare}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">An</label>
                <p className="mt-1 text-gray-800">{materie.an}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Credite</label>
                <p className="mt-1 text-gray-800">{materie.credite}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Descriere</h4>
            <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-gray-800 whitespace-pre-wrap">{materie.descriere}</p>
            </div>
          </div>

          {materie.profesori && materie.profesori.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Profesori</h4>
              <ul className="space-y-2">
                {materie.profesori.map((profesor, idx) => (
                  <li key={idx} className="text-gray-800">
                    {profesor.nume}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterieDetailsModal; 