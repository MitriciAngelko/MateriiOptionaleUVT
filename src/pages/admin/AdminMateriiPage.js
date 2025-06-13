import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import DeleteIcon from '../../components/icons/DeleteIcon';
import { Link } from 'react-router-dom';

const AdminMateriiPage = () => {
  const [activeTab, setActiveTab] = useState('materii'); // 'materii' sau 'pachete'
  const [materii, setMaterii] = useState([]);
  const [newMaterie, setNewMaterie] = useState({
    nume: '',
    facultate: '',
    specializare: '',
    an: '',
    semestru: '',
    credite: '',
    descriere: '',
    locuriDisponibile: '',
    profesori: [],
    obligatorie: false
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
  const [selectedMaterie, setSelectedMaterie] = useState(null);
  const [pachete, setPachete] = useState([]);
  const [showPachetModal, setShowPachetModal] = useState(false);

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
  const semestre = ["1", "2"];

  useEffect(() => {
    fetchMaterii();
    const fetchPachete = async () => {
      try {
        const pacheteSnapshot = await getDocs(collection(db, 'pachete'));
        const pacheteList = pacheteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPachete(pacheteList);
      } catch (error) {
        console.error('Eroare la încărcarea pachetelor:', error);
      }
    };

    fetchPachete();
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
      const materieData = {
        ...newMaterie,
        locuriDisponibile: newMaterie.obligatorie ? null : parseInt(newMaterie.locuriDisponibile),
        studentiInscrisi: []
      };

      await addDoc(collection(db, 'materii'), materieData);
      setNewMaterie({
        nume: '',
        facultate: '',
        specializare: '',
        an: '',
        semestru: '',
        credite: '',
        descriere: '',
        locuriDisponibile: '',
        profesori: [],
        obligatorie: false
      });
      fetchMaterii();
    } catch (error) {
      console.error('Eroare la adăugarea materiei:', error);
      setError('A apărut o eroare la adăugarea materiei');
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
    // Funcție helper pentru eliminarea diacriticelor
    const removeDiacritics = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    return materii.filter(materie => {
      if (filters.facultate && materie.facultate !== filters.facultate) return false;
      if (filters.specializare && materie.specializare !== filters.specializare) return false;
      if (filters.an && materie.an !== filters.an) return false;
      if (searchTerm) {
        const normalizedSearchTerm = removeDiacritics(searchTerm.toLowerCase());
        const normalizedMaterieName = removeDiacritics(materie.nume.toLowerCase());
        if (!normalizedMaterieName.includes(normalizedSearchTerm)) return false;
      }
      return true;
    });
  };

  const renderFilters = () => (
    <div className="mb-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
          Filtre
        </h2>
        <button
          onClick={resetFilters}
          className="text-sm text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-colors duration-200 font-medium"
        >
          Resetează filtrele
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
          <select
            value={filters.facultate}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              facultate: e.target.value,
              specializare: ''
            }))}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
          >
            <option value="">Toate facultățile</option>
            {facultati.map(fac => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
          <select
            value={filters.specializare}
            onChange={(e) => setFilters(prev => ({ ...prev, specializare: e.target.value }))}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
            disabled={!filters.facultate}
          >
            <option value="">Toate specializările</option>
            {filters.facultate && specializari[filters.facultate]?.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
          <select
            value={filters.an}
            onChange={(e) => setFilters(prev => ({ ...prev, an: e.target.value }))}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
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

  const MaterieModal = ({ materie, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMaterie, setEditedMaterie] = useState({...materie});
    const [studentiAftati, setStudentiAfisati] = useState([]);
    
    useEffect(() => {
      // Filtrăm studenții care au promovat materia și nu trebuie afișați
      const filtreazaStudentiInscrisi = async () => {
        if (!materie.studentiInscrisi || materie.studentiInscrisi.length === 0) {
          setStudentiAfisati([]);
          return;
        }
        
        const studentiAfisati = [];
        
        for (const student of materie.studentiInscrisi) {
          try {
            // Verificăm anul studentului
            const userRef = doc(db, 'users', student.id);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              continue; // Sărim peste studenții care nu există
            }
            
            const userData = userDoc.data();
            const anStudent = userData.an || 'I';
            const anMaterie = materie.an || 'I';
            
            // Convertim anul roman în număr pentru comparație
            const anStudentNumeric = anStudent === 'I' ? 1 : anStudent === 'II' ? 2 : 3;
            const anMaterieNumeric = anMaterie === 'I' ? 1 : anMaterie === 'II' ? 2 : 3;
            
            // Verificăm dacă studentul este dintr-un an mai mic decât materia (an viitor pentru student)
            const esteDinAnMaiMic = anStudentNumeric < anMaterieNumeric;
            
            // Dacă studentul este dintr-un an mai mic decât materia, îl sărim
            if (esteDinAnMaiMic) {
              continue;
            }
                          
            // Verificăm dacă studentul este dintr-un an mai mare decât materia
            const esteDinAnMaiMare = anStudentNumeric > anMaterieNumeric;
            
            // Verificăm istoricul academic al studentului
            const istoricRef = doc(db, 'istoricAcademic', student.id);
            const istoricDoc = await getDoc(istoricRef);
            
            let esteCursulPromovat = false;
            let esteNepromovat = false;
            let esteNeevaluat = false;
            
            if (istoricDoc.exists()) {
              const istoricData = istoricDoc.data();
              
              if (istoricData.istoricAnual && istoricData.istoricAnual.length > 0) {
                for (const anAcademic of istoricData.istoricAnual) {
                  if (anAcademic.cursuri && anAcademic.cursuri.length > 0) {
                    const curs = anAcademic.cursuri.find(c => c.id === materie.id);
                    if (curs) {
                      if (curs.status === 'promovat' || curs.nota >= 5) {
                        // Studentul a promovat cursul
                        esteCursulPromovat = true;
                        break;
                      } else if (curs.nota > 0 && curs.nota < 5) {
                        // Studentul nu a promovat cursul (are notă sub 5)
                        esteNepromovat = true;
                      } else if (curs.nota === 0 || curs.status === 'neevaluat') {
                        // Studentul nu a fost evaluat încă
                        esteNeevaluat = true;
                      }
                    }
                  }
                }
              }
            } else {
              // Dacă nu are istoric academic, îl considerăm neevaluat
              esteNeevaluat = true;
            }
            
            // Adăugăm studentul în lista afișată dacă:
            // 1. Nu a promovat cursul (inclusiv cei cu note sub 5)
            // 2. ȘI nu este dintr-un an mai mic decât materia (adică să nu fie din an viitor)
            // 3. ȘI (este nepromovat SAU este neevaluat SAU nu este dintr-un an mai mare)
            if (!esteCursulPromovat && !esteDinAnMaiMic && (esteNepromovat || esteNeevaluat || !esteDinAnMaiMare)) {
              studentiAfisati.push(student);
            }
          } catch (error) {
            console.error(`Eroare la verificarea istoricului pentru studentul ${student.id}:`, error);
          }
        }
        
        setStudentiAfisati(studentiAfisati);
      };
      
      filtreazaStudentiInscrisi();
    }, [materie]);

    const handleEdit = () => {
      setIsEditing(true);
    };
    
    const handleSave = async () => {
      try {
        const materieRef = doc(db, 'materii', materie.id);
        await updateDoc(materieRef, editedMaterie);
        
        setMaterii(prevMaterii => 
          prevMaterii.map(m => 
            m.id === materie.id ? {...m, ...editedMaterie} : m
          )
        );
        
        setIsEditing(false);
      } catch (error) {
        console.error('Eroare la actualizarea materiei:', error);
      }
    };
    
    const handleCancel = () => {
      setEditedMaterie({...materie});
      setIsEditing(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              {isEditing ? (
                <input
                  type="text"
                  value={editedMaterie.nume}
                  onChange={(e) => setEditedMaterie({...editedMaterie, nume: e.target.value})}
                  className="text-2xl font-bold text-gray-800 w-full border rounded px-2 py-1"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">{materie.nume}</h2>
              )}
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Informații Generale</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Facultate</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.facultate}
                          onChange={(e) => setEditedMaterie({...editedMaterie, facultate: e.target.value})}
                          className="w-full border rounded px-2 py-1"
                        >
                          {facultati.map(facultate => (
                            <option key={facultate} value={facultate}>{facultate}</option>
                          ))}
                        </select>
                      ) : (
                        <p>{materie.facultate}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Specializare</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.specializare}
                          onChange={(e) => setEditedMaterie({...editedMaterie, specializare: e.target.value})}
                          className="w-full border rounded px-2 py-1"
                        >
                          {specializari[editedMaterie.facultate]?.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      ) : (
                        <p>{materie.specializare}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">An</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.an}
                          onChange={(e) => setEditedMaterie({...editedMaterie, an: e.target.value})}
                          className="w-full border rounded px-2 py-1"
                        >
                          {ani.map(an => (
                            <option key={an} value={an}>{an}</option>
                          ))}
                        </select>
                      ) : (
                        <p>{materie.an}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Semestru</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.semestru || ''}
                          onChange={(e) => setEditedMaterie({...editedMaterie, semestru: e.target.value})}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="">Selectează semestrul</option>
                          {semestre.map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                      ) : (
                        <p>{materie.semestru || 'Nedefinit'}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Credite</p>
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={editedMaterie.credite}
                          onChange={(e) => setEditedMaterie({...editedMaterie, credite: e.target.value})}
                          className="w-full border rounded px-2 py-1"
                        />
                      ) : (
                        <p>{materie.credite}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Materie Obligatorie</p>
                      {isEditing ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedMaterie.obligatorie || false}
                            onChange={(e) => {
                              const isObligatorie = e.target.checked;
                              setEditedMaterie({
                                ...editedMaterie, 
                                obligatorie: isObligatorie,
                                locuriDisponibile: isObligatorie ? null : editedMaterie.locuriDisponibile
                              });
                            }}
                            className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2">{editedMaterie.obligatorie ? 'Da' : 'Nu'}</span>
                        </div>
                      ) : (
                        <p>{materie.obligatorie ? 'Da' : 'Nu'}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Locuri Disponibile</p>
                      {isEditing ? (
                        !editedMaterie.obligatorie ? (
                          <input
                            type="number"
                            min="1"
                            value={editedMaterie.locuriDisponibile || 0}
                            onChange={(e) => setEditedMaterie({...editedMaterie, locuriDisponibile: parseInt(e.target.value)})}
                            className="w-full border rounded px-2 py-1"
                          />
                        ) : (
                          <p className="italic text-gray-500">Nelimitat (materie obligatorie)</p>
                        )
                      ) : (
                        <p>{materie.obligatorie ? 'Nelimitat (materie obligatorie)' : (materie.locuriDisponibile || 0)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Descriere</h3>
                  {isEditing ? (
                    <textarea
                      value={editedMaterie.descriere || ''}
                      onChange={(e) => setEditedMaterie({...editedMaterie, descriere: e.target.value})}
                      rows="6"
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-gray-800 whitespace-pre-wrap">{materie.descriere || 'Nicio descriere disponibilă.'}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Profesori</h3>
                  {materie.profesori?.length > 0 ? (
                    <ul className="space-y-2">
                      {materie.profesori.map((profesor, index) => (
                        <li key={index} className="text-gray-600">
                          {profesor.nume}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Nu există profesori asignați</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-3">
                  Studenți Înscriși ({studentiAftati?.length || 0}/{materie.locuriDisponibile || 0})
                </h3>
                {studentiAftati?.length > 0 ? (
                  <ul className="space-y-2">
                    {studentiAftati.map((student) => (
                      <li key={student.id} className="text-gray-600">
                        {student.nume} | {student.nrMatricol || student.numarMatricol || 'N/A'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">Nu există studenți înscriși</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Salvează
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Editează Detalii
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PachetModal = ({ onClose }) => {
    const [newPachet, setNewPachet] = useState({
      nume: '',
      facultate: '',
      specializare: '',
      an: '',
      materii: []
    });
    const [selectedMaterii, setSelectedMaterii] = useState([]);
    const [filteredMaterii, setFilteredMaterii] = useState([]);

    // Filtrează materiile în funcție de selecțiile făcute
    useEffect(() => {
      const filtered = materii.filter(materie => {
        const matchFacultate = !newPachet.facultate || materie.facultate === newPachet.facultate;
        const matchSpecializare = !newPachet.specializare || materie.specializare === newPachet.specializare;
        const matchAn = !newPachet.an || materie.an === newPachet.an;
        return matchFacultate && matchSpecializare && matchAn;
      });
      setFilteredMaterii(filtered);
    }, [materii, newPachet.facultate, newPachet.specializare, newPachet.an]);

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Adaugă Pachet Nou</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nume Pachet</label>
              <input
                type="text"
                value={newPachet.nume}
                onChange={(e) => setNewPachet({...newPachet, nume: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Facultate</label>
              <select
                value={newPachet.facultate}
                onChange={(e) => setNewPachet({...newPachet, facultate: e.target.value, specializare: ''})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Toate facultățile</option>
                {facultati.map(facultate => (
                  <option key={facultate} value={facultate}>{facultate}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Specializare</label>
              <select
                value={newPachet.specializare}
                onChange={(e) => setNewPachet({...newPachet, specializare: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!newPachet.facultate}
              >
                <option value="">Toate specializările</option>
                {newPachet.facultate && specializari[newPachet.facultate]?.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">An</label>
              <select
                value={newPachet.an}
                onChange={(e) => setNewPachet({...newPachet, an: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Toți anii</option>
                {ani.map(an => (
                  <option key={an} value={an}>{an}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Selectează Materii</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                {filteredMaterii.map((materie) => (
                  <label key={materie.id} className="flex items-center space-x-3 py-2">
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{materie.nume}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Anulează
            </button>
            <button
              onClick={handleAddPachet}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Adaugă Pachet
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleDeletePachet = async (pachetId) => {
    if (window.confirm('Sigur doriți să ștergeți acest pachet?')) {
      try {
        await deleteDoc(doc(db, 'pachete', pachetId));
        setPachete(pachete.filter(p => p.id !== pachetId));
      } catch (error) {
        console.error('Eroare la ștergerea pachetului:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
            Administrare Materii
          </h1>
          <div className="flex items-center space-x-4">
            <Link
              to="/admin/istoric-academic"
              className="px-6 py-3 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Istoric Academic
            </Link>
            <button
              onClick={() => setShowPachetModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Adaugă Pachet
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {activeTab === 'pachete' && (
          <div>
            <button
              onClick={() => setShowPachetModal(true)}
              className="mb-6 px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 text-[#024A76] rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
            >
              + Adaugă Pachet Nou
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pachete.map((pachet) => (
                <div key={pachet.id} className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative shadow-lg hover:shadow-xl transition-all duration-300">
                  <button
                    onClick={() => handleDeletePachet(pachet.id)}
                    className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Șterge pachet"
                  >
                    <DeleteIcon />
                  </button>
                  <h3 className="text-lg font-bold pr-8 text-[#024A76] mb-4">{pachet.nume}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <span className="font-medium w-20">Facultate:</span>
                      <span>{pachet.facultate || 'Toate'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-20">Specializare:</span>
                      <span>{pachet.specializare || 'Toate'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-20">An:</span>
                      <span className="px-2 py-1 bg-[#E3AB23]/20 text-[#024A76] rounded-md font-semibold text-xs">
                        {pachet.an || 'Toți'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-[#024A76] flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Materii în pachet:
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {pachet.materii.map((materie) => (
                        <div key={materie.id} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                          {materie.nume}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materii' && (
          <div className="space-y-8">
            {renderFilters()}

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-[#024A76] dark:text-blue-light flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Adaugă Materie Nouă
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Nume Materie</label>
                    <input
                      type="text"
                      value={newMaterie.nume}
                      onChange={(e) => setNewMaterie({...newMaterie, nume: e.target.value})}
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Facultate</label>
                    <select
                      value={newMaterie.facultate}
                      onChange={(e) => setNewMaterie({...newMaterie, facultate: e.target.value})}
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                      required
                    >
                      <option value="">Selectează facultatea</option>
                      {facultati.map(facultate => (
                        <option key={facultate} value={facultate}>{facultate}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Specializare</label>
                    <select
                      value={newMaterie.specializare}
                      onChange={(e) => setNewMaterie({...newMaterie, specializare: e.target.value})}
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md disabled:bg-gray-100"
                      required
                      disabled={!newMaterie.facultate}
                    >
                      <option value="">Selectează specializarea</option>
                      {newMaterie.facultate && specializari[newMaterie.facultate]?.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] mb-2">An</label>
                      <select
                        value={newMaterie.an}
                        onChange={(e) => setNewMaterie({...newMaterie, an: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                        required
                      >
                        <option value="">Selectează anul</option>
                        {ani.map(an => (
                          <option key={an} value={an}>{an}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] mb-2">Semestru</label>
                      <select
                        value={newMaterie.semestru}
                        onChange={(e) => setNewMaterie({...newMaterie, semestru: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                        required
                      >
                        <option value="">Selectează semestrul</option>
                        {semestre.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Credite</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newMaterie.credite}
                      onChange={(e) => setNewMaterie({...newMaterie, credite: e.target.value})}
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="obligatorie-checkbox"
                      type="checkbox"
                      checked={newMaterie.obligatorie}
                      onChange={(e) => setNewMaterie({
                        ...newMaterie, 
                        obligatorie: e.target.checked
                      })}
                      className="h-4 w-4 text-[#E3AB23] focus:ring-[#E3AB23] border-[#024A76]/30 rounded"
                    />
                    <label htmlFor="obligatorie-checkbox" className="ml-2 block text-sm font-semibold text-[#024A76]">
                      Materie obligatorie
                    </label>
                  </div>

                  {!newMaterie.obligatorie && (
                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] mb-2">Locuri Disponibile</label>
                      <input
                        type="number"
                        min="1"
                        value={newMaterie.locuriDisponibile}
                        onChange={(e) => setNewMaterie({...newMaterie, locuriDisponibile: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Descriere</label>
                    <textarea
                      value={newMaterie.descriere}
                      onChange={(e) => setNewMaterie({...newMaterie, descriere: e.target.value})}
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md resize-none"
                      rows="3"
                      placeholder="Descrierea materiei..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 text-[#024A76] rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    Adaugă Materie
                  </button>
                </form>
              </div>

              <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-[#024A76] dark:text-blue-light flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Materii Existente
                </h2>
                
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Caută după numele materiei..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {getFilteredMaterii().map((materie) => (
                    <div 
                      key={materie.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 cursor-pointer transition-all duration-300 hover:shadow-md"
                      onClick={() => setSelectedMaterie(materie)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-[#024A76] mb-2">{materie.nume}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="px-2 py-1 bg-[#3471B8]/10 text-[#024A76] rounded-md text-xs font-medium">
                              {materie.facultate}
                            </span>
                            <span className="px-2 py-1 bg-[#E3AB23]/20 text-[#024A76] rounded-md text-xs font-medium">
                              {materie.specializare}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                              Anul {materie.an}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                              {materie.credite} ECTS
                            </span>
                          </div>
                          {materie.obligatorie && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Obligatorie
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(materie.id);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Șterge materie"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedMaterie && (
                  <MaterieModal 
                    materie={selectedMaterie} 
                    onClose={() => setSelectedMaterie(null)} 
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {showPachetModal && <PachetModal onClose={() => setShowPachetModal(false)} />}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #024A76, #3471B8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #3471B8, #024A76);
        }
      `}</style>
    </div>
  );
};

export default AdminMateriiPage; 