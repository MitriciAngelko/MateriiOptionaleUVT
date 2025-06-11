import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminMateriiPage = () => {
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
  const [expandedMaterieId, setExpandedMaterieId] = useState(null);
  const [filters, setFilters] = useState({
    facultate: '',
    specializare: '',
    an: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

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
    if (window.confirm('Sigur doriți să ștergeți această materie?')) {
      try {
        await deleteDoc(doc(db, 'materii', materieId));
        fetchMaterii();
      } catch (err) {
        setError('Eroare la ștergerea materiei');
        console.error(err);
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      facultate: '',
      specializare: '',
      an: ''
    });
    setSearchTerm('');
  };

  const getFilteredMaterii = () => {
    return materii.filter(materie => {
      if (filters.facultate && materie.facultate !== filters.facultate) return false;
      if (filters.specializare && materie.specializare !== filters.specializare) return false;
      if (filters.an && materie.an !== filters.an) return false;
      if (searchTerm && !materie.nume.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  };

  const renderFilters = () => (
    <div className="mb-6 bg-[#f5f5f5] p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Filtre</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-[#034a76] hover:text-[#023557]"
        >
          Resetează filtrele
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facultate</label>
          <select
            value={filters.facultate}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              facultate: e.target.value,
              specializare: ''
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
          >
            <option value="">Toate facultățile</option>
            {facultati.map(fac => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specializare</label>
          <select
            value={filters.specializare}
            onChange={(e) => setFilters(prev => ({ ...prev, specializare: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
            disabled={!filters.facultate}
          >
            <option value="">Toate specializările</option>
            {filters.facultate && specializari[filters.facultate]?.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">An</label>
          <select
            value={filters.an}
            onChange={(e) => setFilters(prev => ({ ...prev, an: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
          >
            <option value="">Toți anii</option>
            {ani.map(an => (
              <option key={an} value={an}>{an}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {renderFilters()}

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Administrare Materii</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Adaugă Materie Nouă</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
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
                      disabled={!newMaterie.facultate}
                    >
                      <option value="">Selectează specializarea</option>
                      {newMaterie.facultate && specializari[newMaterie.facultate]?.map(spec => (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descriere</label>
                    <textarea
                      value={newMaterie.descriere}
                      onChange={(e) => setNewMaterie({...newMaterie, descriere: e.target.value})}
                      rows="4"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Adaugă Materie
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Materii Existente</h2>
              
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Caută după nume..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (searchTerm) {
                        setSearchTerm('');
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    {searchTerm ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Șterge
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Caută
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Introdu numele materiei pentru a o găsi rapid</p>
              </div>
              
              <div className="space-y-4">
                {getFilteredMaterii().map((materie) => (
                  <div key={materie.id} className="border rounded-lg overflow-hidden">
                    <div 
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => setExpandedMaterieId(expandedMaterieId === materie.id ? null : materie.id)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{materie.nume}</h3>
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
                      <p className="text-sm text-gray-600">
                        {materie.facultate} - {materie.specializare} (Anul {materie.an})
                      </p>
                    </div>

                    {expandedMaterieId === materie.id && (
                      <div className="p-4 border-t">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Credite:</span> {materie.credite}
                          </div>
                          <div>
                            <span className="font-medium">Descriere:</span>
                            <p className="mt-1 text-gray-600 whitespace-pre-wrap">{materie.descriere}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMateriiPage; 