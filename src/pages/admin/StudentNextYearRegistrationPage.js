import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { isAdmin } from '../../utils/userRoles';

const StudentNextYearRegistrationPage = () => {
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

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

  // Calculate current academic year
  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    return month < 9 ? 
      `${year-1}-${year}` : // For months Jan-Aug, use previous-current year
      `${year}-${year+1}`;  // For months Sep-Dec, use current-next year
  };

  // Calculate next academic year
  const getNextAcademicYear = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    return month < 9 ? 
      `${year}-${year+1}` : // For months Jan-Aug, next year is current-next
      `${year+1}-${year+2}`;  // For months Sep-Dec, next year is next-nextnext
  };

  // Get next year level
  const getNextYear = (currentYear) => {
    switch (currentYear) {
      case 'I': return 'II';
      case 'II': return 'III';
      case 'III': return 'III'; // Already final year
      default: return currentYear;
    }
  };

  // Fetch and analyze students for next year registration
  const fetchEligibleStudents = async () => {
    setStudentsLoading(true);
    setError(null);
    setEligibleStudents([]);
    setSelectedStudents([]);

    try {
      // Get all students
      const studentsQuery = query(collection(db, 'users'), where('tip', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const currentAcademicYear = getCurrentAcademicYear();
      const eligible = [];

      // Check each student's ECTS
      for (const student of studentsData) {
        try {
          // Skip students already in final year
          if (student.an === 'III') continue;

          // Check if student already registered for next year
          if (student.lastRegistrationYear === currentAcademicYear) continue;

          // Ensure student has required fields
          if (!student.facultate || !student.specializare || !student.an) continue;

          const istoricRef = doc(db, 'istoricAcademic', student.id);
          const istoricDoc = await getDoc(istoricRef);
          
          if (!istoricDoc.exists()) continue;

          const istoricData = istoricDoc.data();
          
          // Filter entries for current academic year
          const currentYearEntries = istoricData.istoricAnual?.filter(entry => 
            entry.anUniversitar === currentAcademicYear
          ) || [];

          // Calculate ECTS for current year
          let totalECTS = 0;
          let courses = [];

          currentYearEntries.forEach(entry => {
            entry.cursuri.forEach(curs => {
              if (curs.nota > 0 && curs.status === 'promovat') {
                totalECTS += parseInt(curs.credite || 0, 10);
                courses.push({
                  nume: curs.nume,
                  credite: curs.credite,
                  nota: curs.nota
                });
              }
            });
          });

          // Calculate average grade
          let avgGrade = 0;
          if (courses.length > 0) {
            const sum = courses.reduce((acc, course) => acc + course.nota, 0);
            avgGrade = parseFloat((sum / courses.length).toFixed(2));
          }

          // Check if eligible (40+ ECTS)
          if (totalECTS >= 40) {
            eligible.push({
              ...student,
              currentECTS: totalECTS,
              currentAverageGrade: avgGrade,
              nextYear: getNextYear(student.an),
              courses: courses
            });
          }
        } catch (studentError) {
          console.error(`Error processing student ${student.id}:`, studentError);
        }
      }

      // Sort by average grade descending
      eligible.sort((a, b) => b.currentAverageGrade - a.currentAverageGrade);

      setEligibleStudents(eligible);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching eligible students:', error);
      setError('Eroare la încărcarea studenților: ' + error.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Handle individual student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select all eligible students
  const selectAllStudents = () => {
    setSelectedStudents(eligibleStudents.map(student => student.id));
  };

  // Deselect all students
  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  // Remove student from passed courses (grade 5 or higher)
  const removeFromPassedCourses = async (studentId, studentData) => {
    try {
      console.log('Starting removal from passed courses for student:', studentId);
      
      // Get student's academic history
      const istoricRef = doc(db, 'istoricAcademic', studentId);
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) {
        console.log('No academic history found - skipping removal');
        return [];
      }
      
      const istoricData = istoricDoc.data();
      const passedCourseIds = [];
      
      // Find all courses where student got grade 5 or higher
      if (istoricData.istoricAnual) {
        istoricData.istoricAnual.forEach(entry => {
          if (entry.cursuri) {
            entry.cursuri.forEach(curs => {
              if (curs.nota >= 5 && curs.status === 'promovat') {
                passedCourseIds.push(curs.id);
              }
            });
          }
        });
      }
      
      console.log(`Found ${passedCourseIds.length} passed courses to remove student from:`, passedCourseIds);
      
      if (passedCourseIds.length === 0) {
        return [];
      }
      
      // Remove student from each passed course
      for (const courseId of passedCourseIds) {
        try {
          const materieRef = doc(db, 'materii', courseId);
          const materieDoc = await getDoc(materieRef);
          
          if (materieDoc.exists()) {
            const materieData = materieDoc.data();
            const studentiActuali = materieData.studentiInscrisi || [];
            
            // Remove student from the enrolled students list
            const studentiActualizati = studentiActuali.filter(student => student.id !== studentId);
            
            if (studentiActualizati.length !== studentiActuali.length) {
              await updateDoc(materieRef, {
                studentiInscrisi: studentiActualizati
              });
              console.log(`Removed student from passed course: ${materieData.nume}`);
            }
          }
        } catch (error) {
          console.error(`Error removing student from course ${courseId}:`, error);
        }
      }
      
      console.log('Successfully completed removal from passed courses');
      return passedCourseIds;
      
    } catch (error) {
      console.error('Error in removal from passed courses:', error);
      return [];
    }
  };

  // Assign mandatory courses for students progressing to next year
  const assignMandatoryCoursesForNextYear = async (studentId, studentData, nextYear, nextAcademicYear) => {
    try {
      console.log('Starting assignment of mandatory courses for next year:', studentId);
      
      // 1. Find all mandatory courses for the student's new year
      const materiiQuery = query(
        collection(db, 'materii'),
        where('facultate', '==', studentData.facultate),
        where('specializare', '==', studentData.specializare),
        where('an', '==', nextYear),
        where('obligatorie', '==', true)
      );
      
      const materiiSnapshot = await getDocs(materiiQuery);
      const materiiObligatorii = materiiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${materiiObligatorii.length} mandatory courses for ${studentData.facultate}, ${studentData.specializare}, year ${nextYear}`);
      
      if (materiiObligatorii.length === 0) {
        console.log('No mandatory courses found - skipping assignment');
        return [];
      }
      
      // 2. Update/Create academic history for the new year
      const istoricRef = doc(db, 'istoricAcademic', studentId);
      const existingIstoric = await getDoc(istoricRef);
      
      let istoricData;
      if (existingIstoric.exists()) {
        istoricData = existingIstoric.data();
        // Ensure istoricAnual exists
        if (!istoricData.istoricAnual) {
          istoricData.istoricAnual = [];
        }
      } else {
        // Create new academic history if doesn't exist
        istoricData = {
          studentId: studentId,
          nume: studentData.nume || '',
          prenume: studentData.prenume || '',
          specializare: studentData.specializare || '',
          facultate: studentData.facultate || '',
          istoricAnual: []
        };
      }
      
      // Group courses by semester
      const cursuriBySemestru = {};
      
      materiiObligatorii.forEach(materie => {
        const semestru = materie.semestru || 1;
        if (!cursuriBySemestru[semestru]) {
          cursuriBySemestru[semestru] = [];
        }
        
        // Create course record for the new academic year
        const courseRecord = {
          id: materie.id,
          nume: materie.nume,
          credite: materie.credite || 0,
          nota: 0, // Grade 0 - not evaluated yet
          dataNota: new Date().getTime(),
          profesor: 'Nespecificat', // Professor will be assigned when available
          obligatorie: true,
          status: 'neevaluat',
          dataInregistrare: new Date().toISOString()
        };
        
        cursuriBySemestru[semestru].push(courseRecord);
      });
      
      // Add annual records for each semester
      Object.keys(cursuriBySemestru).forEach(semestru => {
        const anualRecord = {
          anUniversitar: nextAcademicYear,
          anStudiu: nextYear,
          semestru: parseInt(semestru),
          cursuri: cursuriBySemestru[semestru]
        };
        
        // Check if record for this year and semester already exists
        const existingRecordIndex = istoricData.istoricAnual.findIndex(record => 
          record.anUniversitar === nextAcademicYear && 
          record.anStudiu === nextYear && 
          record.semestru === parseInt(semestru)
        );
        
        if (existingRecordIndex >= 0) {
          // Update existing record
          istoricData.istoricAnual[existingRecordIndex] = anualRecord;
        } else {
          // Add new record
          istoricData.istoricAnual.push(anualRecord);
        }
      });
      
      // Save academic history
      await setDoc(istoricRef, istoricData);
      console.log('Updated academic history for student');
      
      // 3. Add student to each mandatory course
      const studentInfo = {
        id: studentId,
        nume: `${studentData.prenume} ${studentData.nume}`,
        numarMatricol: studentData.numarMatricol || 'N/A'
      };
      
      const materiiInscrises = [];
      
      for (const materie of materiiObligatorii) {
        try {
          const materieRef = doc(db, 'materii', materie.id);
          const materieDoc = await getDoc(materieRef);
          
          if (materieDoc.exists()) {
            const materieData = materieDoc.data();
            const studentiActuali = materieData.studentiInscrisi || [];
            
            // Check if student is not already enrolled
            if (!studentiActuali.some(student => student.id === studentId)) {
              await updateDoc(materieRef, {
                studentiInscrisi: [...studentiActuali, studentInfo]
              });
              
              materiiInscrises.push(materie.id);
              console.log(`Added student to mandatory course: ${materie.nume}`);
            } else {
              // If already enrolled, still add to the list
              materiiInscrises.push(materie.id);
            }
          }
        } catch (error) {
          console.error(`Error adding student to course ${materie.id}:`, error);
        }
      }
      
      console.log('Successfully completed assignment of mandatory courses for next year');
      return materiiInscrises;
      
    } catch (error) {
      console.error('Error in assignment of mandatory courses for next year:', error);
      // Don't throw error to avoid interrupting the registration process
      return [];
    }
  };

  // Bulk register selected students to next year
  const bulkRegisterStudents = async () => {
    if (selectedStudents.length === 0) {
      setError('Nu ați selectat niciun student pentru înregistrare.');
      return;
    }

    setRegistrationInProgress(true);
    setError(null);
    setSuccessMessage(null);

    const currentAcademicYear = getCurrentAcademicYear();
    const nextAcademicYear = getNextAcademicYear();
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const studentId of selectedStudents) {
        try {
          const student = eligibleStudents.find(s => s.id === studentId);
          if (!student) continue;

          // Remove student from courses they've already passed (grade 5+)
          const passedCourseIds = await removeFromPassedCourses(studentId, student);

          // Assign mandatory courses for the new year
          const materiiInscrises = await assignMandatoryCoursesForNextYear(
            studentId, 
            student, 
            student.nextYear, 
            nextAcademicYear
          );

          // Filter out passed courses from the enrolled courses list
          const finalMateriiInscrise = materiiInscrises.filter(courseId => 
            !passedCourseIds.includes(courseId)
          );

          const studentRef = doc(db, 'users', studentId);
          
          // Update student record
          await updateDoc(studentRef, {
            an: student.nextYear,
            lastRegistrationYear: currentAcademicYear,
            lastRegistrationDate: new Date().toISOString(),
            materiiInscrise: finalMateriiInscrise // Set enrolled subjects excluding passed courses
          });

          successCount++;
        } catch (studentError) {
          console.error(`Error registering student ${studentId}:`, studentError);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`Au fost înregistrați cu succes ${successCount} studenți în anul următor. Aceștia au fost înscriși automat la cursurile obligatorii și au fost eliminați din cursurile deja promovate.`);
        // Refresh the list
        await fetchEligibleStudents();
      }

      if (errorCount > 0) {
        setError(`${errorCount} studenți nu au putut fi înregistrați din cauza unor erori.`);
      }

    } catch (error) {
      console.error('Error in bulk registration:', error);
      setError('Eroare la înregistrarea în lot: ' + error.message);
    } finally {
      setRegistrationInProgress(false);
    }
  };

  if (!hasAccess) {
    return <div className="text-center py-8">Verificare autorizare...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#034a76]">Înscrierea Studenților în Anul Următor</h1>
        <button
          onClick={fetchEligibleStudents}
          disabled={studentsLoading}
          className="px-4 py-2 bg-[#034a76] text-white rounded hover:bg-[#023557] disabled:bg-gray-400 flex items-center gap-2"
        >
          {studentsLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Se încarcă...
            </>
          ) : (
            'Actualizează Lista'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {successMessage}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium text-blue-800 mb-2">Informații despre procesul de înregistrare</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Studenții eligibili sunt cei care au acumulat cel puțin 40 ECTS în anul academic curent</li>
          <li>• Studenții din anul III (final) nu pot fi înregistrați în anul următor</li>
          <li>• Studenții care s-au înregistrat deja în anul academic curent nu vor fi afișați</li>
          <li>• Lista este sortată după media notelor (descrescător)</li>
        </ul>
      </div>

      {eligibleStudents.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Acțiuni rapide:</span>
          <button
            onClick={selectAllStudents}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Selectează Toți ({eligibleStudents.length})
          </button>
          <button
            onClick={deselectAllStudents}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Deselectează Toți
          </button>
          {selectedStudents.length > 0 && (
            <button
              onClick={bulkRegisterStudents}
              disabled={registrationInProgress}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {registrationInProgress ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Se procesează...
                </>
              ) : (
                `Înregistrează Selectați (${selectedStudents.length})`
              )}
            </button>
          )}
        </div>
      )}

      {eligibleStudents.length === 0 && !studentsLoading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Niciun student eligibil</h3>
          <p className="text-gray-600">
            Apăsați "Actualizează Lista" pentru a căuta studenți eligibili pentru înregistrarea în anul următor.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-[#034a76] text-white">
            <h2 className="text-lg font-medium">
              Studenți Eligibili pentru Anul Următor ({eligibleStudents.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === eligibleStudents.length && eligibleStudents.length > 0}
                      onChange={() => {
                        if (selectedStudents.length === eligibleStudents.length) {
                          deselectAllStudents();
                        } else {
                          selectAllStudents();
                        }
                      }}
                      className="w-4 h-4 text-[#034a76] border-gray-300 rounded focus:ring-[#034a76]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    An Curent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    An Următor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ECTS Acumulate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Media
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facultate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specializare
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eligibleStudents.map((student) => (
                  <tr 
                    key={student.id}
                    className={`hover:bg-gray-50 ${selectedStudents.includes(student.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-[#034a76] border-gray-300 rounded focus:ring-[#034a76]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.nume} {student.prenume}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.an}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {student.nextYear}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.currentECTS} ECTS
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.currentAverageGrade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.facultate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.specializare}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNextYearRegistrationPage; 