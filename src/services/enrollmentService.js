import { db } from '../firebase/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';

/**
 * Allocates courses based on student preferences and grades
 * Students with higher grades have priority
 * @param {string} pachetId - Course package ID
 * @returns {Promise<Object>} - Allocation results
 */
export const alocaMateriiPreferate = async (pachetId) => {
  try {
    // 1. Get the course package
    const pachetDoc = await getDoc(doc(db, 'pachete', pachetId));
    if (!pachetDoc.exists()) {
      throw new Error(`Package with ID ${pachetId} does not exist`);
    }

    const pachetData = pachetDoc.data();
    const materiiInPachet = pachetData.materii || [];
    const anPachet = pachetData.anDeStudiu || 'I';

    console.log(`Processing allocation for package "${pachetData.nume}" for year ${anPachet}`);
    console.log(`Package ID: ${pachetId}`);
    console.log(`Courses in package: ${materiiInPachet.length}`);

    // 2. Get all students who have preferences for this package
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const usersSnapshot = await getDocs(usersQuery);

    console.log(`Total students: ${usersSnapshot.size}`);

    // 3. Create a list of students with preferences for this package
    const studentiCuPreferinte = [];
    const anCurent = new Date().getFullYear();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      let preferinteLista = [];
      let arePreferinte = false;

      // Check main format: preferinteMateriiOptionale[packetId]
      if (userData.preferinteMateriiOptionale && 
          userData.preferinteMateriiOptionale[pachetId] && 
          userData.preferinteMateriiOptionale[pachetId].length > 0) {
        preferinteLista = userData.preferinteMateriiOptionale[pachetId];
        arePreferinte = true;
      }
      // Check alternative format: preferences as direct array
      else if (userData.preferinte && Array.isArray(userData.preferinte) && userData.preferinte.length > 0) {
        preferinteLista = userData.preferinte;
        arePreferinte = true;
      }
      // Check another format: prefPachet and prefMaterii
      else if (userData.prefPachet === pachetId && 
               userData.prefMaterii && 
               Array.isArray(userData.prefMaterii) && 
               userData.prefMaterii.length > 0) {
        preferinteLista = userData.prefMaterii;
        arePreferinte = true;
      }

      if (arePreferinte) {
        const anStudent = userData.anStudiu || anPachet;
        let mediaRelevanta = 0;

        // For first year students, use first semester grade
        if (anStudent === 'I') {
          mediaRelevanta = userData.mediaSemestru1AnI || userData.media || 0;
        } else {
          // For second and third year students, use previous year's average
          if (userData.istoricAcademic) {
            const anAnterior = anStudent === 'II' ? 'I' : 'II';
            const intrarileAnAnterior = userData.istoricAcademic.filter(intrare => 
              intrare.anStudiu === anAnterior && 
              intrare.anUniversitar === `${anCurent-1}-${anCurent}`
            );

            if (intrarileAnAnterior.length > 0) {
              let sumaNoteAnAnterior = 0;
              let numarNoteAnAnterior = 0;

              for (const intrare of intrarileAnAnterior) {
                sumaNoteAnAnterior += intrare.nota || 0;
                numarNoteAnAnterior++;
              }

              if (numarNoteAnAnterior > 0) {
                mediaRelevanta = sumaNoteAnAnterior / numarNoteAnAnterior;
              }
            }
          }

          if (mediaRelevanta === 0) {
            mediaRelevanta = userData.media || 0;
          }
        }

        studentiCuPreferinte.push({
          id: userDoc.id,
          nume: userData.nume || '',
          prenume: userData.prenume || '',
          numarMatricol: userData.numarMatricol || '',
          email: userData.email || '',
          anStudiu: anStudent,
          media: mediaRelevanta,
          mediaGenerala: userData.media || 0,
          preferinte: preferinteLista
        });
      }
    }

    console.log(`Total students with preferences: ${studentiCuPreferinte.length}`);

    if (studentiCuPreferinte.length === 0) {
      console.warn('WARNING: No students found with preferences for this package.');
    }

    // Sort students by relevant grade (descending)
    studentiCuPreferinte.sort((a, b) => b.media - a.media);

    // 4. Allocate courses based on preferences and available spots
    const materiiAlocate = {};
    const alocariStudenti = {};
    const rezultateAlocare = {
      studentiAlocati: [],
      studentiNealocati: [],
      materiiCuLocuriRamase: [],
      statisticiPreferinte: {}
    };

    // Initialize data structures
    for (const materie of materiiInPachet) {
      materiiAlocate[materie.id] = [];
      rezultateAlocare.statisticiPreferinte[materie.id] = {
        nume: materie.nume || '',
        preferinta1: 0,
        preferinta2: 0,
        preferinta3: 0,
        preferinta4: 0,
        preferinta5: 0,
        altaPreferinta: 0
      };
    }

    console.log('\n=== ALLOCATION PROCESS STARTS ===');

    // Iterate through students (in order of grades - highest to lowest)
    for (const student of studentiCuPreferinte) {
      let alocatCuSucces = false;

      console.log(`\nAllocation for student ${student.nume} ${student.prenume} (Grade: ${student.media})`);

      // Try to allocate student to one of their preferences
      for (let index = 0; index < student.preferinte.length; index++) {
        const materieId = student.preferinte[index];
        const materie = materiiInPachet.find(m => m.id === materieId);

        if (!materie) {
          console.log(`- Course ${materieId} not found in package`);
          continue;
        }

        const locuriOcupate = materiiAlocate[materieId].length;
        const locuriDisponibile = materie.locuriDisponibile || 0;

        if (locuriOcupate < locuriDisponibile) {
          // Allocate student to this course
          materiiAlocate[materieId].push(student.id);
          alocariStudenti[student.id] = materieId;

          // Update preference statistics
          const pozitiePreferinta = index + 1;
          if (pozitiePreferinta <= 5) {
            rezultateAlocare.statisticiPreferinte[materieId][`preferinta${pozitiePreferinta}`]++;
          } else {
            rezultateAlocare.statisticiPreferinte[materieId].altaPreferinta++;
          }

          rezultateAlocare.studentiAlocati.push({
            ...student,
            materieAlocata: {
              id: materieId,
              nume: materie.nume,
              pozitiePreferinta: pozitiePreferinta
            }
          });

          console.log(`- ✓ Allocated to "${materie.nume}" (preference ${pozitiePreferinta})`);
          alocatCuSucces = true;
          break;
        } else {
          console.log(`- ✗ "${materie.nume}" is full (${locuriOcupate}/${locuriDisponibile})`);
        }
      }

      if (!alocatCuSucces) {
        rezultateAlocare.studentiNealocati.push(student);
        console.log(`- ✗ Student could not be allocated to any preferred course`);
      }
    }

    // 5. Calculate remaining spots
    for (const materie of materiiInPachet) {
      const locuriOcupate = materiiAlocate[materie.id].length;
      const locuriDisponibile = materie.locuriDisponibile || 0;
      const locuriRamase = locuriDisponibile - locuriOcupate;

      if (locuriRamase > 0) {
        rezultateAlocare.materiiCuLocuriRamase.push({
          id: materie.id,
          nume: materie.nume,
          locuriRamase: locuriRamase,
          locuriTotale: locuriDisponibile
        });
      }
    }

    console.log('\n=== ALLOCATION RESULTS ===');
    console.log(`Students allocated: ${rezultateAlocare.studentiAlocati.length}`);
    console.log(`Students not allocated: ${rezultateAlocare.studentiNealocati.length}`);
    console.log(`Courses with remaining spots: ${rezultateAlocare.materiiCuLocuriRamase.length}`);

    return rezultateAlocare;

  } catch (error) {
    console.error('Error in course allocation:', error);
    throw error;
  }
};

/**
 * Checks if enrollment period is active for a package
 * @param {string} pachetId - Package ID
 * @returns {Promise<boolean>} - Whether enrollment is active
 */
export const verificaPerioadaInscriere = async (pachetId) => {
  try {
    const pachetDoc = await getDoc(doc(db, 'pachete', pachetId));
    
    if (!pachetDoc.exists()) {
      return false;
    }

    const pachetData = pachetDoc.data();
    const now = new Date();

    // Check if enrollment period is defined and active
    if (pachetData.perioadaInscriere) {
      const dataInceput = new Date(pachetData.perioadaInscriere.dataInceput);
      const dataSfarsit = new Date(pachetData.perioadaInscriere.dataSfarsit);
      
      return now >= dataInceput && now <= dataSfarsit;
    }

    // If no enrollment period is defined, consider it inactive
    return false;
  } catch (error) {
    console.error('Error checking enrollment period:', error);
    return false;
  }
};

/**
 * Sets enrollment period for a package
 * @param {string} pachetId - Package ID
 * @param {Object} perioadaData - Period data with start and end dates
 * @returns {Promise<void>}
 */
export const setPerioadaInscriere = async (pachetId, perioadaData) => {
  try {
    const pachetRef = doc(db, 'pachete', pachetId);
    await updateDoc(pachetRef, {
      perioadaInscriere: perioadaData
    });
  } catch (error) {
    console.error('Error setting enrollment period:', error);
    throw error;
  }
}; 