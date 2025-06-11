import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useMaterii } from '../../contexts/MateriiContext';

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
  
  const { allMaterii, loading: materiiLoading } = useMaterii();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      navigate('/login');
      return;
    }

    // Set up real-time listeners
    const unsubscribeUser = onSnapshot(
      doc(db, 'users', user.uid),
      (userDoc) => {
        if (!userDoc.exists()) {
          setError('Nu s-au găsit informații pentru utilizatorul curent');
          setLoading(false);
          return;
        }
      },
      (error) => {
        console.error('Error listening to user document:', error);
        setError(error.message);
      }
    );

    const unsubscribeIstoric = onSnapshot(
      doc(db, 'istoricAcademic', user.uid),
      (istoricDoc) => {
        if (!istoricDoc.exists()) {
          setMateriiInscrise([]);
          setLoading(false);
          return;
        }

        const istoricData = istoricDoc.data();
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

        // Calculate statistics
        let totalCredite = 0;
        let sumaProduse = 0;
        let crediteTrecute = 0;
        let materiiPromovate = 0;

        toateCursurile.forEach(materie => {
          const credite = materie.credite || 0;
          totalCredite += credite;

          if (materie.nota >= 5) {
            sumaProduse += materie.nota * credite;
            crediteTrecute += credite;
            materiiPromovate++;
          }
        });

        const medieGenerala = materiiPromovate > 0 ? (sumaProduse / crediteTrecute).toFixed(2) : 0;

        // Update state
        setStats({
          totalCredite,
          medieGenerala,
          crediteTrecute
        });
        setMateriiInscrise(toateCursurile);
        setMateriiByAn(byAn);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to istoric academic:', error);
        setError(error.message);
      }
    );

    // Cleanup listeners
    return () => {
      unsubscribeUser();
      unsubscribeIstoric();
    };
  }, [user, navigate, allMaterii]);

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Materiile Mele</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Statistici */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Situație școlară</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-sm text-gray-600">Total credite înscrise</div>
            <div className="text-2xl font-bold text-[#034a76]">{stats.totalCredite}</div>
          </div>
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-sm text-gray-600">Credite obținute</div>
            <div className="text-2xl font-bold text-green-600">{stats.crediteTrecute}</div>
          </div>
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-sm text-gray-600">Medie generală</div>
            <div className="text-2xl font-bold text-[#034a76]">{stats.medieGenerala}</div>
          </div>
        </div>
      </div>

      {materiiInscrise.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Nu aveți nicio materie în istoricul academic.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(materiiByAn).map(([an, materii]) => {
            if (materii.length === 0) return null;
            
            return (
              <div key={an} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b">
                  <h2 className="text-lg font-semibold">Anul {an}</h2>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Materie</th>
                          <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">Credite</th>
                          <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">Notă</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materii.map((materie) => (
                          <tr key={materie.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b text-sm">
                              <div className="font-medium text-gray-900 cursor-pointer" 
                                onClick={() => setExpandedMaterieId(expandedMaterieId === materie.id ? null : materie.id)}>
                                {materie.nume}
                                {materie.status === 'nepromovat' || (materie.nota > 0 && materie.nota < 5) ? 
                                  <span className="ml-2 text-xs font-normal text-red-600">(Nepromovat)</span> : 
                                  materie.status === 'promovat' || materie.nota >= 5 ?
                                  <span className="ml-2 text-xs font-normal text-green-600">(Promovat)</span> : 
                                  null
                                }
                              </div>
                              {expandedMaterieId === materie.id && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <p><span className="font-semibold">Specializare:</span> {materie.specializare}</p>
                                  <p><span className="font-semibold">Profesor:</span> {materie.profesor?.nume || 'Nealocat'}</p>
                                  <p className="mt-1 bg-gray-50 p-2 rounded">
                                    {materie.descriere || 'Nicio descriere disponibilă.'}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-4 border-b text-center text-sm">{materie.credite}</td>
                            <td className="py-2 px-4 border-b text-center text-sm">
                              <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                                materie.nota >= 5 ? 'bg-green-100 text-green-800' : 
                                materie.nota > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {materie.nota > 0 ? materie.nota : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MateriileMelePage;