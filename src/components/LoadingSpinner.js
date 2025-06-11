import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;