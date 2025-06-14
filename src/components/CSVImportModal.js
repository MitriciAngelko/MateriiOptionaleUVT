import React, { useState } from 'react';
import { parseCSV, validateUserData, generateEmail } from '../utils/csvUtils';

const CSVImportModal = ({ onClose, onImport }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
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
        setPreviewData(processedData.slice(0, 5)); // Show first 5 rows for preview
        
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Încarcă fișierul CSV cu utilizatori
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Selectează un fișier CSV care respectă formatul template-ului.
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-lg font-medium text-gray-900">
            Selectează fișierul CSV
          </span>
          <span className="text-sm text-gray-500 mt-1">
            sau trage și plasează aici
          </span>
        </label>
      </div>

      {csvFile && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Fișier selectat:</strong> {csvFile.name}
          </p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-red-50 p-4 rounded-lg max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium text-red-800 mb-2">Erori de validare:</h4>
          <ul className="text-sm text-red-700 space-y-1">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Previzualizare date
        </h3>
        <p className="text-sm text-gray-600">
          Verifică datele înainte de import. Vor fi importați {csvData.length} utilizatori.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Importul va fi procesat în batch-uri</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Pentru a evita limitările Firebase, utilizatorii vor fi creați în grupuri mici cu pauze între ele. 
              Procesul poate dura câteva minute pentru un număr mare de utilizatori.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prenume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facultate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specializare</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewData.map((user, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.tip === 'student' ? 'bg-blue-100 text-blue-800' :
                    user.tip === 'profesor' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user.tip}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nume}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.prenume}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.facultate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.specializare || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {csvData.length > 5 && (
          <p className="text-center text-sm text-gray-500 mt-2">
            ... și încă {csvData.length - 5} utilizatori
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setStep(1)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Înapoi
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Se importă...' : 'Importă utilizatorii'}
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Se importă utilizatorii...
      </h3>
      
      {progressInfo && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressInfo.percentage}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>{progressInfo.current}</strong> din <strong>{progressInfo.total}</strong> utilizatori procesați</p>
            <p>{progressInfo.status}</p>
            {progressInfo.currentUser && (
              <p className="text-blue-600">Utilizator curent: <strong>{progressInfo.currentUser}</strong></p>
            )}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
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
        importResults?.errors?.length > 0 ? 'bg-yellow-100' : 'bg-green-100'
      }`}>
        <svg className={`h-6 w-6 ${
          importResults?.errors?.length > 0 ? 'text-yellow-600' : 'text-green-600'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {importResults?.errors?.length > 0 ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          )}
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {importResults?.errors?.length > 0 ? 'Import finalizat parțial' : 'Import finalizat cu succes!'}
      </h3>
      
      <div className="text-sm text-gray-600 space-y-2">
        <p>
          <strong>Utilizatori creați cu succes:</strong> {importResults?.success || 0}
        </p>
        {importResults?.errors?.length > 0 && (
          <div className="mt-4">
            <p className="text-red-600 font-medium mb-2">
              <strong>Erori ({importResults.errors.length}):</strong>
            </p>
            <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto text-left">
              <ul className="text-sm text-red-700 space-y-1">
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
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Închide
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          {step !== 3 && ( // Don't show close button during processing
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
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