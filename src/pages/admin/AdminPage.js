import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../providers/AuthProvider';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import AdminUserForm from '../../components/AdminUserForm';
import UserDetailsModal from '../../components/UserDetailsModal';
import CSVImportModal from '../../components/CSVImportModal';
import MassDeleteModal from '../../components/MassDeleteModal';
import OptimizedUserTable from '../../components/optimized/OptimizedUserTable';
import { isAdmin, isSecretar } from '../../utils/userRoles';
import { useMaterii } from '../../contexts/MateriiContext';
import { generateUserCSVTemplate, downloadCSV } from '../../utils/csvUtils';
import { createUser } from '../../services/userService';
import { optimizedFirebaseService } from '../../services/optimizedFirebaseService';
import axios from 'axios';
import { executeBatchedOperationsWithRetry } from '../../utils/rateLimiter';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminPage = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
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
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const { allMaterii, loading: materiiLoading } = useMaterii();

  const facultati = [
    "Facultatea de Matematica si Informatica",
    "Facultatea de Fizica",
    // ... alte facultăți
  ];

  const specializari = {
    "Facultatea de Matematica si Informatica": ["IR", "IE", "IA", "ID"],
    // ... alte specializări
  };

  const ani = ["I", "II", "III"];
  const tipuriUtilizatori = ["all", "student", "profesor", "secretar"];
  
  // Optimized fetch users function with caching and loading states
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      
      // Verifică dacă utilizatorul este admin sau secretar
      const adminAccess = await isAdmin(user.uid);
      const secretarAccess = !adminAccess ? await isSecretar(user.uid) : false;

      if (!adminAccess && !secretarAccess) {
        navigate('/');
        return;
      }

      // Use optimized Firebase service with caching
      const usersData = await optimizedFirebaseService.getPaginatedCollection('users', {
        pageSize: 100, // Load first 100 users
        filters: [] // Add filters as needed
      });

      // Filtrăm utilizatorii (exclude admin accounts)
      const filteredUsers = usersData
        .filter(u => !u.email?.endsWith('@admin.com') && u.tip !== 'admin')
        .map(user => ({
          ...user,
          createdAt: user.createdAt?.toDate?.() || new Date(),
        }));
      
      setUsers(filteredUsers);

      // Obține lista de materii pentru dropdown-ul de filtrare
      const materiiDropdown = Object.values(allMaterii || {}).map(materie => ({
        id: materie.id,
        nume: materie.nume
      }));
      setMateriiList(materiiDropdown);
    } catch (error) {
      console.error('Eroare la încărcarea utilizatorilor:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [user, allMaterii, navigate]);

  useEffect(() => {
    if (user?.uid && !materiiLoading) {
      fetchUsers();
    }
  }, [user, allMaterii, materiiLoading, fetchUsers]);

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
        console.log(' Step 1 completed: User removed from materii documents');

        // 2. Clean up user references from other users' preference data
        console.log('🎯 Step 2: Cleaning up user references from other users');
        await cleanupUserPreferences(userId);
        console.log(' Step 2 completed: User references cleaned up');

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
      console.log(`Found ${materiiSnapshot.docs.length} materii documents to check`);
      
      let materiiUpdated = 0;

      // Process each materie document individually to catch individual errors
      for (const materieDoc of materiiSnapshot.docs) {
        try {
          const materieData = materieDoc.data();
          const materieId = materieDoc.id;
          let needsUpdate = false;
          const updates = {};

          console.log(` Checking materie: ${materieData.nume} (ID: ${materieId})`);

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
                console.log(`     Removing student: ${student.nume} (ID: ${student.id})`);
              }
              return shouldKeep;
            });

            if (updatedStudenti.length !== originalLength) {
              updates.studentiInscrisi = updatedStudenti;
              needsUpdate = true;
              console.log(`   Will update studentiInscrisi: ${originalLength} -> ${updatedStudenti.length}`);
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
                console.log(`     Removing professor: ${profesor.nume} (ID: ${profesor.id})`);
              }
              return shouldKeep;
            });

            if (updatedProfesori.length !== originalLength) {
              updates.profesori = updatedProfesori;
              needsUpdate = true;
              console.log(`   Will update profesori: ${originalLength} -> ${updatedProfesori.length}`);
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
            console.log(`   Successfully updated materie: ${materieData.nume}`);
          } else {
            console.log(`  ⏭️ No updates needed for materie: ${materieData.nume}`);
          }

        } catch (materieError) {
          console.error(` Error processing materie ${materieDoc.id}:`, materieError);
          // Continue with other materii even if one fails
        }
      }

      console.log(`📊 Summary:`);
      console.log(`  - Materii updated: ${materiiUpdated}`);

      if (materiiUpdated > 0) {
        console.log(` Successfully updated ${materiiUpdated} materii documents`);
      } else {
        console.log(`ℹ️ No materii documents needed updates`);
      }

    } catch (error) {
      console.error(' Error removing user from materii documents:', error);
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
  // Memoized filtered users to prevent unnecessary recalculations
  const getFilteredUsers = useMemo(() => {
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
  }, [users, filters]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleFormSubmit = () => {
    // Ascunde formularul și actualizează lista de utilizatori
    setShowUserModal(false);
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
      const defaultPassword = '123456';
      
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

  // Development helper to reset rate limiter
  const resetRateLimit = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.token) {
        throw new Error('User not authenticated');
      }

      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      
      const response = await axios.post(`${apiBaseUrl}/users/reset-rate-limit`, {}, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      console.log('Rate limiter reset successfully:', response.data);
      alert('Rate limiter resetat cu succes! Puteți încerca din nou ștergerea în masă.');
      
    } catch (error) {
      console.error('Failed to reset rate limiter:', error);
      alert('Eroare la resetarea rate limiter-ului: ' + (error.response?.data?.message || error.message));
    }
  };

  // Expose reset function globally for development console access
  if (process.env.NODE_ENV === 'development') {
    window.resetMassDeleteRateLimit = resetRateLimit;
  }

  // Mass deletion function
  const handleMassDeleteAllUsers = async () => {
    try {
      console.log('Starting mass deletion of all users...');
      
      // Get the current user token for authentication
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.token) {
        throw new Error('User not authenticated');
      }

      // Use the same API base URL pattern as other endpoints
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      console.log(`Attempting mass deletion via API: ${apiBaseUrl}/users/mass-delete`);

      const response = await axios.post(`${apiBaseUrl}/users/mass-delete`, {}, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        },
        timeout: 30000 // 30 seconds timeout for mass operations
      });
      
      console.log('Mass deletion completed successfully');
      console.log('Response:', response.data);
      
      // Refresh the users list
      await fetchUsers();
      
      const message = `Ștergerea în masă a fost completată cu succes!\n\nDetalii:\n- Utilizatori șterși din Auth: ${response.data.authDeletedCount || 0}\n- Documente șterge din Firestore: ${response.data.firestoreDeletedCount || 0}\n- Conturi protejate (păstrate): ${response.data.skippedCount || 0}\n- Materii curățate: ${response.data.materiiUpdatedCount || 0}${response.data.protectedEmails ? `\n- Email-uri protejate: ${response.data.protectedEmails.join(', ')}` : ''}`;
      
      alert(message);
      
    } catch (error) {
      console.error('Mass deletion failed:', error);
      console.error('Server response:', error.response?.data);
      
      if (error.response?.status === 401) {
        alert('Eroare de autentificare. Vă rugăm să vă autentificați din nou.');
      } else if (error.response?.status === 403) {
        alert('Nu aveți permisiunile necesare pentru această operație.');
      } else if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 3600;
        const retryMinutes = Math.ceil(retryAfter / 60);
        alert(`Ștergerea în masă este limitată la o operație pe oră pentru securitate.\n\nÎncercați din nou în aproximativ ${retryMinutes} minute.\n\nPentru dezvoltare, puteți reseta limita folosind endpoint-ul /api/users/reset-rate-limit`);
      } else {
        alert('Eroare la ștergerea în masă: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

    // Legacy table renderer removed - replaced with OptimizedUserTable



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Mobile-First Header */}
        <div className="mb-6 sm:mb-8">
          {/* Title */}
          <div className="text-center sm:text-left mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
              Administrare Utilizatori
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 sm:hidden">
              Gestionează utilizatorii platformei
            </p>
          </div>
          
          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            {/* Primary Actions Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-2 sm:mb-0">
              {/* Add User Button - Most Important Action */}
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="group relative px-4 py-3 sm:py-2 bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-blue-light/10 dark:to-blue-light/5 hover:from-[#E3AB23]/20 hover:to-[#E3AB23]/10 dark:hover:from-blue-light/20 dark:hover:to-blue-light/10 text-[#024A76] dark:text-blue-light hover:text-[#024A76] dark:hover:text-white rounded-lg font-medium transition-all duration-200 border border-[#E3AB23]/30 dark:border-blue-light/30 hover:border-[#E3AB23]/50 dark:hover:border-blue-light/50 hover:shadow-md flex items-center justify-center sm:justify-start flex-1 sm:flex-none"
                title="Adaugă utilizator nou"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Adaugă Utilizator</span>
              </button>
            </div>

            {/* Secondary Actions Row */}
            <div className={`grid grid-cols-1 ${process.env.NODE_ENV === 'development' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
              {/* CSV Template Download Button */}
              <button
                onClick={handleDownloadCSVTemplate}
                className="group relative px-3 py-2.5 sm:py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg font-medium transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md flex items-center justify-center sm:justify-start"
                title="Descarcă template CSV pentru import utilizatori"
              >
                <svg className="w-4 h-4 mr-2 sm:mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Template CSV</span>
              </button>

              {/* CSV Import Button */}
              <button
                onClick={() => setShowCSVImportModal(true)}
                className="group relative px-3 py-2.5 sm:py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg font-medium transition-all duration-200 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md flex items-center justify-center sm:justify-start"
                title="Importă utilizatori din fișier CSV"
              >
                <svg className="w-4 h-4 mr-2 sm:mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Import CSV</span>
              </button>

              {/* Mass Delete Button - DANGEROUS */}
              <button
                onClick={() => setShowMassDeleteModal(true)}
                className="group relative px-3 py-2.5 sm:py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg font-medium transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md flex items-center justify-center sm:justify-start"
                title="Șterge toți utilizatorii"
              >
                <svg className="w-4 h-4 mr-2 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">Șterge Toți</span>
              </button>

              {/* Development Only: Reset Rate Limiter Button */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={resetRateLimit}
                  className="group relative px-3 py-2.5 sm:py-2 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 rounded-lg font-medium transition-all duration-200 border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-md flex items-center justify-center sm:justify-start"
                  title="Reset Mass Delete Rate Limiter (Development Only)"
                >
                  <svg className="w-4 h-4 mr-2 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm">Reset Limit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          {/* Mobile-First Content Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[#024A76] dark:text-blue-light flex items-center mb-2 sm:mb-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Lista Utilizatori
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
              Total: <span className="font-semibold">{users.length}</span> utilizatori
            </div>
          </div>
          
          {usersLoading ? (
            <SkeletonLoader.UserTable />
          ) : getFilteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-base sm:text-lg px-4">
                Nu există utilizatori care să corespundă filtrelor
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 px-4">
                Încearcă să modifici filtrele sau să adaugi utilizatori noi
              </p>
            </div>
          ) : (
            <OptimizedUserTable
              users={getFilteredUsers}
              onEditUser={(user) => {
                setEditingUser(user);
                setShowUserModal(true);
              }}
              onDeleteUser={handleDeleteUser}
              onUpdateField={async (userId, field, value) => {
                try {
                  const userRef = doc(db, 'users', userId);
                  await updateDoc(userRef, { [field]: value });
                  await fetchUsers(); // Refresh the list
                } catch (error) {
                  console.error('Error updating user field:', error);
                }
              }}
              loading={usersLoading}
            />
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
