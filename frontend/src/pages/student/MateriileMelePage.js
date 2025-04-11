import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

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
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Funcția principală pentru încărcarea datelor cu forțare anti-cache
  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      console.log('Încărcăm datele pentru utilizatorul:', user.uid, 'la timestamp:', Date.now());
      
      // Încarcă direct istoricul academic (sursa principală de adevăr pentru note)
      // Folosim o tehnică anti-cache adăugând un timestamp la cerere
      const timestamp = Date.now();
      const cacheKey = `?refresh=${timestamp}`;
      const istoricRef = doc(db, 'istoricAcademic', user.uid);
      
      // Încercăm să obținem datele direct, evitând orice cache
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) {
        console.log('Nu s-a găsit istoricul academic pentru utilizatorul curent.');
        setMateriiInscrise([]);
        setMateriiByAn({ 'I': [], 'II': [], 'III': [] });
        setStats({ totalCredite: 0, medieGenerala: 0, crediteTrecute: 0 });
        setLoading(false);
        return;
      }
      
      // Procesează datele istoricului
      const istoricData = istoricDoc.data();
      console.log('Date istoricul academic obținute:', istoricData);
      
      if (!istoricData.istoricAnual || !Array.isArray(istoricData.istoricAnual)) {
        console.log('Istoricul academic nu conține date valide.');
        setMateriiInscrise([]);
        setLoading(false);
        return;
      }
      
      // Extragem toate cursurile din istoricul academic
      let toateCursurile = [];
      for (const anAcademic of istoricData.istoricAnual) {
        if (anAcademic.cursuri && Array.isArray(anAcademic.cursuri)) {
          for (const curs of anAcademic.cursuri) {
            // Adăugăm toate informațiile necesare pentru a afișa cursul
            toateCursurile.push({
              ...curs,
              anStudiu: anAcademic.anStudiu || 'I',
              semestru: anAcademic.semestru || 1
            });
          }
        }
      }
      
      console.log(`Găsite ${toateCursurile.length} cursuri în istoricul academic`);
      
      // Pentru fiecare curs, obține detalii suplimentare din colecția materii dacă e necesar
      const materiiCompletatePromises = toateCursurile.map(async (curs) => {
        // Dacă notele sunt zero sau undefined, le tratăm ca neevaluate
        const nota = typeof curs.nota === 'number' ? curs.nota : 0;
        
        try {
          const materieDoc = await getDoc(doc(db, 'materii', curs.id));
          if (materieDoc.exists()) {
            const materieData = materieDoc.data();
            return {
              ...curs,
              nota: nota, // Asigurăm că folosim nota din istoricul academic
              nume: curs.nume || materieData.nume,
              credite: curs.credite || materieData.credite || 0,
              descriere: materieData.descriere || '',
              facultate: materieData.facultate || curs.facultate || '',
              specializare: materieData.specializare || curs.specializare || '',
              profesor: materieData.profesor || curs.profesor || { nume: 'Nealocat' },
              an: materieData.an || curs.anStudiu || 'I'
            };
          }
        } catch (error) {
          console.error(`Eroare la obținerea detaliilor pentru materia ${curs.id}:`, error);
        }
        
        // Dacă nu avem detalii suplimentare, returnăm cursul așa cum este
        return {
          ...curs,
          nota: nota,
          profesor: curs.profesor || { nume: 'Nealocat' }
        };
      });
      
      // Așteptăm toate promisiunile de detalii suplimentare
      const materiiComplete = await Promise.all(materiiCompletatePromises);
      
      // Verificăm și afișăm notele pentru debug
      materiiComplete.forEach(materie => {
        console.log(`Materia "${materie.nume}" are nota: ${materie.nota}`);
      });
      
      // Organizăm materiile pe ani de studiu
      const byAn = {
        'I': [],
        'II': [],
        'III': []
      };
      
      materiiComplete.forEach(materie => {
        const an = materie.an || materie.anStudiu || 'I';
        if (byAn[an]) {
          byAn[an].push(materie);
        } else {
          byAn['I'].push(materie);
        }
      });
      
      // Sortăm alfabetic
      Object.keys(byAn).forEach(an => {
        byAn[an].sort((a, b) => a.nume.localeCompare(b.nume));
      });
      
      // Calculăm statisticile
      let totalCredite = 0;
      let sumaProduse = 0;
      let crediteTrecute = 0;
      let materiiPromovate = 0;
      
      materiiComplete.forEach(materie => {
        const credite = parseInt(materie.credite) || 0;
        totalCredite += credite;
        
        // Verificăm dacă nota este >= 5 pentru a considera materia promovată
        if (materie.nota >= 5) {
          sumaProduse += materie.nota * credite;
          crediteTrecute += credite;
          materiiPromovate++;
        }
      });
      
      const medieGenerala = materiiPromovate > 0 ? (sumaProduse / crediteTrecute).toFixed(2) : 0;
      
      // Actualizăm starea componentei
      setStats({
        totalCredite,
        medieGenerala,
        crediteTrecute
      });
      setMateriiInscrise(materiiComplete);
      setMateriiByAn(byAn);
      
    } catch (error) {
      console.error('Eroare la încărcarea datelor:', error);
      setError(`Eroare la încărcarea datelor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  // Încarcă datele la montarea componentei
  useEffect(() => {
    fetchData();
    
    // Configurăm și un listener pentru actualizări în timp real
    if (user?.uid) {
      const istoricRef = doc(db, 'istoricAcademic', user.uid);
      const unsubscribe = onSnapshot(istoricRef, (doc) => {
        if (doc.exists()) {
          console.log('Istoricul academic a fost actualizat în timp real!');
          fetchData(); // Reîncărcăm datele pentru a reflecta schimbările
        }
      }, (error) => {
        console.error('Eroare la ascultarea schimbărilor:', error);
      });
      
      // Curățăm listener-ul la demontare
      return () => unsubscribe();
    }
  }, [fetchData, user]);
  
  // Setăm un interval de reîmprospătare automată la 30 de secunde
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Reîmprospătare automată a datelor...');
      fetchData();
    }, 30000); // 30 secunde
    
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Funcție pentru reîmprospătarea manuală a datelor
  const handleRefresh = () => {
    console.log('Reîmprospătare manuală a datelor...');
    setLastRefresh(Date.now());
    fetchData();
  };

  if (loading && materiiInscrise.length === 0) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Materiile Mele</h1>
        <button 
          onClick={handleRefresh} 
          className="flex items-center px-3 py-1.5 bg-[#034a76] text-white rounded hover:bg-[#023557]"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Se actualizează...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizează
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Ultima actualizare */}
      <div className="text-xs text-gray-500 mb-4 text-right">
        Ultima actualizare: {new Date(lastRefresh).toLocaleTimeString()}
      </div>

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
                          <tr key={materie.id} className={`hover:bg-gray-50 ${materie.nota >= 5 ? 'bg-green-50' : (materie.nota > 0 ? 'bg-red-50' : '')}`}>
                            <td className="py-2 px-4 border-b text-sm">
                              <div className="font-medium text-gray-900 cursor-pointer" 
                                onClick={() => setExpandedMaterieId(expandedMaterieId === materie.id ? null : materie.id)}>
                                {materie.nume}
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
                                {materie.nota > 0 ? materie.nota : 'Neevaluat'}
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