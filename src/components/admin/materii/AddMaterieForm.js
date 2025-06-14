import React from 'react';
import { facultati, specializari, ani, semestre } from './constants';

const AddMaterieForm = ({ newMaterie, setNewMaterie, handleSubmit }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#024A76] dark:text-blue-light flex items-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Adaugă Materie Nouă</span>
          <span className="sm:hidden">Adaugă Materie</span>
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Nume Materie</label>
          <input
            type="text"
            value={newMaterie.nume}
            onChange={(e) => setNewMaterie({...newMaterie, nume: e.target.value})}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md text-sm sm:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Facultate</label>
          <select
            value={newMaterie.facultate}
            onChange={(e) => setNewMaterie({...newMaterie, facultate: e.target.value})}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            required
          >
            <option value="">Selectează facultatea</option>
            {facultati.map(facultate => (
              <option key={facultate} value={facultate}>{facultate}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Specializare</label>
          <select
            value={newMaterie.specializare}
            onChange={(e) => setNewMaterie({...newMaterie, specializare: e.target.value})}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
            required
            disabled={!newMaterie.facultate}
          >
            <option value="">Selectează specializarea</option>
            {newMaterie.facultate && specializari[newMaterie.facultate]?.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">An</label>
            <select
              value={newMaterie.an}
              onChange={(e) => setNewMaterie({...newMaterie, an: e.target.value})}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md text-sm sm:text-base"
              required
            >
              <option value="">Selectează anul</option>
              {ani.map(an => (
                <option key={an} value={an}>{an}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Semestru</label>
            <select
              value={newMaterie.semestru}
              onChange={(e) => setNewMaterie({...newMaterie, semestru: e.target.value})}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md text-sm sm:text-base"
              required
            >
              <option value="">Selectează semestrul</option>
              {semestre.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Credite</label>
          <input
            type="number"
            min="1"
            max="30"
            value={newMaterie.credite}
            onChange={(e) => setNewMaterie({...newMaterie, credite: e.target.value})}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="obligatorie-checkbox"
            type="checkbox"
            checked={newMaterie.obligatorie}
            onChange={(e) => setNewMaterie({
              ...newMaterie, 
              obligatorie: e.target.checked
            })}
            className="h-4 w-4 text-[#E3AB23] dark:text-yellow-accent focus:ring-[#E3AB23] dark:focus:ring-yellow-accent border-[#024A76]/30 dark:border-gray-600 rounded"
          />
          <label htmlFor="obligatorie-checkbox" className="ml-2 block text-sm font-semibold text-[#024A76] dark:text-blue-light">
            Materie obligatorie
          </label>
        </div>

        {!newMaterie.obligatorie && (
          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Locuri Disponibile</label>
            <input
              type="number"
              min="1"
              value={newMaterie.locuriDisponibile}
              onChange={(e) => setNewMaterie({...newMaterie, locuriDisponibile: e.target.value})}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">Descriere</label>
          <textarea
            value={newMaterie.descriere}
            onChange={(e) => setNewMaterie({...newMaterie, descriere: e.target.value})}
            className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md resize-none"
            rows="3"
            placeholder="Descrierea materiei..."
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Adaugă Materie</span>
          <span className="sm:hidden">Adaugă</span>
        </button>
      </form>
    </div>
  );
};

export default AddMaterieForm; 