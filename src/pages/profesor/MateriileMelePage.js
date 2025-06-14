import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { isProfesor } from '../../utils/userRoles';

const MateriileMelePage = () => {
  const [materiiPredate, setMateriiPredate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  
  useEffect(() => {
    let isMounted = true;

    const fetchMateriiPredate = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        // Verifică dacă utilizatorul este profesor folosind funcția din userRoles
        const profesorStatus = await isProfesor(user.uid);
        if (!profesorStatus) {
          navigate('/');
          return;
        }

        // Obține toate materiile și filtrează-le pentru profesorul curent
        const materiiSnapshot = await getDocs(collection(db, 'materii'));
        const materiiList = materiiSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(materie => {
            // Verifică dacă profesorul este în lista de profesori
            return materie.profesori && materie.profesori.some(prof => prof.id === user.uid);
          })
          .sort((a, b) => a.nume.localeCompare(b.nume));

        if (isMounted) {
          setMateriiPredate(materiiList);
          setLoading(false);
        }
      } catch (error) {
        console.error('Eroare la încărcarea materiilor:', error);
        if (isMounted) {
          setError('A apărut o eroare la încărcarea materiilor');
          setLoading(false);
        }
      }
    };

    fetchMateriiPredate();

    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  const handleCourseClick = (materieId) => {
    navigate(`/profesor/materie/${materieId}`);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center py-8 text-[#024A76] dark:text-blue-light">
            <div className="text-lg font-semibold flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 rounded-full animate-spin"></div>
              <span>Se încarcă...</span>
            </div>
          </div>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent mb-1 drop-shadow-sm">Materiile Mele</h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-yellow-accent dark:to-yellow-accent/70 rounded shadow-sm"></div>
        </div>

        {/* Courses Grid */}
        {materiiPredate.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-[#024A76] dark:text-blue-light">Nu s-au găsit cursuri</h3>
              <p className="mt-2 text-[#024A76]/60 dark:text-gray-300">Nu aveți materii asociate momentan.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materiiPredate.map((materie, index) => (
              <div
                key={materie.id}
                onClick={() => handleCourseClick(materie.id)}
                className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-[#024A76]/20 dark:border-gray-700 hover:border-[#3471B8]/30 dark:hover:border-yellow-accent hover:scale-105"
              >
                {/* Course Header */}
                <div className="p-6 border-b border-[#024A76]/10 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-[#024A76] dark:text-blue-light leading-tight drop-shadow-sm">
                      {materie.nume}
                    </h3>
                  </div>

                  {/* Student Count */}
                  <div className="flex items-center text-[#024A76]/80 dark:text-gray-300">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">
                      {materie.studentiInscrisi?.length || 0} Studenți
                    </span>
                  </div>
                </div>

                {/* Course Details */}
                <div className="px-6 py-4 bg-gradient-to-r from-[#024A76]/5 to-[#3471B8]/5 dark:from-gray-700/30 dark:to-gray-600/30">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#024A76]/60 dark:text-gray-400 font-medium">An</p>
                      <p className="text-[#024A76] dark:text-blue-light font-semibold">{materie.an}</p>
                    </div>
                    <div>
                      <p className="text-[#024A76]/60 dark:text-gray-400 font-medium">Credite</p>
                      <p className="text-[#024A76] dark:text-blue-light font-semibold">{materie.credite}</p>
                    </div>
                    <div>
                      <p className="text-[#024A76]/60 dark:text-gray-400 font-medium">Locuri</p>
                      <p className="text-[#024A76] dark:text-blue-light font-semibold">{materie.locuriDisponibile || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MateriileMelePage; 