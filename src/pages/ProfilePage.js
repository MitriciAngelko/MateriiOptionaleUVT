import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const user = useSelector((state) => state.auth.user);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
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
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-xl" style={{ color: '#034a76' }}>
          <div className="animate-pulse">Se încarcă...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-xl text-red-600 bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 shadow-lg"
            style={{ backgroundColor: '#034a76' }}
          >
            <span className="text-6xl font-bold text-white">
              {profileData?.prenume?.charAt(0).toUpperCase()}{profileData?.nume?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: '#034a76' }}
          >
            Profilul Meu
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{ backgroundColor: '#e3ab23' }}
          ></div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl mx-auto border-t-4" style={{ borderTopColor: '#e3ab23' }}>
          <div className="space-y-8">
            {/* Informații personale */}
            <div 
              className="p-6 rounded-lg shadow-md border-l-4"
              style={{ backgroundColor: '#f9f9f9', borderLeftColor: '#034a76' }}
            >
              <h2 
                className="text-2xl font-semibold mb-6 flex items-center"
                style={{ color: '#034a76' }}
              >
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
                </svg>
                Informații Personale
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                    Nume
                  </label>
                  <p className="text-lg font-semibold" style={{ color: '#333' }}>
                    {profileData?.nume}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                    Prenume
                  </label>
                  <p className="text-lg font-semibold" style={{ color: '#333' }}>
                    {profileData?.prenume}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                    Email
                  </label>
                  <p className="text-lg font-semibold" style={{ color: '#333' }}>
                    {profileData?.email}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                    Tip Cont
                  </label>
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white capitalize"
                    style={{ backgroundColor: '#e3ab23' }}
                  >
                    {profileData?.tip}
                  </span>
                </div>
              </div>
            </div>

            {/* Informații academice - doar pentru studenți */}
            {profileData?.tip === 'student' && (
              <div 
                className="p-6 rounded-lg shadow-md border-l-4"
                style={{ backgroundColor: '#f9f9f9', borderLeftColor: '#e3ab23' }}
              >
                <h2 
                  className="text-2xl font-semibold mb-6 flex items-center"
                  style={{ color: '#034a76' }}
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5,3H7V5H5V10A2,2 0 0,1 3,8V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V8A2,2 0 0,1 19,10V5H17V3H19M12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6A3,3 0 0,1 15,9A3,3 0 0,1 12,12M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                  </svg>
                  Informații Academice
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                      Facultate
                    </label>
                    <p className="text-lg font-semibold" style={{ color: '#333' }}>
                      {profileData?.facultate}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                      Specializare
                    </label>
                    <p className="text-lg font-semibold" style={{ color: '#333' }}>
                      {profileData?.specializare}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                      An
                    </label>
                    <p className="text-lg font-semibold" style={{ color: '#333' }}>
                      {profileData?.an}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                      Număr Matricol
                    </label>
                    <p className="text-lg font-semibold" style={{ color: '#333' }}>
                      {profileData?.numarMatricol}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Informații specifice pentru profesori */}
            {profileData?.tip === 'profesor' && (
              <div 
                className="p-6 rounded-lg shadow-md border-l-4"
                style={{ backgroundColor: '#f9f9f9', borderLeftColor: '#e3ab23' }}
              >
                <h2 
                  className="text-2xl font-semibold mb-6 flex items-center"
                  style={{ color: '#034a76' }}
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
                  </svg>
                  Materii Predate
                </h2>
                {profileData?.materiiPredate && profileData.materiiPredate.length > 0 ? (
                  <div className="space-y-4">
                    {profileData.materiiPredate.map((materie, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: '#e3ab23' }}
                          ></div>
                          <h3 className="text-lg font-semibold" style={{ color: '#034a76' }}>
                            {materie.nume}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#034a76' }}>
                              An
                            </label>
                            <p className="text-gray-800 font-medium">{materie.an}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#034a76' }}>
                              Facultate
                            </label>
                            <p className="text-gray-800 font-medium">{materie.facultate}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#034a76' }}>
                              Specializare
                            </label>
                            <p className="text-gray-800 font-medium">{materie.specializare}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6M12,11C10.34,11 9,12.34 9,14C9,15.66 10.34,17 12,17C13.66,17 15,15.66 15,14C15,12.34 13.66,11 12,11Z"/>
                    </svg>
                    <p className="text-gray-500 italic">Nu aveți materii asociate momentan.</p>
                  </div>
                )}
              </div>
            )}

            {/* Informații specifice pentru secretari */}
            {profileData?.tip === 'secretar' && (
              <div 
                className="p-6 rounded-lg shadow-md border-l-4"
                style={{ backgroundColor: '#f9f9f9', borderLeftColor: '#e3ab23' }}
              >
                <h2 
                  className="text-2xl font-semibold mb-6 flex items-center"
                  style={{ color: '#034a76' }}
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Informații Administrative
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                      Facultate
                    </label>
                    <p className="text-lg font-semibold" style={{ color: '#333' }}>
                      {profileData?.facultate}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#034a76' }}>
                      Funcție
                    </label>
                    <p className="text-lg font-semibold" style={{ color: '#333' }}>
                      {profileData?.functie}
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