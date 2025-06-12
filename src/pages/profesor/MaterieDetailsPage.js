import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

  const getGradeColor = (nota) => {
    if (nota === 'Not graded') return 'bg-gray-100 text-gray-600';
    const grade = parseFloat(nota);
    if (grade >= 9) return 'bg-green-100 text-green-800';
    if (grade >= 7) return 'bg-blue-100 text-blue-800';
    if (grade >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGradeDisplay = (nota) => {
    if (nota === 'Not graded') return 'Not graded';
    const grade = parseFloat(nota);
    if (grade >= 9) return `A${grade >= 9.5 ? '+' : grade >= 9.2 ? '' : '-'}`;
    if (grade >= 7) return `B${grade >= 8.5 ? '+' : grade >= 7.5 ? '' : grade >= 7.2 ? '' : '+'}`;
    if (grade >= 5) return 'A';
    return 'B';
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
    const headers = ['ID', 'Name', 'Email', 'Grade', 'Matriculation Number'];
    const rows = studenti.map((student, index) => [
      index + 1,
      `${student.nume} ${student.prenume}`,
      student.email,
      student.nota,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/profesor/materiile-mele')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Courses</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{materie?.nume}</h1>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleEmailAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Email All</span>
            </button>
            
            <button
              onClick={handleExport}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-300 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudenti.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.nume} {student.prenume}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(student.nota)}`}>
                      {getGradeDisplay(student.nota)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <button className="hover:text-blue-800 font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudenti.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No students found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'No students match your search criteria.' : 'Nu există studenți înscriși la această materie.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {filteredStudenti.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredStudenti.length} of {studenti.length} students
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterieDetailsPage; 