import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import MaterieModal from '../../components/student/MaterieModal';
import { isStudent } from '../../utils/userRoles';
import AIAssistant from '../../components/AIAssistant';

const MaterieCard = ({ materie, index, onDragStart, onDragOver, onDrop, onViewDetails, id }) => {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e, id)}
      className="flex items-center justify-between bg-[#f5f5f5] p-3 rounded-md border border-[#034a76]/20 mb-2 cursor-move hover:border-[#e3ab23] shadow-sm"
    >
      <div className="flex items-center">
        <span className="bg-[#034a76] text-[#f5f5f5] rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
          {index + 1}
        </span>
        <span className="text-sm text-[#034a76]">{materie.nume}</span>
      </div>
      <button
        onClick={() => onViewDetails(materie.id)}
        className="p-1 rounded text-[#034a76]/70 hover:text-[#034a76] hover:bg-[#e3ab23]/20"
        title="Vezi detalii"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
};

// Component to show academic year progress
const AcademicYearProgress = ({ currentYear, accumulatedECTS, minECTS, isNewRegistration }) => {
  // Convert Roman numeral to numeric year
  const yearNumber = currentYear === 'I' ? 1 : currentYear === 'II' ? 2 : 3;
  
  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-[#034a76]/20">
      <h3 className="text-md font-medium text-[#034a76] mb-3">Progresul anului academic</h3>
      
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3].map(year => (
          <div 
            key={year} 
            className={`relative flex flex-col items-center ${year <= yearNumber ? 'text-[#034a76]' : 'text-gray-400'}`}
          >
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 border-2 
                ${year < yearNumber ? 'bg-[#034a76] text-white border-[#034a76]' : 
                  year === yearNumber ? 'bg-white text-[#034a76] border-[#034a76]' : 
                  'bg-white text-gray-400 border-gray-300'}`}
            >
              {year === 1 ? 'I' : year === 2 ? 'II' : 'III'}
            </div>
            <span className="text-xs font-medium">Anul {year === 1 ? 'I' : year === 2 ? 'II' : 'III'}</span>
            
            {year === yearNumber && accumulatedECTS >= minECTS && year < 3 && (
              <div className="absolute -top-2 -right-2">
                <span 
                  className="flex items-center justify-center w-6 h-6 rounded-full text-xs bg-green-500 text-white"
                  title="Ai acumulat suficiente ECTS pentru avansarea în anul următor"
                >
                  ✓
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Progress bar connecting the circles */}
      <div className="relative h-2 bg-gray-200 rounded-full mx-12 my-3">
        <div 
          className="absolute left-0 top-0 h-2 bg-[#034a76] rounded-full"
          style={{ 
            width: yearNumber === 1 ? 
              `${Math.min(100, (accumulatedECTS / minECTS) * 50)}%` : 
              yearNumber === 2 ? 
              `50%` : 
              '100%' 
          }}
        ></div>
        <div 
          className="absolute left-0 top-0 h-2 bg-[#e3ab23] rounded-full"
          style={{ 
            width: yearNumber === 1 && accumulatedECTS >= minECTS ? 
              '50%' : 
              yearNumber === 2 && accumulatedECTS >= minECTS ? 
              '100%' : 
              yearNumber === 1 ? 
              `${Math.min(100, (accumulatedECTS / minECTS) * 50)}%` : 
              yearNumber === 2 ? 
              `${50 + Math.min(50, (accumulatedECTS / minECTS) * 50)}%` : 
              '100%',
            left: yearNumber === 2 ? '50%' : '0',
            width: yearNumber === 2 ? `${Math.min(50, (accumulatedECTS / minECTS) * 50)}%` : 'auto'
          }}
        ></div>
      </div>
      
      <div className="text-xs text-center text-[#034a76]/70">
        {yearNumber < 3 ? (
          <>
            {accumulatedECTS}/{minECTS} ECTS acumulate în anul curent
            {accumulatedECTS >= minECTS && (
              <span className="ml-1 text-green-600 font-medium">
                - Îndeplinești criteriile pentru avansarea în anul următor
              </span>
            )}
            {isNewRegistration && (
              <div className="mt-1 text-blue-600 font-medium">
                Te-ai înscris recent în noul an universitar. ECTS acumulate sunt pentru noul an.
              </div>
            )}
          </>
        ) : (
          <span>Anul final de studiu</span>
        )}
      </div>
    </div>
  );
};

// Toast Notification Component
const ToastNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out`}>
      <div className={`${getToastStyles()} rounded-lg shadow-lg border-l-4 p-4 flex items-start space-x-3`}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
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
  const [toastMessage, setToastMessage] = useState(null); // Changed from successMessage to toastMessage
  const [dragItem, setDragItem] = useState(null);
  const [dragPachet, setDragPachet] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [statusInscrieri, setStatusInscrieri] = useState({}); // Status înscrieri pentru fiecare pachet
  const [academicStats, setAcademicStats] = useState({
    avgGrade: 0,
    accumulatedECTS: 0,
    currentAcademicYear: ''
  });
  // Registration status removed - now handled by admins

  // Function to show toast notifications
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
  };

  const closeToast = () => {
    setToastMessage(null);
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

  // Calculate academic stats
  const calculateAcademicStats = async (userId, forceRefresh = false) => {
    try {
      const istoricRef = doc(db, 'istoricAcademic', userId);
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) {
        return {
          avgGrade: 0,
          accumulatedECTS: 0,
          currentAcademicYear: ''
        };
      }
      
      const istoricData = istoricDoc.data();
      
      // Determine current academic year
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const currentAcademicYear = month < 9 ? 
        `${year-1}-${year}` : // For months Jan-Aug, use previous-current year
        `${year}-${year+1}`;  // For months Sep-Dec, use current-next year
      
      // Get user data to check if this is a new academic year
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Check if user has a lastRegistrationYear field and it's the current academic year
      const isNewYear = userData.lastRegistrationYear === currentAcademicYear;
      
      // Filter entries for current academic year
      const currentYearEntries = istoricData.istoricAnual?.filter(entry => 
        entry.anUniversitar === currentAcademicYear
      ) || [];
      
      // Get all courses with valid grades
      const allCourses = [];
      let totalECTS = 0;
      
      currentYearEntries.forEach(entry => {
        entry.cursuri.forEach(curs => {
          // For a new academic year, we only count courses that were registered after the last registration
          const shouldCount = !isNewYear || 
                             (curs.dataInregistrare && 
                              new Date(curs.dataInregistrare) > new Date(userData.lastRegistrationDate || 0));
          
          if (curs.nota > 0 && curs.status === 'promovat' && shouldCount) {
            allCourses.push(curs);
            // Ensure credite is treated as a number by using parseInt or parseFloat
            totalECTS += parseInt(curs.credite || 0, 10);
          }
        });
      });
      
      // Calculate average grade
      let avgGrade = 0;
      if (allCourses.length > 0) {
        const sum = allCourses.reduce((acc, course) => acc + course.nota, 0);
        avgGrade = parseFloat((sum / allCourses.length).toFixed(2));
      }
      
      return {
        avgGrade,
        accumulatedECTS: totalECTS,
        currentAcademicYear
      };
    } catch (error) {
      console.error('Error calculating academic stats:', error);
      return {
        avgGrade: 0,
        accumulatedECTS: 0,
        currentAcademicYear: ''
      };
    }
  };

  // Registration for next year is now handled by admins in AlocareAutomataPage

  /**
   * Încarcă pachetele de materii disponibile pentru student
   * și setează preferințe implicite în baza de date dacă studentul nu are preferințe pentru un pachet
   */
  const fetchPachete = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.uid) {
        navigate('/login');
        return;
      }
      
      // Verifică dacă utilizatorul este student
      const studentStatus = await isStudent(user.uid);
      if (!studentStatus) {
        navigate('/');
        return;
      }
      
      // Registration status checking removed - now handled by admins
      
      // Obține datele studentului pentru a determina facultatea, specializarea și anul
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('Nu s-au putut găsi datele studentului');
      }
      
      // Salvează datele studentului în state pentru a fi folosite mai târziu
      setUserData(userData);
      
      // Calculate academic stats with optional refresh
      const stats = await calculateAcademicStats(user.uid, forceRefresh);
      setAcademicStats(stats);
      
      // Obține istoricul academic al studentului pentru a verifica materiile promovate
      const istoricRef = doc(db, 'istoricAcademic', user.uid);
      const istoricDoc = await getDoc(istoricRef);
      const materiiPromovate = new Set();
      
      if (istoricDoc.exists()) {
        const istoricData = istoricDoc.data();
        if (istoricData.istoricAnual && istoricData.istoricAnual.length > 0) {
          istoricData.istoricAnual.forEach(anual => {
            if (anual.cursuri && anual.cursuri.length > 0) {
              anual.cursuri.forEach(curs => {
                if (curs.status === 'promovat') {
                  materiiPromovate.add(curs.id);
                }
              });
            }
          });
        }
      }
      
      // Obține pachetele pentru facultatea, specializarea și anul studentului
      const pacheteQuery = query(
        collection(db, 'pachete'),
        where('facultate', '==', userData.facultate),
        where('specializare', '==', userData.specializare),
        where('an', '==', userData.an)
      );
      
      const pacheteSnapshot = await getDocs(pacheteQuery);
      
      // Verifică dacă există pachete pentru această combinație
      if (pacheteSnapshot.empty) {
        setError(`Nu există pachete disponibile pentru ${userData.facultate}, specializarea ${userData.specializare}, anul ${userData.an}`);
        setLoading(false);
        return;
      }
      
      // Obține lista de materii înscrise ale studentului
      const materiiInscrise = userData.materiiInscrise || [];
      
      // Construiește obiectele pentru pachete
      const pacheteData = [];
      const statusUpdates = {};
      
      for (const pachetDoc of pacheteSnapshot.docs) {
        const pachetData = { id: pachetDoc.id, ...pachetDoc.data() };
        
        // Verifică dacă studentul a ales deja o materie din acest pachet
        const materieAleasa = materiiInscrise.find(materieId => {
          const materie = pachetData.materii.find(m => m.id === materieId);
          return materie !== undefined;
        });
        
        if (materieAleasa) {
          pachetData.materieAleasa = materieAleasa;
        }
        
        // Filtrează materiile promovate
        pachetData.materii = pachetData.materii.filter(materie => !materiiPromovate.has(materie.id));
        
        // Determină starea procesului de înscriere
        const dataStart = pachetData.dataStart ? new Date(pachetData.dataStart) : null;
        const dataFinal = pachetData.dataFinal ? new Date(pachetData.dataFinal) : null;
        const acum = new Date();
        
        let status = 'inactiv';
        if (dataStart && dataFinal) {
          if (acum < dataStart) {
            status = 'urmează';
          } else if (acum >= dataStart && acum <= dataFinal) {
            status = 'activ';
          } else {
            status = 'încheiat';
          }
        }
        
        statusUpdates[pachetDoc.id] = {
          status,
          dataStart: dataStart ? dataStart.toISOString() : null,
          dataFinal: dataFinal ? dataFinal.toISOString() : null,
          active: status === 'activ'
        };
        
        // Adaugă pachetul la lista doar dacă are materii disponibile sau dacă studentul a ales deja o materie
        if (pachetData.materii.length > 0 || materieAleasa) {
          pacheteData.push(pachetData);
        }
      }
      
      // Sortează pachetele după data de început
      pacheteData.sort((a, b) => new Date(a.dataStart) - new Date(b.dataStart));
      
      // Actualizează state-ul
      setPachete(pacheteData);
      setStatusInscrieri(statusUpdates);
      
      // Verifică dacă utilizatorul are preferințe salvate în baza de date
      // Dacă nu, setează valori implicite pentru toate pachetele
      const preferinteMateriiOptionale = userData.preferinteMateriiOptionale || {};
      let shouldUpdatePreferinte = false;
      const preferinteImplicite = { ...preferinteMateriiOptionale };
      
      // Pentru fiecare pachet, verifică dacă există preferințe
      for (const pachet of pacheteData) {
        // Dacă nu există preferințe pentru acest pachet, adaugă toate materiile ca preferințe implicite
        if (!preferinteMateriiOptionale[pachet.id] || preferinteMateriiOptionale[pachet.id].length === 0) {
          const toateMateriile = pachet.materii.map(m => m.id);
          preferinteImplicite[pachet.id] = toateMateriile;
          shouldUpdatePreferinte = true;
        }
      }
      
      // Actualizează preferințele în baza de date dacă s-au adăugat preferințe implicite
      if (shouldUpdatePreferinte) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            preferinteMateriiOptionale: preferinteImplicite
          });
          
          // Actualizează starea locală cu preferințele implicite
          setPreferinte(preferinteImplicite);
        } catch (error) {
          console.error('Eroare la salvarea preferințelor implicite:', error);
        }
      } else {
        // Actualizează starea locală cu preferințele existente
        setPreferinte(preferinteMateriiOptionale);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Eroare la încărcarea pachetelor:', error);
      setError('A apărut o eroare la încărcarea pachetelor');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPachete();
  }, [user, navigate]);

  // Această verificare a fost mutată în fetchPachete pentru a seta valorile implicite direct în baza de date

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
      const preferintePachetExistente = preferinteExistente[pachetId] || [];
      const preferintePachetNoi = preferinte[pachetId] || [];
      
      // Verifică dacă preferințele s-au schimbat
      const preferinteSchimbate = 
        preferintePachetExistente.length !== preferintePachetNoi.length ||
        !preferintePachetExistente.every((id, index) => id === preferintePachetNoi[index]);
      
      if (preferinteSchimbate) {
        // Actualizează doar preferințele pentru pachetul specific
        const preferinteActualizate = {
          ...preferinteExistente,
          [pachetId]: preferintePachetNoi
        };
        
        // Salvează preferințele actualizate
        await updateDoc(userRef, {
          preferinteMateriiOptionale: preferinteActualizate
        });
        
        // Show success toast
        showToast('Preferințele pentru pachet au fost salvate cu succes!', 'success');
      } else {
        // Show info toast when preferences haven't changed
        showToast('Preferințele pentru pachet sunt deja salvate.', 'info');
      }
    } catch (error) {
      console.error('Eroare la salvarea preferințelor:', error);
      showToast('A apărut o eroare la salvarea preferințelor', 'error');
    } finally {
      setLoadingPachete(prev => ({
        ...prev,
        [pachetId]: false
      }));
    }
  };

  const handleMaterieView = async (materieId) => {
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
        setSelectedMaterie({
          id: materieId,
          pachetId: pachetulMateriei?.id
        });
      }
    } catch (error) {
      console.error('Eroare la încărcarea detaliilor materiei:', error);
      showToast('Nu s-au putut încărca detaliile materiei.', 'error');
    }
  };

  const handleMaterieClick = async (materieId) => {
    try {
      setLoading(true);
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      const pachetId = selectedMaterie.pachetId;
      
      // Verifică dacă pachetul există
      const pachet = pachete.find(p => p.id === pachetId);
      if (!pachet) {
        throw new Error('Pachetul nu a fost găsit');
      }
      
      // Verifică istoricul academic pentru a vedea dacă materia a fost promovată
      const istoricRef = doc(db, 'istoricAcademic', user.uid);
      const istoricDoc = await getDoc(istoricRef);
      
      if (istoricDoc.exists()) {
        const istoricData = istoricDoc.data();
        if (istoricData.istoricAnual && istoricData.istoricAnual.length > 0) {
          // Verificăm dacă materia există în istoric și este promovată
          const materiePromovata = istoricData.istoricAnual.some(anual => 
            anual.cursuri && anual.cursuri.some(curs => 
              curs.id === materieId && curs.status === 'promovat'
            )
          );
          
          if (materiePromovata) {
            showToast("Nu vă puteți înscrie la această materie deoarece ați promovat-o deja.", 'error');
            setLoading(false);
            return;
          }
        }
      }
      
      // Verifică dacă studentul a ales deja o materie din acest pachet
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const materiiInscrise = userData.materiiInscrise || [];
      
      // Găsește materia veche (dacă există)
      let materieVecheId = null;
      
      // Verificăm pentru fiecare materie din pachet dacă studentul este înscris la ea
      for (const materie of pachet.materii) {
        if (materiiInscrise.includes(materie.id)) {
          materieVecheId = materie.id;
          break;
        }
      }
      
      // Obține detaliile materiei la care se înscrie studentul
      const materieRef = doc(db, 'materii', materieId);
      const materieDoc = await getDoc(materieRef);
      
      if (!materieDoc.exists()) {
        throw new Error('Materia nu a fost găsită');
      }
      
      const materieData = materieDoc.data();
      
      // Verifică dacă mai sunt locuri disponibile
      const locuriDisponibile = materieData.locuriDisponibile || 0;
      const studentiInscrisi = materieData.studentiInscrisi || [];
      
      if (studentiInscrisi.length >= locuriDisponibile && !studentiInscrisi.some(s => s.id === user.uid)) {
        showToast('Nu mai sunt locuri disponibile pentru această materie', 'error');
        setLoading(false);
        return;
      }
      
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

      // Show success toast and close modal
      showToast('Te-ai înscris cu succes la materie!', 'success');
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
      showToast('A apărut o eroare la înscriere', 'error');
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
        
      const anStudiu = materieData.an || 'I'; 
      const semestru = materieData.semestru || 1;
      
      // Verifică dacă materia există deja în istoric (verificare mai robustă)
      const materieExistenta = istoricData.istoricAnual.some(anual => 
        anual.cursuri.some(curs => curs.id === materieId)
      );
      
      if (materieExistenta) {
        // Materia deja există în istoric, nu o adăugăm din nou
        console.log(`Materia ${materieId} există deja în istoric`);
        return;
      }
      
      // Crează înregistrarea pentru materia la care s-a înscris studentul
      // IMPORTANT: Folosim timestamp în loc de Date object pentru a evita duplicatele
      const currentTimestamp = currentDate.getTime();
      const newNote = {
        id: materieId,
        nume: materieData.nume,
        credite: materieData.credite || 0,
        nota: 0, // Nota 0 - neevaluată încă
        dataNota: currentTimestamp, // Folosim timestamp în loc de Date object
        profesor: materieData.profesor?.nume || 'Nespecificat',
        obligatorie: materieData.obligatorie || false,
        status: 'neevaluat',
        dataInregistrare: new Date().toISOString() // Păstrăm ISO string pentru data înregistrării
      };
      
      // Verifică dacă există deja un istoric pentru anul și semestrul specificat
      const anualIndex = istoricData.istoricAnual.findIndex(
        item => item.anUniversitar === anUniversitar && 
               item.anStudiu === anStudiu &&
               item.semestru === parseInt(semestru)
      );
      
      if (anualIndex >= 0) {
        // Verificăm din nou dacă materia nu există deja în acest an/semestru specific
        const materieExistentaInAn = istoricData.istoricAnual[anualIndex].cursuri.some(
          curs => curs.id === materieId
        );
        
        if (materieExistentaInAn) {
          console.log(`Materia ${materieId} există deja în anul ${anStudiu}, semestrul ${semestru}`);
          return;
        }
        
        // Adaugă nota la un istoric existent
        const updatedIstoric = [...istoricData.istoricAnual];
        updatedIstoric[anualIndex].cursuri.push(newNote);
        
        await updateDoc(istoricRef, {
          istoricAnual: updatedIstoric
        });
      } else {
        // Verifică din nou întreaga structură pentru a evita duplicatele
        const reloadedDoc = await getDoc(istoricRef);
        const reloadedData = reloadedDoc.data();
        
        // Verifică dacă între timp nu s-a adăugat un record similar
        const conflictIndex = reloadedData.istoricAnual?.findIndex(
          item => item.anUniversitar === anUniversitar && 
                 item.anStudiu === anStudiu &&
                 item.semestru === parseInt(semestru)
        );
        
        if (conflictIndex >= 0) {
          // S-a adăugat între timp, folosim logica de update
          const materieExistentaInAn = reloadedData.istoricAnual[conflictIndex].cursuri.some(
            curs => curs.id === materieId
          );
          
          if (!materieExistentaInAn) {
            const updatedIstoric = [...reloadedData.istoricAnual];
            updatedIstoric[conflictIndex].cursuri.push(newNote);
            
            await updateDoc(istoricRef, {
              istoricAnual: updatedIstoric
            });
          }
        } else {
          // Creează un nou istoric anual - EVITÂND arrayUnion pentru a preveni duplicatele
          const newAnualRecord = {
            anUniversitar: anUniversitar,
            anStudiu: anStudiu,
            semestru: parseInt(semestru),
            cursuri: [newNote]
          };
          
          // În loc de arrayUnion, folosim updateDoc cu întreaga structură
          const updatedIstoric = [...(reloadedData.istoricAnual || []), newAnualRecord];
          
          await updateDoc(istoricRef, {
            istoricAnual: updatedIstoric
          });
        }
      }
    } catch (error) {
      console.error('Eroare la actualizarea istoricului academic:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nespecificată';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'activ':
        return 'bg-green-500 text-white';
      case 'urmează':
        return 'bg-blue-500 text-white';
      case 'încheiat':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'activ':
        return 'Înscrieri active';
      case 'urmează':
        return 'Înscrieri viitoare';
      case 'încheiat':
        return 'Înscrieri închise';
      default:
        return 'Inactiv';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16 pb-8">
      {/* AI Assistant */}
      <AIAssistant />
      
      {/* Toast Notification */}
      {toastMessage && (
        <ToastNotification
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={closeToast}
        />
      )}

      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#034a76]">Înscriere la Materii</h1>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Academic Year Progress */}
        {userData && (
          <AcademicYearProgress 
            currentYear={userData.an || 'I'} 
            accumulatedECTS={academicStats.accumulatedECTS}
            minECTS={40}
            isNewRegistration={userData.lastRegistrationYear === academicStats.currentAcademicYear}
          />
        )}
        
        {/* Academic Stats Summary */}
        <div className="mb-6 p-4 bg-[#034a76]/10 rounded-lg">
          <h2 className="text-lg font-medium text-[#034a76] mb-2">Performanța ta academică ({academicStats.currentAcademicYear})</h2>
          
          {userData?.lastRegistrationYear === academicStats.currentAcademicYear && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Înregistrare nouă în anul {userData.an}</p>
                  <p className="text-sm mt-1">Te-ai înregistrat pentru noul an universitar la data {new Date(userData.lastRegistrationDate).toLocaleDateString('ro-RO')}. ECTS acumulate sunt numărate doar pentru cursurile noi.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm border border-[#034a76]/20">
              <div className="text-sm text-[#034a76]/70">Media notelor</div>
              <div className="text-xl font-bold text-[#034a76]">{academicStats.avgGrade}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm border border-[#034a76]/20">
              <div className="text-sm text-[#034a76]/70">ECTS acumulate</div>
              <div className="text-xl font-bold text-[#034a76]">{academicStats.accumulatedECTS}</div>
              {userData?.lastRegistrationYear === academicStats.currentAcademicYear && (
                <div className="text-xs text-green-600 mt-1">Doar pentru cursurile noi din anul {userData.an}</div>
              )}
            </div>
          </div>
          
          {/* Next Year Registration Status */}
          {userData?.an && (
            <div className="mt-4">
              {userData.an === 'III' ? (
                <div className="p-3 bg-purple-50 rounded-md shadow-sm border border-purple-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-purple-800">Anul final de studiu</p>
                      <p className="text-sm text-purple-700 mt-1">
                        Te afli în anul III (anul final). Concentrează-te pe finalizarea studiilor și pregătirea pentru examenele finale.
                        {academicStats.accumulatedECTS >= 40 ? 
                          ` Ai acumulat ${academicStats.accumulatedECTS} ECTS în acest an academic.` :
                          ` Ai acumulat ${academicStats.accumulatedECTS} ECTS - continuă să promovezi cursurile pentru finalizarea anului.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : academicStats.accumulatedECTS >= 40 ? (
                userData?.lastRegistrationYear === academicStats.currentAcademicYear ? (
                  <div className="p-3 bg-green-50 rounded-md shadow-sm border border-green-200">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">Ai fost înregistrat în anul următor</p>
                        <p className="text-sm text-green-700 mt-1">
                          Înregistrarea ta pentru anul {userData.an === 'I' ? 'II' : 'III'} a fost procesată cu succes de către administratori. 
                          Cursurile pentru noul an academic vor fi disponibile la începutul semestrului.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-md shadow-sm border border-blue-200">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Îndeplinești criteriile pentru avansarea în anul următor</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Ai acumulat {academicStats.accumulatedECTS} ECTS (minim necesar: 40 ECTS). 
                          Înscrierea în anul următor va fi procesată de către administratori în perioada de înregistrare.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-3 bg-yellow-50 rounded-md shadow-sm border border-yellow-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Nu îndeplinești încă criteriile pentru avansarea în anul următor</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Ai acumulat {academicStats.accumulatedECTS} ECTS din minimum 40 ECTS necesare. 
                        Continuă să promovezi cursurile pentru a putea avansa în anul următor.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="text-[#034a76]/80 mb-6">
          Ține apăsat pe o materie și trage-o pentru a schimba ordinea preferințelor. Prima materie din listă are cea mai mare prioritate.
          Apasă pe iconița de verificare din colțul dreapta sus al fiecărui pachet pentru a salva preferințele.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pachete.map((pachet) => {
            // Asigură-te că toate materiile sunt în lista de preferințe
            const preferintePachet = preferinte[pachet.id] || [];
            const isLoading = loadingPachete[pachet.id] || false;
            const statusData = statusInscrieri[pachet.id] || { status: 'inactiv', active: false };
            
            return (
              <div key={pachet.id} className="border border-[#034a76]/20 rounded-lg bg-[#f5f5f5] shadow-sm overflow-hidden">
                <div className="bg-[#034a76] p-4 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-[#f5f5f5]">{pachet.nume}</h2>
                    <div className="text-xs text-[#f5f5f5]/90 mt-1">
                      {pachet.facultate && <span className="mr-2">Facultate: {pachet.facultate}</span>}
                      {pachet.specializare && <span className="mr-2">Specializare: {pachet.specializare}</span>}
                      {pachet.an && <span>An: {pachet.an}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => salveazaPreferintePachet(pachet.id)}
                    disabled={isLoading || !statusData.active}
                    className={`p-2 rounded-full ${isLoading ? 'bg-gray-200' : statusData.active ? 'bg-[#e3ab23] hover:bg-[#c49520]' : 'bg-gray-400'} text-[#034a76]`}
                    title={statusData.active ? "Salvează preferințele pentru acest pachet" : "Înscrierile nu sunt active"}
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
                
                {/* Afișează statusul înscrierii */}
                <div className={`px-4 py-2 ${getStatusClass(statusData.status)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getStatusText(statusData.status)}</span>
                    <span className="text-sm">
                      {statusData.status === 'activ' ? 'Se închide: ' + formatDate(statusData.dataFinal) :
                       statusData.status === 'urmează' ? 'Începe: ' + formatDate(statusData.dataStart) :
                       'Închis'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-sm text-[#034a76] mb-3">Materiile tale, ordonate după preferință:</h3>
                  
                  {preferintePachet.length === 0 ? (
                    <div className="text-sm text-[#034a76]/70 italic p-2 text-center">
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
                            onViewDetails={handleMaterieView}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Afișează informații despre alocarea automată dacă înscrierea s-a încheiat */}
                {statusData.status === 'încheiat' && (
                  <div className="p-4 border-t border-[#034a76]/20 bg-gray-100">
                    <p className="text-sm text-[#034a76]/80">
                      <strong>Notă:</strong> Perioada de înscriere pentru acest pachet s-a încheiat. 
                      Materiile vor fi alocate automat în funcție de preferințele studenților și de mediile acestora.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modale pentru detaliile materiei */}
        {materieDetails && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMaterieDetails(null);
                setSelectedMaterie(null);
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-2xl w-full overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#034a76]">{materieDetails.nume}</h2>
                <button 
                  onClick={() => {
                    setMaterieDetails(null);
                    setSelectedMaterie(null);
                  }}
                  className="text-[#034a76] hover:text-[#023557]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 bg-[#034a76]/10 p-3 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-[#034a76]">Facultate:</h3>
                    <p className="text-sm text-[#034a76]/80">{materieDetails.facultate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#034a76]">Specializare:</h3>
                    <p className="text-sm text-[#034a76]/80">{materieDetails.specializare}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#034a76]">Profesor:</h3>
                    <p className="text-sm text-[#034a76]/80">{materieDetails.profesorNume}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#034a76]">Credite:</h3>
                    <p className="text-sm text-[#034a76]/80">{materieDetails.credite}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#034a76] mb-1">Descriere:</h3>
                  <div className="max-h-32 overflow-y-auto bg-[#034a76]/10 p-3 rounded-lg">
                    <p className="text-sm text-[#034a76]/80 whitespace-pre-wrap">
                      {materieDetails.descriere || 'Nicio descriere disponibilă.'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#e3ab23]/20 p-3 rounded-lg border border-[#e3ab23]/30">
                  <h3 className="text-sm font-medium text-[#034a76] mb-1">Locuri disponibile:</h3>
                  <p className="text-sm text-[#034a76]">
                    {materieDetails.locuriDisponibile - (materieDetails.studentiInscrisi?.length || 0)} / {materieDetails.locuriDisponibile}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleMaterieClick(materieDetails.id)}
                    className="px-4 py-2 bg-[#034a76] text-[#f5f5f5] rounded hover:bg-[#023557] transition-colors"
                  >
                    {loading ? "Se procesează..." : "Înscrie-te la această materie"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InscriereMateriiPage; 