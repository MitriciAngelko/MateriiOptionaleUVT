import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useSelector } from 'react-redux';
import { isProfesor } from '../../utils/userRoles';

const MaterieDetailsPage = () => {
  const { materieId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const [materie, setMaterie] = useState(null);
  const [studenti, setStudenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for inline grading functionality
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editGradeForm, setEditGradeForm] = useState({
    nota: 0,
    anStudiu: 'I',
    semestru: 1
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchMaterieDetails = async () => {
      console.log('Încărcare detalii materie - materieId:', materieId, 'user:', user?.uid);
      
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        // Verifică dacă utilizatorul este profesor
        const profesorStatus = await isProfesor(user.uid);
        if (!profesorStatus) {
          navigate('/');
          return;
        }

        // Obține detaliile materiei
        if (!materieId || typeof materieId !== 'string' || materieId.trim() === '') {
          setError('ID materie invalid');
          setLoading(false);
          return;
        }
        
        const materieRef = doc(db, 'materii', materieId);
        const materieDoc = await getDoc(materieRef);

        if (!materieDoc.exists()) {
          setError('Materia nu a fost găsită');
          setLoading(false);
          return;
        }

        const materieData = { id: materieDoc.id, ...materieDoc.data() };
        console.log('Materie încărcată:', materieData.nume, 'cu ID:', materieData.id);

        // Verifică dacă profesorul predă această materie
        const isProfessorOfCourse = materieData.profesori?.some(prof => prof.id === user.uid);
        if (!isProfessorOfCourse) {
          setError('Nu aveți permisiunea să accesați această materie');
          setLoading(false);
          return;
        }

        setMaterie(materieData);

        // Obține detaliile studenților înscriși
        if (materieData.studentiInscrisi && materieData.studentiInscrisi.length > 0) {
          console.log('Studenți înscriși găsiți:', materieData.studentiInscrisi.length);
          const studentiDetails = [];
          
          for (const student of materieData.studentiInscrisi) {
            try {
              // Verifică dacă student.id este valid
              if (!student || !student.id || typeof student.id !== 'string' || student.id.trim() === '') {
                console.warn('Student invalid sau fără ID:', student);
                continue;
              }
              
              const studentRef = doc(db, 'users', student.id);
              const studentDoc = await getDoc(studentRef);
              
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                
                // Obține nota din istoricul academic
                let nota = 'Not graded';
                try {
                  // Validează din nou student.id pentru istoricul academic
                  if (student.id && typeof student.id === 'string' && student.id.trim() !== '') {
                    const istoricRef = doc(db, 'istoricAcademic', student.id);
                    const istoricDoc = await getDoc(istoricRef);
                  
                    if (istoricDoc.exists()) {
                      const istoricData = istoricDoc.data();
                      if (istoricData.istoricAnual) {
                        for (const anual of istoricData.istoricAnual) {
                          const curs = anual.cursuri?.find(c => c.id === materieId);
                          if (curs && curs.nota > 0) {
                            nota = curs.nota;
                            break;
                          }
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.error('Eroare la încărcarea notei:', err);
                }
                
                studentiDetails.push({
                  id: student.id,
                  nume: studentData.nume || '',
                  prenume: studentData.prenume || '',
                  email: studentData.email || '',
                  numarMatricol: studentData.numarMatricol || studentData.nrMatricol || 'N/A',
                  nota: nota,
                  facultate: studentData.facultate || '',
                  specializare: studentData.specializare || '',
                  an: studentData.an || ''
                });
              }
            } catch (err) {
              console.error('Eroare la încărcarea studentului:', err);
            }
          }
          
          setStudenti(studentiDetails);
          console.log('Studenți procesați cu succes:', studentiDetails.length);
        } else {
          console.log('Nu există studenți înscriși sau lista este goală');
          setStudenti([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Eroare la încărcarea detaliilor materiei:', error);
        setError('A apărut o eroare la încărcarea datelor');
        setLoading(false);
      }
    };

    fetchMaterieDetails();
  }, [materieId, user, navigate]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Toast auto-dismiss after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const getGradeColor = (nota) => {
    if (nota === 'Not graded') return 'bg-gray-100 text-gray-600';
    const grade = parseFloat(nota);
    if (grade >= 9) return 'bg-green-100 text-green-800';
    if (grade >= 7) return 'bg-blue-100 text-blue-800';
    if (grade >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGradeDisplay = (nota) => {
    if (nota === 'Not graded') return 'Nenotat';
    return nota;
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const filteredStudenti = studenti.filter(student => {
    const fullName = `${student.nume} ${student.prenume}`.toLowerCase();
    const email = student.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search) || student.numarMatricol.includes(search);
  });

  const handleEmailAll = () => {
    const emails = studenti.map(s => s.email).filter(email => email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Nume', 'Email', 'Nota', 'Număr Matricol'];
    const rows = studenti.map((student, index) => [
      index + 1,
      `${student.nume} ${student.prenume}`,
      student.email,
      student.nota === 'Not graded' ? 'Nenotat' : student.nota,
      student.numarMatricol
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${materie?.nume || 'course'}_students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle starting inline editing
  const startEditingGrade = (student) => {
    setEditingStudentId(student.id);
    setEditGradeForm({
      nota: student.nota !== 'Not graded' ? parseFloat(student.nota) : 0,
      anStudiu: 'I', // Default, can be adjusted based on student data
      semestru: 1
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle saving the inline edited grade
  const handleSaveEditedGrade = async () => {
    if (!editingStudentId) return;
    
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editGradeForm.nota < 1 || editGradeForm.nota > 10) {
        throw new Error('Nota trebuie să fie între 1 și 10');
      }

      // Find the student being edited
      const selectedStudent = studenti.find(s => s.id === editingStudentId);
      if (!selectedStudent) {
        throw new Error('Studentul nu a fost găsit');
      }

      // Get reference to academic history document
      const istoricRef = doc(db, 'istoricAcademic', editingStudentId);
      
      // Get current academic history
      const istoricDoc = await getDoc(istoricRef);
      
      let istoricData;
      if (!istoricDoc.exists()) {
        // Create new academic history if it doesn't exist
        istoricData = {
          studentId: editingStudentId,
          nume: selectedStudent.nume || '',
          prenume: selectedStudent.prenume || '',
          specializare: selectedStudent.specializare || '',
          facultate: selectedStudent.facultate || '',
          istoricAnual: []
        };
        await setDoc(istoricRef, istoricData);
      } else {
        istoricData = istoricDoc.data();
      }

      // Determine current academic year
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : 
        `${year}-${year+1}`;

      // Determine status based on grade
      const status = editGradeForm.nota >= 5 ? 'promovat' : 'nepromovat';

      // Create new grade entry
      const newGrade = {
        id: materieId,
        nume: materie.nume,
        credite: materie.credite || 0,
        nota: parseInt(editGradeForm.nota),
        dataNota: new Date().getTime(),
        profesor: `${user.nume} ${user.prenume}` || 'Nespecificat',
        obligatorie: materie.obligatorie || false,
        status: status
      };

      // Check if an entry already exists for this year/semester
      const anualIndex = istoricData.istoricAnual.findIndex(
        item => item.anUniversitar === anUniversitar && 
               item.anStudiu === editGradeForm.anStudiu &&
               item.semestru === parseInt(editGradeForm.semestru)
      );

      if (anualIndex >= 0) {
        // Check if the course already exists in this year/semester
        const existingCourseIndex = istoricData.istoricAnual[anualIndex].cursuri.findIndex(
          curs => curs.id === materieId
        );

        if (existingCourseIndex >= 0) {
          // Update existing grade
          istoricData.istoricAnual[anualIndex].cursuri[existingCourseIndex] = newGrade;
        } else {
          // Add new course to existing year/semester
          istoricData.istoricAnual[anualIndex].cursuri.push(newGrade);
        }
      } else {
        // Create new year/semester entry
        const newAnualRecord = {
          anUniversitar: anUniversitar,
          anStudiu: editGradeForm.anStudiu,
          semestru: parseInt(editGradeForm.semestru),
          cursuri: [newGrade]
        };
        istoricData.istoricAnual.push(newAnualRecord);
      }

      // Update the document
      await updateDoc(istoricRef, istoricData);

      // Update the local state to reflect the new grade
      setStudenti(prevStudenti => 
        prevStudenti.map(student => 
          student.id === editingStudentId 
            ? { ...student, nota: editGradeForm.nota }
            : student
        )
      );

      showToastMessage('Nota a fost salvată cu succes!');
      setEditingStudentId(null);

    } catch (error) {
      console.error('Eroare la salvarea notei:', error);
      setErrorMessage('Eroare la salvarea notei: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#034a76] dark:border-yellow-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-lg shadow-sm">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-sm">
            {errorMessage}
          </div>
        )}
        
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => navigate('/profesor/materiile-mele')}
              className="flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent rounded-lg border border-[#024A76]/30 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
              title="Înapoi la cursuri"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">{materie?.nume}</h1>
          </div>
          <div className="h-0.5 w-16 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-yellow-accent dark:to-yellow-accent/70 rounded ml-14 shadow-sm"></div>
        </div>
        
        <div className="flex justify-end space-x-3 mb-6">
          <button
            onClick={handleExport}
            className="bg-white/80 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent px-4 py-2 rounded-lg font-medium border border-[#024A76]/30 dark:border-gray-700 hover:border-[#3471B8]/50 dark:hover:border-yellow-accent flex items-center space-x-2 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportă</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#024A76]/60 dark:text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Caută studenți..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent shadow-sm hover:shadow-md transition-all duration-300"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 text-white dark:text-gray-900">
                <th className="py-3 px-6 text-left font-semibold drop-shadow-sm">ID</th>
                <th className="py-3 px-6 text-left font-semibold drop-shadow-sm">Nume</th>
                <th className="py-3 px-6 text-left font-semibold drop-shadow-sm">Nr. Matricol</th>
                <th className="py-3 px-6 text-left font-semibold drop-shadow-sm">Email</th>
                <th className="py-3 px-6 text-center font-semibold w-40 drop-shadow-sm">Nota</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudenti.map((student, index) => {
                const isEditing = editingStudentId === student.id;
                
                return (
                  <tr 
                    key={student.id} 
                    className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 cursor-pointer transition-all duration-200 group`}
                  >
                    <td className="py-3 px-6 text-[#024A76] dark:text-blue-light">
                      {index + 1}
                    </td>
                    <td className="py-3 px-6 text-[#024A76] dark:text-gray-200">
                      <div className="font-medium">
                        {student.nume} {student.prenume}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-[#024A76] dark:text-gray-200 font-mono">
                      {student.numarMatricol}
                    </td>
                    <td className="py-3 px-6 text-[#024A76] dark:text-gray-300">
                      {student.email}
                    </td>
                    <td className="py-3 px-6 text-center relative w-40">
                      {isEditing ? (
                        <div className="flex items-center justify-center space-x-1 min-h-[2.5rem]">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            className="w-12 px-1 py-1 text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-[#024A76]/30 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent"
                            value={editGradeForm.nota}
                            onChange={(e) => setEditGradeForm({...editGradeForm, nota: parseInt(e.target.value)})}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEditedGrade}
                            className="text-green-600 hover:text-green-800 flex-shrink-0 p-1"
                            title="Salvează"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingStudentId(null)}
                            className="text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent flex-shrink-0 p-1"
                            title="Anulează"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center min-h-[2.5rem]">
                          <span className={`font-semibold ${
                            student.nota === 'Not graded' 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : student.nota >= 5 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {getGradeDisplay(student.nota)}
                          </span>
                          <button
                            onClick={() => startEditingGrade(student)}
                            className="opacity-0 group-hover:opacity-100 text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-all duration-200 ml-2"
                            title="Editează nota"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
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
          
          {filteredStudenti.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-[#024A76] dark:text-blue-light">Nu s-au găsit studenți</h3>
              <p className="mt-2 text-[#024A76]/60 dark:text-gray-300">
                {searchTerm ? 'Niciun student nu corespunde criteriilor de căutare.' : 'Nu există studenți înscriși la această materie.'}
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default MaterieDetailsPage; 