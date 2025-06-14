import React from 'react';

const MaterieDetailsModal = ({ materie, onClose }) => {
  if (!materie) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-3xl shadow-xl rounded-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm pr-2 flex-1">
            {materie.nume}
          </h3>
          <button 
            onClick={onClose} 
            className="text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-colors duration-200 p-1 flex-shrink-0 touch-manipulation"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">

          {/* Mobile-Optimized General Information */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
            <h4 className="text-base sm:text-lg font-semibold mb-3 text-[#024A76] dark:text-blue-light flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Informații Generale</span>
              <span className="sm:hidden">Informații</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Facultate</label>
                <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-200 font-medium break-words">{materie.facultate || 'Nedefinit'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Specializare</label>
                <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-200 font-medium break-words">{materie.specializare || 'Nedefinit'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">An</label>
                <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-200 font-medium">Anul {materie.an || 'I'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Semestru</label>
                <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-200 font-medium">
                  <span className="hidden sm:inline">Semestrul {materie.semestru || 'Nedefinit'}</span>
                  <span className="sm:hidden">Sem {materie.semestru || 'N/A'}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  <span className="hidden sm:inline">Credite</span>
                  <span className="sm:hidden">ECTS</span>
                </label>
                <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-200 font-semibold bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-yellow-accent dark:to-yellow-accent/80 bg-clip-text text-transparent">
                  {materie.credite || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  <span className="hidden sm:inline">Locuri disponibile</span>
                  <span className="sm:hidden">Locuri</span>
                </label>
                <p className="mt-1 text-sm sm:text-base text-gray-900 dark:text-gray-200 font-medium">
                  {materie.obligatorie ? 'Obligatorie' : `${materie.locuriDisponibile || 'N/A'} locuri`}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Professors */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
            <h4 className="text-base sm:text-lg font-semibold mb-3 text-[#024A76] dark:text-blue-light flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profesori
            </h4>
            {materie.profesori && materie.profesori.length > 0 ? (
              <div className="space-y-2">
                {materie.profesori.map((profesor, idx) => (
                  <div key={idx} className="p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200">
                    <p className="text-sm sm:text-base text-gray-900 dark:text-gray-200 font-medium break-words">{profesor.nume || 'Profesor'}</p>
                    {profesor.email && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">{profesor.email}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start sm:items-center p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm sm:text-base text-yellow-800 dark:text-yellow-300 font-medium">Profesor nealocat</span>
              </div>
            )}
          </div>

          {/* Mobile-Optimized Description */}
          {materie.descriere && materie.descriere.trim() && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
              <h4 className="text-base sm:text-lg font-semibold mb-3 text-[#024A76] dark:text-blue-light flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descriere
              </h4>
              <div className="max-h-32 sm:max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-sm sm:text-base text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{materie.descriere}</p>
              </div>
            </div>
          )}

          {/* Mobile-Optimized Enrollment Information */}
          {materie.studentiInscrisi && materie.studentiInscrisi.length > 0 && !materie.obligatorie && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
              <h4 className="text-base sm:text-lg font-semibold mb-3 text-[#024A76] dark:text-blue-light flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">Informații înscriere</span>
                <span className="sm:hidden">Înscriere</span>
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="flex items-center bg-white/60 dark:bg-gray-800/50 px-3 sm:px-4 py-2 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#024A76] dark:text-blue-light mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    <span className="font-bold text-[#024A76] dark:text-blue-light">{materie.studentiInscrisi.length}</span> din{' '}
                    <span className="font-bold text-[#024A76] dark:text-blue-light">{materie.locuriDisponibile || 'N/A'}</span>
                    <span className="hidden sm:inline"> locuri ocupate</span>
                    <span className="sm:hidden"> locuri</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterieDetailsModal; 