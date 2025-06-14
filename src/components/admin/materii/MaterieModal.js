import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { facultati, specializari, ani, semestre } from './constants';

const MaterieModal = ({ materie, onClose, setMaterii, availableProfessors }) => {
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

export default MaterieModal; 