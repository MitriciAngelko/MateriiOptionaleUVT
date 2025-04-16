import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { isStudent } from '../../utils/userRoles';
import MaterieModal from '../../components/student/MaterieModal';

const MateriiStudentPage = () => {
  const [materiiInscrise, setMateriiInscrise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterie, setSelectedMaterie] = useState(null);
  const [activeYear, setActiveYear] = useState('I'); // Anul selectat implicit
  const [anStudent, setAnStudent] = useState('I'); // Anul în care este înscris studentul
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMateriiInscrise = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        // Verifică dacă utilizatorul este student
        const studentStatus = await isStudent(user.uid);
        if (!studentStatus) {
          navigate('/');
          return;
        }

        // Obține datele studentului
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const materiiIds = userData.materiiInscrise || [];
        
        // Setează anul studentului
        setAnStudent(userData.an || 'I');
        // Setează implicit anul activ ca fiind anul studentului
        setActiveYear(userData.an || 'I');

        // Obține toate materiile obligatorii pentru facultatea și specializarea studentului
        const materiiObligatoriiSnapshot = await getDocs(
          query(
            collection(db, 'materii'),
            where('obligatorie', '==', true),
            where('facultate', '==', userData.facultate),
            where('specializare', '==', userData.specializare)
          )
        );

        const materiiObligatorii = materiiObligatoriiSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Adaugă materiile obligatorii la lista de materii înscrise (dacă nu există deja)
        const materiiObligatoriiIds = materiiObligatorii.map(m => m.id);
        const materiiDeLaCareLipsesc = materiiObligatoriiIds.filter(id => !materiiIds.includes(id));

        if (materiiDeLaCareLipsesc.length > 0) {
          // Actualizează lista de materii înscrise în baza de date
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            materiiInscrise: [...materiiIds, ...materiiDeLaCareLipsesc]
          });

          // Actualizeză lista de studenți înscriși pentru fiecare materie obligatorie
          for (const materieId of materiiDeLaCareLipsesc) {
            const materieRef = doc(db, 'materii', materieId);
            await updateDoc(materieRef, {
              studentiInscrisi: arrayUnion({
                id: user.uid,
                nume: userData.nume || userData.displayName || 'Student',
                numarMatricol: userData?.numarMatricol || 'N/A'
              })
            });
          }
          
          // Actualizăm lista locală de materii înscrise
          materiiIds.push(...materiiDeLaCareLipsesc);
        }

        // Obține detaliile pentru fiecare materie
        const materiiDetails = await Promise.all(
          materiiIds.map(async (materieId) => {
            const materieDoc = await getDoc(doc(db, 'materii', materieId));
            if (materieDoc.exists()) {
              return { id: materieDoc.id, ...materieDoc.data() };
            }
            return null;
          })
        );

        // Filtrează materiile care există și le sortează după nume
        let materiiValide = materiiDetails
          .filter(materie => materie !== null)
          .sort((a, b) => {
            // Sortăm întâi după obligatoriu, apoi după nume
            if (a.obligatorie === b.obligatorie) {
              return a.nume.localeCompare(b.nume);
            }
            return a.obligatorie ? -1 : 1; // Materiile obligatorii vor fi primele
          });

        // Obține istoricul academic pentru a prelua notele și alte informații
        const istoricRef = doc(db, 'istoricAcademic', user.uid);
        const istoricDoc = await getDoc(istoricRef);
        
        if (istoricDoc.exists()) {
          const istoricData = istoricDoc.data();
          
          // Creăm un map pentru toate materiile din istoricul academic
          const materiiDinIstoric = new Map();
          
          if (istoricData.istoricAnual && istoricData.istoricAnual.length > 0) {
            istoricData.istoricAnual.forEach(anual => {
              if (anual.cursuri && anual.cursuri.length > 0) {
                anual.cursuri.forEach(curs => {
                  materiiDinIstoric.set(curs.id, {
                    nota: curs.nota,
                    status: curs.status,
                    dataNota: curs.dataNota,
                    anUniversitar: anual.anUniversitar,
                    anStudiu: anual.anStudiu,
                    semestru: anual.semestru
                  });
                });
              }
            });
          }
          
          // Actualizează detaliile materiilor cu informațiile din istoricul academic
          materiiValide = materiiValide.map(materie => {
            const infoIstoric = materiiDinIstoric.get(materie.id);
            if (infoIstoric) {
              return {
                ...materie,
                nota: infoIstoric.nota,
                status: infoIstoric.status,
                dataNota: infoIstoric.dataNota,
                anUniversitarIstoric: infoIstoric.anUniversitar
              };
            }
            return materie;
          });
        }
        
        setMateriiInscrise(materiiValide);
        
        // Sincronizează materiile cu istoricul academic
        await sincronizeazaIstoricAcademic(materiiValide);
        
        setLoading(false);
      } catch (error) {
        console.error('Eroare la încărcarea materiilor:', error);
        setError('A apărut o eroare la încărcarea materiilor');
        setLoading(false);
      }
    };

    fetchMateriiInscrise();
  }, [user, navigate]);

  // Sincronizează materiile cu istoricul academic
  const sincronizeazaIstoricAcademic = async (materii) => {
    try {
      if (!user?.uid || !materii.length) return;
      
      // Obține sau creează istoricul academic
      const istoricRef = doc(db, 'istoricAcademic', user.uid);
      const istoricDoc = await getDoc(istoricRef);
      
      let istoricData;
      
      if (istoricDoc.exists()) {
        istoricData = istoricDoc.data();
      } else {
        // Creează un istoric gol dacă nu există
        const userData = (await getDoc(doc(db, 'users', user.uid))).data();
        istoricData = {
          studentId: user.uid,
          nume: userData.nume || '',
          prenume: userData.prenume || '',
          specializare: userData.specializare || '',
          facultate: userData.facultate || '',
          istoricAnual: []
        };
        
        // Salvează istoricul gol în baza de date
        await setDoc(istoricRef, istoricData);
      }
      
      // Determină anul universitar curent
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : // Pentru lunile ian-aug, folosim anul precedent-anul curent
        `${year}-${year+1}`;  // Pentru lunile sep-dec, folosim anul curent-anul următor
        
      // Pentru fiecare materie, verifică dacă există în istoricul academic
      for (const materie of materii) {
        // Verifică dacă materia există deja în istoric
        const materieExistenta = istoricData.istoricAnual.some(anual => 
          anual.cursuri.some(curs => curs.id === materie.id)
        );
        
        if (!materieExistenta) {
          // Adaugă materia în istoricul academic
          const anStudiu = materie.an || 'I'; 
          const semestru = materie.semestru || 1;
          
          // Creează nota pentru materie
          const newNote = {
            id: materie.id,
            nume: materie.nume,
            credite: materie.credite || 0,
            nota: 0, // Nota 0 - neevaluată încă
            dataNota: new Date(),
            profesor: materie.profesor?.nume || 'Nespecificat',
            obligatorie: materie.obligatorie || false,
            status: 'neevaluat'
          };
          
          // Verifică dacă există deja un istoric pentru anul și semestrul specificat
          const anualIndex = istoricData.istoricAnual.findIndex(
            item => item.anUniversitar === anUniversitar && 
                   item.anStudiu === anStudiu &&
                   item.semestru === parseInt(semestru)
          );
          
          if (anualIndex >= 0) {
            // Adaugă nota la un istoric existent
            const updatedIstoric = [...istoricData.istoricAnual];
            updatedIstoric[anualIndex].cursuri.push(newNote);
            
            await updateDoc(istoricRef, {
              istoricAnual: updatedIstoric
            });
          } else {
            // Creează un nou istoric anual
            const newAnualRecord = {
              anUniversitar: anUniversitar,
              anStudiu: anStudiu,
              semestru: parseInt(semestru),
              cursuri: [newNote]
            };
            
            await updateDoc(istoricRef, {
              istoricAnual: arrayUnion(newAnualRecord)
            });
          }
        }
      }
    } catch (error) {
      console.error('Eroare la sincronizarea istoricului academic:', error);
    }
  };

  // Calculează creditele și media pentru un an și semestru specific
  const calculateStats = (an, semestru = null) => {
    let materiiPromovate;
    
    if (semestru) {
      // Calculează pentru un semestru specific
      materiiPromovate = materiiInscrise.filter(materie => 
        materie.an === an && 
        parseInt(materie.semestru) === semestru && 
        materie.nota && materie.nota >= 5
      );
    } else {
      // Calculează pentru tot anul
      materiiPromovate = materiiInscrise.filter(materie => 
        materie.an === an && materie.nota && materie.nota >= 5
      );
    }
    
    if (!materiiPromovate.length) return { totalCredite: 0, medie: 0 };
    
    // Calculează totalul de credite adunând creditele materiilor promovate
    const totalCredite = materiiPromovate.reduce((sum, materie) => sum + (parseInt(materie.credite) || 0), 0);
    
    // Calculează suma ponderată (notă * credite) pentru fiecare materie
    const sumaPonderate = materiiPromovate.reduce((sum, materie) => 
      sum + (materie.nota * (parseInt(materie.credite) || 0)), 0
    );
    
    // Media ponderată = suma ponderată / total credite
    const medie = totalCredite > 0 ? sumaPonderate / totalCredite : 0;
    
    return {
      totalCredite,
      medie: medie > 0 ? Math.round(medie * 100) / 100 : 0 // Rotunjește la 2 zecimale
    };
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-2 py-4">
      <h1 className="text-xl font-bold mb-4">Materiile Mele</h1>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {materiiInscrise.length === 0 ? (
        <div className="text-center py-4 text-gray-600 text-sm">
          Nu ești înscris la nicio materie momentan.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selectarea anului */}
          <div className="flex space-x-2 border-b pb-1">
            <button
              className={`px-3 py-1 text-sm font-medium rounded-t transition-colors ${
                activeYear === 'I' ? 'bg-[#034a76] text-[#f5f5f5]' : 'text-[#034a76] hover:bg-[#f5f5f5]'
              }`}
              onClick={() => setActiveYear('I')}
            >
              Anul I
            </button>
            {/* Butonul pentru Anul II este vizibil doar dacă studentul este în anul II sau mai mare */}
            {(anStudent === 'II' || anStudent === 'III') && (
              <button
                className={`px-3 py-1 text-sm font-medium rounded-t transition-colors ${
                  activeYear === 'II' ? 'bg-[#034a76] text-[#f5f5f5]' : 'text-[#034a76] hover:bg-[#f5f5f5]'
                }`}
                onClick={() => setActiveYear('II')}
              >
                Anul II
              </button>
            )}
            {/* Butonul pentru Anul III este vizibil doar dacă studentul este în anul III */}
            {anStudent === 'III' && (
              <button
                className={`px-3 py-1 text-sm font-medium rounded-t transition-colors ${
                  activeYear === 'III' ? 'bg-[#034a76] text-[#f5f5f5]' : 'text-[#034a76] hover:bg-[#f5f5f5]'
                }`}
                onClick={() => setActiveYear('III')}
              >
                Anul III
              </button>
            )}
          </div>

          {/* Verificăm accesul la materiile anului selectat */}
          {/* Studentul poate vedea doar materiile anului său sau ale anilor anteriori */}
          {((activeYear === 'I') || 
            (activeYear === 'II' && (anStudent === 'II' || anStudent === 'III')) || 
            (activeYear === 'III' && anStudent === 'III')) ? (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-[#034a76]">Anul {activeYear}</h2>
              
              {materiiInscrise.filter(materie => materie.an === activeYear).length === 0 ? (
                <div className="text-center py-3 text-gray-500 text-sm">Nu există materii pentru Anul {activeYear}</div>
              ) : (
                <div className="bg-[#f5f5f5] rounded-lg shadow overflow-hidden border border-[#034a76]/20">
                  <table className="w-full table-fixed">
                    <thead className="bg-[#034a76] text-xs">
                      <tr>
                        <th className="w-[25%] px-2 py-2 text-left font-medium text-[#f5f5f5] uppercase tracking-wider">Materie</th>
                        <th className="w-[15%] px-2 py-2 text-center font-medium text-[#f5f5f5] uppercase tracking-wider">Credite</th>
                        <th className="w-[30%] px-2 py-2 text-center font-medium text-[#f5f5f5] uppercase tracking-wider">Notă</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#034a76]/10 text-sm">
                      {(() => {
                        const materiiAnCurent = materiiInscrise.filter(materie => materie.an === activeYear);
                        const materiiSem1 = materiiAnCurent.filter(materie => parseInt(materie.semestru) === 1);
                        const materiiSem2 = materiiAnCurent.filter(materie => parseInt(materie.semestru) === 2);
                        
                        return (
                          <>
                            {/* Materiile din semestrul 1 */}
                            {materiiSem1.length > 0 && (
                              <>
                                <tr className="bg-[#e3ab23] text-[#034a76]">
                                  <td colSpan="3" className="px-2 py-1 font-medium">
                                    Semestrul 1
                                  </td>
                                </tr>
                                {materiiSem1.map((materie) => (
                                  <tr 
                                    key={materie.id} 
                                    className="hover:bg-[#034a76]/5 cursor-pointer"
                                    onClick={() => {
                                      // Verificare suplimentară pentru a se asigura că studentul poate accesa această materie
                                      if (materie.an === 'I' || 
                                          (materie.an === 'II' && (anStudent === 'II' || anStudent === 'III')) ||
                                          (materie.an === 'III' && anStudent === 'III')) {
                                        setSelectedMaterie(materie);
                                      }
                                    }}
                                  >
                                    <td className="px-2 py-2 truncate font-medium text-[#034a76]">
                                      {materie.nume}
                                    </td>
                                    <td className="px-2 py-2 text-center text-[#034a76]/80">{materie.credite}</td>
                                    <td className="px-2 py-2 text-center">
                                      {materie.nota ? 
                                        <span className={`font-medium ${materie.nota >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                                          {materie.nota}
                                        </span> : 
                                        <span className="text-gray-500">Neevaluat</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                                {/* Statistici pentru semestrul 1 */}
                                <tr className="bg-[#f5f5f5] text-xs border-t border-[#034a76]/20">
                                  <td colSpan="3" className="px-2 py-1">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-[#034a76]">
                                        Credite Sem. 1: <span className="font-bold">{calculateStats(activeYear, 1).totalCredite}</span>
                                      </span>
                                      <span className="font-medium text-[#034a76]">
                                        Medie Sem. 1: <span className="font-bold">{calculateStats(activeYear, 1).medie || 'N/A'}</span>
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </>
                            )}
                            
                            {/* Materiile din semestrul 2 */}
                            {materiiSem2.length > 0 && (
                              <>
                                <tr className="bg-[#e3ab23] text-[#034a76]">
                                  <td colSpan="3" className="px-2 py-1 font-medium">
                                    Semestrul 2
                                  </td>
                                </tr>
                                {materiiSem2.map((materie) => (
                                  <tr 
                                    key={materie.id} 
                                    className="hover:bg-[#034a76]/5 cursor-pointer"
                                    onClick={() => {
                                      // Verificare suplimentară pentru a se asigura că studentul poate accesa această materie
                                      if (materie.an === 'I' || 
                                          (materie.an === 'II' && (anStudent === 'II' || anStudent === 'III')) ||
                                          (materie.an === 'III' && anStudent === 'III')) {
                                        setSelectedMaterie(materie);
                                      }
                                    }}
                                  >
                                    <td className="px-2 py-2 truncate font-medium text-[#034a76]">
                                      {materie.nume}
                                    </td>
                                    <td className="px-2 py-2 text-center text-[#034a76]/80">{materie.credite}</td>
                                    <td className="px-2 py-2 text-center">
                                      {materie.nota ? 
                                        <span className={`font-medium ${materie.nota >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                                          {materie.nota}
                                        </span> : 
                                        <span className="text-gray-500">Neevaluat</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                                {/* Statistici pentru semestrul 2 */}
                                <tr className="bg-[#f5f5f5] text-xs border-t border-[#034a76]/20">
                                  <td colSpan="3" className="px-2 py-1">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-[#034a76]">
                                        Credite Sem. 2: <span className="font-bold">{calculateStats(activeYear, 2).totalCredite}</span>
                                      </span>
                                      <span className="font-medium text-[#034a76]">
                                        Medie Sem. 2: <span className="font-bold">{calculateStats(activeYear, 2).medie || 'N/A'}</span>
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                    <tfoot className="bg-[#034a76] border-t-2 border-[#e3ab23] text-xs font-semibold">
                      <tr>
                        <td colSpan="3" className="px-2 py-2">
                          <div className="flex justify-between text-[#f5f5f5]">
                            <span>
                              Total credite anul {activeYear}: <span className="font-bold">{calculateStats(activeYear).totalCredite}</span>
                            </span>
                            <span>
                              Medie anul {activeYear}: <span className="font-bold">{calculateStats(activeYear).medie || 'N/A'}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Acces restricționat!</span>
              </div>
              <p className="mt-2 text-sm">
                Nu poți vedea materiile din Anul {activeYear} deoarece ești înscris în Anul {anStudent}. 
                Accesul la materiile din anii superiori va fi disponibil când vei promova în anul respectiv.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal pentru detalii materie */}
      {selectedMaterie && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMaterie(null);
            }
          }}
        >
          {/* Verificăm dacă studentul are acces la această materie bazat pe anul său */}
          {(selectedMaterie.an === 'I' || 
           (selectedMaterie.an === 'II' && (anStudent === 'II' || anStudent === 'III')) ||
           (selectedMaterie.an === 'III' && anStudent === 'III')) ? (
            <div className="bg-[#f5f5f5] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="p-4 flex-shrink-0 border-b border-[#034a76]/20">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-bold text-[#034a76]">{selectedMaterie.nume}</h2>
                  <button 
                    onClick={() => setSelectedMaterie(null)}
                    className="text-[#034a76]/70 hover:text-[#034a76]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <div className="flex space-x-2 text-xs mt-2">
                  <span className="bg-[#034a76] px-2 py-1 rounded text-[#f5f5f5]">Anul {selectedMaterie.an}</span>
                  <span className="bg-[#e3ab23] px-2 py-1 rounded text-[#034a76]">Semestrul {selectedMaterie.semestru}</span>
                  {selectedMaterie.status && (
                    <span className={`px-2 py-1 rounded ${
                      selectedMaterie.status === 'promovat' ? 'bg-green-100 text-green-800' : 
                      selectedMaterie.status === 'nepromovat' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedMaterie.status === 'promovat' ? 'Promovat' : 
                      selectedMaterie.status === 'nepromovat' ? 'Nepromovat' : 'Neevaluat'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto flex-grow text-sm">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Descriere:</h3>
                    <p className="text-gray-600 bg-gray-50 p-2 rounded max-h-[20vh] overflow-y-auto">
                      {selectedMaterie.descriere || 'Nicio descriere disponibilă.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h3 className="font-medium text-gray-700">Facultate:</h3>
                      <p className="text-gray-600 truncate">{selectedMaterie.facultate}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Specializare:</h3>
                      <p className="text-gray-600 truncate">{selectedMaterie.specializare}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Profesor:</h3>
                      <p className="text-gray-600 truncate">{selectedMaterie.profesor?.nume || 'Nespecificat'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Credite:</h3>
                      <p className="text-gray-600">{selectedMaterie.credite}</p>
                    </div>
                    {selectedMaterie.nota !== undefined && (
                      <div>
                        <h3 className="font-medium text-gray-700">Notă:</h3>
                        <p className={`font-medium ${selectedMaterie.nota >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedMaterie.nota || 'Neevaluat'}
                        </p>
                      </div>
                    )}
                    {selectedMaterie.dataNota && (
                      <div>
                        <h3 className="font-medium text-gray-700">Data evaluării:</h3>
                        <p className="text-gray-600">
                          {selectedMaterie.dataNota instanceof Date 
                            ? selectedMaterie.dataNota.toLocaleDateString('ro-RO') 
                            : typeof selectedMaterie.dataNota === 'object' && selectedMaterie.dataNota.toDate 
                              ? selectedMaterie.dataNota.toDate().toLocaleDateString('ro-RO')
                              : 'Necunoscută'
                          }
                        </p>
                      </div>
                    )}
                    {selectedMaterie.anUniversitarIstoric && (
                      <div>
                        <h3 className="font-medium text-gray-700">An universitar:</h3>
                        <p className="text-gray-600">{selectedMaterie.anUniversitarIstoric}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 flex-shrink-0 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedMaterie(null)}
                    className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Închide
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg w-full max-w-md p-5">
              <div className="flex items-center mb-4 text-amber-700">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-semibold">Acces restricționat</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Nu poți accesa detaliile acestei materii deoarece este de la un an de studiu superior anului tău.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedMaterie(null)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Închide
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MateriiStudentPage; 