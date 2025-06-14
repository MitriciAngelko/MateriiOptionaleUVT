/**
 * Input validation schemas and utilities
 */

// Email validation patterns
const EMAIL_PATTERNS = {
  admin: /^.+@admin\.com$/,
  student: /^[a-z]+\.[a-z]+[0-9]{2}@e-uvt\.ro$/i,
  professor: /^[a-z]+\.[a-z]+@e-uvt\.ro$/i
};

/**
 * Validates user creation data
 * @param {Object} data - User data to validate
 * @returns {Object} - { isValid: boolean, errors: string[], role: string }
 */
const validateUserCreation = (data) => {
  const errors = [];
  let role = 'user';

  // Required fields
  if (!data.uid || typeof data.uid !== 'string' || data.uid.trim().length === 0) {
    errors.push('uid is required and must be a non-empty string');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
    errors.push('email is required and must be a non-empty string');
  }

  // Email format validation
  if (data.email) {
    const email = data.email.toLowerCase().trim();
    
    if (EMAIL_PATTERNS.admin.test(email)) {
      role = 'admin';
    } else if (EMAIL_PATTERNS.student.test(email)) {
      role = 'student';
    } else if (EMAIL_PATTERNS.professor.test(email)) {
      role = 'professor';
    } else if (!email.includes('@')) {
      errors.push('email must be a valid email address');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    role,
    sanitizedData: {
      uid: data.uid?.trim(),
      email: data.email?.toLowerCase().trim()
    }
  };
};

/**
 * Validates student media (grade) update
 * @param {Object} data - Data containing media
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateStudentMedia = (data) => {
  const errors = [];

  if (data.media === undefined || data.media === null) {
    errors.push('media is required');
  } else if (typeof data.media !== 'number') {
    errors.push('media must be a number');
  } else if (data.media < 0 || data.media > 10) {
    errors.push('media must be between 0 and 10');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates UID parameter
 * @param {string} uid - User ID to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateUID = (uid) => {
  const errors = [];

  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    errors.push('uid is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes user profile update data by removing protected fields
 * @param {Object} data - Raw update data
 * @returns {Object} - Sanitized data
 */
const sanitizeUserProfileUpdate = (data) => {
  const { uid, role, email, createdAt, ...allowedFields } = data;
  return allowedFields;
};

module.exports = {
  validateUserCreation,
  validateStudentMedia,
  validateUID,
  sanitizeUserProfileUpdate,
  EMAIL_PATTERNS
}; 