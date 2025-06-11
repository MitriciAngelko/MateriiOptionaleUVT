import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '../../utils/userRoles';

const RegistrationSettingsPage = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [registrationSettings, setRegistrationSettings] = useState({
    dataStartInscriere: '',
    dataFinalInscriere: '',
    isActive: false,
    minECTS: 40
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.uid) {
        navigate('/login');
        return;
      }

      // Special case for main admin
      if (user.email === 'admin@admin.com') {
        // Load settings directly
        await loadRegistrationSettings();
        return;
      }

      // Verifică dacă utilizatorul este administrator
      const adminStatus = await isAdmin(user.uid);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      // Încarcă setările existente
      await loadRegistrationSettings();
    };

    checkAccess();
  }, [user, navigate]);

  const loadRegistrationSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const settingsRef = doc(db, 'settings', 'registration');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        
        // Formatăm datele pentru input-uri date-time
        const formatDateForInput = (timestamp) => {
          if (!timestamp) return '';
          const date = new Date(timestamp);
          return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
        };

        setRegistrationSettings({
          dataStartInscriere: formatDateForInput(data.dataStartInscriere),
          dataFinalInscriere: formatDateForInput(data.dataFinalInscriere),
          isActive: data.isActive ?? false,
          minECTS: data.minECTS ?? 40
        });
      }
    } catch (error) {
      console.error('Eroare la încărcarea setărilor:', error);
      setError('A apărut o eroare la încărcarea setărilor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validare
      if (!registrationSettings.dataStartInscriere || !registrationSettings.dataFinalInscriere) {
        throw new Error('Toate câmpurile sunt obligatorii');
      }

      const startDate = new Date(registrationSettings.dataStartInscriere);
      const endDate = new Date(registrationSettings.dataFinalInscriere);

      if (startDate >= endDate) {
        throw new Error('Data de început trebuie să fie înainte de data de final');
      }

      // Salvează setările
      const settingsRef = doc(db, 'settings', 'registration');
      
      // Verifică dacă documentul există deja
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        await updateDoc(settingsRef, {
          dataStartInscriere: startDate.toISOString(),
          dataFinalInscriere: endDate.toISOString(),
          isActive: registrationSettings.isActive,
          minECTS: parseInt(registrationSettings.minECTS),
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid
        });
      } else {
        await setDoc(settingsRef, {
          dataStartInscriere: startDate.toISOString(),
          dataFinalInscriere: endDate.toISOString(),
          isActive: registrationSettings.isActive,
          minECTS: parseInt(registrationSettings.minECTS),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.uid,
          updatedBy: user.uid
        });
      }

      setSuccessMessage('Setările au fost salvate cu succes!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Eroare la salvarea setărilor:', error);
      setError(error.message || 'A apărut o eroare la salvarea setărilor');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegistrationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#034a76] mb-6">Setări înscriere an universitar</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-[#034a76] mb-4">Perioada de înscriere</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#034a76] mb-1">
              Data și ora de început
            </label>
            <input
              type="datetime-local"
              name="dataStartInscriere"
              value={registrationSettings.dataStartInscriere}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#034a76]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#034a76] mb-1">
              Data și ora de final
            </label>
            <input
              type="datetime-local"
              name="dataFinalInscriere"
              value={registrationSettings.dataFinalInscriere}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#034a76]"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={registrationSettings.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-[#034a76] focus:ring-[#034a76] border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-[#034a76]">
              Activează manual perioada de înscriere (indiferent de datele stabilite)
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Activând această opțiune, perioada de înscriere va fi deschisă indiferent de data curentă.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#034a76] mb-1">
            Numărul minim de credite ECTS necesare pentru avansare
          </label>
          <input
            type="number"
            name="minECTS"
            value={registrationSettings.minECTS}
            onChange={handleInputChange}
            min="1"
            max="60"
            className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#034a76]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Numărul minim de credite ECTS pe care un student trebuie să le acumuleze pentru a putea avansa în anul următor.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`px-4 py-2 rounded ${saving ? 'bg-gray-400' : 'bg-[#034a76] hover:bg-[#023557]'} text-white`}
          >
            {saving ? 'Se salvează...' : 'Salvează setările'}
          </button>
        </div>
      </div>

      <div className="bg-[#f5f5f5] rounded-lg p-6 border border-[#034a76]/20">
        <h3 className="text-lg font-medium text-[#034a76] mb-2">Informații despre înscrierea în anul următor</h3>
        <p className="text-sm text-[#034a76]/80 mb-4">
          Aceste setări controlează când studenții se pot înscrie în anul universitar următor. 
          Studenții pot avansa în anul următor doar dacă:
        </p>
        
        <ul className="list-disc pl-5 text-sm text-[#034a76]/80 mb-4">
          <li>Au acumulat minim {registrationSettings.minECTS} credite ECTS în anul universitar curent</li>
          <li>Perioada de înscriere este activă (fie manual, fie în intervalul de timp specificat)</li>
          <li>Nu sunt în ultimul an de studiu</li>
        </ul>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <p className="text-sm text-yellow-700">
            <strong>Notă:</strong> Modificarea acestor setări va afecta imediat posibilitatea studenților de a se înscrie în anul următor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSettingsPage; 