import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isSecretar } from '../../utils/userRoles';

// Toast notification component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${getToastStyles()}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            className="inline-flex text-white hover:text-gray-200 focus:outline-none focus:text-gray-200"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const SecretarAlocareAutomataPage = () => {
  const [pachete, setPachete] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPachet, setSelectedPachet] = useState(null);
  const [selectedPachetData, setSelectedPachetData] = useState(null);
  const [processingPachet, setProcessingPachet] = useState(null);
  const [rezultateAlocare, setRezultateAlocare] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSetarePerioadaForm, setShowSetarePerioadaForm] = useState(false);
  const [perioadaStartDate, setPerioadaStartDate] = useState('');
  const [perioadaStartTime, setPerioadaStartTime] = useState('');
  const [perioadaEndDate, setPerioadaEndDate] = useState('');
  const [perioadaEndTime, setPerioadaEndTime] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'perioadaInscriere'
  const [pachetPerioadaId, setPachetPerioadaId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Toast notification functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const secretarAccess = await isSecretar(user.uid);
        setHasAccess(secretarAccess);
        
        if (!secretarAccess) {
          navigate('/');
        }
      }
    };

    checkAccess();
  }, [user, navigate]);

  useEffect(() => {
    if (hasAccess) {
      fetchPachete();
    }
  }, [hasAccess]);

  const handleSearch = () => {
    console.log("Căutare după:", searchTerm);
    // Căutarea se face direct în frontend deoarece avem deja toate pachetele încărcate
  };

  // Filtrarea pachetelor în funcție de termenul de căutare
  const filteredPachete = pachete.filter(pachet => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (pachet.nume && pachet.nume.toLowerCase().includes(searchLower)) ||
      (pachet.facultate && pachet.facultate.toLowerCase().includes(searchLower)) ||
      (pachet.specializare && pachet.specializare.toLowerCase().includes(searchLower))
    );
  });

  // Funcție pentru a verifica și actualiza materiile
  const verificaSiActualizeazaMateriile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Verificare și actualizare automată a materiilor...');
      
      // Obținem toate materiile din baza de date
      const materiiSnapshot = await getDocs(collection(db, 'materii'));
      console.log(`Total materii: ${materiiSnapshot.size}`);
      
      // Verificăm fiecare materie
      let materiiActualizate = 0;
      for (const materieDoc of materiiSnapshot.docs) {
        const materieData = materieDoc.data();
        const materieId = materieDoc.id;
        
        // Verificăm dacă materia are deja câmpul codificat
        if (!materieData.codificat) {
          console.log(`Materia "${materieData.nume}" (${materieId}) nu are câmpul codificat.`);
          
          // Generăm un cod unic pentru materie
          const codUnic = generateUniqueId(16);
          
          // Actualizăm materia cu noul cod
          await updateDoc(doc(db, 'materii', materieId), {
            codificat: codUnic
          });
          
          console.log(`Materia "${materieData.nume}" a fost actualizată cu codul: ${codUnic}`);
          materiiActualizate++;
        } else {
          console.log(`Materia "${materieData.nume}" are deja cod: ${materieData.codificat}`);
        }
      }
      
      if (materiiActualizate > 0) {
        setSuccessMessage(`${materiiActualizate} materii au fost actualizate cu coduri unice.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSuccessMessage('Toate materiile au deja coduri unice. Nu au fost necesare actualizări.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Eroare la verificarea și actualizarea materiilor:', error);
      setError('A apărut o eroare la verificarea și actualizarea materiilor');
      setLoading(false);
    }
  };
  
  // Funcție pentru generarea unui ID unic
  const generateUniqueId = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Utility functions
  const formatDateForDateInput = (date) => {
    if (!date) return '';
    
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    
    return `${year}-${month}-${day}`;
  };
  
  const formatTimeForTimeInput = (date) => {
    if (!date) return '';
    
    const pad = (num) => String(num).padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${hours}:${minutes}`;
  };

  const fetchPachete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obține toate pachetele disponibile
      const pacheteSnapshot = await getDocs(collection(db, 'pachete'));
      
      if (pacheteSnapshot.empty) {
        setError('Nu există pachete disponibile.');
        setLoading(false);
        return;
      }
      
      // Construiește lista de pachete cu informații despre perioada de înscriere
      const pacheteData = [];
      
      for (const pachetDoc of pacheteSnapshot.docs) {
        const pachetData = { 
          id: pachetDoc.id, 
          ...pachetDoc.data() 
        };
        
        // Determină starea procesului de înscriere
        const dataStart = pachetData.dataStart ? new Date(pachetData.dataStart) : null;
        const dataFinal = pachetData.dataFinal ? new Date(pachetData.dataFinal) : null;
        const acum = new Date();
        
        let status = 'inactiv';
        
        // Check if allocation has been processed
        if (pachetData.procesat === true && pachetData.dataUltimaAlocare) {
          status = 'procesat';
        }
        // Otherwise, check registration period
        else if (dataStart && dataFinal) {
          if (acum < dataStart) {
            status = 'urmează';
          } else if (acum >= dataStart && acum <= dataFinal) {
            status = 'activ';
          } else {
            status = 'încheiat';
          }
        }
        
        pachetData.statusInscriere = status;
        
        pacheteData.push(pachetData);
      }
      
      // Sortează pachetele după data de final (cele încheiate primele)
      pacheteData.sort((a, b) => {
        // Prioritizează pachetele încheiate
        if (a.statusInscriere === 'încheiat' && b.statusInscriere !== 'încheiat') {
          return -1;
        }
        if (a.statusInscriere !== 'încheiat' && b.statusInscriere === 'încheiat') {
          return 1;
        }
        
        // Apoi sortează după data de final
        const dataFinalA = a.dataFinal ? new Date(a.dataFinal) : new Date(0);
        const dataFinalB = b.dataFinal ? new Date(b.dataFinal) : new Date(0);
        return dataFinalA - dataFinalB;
      });
      
      setPachete(pacheteData);
      setLoading(false);
    } catch (error) {
      console.error('Eroare la încărcarea pachetelor:', error);
      setError('A apărut o eroare la încărcarea pachetelor');
      setLoading(false);
    }
  };

  const handleSelectPachet = (pachet) => {
    setSelectedPachet(pachet.id);
    setSelectedPachetData(pachet);
    console.log("Pachet selectat:", pachet);
  };

  const handleAlocareAutomata = async () => {
    try {
      setProcessingPachet(selectedPachet);
      setRezultateAlocare(null);
      setError(null);
      
      // 1. Obține toate materiile din pachet
      const pachetDoc = await getDoc(doc(db, 'pachete', selectedPachet));
      if (!pachetDoc.exists()) {
        throw new Error('Pachetul selectat nu există');
      }
      
      const pachetData = pachetDoc.data();
      const materii = pachetData.materii || [];
      
      // Verifică dacă există materii în pachet
      if (materii.length === 0) {
        throw new Error('Pachetul nu conține materii');
      }
      
      console.log('=== ÎNCEPE PROCESUL DE ALOCARE AUTOMATĂ ===');
      console.log(`Pachet: ${pachetData.nume}`);
      console.log(`Materii în pachet: ${materii.length}`);
      console.log('Lista materiilor:', materii.map(m => `${m.nume} (ID: ${m.id})`));
      
      // Adaugă câmpul locuriRamase pentru fiecare materie (în cazul în care nu există)
      materii.forEach(materie => {
        materie.locuriRamase = materie.locuriDisponibile || 0;
        materie.studentiInscrisi = materie.studentiInscrisi || [];
        console.log(`Materia: ${materie.nume}, Locuri disponibile: ${materie.locuriRamase}`);
      });
      
      // 2. Obține toți studenții care au preferințe pentru acest pachet
      console.log('Obținere studenți cu preferințe pentru pachetul:', selectedPachet);
      
      // Mai întâi să vedem ce utilizatori avem în baza de date
      console.log('=== DEBUGGING: Verificăm toți utilizatorii ===');
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`Total utilizatori în baza de date: ${allUsersSnapshot.size}`);
      
      // Să vedem ce roluri există
      const rolesSummary = {};
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        const role = userData.role || 'undefined';
        rolesSummary[role] = (rolesSummary[role] || 0) + 1;
      });
      console.log('Roluri utilizatori găsite:', rolesSummary);
      
      // Să vedem primii 5 utilizatori pentru a înțelege structura
      console.log('Primii 5 utilizatori:');
      allUsersSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const userData = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}, Role: ${userData.role}, Nume: ${userData.nume} ${userData.prenume}`);
      });
      
      // Acum să căutăm studenții
      console.log('\n=== CĂUTARE STUDENȚI ===');
      const usersSnapshot1 = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'student'))
      );
      
      // Dacă nu găsim studenți cu role='student', să încercăm fără filtru de rol
      let studentsSnapshot = usersSnapshot1;
      if (usersSnapshot1.size === 0) {
        console.log('Nu s-au găsit utilizatori cu role="student", încercăm să găsim studenți în alt mod...');
        
        // Încercăm să găsim utilizatori care au preferințe (indiferent de rol)
        studentsSnapshot = await getDocs(collection(db, 'users'));
        console.log(`Verificăm toți ${studentsSnapshot.size} utilizatori pentru preferințe...`);
      }
      
      // Creează o listă de studenți care au preferințe pentru acest pachet
      const studenti = [];
      
      console.log(`Număr total de utilizatori de verificat: ${studentsSnapshot.size}`);
      
      // Verifică diverse formate de stocare a preferințelor
      studentsSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        console.log(`Verificare student: ${userData.nume} ${userData.prenume} ${userData.medieGenerala} (${userDoc.id})`);
        
        let preferinteGasite = false;
        let preferinteLista = [];
        
        // Verifică formatul principal: preferinteMateriiOptionale[pachetId]
        if (userData.preferinteMateriiOptionale && 
            userData.preferinteMateriiOptionale[selectedPachet] && 
            Array.isArray(userData.preferinteMateriiOptionale[selectedPachet]) &&
            userData.preferinteMateriiOptionale[selectedPachet].length > 0) {
          
          preferinteLista = [...userData.preferinteMateriiOptionale[selectedPachet]];
          preferinteGasite = true;
          console.log(`- Are preferințe în preferinteMateriiOptionale[${selectedPachet}]:`, preferinteLista);
        }
        // Verifică formatul alternativ: preferințe ca array direct
        else if (userData.preferinte && Array.isArray(userData.preferinte) && userData.preferinte.length > 0) {
          preferinteLista = [...userData.preferinte];
          preferinteGasite = true;
          console.log(`- Are preferințe în câmpul preferinte:`, preferinteLista);
        }
        // Verifică alt format: prefPachet și prefMaterii
        else if (userData.prefPachet === selectedPachet && 
                userData.prefMaterii && 
                Array.isArray(userData.prefMaterii) && 
                userData.prefMaterii.length > 0) {
          
          preferinteLista = [...userData.prefMaterii];
          preferinteGasite = true;
          console.log(`- Are preferințe în prefMaterii pentru pachetul ${selectedPachet}:`, preferinteLista);
        }
        // Verifică dacă există preferințe într-un obiect general
        else if (userData.preferinte && 
                typeof userData.preferinte === 'object' && 
                userData.preferinte[selectedPachet] && 
                Array.isArray(userData.preferinte[selectedPachet]) && 
                userData.preferinte[selectedPachet].length > 0) {
          
          preferinteLista = [...userData.preferinte[selectedPachet]];
          preferinteGasite = true;
          console.log(`- Are preferințe în preferinte[${selectedPachet}]:`, preferinteLista);
        }
        else {
          console.log(`- Nu are preferințe pentru acest pachet`);
        }
        
        // Dacă studentul are preferințe, îl adăugăm la lista
        if (preferinteGasite) {
          // Obține media relevantă în funcție de anul academic
          let media = 0;
          const anStudiu = userData.an;
          
          if (anStudiu === 'II') {
            // Pentru studenții din anul II, folosim media din anul I
            media = userData.medieAnulI || 0;
            console.log(`Student anul II - folosim medieAnulI: ${media}`);
          } else if (anStudiu === 'III') {
            // Pentru studenții din anul III, folosim media din anul II
            media = userData.medieAnulII || 0;
            console.log(`Student anul III - folosim medieAnulII: ${media}`);
          } else {
            // Pentru alte cazuri, încercăm să folosim media generală sau media din userData
            media = userData.medieGenerala || userData.media || 0;
            console.log(`Student anul ${anStudiu || 'necunoscut'} - folosim media generală: ${media}`);
          }
          
          studenti.push({
            id: userDoc.id,
            nume: userData.nume || '',
            prenume: userData.prenume || '',
            numarMatricol: userData.numarMatricol || '',
            email: userData.email || '',
            media: media,
            anStudiu: anStudiu,
            medieAnulI: userData.medieAnulI,
            medieAnulII: userData.medieAnulII,
            medieGenerala: userData.medieGenerala,
            preferinte: preferinteLista
          });
          
          console.log(`Student adăugat: ${userData.nume} ${userData.prenume}, An: ${anStudiu}, Media folosită: ${media}, Preferințe: ${preferinteLista.length}`);
        }
      });
      
      console.log(`Studenți cu preferințe: ${studenti.length}`);
      if (studenti.length === 0) {
        // Încercăm să afișăm mai multe detalii despre problemă în loc să aruncăm o eroare
        console.error('Nu s-au găsit studenți cu preferințe pentru acest pachet.');
        console.error('ID pachet verificat:', selectedPachet);
        
        // Verificăm dacă există alte pachete cu preferințe
        const prefPachete = new Set();
        const studentiCuPreferinte = [];
        studentsSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.preferinteMateriiOptionale) {
            Object.keys(userData.preferinteMateriiOptionale).forEach(pachetId => {
              prefPachete.add(pachetId);
            });
            studentiCuPreferinte.push({
              nume: userData.nume,
              prenume: userData.prenume,
              preferinte: userData.preferinteMateriiOptionale
            });
          }
        });
        
        console.error('Pachete cu preferințe găsite:', Array.from(prefPachete));
        console.error('Primii 3 studenți cu preferințe:', studentiCuPreferinte.slice(0, 3));
        
        // Aruncăm o eroare cu mai multe detalii
        throw new Error(`Nu s-au găsit studenți cu preferințe pentru pachetul ${selectedPachet}. Pachete cu preferințe găsite: ${Array.from(prefPachete).join(', ')}`);
      }
      
      // Procesează alocarea automată
      await processAllocation(materii, studenti);
      
      // Actualizează datele pachetului selectat
      const pachetDocActualizat = await getDoc(doc(db, 'pachete', selectedPachet));
      if (pachetDocActualizat.exists()) {
        setSelectedPachetData(pachetDocActualizat.data());
      }
      
      console.log('=== PROCES DE ALOCARE FINALIZAT CU SUCCES ===');
    } catch (error) {
      console.error('Eroare la procesarea alocării automate:', error);
      setError('A apărut o eroare la procesarea alocării automate: ' + error.message);
      
      // Adaugă mai multe detalii despre eroare
      console.error('Detalii suplimentare despre eroare:');
      console.error('Pachet ID:', selectedPachet);
      console.error('Pachet Data:', selectedPachetData);
    } finally {
      setProcessingPachet(null);
    }
  };

  const handleSetarePerioadaInscriere = async (pachetId) => {
    const pachet = pachete.find(p => p.id === pachetId);
    if (!pachet) return;
    
    try {
      // Setăm pachetul selectat și deschidem tabul pentru setarea perioadei
      setSelectedPachet(pachetId);
      setActiveTab('perioadaInscriere');
      
      // Formatează datele pentru inputurile de date și timp
      if (pachet.dataStart) {
        const startDate = new Date(pachet.dataStart);
        setPerioadaStartDate(formatDateForDateInput(startDate));
        setPerioadaStartTime(formatTimeForTimeInput(startDate));
      } else {
        setPerioadaStartDate('');
        setPerioadaStartTime('');
      }
      
      if (pachet.dataFinal) {
        const endDate = new Date(pachet.dataFinal);
        setPerioadaEndDate(formatDateForDateInput(endDate));
        setPerioadaEndTime(formatTimeForTimeInput(endDate));
      } else {
        setPerioadaEndDate('');
        setPerioadaEndTime('');
      }
      
      setPachetPerioadaId(pachetId);
    } catch (error) {
      console.error('Eroare la setarea perioadei de înscriere:', error);
      setError('A apărut o eroare la setarea perioadei de înscriere');
    }
  };

  const handleSavePerioadaInscriere = async () => {
    if (!pachetPerioadaId) return;
    
    try {
      // Validează datele
      if (!perioadaStartDate || !perioadaStartTime || !perioadaEndDate || !perioadaEndTime) {
        showToast('Toate câmpurile sunt obligatorii', 'error');
        return;
      }
      
      const startDate = new Date(`${perioadaStartDate}T${perioadaStartTime}`);
      const finalDate = new Date(`${perioadaEndDate}T${perioadaEndTime}`);
      
      if (isNaN(startDate.getTime()) || isNaN(finalDate.getTime())) {
        showToast('Datele introduse nu sunt valide', 'error');
        return;
      }
      
      if (startDate >= finalDate) {
        showToast('Data de început trebuie să fie înainte de data de final', 'error');
        return;
      }
      
      // Actualizăm direct documentul în Firestore
      const pachetDocRef = doc(db, 'pachete', pachetPerioadaId);
      await updateDoc(pachetDocRef, {
        dataStart: startDate.toISOString(),
        dataFinal: finalDate.toISOString()
      });
      
      // Actualizează lista de pachete
      fetchPachete();
      
      // Afișează toast de succes
      showToast('Perioada de înscriere a fost actualizată cu succes!', 'success');
      
      // Revenim la tabul de informații
      setActiveTab('info');
    } catch (error) {
      console.error('Eroare la salvarea perioadei de înscriere:', error);
      showToast('A apărut o eroare la salvarea perioadei de înscriere', 'error');
    }
  };

  const processAllocation = async (materii, studenti) => {
    try {
      // Obține informații despre anul pachetului
      const pachetDoc = await getDoc(doc(db, 'pachete', selectedPachet));
      const pachetData = pachetDoc.data();
      const anPachet = pachetData.anDeStudiu || 'I';
      
      console.log(`Pachet pentru anul de studiu: ${anPachet}`);
      console.log(`ID Pachet: ${selectedPachet}`);
      console.log('Materii în pachet:', materii.map(m => `${m.nume} (ID: ${m.id})`));
      
      // Log detailed info about the package and its courses
      console.log('\n=== INFORMAȚII PACHET ȘI MATERII ===');
      console.log('Materii disponibile în pachet:', materii.map(m => ({ id: m.id, nume: m.nume, locuriDisponibile: m.locuriDisponibile })));
      
      // Procesăm fiecare student pentru a obține media corectă și preferințele
      for (const student of studenti) {
        console.log(`\n=== PROCESARE STUDENT: ${student.nume} ${student.prenume} (ID: ${student.id}) ===`);
        console.log('Preferințe originale din query:', student.preferinte);
        
        // Obținem documentul complet al studentului pentru a avea acces la toate datele
        const userDoc = await getDoc(doc(db, 'users', student.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          console.log('Date complete student:', {
            nume: userData.nume,
            prenume: userData.prenume,
            media: userData.media,
            medieGenerala: userData.medieGenerala,
            medieAnulI: userData.medieAnulI,
            medieAnulII: userData.medieAnulII,
            an: userData.an,
            preferinteMateriiOptionale: userData.preferinteMateriiOptionale
          });
          
          // Folosim media relevantă în funcție de anul academic
          const anStudiu = userData.an || anPachet;
          let mediaFolosita = 0;
          
          if (anStudiu === 'II') {
            // Pentru studenții din anul II, folosim media din anul I
            mediaFolosita = userData.medieAnulI || 0;
            console.log(`Student anul II - folosim medieAnulI: ${mediaFolosita}`);
          } else if (anStudiu === 'III') {
            // Pentru studenții din anul III, folosim media din anul II
            mediaFolosita = userData.medieAnulII || 0;
            console.log(`Student anul III - folosim medieAnulII: ${mediaFolosita}`);
          } else {
            // Pentru alte cazuri, încercăm să folosim media generală
            mediaFolosita = userData.medieGenerala || userData.media || 0;
            console.log(`Student anul ${anStudiu} - folosim media generală: ${mediaFolosita}`);
          }
          
          student.media = mediaFolosita;
          student.anStudiu = anStudiu;
          student.medieAnulI = userData.medieAnulI;
          student.medieAnulII = userData.medieAnulII;
          student.medieGenerala = userData.medieGenerala;
          
          console.log(`Media folosită pentru alocare: ${student.media}, An studiu: ${student.anStudiu}`);
          
          // Verificăm preferințele din userData direct (nu din ce am extras în query)
          let preferinteFinale = [];
          
          if (userData.preferinteMateriiOptionale && 
              userData.preferinteMateriiOptionale[selectedPachet] && 
              Array.isArray(userData.preferinteMateriiOptionale[selectedPachet])) {
            
            const preferinteRaw = userData.preferinteMateriiOptionale[selectedPachet];
            console.log(`Preferințe raw din Firestore pentru pachetul ${selectedPachet}:`, preferinteRaw);
            
            // Verificăm dacă preferințele sunt direct ID-uri de materii din pachet
            const materiiIds = materii.map(m => m.id);
            console.log('ID-uri materii din pachet:', materiiIds);
            
            const preferinteDirecte = preferinteRaw.filter(pref => materiiIds.includes(pref));
            
            if (preferinteDirecte.length > 0) {
              preferinteFinale = preferinteDirecte;
              console.log('✅ Preferințe directe găsite:', preferinteFinale);
            } else {
              console.log('❌ Preferințele nu sunt ID-uri directe, încercăm decodificarea...');
              
              // Încercăm să decodificăm preferințele dacă sunt codificate
              const materiiSnapshot = await getDocs(collection(db, 'materii'));
              const mapareIduri = {};
              
              materiiSnapshot.forEach(doc => {
                const materieData = doc.data();
                if (materieData.codificat) {
                  mapareIduri[materieData.codificat] = doc.id;
                }
              });
              
              console.log('Mapare coduri -> ID-uri:', Object.keys(mapareIduri).slice(0, 5));
              
              for (const preferinta of preferinteRaw) {
                if (mapareIduri[preferinta] && materiiIds.includes(mapareIduri[preferinta])) {
                  preferinteFinale.push(mapareIduri[preferinta]);
                  console.log(`✅ Preferință decodificată: ${preferinta} -> ${mapareIduri[preferinta]}`);
                } else {
                  console.log(`❌ Nu s-a putut decodifica: ${preferinta}`);
                }
              }
            }
          } else {
            console.log('❌ Nu există preferințe pentru acest pachet în userData');
          }
          
          // Actualizăm preferințele studentului
          student.preferinteOriginale = [...student.preferinte];
          student.preferinte = preferinteFinale;
          console.log(`Preferințe finale pentru alocare: ${preferinteFinale.length} preferințe - ${preferinteFinale}`);
        } else {
          console.log(`❌ Nu s-a găsit documentul pentru studentul ${student.id}`);
          student.media = student.media || 0;
          student.anStudiu = anPachet;
        }
      }

      // Sortăm studenții după media generală (descrescător)
      studenti.sort((a, b) => b.media - a.media);
      console.log('Studenți sortați după media generală:', studenti.map(s => `${s.nume} ${s.prenume} (Media: ${s.media})`));
      
      // Verificăm dacă avem medii valide
      const studentiCuMedii = studenti.filter(s => s.media > 0);
      console.log(`Studenți cu medii valide: ${studentiCuMedii.length}/${studenti.length}`);
      if (studentiCuMedii.length > 0) {
        const mediaMaxima = Math.max(...studentiCuMedii.map(s => s.media));
        const mediaMinima = Math.min(...studentiCuMedii.map(s => s.media));
        console.log(`Interval medii: ${mediaMinima.toFixed(2)} - ${mediaMaxima.toFixed(2)}`);
      }
      
      // Verificăm dacă avem studenți cu preferințe valide
      const studentiCuPreferinteValide = studenti.filter(s => s.preferinte && s.preferinte.length > 0);
      console.log(`Studenți cu preferințe valide: ${studentiCuPreferinteValide.length}/${studenti.length}`);
      
      if (studentiCuPreferinteValide.length === 0) {
        console.warn('AVERTISMENT: Niciun student nu are preferințe valide!');
        console.warn('Verificați dacă studenții au setat preferințe pentru acest pachet.');
      }
      
      // Inițializăm materiile cu locurile disponibile și resetăm listele de studenți înscriși
      for (const materie of materii) {
        materie.locuriRamase = materie.locuriDisponibile || 0;
        materie.studentiInscrisi = [];
        console.log(`Materia ${materie.nume}: ${materie.locuriRamase} locuri disponibile`);
      }
      
      // Alocăm studenții la materii, în ordinea mediilor și conform preferințelor lor
      const studentiAlocati = [];
      const studentiNealocati = [];
      const statisticiPreferinte = {};
      
      // Inițializăm statisticile pentru fiecare materie
      for (const materie of materii) {
        statisticiPreferinte[materie.id] = {
          nume: materie.nume || '',
          preferinta1: 0,
          preferinta2: 0,
          preferinta3: 0,
          preferinta4: 0,
          preferinta5: 0,
          altaPreferinta: 0
        };
      }
      
      console.log('\n=== ÎNCEPE ALOCAREA STUDENȚILOR ===');
      console.log(`Total studenți pentru alocare: ${studenti.length}`);
      console.log(`Total materii disponibile: ${materii.length}`);
      
      // Parcurgem studenții în ordinea mediilor (de la cea mai mare la cea mai mică)
      for (let studentIndex = 0; studentIndex < studenti.length; studentIndex++) {
        const student = studenti[studentIndex];
        
        console.log(`\n=== STUDENT ${studentIndex + 1}/${studenti.length}: ${student.nume} ${student.prenume} ===`);
        console.log(`ID: ${student.id}, Media: ${student.media}`);
        
        // Sărim peste studenții fără preferințe valide
        if (!student.preferinte || student.preferinte.length === 0) {
          console.log(`❌ Studentul nu are preferințe valide - omis din alocare`);
          studentiNealocati.push({
            ...student,
            motivNealocare: 'Preferințe invalide sau lipsa de preferințe'
          });
          continue;
        }
        
        console.log(`Preferințe (${student.preferinte.length}):`, student.preferinte.map((p, i) => {
          const materie = materii.find(m => m.id === p);
          return `#${i+1}: ${materie?.nume || 'NECUNOSCUTĂ'} (ID: ${p})`;
        }));
        
        let alocat = false;
        
        // Parcurgem preferințele studentului în ordine (prima preferință, apoi a doua, etc.)
        for (let prefIndex = 0; prefIndex < student.preferinte.length; prefIndex++) {
          const materieId = student.preferinte[prefIndex];
          
          console.log(`\n  Verificare preferința #${prefIndex + 1}: ID ${materieId}`);
          
          // Găsim materia în lista noastră
          const materieIndex = materii.findIndex(m => m.id === materieId);
          
          if (materieIndex !== -1) {
            const materie = materii[materieIndex];
            console.log(`  📚 Materie găsită: ${materie.nume}`);
            console.log(`  📊 Locuri rămase: ${materie.locuriRamase}/${materie.locuriDisponibile || 0}`);
            console.log(`  👥 Studenți înscriși: ${materie.studentiInscrisi.length}`);
            
            if (materie.locuriRamase > 0) {
              // Am găsit un loc disponibil la o materie preferată
              console.log(`  ✅ LOC DISPONIBIL! Alocăm studentul...`);
              
              materie.locuriRamase--;
              
              // Adăugăm studentul la lista de înscriși la materie
              const studentInscris = {
                id: student.id,
                nume: student.nume,
                prenume: student.prenume, 
                numarMatricol: student.numarMatricol,
                media: student.media,
                anStudiu: student.anStudiu || anPachet
              };
              materie.studentiInscrisi.push(studentInscris);
              
              // Determinăm poziția preferinței (1-based)
              const pozitiePrioritate = prefIndex + 1;
              
              // Actualizăm statisticile
              if (pozitiePrioritate <= 5) {
                statisticiPreferinte[materieId][`preferinta${pozitiePrioritate}`]++;
              } else {
                statisticiPreferinte[materieId].altaPreferinta++;
              }
              
              // Adăugăm la lista de studenți alocați
              const studentAlocat = {
                id: student.id,
                nume: student.nume,
                prenume: student.prenume,
                media: student.media,
                anStudiu: student.anStudiu || anPachet,
                numarMatricol: student.numarMatricol,
                materieAlocata: materieId,
                numeMaterieAlocata: materie.nume,
                pozitiePrioritate: pozitiePrioritate,
                preferintaOriginala: student.preferinteOriginale ? student.preferinteOriginale[prefIndex] : materieId
              };
              studentiAlocati.push(studentAlocat);
              
              console.log(`  🎉 SUCCES! Student alocat la ${materie.nume} (preferința #${pozitiePrioritate})`);
              console.log(`  📈 Locuri rămase după alocare: ${materie.locuriRamase}`);
              console.log(`  👥 Total studenți înscriși la materie: ${materie.studentiInscrisi.length}`);
              
              alocat = true;
              break; // Trecem la următorul student
            } else {
              console.log(`  ❌ Materia ${materie.nume} PLINĂ (0 locuri rămase)`);
            }
          } else {
            console.log(`  ⚠️ EROARE: Materia cu ID ${materieId} NU EXISTĂ în pachet`);
            console.log(`  📋 ID-uri materii disponibile:`, materii.map(m => m.id));
          }
        }
        
        if (!alocat) {
          console.log(`  ❌ STUDENT NEALOCAT: ${student.nume} ${student.prenume}`);
          console.log(`  📝 Motiv: Toate materiile preferate sunt pline sau nu există`);
          
          // Studentul nu a putut fi alocat la nicio materie din lista sa de preferințe
          studentiNealocati.push({
            id: student.id,
            nume: student.nume,
            prenume: student.prenume,
            media: student.media,
            anStudiu: student.anStudiu || anPachet,
            numarMatricol: student.numarMatricol || student.id,
            preferinte: student.preferinte,
            motivNealocare: 'Toate materiile preferate sunt pline'
          });
        }
      }
      
      console.log('\n=== REZULTATE ALOCARE ===');
      console.log(`Studenți alocați: ${studentiAlocati.length}`);
      console.log(`Studenți nealocați: ${studentiNealocati.length}`);
      
      // Afișăm rezultatele detaliate
      if (studentiAlocati.length > 0) {
        console.log('\n🎉 STUDENȚI ALOCAȚI:');
        studentiAlocati.forEach((student, index) => {
          console.log(`${index + 1}. ${student.nume} ${student.prenume} -> ${student.numeMaterieAlocata} (preferința #${student.pozitiePrioritate})`);
        });
      } else {
        console.log('\n❌ NICIUN STUDENT ALOCAT!');
      }
      
      if (studentiNealocati.length > 0) {
        console.log('\n❌ STUDENȚI NEALOCAȚI:');
        studentiNealocati.forEach((student, index) => {
          console.log(`${index + 1}. ${student.nume} ${student.prenume} - ${student.motivNealocare}`);
        });
      }
      
      // Verificăm starea finală a materiilor
      console.log('\n📊 STARE FINALĂ MATERII:');
      materii.forEach(materie => {
        console.log(`${materie.nume}: ${materie.studentiInscrisi.length}/${materie.locuriDisponibile || 0} ocupate, ${materie.locuriRamase} libere`);
      });
      
      // Afișăm statisticile de alocare pe preferințe
      console.log('\n=== STATISTICI ALOCARE PE PREFERINȚE ===');
      for (const [materieId, stats] of Object.entries(statisticiPreferinte)) {
        const total = 
          (stats.preferinta1 || 0) + 
          (stats.preferinta2 || 0) + 
          (stats.preferinta3 || 0) + 
          (stats.preferinta4 || 0) + 
          (stats.preferinta5 || 0) + 
          (stats.altaPreferinta || 0);
        
        console.log(`${stats.nume}: Total ${total} studenți alocați (Pref#1: ${stats.preferinta1}, Pref#2: ${stats.preferinta2}, Pref#3: ${stats.preferinta3}, Pref#4: ${stats.preferinta4}, Pref#5: ${stats.preferinta5}, Altă pref: ${stats.altaPreferinta})`);
      }
      
      // 5. Salvăm rezultatele în Firestore
      console.log('\n=== SALVARE REZULTATE ÎN BAZA DE DATE ===');
      // Actualizăm pachetul cu materiile actualizate și listele de studenți
      console.log(`Actualizare pachet ${selectedPachet} cu rezultatele alocării...`);
      try {
        await updateDoc(doc(db, 'pachete', selectedPachet), {
          materii: materii,
          procesat: true,
          dataUltimaAlocare: new Date().toISOString(),
          studentiAlocati: studentiAlocati.length,
          studentiNealocati: studentiNealocati.length,
          totalMaterii: materii.length,
          statisticiPreferinte: statisticiPreferinte
        });
        console.log('✅ Pachet actualizat cu succes cu rezultatele alocării');
      } catch (error) {
        console.error('❌ Eroare la actualizarea pachetului:', error);
        throw new Error(`Eroare la actualizarea pachetului: ${error.message}`);
      }
      
      // Actualizăm și documentele individuale ale materiilor
      for (const materie of materii) {
        const materieRef = doc(db, 'materii', materie.id);
        await updateDoc(materieRef, {
          studentiInscrisi: materie.studentiInscrisi
        });
      }
      
      // Actualizăm documentele utilizatorilor cu informații despre alocarea materiei
      let procesatiCount = 0;
      const totalStudenti = studentiAlocati.length + studentiNealocati.length;
      
      // Procesăm studenții alocați
      for (const student of studentiAlocati) {
        if (!student.id.startsWith('student')) { // Evităm actualizarea studenților de test
          console.log(`Actualizare student alocat: ${student.nume} ${student.prenume} (ID: ${student.id})`);
          console.log(`- Materie alocată: ${student.numeMaterieAlocata} (ID: ${student.materieAlocata})`);
          
          // Obținem documentul utilizatorului pentru a verifica array-ul materiiInscrise actual
          const userDoc = await getDoc(doc(db, 'users', student.id));
          const userData = userDoc.data();
          
          // Verificăm dacă utilizatorul are deja array-ul materiiInscrise
          let materiiInscrise = userData.materiiInscrise || [];
          
          // Verificăm dacă materia nu este deja în array
          if (!materiiInscrise.includes(student.materieAlocata)) {
            // Adăugăm noua materie la array-ul materiiInscrise
            materiiInscrise.push(student.materieAlocata);
            console.log(`- Adăugat materia ${student.materieAlocata} la materiiInscrise`);
          }
          
          // Actualizăm preferințele studentului cu ID-urile reale, păstrând ordinea preferințelor
          // aceasta este important pentru a putea reface alocarea corect ulterior
          if (userData.preferinteMateriiOptionale && userData.preferinteMateriiOptionale[selectedPachet]) {
            console.log(`- Actualizăm preferințele materiilor pentru pachetul ${selectedPachet}`);
            console.log(`  Preferințe originale: ${userData.preferinteMateriiOptionale[selectedPachet].join(', ')}`);
            if (student.preferinte && Array.isArray(student.preferinte)) {
              console.log(`  Preferințe decodificate: ${student.preferinte.join(', ')}`);
            } else {
              console.log(`  Preferințe decodificate: Nu sunt disponibile`);
            }
          }
          
          // Actualizăm profilul utilizatorului
          await updateDoc(doc(db, 'users', student.id), {
            materiiInscrise: materiiInscrise,
            pachetAlocat: selectedPachet,
            statusAlocare: 'alocat'
          });
          
          // Adăugăm materia în istoricul academic existent al studentului
          console.log(`📚 Adding allocated course to existing academic history for student: ${student.nume} ${student.prenume}`);
          
          // Obținem sau creăm istoricul academic al studentului
          const istoricStudentRef = doc(db, 'istoricAcademic', student.id);
          const istoricStudentDoc = await getDoc(istoricStudentRef);
          
          let istoricStudentData;
          if (istoricStudentDoc.exists()) {
            istoricStudentData = istoricStudentDoc.data();
          } else {
            // Creează un istoric gol dacă nu există
            istoricStudentData = {
              studentId: student.id,
              nume: student.nume || '',
              prenume: student.prenume || '',
              specializare: pachete.find(p => p.id === selectedPachet)?.specializare || '',
              facultate: pachete.find(p => p.id === selectedPachet)?.facultate || '',
              istoricAnual: []
            };
          }
          
          // Căutăm materia pentru a obține informații suplimentare
          let materieInfo = materii.find(m => m.id === student.materieAlocata);
          const anStudiu = materieInfo?.an || 'I';
          const semestruMaterie = materieInfo?.semestru || 1;
          const credite = materieInfo?.credite || 0;
          
          // Creează nota pentru materie
          const newNote = {
            id: student.materieAlocata,
            nume: student.numeMaterieAlocata,
            credite: credite,
            nota: 0, // Nota 0 - neevaluată încă
            dataNota: new Date().getTime(), // Use timestamp instead of Date object
            profesor: materieInfo?.profesor?.nume || 'Nespecificat',
            obligatorie: materieInfo?.obligatorie || false,
            status: 'neevaluat'
          };
          
          console.log(`📝 Adding course to Year ${anStudiu}, Semester ${semestruMaterie}: ${student.numeMaterieAlocata}`);
          
          // Verifică dacă există deja un istoric pentru anul și semestrul specificat (fără anUniversitar)
          const anualIndex = istoricStudentData.istoricAnual.findIndex(
            item => item.anStudiu === anStudiu && item.semestru === parseInt(semestruMaterie)
          );
          
          if (anualIndex >= 0) {
            // Verifică dacă materia există deja în acest an/semestru
            const materieExistenta = istoricStudentData.istoricAnual[anualIndex].cursuri.some(
              curs => curs.id === student.materieAlocata
            );
            
            if (!materieExistenta) {
              // Adaugă nota la istoricul existent pentru an/semestru
              istoricStudentData.istoricAnual[anualIndex].cursuri.push(newNote);
              console.log(`✅ Added course to existing Year ${anStudiu}, Semester ${semestruMaterie} record`);
            } else {
              console.log(`ℹ️ Course already exists in Year ${anStudiu}, Semester ${semestruMaterie}`);
            }
          } else {
            // Creează un nou istoric anual (fără anUniversitar)
            const newAnualRecord = {
              anStudiu: anStudiu,
              semestru: parseInt(semestruMaterie),
              cursuri: [newNote]
            };
            
            istoricStudentData.istoricAnual.push(newAnualRecord);
            console.log(`✅ Created new record for Year ${anStudiu}, Semester ${semestruMaterie}`);
          }
          
          // Salvăm istoricul academic actualizat
          await setDoc(istoricStudentRef, istoricStudentData);
          
          // Actualizăm contorul și mesajul de progres
          procesatiCount++;
          // setSuccessMessage(`Se salvează rezultatele... ${Math.round((procesatiCount / totalStudenti) * 100)}%`);
        }
      }
      
      // Marcăm studenții nealocați
      for (const student of studentiNealocati) {
        if (!student.id.startsWith('student')) { // Evităm actualizarea studenților de test
          await updateDoc(doc(db, 'users', student.id), {
            statusAlocare: 'nealocat',
            pachetAlocat: selectedPachet
          });
          
          // Actualizăm contorul și mesajul de progres
          procesatiCount++;
          // setSuccessMessage(`Se salvează rezultatele... ${Math.round((procesatiCount / totalStudenti) * 100)}%`);
        }
      }
      
      // Pregătim rezultatul pentru afișare
      const rezultate = {
        studentiAlocati: studentiAlocati,
        studentiNealocati: studentiNealocati,
        materiiCuLocuriRamase: materii.map(m => ({
          id: m.id,
          nume: m.nume,
          locuriRamase: m.locuriRamase
        }))
      };
      
      // Afișează rezultatele alocării
      setRezultateAlocare(rezultate);
      
      // Refresh package list to show updated status
      console.log('Actualizare listă pachete după alocare...');
      await fetchPachete();
      
      // Afisează mesajul de succes
      setSuccessMessage('Alocarea automată a fost procesată cu succes!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Eroare la procesarea alocării automate:', error);
      setError('A apărut o eroare la procesarea alocării automate: ' + error.message);
    } finally {
      setProcessingPachet(null);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nespecificată';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Dată invalidă';
    
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'urmează':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'încheiat':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'procesat':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
      case 'procesat':
        return '';
      default:
        return 'Inactiv';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#034a76]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
            Secretar - Alocare Automată
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-3 text-lg">
            Gestionează procesul de alocare automată pentru studenți
          </p>
        </div>
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        
        {/* Search Input and Button */}
        <div className="flex mb-6 shadow-md rounded-lg overflow-hidden">
          <input
            type="text"
            className="flex-grow p-3 border-0 bg-white text-[#024A76] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3471B8] transition-all duration-200"
            placeholder="Caută după nume, specializare sau facultate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white px-6 py-3 hover:from-[#3471B8] hover:to-[#024A76] transition-all duration-300 font-semibold"
            onClick={handleSearch}
          >
            Caută
          </button>
        </div>
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white p-4">
              <h2 className="text-lg font-semibold drop-shadow-sm">Pachete disponibile</h2>
            </div>
            
            <div className="divide-y">
              {filteredPachete.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nu există pachete disponibile
                </div>
              ) : (
                filteredPachete.map(pachet => (
                  <div 
                    key={pachet.id} 
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      pachet.statusInscriere === 'activ' 
                        ? (selectedPachet === pachet.id 
                            ? 'bg-gradient-to-r from-[#E3AB23]/20 to-[#E3AB23]/10 border-l-4 border-[#E3AB23] hover:from-[#E3AB23]/30 hover:to-[#E3AB23]/15' 
                            : 'bg-green-50 hover:bg-gradient-to-r hover:from-green-100 hover:to-green-50')
                        : (selectedPachet === pachet.id 
                            ? 'bg-gradient-to-r from-[#024A76]/10 to-[#3471B8]/5 border-l-4 border-[#024A76] hover:from-[#024A76]/15 hover:to-[#3471B8]/10' 
                            : 'hover:bg-gray-50')
                    }`}
                    onClick={() => handleSelectPachet(pachet)}
                  >
                    <div>
                      <h3 className="font-semibold text-[#024A76] drop-shadow-sm">{pachet.nume || 'Pachet fără nume'}</h3>
                      <div className="mt-1 text-xs text-gray-500">
                        {pachet.facultate && <span className="block">Facultate: {pachet.facultate}</span>}
                        {pachet.specializare && <span className="block">Specializare: {pachet.specializare}</span>}
                        {pachet.an && <span className="block">An: {pachet.an}</span>}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <span className={`font-medium ${(() => {
                            if (!pachet.dataStart || !pachet.dataFinal) return '';
                            const now = new Date();
                            const start = new Date(pachet.dataStart);
                            const end = new Date(pachet.dataFinal);
                            return (now >= start && now <= end) ? 'text-green-600' : '';
                          })()}`}>Perioada:</span>
                        </div>
                        <div>
                          <span className={(() => {
                            if (!pachet.dataStart || !pachet.dataFinal) return '';
                            const now = new Date();
                            const start = new Date(pachet.dataStart);
                            const end = new Date(pachet.dataFinal);
                            return (now >= start && now <= end) ? 'text-green-600' : '';
                          })()}>{formatDate(pachet.dataStart)} - {formatDate(pachet.dataFinal)}</span>
                        </div>
                      </div>
                      {pachet.dataUltimaAlocare && (
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <div>
                            <span className="font-medium">Ultima alocare:</span>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">{formatDate(pachet.dataUltimaAlocare)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex space-x-2">
                      <button
                        className="text-xs bg-gradient-to-r from-[#3471B8] to-[#024A76] text-white px-3 py-1 rounded-full hover:from-[#024A76] hover:to-[#3471B8] transition-all duration-300 font-medium shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPachetData(pachet);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        Vezi detalii
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="col-span-1 lg:col-span-2">
            {!selectedPachet ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 h-full flex items-center justify-center">
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-600">Selectați un pachet din listă</h3>
                  <p className="mt-1 text-sm text-gray-500">Pentru a gestiona alocarea automată a materiilor și a vizualiza rezultatele.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold drop-shadow-sm">
                    {pachete.find(p => p.id === selectedPachet)?.nume || 'Pachet selectat'}
                  </h2>
                  
                  <button
                    onClick={() => setSelectedPachet(null)}
                    className="text-white hover:text-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      className={`py-3 px-4 text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'info'
                          ? 'border-b-4 border-[#E3AB23] text-[#024A76] bg-gradient-to-t from-[#E3AB23]/10 to-transparent'
                          : 'text-gray-500 hover:text-[#024A76] hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab('info')}
                    >
                      Informații
                    </button>
                    <button
                      className={`py-3 px-4 text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'perioadaInscriere'
                          ? 'border-b-4 border-[#E3AB23] text-[#024A76] bg-gradient-to-t from-[#E3AB23]/10 to-transparent'
                          : 'text-gray-500 hover:text-[#024A76] hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setActiveTab('perioadaInscriere');
                        if (selectedPachet) {
                          handleSetarePerioadaInscriere(selectedPachet);
                        }
                      }}
                    >
                      Setare Perioadă Înscriere
                    </button>
                  </nav>
                </div>
                
                {/* Tab content */}
                <div className="p-4">
                  {activeTab === 'info' && (
                    <div>
                      <div className="mb-6">
                        <p className="text-gray-600 mb-4">
                          Procesul de alocare automată va distribui studenții la materiile opționale în funcție de preferințele
                          acestora și de mediile lor academice. Studenții cu medii mai mari vor avea prioritate.
                        </p>
                        
                        <button
                          onClick={handleAlocareAutomata}
                          disabled={processingPachet !== null}
                          className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                            processingPachet === null 
                              ? 'bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 hover:from-[#E3AB23]/90 hover:to-[#E3AB23]/70 text-[#024A76]' 
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {processingPachet === selectedPachet ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Procesare...
                            </span>
                          ) : (
                            'Procesează alocarea automată'
                          )}
                        </button>
                      </div>
                      
                      {rezultateAlocare && (
                        <div className="mt-6 border-t pt-6">
                          <h3 className="text-lg font-semibold text-[#024A76] mb-4 drop-shadow-sm">Rezultate alocare</h3>
                          
                          {/* Sumar rapid */}
                          <div className="bg-gradient-to-r from-[#024A76]/5 to-[#3471B8]/5 p-6 rounded-lg mb-6 border border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">{rezultateAlocare.studentiAlocati.length}</div>
                                <div className="text-sm text-gray-600 font-medium">Studenți alocați</div>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
                                <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">{rezultateAlocare.studentiNealocati.length}</div>
                                <div className="text-sm text-gray-600 font-medium">Studenți nealocați</div>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#3471B8]">
                                <div className="text-2xl font-bold bg-gradient-to-r from-[#3471B8] to-[#024A76] bg-clip-text text-transparent">
                                  {rezultateAlocare.studentiAlocati.filter(s => s.pozitiePrioritate === 1).length}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Prima alegere</div>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#E3AB23]">
                                <div className="text-2xl font-bold bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 bg-clip-text text-transparent">
                                  {rezultateAlocare.studentiAlocati.length > 0 ? 
                                    (rezultateAlocare.studentiAlocati.reduce((sum, s) => sum + s.media, 0) / rezultateAlocare.studentiAlocati.length).toFixed(2) :
                                    '0.00'
                                  }
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Media pentru alocare</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-md font-semibold text-[#024A76] mb-2 drop-shadow-sm">Studenți alocați ({rezultateAlocare.studentiAlocati.length})</h4>
                              <div className="bg-green-50 p-4 rounded-md h-64 overflow-y-auto">
                                {rezultateAlocare.studentiAlocati.length === 0 ? (
                                  <p className="text-sm text-gray-500">Nu există studenți alocați</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {rezultateAlocare.studentiAlocati.map(student => (
                                      <li key={student.id} className="text-sm border-b border-green-100 pb-2">
                                        <div className="font-medium text-green-800">{student.nume} {student.prenume}</div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">Materie:</span> {student.numeMaterieAlocata}
                                        </div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">Preferința #{student.pozitiePrioritate}</span>
                                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                            student.pozitiePrioritate === 1 ? 'bg-green-200 text-green-800' :
                                            student.pozitiePrioritate === 2 ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-orange-200 text-orange-800'
                                          }`}>
                                            {student.pozitiePrioritate === 1 ? 'Prima alegere' :
                                             student.pozitiePrioritate === 2 ? 'A doua alegere' :
                                             `A ${student.pozitiePrioritate}-a alegere`}
                                          </span>
                                        </div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">An studiu:</span> {student.anStudiu || 'N/A'}
                                        </div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">
                                            {student.anStudiu === 'II' ? 'Media anul I:' :
                                             student.anStudiu === 'III' ? 'Media anul II:' :
                                             'Media generală:'}
                                          </span> 
                                          <span className={`ml-1 font-semibold ${
                                            student.media >= 9 ? 'text-green-600' :
                                            student.media >= 8 ? 'text-blue-600' :
                                            student.media >= 7 ? 'text-yellow-600' :
                                            'text-red-600'
                                          }`}>
                                            {student.media > 0 ? parseFloat(student.media).toFixed(2) : 'Nespecificată'}
                                          </span>
                                        </div>
                                        {student.numarMatricol && (
                                          <div className="text-gray-500 text-xs">
                                            Nr. matricol: {student.numarMatricol}
                                          </div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-md font-semibold text-[#024A76] mb-2 drop-shadow-sm">Studenți nealocați ({rezultateAlocare.studentiNealocati.length})</h4>
                              <div className="bg-red-50 p-4 rounded-md h-64 overflow-y-auto">
                                {rezultateAlocare.studentiNealocati.length === 0 ? (
                                  <p className="text-sm text-gray-500">Nu există studenți nealocați</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {rezultateAlocare.studentiNealocati.map(student => (
                                      <li key={student.id} className="text-sm border-b border-red-100 pb-2">
                                        <div className="font-medium text-red-800">{student.nume} {student.prenume}</div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">An studiu:</span> {student.anStudiu || 'N/A'}
                                        </div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">
                                            {student.anStudiu === 'II' ? 'Media anul I:' :
                                             student.anStudiu === 'III' ? 'Media anul II:' :
                                             'Media generală:'}
                                          </span> 
                                          <span className={`ml-1 font-semibold ${
                                            student.media >= 9 ? 'text-green-600' :
                                            student.media >= 8 ? 'text-blue-600' :
                                            student.media >= 7 ? 'text-yellow-600' :
                                            'text-red-600'
                                          }`}>
                                            {student.media > 0 ? parseFloat(student.media).toFixed(2) : 'Nespecificată'}
                                          </span>
                                        </div>
                                        <div className="text-gray-600">
                                          <span className="font-medium">Preferințe:</span> {student.preferinte ? student.preferinte.map((p, idx) => `#${idx+1}`).join(', ') : 'Nespecificate'}
                                        </div>
                                        <div className="text-red-600 text-xs mt-1">
                                          <span className="font-medium">Motiv nealocare:</span> {student.motivNealocare}
                                        </div>
                                        {student.numarMatricol && (
                                          <div className="text-gray-500 text-xs">
                                            Nr. matricol: {student.numarMatricol}
                                          </div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-md font-semibold text-[#024A76] mb-2 drop-shadow-sm">Materii cu locuri rămase ({rezultateAlocare.materiiCuLocuriRamase.length})</h4>
                            <div className="bg-blue-50 p-4 rounded-md overflow-x-auto">
                              {rezultateAlocare.materiiCuLocuriRamase.length === 0 ? (
                                <p className="text-sm text-gray-500">Nu există materii cu locuri rămase</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-blue-200">
                                    <thead>
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Materie</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Locuri rămase</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-100">
                                      {rezultateAlocare.materiiCuLocuriRamase.map(materie => (
                                        <tr key={materie.id}>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{materie.nume}</td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{materie.locuriRamase}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Adaugă statisticile de alocare pe materii și preferințe */}
                          <div className="mt-6">
                            <h4 className="text-md font-medium text-[#034a76] mb-2">Statistici alocare pe preferințe</h4>
                            <div className="bg-purple-50 p-4 rounded-md">
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-purple-200">
                                  <thead>
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Materie</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Pref. #1</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Pref. #2</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Pref. #3</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Pref. #4</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Pref. #5</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Altă pref.</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-purple-800 uppercase tracking-wider">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-purple-100">
                                    {selectedPachetData?.statisticiPreferinte ? 
                                      Object.entries(selectedPachetData.statisticiPreferinte).map(([materieId, stats]) => {
                                        const total = 
                                          (stats.preferinta1 || 0) + 
                                          (stats.preferinta2 || 0) + 
                                          (stats.preferinta3 || 0) + 
                                          (stats.preferinta4 || 0) + 
                                          (stats.preferinta5 || 0) + 
                                          (stats.altaPreferinta || 0);
                                        
                                        return (
                                          <tr key={materieId}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{stats.nume}</td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-600">{stats.preferinta1 || 0}</td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-600">{stats.preferinta2 || 0}</td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-600">{stats.preferinta3 || 0}</td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-600">{stats.preferinta4 || 0}</td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-600">{stats.preferinta5 || 0}</td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-600">{stats.altaPreferinta || 0}</td>
                                            <td className="px-3 py-2 text-center text-sm font-medium text-purple-800">{total}</td>
                                          </tr>
                                        );
                                      })
                                    : (
                                      <tr>
                                        <td colSpan="8" className="px-3 py-4 text-center text-sm text-gray-500">
                                          Nu există statistici disponibile. Procesați alocarea pentru a genera statistici.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-4 text-sm text-gray-600">
                                <p><strong>Legendă:</strong></p>
                                <p><span className="font-medium">Pref. #N</span> - Numărul de studenți pentru care materia a fost a N-a opțiune din preferințe</p>
                                <p><span className="font-medium">Total</span> - Numărul total de studenți alocați la materie</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'perioadaInscriere' && (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">
                        Setați perioada de înscriere pentru pachetul de materii. În această perioadă, studenții vor putea 
                        să își exprime preferințele pentru materiile opționale disponibile.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de început</label>
                          <input 
                            type="date" 
                            value={perioadaStartDate} 
                            onChange={(e) => setPerioadaStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ora de început</label>
                          <input 
                            type="time" 
                            value={perioadaStartTime} 
                            onChange={(e) => setPerioadaStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de final</label>
                          <input 
                            type="date" 
                            value={perioadaEndDate} 
                            onChange={(e) => setPerioadaEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ora de final</label>
                          <input 
                            type="time" 
                            value={perioadaEndTime} 
                            onChange={(e) => setPerioadaEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleSavePerioadaInscriere}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Salvează perioada
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalii pentru pachetul selectat */}
      {isDetailsModalOpen && selectedPachetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detalii Pachet: {selectedPachetData.nume}</h2>
            <div className="mb-4">
              <p><strong>Facultate:</strong> {selectedPachetData.facultate}</p>
              <p><strong>Specializare:</strong> {selectedPachetData.specializare}</p>
              <p><strong>An:</strong> {selectedPachetData.an}</p>
              <p><strong>Semestru:</strong> {selectedPachetData.semestru}</p>
              <p><strong>Status înscriere:</strong> <span className={`px-2 py-1 text-xs rounded border ${getStatusClass(selectedPachetData.statusInscriere)}`}>{getStatusText(selectedPachetData.statusInscriere)}</span></p>
              <p><strong>Perioada de înscriere:</strong> {formatDate(selectedPachetData.dataStart)} - {formatDate(selectedPachetData.dataFinal)}</p>
            </div>
            
            {selectedPachetData.materii && selectedPachetData.materii.length > 0 ? (
              <div className="mb-4">
                <h3 className="font-bold mb-2">Materii disponibile:</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nume</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locuri Disponibile</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studenți Înscriși</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPachetData.materii.map((materie, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{materie.nume}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{materie.profesor?.nume || 'Nespecificat'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{materie.locuriDisponibile || 0}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {materie.studentiInscrisi ? materie.studentiInscrisi.length : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mb-4 text-gray-500">
                Acest pachet nu conține materii.
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretarAlocareAutomataPage; 