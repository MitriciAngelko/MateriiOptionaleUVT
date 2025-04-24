const admin = require('../config/firebase');
const db = admin.firestore();

/**
 * Alocă materiile în funcție de preferințele studenților și mediile acestora
 * Studenții cu medii mai mari au prioritate
 * @param {string} pachetId - ID-ul pachetului de materii
 * @returns {Promise<Object>} - Rezultatul alocării
 */
const alocaMateriiPreferate = async (pachetId) => {
  try {
    // 1. Obține pachetul de materii
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      throw new Error(`Pachetul cu ID-ul ${pachetId} nu există`);
    }

    const pachetData = pachetDoc.data();
    const materiiInPachet = pachetData.materii || [];

    // 2. Obține toți studenții care au preferințe pentru acest pachet
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();

    // 3. Creează o listă de studenți care au preferințe pentru acest pachet
    // și sortează-i în funcție de medie (descrescător)
    const studentiCuPreferinte = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Verifică dacă studentul are preferințe pentru acest pachet
      if (userData.preferinteMateriiOptionale && 
          userData.preferinteMateriiOptionale[pachetId] && 
          userData.preferinteMateriiOptionale[pachetId].length > 0) {
        
        // Obține media studentului
        const media = userData.media || 0;
        
        studentiCuPreferinte.push({
          id: userDoc.id,
          nume: userData.nume || '',
          prenume: userData.prenume || '',
          numarMatricol: userData.numarMatricol || '',
          email: userData.email || '',
          media: media,
          preferinte: userData.preferinteMateriiOptionale[pachetId] || []
        });
      }
    }

    // Sortează studenții după medie (descrescător)
    studentiCuPreferinte.sort((a, b) => b.media - a.media);

    // 4. Alocă materiile în funcție de preferințe și locuri disponibile
    const materiiAlocate = {}; // materie_id -> [student_ids]
    const alocariStudenti = {}; // student_id -> materie_id
    const rezultateAlocare = {
      studentiAlocati: [],
      studentiNealocati: [],
      materiiCuLocuriRamase: []
    };

    // Inițializează structura de date pentru materiile alocate
    for (const materie of materiiInPachet) {
      materiiAlocate[materie.id] = [];
    }

    // Iterăm prin studenți (în ordinea mediilor)
    for (const student of studentiCuPreferinte) {
      let alocatCuSucces = false;

      // Încercăm să alocăm studentul la una dintre preferințele sale
      // în ordinea preferințelor (prima preferință are prioritate)
      for (const materieId of student.preferinte) {
        // Găsim materia în pachet
        const materie = materiiInPachet.find(m => m.id === materieId);
        if (!materie) continue;

        // Verificăm dacă mai sunt locuri disponibile
        const locuriDisponibile = materie.locuriDisponibile || 0;
        const locuriOcupate = materiiAlocate[materieId].length || 0;

        if (locuriOcupate < locuriDisponibile) {
          // Alocă studentul la această materie
          materiiAlocate[materieId].push(student.id);
          alocariStudenti[student.id] = materieId;
          alocatCuSucces = true;
          
          // Adaugă studentul la lista de studenți alocați
          rezultateAlocare.studentiAlocati.push({
            ...student,
            materieAlocata: materieId,
            numeMaterieAlocata: materie.nume || '',
            pozitiePrioritate: student.preferinte.indexOf(materieId) + 1
          });
          
          break; // Trecem la următorul student
        }
      }

      // Dacă studentul nu a fost alocat la nicio materie, îl adăugăm la lista de nealocați
      if (!alocatCuSucces) {
        rezultateAlocare.studentiNealocati.push(student);
      }
    }

    // 5. Calculează materiile care mai au locuri disponibile
    for (const materie of materiiInPachet) {
      const locuriDisponibile = materie.locuriDisponibile || 0;
      const locuriOcupate = materiiAlocate[materie.id]?.length || 0;
      const locuriRamase = locuriDisponibile - locuriOcupate;

      if (locuriRamase > 0) {
        rezultateAlocare.materiiCuLocuriRamase.push({
          id: materie.id,
          nume: materie.nume || '',
          locuriRamase: locuriRamase
        });
      }
    }

    // 6. Actualizează baza de date cu alocările
    const batch = db.batch();

    // Actualizează studenții alocați
    for (const studentId in alocariStudenti) {
      const materieId = alocariStudenti[studentId];
      const userRef = db.collection('users').doc(studentId);
      
      batch.update(userRef, {
        materiiInscrise: admin.firestore.FieldValue.arrayUnion(materieId)
      });
      
      // Actualizează și materia cu studentul înscris
      const student = studentiCuPreferinte.find(s => s.id === studentId);
      const materieRef = db.collection('materii').doc(materieId);
      
      batch.update(materieRef, {
        studentiInscrisi: admin.firestore.FieldValue.arrayUnion({
          id: studentId,
          nume: `${student.nume} ${student.prenume}`.trim(),
          numarMatricol: student.numarMatricol || 'N/A'
        })
      });
    }

    // Execută actualizările în batch
    await batch.commit();

    return rezultateAlocare;
  } catch (error) {
    console.error('Eroare la alocarea materiilor:', error);
    throw error;
  }
};

/**
 * Verifică dacă perioada de înscriere pentru un pachet este activă
 * @param {string} pachetId - ID-ul pachetului de materii
 * @returns {Promise<boolean>} - true dacă înscrierea este activă, false în caz contrar
 */
const verificaPerioadaInscriere = async (pachetId) => {
  try {
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      throw new Error(`Pachetul cu ID-ul ${pachetId} nu există`);
    }

    const pachetData = pachetDoc.data();
    const dataStart = pachetData.dataStart ? new Date(pachetData.dataStart) : null;
    const dataFinal = pachetData.dataFinal ? new Date(pachetData.dataFinal) : null;
    const acum = new Date();

    // Verifică dacă perioada de înscriere este activă
    if (!dataStart || !dataFinal) {
      return false; // Dacă datele nu sunt setate, înscrierea nu este activă
    }

    return acum >= dataStart && acum <= dataFinal;
  } catch (error) {
    console.error('Eroare la verificarea perioadei de înscriere:', error);
    throw error;
  }
};

module.exports = {
  alocaMateriiPreferate,
  verificaPerioadaInscriere
}; 