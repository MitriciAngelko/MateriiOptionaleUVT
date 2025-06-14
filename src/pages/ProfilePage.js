import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const ProfilePage = () => {
  const user = useSelector((state) => state.auth.user);
  const [profileData, setProfileData] = useState(null);
  const [materiiPredate, setMateriiPredate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData(userData);
          
          // If user is a professor, fetch their courses from materii collection
          if (userData.tip === 'profesor') {
            const materiiSnapshot = await getDocs(collection(db, 'materii'));
            const professorCourses = materiiSnapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .filter(materie => {
                // Check if professor is in the profesori array (new format)
                return materie.profesori && materie.profesori.some(prof => prof.id === user.uid);
              })
              .sort((a, b) => a.nume.localeCompare(b.nume));
            
            setMateriiPredate(professorCourses);
          }
        } else {
          setError('Profilul nu a fost găsit');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Eroare la încărcarea profilului');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-xl text-[#024A76] dark:text-blue-light">
          <div className="animate-pulse flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 rounded-full animate-spin"></div>
            <span>Se încarcă...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-xl text-red-600 dark:text-red-400 bg-white dark:bg-gray-800/80 p-6 rounded-lg shadow-xl border-l-4 border-red-500 dark:border-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 shadow-xl bg-gradient-to-br from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 border-4 border-white dark:border-gray-700">
            <span className="text-6xl font-bold text-white dark:text-blue-dark drop-shadow-lg">
              {profileData?.prenume?.charAt(0).toUpperCase()}{profileData?.nume?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 bg-clip-text text-transparent drop-shadow-sm">
            Profilul Meu
          </h1>
          <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark shadow-sm"></div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-xl p-8 max-w-4xl mx-auto border-t-4 border-[#E3AB23] dark:border-blue-light border border-gray-200 dark:border-gray-700/50 transition-colors duration-300">
          <div className="space-y-8">
            {/* Informații personale */}
            <div className="p-6 rounded-lg shadow-lg border-l-4 border-[#024A76] dark:border-blue-light bg-gradient-to-r from-[#024A76]/5 to-transparent dark:from-yellow-accent/5 dark:to-transparent">
              <h2 className="text-2xl font-semibold mb-6 flex items-center text-[#024A76] dark:text-blue-light drop-shadow-sm">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                </svg>
                Informații Personale
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                    Nume
                  </label>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {profileData?.nume}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                    Prenume
                  </label>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {profileData?.prenume}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                    Email
                  </label>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {profileData?.email}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                    Tip Cont
                  </label>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white capitalize shadow-sm">
                    {profileData?.tip}
                  </span>
                </div>
              </div>
            </div>

            {/* Informații academice - doar pentru studenți */}
            {profileData?.tip === 'student' && (
              <div className="p-6 rounded-lg shadow-lg border-l-4 border-[#E3AB23] dark:border-blue-light bg-gradient-to-r from-[#E3AB23]/5 to-transparent dark:from-yellow-accent/5 dark:to-transparent">
                <h2 className="text-2xl font-semibold mb-6 flex items-center text-[#024A76] dark:text-blue-light drop-shadow-sm">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5,3H7V5H5V10A2,2 0 0,1 3,8V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V8A2,2 0 0,1 19,10V5H17V3H19M12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6A3,3 0 0,1 15,9A3,3 0 0,1 12,12M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                  </svg>
                  Informații Academice
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                    <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                      Facultate
                    </label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {profileData?.facultate}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                    <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                      Specializare
                    </label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {profileData?.specializare}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                    <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                      An
                    </label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {profileData?.an}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                    <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                      Număr Matricol
                    </label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {profileData?.numarMatricol}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Informații specifice pentru profesori */}
            {profileData?.tip === 'profesor' && (
              <div className="p-6 rounded-xl shadow-xl border-l-4 border-[#E3AB23] dark:border-blue-light bg-gradient-to-br from-[#E3AB23]/5 via-white to-transparent dark:from-yellow-accent/5 dark:via-gray-800/50 dark:to-transparent backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center text-[#024A76] dark:text-blue-light drop-shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark flex items-center justify-center mr-4 shadow-lg">
                      <svg className="w-5 h-5 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
                      </svg>
                    </div>
                    Materii Predate
                  </h2>
                  {materiiPredate && materiiPredate.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark animate-pulse"></div>
                      <span className="text-[#024A76]/70 dark:text-blue-light/70">
                        {materiiPredate.length} {materiiPredate.length === 1 ? 'materie' : 'materii'}
                      </span>
                    </div>
                  )}
                </div>
                
                {materiiPredate && materiiPredate.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {materiiPredate.map((materie, index) => (
                      <div 
                        key={index} 
                        className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-[#3471B8]/30 dark:hover:border-blue-light/50 transition-all duration-500 hover:scale-[1.02] overflow-hidden"
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#024A76]/5 via-transparent to-[#3471B8]/5 dark:from-yellow-accent/5 dark:to-blue-light/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Content */}
                        <div className="relative p-6">
                          {/* Header with course name and indicator */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="w-3 h-3 rounded-full mr-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark shadow-sm group-hover:scale-110 transition-transform duration-300"></div>
                                <h3 className="text-xl font-bold text-[#024A76] dark:text-blue-light drop-shadow-sm group-hover:text-[#3471B8] dark:group-hover:text-yellow-accent transition-colors duration-300">
                                  {materie.nume}
                                </h3>
                              </div>
                              {materie.tip && (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ${
                                  materie.tip === 'obligatorie' 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {materie.tip}
                                </span>
                              )}
                            </div>
                            
                          </div>
                          
                          {/* Course details grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50 group-hover:border-[#024A76]/20 dark:group-hover:border-blue-light/20 transition-colors duration-300">
                                <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#024A76]/70 dark:text-blue-light/70">
                                  An de studiu
                                </label>
                                <p className="text-lg font-bold text-[#024A76] dark:text-blue-light">
                                  Anul {materie.an}
                                </p>
                              </div>
                              {materie.semestru && (
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50 group-hover:border-[#024A76]/20 dark:group-hover:border-blue-light/20 transition-colors duration-300">
                                  <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#024A76]/70 dark:text-blue-light/70">
                                    Semestru
                                  </label>
                                  <p className="text-lg font-bold text-[#024A76] dark:text-blue-light">
                                    Semestrul {materie.semestru}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50 group-hover:border-[#024A76]/20 dark:group-hover:border-blue-light/20 transition-colors duration-300">
                                <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#024A76]/70 dark:text-blue-light/70">
                                  Facultate
                                </label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                                  {materie.facultate}
                                </p>
                              </div>
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/50 group-hover:border-[#024A76]/20 dark:group-hover:border-blue-light/20 transition-colors duration-300">
                                <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#024A76]/70 dark:text-blue-light/70">
                                  Specializare
                                </label>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                                  {materie.specializare}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional info */}
                          {materie.studentiInscrisi && (
                            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-[#024A76]/70 dark:text-blue-light/70">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  <span className="text-sm font-medium">
                                    {materie.studentiInscrisi.length} studenți înscriși
                                  </span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-500 animate-pulse"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#024A76]/5 via-transparent to-[#3471B8]/5 dark:from-yellow-accent/5 dark:to-blue-light/5 rounded-xl"></div>
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-inner">
                        <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6M12,11C10.34,11 9,12.34 9,14C9,15.66 10.34,17 12,17C13.66,17 15,15.66 15,14C15,12.34 13.66,11 12,11Z"/>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                        Nicio materie asociată
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
                        Nu aveți materii asociate momentan. Contactați administratorul pentru a vă asocia cursurile.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informații specifice pentru secretari */}
            {profileData?.tip === 'secretar' && (
              <div className="p-6 rounded-lg shadow-lg border-l-4 border-[#E3AB23] dark:border-blue-light bg-gradient-to-r from-[#E3AB23]/5 to-transparent dark:from-yellow-accent/5 dark:to-transparent">
                <h2 className="text-2xl font-semibold mb-6 flex items-center text-[#024A76] dark:text-blue-light drop-shadow-sm">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Informații Administrative
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                    <label className="block text-sm font-medium mb-2 text-[#024A76] dark:text-blue-light">
                      Facultate
                    </label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {profileData?.facultate}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;