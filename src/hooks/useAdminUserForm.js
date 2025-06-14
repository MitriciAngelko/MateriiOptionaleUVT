import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { generateProfesorEmail, generateStudentEmail } from '../utils/generators/emailGenerator';
import { USER_TYPES } from '../constants/academic';

export const useAdminUserForm = (editingUser) => {
  const [formType, setFormType] = useState(editingUser?.tip || USER_TYPES.STUDENT);
  const [formData, setFormData] = useState({
    email: editingUser?.email || '',
    password: '',
    confirmPassword: '',
    nume: editingUser?.nume || '',
    prenume: editingUser?.prenume || '',
    anNastere: editingUser?.anNastere || '',
    facultate: editingUser?.facultate || '',
    specializare: editingUser?.specializare || '',
    an: editingUser?.an || '',
    functie: editingUser?.functie || '',
    materiiPredate: editingUser?.materiiPredate || []
  });
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState(null);
  
  // Materii related state
  const [materii, setMaterii] = useState([]);
  const [materieNoua, setMaterieNoua] = useState({
    facultate: '',
    specializare: '',
    nume: '',
    an: ''
  });
  const [materiiDisponibile, setMateriiDisponibile] = useState([]);
  const [materiiSelectate, setMateriiSelectate] = useState([]);
  const [materiiFilter, setMateriiFilter] = useState({
    search: '',
    facultate: '',
    specializare: '',
    an: ''
  });

  // Save admin credentials when component loads
  useEffect(() => {
    const currentAdmin = auth.currentUser;
    if (currentAdmin) {
      setAdminCredentials({
        email: currentAdmin.email,
      });
    }
  }, []);

  // Handle form data changes with automatic email generation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (formType === USER_TYPES.PROFESOR && (name === 'nume' || name === 'prenume')) {
        newData.email = generateProfesorEmail(
          name === 'nume' ? value : newData.nume,
          name === 'prenume' ? value : newData.prenume
        );
      } else if (formType === USER_TYPES.STUDENT && (name === 'nume' || name === 'prenume' || name === 'anNastere')) {
        newData.email = generateStudentEmail(
          name === 'nume' ? value : newData.nume,
          name === 'prenume' ? value : newData.prenume,
          name === 'anNastere' ? value : newData.anNastere
        );
      }
      
      return newData;
    });
  };

  // Add new materie to list
  const adaugaMaterie = () => {
    if (materieNoua.facultate && materieNoua.specializare && materieNoua.nume && materieNoua.an) {
      setMaterii([...materii, { ...materieNoua }]);
      setMaterieNoua({
        facultate: '',
        specializare: '',
        nume: '',
        an: ''
      });
    }
  };

  // Remove materie from list
  const stergeMaterie = (index) => {
    setMaterii(materii.filter((_, idx) => idx !== index));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      nume: '',
      prenume: '',
      anNastere: '',
      facultate: '',
      specializare: '',
      an: '',
      functie: '',
      materiiPredate: []
    });
    setMaterii([]);
    setMateriiSelectate([]);
    setError(null);
    setSuccess(false);
  };

  return {
    formType,
    setFormType,
    formData,
    setFormData,
    error,
    setError,
    success,
    setSuccess,
    loading,
    setLoading,
    adminCredentials,
    setAdminCredentials,
    materii,
    setMaterii,
    materieNoua,
    setMaterieNoua,
    materiiDisponibile,
    setMateriiDisponibile,
    materiiSelectate,
    setMateriiSelectate,
    materiiFilter,
    setMateriiFilter,
    handleChange,
    adaugaMaterie,
    stergeMaterie,
    resetForm
  };
}; 