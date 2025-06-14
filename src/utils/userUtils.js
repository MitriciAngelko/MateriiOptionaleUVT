/**
 * Utility functions for user operations with performance optimizations
 */

/**
 * Efficiently search users by multiple criteria
 * @param {Array} users - Array of user objects
 * @param {string} searchTerm - Search term
 * @returns {Array} - Filtered users
 */
export const searchUsers = (users, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') return users;
  
  const term = searchTerm.toLowerCase().trim();
  
  return users.filter(user => {
    const searchableFields = [
      user.nume?.toLowerCase(),
      user.prenume?.toLowerCase(),
      user.email?.toLowerCase(),
      user.numarMatricol?.toLowerCase(),
      user.facultate?.toLowerCase(),
      user.specializare?.toLowerCase()
    ].filter(Boolean);

    return searchableFields.some(field => field.includes(term));
  });
};

/**
 * Filter users by various criteria
 * @param {Array} users - Array of user objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered users
 */
export const filterUsers = (users, filters) => {
  if (!filters || Object.keys(filters).length === 0) return users;

  return users.filter(user => {
    // Type filter
    if (filters.tip && filters.tip !== '' && user.tip !== filters.tip) {
      return false;
    }

    // Faculty filter
    if (filters.facultate && filters.facultate !== '' && user.facultate !== filters.facultate) {
      return false;
    }

    // Specialization filter
    if (filters.specializare && filters.specializare !== '' && user.specializare !== filters.specializare) {
      return false;
    }

    // Year filter
    if (filters.an && filters.an !== '' && user.an !== filters.an) {
      return false;
    }

    // Status filter (if implemented)
    if (filters.status && filters.status !== '' && user.status !== filters.status) {
      return false;
    }

    return true;
  });
};

/**
 * Sort users by multiple criteria
 * @param {Array} users - Array of user objects
 * @param {string} sortBy - Field to sort by
 * @param {string} sortDirection - 'asc' or 'desc'
 * @returns {Array} - Sorted users
 */
export const sortUsers = (users, sortBy = 'nume', sortDirection = 'asc') => {
  return [...users].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Convert to string for comparison
    aValue = String(aValue).toLowerCase();
    bValue = String(bValue).toLowerCase();

    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
};

/**
 * Get user statistics for dashboard
 * @param {Array} users - Array of user objects
 * @returns {Object} - Statistics object
 */
export const getUserStats = (users) => {
  const stats = {
    total: users.length,
    byType: {},
    byFaculty: {},
    byYear: {},
    recentlyCreated: 0
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  users.forEach(user => {
    // Count by type
    if (user.tip) {
      stats.byType[user.tip] = (stats.byType[user.tip] || 0) + 1;
    }

    // Count by faculty
    if (user.facultate) {
      stats.byFaculty[user.facultate] = (stats.byFaculty[user.facultate] || 0) + 1;
    }

    // Count by year (for students)
    if (user.tip === 'student' && user.an) {
      stats.byYear[user.an] = (stats.byYear[user.an] || 0) + 1;
    }

    // Count recently created
    if (user.createdAt && user.createdAt > oneWeekAgo) {
      stats.recentlyCreated++;
    }
  });

  return stats;
};

/**
 * Validate user data before operations
 * @param {Object} userData - User data to validate
 * @returns {Object} - Validation result with errors
 */
export const validateUserData = (userData) => {
  const errors = [];

  // Required fields
  if (!userData.nume?.trim()) {
    errors.push('Numele este obligatoriu');
  }

  if (!userData.prenume?.trim()) {
    errors.push('Prenumele este obligatoriu');
  }

  if (!userData.email?.trim()) {
    errors.push('Email-ul este obligatoriu');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Email-ul nu este valid');
  }

  if (!userData.tip) {
    errors.push('Tipul utilizatorului este obligatoriu');
  }

  // Type-specific validation
  if (userData.tip === 'student') {
    if (!userData.facultate) {
      errors.push('Facultatea este obligatorie pentru studenți');
    }
    if (!userData.specializare) {
      errors.push('Specializarea este obligatorie pentru studenți');
    }
    if (!userData.an) {
      errors.push('Anul de studiu este obligatoriu pentru studenți');
    }
    if (!userData.anNastere) {
      errors.push('Anul nașterii este obligatoriu pentru studenți');
    }
  }

  if (userData.tip === 'profesor') {
    if (!userData.facultate) {
      errors.push('Facultatea este obligatorie pentru profesori');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate user display name
 * @param {Object} user - User object
 * @returns {string} - Display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return '';
  
  const parts = [];
  if (user.prenume) parts.push(user.prenume);
  if (user.nume) parts.push(user.nume);
  
  return parts.join(' ') || user.email || 'Unknown User';
};

/**
 * Get user initials for avatar
 * @param {Object} user - User object
 * @returns {string} - User initials
 */
export const getUserInitials = (user) => {
  if (!user) return '??';
  
  const firstName = user.prenume?.charAt(0)?.toUpperCase() || '';
  const lastName = user.nume?.charAt(0)?.toUpperCase() || '';
  
  if (firstName && lastName) {
    return firstName + lastName;
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase() + (user.email.charAt(1) || '').toUpperCase();
  }
  
  return '??';
};

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}; 