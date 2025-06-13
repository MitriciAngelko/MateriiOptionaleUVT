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
  const [filters, setFilters] = useState({
    facultate: '',
    specializare: '',
    an: ''
  });

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

  // Select all filtered students
  const selectAllStudents = () => {
    setSelectedStudents(filteredStudents.map(student => student.id));
  };

  // Deselect all students
  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  // Get unique values for filters
  const getUniqueValues = (key) => {
    const values = eligibleStudents.map(student => student[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Filter students based on selected filters
  const getFilteredStudents = () => {
    return eligibleStudents.filter(student => {
      return (
        (!filters.facultate || student.facultate === filters.facultate) &&
        (!filters.specializare || student.specializare === filters.specializare) &&
        (!filters.an || student.an === filters.an)
      );
    });
  };

  const filteredStudents = getFilteredStudents();

  // Reset filters
  const resetFilters = () => {
    setFilters({
      facultate: '',
      specializare: '',
      an: ''
    });
  };

  // Update filter values
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
          className="px-4 py-2 bg-[#024A76] text-white rounded-lg hover:bg-gradient-to-r hover:from-[#024A76] hover:to-[#3471B8] disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
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

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#024A76]">Filtrare Studenți</h3>
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-all duration-200"
          >
            Resetează Filtrele
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facultate Filter */}
          <div>
            <label className="block text-sm font-medium text-[#024A76] mb-2">
              Facultate
            </label>
            <select
              value={filters.facultate}
              onChange={(e) => updateFilter('facultate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-[#024A76] focus:outline-none focus:ring-2 focus:ring-[#3471B8] focus:border-[#3471B8] transition-all duration-200"
            >
              <option value="">Toate facultățile</option>
              {getUniqueValues('facultate').map(facultate => (
                <option key={facultate} value={facultate}>
                  {facultate}
                </option>
              ))}
            </select>
          </div>

          {/* Specializare Filter */}
          <div>
            <label className="block text-sm font-medium text-[#024A76] mb-2">
              Specializare
            </label>
            <select
              value={filters.specializare}
              onChange={(e) => updateFilter('specializare', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-[#024A76] focus:outline-none focus:ring-2 focus:ring-[#3471B8] focus:border-[#3471B8] transition-all duration-200"
            >
              <option value="">Toate specializările</option>
              {getUniqueValues('specializare').map(specializare => (
                <option key={specializare} value={specializare}>
                  {specializare}
                </option>
              ))}
            </select>
          </div>

          {/* An Filter */}
          <div>
            <label className="block text-sm font-medium text-[#024A76] mb-2">
              An de studiu
            </label>
            <select
              value={filters.an}
              onChange={(e) => updateFilter('an', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-[#024A76] focus:outline-none focus:ring-2 focus:ring-[#3471B8] focus:border-[#3471B8] transition-all duration-200"
            >
              <option value="">Toți anii</option>
              {getUniqueValues('an').map(an => (
                <option key={an} value={an}>
                  Anul {an}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Filter Results Info */}
        <div className="mt-4 p-3 bg-gradient-to-r from-[#024A76]/5 to-[#3471B8]/5 rounded-md">
          <p className="text-sm text-[#024A76]/80">
            <strong>Rezultate filtrare:</strong> {filteredStudents.length} din {eligibleStudents.length} studenți
            {filteredStudents.length !== eligibleStudents.length && (
              <span className="text-[#E3AB23] font-medium"> (filtrați)</span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 items-center justify-between">
        <button
          onClick={bulkRegisterStudents}
          disabled={registrationInProgress || selectedStudents.length === 0}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all duration-200 shadow-md ${
            selectedStudents.length === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 text-[#024A76] hover:from-[#E3AB23]/90 hover:to-[#E3AB23]/70'
          } ${registrationInProgress ? 'disabled:bg-gray-400' : ''}`}
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
            `Înregistrează Selectați`
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white">
            <h2 className="text-lg font-semibold">
              Studenți Eligibili pentru Anul Următor
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-[#024A76]/10 to-[#3471B8]/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={filteredStudents.length > 0 && filteredStudents.every(student => selectedStudents.includes(student.id))}
                      onChange={() => {
                        if (filteredStudents.every(student => selectedStudents.includes(student.id))) {
                          // Deselect all filtered students
                          setSelectedStudents(prev => prev.filter(id => !filteredStudents.some(student => student.id === id)));
                        } else {
                          // Select all filtered students
                          const newSelected = [...selectedStudents];
                          filteredStudents.forEach(student => {
                            if (!newSelected.includes(student.id)) {
                              newSelected.push(student.id);
                            }
                          });
                          setSelectedStudents(newSelected);
                        }
                      }}
                      className="w-4 h-4 text-[#024A76] border-gray-300 rounded focus:ring-[#024A76]"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    An Curent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    ECTS Acumulate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    Media
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    Facultate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#024A76] uppercase tracking-wider">
                    Specializare
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.id}
                    className={`hover:bg-gray-50 transition-all duration-200 ${
                      selectedStudents.includes(student.id) 
                        ? 'border-l-4 border-[#E3AB23] bg-gradient-to-r from-[#E3AB23]/5 to-transparent' 
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-[#024A76] border-gray-300 rounded focus:ring-[#024A76]"
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white">
                        Anul {student.an}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#3471B8] to-[#3471B8]/70 text-white">
                        {student.currentECTS} ECTS
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 text-[#024A76]">
                        {student.currentAverageGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {student.facultate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {student.specializare}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default StudentNextYearRegistrationPage; 