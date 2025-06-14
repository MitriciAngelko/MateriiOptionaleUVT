// services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to make API calls with proper error handling
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// User API functions
export const createUser = async (token, userData = {}) => {
  return apiCall('/users/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(userData)
  });
};

export const updateUserProfile = async (token, uid, userData) => {
  return apiCall(`/users/${uid}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(userData)
  });
};

export const updateStudentMedia = async (token, uid, media) => {
  return apiCall(`/users/${uid}/media`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ media })
  });
};

export const getUserInfo = async (token, uid) => {
  return apiCall(`/users/${uid}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

// Enrollment API functions
export const processEnrollment = async (token, pachetId) => {
  return apiCall(`/enrollment/process/${pachetId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const setEnrollmentPeriod = async (token, pachetId, periodData) => {
  return apiCall(`/enrollment/period/${pachetId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(periodData)
  });
};

export const getStudentPreferences = async (token, studentId, pachetId) => {
  return apiCall(`/enrollment/preferences/${studentId}/${pachetId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const setStudentPreferences = async (token, studentId, pachetId, preferinte) => {
  return apiCall(`/enrollment/preferences/${studentId}/${pachetId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ preferinte })
  });
};

export const getEnrollmentStatus = async (token, pachetId) => {
  return apiCall(`/enrollment/status/${pachetId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

// CV API functions (keeping existing functionality)
export const createCV = async (token, cvData) => {
  return apiCall('/cvs/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(cvData)
  });
};

export const downloadCV = async (token, cvId, pdfUrl) => {
  try {
    const response = await fetch(
      `${API_URL}/cvs/download/${cvId}?url=${encodeURIComponent(pdfUrl)}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download CV');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `cv-${cvId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error('Error downloading CV:', error);
    throw error;
  }
};

export const getMyCVs = async (token) => {
  return apiCall('/cvs/my-cvs', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
  
  