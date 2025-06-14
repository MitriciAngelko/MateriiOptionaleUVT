import React, { useEffect } from 'react';
import { useAdminUserForm } from '../../hooks/useAdminUserForm';
import { createUser, updateUser, fetchAllMaterii, fetchMateriiProfesor } from '../../services';
import { FACULTATI, SPECIALIZARI, ANI, USER_TYPES } from '../../constants';
import { validateEmailByUserType } from '../../utils';
import { Modal, Button } from '../ui';

const AdminUserForm = ({ onClose, onUserCreated, editingUser }) => {
  const {
    formType,
    setFormType,
    formData,
    error,
    setError,
    success,
    setSuccess,
    loading,
    setLoading,
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
  } = useAdminUserForm(editingUser);

  // Fetch available materii when form type changes to profesor
  useEffect(() => {
    if (formType === USER_TYPES.PROFESOR) {
      const fetchMaterii = async () => {
        try {
          const allMaterii = await fetchAllMaterii();
          setMateriiDisponibile(allMaterii);
        } catch (error) {
          console.error('Error fetching materii:', error);
          setError('Eroare la încărcarea materiilor disponibile.');
        }
      };
      fetchMaterii();
    }
  }, [formType, setMateriiDisponibile, setError]);

  // Fetch professor's materii if editing
  useEffect(() => {
    if (editingUser && editingUser.tip === USER_TYPES.PROFESOR) {
      const fetchMateriiProfesor = async () => {
        try {
          const profesorMaterii = await fetchMateriiProfesor(editingUser.uid);
          setMateriiSelectate(profesorMaterii);
        } catch (error) {
          console.error('Error fetching professor materii:', error);
        }
      };
      fetchMateriiProfesor();
    }
  }, [editingUser, setMateriiSelectate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.nume || !formData.prenume || !formData.email) {
        throw new Error('Toate câmpurile obligatorii trebuie completate.');
      }

      if (!validateEmailByUserType(formData.email, formType)) {
        throw new Error('Format email invalid pentru tipul de utilizator selectat.');
      }

      if (!editingUser && (!formData.password || formData.password !== formData.confirmPassword)) {
        throw new Error('Parolele nu se potrivesc.');
      }

      // Prepare user data
      const userData = {
        ...formData,
        tip: formType
      };

      let result;
      if (editingUser) {
        result = await updateUser(editingUser.uid, userData, materiiSelectate);
      } else {
        result = await createUser(userData, materiiSelectate, onUserCreated);
      }

      setSuccess(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterii = materiiDisponibile.filter(materie => {
    const matchesSearch = !materiiFilter.search || 
      materie.nume.toLowerCase().includes(materiiFilter.search.toLowerCase());
    const matchesFacultate = !materiiFilter.facultate || 
      materie.facultate === materiiFilter.facultate;
    const matchesSpecializare = !materiiFilter.specializare || 
      materie.specializare === materiiFilter.specializare;
    const matchesAn = !materiiFilter.an || 
      materie.an === materiiFilter.an;

    return matchesSearch && matchesFacultate && matchesSpecializare && matchesAn;
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editingUser ? 'Editare Utilizator' : 'Adăugare Utilizator Nou'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {editingUser ? 'Utilizator actualizat cu succes!' : 'Utilizator creat cu succes!'}
          </div>
        )}

        {/* User Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tip Utilizator
          </label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!!editingUser}
          >
            <option value={USER_TYPES.STUDENT}>Student</option>
            <option value={USER_TYPES.PROFESOR}>Profesor</option>
            <option value={USER_TYPES.ADMIN}>Admin</option>
            <option value={USER_TYPES.SECRETAR}>Secretar</option>
          </select>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nume *
            </label>
            <input
              type="text"
              name="nume"
              value={formData.nume}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prenume *
            </label>
            <input
              type="text"
              name="prenume"
              value={formData.prenume}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            readOnly={formType === USER_TYPES.STUDENT || formType === USER_TYPES.PROFESOR}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formType === USER_TYPES.STUDENT && 'Email-ul se generează automat pentru studenți'}
            {formType === USER_TYPES.PROFESOR && 'Email-ul se generează automat pentru profesori'}
          </p>
        </div>

        {/* Password fields for new users */}
        {!editingUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parolă *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmă Parola *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>
        )}

        {/* Student-specific fields */}
        {formType === USER_TYPES.STUDENT && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                An Naștere *
              </label>
              <input
                type="number"
                name="anNastere"
                value={formData.anNastere}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facultate *
                </label>
                <select
                  name="facultate"
                  value={formData.facultate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Selectează facultatea</option>
                  {FACULTATI.map(facultate => (
                    <option key={facultate} value={facultate}>
                      {facultate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specializare *
                </label>
                <select
                  name="specializare"
                  value={formData.specializare}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={!formData.facultate}
                >
                  <option value="">Selectează specializarea</option>
                  {formData.facultate && SPECIALIZARI[formData.facultate]?.map(specializare => (
                    <option key={specializare} value={specializare}>
                      {specializare}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  An *
                </label>
                <select
                  name="an"
                  value={formData.an}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Selectează anul</option>
                  {ANI.map(an => (
                    <option key={an} value={an}>
                      {an}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Professor-specific fields */}
        {formType === USER_TYPES.PROFESOR && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facultate *
                </label>
                <select
                  name="facultate"
                  value={formData.facultate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Selectează facultatea</option>
                  {FACULTATI.map(facultate => (
                    <option key={facultate} value={facultate}>
                      {facultate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funcție
                </label>
                <input
                  type="text"
                  name="functie"
                  value={formData.functie}
                  onChange={handleChange}
                  placeholder="ex: Profesor Universitar Dr."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Materii Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Materii Predate
              </label>
              
              {/* Filters */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Caută materie..."
                    value={materiiFilter.search}
                    onChange={(e) => setMateriiFilter({...materiiFilter, search: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  
                  <select
                    value={materiiFilter.facultate}
                    onChange={(e) => setMateriiFilter({...materiiFilter, facultate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Toate facultățile</option>
                    {FACULTATI.map(facultate => (
                      <option key={facultate} value={facultate}>
                        {facultate}
                      </option>
                    ))}
                  </select>

                  <select
                    value={materiiFilter.specializare}
                    onChange={(e) => setMateriiFilter({...materiiFilter, specializare: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Toate specializările</option>
                    {materiiFilter.facultate && SPECIALIZARI[materiiFilter.facultate]?.map(specializare => (
                      <option key={specializare} value={specializare}>
                        {specializare}
                      </option>
                    ))}
                  </select>

                  <select
                    value={materiiFilter.an}
                    onChange={(e) => setMateriiFilter({...materiiFilter, an: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Toți anii</option>
                    {ANI.map(an => (
                      <option key={an} value={an}>
                        {an}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Available Materii */}
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                {filteredMaterii.map(materie => (
                  <label key={materie.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={materiiSelectate.some(m => m.id === materie.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMateriiSelectate([...materiiSelectate, materie]);
                        } else {
                          setMateriiSelectate(materiiSelectate.filter(m => m.id !== materie.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {materie.nume} - {materie.facultate} - {materie.specializare} - An {materie.an}
                    </span>
                  </label>
                ))}
              </div>

              {/* Selected Materii */}
              {materiiSelectate.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Materii Selectate ({materiiSelectate.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {materiiSelectate.map(materie => (
                      <span
                        key={materie.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {materie.nume}
                        <button
                          type="button"
                          onClick={() => setMateriiSelectate(materiiSelectate.filter(m => m.id !== materie.id))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Anulează
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {editingUser ? 'Actualizează' : 'Creează'} Utilizator
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminUserForm; 