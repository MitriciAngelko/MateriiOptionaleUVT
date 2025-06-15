/**
 * Optimized User Table with virtualization and performance improvements
 */
import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { searchUsers, filterUsers } from '../../utils/userUtils';

// Memoized user row component
const UserRow = memo(({ index, style, data }) => {
  const { users, onEditUser, onDeleteUser } = data;
  const user = users[index];

  const handleEdit = useCallback(() => {
    onEditUser(user);
  }, [user, onEditUser]);

  const handleDelete = useCallback(() => {
    onDeleteUser(user.id);
  }, [user.id, onDeleteUser]);

  if (!user) return null;

  return (
    <div style={style} className="flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-4 transition-colors duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent flex items-center justify-center text-white dark:text-blue-dark font-semibold shadow-md">
          {user.prenume?.[0]}{user.nume?.[0]}
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0 ml-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.prenume} {user.nume}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            user.tip === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            user.tip === 'profesor' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
            user.tip === 'student' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            user.tip === 'secretar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
          }`}>
            {user.tip}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        {user.facultate && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.facultate}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleEdit}
          className="p-2 text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent hover:bg-[#024A76]/10 dark:hover:bg-blue-light/10 rounded-lg transition-all duration-200 group"
          title="Editează utilizator"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          onClick={handleDelete}
          className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
          title="Șterge utilizator"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

UserRow.displayName = 'UserRow';

// Memoized search and filter component
const UserFilters = memo(({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange,
  onResetFilters,
  totalUsers,
  filteredCount 
}) => {
  const handleSearchChange = useCallback((e) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleFilterChange = useCallback((field, value) => {
    onFilterChange({ ...filters, [field]: value });
  }, [filters, onFilterChange]);

  return (
    <div className="bg-white dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Caută utilizatori..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
          />
        </div>
        <button
          onClick={onResetFilters}
          className="px-3 py-2 text-sm text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent hover:bg-[#024A76]/10 dark:hover:bg-blue-light/10 rounded-lg transition-all duration-200 font-medium border border-[#024A76]/30 dark:border-blue-light/30 hover:border-[#024A76]/50 dark:hover:border-blue-light/50"
        >
          Resetează filtrele
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.tip || ''}
          onChange={(e) => handleFilterChange('tip', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          <option value="">Toate tipurile</option>
          <option value="student">Studenți</option>
          <option value="profesor">Profesori</option>
          <option value="secretar">Secretari</option>
        </select>

        <select
          value={filters.facultate || ''}
          onChange={(e) => handleFilterChange('facultate', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          <option value="">Toate facultățile</option>
          <option value="Facultatea de Matematica si Informatica">Matematică și Informatică</option>
          <option value="Facultatea de Fizica">Fizică</option>
        </select>

        <select
          value={filters.specializare || ''}
          onChange={(e) => handleFilterChange('specializare', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          <option value="">Toate specializările</option>
          <option value="IR">IR</option>
          <option value="IE">IE</option>
          <option value="IA">IA</option>
          <option value="ID">ID</option>
        </select>

        <select
          value={filters.an || ''}
          onChange={(e) => handleFilterChange('an', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          <option value="">Toți anii</option>
          <option value="I">Anul I</option>
          <option value="II">Anul II</option>
          <option value="III">Anul III</option>
        </select>
      </div>
    </div>
  );
});

UserFilters.displayName = 'UserFilters';

// Main optimized user table component
const OptimizedUserTable = memo(({ 
  users = [], 
  onEditUser, 
  onDeleteUser, 
  onUpdateField,
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Memoized filtered and searched users
  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply filters
    result = filterUsers(result, filters);

    // Apply search
    if (searchTerm.trim()) {
      result = searchUsers(result, searchTerm);
    }

    return result;
  }, [users, filters, searchTerm]);

  // Memoized row data for react-window
  const rowData = useMemo(() => ({
    users: filteredUsers,
    onEditUser,
    onDeleteUser,
    onUpdateField
  }), [filteredUsers, onEditUser, onDeleteUser, onUpdateField]);

  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800/50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#024A76] dark:border-blue-light mx-auto mb-3"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300 font-medium">Se încarcă utilizatorii...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalUsers={users.length}
        filteredCount={filteredUsers.length}
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800/30">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Nu s-au găsit utilizatori</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Încearcă să modifici filtrele de căutare</p>
        </div>
      ) : (
        <div className="h-96 bg-white dark:bg-gray-800/30">
          <List
            height={384} // 96 * 4 (24rem)
            itemCount={filteredUsers.length}
            itemSize={80}
            itemData={rowData}
          >
            {UserRow}
          </List>
        </div>
      )}
    </div>
  );
});

OptimizedUserTable.displayName = 'OptimizedUserTable';

export default OptimizedUserTable; 