import React from 'react';

const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Detalii Utilizator</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Informații personale */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-xl font-semibold text-gray-700 mb-3">Informații Personale</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nume</label>
                <p className="mt-1 text-lg text-gray-800">{user.nume}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Prenume</label>
                <p className="mt-1 text-lg text-gray-800">{user.prenume}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-lg text-gray-800">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Tip Cont</label>
                <p className="mt-1 text-lg text-gray-800 capitalize">{user.tip}</p>
              </div>
            </div>
          </div>

          {/* Informații specifice pentru student */}
          {user.tip === 'student' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xl font-semibold text-gray-700 mb-3">Informații Academice</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Facultate</label>
                  <p className="mt-1 text-lg text-gray-800">{user.facultate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Specializare</label>
                  <p className="mt-1 text-lg text-gray-800">{user.specializare}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">An</label>
                  <p className="mt-1 text-lg text-gray-800">{user.an}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Număr Matricol</label>
                  <p className="mt-1 text-lg text-gray-800">{user.numarMatricol}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informații specifice pentru profesor */}
          {user.tip === 'profesor' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xl font-semibold text-gray-700 mb-3">Materii Predate</h4>
              {user.materiiPredate && user.materiiPredate.length > 0 ? (
                <div className="space-y-2">
                  {user.materiiPredate.map((materie, index) => (
                    <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Materie:</span>
                          <span className="ml-2 text-gray-800">{materie.nume}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">An:</span>
                          <span className="ml-2 text-gray-800">{materie.an}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Facultate:</span>
                          <span className="ml-2 text-gray-800">{materie.facultate}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Specializare:</span>
                          <span className="ml-2 text-gray-800">{materie.specializare}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Nu sunt materii asociate</p>
              )}
            </div>
          )}

          {/* Informații specifice pentru secretar */}
          {user.tip === 'secretar' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xl font-semibold text-gray-700 mb-3">Informații Administrative</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Facultate</label>
                  <p className="mt-1 text-lg text-gray-800">{user.facultate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Funcție</label>
                  <p className="mt-1 text-lg text-gray-800">{user.functie}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal; 