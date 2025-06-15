import React, { useState } from 'react';
import { parseCSV, validateUserData, generateEmail } from '../utils/csvUtils';

const CSVImportModal = ({ onClose, onImport }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Processing, 4: Results
  const [importResults, setImportResults] = useState(null);
  const [progressInfo, setProgressInfo] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          setValidationErrors(['Fișierul CSV este gol']);
          return;
        }

        // Remove header row
        const dataWithoutHeader = parsedData.slice(1);
        
        // Process and validate data
        const processedData = [];
        const errors = [];

        dataWithoutHeader.forEach((row, index) => {
          if (row.length < 7) {
            errors.push(`Rând ${index + 2}: Număr insuficient de coloane`);
            return;
          }

          const userData = {
            tip: row[0],
            nume: row[1],
            prenume: row[2],
            anNastere: row[3],
            facultate: row[4],
            specializare: row[5],
            an: row[6]
          };

          // Validate data
          const rowErrors = validateUserData(userData, index + 2);
          errors.push(...rowErrors);

          // Generate email
          if (rowErrors.length === 0) {
            userData.email = generateEmail(userData.tip, userData.nume, userData.prenume, userData.anNastere);
            processedData.push(userData);
          }
        });

        setCsvData(processedData);
        setValidationErrors(errors);
        
        if (errors.length === 0) {
          setStep(2);
        }
      } catch (error) {
        setValidationErrors(['Eroare la parsarea fișierului CSV: ' + error.message]);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setStep(3); // Move to processing step
    setProgressInfo({
      current: 0,
      total: csvData.length,
      percentage: 0,
      currentUser: '',
      batchNumber: 0,
      totalBatches: 0,
      status: 'Inițializare...'
    });

    try {
      // Create a wrapper for onImport that tracks progress
      const results = await onImport(csvData, (progress) => {
        setProgressInfo({
          current: progress.current,
          total: progress.total,
          percentage: progress.percentage,
          currentUser: progress.currentItem ? `${progress.currentItem.nume} ${progress.currentItem.prenume}` : '',
          batchNumber: progress.batchNumber,
          totalBatches: progress.totalBatches,
          status: `Procesez batch ${progress.batchNumber}/${progress.totalBatches}`
        });
      });
      
      setImportResults(results);
      setStep(4); // Move to results step
    } catch (error) {
      setValidationErrors(['Eroare la importul utilizatorilor: ' + error.message]);
      setStep(2); // Go back to preview step
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-2">
          Încarcă fișierul CSV cu utilizatori
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Selectează un fișier CSV care respectă formatul template-ului.
        </p>
      </div>

      <div className="border-2 border-dashed border-[#024A76]/30 dark:border-blue-light/30 rounded-lg p-8 text-center hover:border-[#E3AB23] dark:hover:border-yellow-accent hover:bg-[#024A76]/5 dark:hover:bg-blue-light/5 transition-all duration-300">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg className="w-12 h-12 text-[#024A76]/60 dark:text-blue-light/60 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-lg font-medium text-[#024A76] dark:text-blue-light">
            Selectează fișierul CSV
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            sau trage și plasează aici
          </span>
        </label>
      </div>

      {csvFile && (
        <div className="bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-yellow-accent/10 dark:to-blue-light/5 p-4 rounded-lg border border-[#E3AB23]/30 dark:border-yellow-accent/30">
          <p className="text-sm text-[#024A76] dark:text-blue-light">
            <strong>Fișier selectat:</strong> {csvFile.name}
          </p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg max-h-60 overflow-y-auto border border-red-200 dark:border-red-800/50 custom-scrollbar">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Erori de validare:</h4>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-2">
          Previzualizare date
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Verifică datele înainte de import. Vor fi importați {csvData.length} utilizatori.
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-yellow-accent/10 dark:to-blue-light/5 border border-[#E3AB23]/30 dark:border-yellow-accent/30 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-[#E3AB23] dark:text-yellow-accent mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-[#024A76] dark:text-blue-light">Importul va fi procesat în batch-uri</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Pentru a evita limitările Firebase, utilizatorii vor fi creați în grupuri mici cu pauze între ele. 
              Procesul poate dura câteva minute pentru un număr mare de utilizatori.
            </p>
          </div>
        </div>
      </div>



      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setStep(1)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          Înapoi
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="px-6 py-2 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-md hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Se importă...' : 'Importă utilizatorii'}
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6">
        <div className="w-16 h-16 border-4 border-[#024A76]/20 dark:border-blue-light/20 border-t-[#E3AB23] dark:border-t-yellow-accent rounded-full animate-spin"></div>
      </div>
      
      <h3 className="text-lg font-semibold text-[#024A76] dark:text-blue-light mb-4">
        Se importă utilizatorii...
      </h3>
      
      {progressInfo && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressInfo.percentage}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p><strong className="text-[#024A76] dark:text-blue-light">{progressInfo.current}</strong> din <strong className="text-[#024A76] dark:text-blue-light">{progressInfo.total}</strong> utilizatori procesați</p>
            <p className="text-gray-700 dark:text-gray-200">{progressInfo.status}</p>
            {progressInfo.currentUser && (
              <p className="text-[#E3AB23] dark:text-yellow-accent">Utilizator curent: <strong>{progressInfo.currentUser}</strong></p>
            )}
          </div>
          
          <div className="bg-gradient-to-r from-[#E3AB23]/10 to-[#E3AB23]/5 dark:from-yellow-accent/10 dark:to-blue-light/5 border border-[#E3AB23]/30 dark:border-yellow-accent/30 rounded-lg p-3">
            <p className="text-xs text-[#024A76] dark:text-blue-light">
              <strong>Nu închide această fereastră!</strong> Procesul poate dura câteva minute.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderResultsStep = () => (
    <div className="text-center py-8">
      <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
        importResults?.errors?.length > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'
      }`}>
        <svg className={`h-6 w-6 ${
          importResults?.errors?.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {importResults?.errors?.length > 0 ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          )}
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-[#024A76] dark:text-blue-light mb-2">
        {importResults?.errors?.length > 0 ? 'Import finalizat parțial' : 'Import finalizat cu succes!'}
      </h3>
      
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
        <p>
          <strong className="text-[#024A76] dark:text-blue-light">Utilizatori creați cu succes:</strong> {importResults?.success || 0}
        </p>
        {importResults?.errors?.length > 0 && (
          <div className="mt-4">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
              <strong>Erori ({importResults.errors.length}):</strong>
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg max-h-40 overflow-y-auto text-left border border-red-200 dark:border-red-800/50 custom-scrollbar">
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                {importResults.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="mt-6 px-6 py-2 bg-gradient-to-r from-[#E3AB23] to-[#E3AB23]/80 dark:from-blue-light dark:to-blue-dark text-[#024A76] dark:text-white rounded-md hover:shadow-lg transition-all duration-300 font-semibold"
      >
        Închide
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-full max-w-4xl shadow-2xl rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-md transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          {step !== 3 && ( // Don't show close button during processing
            <button 
              onClick={onClose} 
              className="text-gray-600 dark:text-gray-400 hover:text-[#024A76] dark:hover:text-blue-light transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {step === 1 && renderUploadStep()}
        {step === 2 && renderPreviewStep()}
        {step === 3 && renderProcessingStep()}
        {step === 4 && renderResultsStep()}
      </div>
    </div>
  );
};

export default CSVImportModal; 