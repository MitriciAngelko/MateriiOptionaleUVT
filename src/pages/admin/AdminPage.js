import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../providers/AuthProvider';
import { db, auth } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc, query, where } from 'firebase/firestore';
import AdminUserForm from '../../components/AdminUserForm';
import UserDetailsModal from '../../components/UserDetailsModal';
import CSVImportModal from '../../components/CSVImportModal';
import MassDeleteModal from '../../components/MassDeleteModal';
import { isAdmin } from '../../utils/userRoles';
import { useMaterii } from '../../contexts/MateriiContext';
import { generateUserCSVTemplate, downloadCSV } from '../../utils/csvUtils';
import { createUser } from '../../services/userService';
import axios from 'axios';
import { executeBatchedOperationsWithRetry } from '../../utils/rateLimiter';

const AdminPage = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('allUsers');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    tip: 'all',
    facultate: '',
    specializare: '',
    an: '',
    materie: ''
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [materiiList, setMateriiList] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const { allMaterii, loading: materiiLoading } = useMaterii();

  const facultati = [
    "Facultatea de Matematică și Informatică",
    "Facultatea de Fizică",
    // ... alte facultăți
  ];

  const specializari = {
    "Facultatea de Matematică și Informatică": ["IR", "IG", "MI", "MA"],
    // ... alte specializări
  };

  const ani = ["I", "II", "III"];
  const tipuriUtilizatori = ["all", "student", "profesor", "secretar"];
  
  // Fetch users function that can be called from different places
  const fetchUsers = async () => {
    try {
      // Verifică dacă utilizatorul este admin
      const adminAccess = await isAdmin(user);

      if (!adminAccess) {
        navigate('/');
        return;
      }

      setHasAccess(true);

      // Obține lista de utilizatori
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      // Filtrăm utilizatorii
      setUsers(usersData.filter(u => !u.email?.endsWith('@admin.com') && u.tip !== 'admin'));

      // Găsește utilizatorii cu email admin
      const adminUsers = usersData.filter(u => u.email?.endsWith('@admin.com') || u.tip === 'admin');
      setAdminUsers(adminUsers);

      // Obține lista de materii pentru dropdown-ul de filtrare
      const materiiDropdown = Object.values(allMaterii || {}).map(materie => ({
        id: materie.id,
        nume: materie.nume
      }));
      setMateriiList(materiiDropdown);
    } catch (error) {
      console.error('Eroare la încărcarea utilizatorilor:', error);
    }
  };

  useEffect(() => {
    if (user?.uid && !materiiLoading) {
      fetchUsers();
    }
  }, [user, navigate, allMaterii, materiiLoading]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest utilizator? Aceasta va șterge complet toate urmele utilizatorului din sistem (utilizator, istoric academic, înscrieri la materii, etc.)')) {
      try {
        console.log(`Starting comprehensive deletion for user: ${userId}`);
        
        // Get user data before deletion for logging
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        console.log('👤 User data to be deleted:', userData);

        // 1. Remove user from all materii documents (studentiInscrisi and profesori arrays)
        console.log('🎯 Step 1: Removing user from all materii documents');
        await removeUserFromAllMaterii(userId);
        console.log('✅ Step 1 completed: User removed from materii documents');

        // 2. Clean up user references from other users' preference data
        console.log('🎯 Step 2: Cleaning up user references from other users');
        await cleanupUserPreferences(userId);
        console.log('✅ Step 2 completed: User references cleaned up');

        // 3. Delete user from istoricAcademic collection if exists
        try {
          await deleteDoc(doc(db, 'istoricAcademic', userId));
          console.log('Istoric academic șters cu succes');
        } catch (istoricError) {
          console.log('Nu s-a găsit istoric academic pentru acest utilizator sau a apărut o eroare:', istoricError);
        }

        // 4. Delete user from Firestore users collection
        await deleteDoc(doc(db, 'users', userId));
        console.log('User document deleted from Firestore');

        // 5. Delete user from Firebase Authentication
        // This requires server-side admin SDK, so we'll make an API call to our server
        try {
          // Get the current user and token from localStorage
          const currentUser = JSON.parse(localStorage.getItem('user'));
          if (!currentUser || !currentUser.token) {
            throw new Error('User not authenticated');
          }

          // Note: Server is running on port 5001 according to server.js
          const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
          console.log(`Attempting to delete user ${userId} from Firebase Auth via API: ${apiBaseUrl}/users/${userId}`);
          
          // Add a loading message
          console.log('Waiting for API response...');
          
          const response = await axios.delete(`${apiBaseUrl}/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${currentUser.token}`
            },
            // Increase timeout to 10 seconds
            timeout: 10000
          });
          
          console.log('API Response:', response.data);
          console.log('Utilizator șters din Firebase Authentication');
          
          // Show confirmation to the user
          alert('Utilizator șters cu succes din sistem! Toate urmele utilizatorului au fost eliminate.');
        } catch (authError) {
          console.error('Eroare la ștergerea utilizatorului din Firebase Authentication:', authError);
          
          if (authError.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', authError.response.data);
            console.error('Response status:', authError.response.status);
            console.error('Response headers:', authError.response.headers);
          } else if (authError.request) {
            // The request was made but no response was received
            console.error('No response received from server:', authError.request);
            alert('Eroare de comunicare cu serverul. Verificați conexiunea la internet și rularea serverului.');
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', authError.message);
            alert(`Eroare la ștergerea utilizatorului: ${authError.message}`);
          }
        }

        // Reload users list
        fetchUsers();
      } catch (error) {
        console.error('Eroare la ștergerea utilizatorului:', error);
        alert(`Eroare la ștergerea utilizatorului: ${error.message}`);
      }
    }
  };

  // Function to remove user from all materii documents
  const removeUserFromAllMaterii = async (userId) => {
    try {
      console.log(`Starting removal of user ${userId} from all materii documents...`);
      
      // Get all materii documents
      const materiiSnapshot = await getDocs(collection(db, 'materii'));
      console.log(`📚 Found ${materiiSnapshot.docs.length} materii documents to check`);
      
      let materiiUpdated = 0;
      let totalStudentsFound = 0;
      let totalProfessorsFound = 0;

      // Process each materie document individually to catch individual errors
      for (const materieDoc of materiiSnapshot.docs) {
        try {
          const materieData = materieDoc.data();
          const materieId = materieDoc.id;
          let needsUpdate = false;
          const updates = {};

          console.log(`🔍 Checking materie: ${materieData.nume} (ID: ${materieId})`);

          // Check and remove user from studentiInscrisi array
          if (materieData.studentiInscrisi && Array.isArray(materieData.studentiInscrisi)) {
            console.log(`  📋 Found ${materieData.studentiInscrisi.length} students in this materie`);
            
            // Log current students for debugging
            materieData.studentiInscrisi.forEach((student, index) => {
              console.log(`    Student ${index + 1}: ID = "${student.id}", Name = "${student.nume}"`);
              if (student.id === userId) {
                console.log(`    🎯 FOUND TARGET USER TO REMOVE!`);
              }
            });

            const originalLength = materieData.studentiInscrisi.length;
            const updatedStudenti = materieData.studentiInscrisi.filter(student => {
              const shouldKeep = student.id !== userId;
              if (!shouldKeep) {
                console.log(`    ❌ Removing student: ${student.nume} (ID: ${student.id})`);
                totalStudentsFound++;
              }
              return shouldKeep;
            });

            if (updatedStudenti.length !== originalLength) {
              updates.studentiInscrisi = updatedStudenti;
              needsUpdate = true;
              console.log(`  ✅ Will update studentiInscrisi: ${originalLength} -> ${updatedStudenti.length}`);
            } else {
              console.log(`  ⏭️ No changes needed for studentiInscrisi`);
            }
          } else {
            console.log(`  ⏭️ No studentiInscrisi array found`);
          }

          // Check and remove user from profesori array
          if (materieData.profesori && Array.isArray(materieData.profesori)) {
            console.log(`  👨‍🏫 Found ${materieData.profesori.length} professors in this materie`);
            
            // Log current professors for debugging
            materieData.profesori.forEach((profesor, index) => {
              console.log(`    Professor ${index + 1}: ID = "${profesor.id}", Name = "${profesor.nume}"`);
              if (profesor.id === userId) {
                console.log(`    🎯 FOUND TARGET USER TO REMOVE!`);
              }
            });

            const originalLength = materieData.profesori.length;
            const updatedProfesori = materieData.profesori.filter(profesor => {
              const shouldKeep = profesor.id !== userId;
              if (!shouldKeep) {
                console.log(`    ❌ Removing professor: ${profesor.nume} (ID: ${profesor.id})`);
                totalProfessorsFound++;
              }
              return shouldKeep;
            });

            if (updatedProfesori.length !== originalLength) {
              updates.profesori = updatedProfesori;
              needsUpdate = true;
              console.log(`  ✅ Will update profesori: ${originalLength} -> ${updatedProfesori.length}`);
            } else {
              console.log(`  ⏭️ No changes needed for profesori`);
            }
          } else {
            console.log(`  ⏭️ No profesori array found`);
          }

          // If updates are needed, execute them immediately
          if (needsUpdate) {
            console.log(`  💾 Updating materie: ${materieData.nume}`);
            await updateDoc(doc(db, 'materii', materieId), updates);
            materiiUpdated++;
            console.log(`  ✅ Successfully updated materie: ${materieData.nume}`);
          } else {
            console.log(`  ⏭️ No updates needed for materie: ${materieData.nume}`);
          }

        } catch (materieError) {
          console.error(`❌ Error processing materie ${materieDoc.id}:`, materieError);
          // Continue with other materii even if one fails
        }
      }

      console.log(`📊 Summary:`);
      console.log(`  - Materii updated: ${materiiUpdated}`);
      console.log(`  - Students removed: ${totalStudentsFound}`);
      console.log(`  - Professors removed: ${totalProfessorsFound}`);

      if (materiiUpdated > 0) {
        console.log(`✅ Successfully updated ${materiiUpdated} materii documents`);
      } else {
        console.log(`ℹ️ No materii documents needed updates`);
      }

    } catch (error) {
      console.error('❌ Error removing user from materii documents:', error);
      throw error;
    }
  };

  // Function to clean up user references from all other users' preference data
  const cleanupUserPreferences = async (userId) => {
    try {
      console.log(`Cleaning up preferences that reference user ${userId}...`);
      
      // Get all users to check for any preference references to the deleted user
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const updatePromises = [];
      let usersUpdated = 0;

      usersSnapshot.docs.forEach(userDoc => {
        if (userDoc.id === userId) {
          // Skip the user being deleted
          return;
        }

        const userData = userDoc.data();
        let needsUpdate = false;
        const updates = {};

        // Clean up any references in preferinteMateriiOptionale if they contain user IDs instead of materii IDs
        if (userData.preferinteMateriiOptionale && typeof userData.preferinteMateriiOptionale === 'object') {
          const cleanedPreferinte = {};
          let preferencesChanged = false;

          Object.keys(userData.preferinteMateriiOptionale).forEach(pachetId => {
            const preferinte = userData.preferinteMateriiOptionale[pachetId];
            if (Array.isArray(preferinte)) {
              // Remove any references to the deleted user ID
              const cleanedPreferinteArray = preferinte.filter(preferinta => preferinta !== userId);
              if (cleanedPreferinteArray.length !== preferinte.length) {
                preferencesChanged = true;
                console.log(`Found user reference in preferences of user: ${userData.nume} ${userData.prenume}`);
              }
              cleanedPreferinte[pachetId] = cleanedPreferinteArray;
            } else {
              cleanedPreferinte[pachetId] = preferinte;
            }
          });

          if (preferencesChanged) {
            updates.preferinteMateriiOptionale = cleanedPreferinte;
            needsUpdate = true;
          }
        }

        // Clean up materiiInscrise array if it contains references to the deleted user
        if (userData.materiiInscrise && Array.isArray(userData.materiiInscrise)) {
          const cleanedMateriiInscrise = userData.materiiInscrise.filter(materieId => materieId !== userId);
          if (cleanedMateriiInscrise.length !== userData.materiiInscrise.length) {
            updates.materiiInscrise = cleanedMateriiInscrise;
            needsUpdate = true;
            console.log(`Found user reference in materiiInscrise of user: ${userData.nume} ${userData.prenume}`);
          }
        }

        // Clean up any other fields that might reference the user
        ['pachetAlocat', 'prefPachet'].forEach(field => {
          if (userData[field] === userId) {
            updates[field] = null;
            needsUpdate = true;
            console.log(`Found user reference in ${field} of user: ${userData.nume} ${userData.prenume}`);
          }
        });

        // If updates are needed, add to promises array
        if (needsUpdate) {
          updatePromises.push(
            updateDoc(doc(db, 'users', userDoc.id), updates)
          );
          usersUpdated++;
        }
      });

      // Execute all updates
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Successfully cleaned up preferences in ${usersUpdated} user documents`);
      } else {
        console.log('No user preferences needed cleanup');
      }

    } catch (error) {
      console.error('Error cleaning up user preferences:', error);
      throw error;
    }
  };

  // Funcție pentru filtrarea utilizatorilor
  const getFilteredUsers = () => {
    return users.filter(user => {
      // Filtrare după tip utilizator
      if (filters.tip !== 'all' && user.tip !== filters.tip) return false;
      
      // Filtrare după facultate
      if (filters.facultate && (!user.facultate || user.facultate !== filters.facultate)) return false;
      
      // Filtrare după specializare
      if (filters.specializare && (!user.specializare || user.specializare !== filters.specializare)) return false;
      
      // Filtrare după an
      if (filters.an && (!user.an || user.an !== filters.an)) return false;

      // Filtrare după materie
      if (filters.materie && (!user.materiiInscrise || !user.materiiInscrise.includes(filters.materie))) return false;
      
      return true;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = () => {
    // Ascunde formularul și actualizează lista de utilizatori
    setShowCreateForm(false);
    fetchUsers();
  };

  // Actualizează rolul utilizatorului
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        tip: newRole
      });
      
      // Actualizează lista de utilizatori după modificare
      fetchUsers();
    } catch (error) {
      console.error('Eroare la actualizarea rolului:', error);
    }
  };

  // Actualizează specializarea utilizatorului
  const handleSpecializareChange = async (userId, newSpecializare) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        specializare: newSpecializare
      });
      
      // Actualizează lista de utilizatori după modificare
      fetchUsers();
    } catch (error) {
      console.error('Eroare la actualizarea specializării:', error);
    }
  };

  // Actualizează facultatea utilizatorului
  const handleFacultateChange = async (userId, newFacultate) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        facultate: newFacultate
      });
      
      // Actualizează lista de utilizatori după modificare
      fetchUsers();
    } catch (error) {
      console.error('Eroare la actualizarea facultății:', error);
    }
  };

  // Actualizează anul utilizatorului
  const handleAnChange = async (userId, newAn) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        an: newAn
      });
      
      // Actualizează lista de utilizatori după modificare
      fetchUsers();
    } catch (error) {
      console.error('Eroare la actualizarea anului:', error);
    }
  };

  // CSV Template Download
  const handleDownloadCSVTemplate = () => {
    const templateData = generateUserCSVTemplate();
    downloadCSV('template_utilizatori.csv', templateData);
  };

  // CSV Import Handler with rate limiting
  const handleCSVImport = async (usersData, onProgress = null) => {
    console.log(`Starting bulk user creation for ${usersData.length} users`);
    
    // Create operation function for each user
    const createUserOperation = async (userData, index) => {
      console.log(`Creating user ${index + 1}/${usersData.length}: ${userData.nume} ${userData.prenume}`);
      
      // Generate default password (user can change it later)
      const defaultPassword = 'TempPass123!';
      
      // Prepare user data for the createUser service
      const userDataForService = {
        email: userData.email.toLowerCase(),
        password: defaultPassword,
        nume: userData.nume,
        prenume: userData.prenume,
        tip: userData.tip,
        facultate: userData.facultate,
      };

      // Add type-specific data
      if (userData.tip === 'student') {
        userDataForService.specializare = userData.specializare;
        userDataForService.an = userData.an;
        userDataForService.anNastere = userData.anNastere;
      } else if (userData.tip === 'profesor') {
        userDataForService.functie = userData.functie || 'Profesor';
      }

      // Use the createUser service which handles secondary auth
      await createUser(userDataForService, []);
      
      return { success: true, user: userData };
    };

    try {
      // Execute with rate limiting and retry logic
      const results = await executeBatchedOperationsWithRetry(
        usersData, 
        createUserOperation,
        {
          batchSize: 3, // Small batch size to avoid rate limits
          delayBetweenBatches: 3000, // 3 seconds between batches
          delayBetweenItems: 1000, // 1 second between individual users
          maxRetries: 3, // Retry failed operations up to 3 times
          onProgress: onProgress, // Pass through the progress callback
          onBatchComplete: (batchInfo) => {
            console.log(`Completed batch ${batchInfo.batchNumber}/${batchInfo.totalBatches}`);
            console.log(`Success: ${batchInfo.successCount}, Errors: ${batchInfo.errorCount}`);
          }
        }
      );

      // Refresh users list
      await fetchUsers();
      
      console.log(`Bulk user creation completed!`);
      console.log(`Final results: ${results.success} successful, ${results.errors.length} failed`);
      
      return {
        success: results.success,
        errors: results.errors.map(error => `${error.item.nume} ${error.item.prenume}: ${error.error}`)
      };

    } catch (error) {
      console.error('Bulk user creation failed:', error);
      throw error;
    }
  };

  // Mass deletion function
  const handleMassDeleteAllUsers = async () => {
    try {
      console.log('Starting mass deletion of all users...');
      
      const response = await axios.post('http://localhost:5001/api/users/mass-delete');
      
      console.log('Mass deletion completed successfully');
      console.log('Response:', response.data);
      
      // Refresh the users list
      await fetchUsers();
      
      alert(`Ștergerea în masă a fost completată cu succes!\n\nDetalii:\n- Utilizatori șterși din Auth: ${response.data.authDeletedCount || 0}\n- Documente șterge din Firestore: ${response.data.firestoreDeletedCount || 0}`);
      
    } catch (error) {
      console.error('Mass deletion failed:', error);
      console.error('Server response:', error.response?.data);
      alert('Eroare la ștergerea în masă: ' + (error.response?.data?.message || error.message));
    }
  };

  // Helper function to get next matricol number
  const getNextMatricolNumber = async (specializare) => {
    try {
      const prefixMap = {
        'IR': 'I',
        'IG': 'G', 
        'MI': 'M',
        'MA': 'A'
      };

      const prefix = prefixMap[specializare];
      if (!prefix) return null;

      const q = query(
        collection(db, 'users'),
        where('specializare', '==', specializare)
      );
      const querySnapshot = await getDocs(q);
      
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

      const nextNumber = maxNumber + 1;
      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating matricol number:', error);
      return null;
    }
  };



  if (loading) {
    return <div>Loading...</div>;
  }

  const renderUserTable = (users) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <thead className="bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80">
          <tr>
            <th className="w-2/5 px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider">
              Nume
            </th>
            <th className="w-1/5 px-6 py-4 text-center text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider">
              Număr Matricol
            </th>
            <th className="w-1/5 px-6 py-4 text-center text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider">
              Tip
            </th>
            <th className="w-1/5 px-6 py-4 text-center text-xs font-semibold text-white dark:text-gray-900 uppercase tracking-wider">
              {/* Actions column - no title */}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map(user => (
            <tr 
              key={user.id} 
              className="group hover:bg-gradient-to-r hover:from-[#E3AB23]/10 hover:to-[#E3AB23]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 cursor-pointer transition-all duration-300"
              onClick={() => setSelectedUser(user)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-semibold text-[#024A76] dark:text-blue-light">{user.nume} {user.prenume}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700 dark:text-gray-300 font-medium">
                {user.numarMatricol || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  user.tip === 'student' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                  user.tip === 'profesor' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  user.tip === 'secretar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {user.tip}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingUser(user);
                      setShowUserModal(true);
                    }}
                    className="p-2 text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent hover:bg-[#024A76]/10 dark:hover:bg-blue-light/10 rounded-lg transition-all duration-200"
                    title="Editează utilizator"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id);
                    }}
                    className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Șterge utilizator"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFilters = () => (
    <div className="mb-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
          Filtre
        </h2>
        <button
          onClick={() => {
            setFilters({
              tip: 'all',
              facultate: '',
              specializare: '',
              an: '',
              materie: ''
            });
          }}
          className="text-sm text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-colors duration-200 font-medium"
        >
          Resetează filtrele
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
            Tip Utilizator
          </label>
          <select
            value={filters.tip}
            onChange={handleFilterChange}
            name="tip"
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
          >
            {tipuriUtilizatori.map(tip => (
              <option key={tip} value={tip}>
                {tip === 'all' ? 'Toți utilizatorii' : tip.charAt(0).toUpperCase() + tip.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {filters.tip === 'student' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
              <select
                value={filters.facultate}
                onChange={handleFilterChange}
                name="facultate"
                className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
              >
                <option value="">Toate facultățile</option>
                {facultati.map(fac => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
              <select
                value={filters.specializare}
                onChange={handleFilterChange}
                name="specializare"
                className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
                disabled={!filters.facultate}
              >
                <option value="">Toate specializările</option>
                {filters.facultate && specializari[filters.facultate]?.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
              <select
                value={filters.an}
                onChange={handleFilterChange}
                name="an"
                className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
              >
                <option value="">Toți anii</option>
                {ani.map(an => (
                  <option key={an} value={an}>{an}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {filters.tip === 'profesor' && (
          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Materie Predată</label>
            <select
              value={filters.materie}
              onChange={handleFilterChange}
              name="materie"
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            >
              <option value="">Toate materiile</option>
              {materiiList.map(materie => (
                <option key={materie.id} value={materie.id}>
                  {materie.nume} ({materie.facultate} - {materie.specializare})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
            Administrare Utilizatori
          </h1>
          <div className="flex space-x-3">
            {/* Mass Delete Button - DANGEROUS */}
            <button
              onClick={() => setShowMassDeleteModal(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-red-500 hover:border-red-600"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Șterge Toți Utilizatorii
            </button>

            {/* CSV Template Download Button */}
            <button
              onClick={handleDownloadCSVTemplate}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 font-semibold flex items-center"
              title="Descarcă template CSV pentru import utilizatori"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Template CSV
            </button>

            {/* CSV Import Button */}
            <button
              onClick={() => setShowCSVImportModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 font-semibold flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Import CSV
            </button>

            {/* Existing Add User Button */}
            <button
              onClick={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Adaugă Utilizator
            </button>
          </div>
        </div>

        {renderFilters()}

        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#024A76] dark:text-blue-light flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Lista Utilizatori
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total: {users.length} utilizatori
            </div>
          </div>
          
          {getFilteredUsers().length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Nu există utilizatori care să corespundă filtrelor</p>
            </div>
          ) : (
            renderUserTable(getFilteredUsers())
          )}
        </div>

        {selectedUser && (
          <UserDetailsModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}

        {showUserModal && (
          <AdminUserForm 
            onClose={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
            onUserCreated={handleFormSubmit}
            editingUser={editingUser}
            onRoleChange={handleRoleChange}
            onSpecializareChange={handleSpecializareChange}
            onFacultateChange={handleFacultateChange}
            onAnChange={handleAnChange}
          />
        )}

        {showCSVImportModal && (
          <CSVImportModal 
            onClose={() => setShowCSVImportModal(false)}
            onImport={handleCSVImport}
          />
        )}

        {showMassDeleteModal && (
          <MassDeleteModal 
            isOpen={showMassDeleteModal}
            onClose={() => setShowMassDeleteModal(false)}
            onConfirm={handleMassDeleteAllUsers}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
