import React from 'react';
import { facultati, specializari } from './constants';

const BulkUploadTab = ({ 
  bulkUploadData, 
  setBulkUploadData, 
  handleBulkUploadSubmit, 
  error,
  isProcessing,
  processingMessage 
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-4 text-center">
            {/* Simple Spinning Circle */}
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="w-16 h-16 border-4 border-[#024A76]/20 dark:border-blue-light/20 border-t-[#024A76] dark:border-t-blue-light rounded-full animate-spin"></div>
            </div>
            
            {/* Loading Message */}
            <h3 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-3">
              Procesez Fișierul PDF
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {processingMessage}
            </p>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Te rog să nu închizi această pagină
            </p>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-semibold mb-8 text-[#024A76] dark:text-blue-light flex items-center">
          <svg className="w-7 h-7 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Import în Masă Materii
        </h2>
        
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Funcționalitate în Dezvoltare
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Această funcționalitate permite importul automat al materiilor dintr-un fișier PDF. 
                Selectează facultatea, specializarea și încarcă fișierul pentru a continua.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleBulkUploadSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
              Facultate
            </label>
            <select
              value={bulkUploadData.facultate}
              onChange={(e) => setBulkUploadData({
                ...bulkUploadData, 
                facultate: e.target.value,
                specializare: '' // Reset specializare când se schimbă facultatea
              })}
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
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
              Specializare
            </label>
            <select
              value={bulkUploadData.specializare}
              onChange={(e) => setBulkUploadData({
                ...bulkUploadData, 
                specializare: e.target.value
              })}
              className="w-full px-4 py-3 border border-[#024A76]/30 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 transition-all duration-300 hover:shadow-md disabled:bg-gray-100 dark:disabled:bg-gray-700"
              required
              disabled={!bulkUploadData.facultate}
            >
              <option value="">Selectează specializarea</option>
              {bulkUploadData.facultate && specializari[bulkUploadData.facultate]?.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#024A76] dark:text-blue-light mb-2">
              Fișier PDF cu Materii
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-[#E3AB23] dark:hover:border-yellow-accent transition-colors duration-300">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="bulk-upload-file" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-[#E3AB23] dark:text-yellow-accent hover:text-[#024A76] dark:hover:text-blue-light focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#E3AB23] dark:focus-within:ring-yellow-accent transition-colors duration-200">
                    <span>Încarcă un fișier</span>
                    <input
                      id="bulk-upload-file"
                      name="bulk-upload-file"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="sr-only"
                      required
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Validate file type on selection
                          if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
                            // This would need to be handled by parent component
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          // Validate file size
                          if (file.size > 10 * 1024 * 1024) {
                            // This would need to be handled by parent component
                            e.target.value = ''; // Clear the input
                            return;
                          }
                        }
                        setBulkUploadData({
                          ...bulkUploadData, 
                          file: file
                        });
                      }}
                    />
                  </label>
                  <p className="pl-1">sau trage și plasează</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Doar fișiere PDF până la 10MB
                </p>
                {bulkUploadData.file && (
                  <p className="text-sm text-[#024A76] dark:text-blue-light font-medium">
                    Fișier selectat: {bulkUploadData.file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Procesează Fișierul
          </button>
        </form>
      </div>
    </div>
  );
};

export default BulkUploadTab; 