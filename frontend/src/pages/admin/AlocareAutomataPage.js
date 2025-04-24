import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AlocareAutomataPage = () => {
  const [pachete, setPachete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPachet, setSelectedPachet] = useState(null);
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
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPachete();
  }, [user]);

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

  const handleSelectPachet = (pachetId) => {
    setSelectedPachet(pachetId);
    setRezultateAlocare(null);
    setActiveTab('info');
    
    // Pregatește datele pentru formularul de setare perioadă
    const pachet = pachete.find(p => p.id === pachetId);
    if (pachet) {
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
    }
  };

  const handleAlocareAutomata = async () => {
    if (!selectedPachet) {
      setError('Selectați un pachet pentru a procesa alocarea automată');
      return;
    }
    
    try {
      setProcessingPachet(selectedPachet);
      setError(null);
      
      // Obținem datele pachetului
      const pachetRef = doc(db, 'pachete', selectedPachet);
      const pachetDoc = await getDoc(pachetRef);
      
      if (!pachetDoc.exists()) {
        setError('Pachetul selectat nu există');
        setProcessingPachet(null);
        return;
      }
      
      const pachetData = pachetDoc.data();
      console.log('Date pachet:', pachetData);
      
      // 1. Obținem materiile direct din documentul pachetului
      let materii = [];
      
      // Verificăm dacă pachetul are câmpul "materii" cu lista de materii
      if (pachetData.materii && pachetData.materii.length > 0) {
        materii = pachetData.materii.map(materie => ({
          id: materie.id,
          nume: materie.nume || 'Necunoscută',
          locuriDisponibile: materie.locuriDisponibile || 30,
          locuriRamase: materie.locuriDisponibile || 30,
          studentiInscrisi: []
        }));
      } else {
        // Alternativ, verificăm dacă pachetul are materiile în structura prezentată în screenshot
        if (pachetData.materiiOptionale) {
          const materiiOptionale = pachetData.materiiOptionale;
          materii = Object.keys(materiiOptionale).map(index => {
            const materieInfo = materiiOptionale[index];
            return {
              id: materieInfo.id,
              nume: materieInfo.nume || 'Necunoscută',
              locuriDisponibile: materieInfo.locuriDisponibile || 30,
              locuriRamase: materieInfo.locuriDisponibile || 30,
              studentiInscrisi: []
            };
          });
        }
      }
      
      if (materii.length === 0) {
        setError('Nu există materii definite pentru acest pachet. Verificați structura datelor în Firestore.');
        setProcessingPachet(null);
        return;
      }
      
      console.log('Materii găsite:', materii);
      
      // 2. Obținem toți studenții care au preferințe pentru acest pachet
      const studenti = [];
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      console.log('Număr total utilizatori:', usersSnapshot.size);
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`Verificare utilizator ${doc.id}:`, userData);
        
        let arePreferinte = false;
        let preferinte = [];
        
        // Verificăm diferite posibile structuri pentru preferințe
        // Structura 1: preferinteMateriiOptionale[pachetId] ca array
        if (userData.preferinteMateriiOptionale && 
            userData.preferinteMateriiOptionale[selectedPachet] && 
            Array.isArray(userData.preferinteMateriiOptionale[selectedPachet]) && 
            userData.preferinteMateriiOptionale[selectedPachet].length > 0) {
          
          preferinte = userData.preferinteMateriiOptionale[selectedPachet];
          arePreferinte = true;
          console.log(`Utilizator ${doc.id} are preferințe în format array:`, preferinte);
        } 
        // Structura 2: preferințe direct în userData.preferinte
        else if (userData.preferinte && 
                Array.isArray(userData.preferinte) && 
                userData.preferinte.length > 0) {
          
          preferinte = userData.preferinte;
          arePreferinte = true;
          console.log(`Utilizator ${doc.id} are preferințe în câmpul preferinte:`, preferinte);
        }
        // Structura 3: prefPachet = selectedPachet și ID-uri în prefMaterii
        else if (userData.prefPachet === selectedPachet && 
                userData.prefMaterii && 
                Array.isArray(userData.prefMaterii) && 
                userData.prefMaterii.length > 0) {
          
          preferinte = userData.prefMaterii;
          arePreferinte = true;
          console.log(`Utilizator ${doc.id} are preferințe în câmpul prefMaterii:`, preferinte);
        }
        
        if (arePreferinte) {
          studenti.push({
            id: doc.id,
            nume: userData.nume || 'Necunoscut',
            prenume: userData.prenume || 'Necunoscut',
            media: userData.media || 0,
            preferinte: preferinte
          });
        }
      });
      
      console.log('Studenți cu preferințe găsiți:', studenti.length);
      
      if (studenti.length === 0) {
        setError('Nu există studenți înscriși pentru acest pachet. Studenții trebuie să-și exprime preferințele înainte de a efectua alocarea automată.');
        setProcessingPachet(null);
        return;
      }
      
      // Continuăm cu alocarea folosind studenții găsiți
      processAllocation(materii, studenti);
      
    } catch (error) {
      console.error('Eroare la procesarea alocării automate:', error);
      setError('A apărut o eroare la procesarea alocării automate: ' + error.message);
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
      // 3. Sortăm studenții după medie (descrescător)
      studenti.sort((a, b) => b.media - a.media);
      console.log('Studenți sortați după medie:', studenti);
      
      // 4. Alocăm studenții la materii, în ordinea mediilor și conform preferințelor lor
      const studentiAlocati = [];
      const studentiNealocati = [];
      
      for (const student of studenti) {
        let alocat = false;
        
        for (const materieId of student.preferinte) {
          // Găsim materia în lista noastră
          const materieIndex = materii.findIndex(m => m.id === materieId);
          
          if (materieIndex !== -1 && materii[materieIndex].locuriRamase > 0) {
            // Am găsit un loc disponibil la o materie preferată
            materii[materieIndex].locuriRamase--;
            // Adăugăm studentul ca obiect complet, nu doar ID-ul
            materii[materieIndex].studentiInscrisi.push({
              id: student.id,
              nume: student.nume,
              prenume: student.prenume, 
              numarMatricol: student.numarMatricol
            });
            
            // Adăugăm la lista de studenți alocați
            studentiAlocati.push({
              id: student.id,
              nume: student.nume,
              prenume: student.prenume,
              media: student.media,
              numarMatricol: student.numarMatricol ,
              materieAlocata: materieId,
              numeMaterieAlocata: materii[materieIndex].nume,
              pozitiePrioritate: student.preferinte.indexOf(materieId) + 1
            });
            
            alocat = true;
            break; // Trecem la următorul student
          }
        }
        
        if (!alocat) {
          // Studentul nu a putut fi alocat la nicio materie din lista sa de preferințe
          studentiNealocati.push({
            id: student.id,
            nume: student.nume,
            prenume: student.prenume,
            media: student.media,
            numarMatricol: student.numarMatricol || student.id,
            preferinte: student.preferinte
          });
        }
      }
      
      console.log('Studenți alocați:', studentiAlocati.length);
      console.log('Studenți nealocați:', studentiNealocati.length);
      
      // Setează un mesaj de încărcare temporar
      
      // 5. Salvăm rezultatele în Firestore
      // Actualizăm pachetul cu materiile actualizate și listele de studenți
      await updateDoc(doc(db, 'pachete', selectedPachet), {
        materii: materii,
        procesat: true,
        dataUltimaAlocare: new Date().toISOString(),
        studentiAlocati: studentiAlocati.length,
        studentiNealocati: studentiNealocati.length,
        totalMaterii: materii.length
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
          // Obținem documentul utilizatorului pentru a verifica array-ul materiiInscrise actual
          const userDoc = await getDoc(doc(db, 'users', student.id));
          const userData = userDoc.data();
          
          // Verificăm dacă utilizatorul are deja array-ul materiiInscrise
          let materiiInscrise = userData.materiiInscrise || [];
          
          // Verificăm dacă materia nu este deja în array
          if (!materiiInscrise.includes(student.materieAlocata)) {
            // Adăugăm noua materie la array-ul materiiInscrise
            materiiInscrise.push(student.materieAlocata);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#034a76]">Administrare Înscrieri Materii</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-[#034a76] text-white p-4">
            <h2 className="text-lg font-semibold">Pachete disponibile</h2>
          </div>
          
          <div className="divide-y">
            {pachete.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nu există pachete disponibile
              </div>
            ) : (
              pachete.map(pachet => (
                <div 
                  key={pachet.id} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedPachet === pachet.id ? 'bg-gray-100' : ''}`}
                  onClick={() => handleSelectPachet(pachet.id)}
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
                                      <div className="text-gray-600">Media: {student.media}</div>
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
                                      <div className="text-gray-600">Media: {student.media}</div>
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
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Notă:</strong> După ce salvați perioada de înscriere, studenții vor putea să își selecteze opțiunile
                            doar în perioada specificată. Asigurați-vă că perioada este suficient de lungă pentru a permite tuturor
                            studenților să participe.
                          </p>
                        </div>
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
  );
};

export default AlocareAutomataPage; 