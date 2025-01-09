// services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const createUser = async (token) => {
  try {
    const response = await fetch(`${API_URL}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const createCV = async (token, cvData) => {
    try {
      const response = await fetch(`${API_URL}/cvs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cvData)
      });
  
      if (!response.ok) {
        throw new Error('Failed to create CV');
      }
  
      const data = await response.json();
      console.log('CV created successfully:', data);
      return data; // Returnează răspunsul complet care include pdfUrl
    } catch (error) {
      console.error('Error creating CV:', error);
      throw error;
    }
  };

  export const downloadCV = async (token, cvId, pdfUrl) => {
    try {
      const response = await fetch(
        `${API_URL}/cvs/download/${cvId}?url=${encodeURIComponent(pdfUrl)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
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
    try {
      const response = await fetch(`${API_URL}/cvs/my-cvs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch CVs');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching CVs:', error);
      throw error;
    }
  };
  
  