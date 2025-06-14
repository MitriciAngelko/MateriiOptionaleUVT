import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { initializeOpenAI } from '../../config/openai';

// Import all the split components
import FiltersComponent from '../../components/admin/materii/FiltersComponent';
import AddMaterieForm from '../../components/admin/materii/AddMaterieForm';
import MateriesList from '../../components/admin/materii/MateriesList';
import MaterieModal from '../../components/admin/materii/MaterieModal';
import PacheteTab from '../../components/admin/materii/PacheteTab';
import PachetModal from '../../components/admin/materii/PachetModal';
import BulkUploadTab from '../../components/admin/materii/BulkUploadTab';

// Import utilities and constants
import { removeDiacritics, getRandomLoadingMessage } from '../../components/admin/materii/utils';

const AdminMateriiPage = () => {
  const [activeTab, setActiveTab] = useState('materii'); // 'materii', 'pachete', sau 'bulk-upload'
  const [materii, setMaterii] = useState([]);
  const [newMaterie, setNewMaterie] = useState({
    nume: '',
    facultate: '',
    specializare: '',
    an: '',
    semestru: '',
    credite: '',
    descriere: '',
    locuriDisponibile: '',
    profesori: [],
    obligatorie: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    facultate: '',
    specializare: '',
    an: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterie, setSelectedMaterie] = useState(null);
  const [pachete, setPachete] = useState([]);
  const [showPachetModal, setShowPachetModal] = useState(false);
  
  // State pentru filtrarea pachetelor
  const [searchTermPachete, setSearchTermPachete] = useState('');
  const [filtersPachete, setFiltersPachete] = useState({
    facultate: '',
    specializare: '',
    an: ''
  });

  // State pentru profesori
  const [availableProfessors, setAvailableProfessors] = useState([]);

  // State pentru bulk upload
  const [bulkUploadData, setBulkUploadData] = useState({
    facultate: '',
    specializare: '',
    file: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [openaiClient, setOpenaiClient] = useState(null);

  useEffect(() => {
    fetchMaterii();
    const fetchPachete = async () => {
      try {
        const pacheteSnapshot = await getDocs(collection(db, 'pachete'));
        const pacheteList = pacheteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPachete(pacheteList);
      } catch (error) {
        console.error('Eroare la încărcarea pachetelor:', error);
      }
    };

    fetchPachete();
    fetchAvailableProfessors();
    
    // Initialize OpenAI client
    const client = initializeOpenAI();
    setOpenaiClient(client);
  }, []);

  const fetchAvailableProfessors = async () => {
    try {
      const profesorsQuery = query(
        collection(db, 'users'),
        where('tip', '==', 'profesor')
      );
      const profesorsSnapshot = await getDocs(profesorsQuery);
      const profesorsList = profesorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableProfessors(profesorsList);
    } catch (error) {
      console.error('Eroare la încărcarea profesorilor:', error);
    }
  };

  const fetchMaterii = async () => {
    try {
      const materiiSnapshot = await getDocs(collection(db, 'materii'));
      const materiiList = materiiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterii(materiiList);
    } catch (err) {
      setError('Eroare la încărcarea materiilor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const materieData = {
        ...newMaterie,
        locuriDisponibile: newMaterie.obligatorie ? null : parseInt(newMaterie.locuriDisponibile),
        studentiInscrisi: []
      };

      await addDoc(collection(db, 'materii'), materieData);
      setNewMaterie({
        nume: '',
        facultate: '',
        specializare: '',
        an: '',
        semestru: '',
        credite: '',
        descriere: '',
        locuriDisponibile: '',
        profesori: [],
        obligatorie: false
      });
      fetchMaterii();
    } catch (error) {
      console.error('Eroare la adăugarea materiei:', error);
      setError('A apărut o eroare la adăugarea materiei');
    }
  };

  const handleDelete = async (materieId) => {
    if (window.confirm('Sigur doriți să ștergeți această materie?')) {
      try {
        await deleteDoc(doc(db, 'materii', materieId));
        fetchMaterii();
      } catch (err) {
        setError('Eroare la ștergerea materiei');
        console.error(err);
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      facultate: '',
      specializare: '',
      an: ''
    });
    setSearchTerm('');
  };

  const getFilteredMaterii = () => {
    return materii.filter(materie => {
      if (filters.facultate && materie.facultate !== filters.facultate) return false;
      if (filters.specializare && materie.specializare !== filters.specializare) return false;
      if (filters.an && materie.an !== filters.an) return false;
      if (searchTerm) {
        const normalizedSearchTerm = removeDiacritics(searchTerm.toLowerCase());
        const normalizedMaterieName = removeDiacritics(materie.nume.toLowerCase());
        if (!normalizedMaterieName.includes(normalizedSearchTerm)) return false;
      }
      return true;
    });
  };

  const handleDeletePachet = async (pachetId) => {
    if (window.confirm('Sigur doriți să ștergeți acest pachet?')) {
      try {
        await deleteDoc(doc(db, 'pachete', pachetId));
        setPachete(pachete.filter(p => p.id !== pachetId));
      } catch (error) {
        console.error('Eroare la ștergerea pachetului:', error);
      }
    }
  };

  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!openaiClient) {
      setError('Serviciul AI nu este disponibil momentan. Te rog să reîncerci.');
      return;
    }

    if (!bulkUploadData.file) {
      setError('Te rog să selectezi un fișier PDF.');
      return;
    }

    // Validate file type
    if (!bulkUploadData.file.type.includes('pdf') && !bulkUploadData.file.name.toLowerCase().endsWith('.pdf')) {
      setError('Te rog să selectezi doar fișiere PDF.');
      return;
    }

    // Validate file size (10MB limit)
    if (bulkUploadData.file.size > 10 * 1024 * 1024) {
      setError('Fișierul este prea mare. Dimensiunea maximă este 10MB.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    // Start with first message and cycle through them
    setProcessingMessage(getRandomLoadingMessage());
    
    const messageInterval = setInterval(() => {
      setProcessingMessage(getRandomLoadingMessage());
    }, 3000); // Change message every 3 seconds

    try {
      // First, upload the file to OpenAI to get a file_id
      console.log('Uploading file to OpenAI...');
      const fileUpload = await openaiClient.files.create({
        file: bulkUploadData.file,
        purpose: 'assistants'
      });
      
      console.log('File uploaded with ID:', fileUpload.id);
      
      // Use the user's exact OpenAI code structure with the Responses API
      const response = await openaiClient.responses.create({
        model: "gpt-4.1",
        instructions: "You are an expert in content extraction from pdf's poorly made. You extract in the most accurate way all the necessary data even when there are mismatches in rows (multiple values in one row should be accounted  and counted as separate values).\n\nExtract a complete list of all courses (mandatory and optional, also facultative) from this academic curriculum document. For each course, extract and present the following information in a structured CSV: Course name, Status (Mandatory or Optional), Semester, Year, Total credits Additionally: Treat every optional course in grouped packages as an individual course (i.e. count all options separately even if only one is chosen).  EXTRACT ONLY IN  CSV Year 1 Semester 1 and Semester 2, Year 2 Semester 1 and Semester 2, Year 3 Semester 1 and Semester 2. \nEveryone is counting on you.\n\nRULES\n- EXTRACT ONLY IN  CSV FORMAT!\n- DON'T FORGET TO DO IT FOR ALL SEMESTERS AND YEARS!\n- RETURN ONLY THE CSV AS RESPONSE AND NOTHING MORE!\n- BE CAREFUL TO EXCTACT THE CORRECT DATA IN THE CORRECT COLUMN!\n- IF THE TITLE HAS COMMA (,) THEN REPLACE IT WITH DASH (-)!\n- Structured CSV: Course name, Status (Mandatory or Optional), Semester, Year, Credits \n- DO NOT INCLUDE ANY quotation mark or double quote",
        input: [
          {
              "role": "user",
              "content": [
                  {
                      "type": "input_file",
                      "file_id": fileUpload.id,
                  },
              ]
          }
      ],
        text: {
          "format": {
            "type": "text"
          }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 32768,
        top_p: 1,
        store: true
      });

      clearInterval(messageInterval);
      
      // Parse CSV response and create materii
      console.log('=== FULL OPENAI RESPONSE ===');
      console.log('Response object:', response);
      console.log('Response text:', response.text);
      console.log('Response output:', response.output);
      console.log('Response data:', response.data);
      console.log('===========================');
      
      // Try different response paths
      const csvData = response.text?.content || response.text || response.output?.text || response.data?.text || 'No response found';
      
      console.log('=== EXTRACTED CSV DATA ===');
      console.log(csvData);
      console.log('==========================');
      
      // Here you would parse the CSV and add materii to the database
      // For now, just show success message
      setProcessingMessage('✅ Procesarea a fost finalizată cu succes!');
      
      setTimeout(() => {
        setIsProcessing(false);
        setBulkUploadData({
          facultate: '',
          specializare: '',
          file: null
        });
        
        // Reset file input
        const fileInput = document.getElementById('bulk-upload-file');
        if (fileInput) {
          fileInput.value = '';
        }
      }, 2000);

    } catch (error) {
      clearInterval(messageInterval);
      console.error('Error calling OpenAI:', error);
      
      let errorMessage = "A apărut o eroare în procesarea fișierului. Te rog să încerci din nou.";
      
      if (error.status === 401) {
        errorMessage = "Cheia API nu este validă. Te rog să contactezi administratorul.";
      } else if (error.status === 429) {
        errorMessage = "Limita de utilizare a fost atinsă. Te rog să încerci mai târziu.";
      }
      
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024A76]/5 via-white to-[#3471B8]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
            Administrare Materii
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('materii')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'materii'
                ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Materii
          </button>
          <button
            onClick={() => setActiveTab('pachete')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'pachete'
                ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Pachete
          </button>
          <button
            onClick={() => setActiveTab('bulk-upload')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'bulk-upload'
                ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Import în Masă
          </button>
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

        {activeTab === 'pachete' && (
          <PacheteTab 
            pachete={pachete}
            searchTermPachete={searchTermPachete}
            setSearchTermPachete={setSearchTermPachete}
            filtersPachete={filtersPachete}
            setFiltersPachete={setFiltersPachete}
            setShowPachetModal={setShowPachetModal}
            handleDeletePachet={handleDeletePachet}
          />
        )}

        {activeTab === 'materii' && (
          <div className="space-y-8">
            {!selectedMaterie && (
              <FiltersComponent 
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
              />
            )}

            {!selectedMaterie ? (
              <div className="grid md:grid-cols-2 gap-8">
                <AddMaterieForm 
                  newMaterie={newMaterie}
                  setNewMaterie={setNewMaterie}
                  handleSubmit={handleSubmit}
                />

                <MateriesList 
                  filteredMaterii={getFilteredMaterii()}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setSelectedMaterie={setSelectedMaterie}
                  handleDelete={handleDelete}
                />
              </div>
            ) : (
              <MaterieModal 
                materie={selectedMaterie} 
                onClose={() => setSelectedMaterie(null)}
                setMaterii={setMaterii}
                availableProfessors={availableProfessors}
              />
            )}
          </div>
        )}

        {activeTab === 'bulk-upload' && (
          <BulkUploadTab 
            bulkUploadData={bulkUploadData}
            setBulkUploadData={setBulkUploadData}
            handleBulkUploadSubmit={handleBulkUploadSubmit}
            error={error}
            isProcessing={isProcessing}
            processingMessage={processingMessage}
          />
        )}

        {showPachetModal && (
          <PachetModal 
            onClose={() => setShowPachetModal(false)}
            setPachete={setPachete}
            materii={materii}
          />
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #024A76, #3471B8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #3471B8, #024A76);
        }
      `}</style>
    </div>
  );
};

export default AdminMateriiPage; 