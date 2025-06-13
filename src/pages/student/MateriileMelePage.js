import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useMaterii } from '../../contexts/MateriiContext';
import { isStudent } from '../../utils/userRoles';

const MateriileMelePage = () => {
  const [materiiInscrise, setMateriiInscrise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMaterieId, setExpandedMaterieId] = useState(null);
  const [stats, setStats] = useState({ totalCredite: 0, medieGenerala: 0, crediteTrecute: 0 });
  const [materiiByAn, setMateriiByAn] = useState({
    'I': [],
    'II': [],
    'III': []
  });
  const [selectedYear, setSelectedYear] = useState('I');
  
  const { allMaterii, loading: materiiLoading } = useMaterii();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.uid) {
          navigate('/login');
          return;
        }

        // SAFETY CHECK: Verify this is actually a student to prevent wrong access
        const studentStatus = await isStudent(user.uid);
        if (!studentStatus) {
          console.warn('Non-student accessing student MateriileMelePage - redirecting');
          navigate('/');
          return;
        }

        // Wait for materii to be loaded from context
        if (materiiLoading) {
          return;
        }

        // One-time fetch for user data
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          setError('Nu s-au găsit informații pentru utilizatorul curent');
          setLoading(false);
          return;
        }

        const userData = userDocSnap.data();

        // Create or get istoric academic data
        const istoricDocRef = doc(db, 'istoricAcademic', user.uid);
        const istoricDocSnap = await getDoc(istoricDocRef);
        
        let istoricData;
        
        if (istoricDocSnap.exists()) {
          istoricData = istoricDocSnap.data();
        } else {
          // Create an empty istoric if it doesn't exist (preserve the functionality)
          istoricData = {
            studentId: user.uid,
            nume: userData.nume || '',
            prenume: userData.prenume || '',
            specializare: userData.specializare || '',
            facultate: userData.facultate || '',
            istoricAnual: []
          };
          
          // Save the empty istoric to the database
          await setDoc(istoricDocRef, istoricData);
          console.log('Created new istoricAcademic document for student:', user.uid);
        }

        const toateCursurile = [];

        // Process istoric data
        if (istoricData.istoricAnual && Array.isArray(istoricData.istoricAnual)) {
          istoricData.istoricAnual.forEach(anAcademic => {
            if (anAcademic.cursuri && Array.isArray(anAcademic.cursuri)) {
              anAcademic.cursuri.forEach(curs => {
                const materieCompleta = allMaterii[curs.id];
                if (materieCompleta) {
                  toateCursurile.push({
                    ...materieCompleta,
                    ...curs,
                    anStudiu: anAcademic.anStudiu || materieCompleta.an || 'I',
                    semestru: anAcademic.semestru || 1
                  });
                }
              });
            }
          });
        }

        // Organize by year
        const byAn = {
          'I': [],
          'II': [],
          'III': []
        };

        toateCursurile.forEach(materie => {
          const an = materie.an || materie.anStudiu || 'I';
          if (byAn[an]) {
            byAn[an].push(materie);
          } else {
            byAn['I'].push(materie);
          }
        });

        // Sort alphabetically
        Object.keys(byAn).forEach(an => {
          byAn[an].sort((a, b) => a.nume.localeCompare(b.nume));
        });

        // Calculate statistics with proper type conversion and validation
        let totalCredite = 0;
        let crediteTrecute = 0;
        let cursurilePromovate = []; // Array to store promoted courses for average calculation

        console.log('📊 Calculating stats for courses:', toateCursurile.length);

        toateCursurile.forEach(materie => {
          // Ensure credite is a number
          const credite = parseInt(materie.credite) || 0;
          // Ensure nota is a number
          const nota = parseFloat(materie.nota) || 0;
          
          console.log(`📚 ${materie.nume}: ${credite} credite, nota ${nota}`);
          
          // Add to total credits (all enrolled courses)
          totalCredite += credite;

          // Only count passed courses (nota >= 5) for average and passed credits
          if (nota >= 5) {
            crediteTrecute += credite;
            cursurilePromovate.push(materie); // Add course to promoted courses for average calculation
            console.log(`✅ Promovat: ${materie.nume} - ${credite} credite, nota ${nota}`);
          } else if (nota > 0) {
            console.log(`❌ Nepromovat: ${materie.nume} - ${credite} credite, nota ${nota}`);
          } else {
            console.log(`⏳ Neevaluat: ${materie.nume} - ${credite} credite`);
          }
        });

        // Calculate simple arithmetic average (same as in InscriereMateriiPage)
        let medieGenerala = '0.00';
        if (cursurilePromovate.length > 0) {
          const sumaNotes = cursurilePromovate.reduce((acc, course) => acc + parseFloat(course.nota), 0);
          medieGenerala = parseFloat((sumaNotes / cursurilePromovate.length).toFixed(2));
        }

        // Calculate averages for each academic year
        const mediiAcademice = {};
        ['I', 'II', 'III'].forEach(an => {
          const materiiAnCurent = byAn[an];
          const materiiPromovateAnCurent = materiiAnCurent.filter(materie => parseFloat(materie.nota) >= 5);
          
          let medieAn = '0.00';
          if (materiiPromovateAnCurent.length > 0) {
            const sumaNoteAn = materiiPromovateAnCurent.reduce((acc, course) => acc + parseFloat(course.nota), 0);
            medieAn = parseFloat((sumaNoteAn / materiiPromovateAnCurent.length).toFixed(2));
          }
          
          mediiAcademice[`medieAnul${an}`] = medieAn.toString();
          
          console.log(`📊 Anul ${an}: ${materiiPromovateAnCurent.length} materii promovate, medie: ${medieAn}`);
        });

        // Convert to string for storage
        const medieGeneralaString = medieGenerala.toString();

        console.log('📈 Final stats:', {
          totalCredite,
          crediteTrecute,
          medieGenerala,
          materiiPromovate: cursurilePromovate.length,
          totalCourses: toateCursurile.length,
          mediiAcademice
        });

        // Check if any of the averages have changed
        const averagesChanged = userData.medieGenerala !== medieGeneralaString ||
          userData.medieAnulI !== mediiAcademice.medieAnulI ||
          userData.medieAnulII !== mediiAcademice.medieAnulII ||
          userData.medieAnulIII !== mediiAcademice.medieAnulIII;

        // Update user document with all averages if any have changed
        if (averagesChanged) {
          try {
            await setDoc(userDocRef, {
              ...userData,
              medieGenerala: medieGeneralaString,
              medieAnulI: mediiAcademice.medieAnulI,
              medieAnulII: mediiAcademice.medieAnulII,
              medieAnulIII: mediiAcademice.medieAnulIII
            });
            console.log('Updated averages in user document:', {
              medieGenerala: medieGeneralaString,
              ...mediiAcademice
            });
          } catch (error) {
            console.error('Error updating averages in user document:', error);
          }
        }

        // Update state
        setStats({
          totalCredite,
          medieGenerala,
          crediteTrecute
        });
        setMateriiInscrise(toateCursurile);
        setMateriiByAn(byAn);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, allMaterii, materiiLoading]);

  // Helper function to group courses by semester
  const groupBySemester = (courses) => {
    return courses.reduce((acc, course) => {
      const semester = course.semestru || 1;
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(course);
      return acc;
    }, {});
  };

  const availableYears = Object.keys(materiiByAn).filter(year => materiiByAn[year].length > 0);
  const currentYearCourses = materiiByAn[selectedYear] || [];
  const coursesBySemester = groupBySemester(currentYearCourses);

  // Calculate stats for selected year
  const selectedYearStats = React.useMemo(() => {
    let crediteTrecute = 0;
    let cursurilePromovate = [];

    currentYearCourses.forEach(materie => {
      const credite = parseInt(materie.credite) || 0;
      const nota = parseFloat(materie.nota) || 0;
      
      if (nota >= 5) {
        crediteTrecute += credite;
        cursurilePromovate.push(materie);
      }
    });

    let medieGenerala = 0;
    if (cursurilePromovate.length > 0) {
      const sumaNotes = cursurilePromovate.reduce((acc, course) => acc + parseFloat(course.nota), 0);
      medieGenerala = parseFloat((sumaNotes / cursurilePromovate.length).toFixed(2));
    }

    return {
      totalCredite: crediteTrecute, // Only count credits from passed courses
      crediteTrecute,
      medieGenerala
    };
  }, [currentYearCourses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center py-8 text-[#024A76]">
          <div className="text-lg font-semibold flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-[#024A76] to-[#3471B8] rounded-full animate-spin"></div>
            <span>Se încarcă...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg">
            <div className="font-medium text-sm">{error}</div>
          </div>
        )}

        {materiiInscrise.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-lg shadow-xl p-6 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-lg text-gray-500 dark:text-gray-300 mb-1">Nu aveți nicio materie în istoricul academic</div>
            <div className="text-xs text-gray-400 dark:text-gray-400">Contactați secretariatul pentru mai multe informații</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header and Year Tabs */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      selectedYear === year
                        ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white shadow-lg border-2 border-[#E3AB23]'
                        : 'bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 border border-gray-300 dark:border-gray-700 hover:border-[#3471B8]/30 shadow-md hover:shadow-lg'
                    }`}
                  >
                    Anul {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Table */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {currentYearCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                  Nu aveți cursuri pentru anul {selectedYear}
                </div>
              ) : (
                <div>
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white">
                        <th className="py-3 px-6 text-left font-semibold drop-shadow-sm">Materie</th>
                        <th className="py-3 px-6 text-center font-semibold drop-shadow-sm">Credite</th>
                        <th className="py-3 px-6 text-center font-semibold drop-shadow-sm">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(coursesBySemester)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                 .map(([semester, courses]) => {
                           // Calculate semester totals - only count credits from passed courses
                           const passedCourses = courses.filter(course => parseFloat(course.nota) >= 5);
                           const semesterCredits = passedCourses.reduce((sum, course) => sum + parseInt(course.credite || 0), 0);
                           const semesterAverage = passedCourses.length > 0 
                             ? parseFloat((passedCourses.reduce((sum, course) => sum + parseFloat(course.nota), 0) / passedCourses.length).toFixed(2))
                             : 0;

                          return (
                            <React.Fragment key={semester}>
                              {/* Semester Header Row */}
                              <tr className="bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white">
                                <td colSpan="3" className="py-2 px-6">
                                  <span className="font-semibold drop-shadow-sm">Semestrul {semester}</span>
                                </td>
                              </tr>
                              
                              {/* Course Rows */}
                              {courses.map((materie, index) => (
                                <tr 
                                  key={materie.id}
                                  className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-blue-light/10 dark:hover:to-yellow-accent/10 cursor-pointer transition-all duration-200`}
                                  onClick={() => setExpandedMaterieId(expandedMaterieId === materie.id ? null : materie.id)}
                                >
                                  <td className="py-3 px-6 text-gray-900 dark:text-gray-200">
                                    <div>
                                      <div className="font-medium">{materie.nume}</div>
                                      {expandedMaterieId === materie.id && (
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                          <div><span className="font-semibold">Profesor:</span> {materie.profesor?.nume || 'Nealocat'}</div>
                                          <div><span className="font-semibold">Specializare:</span> {materie.specializare}</div>
                                          {materie.descriere && (
                                            <div className="mt-1"><span className="font-semibold">Descriere:</span> {materie.descriere}</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-6 text-center text-gray-900 dark:text-gray-200">{materie.credite}</td>
                                  <td className="py-3 px-6 text-center">
                                    <span className={`font-bold text-lg ${
                                      materie.nota >= 5 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : materie.nota > 0 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {materie.nota > 0 ? materie.nota : '-'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Semester Total Row */}
                              <tr className="bg-gradient-to-r from-[#024A76]/10 to-[#3471B8]/10 dark:from-gray-700/50 dark:to-gray-600/50 border-t-2 border-[#E3AB23] dark:border-yellow-accent">
                                <td className="py-2 px-6 font-semibold text-[#024A76] dark:text-blue-light">Total</td>
                                <td className="py-2 px-6 text-center font-semibold text-[#024A76] dark:text-blue-light">{semesterCredits} credite</td>
                                <td className="py-2 px-6 text-center">
                                  <span className="bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 text-[#024A76] px-3 py-1 rounded-full font-semibold text-sm shadow-sm">
                                    {semesterAverage > 0 ? semesterAverage : '-'}
                                  </span>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      
                      {/* Year Total Row */}
                      <tr className="bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white">
                        <td className="py-3 px-6 font-bold drop-shadow-sm">Total Anul {selectedYear}</td>
                        <td className="py-3 px-6 text-center font-bold drop-shadow-sm">{selectedYearStats.totalCredite} credite</td>
                        <td className="py-3 px-6 text-center">
                          <span className="bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 text-[#024A76] px-3 py-1 rounded-full font-bold shadow-lg">
                            {selectedYearStats.medieGenerala || '-'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MateriileMelePage;