import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { isAdmin } from '../../utils/userRoles';
import { useMaterii } from '../../contexts/MateriiContext';

// Toast notification component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${getToastStyles()}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            className="inline-flex text-white hover:text-gray-200 focus:outline-none focus:text-gray-200"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminIstoricAcademicPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [filter, setFilter] = useState('');
  const [facultateFilter, setFacultateFilter] = useState('');
  const [specializareFilter, setSpecializareFilter] = useState('');
  const [anFilter, setAnFilter] = useState('');
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
  const [editingGrade, setEditingGrade] = useState(null); // For inline grade editing
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { allMaterii, loading: materiiLoading } = useMaterii();
  
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
  const [toast, setToast] = useState(null);

  // Toast notification functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const adminAccess = await isAdmin(user);
        setHasAccess(adminAccess);
        
        if (!adminAccess) {
          navigate('/');
        }
      }
    };

    checkAccess();
  }, [user, navigate]);

  // Add useEffect to fetch students when component mounts
  useEffect(() => {
    if (hasAccess) {
      fetchStudents();
    }
  }, [hasAccess]);

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

  // Convert allMaterii context data to array format for compatibility
  useEffect(() => {
    if (!materiiLoading && allMaterii) {
      const coursesData = Object.values(allMaterii).map(materie => ({
        id: materie.id,
        ...materie
      }));
      setAvailableCourses(coursesData);
    }
  }, [allMaterii, materiiLoading]);

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
      const hasUpdatedCourses = await addMateriiObligatorii(studentData, istoricData, istoricRef);
      
      // Doar dacă cursurile au fost actualizate, reîncarcă istoricul
      if (hasUpdatedCourses) {
        const updatedIstoricDoc = await getDoc(istoricRef);
        if (updatedIstoricDoc.exists()) {
          istoricData = updatedIstoricDoc.data();
        }
      }
      
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
      
      if (materiiObligatorii.length === 0) return false;
      
      let shouldUpdateIstoric = false;
      const updatedIstoric = {...istoricData};
      
      // Asigură-te că avem array-ul istoricAnual
      if (!updatedIstoric.istoricAnual) {
        updatedIstoric.istoricAnual = [];
      }
      
      // Determină anul universitar curent
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : // Pentru lunile ian-aug, folosim anul precedent-anul curent
        `${year}-${year+1}`;  // Pentru lunile sep-dec, folosim anul curent-anul următor
      
      // Create a Set to track which courses have already been added
      const addedCourses = new Set();
      
      // First, identify all courses that already exist in the history
      if (updatedIstoric.istoricAnual) {
        for (const anual of updatedIstoric.istoricAnual) {
          if (anual.cursuri) {
            for (const curs of anual.cursuri) {
              addedCourses.add(curs.id);
            }
          }
        }
      }
      
      for (const materie of materiiObligatorii) {
        // Skip if this course is already in the history
        if (addedCourses.has(materie.id)) {
          continue;
        }
        
        // Add the mandatory course with a default grade of 0 (or other default value)
        const newNote = {
          id: materie.id,
          nume: materie.nume,
          credite: materie.credite || 0,
          nota: 0, // Nota 0 - neevaluată încă
          dataNota: new Date().getTime(), // Folosim timestamp în loc de Date object
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
          // Verifică dacă istoricul are proprietatea cursuri și este un array
          if (!updatedIstoric.istoricAnual[anualIndex].cursuri) {
            updatedIstoric.istoricAnual[anualIndex].cursuri = [];
          }
          
          // Verifică din nou dacă materia nu există deja în acest an/semestru specific
          const materieExistentaInAn = updatedIstoric.istoricAnual[anualIndex].cursuri.some(
            curs => curs.id === materie.id
          );
          
          if (!materieExistentaInAn) {
            // Adaugă nota la un istoric existent
            updatedIstoric.istoricAnual[anualIndex].cursuri.push(newNote);
          }
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
        
        // Mark the course as added
        addedCourses.add(materie.id);
        shouldUpdateIstoric = true;
      }
      
      if (shouldUpdateIstoric) {
        await updateDoc(istoricRef, updatedIstoric);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Eroare la adăugarea materiilor obligatorii:', error);
      return false;
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
        dataNota: new Date().getTime(),
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
        // Verifică dacă materia nu există deja în acest an/semestru specific
        const materieExistentaInAn = istoricData.istoricAnual[anualIndex].cursuri.some(
          curs => curs.id === noteFormData.materieId
        );
        
        if (materieExistentaInAn) {
          throw new Error('Materia există deja în acest an și semestru');
        }
        
        // Adaugă nota la un istoric existent
        const updatedIstoric = [...istoricData.istoricAnual];
        updatedIstoric[anualIndex].cursuri.push(newNote);
        
        await updateDoc(istoricRef, {
          istoricAnual: updatedIstoric
        });
      } else {
        // Verifică din nou întreaga structură pentru a evita duplicatele
        const reloadedDoc = await getDoc(istoricRef);
        const reloadedData = reloadedDoc.data();
        
        // Verifică dacă între timp nu s-a adăugat un record similar
        const conflictIndex = reloadedData.istoricAnual?.findIndex(
          item => item.anUniversitar === anUniversitar && 
                 item.anStudiu === noteFormData.anStudiu &&
                 item.semestru === parseInt(noteFormData.semestru)
        );
        
        if (conflictIndex >= 0) {
          // S-a adăugat între timp, folosim logica de update
          const materieExistentaInAn = reloadedData.istoricAnual[conflictIndex].cursuri.some(
            curs => curs.id === noteFormData.materieId
          );
          
          if (!materieExistentaInAn) {
            const updatedIstoric = [...reloadedData.istoricAnual];
            updatedIstoric[conflictIndex].cursuri.push(newNote);
            
            await updateDoc(istoricRef, {
              istoricAnual: updatedIstoric
            });
          } else {
            throw new Error('Materia există deja în acest an și semestru');
          }
        } else {
          // Creează un nou istoric anual - EVITÂND arrayUnion pentru a preveni duplicatele
          const newAnualRecord = {
            anUniversitar: anUniversitar,
            anStudiu: noteFormData.anStudiu,
            semestru: parseInt(noteFormData.semestru),
            cursuri: [newNote]
          };
          
          // În loc de arrayUnion, folosim updateDoc cu întreaga structură
          const updatedIstoric = [...(reloadedData.istoricAnual || []), newAnualRecord];
          
          await updateDoc(istoricRef, {
            istoricAnual: updatedIstoric
          });
        }
      }
      
      // In loc să reîncarce datele studentului, actualizăm direct datele în state
      try {
        // Actualizăm starea direct, fără a declanșa o nouă încărcare
        const updatedIstoricDoc = await getDoc(istoricRef);
        if (updatedIstoricDoc.exists()) {
          const updatedIstoricData = updatedIstoricDoc.data();
          setSelectedStudentData(prevData => ({
            ...prevData,
            istoric: updatedIstoricData
          }));
        }
      } catch (error) {
        console.error('Eroare la actualizarea datelor:', error);
      }
      
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
      showToast('Nota a fost adăugată cu succes!');
      
    } catch (error) {
      console.error('Eroare la adăugarea notei:', error);
      setErrorMessage('Eroare la adăugarea notei: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Începe editarea unei note existente
  const startEditingNote = (anualIndex, noteIndex) => {
    const notaData = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri[noteIndex];
    
    setEditNoteForm({
      id: notaData.id,
      nume: notaData.nume,
      credite: notaData.credite,
      nota: notaData.nota,
      status: notaData.status || 'neevaluat',
      profesor: notaData.profesor || 'Nespecificat',
      obligatorie: notaData.obligatorie || false
    });
    
    setEditingNoteId(`${anualIndex}-${noteIndex}`);
  };

  // Anulează editarea unei note
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteForm({
      id: '',
      nume: '',
      credite: 0,
      nota: 0,
      status: 'neevaluat',
      profesor: '',
      obligatorie: false
    });
  };

  // Start inline grade editing
  const startInlineGradeEdit = (anualIndex, noteIndex, currentGrade) => {
    setEditingGrade({
      key: `${anualIndex}-${noteIndex}`,
      value: currentGrade
    });
  };

  // Handle inline grade change
  const handleInlineGradeChange = (value) => {
    setEditingGrade(prev => ({
      ...prev,
      value: value
    }));
  };

  // Save inline grade edit
  const saveInlineGrade = async (anualIndex, noteIndex) => {
    if (!editingGrade || !selectedStudent) return;
    
    const newGrade = parseInt(editingGrade.value) || 0;
    
    // Validate grade
    if (isNaN(newGrade) || newGrade < 0 || newGrade > 10) {
      setErrorMessage('Nota trebuie să fie un număr întreg între 0 și 10');
      setEditingGrade(null);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      // Get existing note
      const existingNote = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri[noteIndex];
      
      // Determine status based on grade
      let status = 'neevaluat';
      if (newGrade > 0) {
        status = newGrade >= 5 ? 'promovat' : 'nepromovat';
      }
      
      // Update note
      const updatedNote = {
        ...existingNote,
        nota: newGrade,
        status: status,
        dataNota: new Date().getTime()
      };
      
      // Update in history
      const updatedIstoric = {...selectedStudentData.istoric};
      updatedIstoric.istoricAnual[anualIndex].cursuri[noteIndex] = updatedNote;
      
      // Save to database
      const istoricRef = doc(db, 'istoricAcademic', selectedStudent);
      await updateDoc(istoricRef, updatedIstoric);
      
      // Update local state
      setSelectedStudentData(prevData => ({
        ...prevData,
        istoric: updatedIstoric
      }));
      
      setEditingGrade(null);
      setLoading(false);
      showToast('Nota a fost actualizată cu succes!');
      
    } catch (error) {
      console.error('Eroare la actualizarea notei:', error);
      setErrorMessage('Eroare la actualizarea notei: ' + error.message);
      setLoading(false);
      setEditingGrade(null);
    }
  };

  // Cancel inline grade edit
  const cancelInlineGradeEdit = () => {
    setEditingGrade(null);
  };

  // Salvează nota editată
  const handleSaveNote = async (anualIndex, noteIndex) => {
    await handleSaveEditedNote();
  };

  // Salvează nota editată
  const handleSaveEditedNote = async () => {
    if (!selectedStudent || !editingNoteId) return;
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const [anualIndex, noteIndex] = editingNoteId.split('-').map(Number);
      
      // Verifică dacă indicii sunt valizi
      if (anualIndex < 0 || noteIndex < 0 || 
          !selectedStudentData.istoric.istoricAnual[anualIndex] || 
          !selectedStudentData.istoric.istoricAnual[anualIndex].cursuri[noteIndex]) {
        throw new Error('Indici invalizi pentru nota editată');
      }
      
      // Obține nota existentă
      const existingNote = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri[noteIndex];
      
      // Memorăm anul actual pentru a-l păstra
      const currentActiveYear = activeYear;
      
      // Determină statusul pe baza notei
      let status = 'neevaluat';
      if (editNoteForm.nota > 0) {
        status = editNoteForm.nota >= 5 ? 'promovat' : 'nepromovat';
      }
      
      // Actualizează doar nota și statusul, păstrând celelalte câmpuri neschimbate
      const updatedNote = {
        ...existingNote,
        nota: editNoteForm.nota,
        status: status,
        dataNota: new Date().getTime()
      };
      
      // Actualizează nota în istoric
      const updatedIstoric = {...selectedStudentData.istoric};
      updatedIstoric.istoricAnual[anualIndex].cursuri[noteIndex] = updatedNote;
      
      // Salvează în baza de date
      const istoricRef = doc(db, 'istoricAcademic', selectedStudent);
      await updateDoc(istoricRef, updatedIstoric);
      
      // Resetează starea de editare
      setEditingNoteId(null);
      
      // În loc să reîncarce datele studentului, actualizăm direct datele în state
      try {
        // Actualizăm starea direct, fără a declanșa o nouă încărcare
        const updatedIstoricDoc = await getDoc(istoricRef);
        if (updatedIstoricDoc.exists()) {
          const updatedIstoricData = updatedIstoricDoc.data();
          setSelectedStudentData(prevData => ({
            ...prevData,
            istoric: updatedIstoricData
          }));
          
          // Restaurăm anul activ
          setActiveYear(currentActiveYear);
        }
      } catch (error) {
        console.error('Eroare la actualizarea datelor după editare:', error);
      }
      
      setLoading(false);
      showToast('Nota a fost actualizată cu succes!');
      
    } catch (error) {
      console.error('Eroare la actualizarea notei:', error);
      setErrorMessage('Eroare la actualizarea notei: ' + error.message);
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
      
      // În loc să reîncarce datele studentului, actualizăm direct datele în state
      try {
        // Actualizăm starea direct, fără a declanșa o nouă încărcare
        const updatedIstoricDoc = await getDoc(istoricRef);
        if (updatedIstoricDoc.exists()) {
          const updatedIstoricData = updatedIstoricDoc.data();
          setSelectedStudentData(prevData => ({
            ...prevData,
            istoric: updatedIstoricData
          }));
        }
      } catch (error) {
        console.error('Eroare la actualizarea datelor după ștergere:', error);
      }
      
      showToast('Nota a fost ștearsă cu succes!');
      
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

  // Filtrarea studenților în funcție de termenul de căutare și filtre
  const filteredStudents = students.filter(student => {
    const searchTerm = filter.toLowerCase();
    const matchesSearch = !filter || (
      student.nume?.toLowerCase().includes(searchTerm) ||
      student.prenume?.toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm) ||
      (student.numarMatricol && student.numarMatricol.toLowerCase().includes(searchTerm))
    );
    
    const matchesFacultate = !facultateFilter || student.facultate === facultateFilter;
    const matchesSpecializare = !specializareFilter || student.specializare === specializareFilter;
    const matchesAn = !anFilter || student.an === anFilter;
    
    return matchesSearch && matchesFacultate && matchesSpecializare && matchesAn;
  });

  // Obține listele unice pentru filtre
  const facultati = [...new Set(students.map(s => s.facultate).filter(Boolean))];
  const specializari = [...new Set(students.filter(s => !facultateFilter || s.facultate === facultateFilter).map(s => s.specializare).filter(Boolean))];
  const ani = [...new Set(students.map(s => s.an).filter(Boolean))];

  // Resetează filtrele dependente când se schimbă facultatea
  const handleFacultateChange = (value) => {
    setFacultateFilter(value);
    setSpecializareFilter(''); // Resetează specializarea când se schimbă facultatea
  };

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
    const istoricFiltrat = getFilteredIstoricAnual();
    
    // Grupează cursurile pe semestre (folosind anStudiu și semestru pentru a grupa corect)
    const cursuriBySemestru = {};
    
    for (const anual of istoricFiltrat) {
      const semesterId = `${anual.anStudiu}-${anual.semestru}`;
      if (!cursuriBySemestru[semesterId]) {
        cursuriBySemestru[semesterId] = {
          anStudiu: anual.anStudiu,
          semestru: anual.semestru,
          anUniversitar: anual.anUniversitar || '', // Handle cases where anUniversitar might be missing
          cursuri: []
        };
      }
      
      for (const curs of anual.cursuri) {
        cursuriBySemestru[semesterId].cursuri.push({
          ...curs,
          anStudiu: anual.anStudiu,
          semestru: anual.semestru,
          anUniversitar: anual.anUniversitar || ''
        });
      }
    }
    
    // Sortează semestrele după an de studiu și semestru
    return Object.values(cursuriBySemestru).sort((a, b) => {
      if (a.anStudiu !== b.anStudiu) {
        return a.anStudiu.localeCompare(b.anStudiu);
      }
      return a.semestru - b.semestru;
    });
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-4">Acces Interzis</h2>
          <p className="mt-2 text-gray-600 mb-6">Nu aveți permisiunea de a accesa această pagină.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
          >
            Înapoi la Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
              Administrare Istoric Academic
            </h1>
          </div>
        </div>
        
        {errorMessage && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 mb-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
                  Studenți
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredStudents.length} din {students.length}
                </div>
              </div>
              
              {/* Search și Filtre */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#024A76]/60 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Caută student..."
                    className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent shadow-sm hover:shadow-md transition-all duration-300"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                
                {/* Filtre */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#024A76] mb-1">Facultate</label>
                    <select
                      value={facultateFilter}
                      onChange={(e) => handleFacultateChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <option value="">Toate facultățile</option>
                      {facultati.map(facultate => (
                        <option key={facultate} value={facultate}>{facultate}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-[#024A76] mb-1">Specializare</label>
                    <select
                      value={specializareFilter}
                      onChange={(e) => setSpecializareFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent shadow-sm hover:shadow-md transition-all duration-300 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                      disabled={!facultateFilter}
                    >
                      <option value="">Toate specializările</option>
                      {specializari.map(specializare => (
                        <option key={specializare} value={specializare}>{specializare}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-[#024A76] mb-1">An</label>
                    <select
                      value={anFilter}
                      onChange={(e) => setAnFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <option value="">Toți anii</option>
                      {ani.map(an => (
                        <option key={an} value={an}>Anul {an}</option>
                      ))}
                    </select>
                  </div>
                  
                  {(facultateFilter || specializareFilter || anFilter) && (
                    <button
                      onClick={() => {
                        setFacultateFilter('');
                        setSpecializareFilter('');
                        setAnFilter('');
                      }}
                      className="w-full px-3 py-2 text-xs text-[#024A76] hover:text-[#3471B8] transition-colors duration-200 font-medium border border-[#024A76]/30 rounded-lg hover:bg-[#024A76]/5"
                    >
                      Resetează filtrele
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Nu există studenți</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div 
                        key={student.id}
                        className={`p-4 cursor-pointer rounded-lg transition-all duration-300 hover:shadow-md border ${
                          selectedStudent === student.id 
                            ? 'bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-yellow-accent/20 dark:to-yellow-accent/10 border-[#E3AB23] dark:border-yellow-accent shadow-md' 
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 hover:border-[#024A76]/30 dark:hover:border-yellow-accent/30'
                        }`}
                        onClick={() => handleSelectStudent(student.id)}
                      >
                        <div className="font-semibold text-[#024A76] dark:text-blue-light mb-1">{student.nume} {student.prenume}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                          </svg>
                          {student.facultate} - {student.specializare}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {selectedStudentData ? (
              <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
                    Istoric Academic: {selectedStudentData.nume} {selectedStudentData.prenume}
                  </h2>
                </div>
                
                {/* Detalii student */}
                <div className="bg-gradient-to-r from-[#024A76]/10 to-[#3471B8]/5 dark:from-gray-700/50 dark:to-gray-600/30 p-8 rounded-xl mb-6 border border-gray-200 dark:border-gray-600 shadow-lg backdrop-blur-sm">
                  <h3 className="font-bold text-xl mb-6 text-[#024A76] dark:text-blue-light flex items-center">
                    <div className="bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-yellow-accent dark:to-yellow-accent/80 p-2 rounded-lg mr-3 shadow-md">
                      <svg className="w-6 h-6 text-[#024A76] dark:text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Informații Student
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-white/60 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm block mb-1">Facultate</span> 
                        <span className="text-[#024A76] dark:text-blue-light font-bold text-lg">{selectedStudentData.facultate}</span>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm block mb-1">An de studiu</span> 
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-yellow-accent dark:to-yellow-accent/80 text-[#024A76] dark:text-gray-900 rounded-full font-bold text-sm shadow-sm">Anul {selectedStudentData.an}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/60 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm block mb-1">Specializare</span> 
                        <span className="text-[#024A76] dark:text-blue-light font-bold text-lg">{selectedStudentData.specializare}</span>
                      </div>
                                             <div className="bg-white/60 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-sm block mb-1">Nr. Matricol</span> 
                          <span className="text-[#024A76] dark:text-blue-light font-bold text-lg">{selectedStudentData.numarMatricol || 'N/A'}</span>
                        </div>
                    </div>
                  </div>
                </div>
                
                {/* Filtre pentru istoric */}
                <div className="mb-6">
                  <div className="flex space-x-2 border-b border-gray-200 pb-2">
                    {['I', 'II', 'III'].map((year) => (
                      <button
                        key={year}
                        className={`px-6 py-3 font-semibold rounded-t-lg transition-all duration-300 ${
                          activeYear === year 
                            ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white shadow-lg' 
                            : 'text-[#024A76] hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10'
                        }`}
                        onClick={() => setActiveYear(year)}
                      >
                        Anul {year}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Istoric în tabel grupat pe semestre */}
                <div className="overflow-x-auto">
                  {selectedStudentData.istoric?.istoricAnual && selectedStudentData.istoric.istoricAnual.length > 0 ? (
                    <div className="space-y-8">
                      {getAllCursuri().map((semestru, semestruIndex) => (
                        <div key={semestruIndex} className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                          <div className="bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-yellow-accent dark:to-yellow-accent/80 px-6 py-4">
                            <h3 className="text-lg font-semibold text-[#024A76] dark:text-gray-900 flex items-center drop-shadow-sm">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              </svg>
                              Anul {semestru.anStudiu}, Semestrul {semestru.semestru}
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider drop-shadow-sm">Materie</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider drop-shadow-sm">Credite</th>
                                  <th className="px-6 py-4 text-center text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider drop-shadow-sm">Notă</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white/80 dark:bg-gray-800/50">
                                {semestru.cursuri.map((curs, courseIndex) => {
                                  // Găsim indexul anual și al notei pentru această notă
                                  const anualIndex = selectedStudentData.istoric.istoricAnual.findIndex(a => 
                                    a.anStudiu === curs.anStudiu && a.semestru === curs.semestru
                                  );
                                  
                                  const noteIndex = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri.findIndex(c => 
                                    c.id === curs.id
                                  );
                                  
                                  const isEditing = editingNoteId === `${anualIndex}-${noteIndex}`;
                                  const isGradeEditing = editingGrade?.key === `${anualIndex}-${noteIndex}`;
                                  
                                  return (
                                    <tr key={courseIndex} className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all duration-200">
                                      <td className="px-6 py-4">
                                        {isEditing ? (
                                          <input
                                            type="text"
                                            value={editNoteForm.nume}
                                            onChange={(e) => setEditNoteForm({...editNoteForm, nume: e.target.value})}
                                            className="w-full px-3 py-2 border border-[#024A76]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E3AB23]"
                                          />
                                        ) : (
                                          <span className="font-semibold text-[#024A76] dark:text-blue-light">{curs.nume}</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={editNoteForm.credite}
                                            onChange={(e) => setEditNoteForm({...editNoteForm, credite: parseInt(e.target.value)})}
                                            className="w-20 px-3 py-2 border border-[#024A76]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E3AB23]"
                                          />
                                        ) : (
                                          <span className="px-2 py-1 bg-[#3471B8]/10 dark:bg-blue-light/20 text-[#024A76] dark:text-blue-light rounded-md font-semibold text-sm">
                                            {curs.credite}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {isEditing ? (
                                          <div className="flex items-center justify-center space-x-2">
                                                                                          <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={editNoteForm.nota}
                                                onChange={(e) => setEditNoteForm({...editNoteForm, nota: parseInt(e.target.value) || 0})}
                                                className="w-20 px-3 py-2 border border-[#024A76]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E3AB23] text-center"
                                              />
                                            <button
                                              onClick={() => handleSaveNote(anualIndex, noteIndex)}
                                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-200"
                                              title="Salvează modificările"
                                            >
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                              </svg>
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors duration-200"
                                              title="Anulează modificările"
                                            >
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                              </svg>
                                            </button>
                                          </div>
                                        ) : isGradeEditing ? (
                                          <div className="flex items-center justify-center space-x-2">
                                                                                         <input
                                               type="number"
                                               min="0"
                                               max="10"
                                               value={editingGrade.value}
                                               onChange={(e) => handleInlineGradeChange(e.target.value)}
                                               onBlur={() => saveInlineGrade(anualIndex, noteIndex)}
                                               onKeyPress={(e) => {
                                                 if (e.key === 'Enter') {
                                                   saveInlineGrade(anualIndex, noteIndex);
                                                 } else if (e.key === 'Escape') {
                                                   cancelInlineGradeEdit();
                                                 }
                                               }}
                                               className="w-16 text-center bg-transparent border-b-2 border-[#E3AB23] dark:border-yellow-accent focus:outline-none text-[#024A76] dark:text-blue-light font-bold text-sm"
                                               autoFocus
                                             />
                                            <button
                                              onClick={() => saveInlineGrade(anualIndex, noteIndex)}
                                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-200"
                                              title="Salvează nota"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                              </svg>
                                            </button>
                                          </div>
                                        ) : (
                                          <div 
                                            className="cursor-pointer hover:bg-[#024A76]/5 dark:hover:bg-blue-light/10 rounded-md p-2 transition-colors duration-200"
                                            onClick={() => startInlineGradeEdit(anualIndex, noteIndex, curs.nota)}
                                            title="Click pentru a edita nota"
                                          >
                                            {curs.nota === 0 ? 
                                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">Neevaluat</span> : 
                                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                curs.nota >= 5 
                                                  ? "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-300" 
                                                  : "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-300"
                                              }`}>
                                                {curs.nota}
                                              </span>
                                            }
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Nu există date pentru anul {activeYear} în istoricul academic</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Selectați un student pentru a vedea istoricul academic</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        
        {/* Custom scrollbar styles */}
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

        {/* Formular pentru adăugarea notelor */}
        {showAddNoteForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] bg-clip-text text-transparent">
                  Adaugă Notă Nouă
                </h3>
                <button
                  onClick={() => setShowAddNoteForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddNote} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">An de Studiu</label>
                    <select
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
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
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Semestru</label>
                    <select
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
                      value={noteFormData.semestru}
                      onChange={(e) => setNoteFormData({...noteFormData, semestru: parseInt(e.target.value)})}
                      required
                    >
                      <option value="1">Semestrul 1</option>
                      <option value="2">Semestrul 2</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Materie</label>
                    <select
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
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
                      <option value="">Selectează materia</option>
                      {availableCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.nume} ({course.credite} credite)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Credite</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
                      value={noteFormData.credite}
                      onChange={(e) => setNoteFormData({...noteFormData, credite: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] mb-2">Nota</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.01"
                      className="w-full px-4 py-3 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
                      value={noteFormData.nota}
                      onChange={(e) => setNoteFormData({...noteFormData, nota: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="obligatorie"
                        checked={noteFormData.obligatorie}
                        onChange={(e) => setNoteFormData({...noteFormData, obligatorie: e.target.checked})}
                        className="h-4 w-4 text-[#E3AB23] focus:ring-[#E3AB23] border-[#024A76]/30 rounded"
                      />
                      <label htmlFor="obligatorie" className="ml-2 block text-sm font-medium text-[#024A76]">
                        Materie obligatorie
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddNoteForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 text-[#024A76] rounded-lg hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Se salvează...' : 'Adaugă Nota'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

export default AdminIstoricAcademicPage; 