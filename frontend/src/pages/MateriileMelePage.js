import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const MateriileMelePage = () => {
  const [materiiPredate, setMateriiPredate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMaterieId, setExpandedMaterieId] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  
  const isProfesor = user?.email?.match(/^[a-z]+\.[a-z]+@e-uvt\.ro$/);

  useEffect(() => {
    let isMounted = true;

    if (!isProfesor) {
      navigate('/');
      return;
    }

    const fetchMateriiPredate = async () => {
      if (!loading) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          throw new Error('Utilizatorul nu există în baza de date');
        }

        const userData = userDoc.data();
        console.log('Date utilizator:', userData);

        if (!userData.materiiPredate || userData.materiiPredate.length === 0) {
          if (isMounted) {
            setMateriiPredate([]);
            setLoading(false);
          }
          return;
        }

        // Procesăm fiecare materie, fie că e obiect sau ID
        const materiiPromises = userData.materiiPredate.map(async (materie) => {
          try {
            // Dacă materie este deja un obiect complet
            if (typeof materie === 'object' && materie !== null && materie.id) {
              console.log('Materie este obiect:', materie);
              return materie;
            }

            // Dacă materie este un ID (string)
            if (typeof materie === 'string') {
              console.log('Materie este ID:', materie);
              const materieDoc = await getDoc(doc(db, 'materii', materie));
              if (materieDoc.exists()) {
                return {
                  id: materieDoc.id,
                  ...materieDoc.data()
                };
              }
            }

            console.log('Materie invalidă:', materie);
            return null;
          } catch (err) {
            console.error(`Eroare la procesarea materiei:`, err);
            return null;
          }
        });

        const materiiDetails = await Promise.all(materiiPromises);
        const materiiFiltered = materiiDetails.filter(materie => materie !== null);
        
        if (isMounted) {
          console.log('Materii finale:', materiiFiltered);
          setMateriiPredate(materiiFiltered);
          setLoading(false);
        }
      } catch (err) {
        console.error('Eroare la încărcarea materiilor:', err);
        if (isMounted) {
          setError('Nu s-au putut încărca materiile. Vă rugăm încercați din nou.');
          setLoading(false);
        }
      }
    };

    fetchMateriiPredate();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, isProfesor]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#034a76]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Materiile Mele</h1>
      
      {materiiPredate.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Nu aveți materii asociate momentan.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {materiiPredate.map((materie) => (
            <div 
              key={materie.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {materie.nume}
                  </h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setExpandedMaterieId(expandedMaterieId === materie.id ? null : materie.id)}
                  >
                    {expandedMaterieId === materie.id ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="space-y-3 text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-500">Facultate</p>
                      <p>{materie.facultate}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Specializare</p>
                      <p>{materie.specializare}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">An</p>
                      <p>{materie.an}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Credite</p>
                      <p>{materie.credite}</p>
                    </div>
                  </div>

                  {expandedMaterieId === materie.id && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      {materie.descriere && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">Descriere</h3>
                          <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                            {materie.descriere}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-medium text-gray-700 mb-2">Studenți Înscriși</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-500 italic">
                            Lista studenților înscriși va fi disponibilă în curând.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MateriileMelePage; 