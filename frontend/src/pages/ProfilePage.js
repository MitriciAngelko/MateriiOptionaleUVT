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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Se încarcă...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Profilul Meu</h1>
        
        <div className="space-y-6">
          {/* Informații personale */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Informații Personale</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nume</label>
                <p className="mt-1 text-lg text-gray-800">{profileData?.nume}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Prenume</label>
                <p className="mt-1 text-lg text-gray-800">{profileData?.prenume}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-lg text-gray-800">{profileData?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Tip Cont</label>
                <p className="mt-1 text-lg text-gray-800 capitalize">{profileData?.tip}</p>
              </div>
            </div>
          </div>

          {/* Informații academice - doar pentru studenți */}
          {profileData?.tip === 'student' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Informații Academice</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Facultate</label>
                  <p className="mt-1 text-lg text-gray-800">{profileData?.facultate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Specializare</label>
                  <p className="mt-1 text-lg text-gray-800">{profileData?.specializare}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">An</label>
                  <p className="mt-1 text-lg text-gray-800">{profileData?.an}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Număr Matricol</label>
                  <p className="mt-1 text-lg text-gray-800">{profileData?.numarMatricol}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informații specifice pentru profesori */}
          {profileData?.tip === 'profesor' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Materii Predate</h2>
              {profileData?.materiiPredate && profileData.materiiPredate.length > 0 ? (
                <div className="space-y-3">
                  {profileData.materiiPredate.map((materie, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Materie</label>
                          <p className="mt-1 text-gray-800">{materie.nume}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">An</label>
                          <p className="mt-1 text-gray-800">{materie.an}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Facultate</label>
                          <p className="mt-1 text-gray-800">{materie.facultate}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Specializare</label>
                          <p className="mt-1 text-gray-800">{materie.specializare}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Nu aveți materii asociate momentan.</p>
              )}
            </div>
          )}

          {/* Informații specifice pentru secretari */}
          {profileData?.tip === 'secretar' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Informații Administrative</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Facultate</label>
                  <p className="mt-1 text-lg text-gray-800">{profileData?.facultate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Funcție</label>
                  <p className="mt-1 text-lg text-gray-800">{profileData?.functie}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;