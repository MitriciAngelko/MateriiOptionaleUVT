import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../providers/AuthProvider';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import AdminUserForm from '../../components/admin/AdminUserForm';
import UserDetailsModal from '../../components/UserDetailsModal';
import { isAdmin } from '../../utils/userRoles';
import { useMaterii } from '../../contexts/MateriiContext';

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
    if (window.confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers(); // Actualizează lista după ștergere
      } catch (error) {
        console.error('Eroare la ștergerea utilizatorului:', error);
      }
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
