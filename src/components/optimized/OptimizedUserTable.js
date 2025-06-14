/**
 * Optimized User Table with virtualization and performance improvements
 */
import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { searchUsers, filterUsers } from '../../utils/userUtils';

// Memoized user row component
const UserRow = memo(({ index, style, data }) => {
  const { users, onEditUser, onDeleteUser, onUpdateField } = data;
  const user = users[index];

  const handleEdit = useCallback(() => {
    onEditUser(user);
  }, [user, onEditUser]);

  const handleDelete = useCallback(() => {
    onDeleteUser(user.id);
  }, [user.id, onDeleteUser]);

  const handleFieldUpdate = useCallback((field, value) => {
    onUpdateField(user.id, field, value);
  }, [user.id, onUpdateField]);

  if (!user) return null;

  return (
    <div style={style} className="flex items-center border-b border-gray-200 hover:bg-gray-50 px-4">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {user.prenume?.[0]}{user.nume?.[0]}
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0 ml-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {user.prenume} {user.nume}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            user.tip === 'admin' ? 'bg-red-100 text-red-800' :
            user.tip === 'profesor' ? 'bg-blue-100 text-blue-800' :
            user.tip === 'student' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.tip}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{user.email}</p>
        {user.facultate && (
          <p className="text-xs text-gray-400 truncate">{user.facultate}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2">
        {/* Quick edit fields for common updates */}
        {user.tip === 'student' && (
          <select
            value={user.an || ''}
            onChange={(e) => handleFieldUpdate('an', e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="">An</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
          </select>
        )}
        
        <button
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Edit
        </button>
        
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Delete
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
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredCount} of {totalUsers} users
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.tip || ''}
          onChange={(e) => handleFilterChange('tip', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          <option value="student">Students</option>
          <option value="profesor">Professors</option>
          <option value="secretar">Secretaries</option>
        </select>

        <select
          value={filters.facultate || ''}
          onChange={(e) => handleFilterChange('facultate', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Faculties</option>
          <option value="Facultatea de Matematica si Informatica">Math & CS</option>
          <option value="Facultatea de Fizica">Physics</option>
        </select>

        <select
          value={filters.specializare || ''}
          onChange={(e) => handleFilterChange('specializare', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Specializations</option>
          <option value="IR">IR</option>
          <option value="IE">IE</option>
          <option value="IA">IA</option>
          <option value="ID">ID</option>
        </select>

        <select
          value={filters.an || ''}
          onChange={(e) => handleFilterChange('an', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Years</option>
          <option value="I">Year I</option>
          <option value="II">Year II</option>
          <option value="III">Year III</option>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        totalUsers={users.length}
        filteredCount={filteredUsers.length}
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="h-96">
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