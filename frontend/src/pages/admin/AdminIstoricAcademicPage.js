import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { isAdmin } from '../../utils/userRoles';

const AdminIstoricAcademicPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [filter, setFilter] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [activeYear, setActiveYear] = useState('I');
  const [editNoteForm, setEditNoteForm] = useState({
    id: '',
    nume: '',
    credite: 0,
    nota: 0,
    status: '',
    profesor: '',
    obligatorie: false
  });
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  
  // State pentru formularul de adăugare note
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    anStudiu: '',
    semestru: 1,
    materieId: '',
    materieNume: '',
    credite: 0,
    nota: 0,
    obligatorie: false,
    status: 'nepromovat'
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const adminAccess = isAdmin(user);
        setHasAccess(adminAccess);
        
        if (adminAccess) {
          fetchStudents();
          fetchCourses();
        }
      }
    };

    checkAccess();
  }, [user]);

  // Obține lista de studenți
  const fetchStudents = async () => {
    try {
      const studentsQuery = query(collection(db, 'users'), where('tip', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sortează studenții alfabetic după nume
      studentsData.sort((a, b) => {
        if (a.nume === b.nume) {
          return a.prenume.localeCompare(b.prenume);
        }
        return a.nume.localeCompare(b.nume);
      });
      
      setStudents(studentsData);
      setLoading(false);
    } catch (error) {
      console.error('Eroare la încărcarea studenților:', error);
      setLoading(false);
    }
  };

  // Obține toate cursurile disponibile
  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'materii'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(coursesData);
    } catch (error) {
      console.error('Eroare la încărcarea cursurilor:', error);
    }
  };

  // Funcție pentru a verifica dacă există deja o notă pentru o materie obligatorie
  const checkIfMaterieObligatorieExists = (materieId, istoricAnual) => {
    if (!istoricAnual) return false;
    
    for (const anual of istoricAnual) {
      for (const curs of anual.cursuri) {
        if (curs.id === materieId) return true;
      }
    }
    
    return false;
  };

  // Selectarea unui student pentru a-i vedea/edita istoricul
  const handleSelectStudent = async (studentId) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setActiveYear('I');
    
    try {
      // Obține datele studentului
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      
      if (!studentDoc.exists()) {
        throw new Error('Studentul nu a fost găsit');
      }
      
      const studentData = {
        id: studentDoc.id,
        ...studentDoc.data()
      };
      
      // Verifică dacă există istoric academic pentru student
      const istoricRef = doc(db, 'istoricAcademic', studentId);
      const istoricDoc = await getDoc(istoricRef);
      
      let istoricData = null;
      
      if (istoricDoc.exists()) {
        istoricData = istoricDoc.data();
      } else {
        // Creează un istoric gol dacă nu există
        istoricData = {
          studentId: studentId,
          nume: studentData.nume || '',
          prenume: studentData.prenume || '',
          specializare: studentData.specializare || '',
          facultate: studentData.facultate || '',
          istoricAnual: []
        };
        
        // Salvează istoricul gol în baza de date
        await setDoc(istoricRef, istoricData);
      }
      
      // Adaugă materii obligatorii care lipsesc
      await addMateriiObligatorii(studentData, istoricData, istoricRef);
      
      setSelectedStudent(studentId);
      setSelectedStudentData({
        ...studentData,
        istoric: istoricData
      });
      
    } catch (error) {
      console.error('Eroare la încărcarea datelor studentului:', error);
      setErrorMessage('Eroare la încărcarea datelor studentului: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Adaugă materii obligatorii care nu sunt deja în istoric
  const addMateriiObligatorii = async (studentData, istoricData, istoricRef) => {
    try {
      const materiiObligatorii = availableCourses.filter(
        course => course.obligatorie && 
        course.facultate === studentData.facultate && 
        course.specializare === studentData.specializare
      );
      
      if (materiiObligatorii.length === 0) return;
      
      let shouldUpdateIstoric = false;
      const updatedIstoric = {...istoricData};
      
      // Determină anul universitar curent
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : // Pentru lunile ian-aug, folosim anul precedent-anul curent
        `${year}-${year+1}`;  // Pentru lunile sep-dec, folosim anul curent-anul următor
      
      for (const materie of materiiObligatorii) {
        // Verifică dacă materia obligatorie există deja în istoric
        if (!checkIfMaterieObligatorieExists(materie.id, istoricData.istoricAnual)) {
          // Adaugă materia obligatorie cu notă 0 (sau altă valoare implicită)
          const newNote = {
            id: materie.id,
            nume: materie.nume,
            credite: materie.credite || 0,
            nota: 0, // Nota 0 - neevaluată încă
            dataNota: new Date(),
            profesor: 'Nespecificat',
            obligatorie: true,
            status: 'neevaluat'
          };
          
          const anStudiu = materie.an || 'I'; // Presupunem anul I dacă nu este specificat
          const semestru = materie.semestru || 1; // Presupunem semestrul 1 dacă nu este specificat
          
          // Verifică dacă există deja un istoric pentru anul și semestrul specificat
          const anualIndex = updatedIstoric.istoricAnual.findIndex(
            item => item.anUniversitar === anUniversitar && 
                  item.anStudiu === anStudiu &&
                  item.semestru === semestru
          );
          
          if (anualIndex >= 0) {
            // Adaugă nota la un istoric existent
            updatedIstoric.istoricAnual[anualIndex].cursuri.push(newNote);
          } else {
            // Creează un nou istoric anual
            const newAnualRecord = {
              anUniversitar: anUniversitar,
              anStudiu: anStudiu,
              semestru: semestru,
              cursuri: [newNote]
            };
            
            updatedIstoric.istoricAnual.push(newAnualRecord);
          }
          
          shouldUpdateIstoric = true;
        }
      }
      
      if (shouldUpdateIstoric) {
        await updateDoc(istoricRef, updatedIstoric);
        
        // Reîncarcă datele istoricului
        const updatedIstoricDoc = await getDoc(istoricRef);
        if (updatedIstoricDoc.exists()) {
          istoricData = updatedIstoricDoc.data();
        }
      }
      
    } catch (error) {
      console.error('Eroare la adăugarea materiilor obligatorii:', error);
    }
  };

  // Adaugă o notă nouă în istoricul studentului
  const handleAddNote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      if (!selectedStudent) {
        throw new Error('Niciun student selectat');
      }
      
      // Validează datele
      if (noteFormData.nota < 1 || noteFormData.nota > 10) {
        throw new Error('Nota trebuie să fie între 1 și 10');
      }
      
      if (!noteFormData.materieId) {
        throw new Error('Trebuie să selectați o materie');
      }
      
      // Obține referința la documentul de istoric
      const istoricRef = doc(db, 'istoricAcademic', selectedStudent);
      
      // Obține istoricul actual
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) {
        throw new Error('Istoricul academic nu a fost găsit');
      }
      
      const istoricData = istoricDoc.data();
      
      // Determină statusul în funcție de notă
      const status = noteFormData.nota >= 5 ? 'promovat' : 'nepromovat';
      
      // Găsește materia pentru a obține numele
      const selectedCourse = availableCourses.find(course => course.id === noteFormData.materieId);
      
      // Determină anul universitar curent
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : // Pentru lunile ian-aug, folosim anul precedent-anul curent
        `${year}-${year+1}`;  // Pentru lunile sep-dec, folosim anul curent-anul următor
      
      // Creează o nouă notă
      const newNote = {
        id: noteFormData.materieId,
        nume: selectedCourse?.nume || noteFormData.materieNume,
        credite: parseInt(noteFormData.credite) || selectedCourse?.credite || 0,
        nota: parseInt(noteFormData.nota),
        dataNota: new Date(),
        profesor: selectedCourse?.profesor?.nume || 'Nespecificat',
        obligatorie: noteFormData.obligatorie,
        status: status
      };
      
      // Verifică dacă există deja un istoric pentru anul și semestrul specificat
      const anualIndex = istoricData.istoricAnual.findIndex(
        item => item.anUniversitar === anUniversitar && 
               item.anStudiu === noteFormData.anStudiu &&
               item.semestru === parseInt(noteFormData.semestru)
      );
      
      if (anualIndex >= 0) {
        // Adaugă nota la un istoric existent
        const updatedIstoric = [...istoricData.istoricAnual];
        updatedIstoric[anualIndex].cursuri.push(newNote);
        
        await updateDoc(istoricRef, {
          istoricAnual: updatedIstoric
        });
      } else {
        // Creează un nou istoric anual
        const newAnualRecord = {
          anUniversitar: anUniversitar,
          anStudiu: noteFormData.anStudiu,
          semestru: parseInt(noteFormData.semestru),
          cursuri: [newNote]
        };
        
        await updateDoc(istoricRef, {
          istoricAnual: arrayUnion(newAnualRecord)
        });
      }
      
      // Reîncarcă datele studentului
      await handleSelectStudent(selectedStudent);
      
      // Resetează formularul
      setNoteFormData({
        anStudiu: '',
        semestru: 1,
        materieId: '',
        materieNume: '',
        credite: 0,
        nota: 0,
        obligatorie: false,
        status: 'nepromovat'
      });
      
      setShowAddNoteForm(false);
      setSuccessMessage('Nota a fost adăugată cu succes!');
      
    } catch (error) {
      console.error('Eroare la adăugarea notei:', error);
      setErrorMessage('Eroare la adăugarea notei: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Începe editarea unei note existente
  const startEditingNote = (anualIndex, noteIndex) => {
    const note = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri[noteIndex];
    setEditNoteForm({
      id: note.id,
      nume: note.nume,
      credite: note.credite,
      nota: note.nota,
      status: note.status,
      profesor: note.profesor,
      obligatorie: note.obligatorie || false,
      anualIndex,
      noteIndex
    });
    setEditingNoteId(`${anualIndex}-${noteIndex}`);
  };

  // Salvează o notă editată
  const handleSaveEditedNote = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const { anualIndex, noteIndex, ...noteData } = editNoteForm;
      
      // Determină statusul în funcție de notă
      const status = noteData.nota >= 5 ? 'promovat' : 'nepromovat';
      noteData.status = status;
      noteData.dataNota = new Date(); // Actualizăm data notei
      
      console.log('Actualizăm nota pentru:', selectedStudent);
      console.log('Detalii actualizare:', noteData);
      
      // Obține referința la documentul de istoric
      const istoricRef = doc(db, 'istoricAcademic', selectedStudent);
      
      // Obține istoricul actual
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) {
        throw new Error('Istoricul academic nu a fost găsit');
      }
      
      const istoricData = istoricDoc.data();
      
      // Actualizează nota în istoricul anual
      const updatedIstoric = [...istoricData.istoricAnual];
      updatedIstoric[anualIndex].cursuri[noteIndex] = {
        ...updatedIstoric[anualIndex].cursuri[noteIndex],
        ...noteData
      };
      
      // Actualizăm direct întregul document pentru a evita probleme de sincronizare
      await setDoc(istoricRef, {
        ...istoricData,
        istoricAnual: updatedIstoric,
        lastUpdated: new Date() // Adăugăm un timestamp pentru a forța actualizarea
      });
      
      // Reîncarcă datele studentului
      await handleSelectStudent(selectedStudent);
      
      setEditingNoteId(null);
      setSuccessMessage('Nota a fost actualizată cu succes!');
      
    } catch (error) {
      console.error('Eroare la actualizarea notei:', error);
      setErrorMessage('Eroare la actualizarea notei: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Șterge o notă
  const handleDeleteNote = async (anualIndex, noteIndex) => {
    if (!window.confirm('Sigur doriți să ștergeți această notă?')) {
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Obține referința la documentul de istoric
      const istoricRef = doc(db, 'istoricAcademic', selectedStudent);
      
      // Obține istoricul actual
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) {
        throw new Error('Istoricul academic nu a fost găsit');
      }
      
      const istoricData = istoricDoc.data();
      
      // Salvează ID-ul materiei care urmează să fie ștearsă
      const materieId = istoricData.istoricAnual[anualIndex].cursuri[noteIndex].id;
      
      // Actualizează istoricul anual, eliminând nota
      const updatedIstoric = [...istoricData.istoricAnual];
      const updatedCursuri = [...updatedIstoric[anualIndex].cursuri];
      updatedCursuri.splice(noteIndex, 1);
      updatedIstoric[anualIndex].cursuri = updatedCursuri;
      
      // Dacă nu mai există cursuri pentru acel an/semestru, eliminăm înregistrarea
      if (updatedCursuri.length === 0) {
        updatedIstoric.splice(anualIndex, 1);
      }
      
      await updateDoc(istoricRef, {
        istoricAnual: updatedIstoric
      });
      
      // Actualizează lista de materii înscrise ale studentului (elimină materia din listă)
      const userRef = doc(db, 'users', selectedStudent);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const materiiInscrise = userData.materiiInscrise || [];
        
        // Verifică dacă materia există în lista de înscrieri
        if (materiiInscrise.includes(materieId)) {
          // Elimină materia din lista de înscrieri
          await updateDoc(userRef, {
            materiiInscrise: materiiInscrise.filter(id => id !== materieId)
          });
          
          // Actualizează și lista de studenți înscriși din colecția de materii
          const materieRef = doc(db, 'materii', materieId);
          const materieDoc = await getDoc(materieRef);
          
          if (materieDoc.exists()) {
            const materieData = materieDoc.data();
            const studentiInscrisi = materieData.studentiInscrisi || [];
            
            // Elimină studentul din lista de studenți înscriși la materie
            await updateDoc(materieRef, {
              studentiInscrisi: studentiInscrisi.filter(s => s.id !== selectedStudent)
            });
          }
        }
      }
      
      // Reîncarcă datele studentului
      await handleSelectStudent(selectedStudent);
      
      setSuccessMessage('Nota a fost ștearsă cu succes!');
      
    } catch (error) {
      console.error('Eroare la ștergerea notei:', error);
      setErrorMessage('Eroare la ștergerea notei: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Adaugă o materie nouă la care studentul este înscris
  const handleAddInscriereMaterie = async () => {
    if (!selectedStudent) return;
    
    setShowAddNoteForm(true);
  };

  // Filtrarea studenților după nume sau prenume
  const filteredStudents = students.filter(student => {
    const searchTerm = filter.toLowerCase();
    return (
      student.nume?.toLowerCase().includes(searchTerm) ||
      student.prenume?.toLowerCase().includes(searchTerm)
    );
  });

  // Filtrează istoricul în funcție de anul selectat
  const getFilteredIstoricAnual = () => {
    if (!selectedStudentData?.istoric?.istoricAnual) return [];
    
    if (activeYear === 'toate') {
      return selectedStudentData.istoric.istoricAnual
        .sort((a, b) => a.anUniversitar.localeCompare(b.anUniversitar) || a.semestru - b.semestru);
    }
    
    return selectedStudentData.istoric.istoricAnual
      .filter(anual => anual.anStudiu === activeYear)
      .sort((a, b) => a.anUniversitar.localeCompare(b.anUniversitar) || a.semestru - b.semestru);
  };

  // Obține toate cursurile pentru afișare într-un tabel unic
  const getAllCursuri = () => {
    const allCursuri = [];
    const istoricFiltrat = getFilteredIstoricAnual();
    
    for (const anual of istoricFiltrat) {
      for (const curs of anual.cursuri) {
        allCursuri.push({
          ...curs,
          anStudiu: anual.anStudiu,
          semestru: anual.semestru,
          anUniversitar: anual.anUniversitar
        });
      }
    }
    
    return allCursuri;
  };

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Acces Interzis</h2>
        <p className="mt-2 text-gray-600">Nu aveți permisiunea de a accesa această pagină.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-[#034a76] text-white rounded hover:bg-[#023557]"
        >
          Înapoi la Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Administrare Istoric Academic</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Studenți</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Caută după nume sau prenume"
                className="w-full px-4 py-2 border rounded-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="text-center py-4">Se încarcă...</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-gray-500">Nu există studenți</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <li 
                        key={student.id}
                        className={`py-3 px-2 cursor-pointer hover:bg-gray-50 rounded ${
                          selectedStudent === student.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectStudent(student.id)}
                      >
                        <div className="font-medium">{student.nume} {student.prenume}</div>
                        <div className="text-sm text-gray-500">
                          {student.facultate} - {student.specializare}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {selectedStudentData ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Istoric Academic: {selectedStudentData.nume} {selectedStudentData.prenume}
                </h2>
                <button
                  onClick={() => setShowAddNoteForm(true)}
                  className="px-4 py-2 bg-[#034a76] text-white rounded hover:bg-[#023557]"
                >
                  Adaugă Notă
                </button>
              </div>
              
              {/* Detalii student */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-medium mb-2">Informații Student</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Facultate:</span> {selectedStudentData.facultate}
                  </div>
                  <div>
                    <span className="text-gray-500">Specializare:</span> {selectedStudentData.specializare}
                  </div>
                  <div>
                    <span className="text-gray-500">An:</span> {selectedStudentData.an}
                  </div>
                  <div>
                    <span className="text-gray-500">Număr Matricol:</span> {selectedStudentData.numarMatricol || 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Filtre pentru istoric */}
              <div className="mb-6">
                <div className="flex space-x-4 border-b pb-2">
                  <button
                    className={`px-4 py-2 font-medium rounded-t transition-colors ${
                      activeYear === 'I' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveYear('I')}
                  >
                    Anul I
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-t transition-colors ${
                      activeYear === 'II' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveYear('II')}
                  >
                    Anul II
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-t transition-colors ${
                      activeYear === 'III' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveYear('III')}
                  >
                    Anul III
                  </button>
                </div>
              </div>
              
              {/* Istoric în tabel unic */}
              <div className="overflow-x-auto">
                {selectedStudentData.istoric?.istoricAnual && selectedStudentData.istoric.istoricAnual.length > 0 ? (
                  <table className="min-w-full mt-2">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materie</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credite</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Notă</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getAllCursuri().map((curs, courseIndex) => {
                        // Găsim indexul anual și al notei pentru această notă
                        const anualIndex = selectedStudentData.istoric.istoricAnual.findIndex(a => 
                          a.anStudiu === curs.anStudiu && a.semestru === curs.semestru && a.anUniversitar === curs.anUniversitar
                        );
                        
                        const noteIndex = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri.findIndex(c => 
                          c.id === curs.id
                        );
                        
                        const isEditing = editingNoteId === `${anualIndex}-${noteIndex}`;
                        
                        return (
                          <tr key={courseIndex} className={curs.nota >= 5 ? "bg-green-50" : (curs.nota === 0 ? "bg-gray-50" : "bg-red-50")}>
                            {isEditing ? (
                              <>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 border rounded"
                                    value={editNoteForm.nume}
                                    onChange={(e) => setEditNoteForm({...editNoteForm, nume: e.target.value})}
                                    required
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    className="w-full px-2 py-1 border rounded"
                                    value={editNoteForm.credite}
                                    onChange={(e) => setEditNoteForm({...editNoteForm, credite: parseInt(e.target.value)})}
                                    required
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    className="w-full px-2 py-1 border rounded"
                                    value={editNoteForm.nota}
                                    onChange={(e) => setEditNoteForm({...editNoteForm, nota: parseInt(e.target.value)})}
                                    required
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleSaveEditedNote}
                                      className="text-green-600 hover:text-green-800"
                                      title="Salvează"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => setEditingNoteId(null)}
                                      className="text-gray-600 hover:text-gray-800"
                                      title="Anulează"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2">
                                  <div className="flex items-center">
                                    <span className="font-medium">{curs.nume}</span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      (An {curs.anStudiu}, Sem {curs.semestru})
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">{curs.credite}</td>
                                <td className="px-4 py-2 text-center font-medium">
                                  {curs.nota === 0 ? 
                                    <span className="text-gray-500">Neevaluat</span> : 
                                    <span className={curs.nota >= 5 ? "text-green-600" : "text-red-600"}>
                                      {curs.nota}
                                    </span>
                                  }
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => startEditingNote(anualIndex, noteIndex)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Editează"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNote(anualIndex, noteIndex)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Șterge"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nu există date pentru anul {activeYear} în istoricul academic</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Selectați un student pentru a vedea istoricul academic
            </div>
          )}
        </div>
      </div>
      
      {/* Formular pentru adăugarea notelor */}
      {showAddNoteForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Adaugă Notă Nouă</h3>
              <button
                onClick={() => setShowAddNoteForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">An de Studiu</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={noteFormData.anStudiu}
                    onChange={(e) => setNoteFormData({...noteFormData, anStudiu: e.target.value})}
                    required
                  >
                    <option value="">Selectează</option>
                    <option value="I">Anul I</option>
                    <option value="II">Anul II</option>
                    <option value="III">Anul III</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semestru</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={noteFormData.semestru}
                    onChange={(e) => setNoteFormData({...noteFormData, semestru: parseInt(e.target.value)})}
                    required
                  >
                    <option value="1">Semestrul 1</option>
                    <option value="2">Semestrul 2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materie</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={noteFormData.materieId}
                    onChange={(e) => {
                      const selectedCourse = availableCourses.find(course => course.id === e.target.value);
                      setNoteFormData({
                        ...noteFormData, 
                        materieId: e.target.value,
                        materieNume: selectedCourse?.nume || '',
                        credite: selectedCourse?.credite || 0,
                        obligatorie: selectedCourse?.obligatorie || false
                      });
                    }}
                    required
                  >
                    <option value="">Selectează o materie</option>
                    {availableCourses
                      .filter(course => 
                        course.facultate === selectedStudentData?.facultate && 
                        course.specializare === selectedStudentData?.specializare
                      )
                      .map(course => (
                        <option key={course.id} value={course.id}>
                          {course.nume} {course.obligatorie ? "(Obligatorie)" : ""}
                        </option>
                      ))}
                      <option value="alta">Altă materie...</option>
                  </select>
                </div>
                
                {/* Dacă se alege "Altă materie", se afișează câmpuri suplimentare */}
                {noteFormData.materieId === 'alta' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nume Materie</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={noteFormData.materieNume}
                        onChange={(e) => setNoteFormData({...noteFormData, materieNume: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credite</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        className="w-full px-3 py-2 border rounded-md"
                        value={noteFormData.credite}
                        onChange={(e) => setNoteFormData({...noteFormData, credite: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notă</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    className="w-full px-3 py-2 border rounded-md"
                    value={noteFormData.nota}
                    onChange={(e) => setNoteFormData({...noteFormData, nota: parseInt(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="obligatorie"
                    className="mr-2"
                    checked={noteFormData.obligatorie}
                    onChange={(e) => setNoteFormData({...noteFormData, obligatorie: e.target.checked})}
                  />
                  <label htmlFor="obligatorie" className="text-sm font-medium text-gray-700">
                    Materie Obligatorie
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddNoteForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#034a76] text-white rounded hover:bg-[#023557]"
                >
                  Adaugă Notă
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIstoricAcademicPage; 