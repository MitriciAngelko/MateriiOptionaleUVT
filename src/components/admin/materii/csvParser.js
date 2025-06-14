import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Parses CSV data and maps it to materii document structure
 * @param {string} csvData - Raw CSV data from OpenAI
 * @param {string} facultate - Selected facultate
 * @param {string} specializare - Selected specializare
 * @returns {Array} - Array of parsed materii objects
 */
export const parseCsvToMaterii = (csvData, facultate, specializare) => {
  try {
    console.log('=== PARSING CSV DATA ===');
    console.log('Raw CSV:', csvData);
    console.log('CSV Type:', typeof csvData);
    console.log('Facultate:', facultate);
    console.log('Specializare:', specializare);
    
    // Convert to string if it's not already a string
    const csvString = typeof csvData === 'string' ? csvData : String(csvData || '');
    console.log('Converted CSV String:', csvString);
    
    // Split CSV into lines and filter out empty lines
    const lines = csvString.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV data is empty');
    }
    
    // Skip header line if it exists (check if first line contains common header terms)
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('course') || firstLine.includes('name') || 
                     firstLine.includes('status') || firstLine.includes('semester') ||
                     firstLine.includes('year') || firstLine.includes('credits');
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    console.log(`Processing ${dataLines.length} data lines (header ${hasHeader ? 'detected' : 'not detected'})`);
    
    const materiiList = [];
    
    dataLines.forEach((line, index) => {
      try {
        // Split by comma but handle potential issues with commas in course names
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 5) {
          console.warn(`Line ${index + 1} has insufficient columns (${parts.length}): ${line}`);
          return; // Skip this line
        }
        
        const [courseName, status, semester, year, credits] = parts;
        
        // Validate required fields
        if (!courseName || !status || !semester || !year || !credits) {
          console.warn(`Line ${index + 1} has empty required fields: ${line}`);
          return; // Skip this line
        }
        
        // Map status to obligatorie field
        // "Mandatory" -> obligatorie: true
        // "Optional", "Facultative" -> obligatorie: false
        const normalizedStatus = status.toLowerCase().trim();
        const obligatorie = normalizedStatus === 'mandatory';
        
        // Convert year to Roman numerals (I, II, III)
        const yearMapping = {
          '1': 'I',
          '2': 'II', 
          '3': 'III',
          'i': 'I',
          'ii': 'II',
          'iii': 'III'
        };
        
        const normalizedYear = year.toString().toLowerCase().trim();
        const an = yearMapping[normalizedYear] || year.toString().toUpperCase();
        
        // Validate year
        if (!['I', 'II', 'III'].includes(an)) {
          console.warn(`Line ${index + 1} has invalid year "${year}": ${line}`);
          return; // Skip this line
        }
        
        // Validate semester
        const semestru = semester.toString().trim();
        if (!['1', '2'].includes(semestru)) {
          console.warn(`Line ${index + 1} has invalid semester "${semester}": ${line}`);
          return; // Skip this line
        }
        
        // Validate and parse credits
        const crediteNum = parseInt(credits);
        if (isNaN(crediteNum) || crediteNum < 1 || crediteNum > 30) {
          console.warn(`Line ${index + 1} has invalid credits "${credits}": ${line}`);
          return; // Skip this line
        }
        
        // Create materie object matching the Firebase structure
        const materie = {
          nume: courseName.trim(),
          facultate: facultate,
          specializare: specializare,
          an: an,
          semestru: semestru,
          credite: crediteNum.toString(), // Keep as string to match form structure
          obligatorie: obligatorie,
          locuriDisponibile: obligatorie ? null : 30, // Default 30 for optional courses
          descriere: '', // Empty description for bulk uploaded courses
          profesori: [], // Empty professors array
          studentiInscrisi: [] // Empty students array
        };
        
        materiiList.push(materie);
        console.log(` Parsed line ${index + 1}:`, materie);
        
      } catch (error) {
        console.error(`Error parsing line ${index + 1} "${line}":`, error);
        // Continue processing other lines
      }
    });
    
    console.log(`=== PARSING COMPLETE ===`);
    console.log(`Successfully parsed ${materiiList.length} out of ${dataLines.length} lines`);
    
    return materiiList;
    
  } catch (error) {
    console.error('Error parsing CSV data:', error);
    console.error('CSV Data that caused error:', csvData);
    console.error('CSV Data type:', typeof csvData);
    throw new Error(`Failed to parse CSV data: ${error.message}`);
  }
};

/**
 * Bulk uploads materii to Firebase
 * @param {Array} materiiList - Array of materii objects
 * @param {Function} onProgress - Progress callback function
 * @returns {Object} - Upload results
 */
export const bulkUploadMaterii = async (materiiList, onProgress = null) => {
  console.log('=== STARTING BULK UPLOAD ===');
  console.log(`Uploading ${materiiList.length} materii to Firebase`);
  
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < materiiList.length; i++) {
    try {
      const materie = materiiList[i];
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: materiiList.length,
          currentMaterie: materie.nume,
          percentage: Math.round(((i + 1) / materiiList.length) * 100)
        });
      }
      
      console.log(`Uploading ${i + 1}/${materiiList.length}: ${materie.nume}`);
      
      // Add to Firebase
      await addDoc(collection(db, 'materii'), materie);
      
      results.successful++;
      console.log(` Successfully uploaded: ${materie.nume}`);
      
    } catch (error) {
      console.error(` Failed to upload materie ${materiiList[i]?.nume}:`, error);
      results.failed++;
      results.errors.push({
        materie: materiiList[i]?.nume || 'Unknown',
        error: error.message
      });
    }
  }
  
  console.log('=== BULK UPLOAD COMPLETE ===');
  console.log(`Results: ${results.successful} successful, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('Errors:', results.errors);
  }
  
  return results;
};

/**
 * Validates CSV data structure before processing
 * @param {string} csvData - Raw CSV data
 * @returns {Object} - Validation result
 */
export const validateCsvData = (csvData) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    lineCount: 0
  };
  
  try {
    // Convert to string if it's not already a string
    const csvString = typeof csvData === 'string' ? csvData : String(csvData || '');
    
    if (!csvString || csvString.trim() === '') {
      validation.isValid = false;
      validation.errors.push('CSV data is empty');
      return validation;
    }
    
    const lines = csvString.split('\n').filter(line => line.trim() !== '');
    validation.lineCount = lines.length;
    
    if (lines.length === 0) {
      validation.isValid = false;
      validation.errors.push('No valid data lines found');
      return validation;
    }
    
    // Check if we have at least some data
    if (lines.length < 2) {
      validation.warnings.push('Very few data lines detected. Please verify the CSV format.');
    }
    
    // Sample first few lines to check format
    const sampleLines = lines.slice(0, Math.min(3, lines.length));
    
    sampleLines.forEach((line, index) => {
      const parts = line.split(',');
      if (parts.length < 5) {
        validation.warnings.push(`Line ${index + 1} has only ${parts.length} columns (expected 5): Course name, Status, Semester, Year, Credits`);
      }
    });
    
    return validation;
    
  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Validation error: ${error.message}`);
    return validation;
  }
}; 