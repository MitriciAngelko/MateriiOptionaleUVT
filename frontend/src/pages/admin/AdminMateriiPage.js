import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import DeleteIcon from '../../components/icons/DeleteIcon';
import MaterieDetailsModal from '../../components/student/MaterieDetailsModal';
import AdminMateriiModal from '../../components/admin/AdminMateriiModal';

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
  };

  const getFilteredMaterii = () => {
    return materii.filter(materie => {
      if (filters.facultate && materie.facultate !== filters.facultate) return false;
      if (filters.specializare && materie.specializare !== filters.specializare) return false;
      if (filters.an && materie.an !== filters.an) return false;
      return true;
    });
  };

  const renderFilters = () => (
    <div className="mb-6 bg-[#f5f5f5] p-4 rounded-lg shadow border border-[#034a76]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#034a76]">Filtre</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-[#034a76] hover:text-[#023557]"
        >
          Resetează filtrele
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#034a76] mb-1">Facultate</label>
          <select
            value={filters.facultate}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              facultate: e.target.value,
              specializare: ''
            }))}
            className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
          >
            <option value="">Toate facultățile</option>
            {facultati.map(fac => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#034a76] mb-1">Specializare</label>
          <select
            value={filters.specializare}
            onChange={(e) => setFilters(prev => ({ ...prev, specializare: e.target.value }))}
            className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
            disabled={!filters.facultate}
          >
            <option value="">Toate specializările</option>
            {filters.facultate && specializari[filters.facultate]?.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#034a76] mb-1">An</label>
          <select
            value={filters.an}
            onChange={(e) => setFilters(prev => ({ ...prev, an: e.target.value }))}
            className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#034a76]">Administrare Materii și Pachete</h1>
        <div className="space-x-4">
          <button
            onClick={() => setActiveTab('materii')}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'materii' ? 'bg-[#034a76] text-[#f5f5f5]' : 'bg-[#f5f5f5] text-[#034a76] border border-[#034a76]/30'
            }`}
          >
            Materii
          </button>
          <button
            onClick={() => setActiveTab('pachete')}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'pachete' ? 'bg-[#034a76] text-[#f5f5f5]' : 'bg-[#f5f5f5] text-[#034a76] border border-[#034a76]/30'
            }`}
          >
            Pachete
          </button>
        </div>
      </div>

      {activeTab === 'pachete' && (
        <div>
          <button
            onClick={() => setShowPachetModal(true)}
            className="mb-4 px-4 py-2 bg-[#034a76] text-[#f5f5f5] rounded hover:bg-[#023557] transition-colors"
          >
            Adaugă Pachet Nou
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pachete.map((pachet) => (
              <div key={pachet.id} className="border border-[#034a76]/20 rounded-lg p-4 relative bg-[#f5f5f5] shadow-sm">
                <button
                  onClick={() => handleDeletePachet(pachet.id)}
                  className="absolute top-2 right-2 p-2 text-red-600 hover:text-red-800"
                  title="Șterge pachet"
                >
                  <DeleteIcon />
                </button>
                <h3 className="text-lg font-semibold pr-8 text-[#034a76]">{pachet.nume}</h3>
                <div className="mt-2 text-sm text-[#034a76]/80">
                  <p>Facultate: {pachet.facultate || 'Toate'}</p>
                  <p>Specializare: {pachet.specializare || 'Toate'}</p>
                  <p>An: {pachet.an || 'Toți'}</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-[#034a76]">Materii în pachet:</h4>
                  <ul className="list-disc list-inside text-[#034a76]/90">
                    {pachet.materii.map((materie) => (
                      <li key={materie.id}>{materie.nume}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'materii' && (
        <div className="space-y-6">
          {renderFilters()}

          <div className="bg-[#f5f5f5] p-6 rounded-lg shadow-lg border border-[#034a76]/20">
            <h1 className="text-2xl font-bold text-[#034a76] mb-6">Administrare Materii</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#f5f5f5] p-6 rounded-lg shadow-md border border-[#034a76]/20">
                <h2 className="text-xl font-semibold mb-4 text-[#034a76]">Adaugă Materie Nouă</h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#034a76]">Nume Materie</label>
                      <input
                        type="text"
                        value={newMaterie.nume}
                        onChange={(e) => setNewMaterie({...newMaterie, nume: e.target.value})}
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#034a76]">Facultate</label>
                      <select
                        value={newMaterie.facultate}
                        onChange={(e) => setNewMaterie({...newMaterie, facultate: e.target.value})}
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                        required
                      >
                        <option value="">Selectează facultatea</option>
                        {facultati.map(facultate => (
                          <option key={facultate} value={facultate}>{facultate}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#034a76]">Specializare</label>
                      <select
                        value={newMaterie.specializare}
                        onChange={(e) => setNewMaterie({...newMaterie, specializare: e.target.value})}
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
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
                      <label className="block text-sm font-medium text-[#034a76]">An</label>
                      <select
                        value={newMaterie.an}
                        onChange={(e) => setNewMaterie({...newMaterie, an: e.target.value})}
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                        required
                      >
                        <option value="">Selectează anul</option>
                        {ani.map(an => (
                          <option key={an} value={an}>{an}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#034a76]">Semestru</label>
                      <select
                        value={newMaterie.semestru}
                        onChange={(e) => setNewMaterie({...newMaterie, semestru: e.target.value})}
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                        required
                      >
                        <option value="">Selectează semestrul</option>
                        {semestre.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#034a76]">Credite</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newMaterie.credite}
                        onChange={(e) => setNewMaterie({...newMaterie, credite: e.target.value})}
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
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
                        className="h-4 w-4 border-[#034a76]/30 rounded text-[#034a76] focus:ring-[#034a76]"
                      />
                      <label htmlFor="obligatorie-checkbox" className="ml-2 block text-sm font-medium text-[#034a76]">
                        Materie obligatorie
                      </label>
                    </div>

                    {!newMaterie.obligatorie && (
                      <div>
                        <label className="block text-sm font-medium text-[#034a76]">Locuri Disponibile</label>
                        <input
                          type="number"
                          min="1"
                          value={newMaterie.locuriDisponibile}
                          onChange={(e) => setNewMaterie({...newMaterie, locuriDisponibile: e.target.value})}
                          className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                          required={!newMaterie.obligatorie}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#034a76]">Descriere</label>
                      <textarea
                        value={newMaterie.descriere}
                        onChange={(e) => setNewMaterie({...newMaterie, descriere: e.target.value})}
                        rows="4"
                        className="mt-1 block w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#034a76] text-[#f5f5f5] py-2 px-4 rounded-md hover:bg-[#023557] transition-colors"
                    >
                      Adaugă Materie
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-[#f5f5f5] p-6 rounded-lg shadow-md border border-[#034a76]/20">
                <h2 className="text-xl font-semibold mb-4 text-[#034a76]">Materii Existente</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#034a76 #f5f5f5'
                }}>
                  {getFilteredMaterii().map((materie) => (
                    <div 
                      key={materie.id} 
                      className="border border-[#034a76]/20 rounded-lg p-4 hover:bg-[#034a76]/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedMaterie(materie)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-lg text-[#034a76]">{materie.nume}</h3>
                          <p className="text-sm text-[#034a76]/70">
                            {materie.facultate} - {materie.specializare} (Anul {materie.an})
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(materie.id);
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
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
        </div>
      )}

      {showPachetModal && <PachetModal onClose={() => setShowPachetModal(false)} />}
    </div>
  );
};

export default AdminMateriiPage; 