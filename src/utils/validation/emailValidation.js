/**
 * Validates student email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid student email format
 */
export const validateStudentEmail = (email) => {
  const studentEmailPattern = /^[a-z]+\.[a-z]+[0-9]{2}@e-uvt\.ro$/;
  return studentEmailPattern.test(email.toLowerCase());
};

/**
 * Validates professor email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid professor email format
 */
export const validateProfesorEmail = (email) => {
  const profesorEmailPattern = /^[a-z]+\.[a-z]+@e-uvt\.ro$/;
  return profesorEmailPattern.test(email.toLowerCase());
};

/**
 * Validates email format based on user type
 * @param {string} email - Email to validate
 * @param {string} userType - Type of user (student, profesor)
 * @returns {boolean} - True if valid email format for user type
 */
export const validateEmailByUserType = (email, userType) => {
  switch (userType) {
    case 'student':
      return validateStudentEmail(email);
    case 'profesor':
      return validateProfesorEmail(email);
    default:
      return email.includes('@');
  }
}; 