import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import MaterieModal from '../../components/student/MaterieModal';

const MaterieCard = ({ materie, index, onDragStart, onDragOver, onDrop, onViewDetails, id }) => {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e, id)}
      className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 mb-2 cursor-move hover:border-blue-300 shadow-sm"
    >
      <div className="flex items-center">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
          {index + 1}
        </span>
        <span className="text-sm">{materie.nume}</span>
      </div>
      <button
        onClick={() => onViewDetails(materie.id)}
        className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-100"
        title="Vezi detalii"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
};

const InscriereMateriiPage = () => {
  const [pachete, setPachete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterie, setSelectedMaterie] = useState(null);
  const [materieDetails, setMaterieDetails] = useState(null);
  const [preferinte, setPreferinte] = useState({}); // Preferințele utilizatorului pentru fiecare pachet
  const [loadingPachete, setLoadingPachete] = useState({}); // Pentru a urmări încărcarea pentru fiecare pachet
  const [successMessage, setSuccessMessage] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [dragPachet, setDragPachet] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Adaugă toate materiile la lista de preferințe pentru un pachet dacă lista e goală
  const adaugaToateMateriile = (pachetId) => {
    const pachet = pachete.find(p => p.id === pachetId);
    if (!pachet) return;
    
    if (!preferinte[pachetId] || preferinte[pachetId].length === 0) {
      const toateMateriile = pachet.materii.map(m => m.id);
      
      setPreferinte(prevPreferinte => ({
        ...prevPreferinte,
        [pachetId]: toateMateriile
      }));
    }
  };

  // Funcții pentru drag-and-drop
  const handleDragStart = (e, materieId, pachetId) => {
    setDragItem(materieId);
    setDragPachet(pachetId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetMaterieId, pachetId) => {
    e.preventDefault();
    
    // Asigură-te că suntem în același pachet
    if (pachetId !== dragPachet) return;
    
    // Nu face nimic dacă ai dat drop pe același element
    if (dragItem === targetMaterieId) return;
    
    const preferintePachet = [...(preferinte[pachetId] || [])];
    const dragIndex = preferintePachet.indexOf(dragItem);
    const dropIndex = preferintePachet.indexOf(targetMaterieId);
    
    if (dragIndex !== -1 && dropIndex !== -1) {
      // Creează o nouă listă cu elementul mutat
      const newList = [...preferintePachet];
      newList.splice(dragIndex, 1);
      newList.splice(dropIndex, 0, dragItem);
      
      setPreferinte(prevPreferinte => ({
        ...prevPreferinte,
        [pachetId]: newList
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      try {
        // Obține pachetele și materiile înscrise ale studentului
        const [pacheteSnapshot, userDoc] = await Promise.all([
          getDocs(collection(db, 'pachete')),
          getDoc(doc(db, 'users', user.uid))
        ]);

        const materiiInscrise = userDoc.data().materiiInscrise || [];
        const preferinteExistente = userDoc.data().preferinteMateriiOptionale || {};
        
        // Procesează pachetele și marchează materiile deja alese
        const pacheteList = pacheteSnapshot.docs.map(doc => {
          const pachet = { id: doc.id, ...doc.data() };
          // Pentru fiecare pachet, verifică dacă studentul are o materie aleasă din acest pachet
          const materieAleasa = pachet.materii.find(m => materiiInscrise.includes(m.id));
          return {
            ...pachet,
            materieAleasa: materieAleasa?.id || null
          };
        });

        setPachete(pacheteList);
        setPreferinte(preferinteExistente);
        setLoading(false);
      } catch (error) {
        console.error('Eroare la încărcarea datelor:', error);
        setError('A apărut o eroare la încărcarea datelor');
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  // Verifică dacă avem pachete și adaugă materiile la preferințe dacă e nevoie
  useEffect(() => {
    if (pachete.length > 0) {
      pachete.forEach(pachet => {
        if (!preferinte[pachet.id] || preferinte[pachet.id].length === 0) {
          adaugaToateMateriile(pachet.id);
        }
      });
    }
  }, [pachete, preferinte]);

  // Obține numele materiei după ID
  const getNumeMaterie = (pachetId, materieId) => {
    const pachet = pachete.find(p => p.id === pachetId);
    if (!pachet) return "Materie necunoscută";
    
    const materie = pachet.materii.find(m => m.id === materieId);
    return materie ? materie.nume : "Materie necunoscută";
  };

  // Obține obiectul materie după ID
  const getMaterieById = (pachetId, materieId) => {
    const pachet = pachete.find(p => p.id === pachetId);
    if (!pachet) return null;
    
    return pachet.materii.find(m => m.id === materieId);
  };

  // Salvează preferințele pentru un pachet specific
  const salveazaPreferintePachet = async (pachetId) => {
    if (loadingPachete[pachetId]) return;
    
    setLoadingPachete(prev => ({
      ...prev,
      [pachetId]: true
    }));
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Obține preferințele actuale din Firestore
      const userDoc = await getDoc(userRef);
      const preferinteExistente = userDoc.data().preferinteMateriiOptionale || {};
      
      // Actualizează doar preferințele pentru pachetul specific
      const preferinteActualizate = {
        ...preferinteExistente,
        [pachetId]: preferinte[pachetId] || []
      };
      
      // Salvează preferințele actualizate
      await updateDoc(userRef, {
        preferinteMateriiOptionale: preferinteActualizate
      });
      
      // Afisează mesajul de succes pentru 3 secunde
      setSuccessMessage(`Preferințele pentru pachetul au fost salvate cu succes!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Eroare la salvarea preferințelor:', error);
      setError('A apărut o eroare la salvarea preferințelor');
    } finally {
      setLoadingPachete(prev => ({
        ...prev,
        [pachetId]: false
      }));
    }
  };

  const handleMaterieClick = async (materieId) => {
    try {
      const materieRef = doc(db, 'materii', materieId);
      const materieDoc = await getDoc(materieRef);
      
      if (materieDoc.exists()) {
        const materieData = materieDoc.data();
        
        // Găsește pachetul care conține această materie
        const pachetulMateriei = pachete.find(pachet => 
          pachet.materii.some(m => m.id === materieId)
        );
        
        // Obține detaliile profesorului
        let profesorNume = 'Nealocat';
        let profesorInfo = null;
        
        if (materieData.profesor?.id) {
          try {
            // Asigură-te că obții cele mai recente date ale profesorului
            const profesorRef = doc(db, 'users', materieData.profesor.id);
            const profesorDoc = await getDoc(profesorRef);
            
            if (profesorDoc.exists()) {
              profesorInfo = profesorDoc.data();
              profesorNume = `${profesorInfo.nume || ''} ${profesorInfo.prenume || ''}`.trim();
              
              // Dacă nu avem nume formatat, folosim displayName sau email
              if (!profesorNume) {
                profesorNume = profesorInfo.displayName || profesorInfo.email || 'Profesor';
              }
            }
          } catch (err) {
            console.error("Eroare la încărcarea detaliilor profesorului:", err);
          }
        }
        
        // Verifică dacă există detalii actualizate în pachet
        if (pachetulMateriei) {
          const materieInPachet = pachetulMateriei.materii.find(m => m.id === materieId);
          
          if (materieInPachet && materieInPachet.profesor && materieInPachet.profesor.nume) {
            // Poate avea detalii mai actualizate despre profesor în pachet
            profesorNume = materieInPachet.profesor.nume;
          }
        }

        setMaterieDetails({
          ...materieData,
          id: materieId,
          profesorNume: profesorNume,
          profesorInfo: profesorInfo,
          pachetId: pachetulMateriei?.id
        });
        setSelectedMaterie(materieId);
      }
    } catch (error) {
      console.error('Eroare la încărcarea detaliilor materiei:', error);
      setError('Nu s-au putut încărca detaliile materiei.');
    }
  };

  const handleInscriere = async (materieId, pachetId) => {
    if (!pachetId) {
      setError('Eroare: Nu s-a putut identifica pachetul materiei');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const materieRef = doc(db, 'materii', materieId);
      const userDoc = await getDoc(userRef);
      const materieDoc = await getDoc(materieRef);
      const materieData = materieDoc.data();
      const userData = userDoc.data();

      // Verifică dacă mai sunt locuri disponibile
      if (!materieData.obligatorie && materieData.studentiInscrisi?.length >= materieData.locuriDisponibile) {
        setError('Nu mai sunt locuri disponibile la această materie');
        return;
      }

      const materiiInscrise = userDoc.data().materiiInscrise || [];
      const pachet = pachete.find(p => p.id === pachetId);
      
      if (!pachet) {
        throw new Error('Pachetul nu a fost găsit');
      }

      // Găsește materia veche din acest pachet (dacă există)
      const materieVecheId = pachet.materieAleasa;
      
      // Dacă există o materie veche, dezînscrie studentul de la ea
      if (materieVecheId) {
        const materieVecheRef = doc(db, 'materii', materieVecheId);
        const materieVecheDoc = await getDoc(materieVecheRef);
        const materieVecheData = materieVecheDoc.data();
        
        await updateDoc(materieVecheRef, {
          studentiInscrisi: materieVecheData.studentiInscrisi.filter(s => s.id !== user.uid)
        });
        
        await updateDoc(userRef, {
          materiiInscrise: materiiInscrise.filter(id => id !== materieVecheId)
        });
      }

      // Înscrie studentul la noua materie
      await updateDoc(materieRef, {
        studentiInscrisi: arrayUnion({
          id: user.uid,
          nume: userData?.nume || user.displayName || 'Student',
          numarMatricol: userData?.numarMatricol || 'N/A'
        })
      });

      // Adaugă noua materie în lista de materii înscrise a studentului
      await updateDoc(userRef, {
        materiiInscrise: arrayUnion(materieId)
      });

      // Actualizează istoricul academic
      await adaugaLaIstoricAcademic(materieId, materieData);

      // În loc să setăm mesajul de succes, închidem direct modalul
      setSelectedMaterie(null);
      setMaterieDetails(null);
      
      // Actualizăm starea locală a pachetelor
      setPachete(pachete.map(p => {
        if (p.id === pachetId) {
          return {
            ...p,
            materieAleasa: materieId
          };
        }
        return p;
      }));

    } catch (error) {
      console.error('Eroare la înscriere:', error);
      setError('A apărut o eroare la înscriere');
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru adăugarea materiei în istoricul academic
  const adaugaLaIstoricAcademic = async (materieId, materieData) => {
    try {
      // Obține referința la istoricul academic al studentului
      const istoricRef = doc(db, 'istoricAcademic', user.uid);
      
      // Verifică dacă există deja un istoric academic
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
        
      // Crează înregistrarea pentru materia la care s-a înscris studentul
      const newNote = {
        id: materieId,
        nume: materieData.nume,
        credite: materieData.credite || 0,
        nota: 0, // Nota 0 - neevaluată încă
        dataNota: new Date(),
        profesor: materieData.profesor?.nume || 'Nespecificat',
        obligatorie: materieData.obligatorie || false,
        status: 'neevaluat'
      };
      
      const anStudiu = materieData.an || 'I'; 
      const semestru = materieData.semestru || 1;
      
      // Verifică dacă există deja un istoric pentru anul și semestrul specificat
      const anualIndex = istoricData.istoricAnual.findIndex(
        item => item.anUniversitar === anUniversitar && 
               item.anStudiu === anStudiu &&
               item.semestru === parseInt(semestru)
      );
      
      // Verifică dacă materia există deja în istoric
      const materieExistenta = istoricData.istoricAnual.some(anual => 
        anual.cursuri.some(curs => curs.id === materieId)
      );
      
      if (materieExistenta) {
        // Materia deja există în istoric, nu o adăugăm din nou
        return;
      }
      
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
    } catch (error) {
      console.error('Eroare la actualizarea istoricului academic:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Înscriere la Materii</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      <p className="text-gray-600 mb-6">
        Ține apăsat pe o materie și trage-o pentru a schimba ordinea preferințelor. Prima materie din listă are cea mai mare prioritate.
        Apasă pe iconița de verificare din colțul dreapta sus al fiecărui pachet pentru a salva preferințele.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pachete.map((pachet) => {
          // Asigură-te că toate materiile sunt în lista de preferințe
          const preferintePachet = preferinte[pachet.id] || [];
          const isLoading = loadingPachete[pachet.id] || false;
          
          return (
            <div key={pachet.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{pachet.nume}</h2>
                  <div className="text-xs text-gray-500 mt-1">
                    {pachet.facultate && <span className="mr-2">Facultate: {pachet.facultate}</span>}
                    {pachet.specializare && <span className="mr-2">Specializare: {pachet.specializare}</span>}
                    {pachet.an && <span>An: {pachet.an}</span>}
                  </div>
                </div>
                <button
                  onClick={() => salveazaPreferintePachet(pachet.id)}
                  disabled={isLoading}
                  className={`p-2 rounded-full ${isLoading ? 'bg-gray-200' : 'bg-[#034a76] hover:bg-[#023557]'} text-white`}
                  title="Salvează preferințele pentru acest pachet"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-3">Materiile tale, ordonate după preferință:</h3>
                
                {preferintePachet.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 text-center">
                    Se încarcă materiile...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {preferintePachet.map((materieId, index) => {
                      const materie = getMaterieById(pachet.id, materieId);
                      if (!materie) return null;
                      
                      return (
                        <MaterieCard 
                          key={materieId}
                          id={materieId}
                          materie={materie}
                          index={index}
                          onDragStart={(e) => handleDragStart(e, materieId, pachet.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, materieId, pachet.id)}
                          onViewDetails={handleMaterieClick}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal pentru detalii materie */}
      {selectedMaterie && materieDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMaterie(null);
              setMaterieDetails(null);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800">{materieDetails.nume}</h2>
                <button 
                  onClick={() => {
                    setSelectedMaterie(null);
                    setMaterieDetails(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Facultate:</h3>
                    <p className="text-sm text-gray-600">{materieDetails.facultate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Specializare:</h3>
                    <p className="text-sm text-gray-600">{materieDetails.specializare}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Profesor:</h3>
                    <p className="text-sm text-gray-600">{materieDetails.profesorNume}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Credite:</h3>
                    <p className="text-sm text-gray-600">{materieDetails.credite}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Descriere:</h3>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {materieDetails.descriere || 'Nicio descriere disponibilă.'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Locuri disponibile:</h3>
                  <p className="text-sm text-gray-600">
                    {materieDetails.locuriDisponibile - (materieDetails.studentiInscrisi?.length || 0)} / {materieDetails.locuriDisponibile}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InscriereMateriiPage; 