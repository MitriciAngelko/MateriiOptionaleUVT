import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { isAdmin } from '../../utils/userRoles';
import { useMaterii } from '../../contexts/MateriiContext';

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
      setSuccessMessage('Nota a fost actualizată cu succes!');
      
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
    
    // Grupează cursurile pe semestre
    const cursuriBySemestru = {};
    
    for (const anual of istoricFiltrat) {
      const semesterId = `${anual.anUniversitar}-${anual.semestru}`;
      if (!cursuriBySemestru[semesterId]) {
        cursuriBySemestru[semesterId] = {
          anStudiu: anual.anStudiu,
          semestru: anual.semestru,
          anUniversitar: anual.anUniversitar,
          cursuri: []
        };
      }
      
      for (const curs of anual.cursuri) {
        cursuriBySemestru[semesterId].cursuri.push({
          ...curs,
          anStudiu: anual.anStudiu,
          semestru: anual.semestru,
          anUniversitar: anual.anUniversitar
        });
      }
    }
    
    // Sortează semestrele după an universitar și semestru
    return Object.values(cursuriBySemestru).sort((a, b) => {
      if (a.anUniversitar !== b.anUniversitar) {
        return a.anUniversitar.localeCompare(b.anUniversitar);
      }
      return a.semestru - b.semestru;
    });
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] bg-clip-text text-transparent mb-8 drop-shadow-sm">
          Administrare Istoric Academic
        </h1>
        
        {errorMessage && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg shadow-md">
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] bg-clip-text text-transparent">
                  Studenți
                </h2>
                <div className="text-sm text-gray-600">
                  {filteredStudents.length} din {students.length}
                </div>
              </div>
              
              {/* Search și Filtre */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Caută student..."
                    className="w-full px-4 py-3 pl-10 border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 hover:shadow-md"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {/* Filtre */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#024A76] mb-1">Facultate</label>
                    <select
                      value={facultateFilter}
                      onChange={(e) => handleFacultateChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
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
                      className="w-full px-3 py-2 text-sm border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300 disabled:bg-gray-100"
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
                      className="w-full px-3 py-2 text-sm border border-[#024A76]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] focus:border-[#E3AB23] bg-white transition-all duration-300"
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
                            ? 'bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 border-[#E3AB23] shadow-md' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 hover:border-[#024A76]/30'
                        }`}
                        onClick={() => handleSelectStudent(student.id)}
                      >
                        <div className="font-semibold text-[#024A76] mb-1">{student.nume} {student.prenume}</div>
                        <div className="text-sm text-gray-600 flex items-center">
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
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] bg-clip-text text-transparent">
                    Istoric Academic: {selectedStudentData.nume} {selectedStudentData.prenume}
                  </h2>
                </div>
                
                {/* Detalii student */}
                <div className="bg-gradient-to-r from-[#024A76]/5 to-[#3471B8]/5 p-6 rounded-lg mb-6 border border-gray-200">
                  <h3 className="font-semibold mb-4 text-[#024A76] flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Informații Student
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-gray-600 font-medium w-20">Facultate:</span> 
                        <span className="text-[#024A76] font-semibold">{selectedStudentData.facultate}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 font-medium w-20">An:</span> 
                        <span className="px-2 py-1 bg-[#E3AB23]/20 text-[#024A76] rounded-md font-semibold text-sm">{selectedStudentData.an}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-gray-600 font-medium w-24">Specializare:</span> 
                        <span className="text-[#024A76] font-semibold">{selectedStudentData.specializare}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 font-medium w-24">Nr. Matricol:</span> 
                        <span className="text-[#024A76] font-semibold">{selectedStudentData.numarMatricol || 'N/A'}</span>
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
                        <div key={semestruIndex} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                          <div className="bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 px-6 py-4">
                            <h3 className="text-lg font-semibold text-[#024A76] flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Anul {semestru.anStudiu}, Semestrul {semestru.semestru} ({semestru.anUniversitar})
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gradient-to-r from-[#024A76] to-[#3471B8]">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Materie</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Credite</th>
                                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Notă</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Acțiuni</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {semestru.cursuri.map((curs, courseIndex) => {
                                  // Găsim indexul anual și al notei pentru această notă
                                  const anualIndex = selectedStudentData.istoric.istoricAnual.findIndex(a => 
                                    a.anStudiu === curs.anStudiu && a.semestru === curs.semestru && a.anUniversitar === curs.anUniversitar
                                  );
                                  
                                  const noteIndex = selectedStudentData.istoric.istoricAnual[anualIndex].cursuri.findIndex(c => 
                                    c.id === curs.id
                                  );
                                  
                                  const isEditing = editingNoteId === `${anualIndex}-${noteIndex}`;
                                  
                                  return (
                                    <tr key={courseIndex} className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                                      <td className="px-6 py-4">
                                        {isEditing ? (
                                          <input
                                            type="text"
                                            value={editNoteForm.nume}
                                            onChange={(e) => setEditNoteForm({...editNoteForm, nume: e.target.value})}
                                            className="w-full px-3 py-2 border border-[#024A76]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E3AB23]"
                                          />
                                        ) : (
                                          <span className="font-semibold text-[#024A76]">{curs.nume}</span>
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
                                          <span className="px-2 py-1 bg-[#3471B8]/10 text-[#024A76] rounded-md font-semibold text-sm">
                                            {curs.credite}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            step="0.01"
                                            value={editNoteForm.nota}
                                            onChange={(e) => setEditNoteForm({...editNoteForm, nota: parseFloat(e.target.value)})}
                                            className="w-20 px-3 py-2 border border-[#024A76]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E3AB23] text-center"
                                          />
                                        ) : (
                                          curs.nota === 0 ? 
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">Neevaluat</span> : 
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                              curs.nota >= 5 
                                                ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800" 
                                                : "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                                            }`}>
                                              {curs.nota}
                                            </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        {isEditing ? (
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleSaveNote(anualIndex, noteIndex)}
                                              className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:shadow-md transition-all duration-200 text-sm font-medium"
                                            >
                                              Salvează
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="px-3 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-md hover:shadow-md transition-all duration-200 text-sm font-medium"
                                            >
                                              Anulează
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                              onClick={() => startEditingNote(anualIndex, noteIndex)}
                                              className="text-[#024A76] hover:text-[#3471B8] transition-colors duration-200"
                                              title="Editează"
                                            >
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                              </svg>
                                            </button>
                                            <button
                                              onClick={() => handleDeleteNote(anualIndex, noteIndex)}
                                              className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                              title="Șterge"
                                            >
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                              </svg>
                                            </button>
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
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium text-lg">Nu există date pentru anul {activeYear} în istoricul academic</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200 backdrop-blur-sm">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-500 font-medium text-lg">Selectați un student pentru a vedea istoricul academic</p>
              </div>
            )}
          </div>
        </div>
        
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