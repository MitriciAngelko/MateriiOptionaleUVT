import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, where, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { browserLocalPersistence } from 'firebase/auth';

const AdminUserForm = ({ onClose, onUserCreated, editingUser }) => {
  const [formType, setFormType] = useState(editingUser?.tip || 'student');
  const [formData, setFormData] = useState({
    email: editingUser?.email || '',
    password: '',
    confirmPassword: '',
    nume: editingUser?.nume || '',
    prenume: editingUser?.prenume || '',
    anNastere: editingUser?.anNastere || '',
    facultate: editingUser?.facultate || '',
    specializare: editingUser?.specializare || '',
    an: editingUser?.an || '',
    materiiPredate: editingUser?.materiiPredate || []
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState(null);
  const navigate = useNavigate();
  const [materii, setMaterii] = useState([]);
  const [materieNoua, setMaterieNoua] = useState({
    facultate: '',
    specializare: '',
    nume: '',
    an: ''
  });
  const [materiiDisponibile, setMateriiDisponibile] = useState([]);
  const [materiiSelectate, setMateriiSelectate] = useState([]);

  const facultati = [
    "Facultatea de Matematică și Informatică",
    "Facultatea de Fizică",
    // ... alte facultăți
  ];

  const specializari = {
    "Facultatea de Matematică și Informatică": ["IR", "IG", "MI", "MA"],
    // ... alte specializări pentru alte facultăți
  };

  const ani = ["I", "II", "III"];

  // Salvăm credențialele adminului când componenta se încarcă
  useEffect(() => {
    const currentAdmin = auth.currentUser;
    if (currentAdmin) {
      setAdminCredentials({
        email: currentAdmin.email,
        // Nu putem salva parola, dar o vom cere în formular
      });
    }
  }, []);

  // Funcție pentru generarea emailului profesorului
  const generateProfesorEmail = (nume, prenume) => {
    const cleanNume = nume.toLowerCase()
      .replace(/\s+/g, '') // elimină spațiile
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // elimină diacriticele
      .replace(/[^a-z]/g, ''); // păstrează doar literele
    
    const cleanPrenume = prenume.toLowerCase()
      .replace(/\s+/g, '')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, '');

    return `${cleanPrenume}.${cleanNume}@e-uvt.ro`;
  };

  // Funcție pentru generarea emailului studentului
  const generateStudentEmail = (nume, prenume, anNastere) => {
    if (!nume || !prenume || !anNastere) return '';
    
    const cleanNume = nume.toLowerCase()
      .replace(/\s+/g, '')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, '');
    
    const cleanPrenume = prenume.toLowerCase()
      .replace(/\s+/g, '')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, '');

    const ultimeleCifre = anNastere.slice(-2);
    
    return `${cleanPrenume}.${cleanNume}${ultimeleCifre}@e-uvt.ro`;
  };

  // Modificăm handleChange pentru a actualiza emailul automat
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (formType === 'profesor' && (name === 'nume' || name === 'prenume')) {
        newData.email = generateProfesorEmail(
          name === 'nume' ? value : newData.nume,
          name === 'prenume' ? value : newData.prenume
        );
      } else if (formType === 'student' && (name === 'nume' || name === 'prenume' || name === 'anNastere')) {
        newData.email = generateStudentEmail(
          name === 'nume' ? value : newData.nume,
          name === 'prenume' ? value : newData.prenume,
          name === 'anNastere' ? value : newData.anNastere
        );
      }
      
      return newData;
    });
  };

  const validateStudentEmail = (email) => {
    const studentEmailPattern = /^[a-z]+\.[a-z]+[0-9]{2}@e-uvt\.ro$/;
    return studentEmailPattern.test(email.toLowerCase());
  };

  const getNextMatricolNumber = async (specializare) => {
    try {
      // Prefix pentru fiecare specializare
      const prefixMap = {
        'IR': 'I', // Informatică Română
        'IG': 'G', // Informatică Germană
        'MI': 'M', // Matematică-Informatică
        'MA': 'A'  // Matematică
      };

      const prefix = prefixMap[specializare];
      if (!prefix) return null;

      // Caută toți studenții cu același prefix
      const q = query(
        collection(db, 'users'),
        where('specializare', '==', specializare)
      );
      const querySnapshot = await getDocs(q);
      
      // Găsește cel mai mare număr matricol existent
      let maxNumber = 0;
      querySnapshot.forEach(doc => {
        const matricol = doc.data().numarMatricol;
        if (matricol) {
          const number = parseInt(matricol.substring(1));
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      });

      // Generează următorul număr matricol
      const nextNumber = maxNumber + 1;
      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating matricol number:', error);
      return null;
    }
  };

  // Populează istoricul academic cu materii obligatorii
  const populateIstoricWithMandatoryCourses = async (studentId, studentData) => {
    try {
      // Obține toate materiile din colecția materii
      const materiiSnapshot = await getDocs(collection(db, 'materii'));
      const allMaterii = materiiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrează materiile obligatorii pentru facultatea și specializarea studentului
      const materiiObligatorii = allMaterii.filter(materie => {
        return materie.obligatorie === true &&
               materie.facultate === studentData.facultate &&
               materie.specializare === studentData.specializare;
      });

      // Filtrează materiile pentru anii anteriori și anul curent
      const studentAn = studentData.an || 'I';
      const studentAnNumeric = studentAn === 'I' ? 1 : studentAn === 'II' ? 2 : 3;
      
      const materiiPentruAni = materiiObligatorii.filter(materie => {
        const materieAn = materie.an || 'I';
        const materieAnNumeric = materieAn === 'I' ? 1 : materieAn === 'II' ? 2 : 3;
        return materieAnNumeric <= studentAnNumeric;
      });

      if (materiiPentruAni.length === 0) return;

      // Determină anul universitar curent
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : // Pentru lunile ian-aug, folosim anul precedent-anul curent
        `${year}-${year+1}`;  // Pentru lunile sep-dec, folosim anul curent-anul următor

      // Obține referința la istoricul academic
      const istoricRef = doc(db, 'istoricAcademic', studentId);
      const istoricDoc = await getDoc(istoricRef);
      
      if (!istoricDoc.exists()) return;
      
      const istoricData = istoricDoc.data();
      let updatedIstoric = [...(istoricData.istoricAnual || [])];

      // Pentru fiecare materie obligatorie, adaugă în istoricul academic
      for (const materie of materiiPentruAni) {
        // Verifică dacă materia există deja în istoric
        const materieExistenta = updatedIstoric.some(anual => 
          anual.cursuri && anual.cursuri.some(curs => curs.id === materie.id)
        );
        
        if (!materieExistenta) {
          const anStudiu = materie.an || 'I';
          const semestru = materie.semestru || 1;
          
          // Creează nota pentru materie
          const newNote = {
            id: materie.id,
            nume: materie.nume,
            credite: materie.credite || 0,
            nota: 0, // Nota 0 - neevaluată încă
            dataNota: new Date().getTime(),
            profesor: materie.profesor?.nume || 'Nespecificat',
            obligatorie: true,
            status: 'neevaluat'
          };
          
          // Verifică dacă există deja un istoric pentru anul și semestrul specificat
          const anualIndex = updatedIstoric.findIndex(
            item => item.anUniversitar === anUniversitar && 
                   item.anStudiu === anStudiu &&
                   item.semestru === parseInt(semestru)
          );
          
          if (anualIndex >= 0) {
            // Verifică dacă istoricul are proprietatea cursuri și este un array
            if (!updatedIstoric[anualIndex].cursuri) {
              updatedIstoric[anualIndex].cursuri = [];
            }
            
            // Verifică din nou dacă materia nu există deja în acest an/semestru specific
            const materieExistentaInAn = updatedIstoric[anualIndex].cursuri.some(
              curs => curs.id === materie.id
            );
            
            if (!materieExistentaInAn) {
              updatedIstoric[anualIndex].cursuri.push(newNote);
            }
          } else {
            // Creează un nou istoric anual
            const newAnualRecord = {
              anUniversitar: anUniversitar,
              anStudiu: anStudiu,
              semestru: parseInt(semestru),
              cursuri: [newNote]
            };
            
            updatedIstoric.push(newAnualRecord);
          }
        }
      }

      // Actualizează istoricul în baza de date
      await updateDoc(istoricRef, {
        istoricAnual: updatedIstoric
      });

    } catch (error) {
      console.error('Eroare la popularea istoricului academic:', error);
    }
  };

  // Adaugă o nouă materie în listă
  const adaugaMaterie = () => {
    if (materieNoua.facultate && materieNoua.specializare && materieNoua.nume && materieNoua.an) {
      setMaterii([...materii, { ...materieNoua }]);
      setMaterieNoua({
        facultate: '',
        specializare: '',
        nume: '',
        an: ''
      });
    }
  };

  // Șterge o materie din listă
  const stergeMaterie = (index) => {
    setMaterii(materii.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    if (formType === 'profesor') {
      // Încărcăm materiile disponibile din Firestore
      const fetchMaterii = async () => {
        try {
          const materiiSnapshot = await getDocs(collection(db, 'materii'));
          const materiiList = materiiSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMateriiDisponibile(materiiList);
        } catch (err) {
          console.error('Eroare la încărcarea materiilor:', err);
        }
      };
      fetchMaterii();
    }
  }, [formType]);

  // Funcție pentru actualizarea materiilor în Firestore
  const updateMateriiCuProfesor = async (userId, materiiSelectate, numeProfesor) => {
    try {
      for (const materieId of materiiSelectate) {
        const materieRef = doc(db, 'materii', materieId);
        const materieDoc = await getDoc(materieRef);
        
        if (materieDoc.exists()) {
          const profesoriActuali = materieDoc.data().profesori || [];
          // Adăugăm noul profesor dacă nu există deja
          if (!profesoriActuali.some(prof => prof.id === userId)) {
            await updateDoc(materieRef, {
              profesori: [...profesoriActuali, {
                id: userId,
                nume: `${numeProfesor.prenume} ${numeProfesor.nume}`
              }]
            });
          }
        }
      }
    } catch (error) {
      console.error('Eroare la actualizarea materiilor:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingUser) {
        // Actualizăm datele utilizatorului în Firestore
        const userRef = doc(db, 'users', editingUser.id);
        const updateData = {
          nume: formData.nume,
          prenume: formData.prenume,
          tip: formType,
          anNastere: formData.anNastere,
          specializare: formData.specializare,
          an: formData.an,
          facultate: formData.facultate // Adăugăm și facultatea
        };

        // Adăugăm câmpuri specifice în funcție de tipul utilizatorului
        if (formType === 'profesor') {
          // Pentru profesori, actualizăm și materiile predate
          const materiiComplete = materiiSelectate.map(materieId => {
            const materie = materiiDisponibile.find(m => m.id === materieId);
            return {
              id: materieId,
              nume: materie.nume,
              facultate: materie.facultate,
              specializare: materie.specializare,
              an: materie.an,
              credite: materie.credite
            };
          });
          updateData.materiiPredate = materiiComplete;

          // Actualizăm și referințele din colecția materii
          const materiiPromises = [];
          
          // 1. Mai întâi eliminăm profesorul din toate materiile
          const materiiSnapshot = await getDocs(collection(db, 'materii'));
          materiiSnapshot.docs.forEach(async (materieDoc) => {
            const materieRef = doc(db, 'materii', materieDoc.id);
            const materieData = materieDoc.data();
            const profesoriActualizati = (materieData.profesori || [])
              .filter(prof => prof.id !== editingUser.id);
            
            materiiPromises.push(updateDoc(materieRef, {
              profesori: profesoriActualizati
            }));
          });

          // 2. Adăugăm profesorul la materiile selectate
          materiiSelectate.forEach(async (materieId) => {
            const materieRef = doc(db, 'materii', materieId);
            const materieDoc = await getDoc(materieRef);
            
            if (materieDoc.exists()) {
              const profesoriActuali = materieDoc.data().profesori || [];
              if (!profesoriActuali.some(prof => prof.id === editingUser.id)) {
                materiiPromises.push(updateDoc(materieRef, {
                  profesori: [...profesoriActuali, {
                    id: editingUser.id,
                    nume: `${formData.prenume} ${formData.nume}`
                  }]
                }));
              }
            }
          });

          // Așteptăm să se termine toate actualizările materiilor
          await Promise.all(materiiPromises);
        } else if (formType === 'student') {
          // Pentru studenți, actualizăm numărul matricol dacă există
          if (editingUser.numarMatricol) {
            updateData.numarMatricol = editingUser.numarMatricol;
          }
        } else if (formType === 'secretar') {
          // Pentru secretari, actualizăm funcția
          updateData.functie = formData.functie;
        }

        // Actualizăm documentul utilizatorului
        await updateDoc(userRef, updateData);
        setSuccess(true);
        onUserCreated?.();
      } else {
        // Logica existentă pentru crearea unui utilizator nou
        const tempAuth = getAuth();
        await tempAuth.setPersistence(browserLocalPersistence);
        
        const userCredential = await createUserWithEmailAndPassword(
          tempAuth,
          formData.email.toLowerCase(),
          formData.password
        );

        // Construim datele pentru Firestore
        const userData = {
          email: formData.email?.toLowerCase() || '',
          uid: userCredential.user.uid || '',
          nume: formData.nume || '',
          prenume: formData.prenume || '',
          tip: formType || 'student',
          createdAt: new Date(),
        };

        // Adăugăm date specifice pentru student
        if (formType === 'student') {
          const numarMatricol = await getNextMatricolNumber(formData.specializare);
          userData.facultate = formData.facultate;
          userData.specializare = formData.specializare;
          userData.an = formData.an;
          userData.anNastere = formData.anNastere;
          userData.numarMatricol = numarMatricol;
        }
        // Adăugăm date specifice pentru profesor
        else if (formType === 'profesor') {
          const materiiComplete = materiiSelectate.map(materieId => {
            const materie = materiiDisponibile.find(m => m.id === materieId);
            if (!materie) {
              console.error(`Materia cu ID-ul ${materieId} nu a fost găsită`);
              return null;
            }
            return {
              id: materieId,
              nume: materie.nume,
              facultate: materie.facultate,
              specializare: materie.specializare,
              an: materie.an,
              credite: materie.credite
            };
          }).filter(Boolean);
          
          userData.materiiPredate = materiiComplete || [];
          userData.facultate = formData.facultate || '';
        }
        // Adăugăm date specifice pentru secretar
        else if (formType === 'secretar') {
          userData.facultate = formData.facultate || '';
        }

        // Salvăm utilizatorul în Firestore
        console.log('userData before setDoc:', userData);
        console.log('formData.facultate:', formData.facultate);
        console.log('materiiSelectate:', materiiSelectate);
        
        // Deep check for undefined values
        const checkForUndefined = (obj, path = '') => {
          Object.keys(obj).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;
            if (obj[key] === undefined) {
              console.error(`Field ${currentPath} is undefined in userData`);
            } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
              checkForUndefined(obj[key], currentPath);
            } else if (Array.isArray(obj[key])) {
              obj[key].forEach((item, index) => {
                if (item === undefined) {
                  console.error(`Array item at ${currentPath}[${index}] is undefined`);
                } else if (item && typeof item === 'object') {
                  checkForUndefined(item, `${currentPath}[${index}]`);
                }
              });
            }
          });
        };
        
        checkForUndefined(userData);
        
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
          console.log('User successfully saved to Firestore');
        } catch (firestoreError) {
          console.error('Firestore setDoc error:', firestoreError);
          console.error('userData that caused the error:', JSON.stringify(userData, null, 2));
          throw new Error(`Failed to save user to database: ${firestoreError.message}`);
        }

        // Creăm istoricul academic pentru student
        if (formType === 'student') {
          const istoricAcademicData = {
            studentId: userCredential.user.uid,
            nume: formData.nume,
            prenume: formData.prenume,
            specializare: formData.specializare,
            facultate: formData.facultate,
            istoricAnual: []
          };

          await setDoc(doc(db, 'istoricAcademic', userCredential.user.uid), istoricAcademicData);

          // Populează istoricul cu materii obligatorii pentru anii anteriori și anul curent
          await populateIstoricWithMandatoryCourses(userCredential.user.uid, formData);
        }

        // Actualizăm materiile pentru profesor
        if (formType === 'profesor' && materiiSelectate.length > 0) {
          for (const materieId of materiiSelectate) {
            try {
              const materieRef = doc(db, 'materii', materieId);
              const materieDoc = await getDoc(materieRef);
              
              if (materieDoc.exists()) {
                const materieData = materieDoc.data();
                const profesoriActuali = materieData.profesori || [];
                
                if (!profesoriActuali.some(prof => prof.id === userCredential.user.uid)) {
                  await updateDoc(materieRef, {
                    profesori: [...profesoriActuali, {
                      id: userCredential.user.uid,
                      nume: `${formData.prenume} ${formData.nume}`
                    }]
                  });
                }
              }
            } catch (error) {
              console.error(`Eroare la actualizarea materiei ${materieId}:`, error);
            }
          }
        }

        await tempAuth.signOut();
      }

      setSuccess(true);
      onUserCreated?.();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Încărcăm materiile selectate când se deschide formularul pentru editare
  useEffect(() => {
    if (editingUser && formType === 'profesor') {
      const fetchMateriiProfesor = async () => {
        try {
          const materiiSnapshot = await getDocs(collection(db, 'materii'));
          const materiiList = materiiSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setMateriiDisponibile(materiiList);
          
          // Găsim materiile în care profesorul este asociat
          const materiiProfesor = materiiList
            .filter(materie => 
              (materie.profesori || []).some(prof => prof.id === editingUser.id)
            )
            .map(materie => materie.id);
          
          setMateriiSelectate(materiiProfesor);
        } catch (err) {
          console.error('Eroare la încărcarea materiilor:', err);
          setError('Eroare la încărcarea materiilor');
        }
      };

      fetchMateriiProfesor();
    }
  }, [editingUser, formType]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            {editingUser ? 'Editare Utilizator' : 'Creare Utilizator Nou'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Utilizatorul a fost creat cu succes!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector tip utilizator */}
          <div className="flex space-x-4 mb-4">
            {['student', 'profesor', 'secretar'].map((tip) => (
              <button
                key={tip}
                type="button"
                onClick={() => setFormType(tip)}
                className={`px-4 py-2 rounded-md ${
                  formType === tip
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tip.charAt(0).toUpperCase() + tip.slice(1)}
              </button>
            ))}
          </div>

          {/* Restul formularului rămâne la fel, doar îl înfășurăm în div-uri pentru scroll */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Câmpuri comune */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nume</label>
                <input
                  type="text"
                  name="nume"
                  value={formData.nume}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prenume</label>
                <input
                  type="text"
                  name="prenume"
                  value={formData.prenume}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Câmpuri specifice pentru student */}
            {formType === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facultate</label>
                  <select
                    name="facultate"
                    value={formData.facultate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selectează facultatea</option>
                    {facultati.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Specializare</label>
                  <select
                    name="specializare"
                    value={formData.specializare}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selectează specializarea</option>
                    {specializari[formData.facultate]?.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">An</label>
                  <select
                    name="an"
                    value={formData.an}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selectează anul</option>
                    {ani.map(an => (
                      <option key={an} value={an}>{an}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">An Naștere</label>
                  <input
                    type="text"
                    name="anNastere"
                    value={formData.anNastere}
                    onChange={handleChange}
                    placeholder="ex: 2002"
                    pattern="[0-9]{4}"
                    maxLength="4"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Câmpuri specifice pentru profesor */}
            {formType === 'profesor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facultate</label>
                  <select
                    name="facultate"
                    value={formData.facultate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selectează facultatea</option>
                    {facultati.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                
              </>
            )}

            {/* Câmpuri specifice pentru secretar */}
            {formType === 'secretar' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facultate</label>
                  <select
                    name="facultate"
                    value={formData.facultate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selectează facultatea</option>
                    {facultati.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Funcție</label>
                  <input
                    type="text"
                    name="functie"
                    value={formData.functie}
                    onChange={handleChange}
                    placeholder="ex: Secretar șef, Secretar facultate, etc."
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {!editingUser && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Parolă</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingUser}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Confirmă Parola</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!editingUser}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {formType === 'profesor' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Materii Predate</label>
                <div className="mt-2 space-y-2">
                  {materiiDisponibile.map((materie) => (
                    <div key={materie.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={materiiSelectate.includes(materie.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMateriiSelectate([...materiiSelectate, materie.id]);
                          } else {
                            setMateriiSelectate(materiiSelectate.filter(id => id !== materie.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <span>
                        {materie.nume} - {materie.facultate} ({materie.specializare}, Anul {materie.an})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Se procesează...' : (editingUser ? 'Salvează Modificările' : 'Creează Utilizator')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserForm; 