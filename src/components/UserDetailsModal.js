import React from 'react';

const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md w-full max-w-4xl mx-4 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-yellow-accent dark:to-yellow-accent/80 text-white dark:text-gray-900 p-2 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-gray-900/20 flex items-center justify-center font-bold text-xl backdrop-blur-sm">
                {user.nume?.charAt(0)}{user.prenume?.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold drop-shadow-sm">Detalii Utilizator</h3>
                <p className="text-white/80 dark:text-gray-900/70 text-sm font-medium">
                  {user.nume} {user.prenume}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 dark:text-gray-900/70 hover:text-white dark:hover:text-gray-900 hover:bg-white/10 dark:hover:bg-gray-900/10 p-2 rounded-lg transition-all duration-200"
              title="Închide"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-8rem)] overflow-y-auto custom-scrollbar">
          {/* Informații personale */}
          <div className="bg-gradient-to-r from-[#024A76]/5 to-[#3471B8]/5 dark:from-yellow-accent/10 dark:to-blue-light/10 p-6 rounded-xl border-l-4 border-[#024A76] dark:border-blue-light shadow-lg">
            <h4 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center drop-shadow-sm">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Informații Personale
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Nume</label>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.nume}</p>
              </div>
              <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Prenume</label>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.prenume}</p>
              </div>
              <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Email</label>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 break-all">{user.email}</p>
              </div>
              <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Tip Cont</label>
                <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white capitalize shadow-sm">
                  {user.tip}
                </span>
              </div>
            </div>
          </div>

          {/* Informații specifice pentru student */}
          {user.tip === 'student' && (
            <div className="bg-gradient-to-r from-[#E3AB23]/5 to-transparent dark:from-yellow-accent/10 dark:to-transparent p-6 rounded-xl border-l-4 border-[#E3AB23] dark:border-yellow-accent shadow-lg">
              <h4 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center drop-shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
                Informații Academice
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.facultate}</p>
                </div>
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.specializare}</p>
                </div>
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.an}</p>
                </div>
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                  <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Număr Matricol</label>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.numarMatricol}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informații specifice pentru profesor */}
          {user.tip === 'profesor' && (
            <div className="bg-gradient-to-r from-[#E3AB23]/5 to-transparent dark:from-yellow-accent/10 dark:to-transparent p-6 rounded-xl border-l-4 border-[#E3AB23] dark:border-yellow-accent shadow-lg">
              <h4 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center drop-shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                Materii Predate
              </h4>
              {user.materiiPredate && user.materiiPredate.length > 0 ? (
                <div className="space-y-4">
                  {user.materiiPredate.map((materie, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700/30 p-5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600/50 hover:shadow-xl hover:border-[#3471B8]/30 dark:hover:border-blue-light/50 transition-all duration-300">
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 rounded-full mt-2 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/70 dark:from-blue-light dark:to-blue-dark shadow-sm"></div>
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-3 drop-shadow-sm">
                            {materie.nume}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-sm font-semibold text-[#024A76] dark:text-blue-light">An:</span>
                              <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">{materie.an}</span>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-[#024A76] dark:text-blue-light">Facultate:</span>
                              <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">{materie.facultate}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-sm font-semibold text-[#024A76] dark:text-blue-light">Specializare:</span>
                              <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">{materie.specializare}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-700/30 p-8 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-600/50">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 italic font-medium">Nu sunt materii asociate</p>
                </div>
              )}
            </div>
          )}

          {/* Informații specifice pentru secretar */}
          {user.tip === 'secretar' && (
            <div className="bg-gradient-to-r from-[#E3AB23]/5 to-transparent dark:from-yellow-accent/10 dark:to-transparent p-6 rounded-xl border-l-4 border-[#E3AB23] dark:border-yellow-accent shadow-lg">
              <h4 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-4 flex items-center drop-shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                Informații Administrative
              </h4>
              <div className="bg-white dark:bg-gray-700/30 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{user.facultate}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal; 