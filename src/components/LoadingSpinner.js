import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 bg-black/25 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center bg-white dark:bg-gray-800/80 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700/50">
        <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-light border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-200 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;