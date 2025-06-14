import React from 'react';
import DeleteIcon from '../../icons/DeleteIcon';

const MateriesList = ({ 
  filteredMaterii, 
  searchTerm, 
  setSearchTerm, 
  setSelectedMaterie, 
  handleDelete 
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#024A76] dark:text-blue-light flex items-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Materii Existente</span>
          <span className="sm:hidden">Materii ({filteredMaterii.length})</span>
        </h2>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Caută după numele materiei..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-3 max-h-[70vh] sm:max-h-[110vh] overflow-y-auto custom-scrollbar">
        {filteredMaterii.map((materie) => (
          <div 
            key={materie.id} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10 cursor-pointer transition-all duration-300 hover:shadow-md"
            onClick={() => setSelectedMaterie(materie)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-[#024A76] dark:text-blue-light mb-2 truncate pr-2">{materie.nume}</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                  <span className="px-2 py-1 bg-[#3471B8]/10 dark:bg-blue-light/20 text-[#024A76] dark:text-blue-light rounded-md text-xs font-medium">
                    {materie.facultate}
                  </span>
                  <span className="px-2 py-1 bg-[#E3AB23]/20 dark:bg-yellow-accent/20 text-[#024A76] dark:text-yellow-accent rounded-md text-xs font-medium">
                    {materie.specializare}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                    An {materie.an}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                    {materie.credite} ECTS
                  </span>
                </div>
                {materie.obligatorie && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Obligatorie
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(materie.id);
                }}
                className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex-shrink-0"
                title="Șterge materie"
              >
                <DeleteIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MateriesList; 
 