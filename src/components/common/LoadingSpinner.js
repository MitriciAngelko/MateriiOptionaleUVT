import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  text = null 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'white':
        return 'border-white border-t-transparent';
      case 'gray':
        return 'border-gray-300 border-t-gray-600';
      case 'green':
        return 'border-green-300 border-t-green-600';
      default:
        return 'border-blue-300 border-t-blue-600';
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`
        ${getSizeClasses()} 
        ${getColorClasses()}
        border-2 border-solid rounded-full animate-spin
      `} />
      {text && (
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner; 