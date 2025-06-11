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

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      
      const admins = usersData.filter(user => user.email?.endsWith('@admin.com'));
      const regularUsers = usersData.filter(user => !user.email?.endsWith('@admin.com'));
      
      setAdminUsers(admins);
      setUsers(regularUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Sigur doriți să ștergeți acest utilizator?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers(); // Reîncarcă lista după ștergere
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Eroare la ștergerea utilizatorului');
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      fetchUsers(); // Reîncarcă lista după actualizare
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Eroare la actualizarea rolului');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Use context data instead of separate Firebase call
  useEffect(() => {
    if (!materiiLoading && allMaterii) {
      const materiiData = Object.values(allMaterii).map(materie => ({
        id: materie.id,
        ...materie
      }));
      setMateriiList(materiiData);
    }
  }, [allMaterii, materiiLoading]);

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const adminAccess = isAdmin(user);
        setHasAccess(adminAccess);
      }
    };

    checkAccess();
  }, [user]);

  // Funcție pentru filtrarea utilizatorilor
  const getFilteredUsers = () => {
    return users.filter(user => {
      if (filters.tip !== 'all' && user.tip !== filters.tip) return false;
      
      if (user.tip === 'student') {
        if (filters.facultate && user.facultate !== filters.facultate) return false;
        if (filters.specializare && user.specializare !== filters.specializare) return false;
        if (filters.an && user.an !== filters.an) return false;
      }
      
      if (user.tip === 'profesor' && filters.materie) {
        // Verificăm dacă profesorul predă materia selectată
        return user.materiiPredate?.some(materie => materie.id === filters.materie);
      }
      
      return true;
    });
  };

  // Funcție pentru resetarea filtrelor
  const resetFilters = () => {
    setFilters({
      tip: 'all',
      facultate: '',
      specializare: '',
      an: '',
      materie: ''
    });
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
          onClick={resetFilters}
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
            onChange={(e) => {
              setFilters({
                tip: e.target.value,
                facultate: '',
                specializare: '',
                an: '',
                materie: ''
              });
            }}
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
                onChange={(e) => setFilters(prev => ({ ...prev, facultate: e.target.value, specializare: '' }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, specializare: e.target.value }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, an: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, materie: e.target.value }))}
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
          onUserCreated={() => {
            setShowUserModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
          editingUser={editingUser}
        />
      )}
    </div>
  );
};

export default AdminPage;
