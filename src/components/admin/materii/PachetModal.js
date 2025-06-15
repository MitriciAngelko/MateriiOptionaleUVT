import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { facultati, specializari, ani } from './constants';

const PachetModal = ({ onClose, setPachete, materii }) => {
  const [newPachet, setNewPachet] = useState({
    nume: '',
    facultate: '',
    specializare: '',
    an: '',
    materii: []
  });
  const [selectedMaterii, setSelectedMaterii] = useState([]);
  const [filteredMaterii, setFilteredMaterii] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrează materiile în funcție de selecțiile făcute și termenul de căutare
  useEffect(() => {
    const filtered = materii.filter(materie => {
      const matchFacultate = !newPachet.facultate || materie.facultate === newPachet.facultate;
      const matchSpecializare = !newPachet.specializare || materie.specializare === newPachet.specializare;
      const matchAn = !newPachet.an || materie.an === newPachet.an;
      const matchSearch = !searchTerm || materie.nume.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFacultate && matchSpecializare && matchAn && matchSearch;
    });
    setFilteredMaterii(filtered);
  }, [materii, newPachet.facultate, newPachet.specializare, newPachet.an, searchTerm]);

  const handleAddPachet = async () => {
    try {
      const pachetData = {
        nume: newPachet.nume,
        facultate: newPachet.facultate,
        specializare: newPachet.specializare,
        an: newPachet.an,
        materii: selectedMaterii.map(materie => ({
          id: materie.id,
          nume: materie.nume
        }))
      };

      await addDoc(collection(db, 'pachete'), pachetData);
      onClose();
      const pacheteSnapshot = await getDocs(collection(db, 'pachete'));
      const pacheteList = pacheteSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPachete(pacheteList);
    } catch (error) {
      console.error('Eroare la adăugarea pachetului:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
            Adaugă Pachet Nou
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Nume Pachet</label>
            <input
              type="text"
              value={newPachet.nume}
              onChange={(e) => setNewPachet({...newPachet, nume: e.target.value})}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
              placeholder="Introdu numele pachetului"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
            <select
              value={newPachet.facultate}
              onChange={(e) => setNewPachet({...newPachet, facultate: e.target.value, specializare: ''})}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            >
              <option value="">Toate facultățile</option>
              {facultati.map(facultate => (
                <option key={facultate} value={facultate}>{facultate}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
            <select
              value={newPachet.specializare}
              onChange={(e) => setNewPachet({...newPachet, specializare: e.target.value})}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
              disabled={!newPachet.facultate}
            >
              <option value="">Toate specializările</option>
              {newPachet.facultate && specializari[newPachet.facultate]?.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
            <select
              value={newPachet.an}
              onChange={(e) => setNewPachet({...newPachet, an: e.target.value})}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            >
              <option value="">Toți anii</option>
              {ani.map(an => (
                <option key={an} value={an}>{an}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Selectează Materii
            </h3>
            
            {/* Search bar for courses */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Caută materii..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto border border-[#024A76]/30 dark:border-gray-600 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-700/30">
              {filteredMaterii.length > 0 ? (
                filteredMaterii.map((materie) => (
                  <label key={materie.id} className="flex items-center space-x-3 py-3 hover:bg-white/50 dark:hover:bg-gray-600/30 rounded-md px-2 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMaterii.some(m => m.id === materie.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMaterii([...selectedMaterii, materie]);
                        } else {
                          setSelectedMaterii(selectedMaterii.filter(m => m.id !== materie.id));
                        }
                      }}
                      className="h-4 w-4 text-[#E3AB23] dark:text-yellow-accent focus:ring-[#E3AB23] dark:focus:ring-yellow-accent border-[#024A76]/30 dark:border-gray-600 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-[#024A76] dark:text-gray-200 font-medium">{materie.nume}</span>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {materie.facultate} • {materie.specializare} • An {materie.an}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Nu există materii disponibile pentru criteriile selectate.
                  </p>
                </div>
              )}
            </div>
            {selectedMaterii.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-[#024A76] dark:text-blue-light font-medium">
                  {selectedMaterii.length} {selectedMaterii.length === 1 ? 'materie selectată' : 'materii selectate'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-[#024A76] dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 border border-gray-300 dark:border-gray-600"
          >
            Anulează
          </button>
          <button
            onClick={handleAddPachet}
            disabled={!newPachet.nume || selectedMaterii.length === 0}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-blue-dark rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Adaugă Pachet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PachetModal; 