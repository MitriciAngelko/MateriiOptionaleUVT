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

  const getCourseCode = (nume, index) => {
    // Generate a course code based on the course name
    const words = nume.split(' ');
    let code = '';
    
    if (words.length >= 2) {
      code = words[0].substring(0, 3).toUpperCase() + words[1].substring(0, 2).toUpperCase();
    } else {
      code = nume.substring(0, 5).toUpperCase();
    }
    
    // Add a number
    code += String(index + 1).padStart(2, '0');
    
    return code;
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Courses</h1>
        </div>

        {/* Courses Grid */}
        {materiiPredate.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
              <p className="mt-2 text-gray-500">Nu aveți materii asociate momentan.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materiiPredate.map((materie, index) => (
              <div
                key={materie.id}
                onClick={() => handleCourseClick(materie.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* Course Header with Code */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                      {materie.nume}
                    </h3>
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                      {getCourseCode(materie.nume, index)}
                    </span>
                  </div>

                  {/* Student Count */}
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">
                      {materie.studentiInscrisi?.length || 0} Students
                    </span>
                  </div>
                </div>

                {/* Course Details */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">An</p>
                      <p className="text-gray-900">{materie.an}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Credite</p>
                      <p className="text-gray-900">{materie.credite}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Locuri</p>
                      <p className="text-gray-900">{materie.locuriDisponibile || 'N/A'}</p>
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