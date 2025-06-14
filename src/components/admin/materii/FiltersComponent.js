import React from 'react';
import { facultati, specializari, ani } from './constants';

const FiltersComponent = ({ filters, setFilters, resetFilters }) => {
  return (
    <div className="mb-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent">
          Filtre
        </h2>
        <button
          onClick={resetFilters}
          className="text-sm text-[#024A76] dark:text-blue-light hover:text-[#3471B8] dark:hover:text-yellow-accent transition-colors duration-200 font-medium"
        >
          Resetează filtrele
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
          <select
            value={filters.facultate}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              facultate: e.target.value,
              specializare: ''
            }))}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
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
            value={filters.specializare}
            onChange={(e) => setFilters(prev => ({ ...prev, specializare: e.target.value }))}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
            disabled={!filters.facultate}
          >
            <option value="">Toate specializările</option>
            {filters.facultate && specializari[filters.facultate]?.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
          <select
            value={filters.an}
            onChange={(e) => setFilters(prev => ({ ...prev, an: e.target.value }))}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
          >
            <option value="">Toți anii</option>
            {ani.map(an => (
              <option key={an} value={an}>{an}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltersComponent; 