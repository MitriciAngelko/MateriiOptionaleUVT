import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import MaterieDetailsModal from './MaterieDetailsModal';

const AdminMateriiModal = ({ onClose }) => {
  const [materii, setMaterii] = useState([]);
  const [newMaterie, setNewMaterie] = useState({
    nume: '',
    facultate: '',
    specializare: '',
    an: '',
    credite: '',
    descriere: '',
    profesori: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterie, setSelectedMaterie] = useState(null);
  const [expandedMaterieId, setExpandedMaterieId] = useState(null);

  const facultati = [
    "Facultatea de Matematică și Informatică",
    "Facultatea de Fizică",
    // ... alte facultăți
  ];

  const specializari = {
    "Facultatea de Matematică și Informatică": ["IR", "IG", "MI", "MA"],
    // ... alte specializări pentru alte facultăți
  };

  const ani = ["I", "II", "III"];

  useEffect(() => {
    fetchMaterii();
  }, []);

  const fetchMaterii = async () => {
    try {
      const materiiSnapshot = await getDocs(collection(db, 'materii'));
      const materiiList = materiiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterii(materiiList);
    } catch (err) {
      setError('Eroare la încărcarea materiilor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'materii'), newMaterie);
      setNewMaterie({
        nume: '',
        facultate: '',
        specializare: '',
        an: '',
        credite: '',
        descriere: '',
        profesori: []
      });
      fetchMaterii();
    } catch (err) {
      setError('Eroare la adăugarea materiei');
      console.error(err);
    }
  };

  const handleDelete = async (materieId) => {
    try {
      await deleteDoc(doc(db, 'materii', materieId));
      fetchMaterii();
    } catch (err) {
      setError('Eroare la ștergerea materiei');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Administrare Materii</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nume Materie</label>
              <input
                type="text"
                value={newMaterie.nume}
                onChange={(e) => setNewMaterie({...newMaterie, nume: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Facultate</label>
              <select
                value={newMaterie.facultate}
                onChange={(e) => setNewMaterie({...newMaterie, facultate: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Selectează facultatea</option>
                {facultati.map(facultate => (
                  <option key={facultate} value={facultate}>{facultate}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Specializare</label>
              <select
                value={newMaterie.specializare}
                onChange={(e) => setNewMaterie({...newMaterie, specializare: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Selectează specializarea</option>
                {specializari[newMaterie.facultate]?.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">An</label>
              <select
                value={newMaterie.an}
                onChange={(e) => setNewMaterie({...newMaterie, an: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Selectează anul</option>
                {ani.map(an => (
                  <option key={an} value={an}>{an}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Credite</label>
              <input
                type="number"
                min="1"
                max="30"
                value={newMaterie.credite}
                onChange={(e) => setNewMaterie({...newMaterie, credite: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descriere</label>
              <textarea
                value={newMaterie.descriere}
                onChange={(e) => setNewMaterie({...newMaterie, descriere: e.target.value})}
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Adaugă Materie
            </button>
          </div>
        </form>

        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">Materii Existente</h4>
          <div className="space-y-3">
            {materii.map((materie) => (
              <div key={materie.id} className="bg-gray-50 rounded-lg overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedMaterieId(expandedMaterieId === materie.id ? null : materie.id)}
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-lg">{materie.nume}</h5>
                    <p className="text-sm text-gray-600">
                      {materie.facultate} - {materie.specializare} (Anul {materie.an})
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${
                        expandedMaterieId === materie.id ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(materie.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Șterge
                    </button>
                  </div>
                </div>
                
                {expandedMaterieId === materie.id && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Credite</label>
                        <p className="mt-1 text-gray-800">{materie.credite}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Descriere</label>
                        <p className="mt-1 text-gray-800 whitespace-pre-wrap">{materie.descriere}</p>
                      </div>
                      {materie.profesori && materie.profesori.length > 0 && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Profesori</label>
                          <ul className="mt-1 space-y-1">
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
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedMaterie && (
          <MaterieDetailsModal
            materie={selectedMaterie}
            onClose={() => setSelectedMaterie(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminMateriiModal; 