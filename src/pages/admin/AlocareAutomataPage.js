import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AlocareAutomataPage = () => {
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
  const [activeTab, setActiveTab] = useState('info'); // 'info' sau 'perioadaInscriere'
  const [pachetPerioadaId, setPachetPerioadaId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPachete();
  }, [user]);

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
        if (dataStart && dataFinal) {
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
      
      // Verificăm întâi metoda 1: studenți care au preferinteMateriiOptionale direct
      const usersSnapshot1 = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'student'))
      );
      
      // Creează o listă de studenți care au preferințe pentru acest pachet
      const studenti = [];
      
      console.log(`Număr total de studenți: ${usersSnapshot1.size}`);
      
      // Verifică diverse formate de stocare a preferințelor
      usersSnapshot1.forEach((userDoc) => {
        const userData = userDoc.data();
        console.log(`Verificare student: ${userData.nume} ${userData.prenume} (${userDoc.id})`);
        
        let preferinteGasite = false;
        let preferinteLista = [];
        
        // Verifică formatul principal: preferinteMateriiOptionale[pachetId]
        if (userData.preferinteMateriiOptionale && 
            userData.preferinteMateriiOptionale[selectedPachet] && 
            userData.preferinteMateriiOptionale[selectedPachet].length > 0) {
          
          preferinteLista = userData.preferinteMateriiOptionale[selectedPachet];
          preferinteGasite = true;
          console.log(`- Are preferințe în preferinteMateriiOptionale[${selectedPachet}]:`, preferinteLista);
        }
        // Verifică formatul alternativ: preferințe ca array direct
        else if (userData.preferinte && Array.isArray(userData.preferinte) && userData.preferinte.length > 0) {
          preferinteLista = userData.preferinte;
          preferinteGasite = true;
          console.log(`- Are preferințe în câmpul preferinte:`, preferinteLista);
        }
        // Verifică alt format: prefPachet și prefMaterii
        else if (userData.prefPachet === selectedPachet && 
                userData.prefMaterii && 
                Array.isArray(userData.prefMaterii) && 
                userData.prefMaterii.length > 0) {
          
          preferinteLista = userData.prefMaterii;
          preferinteGasite = true;
          console.log(`- Are preferințe în prefMaterii pentru pachetul ${selectedPachet}:`, preferinteLista);
        }
        // Verifică dacă există preferințe într-un obiect general
        else if (userData.preferinte && 
                typeof userData.preferinte === 'object' && 
                userData.preferinte[selectedPachet] && 
                Array.isArray(userData.preferinte[selectedPachet]) && 
                userData.preferinte[selectedPachet].length > 0) {
          
          preferinteLista = userData.preferinte[selectedPachet];
          preferinteGasite = true;
          console.log(`- Are preferințe în preferinte[${selectedPachet}]:`, preferinteLista);
        }
        else {
          console.log(`- Nu are preferințe pentru acest pachet`);
        }
        
        // Dacă studentul are preferințe, îl adăugăm la lista
        if (preferinteGasite) {
          // Obține media studentului
          const media = userData.media || 0;
          
          studenti.push({
            id: userDoc.id,
            nume: userData.nume || '',
            prenume: userData.prenume || '',
            numarMatricol: userData.numarMatricol || '',
            email: userData.email || '',
            media: media,
            preferinte: preferinteLista
          });
        }
      });
      
      console.log(`Studenți cu preferințe: ${studenti.length}`);
      if (studenti.length === 0) {
        // Încercăm să afișăm mai multe detalii despre problemă în loc să aruncăm o eroare
        console.error('Nu s-au găsit studenți cu preferințe pentru acest pachet.');
        console.error('ID pachet verificat:', selectedPachet);
        
        // Verificăm dacă există alte pachete cu preferințe
        const prefPachete = new Set();
        usersSnapshot1.forEach(doc => {
          const userData = doc.data();
          if (userData.preferinteMateriiOptionale) {
            Object.keys(userData.preferinteMateriiOptionale).forEach(pachetId => {
              prefPachete.add(pachetId);
            });
          }
        });
        
        console.error('Pachete cu preferințe găsite:', Array.from(prefPachete));
        
        // Continuăm cu o listă goală în loc să aruncăm o eroare
        console.warn('Continuăm procesul de alocare cu o listă goală de studenți');
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
        setError('Toate câmpurile sunt obligatorii');
        return;
      }
      
      const startDate = new Date(`${perioadaStartDate}T${perioadaStartTime}`);
      const finalDate = new Date(`${perioadaEndDate}T${perioadaEndTime}`);
      
      if (isNaN(startDate.getTime()) || isNaN(finalDate.getTime())) {
        setError('Datele introduse nu sunt valide');
        return;
      }
      
      if (startDate >= finalDate) {
        setError('Data de început trebuie să fie înainte de data de final');
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
      
      // Afisează mesajul de succes pentru 3 secunde
      setSuccessMessage('Perioada de înscriere a fost actualizată cu succes!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Revenim la tabul de informații
      setActiveTab('info');
    } catch (error) {
      console.error('Eroare la salvarea perioadei de înscriere:', error);
      setError('A apărut o eroare la salvarea perioadei de înscriere');
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
      
      // Obținem maparea dintre ID-urile materiilor codificate și cele reale
      // Preluăm toate documentele de materii pentru a găsi maparea corectă
      console.log('Obținem toate materiile pentru mapare ID-uri...');
      const materiiSnapshot = await getDocs(collection(db, 'materii'));
      const mapareIduri = {};
      
      materiiSnapshot.forEach(doc => {
        const materieData = doc.data();
        mapareIduri[materieData.codificat || ''] = doc.id;
        console.log(`Mapare: ${materieData.codificat || 'necunoscut'} -> ${doc.id}`);
      });
      
      console.log('Mapare ID-uri materii:', mapareIduri);
      
      // Calculăm media relevantă pentru fiecare student în funcție de anul său
      const anCurent = new Date().getFullYear();
      const anUniversitarCurent = `${anCurent}-${anCurent + 1}`;
      
      // Decodificăm preferințele materiilor pentru fiecare student
      for (const student of studenti) {
        console.log(`\nStudent: ${student.nume} ${student.prenume} (ID: ${student.id})`);
        console.log('Preferințe originale:', student.preferinte);
        
        // Convertim ID-urile codificate în ID-uri reale
        const preferinteDecodificate = [];
        for (const preferintaCodificata of student.preferinte) {
          const preferintaReala = mapareIduri[preferintaCodificata];
          if (preferintaReala) {
            preferinteDecodificate.push(preferintaReala);
            console.log(`Preferință decodificată: ${preferintaCodificata} -> ${preferintaReala}`);
          } else {
            console.log(`! Preferință necunoscută: ${preferintaCodificata} - nu poate fi mapată la o materie reală`);
          }
        }
        
        // Actualizăm preferințele studentului cu ID-urile reale
        student.preferinteOriginale = [...student.preferinte]; // Salvăm preferințele originale
        student.preferinte = preferinteDecodificate;
        console.log('Preferințe decodificate:', student.preferinte);
        
        // Determinăm anul de studiu al studentului
        const anStudent = student.anStudiu || anPachet;
        
        // Pentru studenții din anul I, folosim media din semestrul 1 al anului I
        if (anStudent === 'I') {
          // Încercăm să obținem media semestrului 1 din anul I
          const userDoc = await getDoc(doc(db, 'users', student.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            student.mediaOriginala = student.media; // Salvăm media originală
            student.media = userData.mediaSemestru1AnI || student.media;
            student.anStudiu = anStudent;
            console.log(`Student ${student.nume} ${student.prenume} în anul I - media semestrului 1: ${student.media}`);
          }
        } 
        // Pentru studenții din anii II și III, folosim media totală din anul anterior
        else {
          // Încercăm să obținem istoricul academic al studentului
          const istoricQuery = query(
            collection(db, 'istoricAcademic'),
            where('studentId', '==', student.id)
          );
          
          const istoricDocs = await getDocs(istoricQuery);
          const anAnterior = anStudent === 'II' ? 'I' : 'II';
          let mediaAnAnterior = 0;
          
          if (!istoricDocs.empty) {
            // Parcurgem toate intrările din istoricul academic
            let sumaNoteAnAnterior = 0;
            let numarNoteAnAnterior = 0;
            
            istoricDocs.forEach(doc => {
              const istoricData = doc.data();
              if (istoricData.anStudiu === anAnterior) {
                sumaNoteAnAnterior += istoricData.nota || 0;
                numarNoteAnAnterior++;
              }
            });
            
            if (numarNoteAnAnterior > 0) {
              mediaAnAnterior = sumaNoteAnAnterior / numarNoteAnAnterior;
            }
          }
          
          // Dacă am găsit o medie validă pentru anul anterior, o folosim
          if (mediaAnAnterior > 0) {
            student.mediaOriginala = student.media; // Salvăm media originală
            student.media = mediaAnAnterior;
          }
          
          student.anStudiu = anStudent;
          console.log(`Student ${student.nume} ${student.prenume} în anul ${anStudent} - media anului ${anAnterior}: ${student.media}`);
        }
      }

      // 3. Sortăm studenții după medie (descrescător)
      studenti.sort((a, b) => b.media - a.media);
      console.log('Studenți sortați după media relevantă:', studenti.map(s => `${s.nume} ${s.prenume} (An: ${s.anStudiu || anPachet}, Media: ${s.media})`));
      
      // Verificăm dacă avem studenți cu preferințe valide
      const studentiCuPreferinteValide = studenti.filter(s => s.preferinte && s.preferinte.length > 0);
      console.log(`Studenți cu preferințe valide după decodificare: ${studentiCuPreferinteValide.length}/${studenti.length}`);
      
      if (studentiCuPreferinteValide.length === 0) {
        console.warn('AVERTISMENT: După decodificare, niciun student nu are preferințe valide!');
        console.warn('Verificați dacă ID-urile materiilor din preferințele studenților corespund cu ID-urile materiilor din pachet.');
      }
      
      // 4. Alocăm studenții la materii, în ordinea mediilor și conform preferințelor lor
      const studentiAlocati = [];
      const studentiNealocati = [];
      const statisticiPreferinte = {};
      
      // Inițializăm statisticile pentru fiecare materie
      for (const materie of materii) {
        materie.studentiInscrisi = materie.studentiInscrisi || [];
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
      
      console.log('=== ÎNCEPE ALOCAREA STUDENȚILOR ===');
      
      // Parcurgem studenții în ordinea mediilor (de la cea mai mare la cea mai mică)
      for (const student of studenti) {
        // Sărim peste studenții fără preferințe valide
        if (!student.preferinte || student.preferinte.length === 0) {
          console.log(`Studentul ${student.nume} ${student.prenume} nu are preferințe valide - este omis din procesul de alocare.`);
          studentiNealocati.push({
            ...student,
            motivNealocare: 'Preferințe invalide sau lipsa de preferințe'
          });
          continue;
        }
        
        let alocat = false;
        
        console.log(`\nProcesare student: ${student.nume} ${student.prenume} (An: ${student.anStudiu || anPachet}, Media: ${student.media})`);
        console.log(`  Preferințe: ${student.preferinte.map((p, i) => {
          const materie = materii.find(m => m.id === p);
          return `#${i+1}: ${materie?.nume || p}`;
        }).join(', ')}`);
        
        // Parcurgem preferințele studentului în ordine
        for (const materieId of student.preferinte) {
          // Găsim materia în lista noastră
          const materieIndex = materii.findIndex(m => m.id === materieId);
          
          if (materieIndex !== -1) {
            console.log(`  Verificare materie: ${materii[materieIndex].nume} (Locuri rămase: ${materii[materieIndex].locuriRamase})`);
            
            if (materii[materieIndex].locuriRamase > 0) {
              // Am găsit un loc disponibil la o materie preferată
              materii[materieIndex].locuriRamase--;
              
              // Adăugăm studentul ca obiect complet, nu doar ID-ul
              materii[materieIndex].studentiInscrisi.push({
                id: student.id,
                nume: student.nume,
                prenume: student.prenume, 
                numarMatricol: student.numarMatricol,
                anStudiu: student.anStudiu || anPachet
              });
              
              // Determinăm poziția preferinței
              const pozitiePrioritate = student.preferinte.indexOf(materieId) + 1;
              
              // Actualizăm statisticile
              if (pozitiePrioritate <= 5) {
                statisticiPreferinte[materieId][`preferinta${pozitiePrioritate}`]++;
              } else {
                statisticiPreferinte[materieId].altaPreferinta++;
              }
              
              // Adăugăm la lista de studenți alocați
              studentiAlocati.push({
                id: student.id,
                nume: student.nume,
                prenume: student.prenume,
                media: student.media,
                anStudiu: student.anStudiu || anPachet,
                numarMatricol: student.numarMatricol,
                materieAlocata: materieId,
                numeMaterieAlocata: materii[materieIndex].nume,
                pozitiePrioritate: pozitiePrioritate,
                preferintaOriginala: student.preferinteOriginale[student.preferinte.indexOf(materieId)]
              });
              
              console.log(`  ✅ Student ALOCAT la materia ${materii[materieIndex].nume} (preferința #${pozitiePrioritate})`);
              
              alocat = true;
              break; // Trecem la următorul student
            } else {
              console.log(`  ❌ Materia ${materii[materieIndex].nume} nu mai are locuri disponibile`);
            }
          } else {
            console.log(`  ⚠️ Materia cu ID-ul ${materieId} nu există în pachet`);
          }
        }
        
        if (!alocat) {
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
          console.log(`  ❌ Student NEALOCAT: nicio materie preferată nu are locuri disponibile`);
        }
      }
      
      console.log('\n=== REZULTATE ALOCARE ===');
      console.log(`Studenți alocați: ${studentiAlocati.length}`);
      console.log(`Studenți nealocați: ${studentiNealocati.length}`);
      
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
      await updateDoc(doc(db, 'pachete', selectedPachet), {
        materii: materii,
        procesat: true,
        dataUltimaAlocare: new Date().toISOString(),
        studentiAlocati: studentiAlocati.length,
        studentiNealocati: studentiNealocati.length,
        totalMaterii: materii.length,
        statisticiPreferinte: statisticiPreferinte
      });
      
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
            console.log(`  Preferințe decodificate: ${student.preferinte.join(', ')}`);
          }
          
          // Actualizăm profilul utilizatorului
          await updateDoc(doc(db, 'users', student.id), {
            materiiInscrise: materiiInscrise,
            pachetAlocat: selectedPachet,
            statusAlocare: 'alocat'
          });
          
          // Adăugăm materia în istoricul academic al studentului
          const dataAlocare = new Date().toISOString();
          const anUniversitar = new Date().getFullYear() + "-" + (new Date().getFullYear() + 1);
          const semestru = new Date().getMonth() < 8 ? 2 : 1; // Înainte de septembrie este semestrul 2, altfel 1
          
          // Verificăm dacă există deja o intrare în istoricAcademic pentru acest student
          const istoricQuery = query(
            collection(db, 'istoricAcademic'),
            where('studentId', '==', student.id),
            where('materieId', '==', student.materieAlocata)
          );
          
          const istoricDocs = await getDocs(istoricQuery);
          
          // Pregătim datele pentru istoricul academic
          const istoricData = {
            studentId: student.id,
            numeStudent: student.nume,
            prenumeStudent: student.prenume,
            mediaStudent: student.media,
            materieId: student.materieAlocata,
            numeMaterie: student.numeMaterieAlocata,
            pachetId: selectedPachet,
            dataAlocare: dataAlocare,
            anUniversitar: anUniversitar,
            semestru: semestru,
            metodaAlocare: 'automata',
            statusInscriere: 'activ',
            pozitiePreferinta: student.pozitiePrioritate
          };
          
          if (istoricDocs.empty) {
            // Dacă nu există, creăm o nouă intrare
            await addDoc(collection(db, 'istoricAcademic'), istoricData);
          } else {
            // Dacă există, actualizăm intrarea existentă
            await updateDoc(doc(db, 'istoricAcademic', istoricDocs.docs[0].id), istoricData);
          }
          
          // Adăugăm și în structura corectă a istoricului academic (documentul cu ID-ul studentului)
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
          const semestruMaterie = materieInfo?.semestru || semestru;
          const credite = materieInfo?.credite || 0;
          
          // Creează nota pentru materie
          const newNote = {
            id: student.materieAlocata,
            nume: student.numeMaterieAlocata,
            credite: credite,
            nota: 0, // Nota 0 - neevaluată încă
            dataNota: new Date(),
            profesor: materieInfo?.profesor?.nume || 'Nespecificat',
            obligatorie: materieInfo?.obligatorie || false,
            status: 'neevaluat'
          };
          
          // Verifică dacă există deja un istoric pentru anul și semestrul specificat
          const anualIndex = istoricStudentData.istoricAnual.findIndex(
            item => item.anUniversitar === anUniversitar && 
                  item.anStudiu === anStudiu &&
                  item.semestru === parseInt(semestruMaterie)
          );
          
          if (anualIndex >= 0) {
            // Verifică dacă materia există deja în acest an
            const materieExistenta = istoricStudentData.istoricAnual[anualIndex].cursuri.some(
              curs => curs.id === student.materieAlocata
            );
            
            if (!materieExistenta) {
              // Adaugă nota la un istoric existent
              istoricStudentData.istoricAnual[anualIndex].cursuri.push(newNote);
            }
          } else {
            // Creează un nou istoric anual
            const newAnualRecord = {
              anUniversitar: anUniversitar,
              anStudiu: anStudiu,
              semestru: parseInt(semestruMaterie),
              cursuri: [newNote]
            };
            
            istoricStudentData.istoricAnual.push(newAnualRecord);
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

  // Funcție pentru formatarea datei pentru input de tip date
  const formatDateForDateInput = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  };
  
  // Funcție pentru formatarea orei pentru input de tip time
  const formatTimeForTimeInput = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Alocare Automată Pachete</h1>
      
      {/* Search Input and Button */}
      <div className="flex mb-4">
        <input
          type="text"
          className="flex-grow p-2 border rounded-l"
          placeholder="Caută după nume, specializare sau facultate..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded-r"
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
        <div className="col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-[#034a76] text-white p-4">
            <h2 className="text-lg font-semibold">Pachete disponibile</h2>
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
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedPachet === pachet.id ? 'bg-gray-100' : ''}`}
                  onClick={() => handleSelectPachet(pachet)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[#034a76]">{pachet.nume || 'Pachet fără nume'}</h3>
                      <div className="mt-1 text-xs text-gray-500">
                        {pachet.facultate && <span className="block">Facultate: {pachet.facultate}</span>}
                        {pachet.specializare && <span className="block">Specializare: {pachet.specializare}</span>}
                        {pachet.an && <span className="block">An: {pachet.an}</span>}
                      </div>
                    </div>
                    
                    <div 
                      className={`px-2 py-1 text-xs rounded border ${getStatusClass(pachet.statusInscriere)}`}
                    >
                      {getStatusText(pachet.statusInscriere)}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <span className="font-medium">Perioada:</span>
                      </div>
                      <div>
                        <span>{formatDate(pachet.dataStart)} - {formatDate(pachet.dataFinal)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex space-x-2">
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800"
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-[#034a76] text-white p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
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
                    className={`py-3 px-4 text-sm font-medium ${
                      activeTab === 'info'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('info')}
                  >
                    Informații
                  </button>
                  <button
                    className={`py-3 px-4 text-sm font-medium ${
                      activeTab === 'perioadaInscriere'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('perioadaInscriere')}
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
                        className={`px-4 py-2 rounded text-white ${
                          processingPachet === null ? 'bg-[#e3ab23] hover:bg-[#c49520]' : 'bg-gray-400'
                        } transition-colors`}
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
                        <h3 className="text-lg font-medium text-[#034a76] mb-4">Rezultate alocare</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-md font-medium text-[#034a76] mb-2">Studenți alocați ({rezultateAlocare.studentiAlocati.length})</h4>
                            <div className="bg-green-50 p-4 rounded-md h-64 overflow-y-auto">
                              {rezultateAlocare.studentiAlocati.length === 0 ? (
                                <p className="text-sm text-gray-500">Nu există studenți alocați</p>
                              ) : (
                                <ul className="space-y-2">
                                  {rezultateAlocare.studentiAlocati.map(student => (
                                    <li key={student.id} className="text-sm border-b border-green-100 pb-2">
                                      <div className="font-medium">{student.nume} {student.prenume}</div>
                                      <div className="text-gray-600">Materie: {student.numeMaterieAlocata}</div>
                                      <div className="text-gray-600">Poziție preferință: {student.pozitiePrioritate}</div>
                                      <div className="text-gray-600">An studiu: {student.anStudiu || 'N/A'}</div>
                                      <div className="text-gray-600">Media: {student.media.toFixed(2)}</div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-md font-medium text-[#034a76] mb-2">Studenți nealocați ({rezultateAlocare.studentiNealocati.length})</h4>
                            <div className="bg-red-50 p-4 rounded-md h-64 overflow-y-auto">
                              {rezultateAlocare.studentiNealocati.length === 0 ? (
                                <p className="text-sm text-gray-500">Nu există studenți nealocați</p>
                              ) : (
                                <ul className="space-y-2">
                                  {rezultateAlocare.studentiNealocati.map(student => (
                                    <li key={student.id} className="text-sm border-b border-red-100 pb-2">
                                      <div className="font-medium">{student.nume} {student.prenume}</div>
                                      <div className="text-gray-600">An studiu: {student.anStudiu || 'N/A'}</div>
                                      <div className="text-gray-600">Media: {student.media.toFixed(2)}</div>
                                      <div className="text-gray-600">
                                        Preferințe: {student.preferinte.map((p, idx) => `#${idx+1}`).join(', ')}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-md font-medium text-[#034a76] mb-2">Materii cu locuri rămase ({rezultateAlocare.materiiCuLocuriRamase.length})</h4>
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

export default AlocareAutomataPage; 