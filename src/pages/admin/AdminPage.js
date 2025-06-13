import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../providers/AuthProvider';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import AdminUserForm from '../../components/AdminUserForm';
import UserDetailsModal from '../../components/UserDetailsModal';
import { isAdmin } from '../../utils/userRoles';
import { useMaterii } from '../../contexts/MateriiContext';
import axios from 'axios';

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
        console.log(`🚀 Starting comprehensive deletion for user: ${userId}`);
        
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
      console.log(`🔍 Starting removal of user ${userId} from all materii documents...`);
      
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Acces Interzis</h2>
        <p className="mt-2 text-gray-600">Nu aveți permisiunea de a accesa această pagină.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-[#034a76] text-[#f5f5f5] rounded hover:bg-[#023557]"
        >
          Înapoi la Home
        </button>
      </div>
    );
  }

  const renderUserTable = (users) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-[#f5f5f5] rounded-lg overflow-hidden shadow-lg border border-[#034a76]/20">
        <thead className="bg-[#034a76] text-[#f5f5f5]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Nume
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Tip
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Acțiuni
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#034a76]/10">
          {users.map(user => (
            <tr 
              key={user.id} 
              className="hover:bg-[#e3ab23]/10 cursor-pointer transition-colors"
              onClick={() => setSelectedUser(user)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-[#034a76]">
                {user.nume} {user.prenume}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[#034a76]/80">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap capitalize text-[#034a76]">
                {user.tip}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Previne propagarea click-ului
                    setEditingUser(user);
                    setShowUserModal(true);
                  }}
                  className="text-[#034a76] hover:text-[#023557] mr-4"
                >
                  Editează
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Previne propagarea click-ului
                    handleDeleteUser(user.id);
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  Șterge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFilters = () => (
    <div className="mb-6 bg-[#f5f5f5] p-4 rounded-lg shadow border border-[#034a76]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#034a76]">Filtre</h2>
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
          className="text-sm text-[#034a76] hover:text-[#023557]"
        >
          Resetează filtrele
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#034a76] mb-1">
            Tip Utilizator
          </label>
          <select
            value={filters.tip}
            onChange={handleFilterChange}
            name="tip"
            className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
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
              <label className="block text-sm font-medium text-[#034a76] mb-1">Facultate</label>
              <select
                value={filters.facultate}
                onChange={handleFilterChange}
                name="facultate"
                className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
              >
                <option value="">Toate facultățile</option>
                {facultati.map(fac => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#034a76] mb-1">Specializare</label>
              <select
                value={filters.specializare}
                onChange={handleFilterChange}
                name="specializare"
                className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
                disabled={!filters.facultate}
              >
                <option value="">Toate specializările</option>
                {filters.facultate && specializari[filters.facultate]?.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#034a76] mb-1">An</label>
              <select
                value={filters.an}
                onChange={handleFilterChange}
                name="an"
                className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
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
            <label className="block text-sm font-medium text-[#034a76] mb-1">Materie Predată</label>
            <select
              value={filters.materie}
              onChange={handleFilterChange}
              name="materie"
              className="w-full rounded-md border-[#034a76]/30 shadow-sm focus:border-[#034a76] focus:ring-[#034a76]"
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#034a76]">Administrare Utilizatori</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowUserModal(true);
          }}
          className="px-4 py-2 bg-[#034a76] text-[#f5f5f5] rounded hover:bg-[#023557] transition-colors"
        >
          + Adaugă Utilizator
        </button>
      </div>

      {renderFilters()}

      {renderUserTable(getFilteredUsers())}

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
    </div>
  );
};

export default AdminPage;
