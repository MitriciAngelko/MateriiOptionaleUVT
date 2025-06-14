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
import BulkUploadPreview from '../../components/admin/materii/BulkUploadPreview';

// Import utilities and constants
import { removeDiacritics, getRandomLoadingMessage } from '../../components/admin/materii/utils';
import { parseCsvToMaterii, bulkUploadMaterii, validateCsvData } from '../../components/admin/materii/csvParser';

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
  
  // State pentru preview și rezultate
  const [showPreview, setShowPreview] = useState(false);
  const [previewMaterii, setPreviewMaterii] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);

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

  const handlePreviewConfirm = async () => {
    try {
      setShowPreview(false);
      setIsProcessing(true);
      setProcessingMessage(`Încarc ${previewMaterii.length} materii în baza de date...`);
      
      // Bulk upload to Firebase with progress tracking
      const results = await bulkUploadMaterii(previewMaterii, (progress) => {
        setProcessingMessage(
          `Încarc materii: ${progress.current}/${progress.total} (${progress.percentage}%)\n` +
          `Materia curentă: ${progress.currentMaterie}`
        );
      });
      
      setIsProcessing(false);
      setUploadResults(results);
      setShowPreview(true);
      
      // Refresh materii list to show new courses
      fetchMaterii();
      
    } catch (error) {
      console.error('Error during bulk upload:', error);
      setIsProcessing(false);
      setError(`Eroare la încărcarea materiilor: ${error.message}`);
    }
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    setPreviewMaterii([]);
    setUploadResults(null);
    
    // Reset form if canceling before upload
    if (!uploadResults) {
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
    }
  };

  const handleResultsClose = () => {
    setShowPreview(false);
    setPreviewMaterii([]);
    setUploadResults(null);
    
    // Reset form after successful upload
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
      
      // Extract CSV data from the output_text field as specified
      let csvData;
      
      if (response.output_text) {
        csvData = response.output_text;
      } else if (response.text?.content) {
        csvData = response.text.content;
      } else if (response.text) {
        csvData = response.text;
      } else if (response.output?.text) {
        csvData = response.output.text;
      } else if (response.data?.text) {
        csvData = response.data.text;
      } else if (response.content) {
        csvData = response.content;
      } else if (typeof response === 'string') {
        csvData = response;
      } else {
        // Last resort - try to stringify the response
        console.warn('Unexpected response structure, attempting to extract text...');
        csvData = JSON.stringify(response);
      }
      
      console.log('=== EXTRACTED CSV DATA ===');
      console.log('CSV Data:', csvData);
      console.log('CSV Type:', typeof csvData);
      console.log('CSV Length:', csvData?.length);
      console.log('Is String:', typeof csvData === 'string');
      console.log('==========================');
      
      // Validate CSV data
      const validation = validateCsvData(csvData);
      if (!validation.isValid) {
        throw new Error(`CSV validation failed: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('CSV validation warnings:', validation.warnings);
      }
      
      setProcessingMessage('📊 Procesez datele CSV...');
      
      // Parse CSV to materii objects
      const materiiList = parseCsvToMaterii(csvData, bulkUploadData.facultate, bulkUploadData.specializare);
      
      if (materiiList.length === 0) {
        throw new Error('Nu s-au putut extrage materii valide din fișierul PDF.');
      }
      
      // Show preview instead of immediately uploading
      setProcessingMessage(' Extragerea datelor completă!');
      
      setTimeout(() => {
        setIsProcessing(false);
        setPreviewMaterii(materiiList);
        setShowPreview(true);
      }, 1000);

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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile-First Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-blue-light dark:to-yellow-accent bg-clip-text text-transparent drop-shadow-sm">
              Administrare Materii
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
              Gestionează materiile, pachetele și importurile în masă
            </p>
          </div>
        </div>

        {/* Mobile-Optimized Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Dropdown Style */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[#024A76] dark:text-blue-light font-semibold focus:ring-2 focus:ring-[#E3AB23] dark:focus:ring-yellow-accent focus:border-[#E3AB23] dark:focus:border-yellow-accent transition-all duration-300 shadow-lg"
            >
              <option value="materii">Materii</option>
              <option value="pachete">Pachete</option>
              <option value="bulk-upload">Import în Masă</option>
            </select>
          </div>

          {/* Desktop: Traditional Tabs */}
          <div className="hidden sm:flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('materii')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center text-sm lg:text-base ${
                activeTab === 'materii'
                  ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Materii
            </button>
            <button
              onClick={() => setActiveTab('pachete')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center text-sm lg:text-base ${
                activeTab === 'pachete'
                  ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Pachete
            </button>
            <button
              onClick={() => setActiveTab('bulk-upload')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center text-sm lg:text-base ${
                activeTab === 'bulk-upload'
                  ? 'bg-gradient-to-r from-[#024A76] to-[#3471B8] dark:from-[#024A76] dark:to-[#3471B8] text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/50 text-[#024A76] dark:text-blue-light hover:bg-gradient-to-r hover:from-[#024A76]/10 hover:to-[#3471B8]/10 dark:hover:from-[#024A76]/10 dark:hover:to-[#3471B8]/10 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Import în Masă
            </button>
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
          <div className="space-y-6 sm:space-y-8">
            {!selectedMaterie && (
              <FiltersComponent 
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
              />
            )}

            {!selectedMaterie ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="order-2 lg:order-1">
                  <AddMaterieForm 
                    newMaterie={newMaterie}
                    setNewMaterie={setNewMaterie}
                    handleSubmit={handleSubmit}
                  />
                </div>

                <div className="order-1 lg:order-2">
                  <MateriesList 
                    filteredMaterii={getFilteredMaterii()}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setSelectedMaterie={setSelectedMaterie}
                    handleDelete={handleDelete}
                  />
                </div>
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

        {showPreview && (
          <BulkUploadPreview 
            materiiList={previewMaterii}
            uploadResults={uploadResults}
            onConfirm={uploadResults ? handleResultsClose : handlePreviewConfirm}
            onCancel={handlePreviewCancel}
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