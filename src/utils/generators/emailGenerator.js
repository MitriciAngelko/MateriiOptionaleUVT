/**
 * Cleans a name by removing spaces, diacritics, and non-alphabetic characters
 * @param {string} name - The name to clean
 * @returns {string} - The cleaned name
 */
const cleanName = (name) => {
  return name.toLowerCase()
    .replace(/\s+/g, '') // remove spaces
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z]/g, ''); // keep only letters
};

/**
 * Generates email for professor based on name and surname
 * @param {string} nume - Last name
 * @param {string} prenume - First name
 * @returns {string} - Generated email
 */
export const generateProfesorEmail = (nume, prenume) => {
  const cleanNume = cleanName(nume);
  const cleanPrenume = cleanName(prenume);
  return `${cleanPrenume}.${cleanNume}@e-uvt.ro`;
};

/**
 * Generates email for student based on name, surname and birth year
 * @param {string} nume - Last name
 * @param {string} prenume - First name
 * @param {string} anNastere - Birth year
 * @returns {string} - Generated email
 */
export const generateStudentEmail = (nume, prenume, anNastere) => {
  if (!nume || !prenume || !anNastere) return '';
  
  const cleanNume = cleanName(nume);
  const cleanPrenume = cleanName(prenume);
  const ultimeleCifre = anNastere.slice(-2);
  
  return `${cleanPrenume}.${cleanNume}${ultimeleCifre}@e-uvt.ro`;
}; 