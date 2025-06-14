import React from 'react';
import DeleteIcon from '../../icons/DeleteIcon';
import { facultati, specializari, ani } from './constants';
import { removeDiacritics } from './utils';

const PacheteTab = ({ 
  pachete, 
  searchTermPachete, 
  setSearchTermPachete, 
  filtersPachete, 
  setFiltersPachete, 
  setShowPachetModal, 
  handleDeletePachet 
}) => {
  const getFilteredPachete = () => {
    return pachete.filter(pachet => {
      if (filtersPachete.facultate && pachet.facultate !== filtersPachete.facultate) return false;
      if (filtersPachete.specializare && pachet.specializare !== filtersPachete.specializare) return false;
      if (filtersPachete.an && pachet.an !== filtersPachete.an) return false;
      if (searchTermPachete) {
        const normalizedSearchTerm = removeDiacritics(searchTermPachete.toLowerCase());
        const normalizedPachetName = removeDiacritics(pachet.nume.toLowerCase());
        if (!normalizedPachetName.includes(normalizedSearchTerm)) return false;
      }
      return true;
    });
  };

  return (
    <div>
      {/* Header cu buton și căutare */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowPachetModal(true)}
          className="group relative px-4 py-2.5 font-medium transition-all duration-200 rounded-lg flex items-center bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-yellow-accent/10 dark:to-yellow-accent/5 hover:from-[#E3AB23]/20 hover:to-[#E3AB23]/10 dark:hover:from-yellow-accent/20 dark:hover:to-yellow-accent/10 text-[#024A76] dark:text-yellow-accent hover:text-[#024A76] dark:hover:text-white border border-[#E3AB23]/30 dark:border-yellow-accent/30 hover:border-[#E3AB23]/50 dark:hover:border-yellow-accent/50 hover:shadow-md"
          title="Creează un pachet nou de materii"
        >
          <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold">Adaugă Pachet Nou</span>
        </button>

        {/* Căutare pachete */}
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Caută pachete..."
            value={searchTermPachete}
            onChange={(e) => setSearchTermPachete(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTermPachete && (
            <button
              onClick={() => setSearchTermPachete('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filtre pachete */}
      <div className="mb-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
            Filtre Pachete
          </h2>
          <button
            onClick={() => setFiltersPachete({ facultate: '', specializare: '', an: '' })}
            className="text-sm text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-colors duration-200 font-medium"
          >
            Resetează filtrele
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
            <select
              value={filtersPachete.facultate}
              onChange={(e) => setFiltersPachete(prev => ({ 
                ...prev, 
                facultate: e.target.value,
                specializare: ''
              }))}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            >
              <option value="">Toate facultățile</option>
              {facultati.map(fac => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
            <select
              value={filtersPachete.specializare}
              onChange={(e) => setFiltersPachete(prev => ({ ...prev, specializare: e.target.value }))}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
              disabled={!filtersPachete.facultate}
            >
              <option value="">Toate specializările</option>
              {filtersPachete.facultate && specializari[filtersPachete.facultate]?.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
            <select
              value={filtersPachete.an}
              onChange={(e) => setFiltersPachete(prev => ({ ...prev, an: e.target.value }))}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            >
              <option value="">Toți anii</option>
              {ani.map(an => (
                <option key={an} value={an}>{an}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredPachete().map((pachet) => (
          <div key={pachet.id} className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#024A76]/5 hover:to-[#3471B8]/5 dark:hover:from-yellow-accent/10 dark:hover:to-blue-light/10">
            <button
              onClick={() => handleDeletePachet(pachet.id)}
              className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
              title="Șterge pachet"
            >
              <DeleteIcon />
            </button>
            <h3 className="text-lg font-bold pr-8 text-[#024A76] dark:text-blue-light mb-4">{pachet.nume}</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div className="flex items-center">
                <span className="font-medium w-20 text-[#024A76] dark:text-blue-light">Facultate:</span>
                <span>{pachet.facultate || 'Toate'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-20 text-[#024A76] dark:text-blue-light">Specializare:</span>
                <span>{pachet.specializare || 'Toate'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-20 text-[#024A76] dark:text-blue-light">An:</span>
                <span className="px-2 py-1 bg-[#E3AB23]/20 dark:bg-yellow-accent/20 text-[#024A76] dark:text-yellow-accent rounded-md font-semibold text-xs">
                  {pachet.an || 'Toți'}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#024A76] dark:text-blue-light flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Materii în pachet:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {pachet.materii.map((materie) => (
                  <div key={materie.id} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                    {materie.nume}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {getFilteredPachete().length === 0 && (
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V5a2 2 0 00-2-2H6a2 2 0 00-2 2v0h16z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-[#024A76] dark:text-blue-light">Nu s-au găsit pachete</h3>
            <p className="mt-2 text-[#024A76]/60 dark:text-gray-300">
              {searchTermPachete || filtersPachete.facultate || filtersPachete.specializare || filtersPachete.an 
                ? 'Niciun pachet nu corespunde criteriilor de căutare.' 
                : 'Nu există pachete create încă.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacheteTab; 