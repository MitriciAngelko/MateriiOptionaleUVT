import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, where, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
    functie: editingUser?.functie || '',
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

  // Funcție pentru assignarea automată a cursurilor obligatorii și crearea istoricului academic
  const assignMandatoryCoursesAndCreateIstoric = async (studentId, studentData) => {
    try {
      console.log('Starting automatic assignment of mandatory courses for student:', studentId);
      
      // 1. Găsim toate cursurile obligatorii pentru studentul nou creat
      const materiiQuery = query(
        collection(db, 'materii'),
        where('facultate', '==', studentData.facultate),
        where('specializare', '==', studentData.specializare),
        where('an', '==', studentData.an),
        where('obligatorie', '==', true)
      );
      
      const materiiSnapshot = await getDocs(materiiQuery);
      const materiiObligatorii = materiiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${materiiObligatorii.length} mandatory courses for ${studentData.facultate}, ${studentData.specializare}, year ${studentData.an}`);
      
      if (materiiObligatorii.length === 0) {
        console.log('No mandatory courses found - skipping assignment');
        return;
      }
      
      // 2. Creăm istoricul academic pentru student
      const istoricRef = doc(db, 'istoricAcademic', studentId);
      
      // Determină anul universitar curent
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      const anUniversitar = month < 9 ? 
        `${year-1}-${year}` : // Pentru lunile ian-aug, folosim anul precedent-anul curent
        `${year}-${year+1}`;  // Pentru lunile sep-dec, folosim anul curent-anul următor
      
      const istoricData = {
        studentId: studentId,
        nume: studentData.nume || '',
        prenume: studentData.prenume || '',
        specializare: studentData.specializare || '',
        facultate: studentData.facultate || '',
        istoricAnual: []
      };
      
      // Grupăm cursurile obligatorii pe semestre
      const cursuriBySemestru = {};
      
      materiiObligatorii.forEach(materie => {
        const semestru = materie.semestru || 1;
        if (!cursuriBySemestru[semestru]) {
          cursuriBySemestru[semestru] = [];
        }
        
        // Creăm înregistrarea pentru materia obligatorie
        const courseRecord = {
          id: materie.id,
          nume: materie.nume,
          credite: materie.credite || 0,
          nota: 0, // Nota 0 - neevaluată încă
          dataNota: currentDate.getTime(),
          profesor: 'Nespecificat', // Profesorul va fi adăugat când se va asigna
          obligatorie: true,
          status: 'neevaluat',
          dataInregistrare: new Date().toISOString()
        };
        
        cursuriBySemestru[semestru].push(courseRecord);
      });
      
      // Creăm înregistrările anuale pentru fiecare semestru
      Object.keys(cursuriBySemestru).forEach(semestru => {
        const anualRecord = {
          anUniversitar: anUniversitar,
          anStudiu: studentData.an,
          semestru: parseInt(semestru),
          cursuri: cursuriBySemestru[semestru]
        };
        
        istoricData.istoricAnual.push(anualRecord);
      });
      
      // Salvăm istoricul academic
      await setDoc(istoricRef, istoricData);
      console.log('Created academic history for student');
      
      // 3. Adăugăm studentul la fiecare curs obligatoriu
      const studentInfo = {
        id: studentId,
        nume: `${studentData.prenume} ${studentData.nume}`,
        numarMatricol: studentData.numarMatricol || 'N/A'
      };
      
      const materiiInscrised = [];
      
      for (const materie of materiiObligatorii) {
        try {
          const materieRef = doc(db, 'materii', materie.id);
          const materieDoc = await getDoc(materieRef);
          
          if (materieDoc.exists()) {
            const materieData = materieDoc.data();
            const studentiActuali = materieData.studentiInscrisi || [];
            
            // Verificăm dacă studentul nu este deja înscris
            if (!studentiActuali.some(student => student.id === studentId)) {
              await updateDoc(materieRef, {
                studentiInscrisi: [...studentiActuali, studentInfo]
              });
              
              materiiInscrised.push(materie.id);
              console.log(`Added student to mandatory course: ${materie.nume}`);
            }
          }
        } catch (error) {
          console.error(`Error adding student to course ${materie.id}:`, error);
        }
      }
      
      // 4. Actualizăm și documentul utilizatorului cu lista de materii înscrise
      if (materiiInscrised.length > 0) {
        const userRef = doc(db, 'users', studentId);
        await updateDoc(userRef, {
          materiiInscrise: materiiInscrised
        });
        console.log(`Updated student's enrolled courses list with ${materiiInscrised.length} mandatory courses`);
      }
      
      console.log('Successfully completed automatic assignment of mandatory courses');
      
    } catch (error) {
      console.error('Error in automatic assignment of mandatory courses:', error);
      // Nu aruncăm eroarea pentru a nu întrerupe crearea utilizatorului
      // Doar logăm eroarea pentru debugging
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
          updateData.functie = formData.functie;

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
          // Pentru secretari, nu sunt câmpuri suplimentare
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
          email: formData.email.toLowerCase(),
          uid: userCredential.user.uid,
          nume: formData.nume,
          prenume: formData.prenume,
          tip: formType,
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
          
          userData.materiiPredate = materiiComplete;
          userData.facultate = formData.facultate;
          userData.functie = formData.functie;
        }
        // Adăugăm date specifice pentru secretar
        else if (formType === 'secretar') {
          userData.facultate = formData.facultate;
        }

        // Salvăm utilizatorul în Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);

        // Pentru studenți noi, îi assignez automat la cursurile obligatorii și creez istoricul academic
        if (formType === 'student') {
          await assignMandatoryCoursesAndCreateIstoric(userCredential.user.uid, userData);
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
            {editingUser ? 'Utilizatorul a fost actualizat cu succes!' : 'Utilizatorul a fost creat cu succes!'}
            {!editingUser && formType === 'student' && (
              <div className="mt-2 text-sm">
                Studentul a fost înscris automat la toate cursurile obligatorii pentru 
                {` ${formData.facultate}, ${formData.specializare}, anul ${formData.an}`}.
              </div>
            )}
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