import React, { useState } from 'react';

const MassDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeletion = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Mass deletion failed:', error);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 p-8 max-w-md mx-4">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Ștergere în Masă
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Ești sigur că vrei să ștergi toți utilizatorii din sistem?
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">
            <strong>Atenție:</strong> Această acțiune va șterge permanent toți utilizatorii din Firebase Authentication și Firestore. Acțiunea nu poate fi anulată.
          </p>
        </div>

        <div className="flex justify-between space-x-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={handleConfirmDeletion}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Se șterge...
              </>
            ) : (
              'Șterge Toți'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MassDeleteModal; 