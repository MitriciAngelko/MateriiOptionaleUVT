import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import DeleteIcon from '../../components/icons/DeleteIcon';
import { Link } from 'react-router-dom';

const AdminMateriiPage = () => {
  const [activeTab, setActiveTab] = useState('materii'); // 'materii', 'pachete', sau 'bulk-upload'
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
  
  // State pentru filtrarea pachetelor
  const [searchTermPachete, setSearchTermPachete] = useState('');
  const [filtersPachete, setFiltersPachete] = useState({
    facultate: '',
    specializare: '',
    an: ''
  });

  // State pentru profesori
  const [availableProfessors, setAvailableProfessors] = useState([]);

  // State pentru bulk upload
  const [bulkUploadData, setBulkUploadData] = useState({
    facultate: '',
    specializare: '',
    file: null
  });

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
    fetchAvailableProfessors();
  }, []);

  const fetchAvailableProfessors = async () => {
    try {
      const profesorsQuery = query(
        collection(db, 'users'),
        where('tip', '==', 'profesor')
      );
      const profesorsSnapshot = await getDocs(profesorsQuery);
      const profesorsList = profesorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableProfessors(profesorsList);
    } catch (error) {
      console.error('Eroare la încărcarea profesorilor:', error);
    }
  };

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

  const getFilteredPachete = () => {
    // Funcție helper pentru eliminarea diacriticelor
    const removeDiacritics = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    return pachete.filter(pachet => {
      if (filtersPachete.facultate && pachet.facultate !== filtersPachete.facultate) return false;
      if (filtersPachete.specializare && pachet.specializare !== filtersPachete.specializare) return false;
      if (filtersPachete.an && pachet.an !== filtersPachete.an) return false;
      if (searchTermPachete) {
        const normalizedSearchTerm = removeDiacritics(searchTermPachete.toLowerCase());
        const normalizedPachetName = removeDiacritics(pachet.nume.toLowerCase());
        if (!normalizedPachetName.includes(normalizedSearchTerm)) return false;
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
    const [currentMaterie, setCurrentMaterie] = useState({...materie});
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
              // Include the complete user data with numarMatricol
              studentiAfisati.push({
                ...student,
                nume: userData.nume ? `${userData.prenume || ''} ${userData.nume}`.trim() : student.nume,
                numarMatricol: userData.numarMatricol,
                prenume: userData.prenume,
                email: userData.email
              });
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
    
    // Function to update professor's materiiPredate when removing them from course
    const updateProfessorMateriiPredate = async (professorId, materieId, action = 'remove') => {
      try {
        const professorRef = doc(db, 'users', professorId);
        const professorDoc = await getDoc(professorRef);
        
        if (professorDoc.exists()) {
          const professorData = professorDoc.data();
          let materiiPredate = professorData.materiiPredate || [];
          
          if (action === 'remove') {
            // Remove the course from professor's materiiPredate
            materiiPredate = materiiPredate.filter(materieObj => 
              materieObj.id !== materieId
            );
          } else if (action === 'add') {
            // Add the course to professor's materiiPredate if not already present
            const materieExists = materiiPredate.some(materieObj => materieObj.id === materieId);
            if (!materieExists) {
              materiiPredate.push({
                id: materieId,
                nume: editedMaterie.nume
              });
            }
          }
          
          await updateDoc(professorRef, {
            materiiPredate: materiiPredate
          });
        }
      } catch (error) {
        console.error('Eroare la actualizarea materiiPredate pentru profesor:', error);
      }
    };

    const handleSave = async () => {
      try {
        const materieRef = doc(db, 'materii', materie.id);
        
        // Check for removed professors and update their materiiPredate
        const originalProfessors = currentMaterie.profesori || [];
        const newProfessors = editedMaterie.profesori || [];
        
        // Find removed professors
        const removedProfessors = originalProfessors.filter(origProf => 
          !newProfessors.some(newProf => newProf.id === origProf.id)
        );
        
        // Find added professors
        const addedProfessors = newProfessors.filter(newProf => 
          !originalProfessors.some(origProf => origProf.id === newProf.id)
        );
        
        // Update materiiPredate for removed professors
        for (const professor of removedProfessors) {
          if (professor.id) {
            await updateProfessorMateriiPredate(professor.id, materie.id, 'remove');
          }
        }
        
        // Update materiiPredate for added professors
        for (const professor of addedProfessors) {
          if (professor.id) {
            await updateProfessorMateriiPredate(professor.id, materie.id, 'add');
          }
        }
        
        // Update the course document
        await updateDoc(materieRef, editedMaterie);
        
        // Update parent component's state
        setMaterii(prevMaterii => 
          prevMaterii.map(m => 
            m.id === materie.id ? {...m, ...editedMaterie} : m
          )
        );
        
        // Update current materie in modal to show fresh data
        const updatedMaterie = {...materie, ...editedMaterie};
        setCurrentMaterie(updatedMaterie);
        
        setIsEditing(false);
      } catch (error) {
        console.error('Eroare la actualizarea materiei:', error);
      }
    };
    
    const handleCancel = () => {
      setEditedMaterie({...currentMaterie});
      setIsEditing(false);
    };

    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
                  <div className="min-h-screen w-full">
            {/* Header fix cu gradient background */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-gray-800 dark:to-gray-900 shadow-lg">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={onClose}
                      className="flex items-center space-x-2 text-white hover:bg-white/10 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span className="font-medium">Înapoi</span>
                    </button>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMaterie.nume}
                        onChange={(e) => setEditedMaterie({...editedMaterie, nume: e.target.value})}
                        className="text-2xl font-bold bg-white/90 dark:bg-gray-800/90 text-[#024A76] dark:text-gray-200 border border-white/30 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-yellow-accent backdrop-blur-sm"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-white">{currentMaterie.nume}</h1>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Anulează</span>
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Salvează</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-[#E3AB23] hover:bg-[#E3AB23]/80 text-[#024A76] font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editează</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

                        {/* Content */}
            <div className="container mx-auto px-6 py-8">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-50/50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-[#024A76] dark:text-blue-light mb-6 text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 8a1 1 0 011-1h4a1 1 0 011 1v4H7v-4z" clipRule="evenodd" />
                    </svg>
                    Informații Generale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.facultate}
                          onChange={(e) => setEditedMaterie({...editedMaterie, facultate: e.target.value})}
                          className="w-full px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        >
                          {facultati.map(facultate => (
                            <option key={facultate} value={facultate}>{facultate}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-600/30 px-3 py-2 rounded-md">{currentMaterie.facultate}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.specializare}
                          onChange={(e) => setEditedMaterie({...editedMaterie, specializare: e.target.value})}
                          className="w-full px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        >
                          {specializari[editedMaterie.facultate]?.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-600/30 px-3 py-2 rounded-md">{currentMaterie.specializare}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">An</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.an}
                          onChange={(e) => setEditedMaterie({...editedMaterie, an: e.target.value})}
                          className="w-full px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        >
                          {ani.map(an => (
                            <option key={an} value={an}>{an}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-block bg-[#E3AB23]/20 dark:bg-yellow-accent/20 text-[#024A76] dark:text-yellow-accent px-3 py-1 rounded-full text-xs font-semibold">
                          An {currentMaterie.an}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">Semestru</p>
                      {isEditing ? (
                        <select
                          value={editedMaterie.semestru || ''}
                          onChange={(e) => setEditedMaterie({...editedMaterie, semestru: e.target.value})}
                          className="w-full px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        >
                          <option value="">Selectează semestrul</option>
                          {semestre.map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-block bg-[#3471B8]/20 dark:bg-blue-light/20 text-[#024A76] dark:text-blue-light px-3 py-1 rounded-full text-xs font-semibold">
                          Semestrul {currentMaterie.semestru || 'Nedefinit'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">Credite</p>
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={editedMaterie.credite}
                          onChange={(e) => setEditedMaterie({...editedMaterie, credite: e.target.value})}
                          className="w-full px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        />
                      ) : (
                        <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {currentMaterie.credite} ECTS
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">Tip Materie</p>
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
                            className="h-4 w-4 text-[#E3AB23] dark:text-yellow-accent focus:ring-[#E3AB23] dark:focus:ring-yellow-accent border-[#024A76]/30 dark:border-gray-600 rounded"
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">{editedMaterie.obligatorie ? 'Obligatorie' : 'Opțională'}</span>
                        </div>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          currentMaterie.obligatorie 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        }`}>
                          {currentMaterie.obligatorie ? 'Obligatorie' : 'Opțională'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#024A76] dark:text-blue-light mb-2">Locuri Disponibile</p>
                      {isEditing ? (
                        !editedMaterie.obligatorie ? (
                          <input
                            type="number"
                            min="1"
                            value={editedMaterie.locuriDisponibile || 0}
                            onChange={(e) => setEditedMaterie({...editedMaterie, locuriDisponibile: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                          />
                        ) : (
                          <p className="italic text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/30 px-3 py-2 rounded-md">Nelimitat (materie obligatorie)</p>
                        )
                      ) : (
                        <span className="inline-flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          {currentMaterie.obligatorie ? 'Nelimitat' : `${currentMaterie.locuriDisponibile || 0} locuri`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-[#024A76] dark:text-blue-light mb-4 text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Descriere
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editedMaterie.descriere || ''}
                      onChange={(e) => setEditedMaterie({...editedMaterie, descriere: e.target.value})}
                      rows="6"
                      placeholder="Adaugă o descriere pentru materie..."
                      className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 resize-none"
                    />
                  ) : (
                    <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white/50 dark:bg-gray-600/30 px-4 py-3 rounded-lg">
                        {currentMaterie.descriere || (
                          <span className="italic text-gray-500 dark:text-gray-400">Nicio descriere disponibilă.</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-[#024A76] dark:text-blue-light mb-4 text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Profesori Asignați
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Lista profesorilor actuali cu opțiune de ștergere */}
                      {editedMaterie.profesori?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-[#024A76] dark:text-blue-light">Profesori actuali:</h4>
                          {editedMaterie.profesori.map((profesor, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/50 dark:bg-gray-600/30 px-4 py-2 rounded-lg">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-[#024A76] dark:text-blue-light" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{profesor.nume}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const updatedProfesori = editedMaterie.profesori.filter((_, i) => i !== index);
                                  setEditedMaterie({...editedMaterie, profesori: updatedProfesori});
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-all duration-200"
                                title="Elimină profesor"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Form pentru adăugarea unui nou profesor */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <h4 className="text-sm font-medium text-[#024A76] dark:text-blue-light mb-3">Adaugă profesor nou:</h4>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 px-3 py-2 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 text-sm"
                            onChange={(e) => {
                              const selectedProfesorId = e.target.value;
                              if (selectedProfesorId) {
                                const selectedProfesor = availableProfessors.find(prof => prof.id === selectedProfesorId);
                                if (selectedProfesor) {
                                  const updatedProfesori = [...(editedMaterie.profesori || []), { 
                                    id: selectedProfesor.id,
                                    nume: `${selectedProfesor.prenume} ${selectedProfesor.nume}` 
                                  }];
                                  setEditedMaterie({...editedMaterie, profesori: updatedProfesori});
                                  e.target.value = ''; // Reset selection
                                }
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">Selectează profesor...</option>
                            {availableProfessors
                              .filter(profesor => {
                                // Filtrează doar profesorii de la aceeași facultate ca materia
                                return profesor.facultate === editedMaterie.facultate &&
                                       // Verifică dacă profesorul nu este deja adăugat
                                       !(editedMaterie.profesori || []).some(p => p.id === profesor.id);
                              })
                              .map(profesor => (
                                <option key={profesor.id} value={profesor.id}>
                                  {profesor.prenume} {profesor.nume} ({profesor.facultate})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Selectează un profesor din lista profesorilor de la {editedMaterie.facultate || 'această facultate'}
                        </p>
                        {availableProfessors.filter(profesor => 
                          profesor.facultate === editedMaterie.facultate &&
                          !(editedMaterie.profesori || []).some(p => p.id === profesor.id)
                        ).length === 0 && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Nu există profesori disponibili de la această facultate sau toți profesorii sunt deja asignați.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {currentMaterie.profesori?.length > 0 ? (
                        <div className="space-y-2">
                                                      {currentMaterie.profesori.map((profesor, index) => (
                            <div key={index} className="flex items-center bg-white/50 dark:bg-gray-600/30 px-4 py-2 rounded-lg">
                              <svg className="w-4 h-4 mr-2 text-[#024A76] dark:text-blue-light" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{profesor.nume}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400 italic">Nu există profesori asignați</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50/50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="sticky top-24 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#024A76] dark:text-blue-light text-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      Studenți Înscriși
                    </h3>
                    <span className="bg-[#E3AB23]/20 dark:bg-yellow-accent/20 text-[#024A76] dark:text-yellow-accent px-3 py-1 rounded-full text-sm font-bold">
                      {studentiAftati?.length || 0}/{materie.obligatorie ? '∞' : materie.locuriDisponibile || 0}
                    </span>
                  </div>
                  
                  {/* Search studenți */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Caută student..."
                      className="w-full px-4 py-2 pl-10 text-sm border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {studentiAftati?.length > 0 ? (
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                      {studentiAftati.map((student, index) => (
                        <div key={student.id} className="bg-white/70 dark:bg-gray-600/50 p-3 rounded-lg border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-600/70 transition-all duration-200">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded min-w-[40px] text-center">
                              #{index + 1}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {student.numarMatricol || 'N/A'}
                            </span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium text-sm flex-1">
                              {student.nume}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Nu există studenți înscriși</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Această materie nu are încă studenți înregistrați</p>
                    </div>
                  )}
                </div>
              </div>
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

  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== BULK UPLOAD FORM SUBMISSION ===');
    console.log('Facultate:', bulkUploadData.facultate);
    console.log('Specializare:', bulkUploadData.specializare);
    console.log('File:', bulkUploadData.file);
    console.log('File name:', bulkUploadData.file?.name);
    console.log('File size:', bulkUploadData.file?.size);
    console.log('File type:', bulkUploadData.file?.type);
    console.log('====================================');
    
    // Reset form pentru demonstrație
    setBulkUploadData({
      facultate: '',
      specializare: '',
      file: null
    });
    
    // Reset file input
    const fileInput = document.getElementById('bulk-upload-file');
    if (fileInput) {
      fileInput.value = '';
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
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('materii')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'materii'
                ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Materii
          </button>
          <button
            onClick={() => setActiveTab('pachete')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'pachete'
                ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Pachete
          </button>
          <button
            onClick={() => setActiveTab('bulk-upload')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'bulk-upload'
                ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Import în Masă
          </button>
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
            {/* Header cu buton și căutare */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowPachetModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-[#E3AB23] dark:to-[#E3AB23]/80 text-[#024A76] dark:text-[#024A76] rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Adaugă Pachet Nou
              </button>

              {/* Căutare pachete */}
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Caută pachete..."
                  value={searchTermPachete}
                  onChange={(e) => setSearchTermPachete(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTermPachete && (
                  <button
                    onClick={() => setSearchTermPachete('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtre pachete */}
            <div className="mb-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
                  Filtre Pachete
                </h2>
                <button
                  onClick={() => setFiltersPachete({ facultate: '', specializare: '', an: '' })}
                  className="text-sm text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-colors duration-200 font-medium"
                >
                  Resetează filtrele
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                  <select
                    value={filtersPachete.facultate}
                    onChange={(e) => setFiltersPachete(prev => ({ 
                      ...prev, 
                      facultate: e.target.value,
                      specializare: ''
                    }))}
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
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
                    value={filtersPachete.specializare}
                    onChange={(e) => setFiltersPachete(prev => ({ ...prev, specializare: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
                    disabled={!filtersPachete.facultate}
                  >
                    <option value="">Toate specializările</option>
                    {filtersPachete.facultate && specializari[filtersPachete.facultate]?.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
                  <select
                    value={filtersPachete.an}
                    onChange={(e) => setFiltersPachete(prev => ({ ...prev, an: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                  >
                    <option value="">Toți anii</option>
                    {ani.map(an => (
                      <option key={an} value={an}>{an}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredPachete().map((pachet) => (
                <div key={pachet.id} className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10">
                  <button
                    onClick={() => handleDeletePachet(pachet.id)}
                    className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                    title="Șterge pachet"
                  >
                    <DeleteIcon />
                  </button>
                  <h3 className="text-lg font-bold pr-8 text-[#024A76] dark:text-blue-light mb-4">{pachet.nume}</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <div className="flex items-center">
                      <span className="font-medium w-20 text-[#024A76] dark:text-blue-light">Facultate:</span>
                      <span>{pachet.facultate || 'Toate'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-20 text-[#024A76] dark:text-blue-light">Specializare:</span>
                      <span>{pachet.specializare || 'Toate'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-20 text-[#024A76] dark:text-blue-light">An:</span>
                      <span className="px-2 py-1 bg-[#E3AB23]/20 dark:bg-yellow-accent/20 text-[#024A76] dark:text-yellow-accent rounded-md font-semibold text-xs">
                        {pachet.an || 'Toți'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-[#024A76] dark:text-blue-light flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Materii în pachet:
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {pachet.materii.map((materie) => (
                        <div key={materie.id} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                          {materie.nume}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredPachete().length === 0 && (
                <div className="col-span-full text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V5a2 2 0 00-2-2H6a2 2 0 00-2 2v0h16z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-[#024A76] dark:text-blue-light">Nu s-au găsit pachete</h3>
                  <p className="mt-2 text-[#024A76]/60 dark:text-gray-300">
                    {searchTermPachete || filtersPachete.facultate || filtersPachete.specializare || filtersPachete.an 
                      ? 'Niciun pachet nu corespunde criteriilor de căutare.' 
                      : 'Nu există pachete create încă.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

                {activeTab === 'materii' && (
          <div className="space-y-8">
            {!selectedMaterie && renderFilters()}

            {!selectedMaterie ? (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold mb-6 text-[#024A76] dark:text-blue-light flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adaugă Materie Nouă
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Nume Materie</label>
                      <input
                        type="text"
                        value={newMaterie.nume}
                        onChange={(e) => setNewMaterie({...newMaterie, nume: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                      <select
                        value={newMaterie.facultate}
                        onChange={(e) => setNewMaterie({...newMaterie, facultate: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                        required
                      >
                        <option value="">Selectează facultatea</option>
                        {facultati.map(facultate => (
                          <option key={facultate} value={facultate}>{facultate}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
                      <select
                        value={newMaterie.specializare}
                        onChange={(e) => setNewMaterie({...newMaterie, specializare: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
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
                        <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
                        <select
                          value={newMaterie.an}
                          onChange={(e) => setNewMaterie({...newMaterie, an: e.target.value})}
                          className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                          required
                        >
                          <option value="">Selectează anul</option>
                          {ani.map(an => (
                            <option key={an} value={an}>{an}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Semestru</label>
                        <select
                          value={newMaterie.semestru}
                          onChange={(e) => setNewMaterie({...newMaterie, semestru: e.target.value})}
                          className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
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
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Credite</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newMaterie.credite}
                        onChange={(e) => setNewMaterie({...newMaterie, credite: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
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
                        className="h-4 w-4 text-[#E3AB23] dark:text-yellow-accent focus:ring-[#E3AB23] dark:focus:ring-yellow-accent border-[#024A76]/30 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="obligatorie-checkbox" className="ml-2 block text-sm font-semibold text-[#024A76] dark:text-blue-light">
                        Materie obligatorie
                      </label>
                    </div>

                    {!newMaterie.obligatorie && (
                      <div>
                        <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Locuri Disponibile</label>
                        <input
                          type="number"
                          min="1"
                          value={newMaterie.locuriDisponibile}
                          onChange={(e) => setNewMaterie({...newMaterie, locuriDisponibile: e.target.value})}
                          className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Descriere</label>
                      <textarea
                        value={newMaterie.descriere}
                        onChange={(e) => setNewMaterie({...newMaterie, descriere: e.target.value})}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md resize-none"
                        rows="3"
                        placeholder="Descrierea materiei..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
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
                        className="w-full px-4 py-3 pl-10 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                      />
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 cursor-pointer transition-all duration-300 hover:shadow-md"
                        onClick={() => setSelectedMaterie(materie)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-[#024A76] dark:text-blue-light mb-2">{materie.nume}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="px-2 py-1 bg-[#3471B8]/10 dark:bg-blue-light/20 text-[#024A76] dark:text-blue-light rounded-md text-xs font-medium">
                                {materie.facultate}
                              </span>
                              <span className="px-2 py-1 bg-[#E3AB23]/20 dark:bg-yellow-accent/20 text-[#024A76] dark:text-yellow-accent rounded-md text-xs font-medium">
                                {materie.specializare}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                                Anul {materie.an}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
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
                </div>
              </div>
            ) : (
              <MaterieModal 
                materie={selectedMaterie} 
                onClose={() => setSelectedMaterie(null)} 
              />
            )}
          </div>
        )}

        {activeTab === 'bulk-upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold mb-8 text-[#024A76] dark:text-blue-light flex items-center">
                <svg className="w-7 h-7 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Import în Masă Materii
              </h2>
              
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                      Funcționalitate în Dezvoltare
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Această funcționalitate permite importul automat al materiilor dintr-un fișier PDF. 
                      Selectează facultatea, specializarea și încarcă fișierul pentru a continua.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleBulkUploadSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
                    Facultate
                  </label>
                  <select
                    value={bulkUploadData.facultate}
                    onChange={(e) => setBulkUploadData({
                      ...bulkUploadData, 
                      facultate: e.target.value,
                      specializare: '' // Reset specializare când se schimbă facultatea
                    })}
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
                    required
                  >
                    <option value="">Selectează facultatea</option>
                    {facultati.map(facultate => (
                      <option key={facultate} value={facultate}>{facultate}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
                    Specializare
                  </label>
                  <select
                    value={bulkUploadData.specializare}
                    onChange={(e) => setBulkUploadData({
                      ...bulkUploadData, 
                      specializare: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
                    required
                    disabled={!bulkUploadData.facultate}
                  >
                    <option value="">Selectează specializarea</option>
                    {bulkUploadData.facultate && specializari[bulkUploadData.facultate]?.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
                    Fișier PDF cu Materii
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-[#E3AB23] dark:hover:border-yellow-accent transition-colors duration-300">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="bulk-upload-file" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-[#E3AB23] dark:text-yellow-accent hover:text-[#024A76] dark:hover:text-blue-light focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#E3AB23] dark:focus-within:ring-yellow-accent transition-colors duration-200">
                          <span>Încarcă un fișier</span>
                          <input
                            id="bulk-upload-file"
                            name="bulk-upload-file"
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            required
                            onChange={(e) => setBulkUploadData({
                              ...bulkUploadData, 
                              file: e.target.files[0]
                            })}
                          />
                        </label>
                        <p className="pl-1">sau trage și plasează</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, PDF până la 10MB
                      </p>
                      {bulkUploadData.file && (
                        <p className="text-sm text-[#024A76] dark:text-blue-light font-medium">
                          Fișier selectat: {bulkUploadData.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Procesează Fișierul
                </button>
              </form>
            </div>
          </div>
        )}

        {showPachetModal && <PachetModal onClose={() => setShowPachetModal(false)} />}
      </div>
      
      <style>{`
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