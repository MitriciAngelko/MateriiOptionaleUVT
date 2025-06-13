// CSV utility functions for user import/export

// Generate CSV template for user import
export const generateUserCSVTemplate = () => {
  const headers = [
    'tip', // student, profesor, secretar
    'nume',
    'prenume', 
    'anNastere', // Pentru studenți (folosit pentru generarea email-ului)
    'facultate',
    'specializare', // Pentru studenți și profesori
    'an', // Pentru studenți (I, II, III)
  ];

  return [headers];
};

// Convert array to CSV string
export const arrayToCSV = (data) => {
  return data.map(row => 
    row.map(field => {
      // Escape quotes and wrap fields containing commas or quotes
      if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',')
  ).join('\n');
};

// Parse CSV string to array
export const parseCSV = (csvText) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
    i++;
  }

  // Add last field/row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter(row => row.length > 0 && row.some(field => field !== ''));
};

// Download CSV file
export const downloadCSV = (filename, csvData) => {
  const csvString = arrayToCSV(csvData);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Validate user data from CSV
export const validateUserData = (userData, rowIndex) => {
  const errors = [];
  const { tip, nume, prenume, anNastere, facultate, specializare, an } = userData;

  // Required fields for all users
  if (!tip || !['student', 'profesor', 'secretar'].includes(tip)) {
    errors.push(`Rând ${rowIndex}: Tip utilizator invalid. Trebuie să fie: student, profesor sau secretar`);
  }
  
  if (!nume || nume.trim().length === 0) {
    errors.push(`Rând ${rowIndex}: Numele este obligatoriu`);
  }
  
  if (!prenume || prenume.trim().length === 0) {
    errors.push(`Rând ${rowIndex}: Prenumele este obligatoriu`);
  }

  if (!facultate || facultate.trim().length === 0) {
    errors.push(`Rând ${rowIndex}: Facultatea este obligatorie`);
  }

  // Student-specific validations
  if (tip === 'student') {
    if (!anNastere || !/^\d{4}$/.test(anNastere)) {
      errors.push(`Rând ${rowIndex}: Anul nașterii este obligatoriu pentru studenți și trebuie să fie format din 4 cifre`);
    }
    
    if (!specializare || specializare.trim().length === 0) {
      errors.push(`Rând ${rowIndex}: Specializarea este obligatorie pentru studenți`);
    }
    
    if (!an || !['I', 'II', 'III'].includes(an)) {
      errors.push(`Rând ${rowIndex}: Anul de studiu este obligatoriu pentru studenți și trebuie să fie I, II sau III`);
    }
  }

  return errors;
};

// Generate email based on user type
export const generateEmail = (tip, nume, prenume, anNastere) => {
  const cleanNume = nume.toLowerCase()
    .replace(/\s+/g, '')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, '');
  
  const cleanPrenume = prenume.toLowerCase()
    .replace(/\s+/g, '')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, '');

  if (tip === 'student') {
    const ultimeleCifre = anNastere.slice(-2);
    return `${cleanPrenume}.${cleanNume}${ultimeleCifre}@e-uvt.ro`;
  } else {
    // profesor sau secretar
    return `${cleanPrenume}.${cleanNume}@e-uvt.ro`;
  }
}; 