import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { createUser, updateUser } from '../services/userService';

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
  const [materiiDisponibile, setMateriiDisponibile] = useState([]);
  const [materiiSelectate, setMateriiSelectate] = useState([]);
  const [materiiFilter, setMateriiFilter] = useState({
    search: '',
    facultate: '',
    specializare: '',
    an: ''
  });

  const facultati = [
    "Facultatea de Matematica si Informatica",
    "Facultatea de Fizica",
    // ... alte facultăți
  ];

  const specializari = {
    "Facultatea de Matematica si Informatica": ["IR", "IE", "IA", "ID"],
    // ... alte specializări pentru alte facultăți
  };

  const ani = ["I", "II", "III"];

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

  // Funcție pentru resetarea câmpurilor specifice tipului când se schimbă tipul
  const resetTypeSpecificFields = () => {
    setFormData(prev => ({
      ...prev,
      email: '',
      facultate: '',
      specializare: '',
      an: '',
      anNastere: '',
      functie: ''
    }));
    setMateriiSelectate([]);
  };

  // Funcție pentru schimbarea tipului de utilizator
  const handleTypeChange = (newType) => {
    if (newType !== formType) {
      setFormType(newType);
      resetTypeSpecificFields();
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingUser) {
        // Use the updateUser service for editing
        const userData = {
          nume: formData.nume,
          prenume: formData.prenume,
          tip: formType,
          anNastere: formData.anNastere,
          specializare: formData.specializare,
          an: formData.an,
          facultate: formData.facultate,
          functie: formData.functie
        };

        // Convert materiiSelectate to the format expected by the service
        const materiiForService = materiiSelectate.map(materieId => {
          const materie = materiiDisponibile.find(m => m.id === materieId);
          return materie ? { id: materieId, ...materie } : null;
        }).filter(Boolean);

        await updateUser(editingUser.id, userData, materiiForService);
        setSuccess(true);
        onUserCreated?.();
      } else {
        // Use the createUser service for new users
        const userData = {
          email: formData.email.toLowerCase(),
          password: formData.password,
          nume: formData.nume,
          prenume: formData.prenume,
          tip: formType,
          facultate: formData.facultate,
          anNastere: formData.anNastere,
          specializare: formData.specializare,
          an: formData.an,
          functie: formData.functie
        };

        // Convert materiiSelectate to the format expected by the service
        const materiiForService = materiiSelectate.map(materieId => {
          const materie = materiiDisponibile.find(m => m.id === materieId);
          return materie ? { id: materieId, ...materie } : null;
        }).filter(Boolean);

        await createUser(userData, materiiForService, onUserCreated);
        setSuccess(true);
      }
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
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md w-full max-w-4xl mx-4 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 text-white dark:text-gray-900 p-2 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="text-2xl font-bold drop-shadow-sm">
                  {editingUser ? 'Editare Utilizator' : 'Creare Utilizator Nou'}
                </h3>
                <p className="text-white/80 dark:text-gray-900/70 text-sm font-medium">
                  {editingUser ? `Modifică datele pentru ${editingUser.nume} ${editingUser.prenume}` : 'Completează informațiile pentru noul utilizator'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 dark:text-gray-900/70 hover:text-white dark:hover:text-gray-900 hover:bg-white/10 dark:hover:bg-gray-900/10 p-2 rounded-lg transition-all duration-200"
              title="Închide"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto custom-scrollbar">
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700 shadow-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700 shadow-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">
                    {editingUser ? 'Utilizatorul a fost actualizat cu succes!' : 'Utilizatorul a fost creat cu succes!'}
                  </p>
                  {!editingUser && formType === 'student' && (
                    <p className="text-sm mt-1">
                      Studentul a fost înscris automat la toate cursurile obligatorii pentru 
                      {` ${formData.facultate}, ${formData.specializare}, anul ${formData.an}`}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selector */}
            {!editingUser && (
              <div className="bg-gradient-to-r from-[#024A76]/5 to-[#3471B8]/5 dark:from-gray-700/50 dark:to-gray-600/50 p-6 rounded-xl border border-[#024A76]/20 dark:border-gray-600 shadow-lg">
                <h4 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Selectează Tipul de Utilizator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Student Option */}
                                     <button
                     type="button"
                     onClick={() => handleTypeChange('student')}
                     className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg ${
                      formType === 'student'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        formType === 'student' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                        </svg>
                      </div>
                      <div>
                        <h5 className={`font-semibold ${
                          formType === 'student' 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Student
                        </h5>
                        <p className={`text-sm ${
                          formType === 'student' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Cont pentru studenți
                        </p>
                      </div>
                    </div>
                    {formType === 'student' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Professor Option */}
                                     <button
                     type="button"
                     onClick={() => handleTypeChange('profesor')}
                     className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg ${
                      formType === 'profesor'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-green-300 dark:hover:border-green-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        formType === 'profesor' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      }`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className={`font-semibold ${
                          formType === 'profesor' 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Profesor
                        </h5>
                        <p className={`text-sm ${
                          formType === 'profesor' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Cont pentru profesori
                        </p>
                      </div>
                    </div>
                    {formType === 'profesor' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Secretary Option */}
                                     <button
                     type="button"
                     onClick={() => handleTypeChange('secretar')}
                     className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg ${
                      formType === 'secretar'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        formType === 'secretar' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h5 className={`font-semibold ${
                          formType === 'secretar' 
                            ? 'text-purple-700 dark:text-purple-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Secretar
                        </h5>
                        <p className={`text-sm ${
                          formType === 'secretar' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Cont pentru secretari
                        </p>
                      </div>
                    </div>
                    {formType === 'secretar' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-gradient-to-r from-[#E3AB23]/5 to-transparent dark:from-yellow-accent/10 dark:to-transparent p-6 rounded-xl border-l-4 border-[#E3AB23] dark:border-yellow-accent shadow-lg">
              <h4 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                Informații Personale
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Nume</label>
                  <input
                    type="text"
                    name="nume"
                    value={formData.nume}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    placeholder="Introduceți numele"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Prenume</label>
                  <input
                    type="text"
                    name="prenume"
                    value={formData.prenume}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    placeholder="Introduceți prenumele"
                  />
                </div>
              </div>
            </div>

            {/* Student-specific fields */}
            {formType === 'student' && (
              <div className="bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent p-6 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg">
                <h4 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                  Informații Academice
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                    <select
                      name="facultate"
                      value={formData.facultate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    >
                      <option value="">Selectează facultatea</option>
                      {facultati.map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
                    <select
                      name="specializare"
                      value={formData.specializare}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                      disabled={!formData.facultate}
                    >
                      <option value="">Selectează specializarea</option>
                      {specializari[formData.facultate]?.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
                    <select
                      name="an"
                      value={formData.an}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    >
                      <option value="">Selectează anul</option>
                      {ani.map(an => (
                        <option key={an} value={an}>{an}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An Naștere</label>
                    <input
                      type="text"
                      name="anNastere"
                      value={formData.anNastere}
                      onChange={handleChange}
                      placeholder="ex: 2002"
                      pattern="[0-9]{4}"
                      maxLength="4"
                      required
                      className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Professor-specific fields */}
            {formType === 'profesor' && (
              <div className="bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/20 dark:to-transparent p-6 rounded-xl border-l-4 border-green-500 dark:border-green-400 shadow-lg">
                <h4 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  Informații Profesionale
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                    <select
                      name="facultate"
                      value={formData.facultate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    >
                      <option value="">Selectează facultatea</option>
                      {facultati.map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>
                  
                                     {/* Materii Predate */}
                   <div>
                     <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-3">Materii Predate</label>
                     
                     {/* Compact Filter */}
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-3">
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                         {/* Search Input */}
                         <div className="md:col-span-2">
                           <div className="relative">
                             <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                             </svg>
                             <input
                               type="text"
                               placeholder="Caută materia..."
                               value={materiiFilter.search}
                               onChange={(e) => setMateriiFilter(prev => ({ ...prev, search: e.target.value }))}
                               className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-all duration-200"
                             />
                           </div>
                         </div>
                         
                         {/* Facultate Filter */}
                         <div>
                           <select
                             value={materiiFilter.facultate}
                             onChange={(e) => setMateriiFilter(prev => ({ ...prev, facultate: e.target.value, specializare: '' }))}
                             className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-all duration-200"
                           >
                             <option value="">Toate facultățile</option>
                             {facultati.map(fac => (
                               <option key={fac} value={fac}>{fac.split(' ').slice(-2).join(' ')}</option>
                             ))}
                           </select>
                         </div>
                         
                         {/* An Filter */}
                         <div>
                           <select
                             value={materiiFilter.an}
                             onChange={(e) => setMateriiFilter(prev => ({ ...prev, an: e.target.value }))}
                             className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-all duration-200"
                           >
                             <option value="">Toți anii</option>
                             {ani.map(an => (
                               <option key={an} value={an}>Anul {an}</option>
                             ))}
                           </select>
                         </div>
                       </div>
                       
                       {/* Clear Filter Button */}
                       {(materiiFilter.search || materiiFilter.facultate || materiiFilter.an) && (
                         <div className="mt-2 flex justify-end">
                           <button
                             type="button"
                             onClick={() => setMateriiFilter({ search: '', facultate: '', specializare: '', an: '' })}
                             className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#024A76] dark:hover:text-blue-light transition-colors duration-200 flex items-center space-x-1"
                           >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                             </svg>
                             <span>Resetează filtrul</span>
                           </button>
                         </div>
                       )}
                     </div>
                     
                     <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto custom-scrollbar">
                       {materiiDisponibile.length > 0 ? (
                         <div className="space-y-3">
                           {materiiDisponibile
                             .filter(materie => {
                               const matchesSearch = !materiiFilter.search || 
                                 materie.nume.toLowerCase().includes(materiiFilter.search.toLowerCase());
                               const matchesFacultate = !materiiFilter.facultate || 
                                 materie.facultate === materiiFilter.facultate;
                               const matchesAn = !materiiFilter.an || 
                                 materie.an === materiiFilter.an;
                               
                               return matchesSearch && matchesFacultate && matchesAn;
                             })
                             .map((materie) => (
                             <label key={materie.id} className="flex items-start space-x-3 cursor-pointer group">
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
                                 className="mt-0.5 w-4 h-4 text-[#024A76] bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:ring-2"
                               />
                               <div className="flex-1 group-hover:text-[#024A76] dark:group-hover:text-blue-light transition-colors duration-200">
                                 <div className="font-medium text-gray-900 dark:text-gray-200">{materie.nume}</div>
                                 <div className="text-sm text-gray-600 dark:text-gray-400">
                                   {materie.facultate} • {materie.specializare} • Anul {materie.an}
                                 </div>
                               </div>
                             </label>
                           ))}
                         </div>
                       ) : (
                         <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nu sunt materii disponibile</p>
                       )}
                       
                       {/* No results message */}
                       {materiiDisponibile.length > 0 && 
                        materiiDisponibile.filter(materie => {
                          const matchesSearch = !materiiFilter.search || 
                            materie.nume.toLowerCase().includes(materiiFilter.search.toLowerCase());
                          const matchesFacultate = !materiiFilter.facultate || 
                            materie.facultate === materiiFilter.facultate;
                          const matchesAn = !materiiFilter.an || 
                            materie.an === materiiFilter.an;
                          
                          return matchesSearch && matchesFacultate && matchesAn;
                        }).length === 0 && (
                         <div className="text-center py-6">
                           <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8 7.96 7.96 0 014.9 1.686" />
                           </svg>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Nu s-au găsit materii care să corespundă filtrului</p>
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* Secretary-specific fields */}
            {formType === 'secretar' && (
              <div className="bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/20 dark:to-transparent p-6 rounded-xl border-l-4 border-purple-500 dark:border-purple-400 shadow-lg">
                <h4 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  Informații Administrative
                </h4>
                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                  <select
                    name="facultate"
                    value={formData.facultate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                  >
                    <option value="">Selectează facultatea</option>
                    {facultati.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 dark:to-transparent p-6 rounded-xl border-l-4 border-gray-500 dark:border-gray-400 shadow-lg">
              <h4 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd" />
                </svg>
                Informații Cont
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                    required
                    placeholder="utilizator@e-uvt.ro"
                  />
                </div>

                {!editingUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Parolă</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!editingUser}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Confirmă Parola</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={!editingUser}
                        className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Anulează
              </button>
                             <button
                 type="submit"
                 disabled={loading}
                 className={`px-8 py-3 bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center space-x-2 ${
                   loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                 }`}
               >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se procesează...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{editingUser ? 'Salvează Modificările' : 'Creează Utilizator'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUserForm; 