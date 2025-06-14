import React from 'react';

const BulkUploadPreview = ({ materiiList, onConfirm, onCancel, uploadResults }) => {
  if (uploadResults) {
    // Show results after upload
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4">
              {uploadResults.failed === 0 ? (
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-[#024A76] dark:text-blue-light mb-3">
              {uploadResults.failed === 0 ? 'Upload Complet!' : 'Upload Finalizat cu Erori'}
            </h3>
            
            <div className="space-y-2 text-sm">
              <p className="text-green-600 dark:text-green-400">
                ✅ {uploadResults.successful} materii încărcate cu succes
              </p>
              {uploadResults.failed > 0 && (
                <p className="text-red-600 dark:text-red-400">
                  ❌ {uploadResults.failed} materii cu erori
                </p>
              )}
            </div>
          </div>
          
          {uploadResults.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Erori:</h4>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                {uploadResults.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {error.materie}: {error.error}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={onConfirm}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#024A76] to-[#3471B8] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
          >
            Închide
          </button>
        </div>
      </div>
    );
  }

  // Show preview before upload
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[#024A76] dark:text-blue-light">
            Previzualizare Materii Extrase
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{materiiList.length} materii</strong> au fost extrase din fișierul PDF. 
            Verifică datele de mai jos și confirmă pentru a le încărca în baza de date.
          </p>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
          {materiiList.map((materie, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#024A76] dark:text-blue-light mb-2">
                    {materie.nume}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Tip:</span>
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                        materie.obligatorie 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {materie.obligatorie ? 'Obligatorie' : 'Opțională'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">An:</span>
                      <span className="ml-1 text-[#024A76] dark:text-blue-light font-medium">{materie.an}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Semestru:</span>
                      <span className="ml-1 text-[#024A76] dark:text-blue-light font-medium">{materie.semestru}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Credite:</span>
                      <span className="ml-1 text-[#024A76] dark:text-blue-light font-medium">{materie.credite}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-sm font-medium text-[#024A76] dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 border border-gray-300 dark:border-gray-600"
          >
            Anulează
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#024A76] to-[#3471B8] rounded-lg hover:shadow-lg transition-all duration-300 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Confirmă și Încarcă ({materiiList.length} materii)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPreview; 