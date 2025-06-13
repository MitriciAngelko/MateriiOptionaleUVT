import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Materie } from '../../models/Materie';

const MaterieDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [materie, setMaterie] = useState<Materie | null>(null);

  useEffect(() => {
    // Fetch the materie data
    // This is a placeholder and should be replaced with actual data fetching logic
    setMaterie({
      id: 1,
      nume: 'Matematică',
      descriere: 'Descrierea materiei de matematică',
      // Add other necessary fields
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
              {materie?.nume}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterieDetailsPage; 