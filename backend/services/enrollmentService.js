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
    const anPachet = pachetData.anDeStudiu || 'I'; // Anul pachetului (I, II, III)

    console.log(`Procesare alocare pentru pachetul "${pachetData.nume}" destinat anului ${anPachet}`);
    console.log(`ID Pachet: ${pachetId}`);
    console.log(`Materii în pachet: ${materiiInPachet.length}`);
    materiiInPachet.forEach(materie => {
      console.log(`- Materie: ${materie.nume} (ID: ${materie.id}), Locuri: ${materie.locuriDisponibile || 0}`);
    });

    // 2. Obține toți studenții care au preferințe pentru acest pachet
    console.log('\nObținere studenți cu preferințe:');
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();

    console.log(`Total studenți: ${usersSnapshot.size}`);

    // 3. Creează o listă de studenți care au preferințe pentru acest pachet
    // și calculează media relevantă în funcție de anul de studiu
    const studentiCuPreferinte = [];
    const anCurent = new Date().getFullYear();
    const anUniversitarCurent = `${anCurent}-${anCurent + 1}`;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      console.log(`\nVerificare student: ${userData.nume || 'Necunoscut'} ${userData.prenume || ''} (ID: ${userDoc.id})`);
      
      let preferinteLista = [];
      let arePreferinte = false;
      
      // Verifică formatul principal: preferinteMateriiOptionale[pachetId]
      if (userData.preferinteMateriiOptionale && 
          userData.preferinteMateriiOptionale[pachetId] && 
          userData.preferinteMateriiOptionale[pachetId].length > 0) {
        
        preferinteLista = userData.preferinteMateriiOptionale[pachetId];
        arePreferinte = true;
        console.log(`- Are preferințe în preferinteMateriiOptionale[${pachetId}]:`, preferinteLista);
      }
      // Verifică formatul alternativ: preferințe ca array direct
      else if (userData.preferinte && Array.isArray(userData.preferinte) && userData.preferinte.length > 0) {
        preferinteLista = userData.preferinte;
        arePreferinte = true;
        console.log(`- Are preferințe în câmpul preferinte:`, preferinteLista);
      }
      // Verifică alt format: prefPachet și prefMaterii
      else if (userData.prefPachet === pachetId && 
               userData.prefMaterii && 
               Array.isArray(userData.prefMaterii) && 
               userData.prefMaterii.length > 0) {
        
        preferinteLista = userData.prefMaterii;
        arePreferinte = true;
        console.log(`- Are preferințe în prefMaterii pentru pachetul ${pachetId}:`, preferinteLista);
      }
      else {
        console.log(`- Nu are preferințe pentru acest pachet`);
        
        // Verifică alte proprietăți pentru depanare
        if (userData.preferinteMateriiOptionale) {
          console.log(`- Are preferinteMateriiOptionale pentru alte pachete:`, Object.keys(userData.preferinteMateriiOptionale));
        }
      }
      
      // Verifică dacă studentul are preferințe pentru acest pachet
      if (arePreferinte) {
        // Obținerea anului de studiu al studentului
        const anStudent = userData.anStudiu || anPachet;
        
        // Calcularea mediei în funcție de anul de studiu
        let mediaRelevanta = 0;
        
        // Pentru studenții din anul I, folosim media din semestrul 1 al anului I
        if (anStudent === 'I') {
          mediaRelevanta = userData.mediaSemestru1AnI || userData.media || 0;
          console.log(`- Student în anul I - utilizăm media semestrului 1: ${mediaRelevanta}`);
        } 
        // Pentru studenții din anii II și III, folosim media totală din anul anterior
        else {
          // Verifică dacă avem istoric academic
          if (userData.istoricAcademic) {
            // Determinăm anul anterior
            const anAnterior = anStudent === 'II' ? 'I' : 'II';
            // Căutăm intrările din istoricul academic pentru anul anterior
            const intrarileAnAnterior = userData.istoricAcademic.filter(intrare => 
              intrare.anStudiu === anAnterior && 
              intrare.anUniversitar === `${anCurent-1}-${anCurent}`
            );
            
            if (intrarileAnAnterior.length > 0) {
              // Calculăm media din anul anterior
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
          
          // Dacă nu am putut calcula media din istoricul academic, folosim media generală
          if (mediaRelevanta === 0) {
            mediaRelevanta = userData.media || 0;
          }
          
          console.log(`- Student în anul ${anStudent} - utilizăm media anului ${anStudent === 'II' ? 'I' : 'II'}: ${mediaRelevanta}`);
        }
        
        studentiCuPreferinte.push({
          id: userDoc.id,
          nume: userData.nume || '',
          prenume: userData.prenume || '',
          numarMatricol: userData.numarMatricol || '',
          email: userData.email || '',
          anStudiu: anStudent,
          media: mediaRelevanta, // Media relevantă pentru alocare
          mediaGenerala: userData.media || 0, // Păstrăm și media generală
          preferinte: preferinteLista
        });
      }
    }

    console.log(`\nTotal studenți cu preferințe: ${studentiCuPreferinte.length}`);
    
    // Dacă nu am găsit studenți cu preferințe, continuăm procesul dar afișăm un avertisment
    if (studentiCuPreferinte.length === 0) {
      console.warn('AVERTISMENT: Nu s-au găsit studenți cu preferințe pentru acest pachet. Procesul de alocare va continua, dar nu vor fi rezultate.');
      // Nu aruncăm o eroare - permitem continuarea procesului de alocare cu o listă goală de studenți
    }

    // Sortează studenții după media relevantă (descrescător)
    studentiCuPreferinte.sort((a, b) => b.media - a.media);
    
    if (studentiCuPreferinte.length > 0) {
      console.log('\nStudenți sortați după media relevantă:');
      studentiCuPreferinte.forEach(s => 
        console.log(`- ${s.nume} ${s.prenume} (An: ${s.anStudiu}, Media: ${s.media}) - Preferințe: ${s.preferinte.join(', ')}`)
      );
    }

    // 4. Alocă materiile în funcție de preferințe și locuri disponibile
    const materiiAlocate = {}; // materie_id -> [student_ids]
    const alocariStudenti = {}; // student_id -> materie_id
    const rezultateAlocare = {
      studentiAlocati: [],
      studentiNealocati: [],
      materiiCuLocuriRamase: [],
      statisticiPreferinte: {} // Statistici despre alocări pe poziții de preferințe
    };

    // Inițializează structura de date pentru materiile alocate și statistici
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

    console.log('\n=== ÎNCEPE PROCESUL DE ALOCARE ===');

    // Iterăm prin studenți (în ordinea mediilor - de la cea mai mare la cea mai mică)
    for (const student of studentiCuPreferinte) {
      let alocatCuSucces = false;

      console.log(`\nAlocare pentru studentul ${student.nume} ${student.prenume} (Media: ${student.media})`);
      console.log(`- Preferințe: ${student.preferinte.join(', ')}`);

      // Încercăm să alocăm studentul la una dintre preferințele sale
      // în ordinea preferințelor (prima preferință are prioritate)
      for (const materieId of student.preferinte) {
        // Găsim materia în pachet
        const materie = materiiInPachet.find(m => m.id === materieId);
        if (!materie) {
          console.log(`- Materia cu ID ${materieId} nu există în pachet`);
          continue;
        }

        console.log(`- Verificăm materia ${materie.nume} (ID: ${materieId})`);

        // Verificăm dacă mai sunt locuri disponibile
        const locuriDisponibile = materie.locuriDisponibile || 0;
        const locuriOcupate = materiiAlocate[materieId].length || 0;
        const locuriRamase = locuriDisponibile - locuriOcupate;

        console.log(`  Locuri disponibile: ${locuriDisponibile}, Ocupate: ${locuriOcupate}, Rămase: ${locuriRamase}`);

        if (locuriOcupate < locuriDisponibile) {
          // Alocă studentul la această materie
          materiiAlocate[materieId].push(student.id);
          alocariStudenti[student.id] = materieId;
          alocatCuSucces = true;
          
          // Actualizăm statisticile
          const pozitiePreferinta = student.preferinte.indexOf(materieId) + 1;
          if (pozitiePreferinta <= 5) {
            rezultateAlocare.statisticiPreferinte[materieId][`preferinta${pozitiePreferinta}`]++;
          } else {
            rezultateAlocare.statisticiPreferinte[materieId].altaPreferinta++;
          }
          
          // Adaugă studentul la lista de studenți alocați
          rezultateAlocare.studentiAlocati.push({
            ...student,
            materieAlocata: materieId,
            numeMaterieAlocata: materie.nume || '',
            pozitiePrioritate: pozitiePreferinta
          });
          
          console.log(`  ✅ ALOCAT la materia ${materie.nume} (preferința ${pozitiePreferinta})`);
          
          break; // Trecem la următorul student
        } else {
          console.log(`  ❌ Nu mai sunt locuri disponibile la această materie`);
        }
      }

      // Dacă studentul nu a fost alocat la nicio materie, îl adăugăm la lista de nealocați
      if (!alocatCuSucces) {
        rezultateAlocare.studentiNealocati.push(student);
        console.log(`  ❌ NEALOCAT: Nu a putut fi alocat la nicio materie preferată`);
      }
    }

    // 5. Calculează materiile care mai au locuri disponibile
    console.log('\n=== LOCURI RĂMASE ÎN MATERII ===');
    for (const materie of materiiInPachet) {
      const locuriDisponibile = materie.locuriDisponibile || 0;
      const locuriOcupate = materiiAlocate[materie.id]?.length || 0;
      const locuriRamase = locuriDisponibile - locuriOcupate;

      console.log(`- ${materie.nume}: ${locuriRamase}/${locuriDisponibile} locuri rămase`);

      if (locuriRamase > 0) {
        rezultateAlocare.materiiCuLocuriRamase.push({
          id: materie.id,
          nume: materie.nume || '',
          locuriRamase: locuriRamase,
          totalLocuri: locuriDisponibile
        });
      }
    }

    // 6. Actualizează baza de date cu alocările
    console.log('\n=== ACTUALIZARE BAZĂ DE DATE ===');
    const batch = db.batch();

    // Actualizează studenții alocați
    console.log(`- Studenți alocați: ${rezultateAlocare.studentiAlocati.length}`);
    for (const studentId in alocariStudenti) {
      const materieId = alocariStudenti[studentId];
      const userRef = db.collection('users').doc(studentId);
      
      batch.update(userRef, {
        materiiInscrise: admin.firestore.FieldValue.arrayUnion(materieId),
        pachetAlocat: pachetId,
        statusAlocare: 'alocat'
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

    // Actualizează studenții nealocați
    console.log(`- Studenți nealocați: ${rezultateAlocare.studentiNealocati.length}`);
    for (const student of rezultateAlocare.studentiNealocati) {
      const userRef = db.collection('users').doc(student.id);
      batch.update(userRef, {
        statusAlocare: 'nealocat'
      });
    }

    // Actualizează informații despre pachet
    const pachetRef = db.collection('pachete').doc(pachetId);
    batch.update(pachetRef, {
      procesat: true,
      dataUltimaAlocare: new Date().toISOString(),
      studentiAlocati: rezultateAlocare.studentiAlocati.length,
      studentiNealocati: rezultateAlocare.studentiNealocati.length,
      statisticiPreferinte: rezultateAlocare.statisticiPreferinte
    });

    // Execută actualizările în batch
    console.log('- Executare actualizări în baza de date...');
    await batch.commit();
    console.log('✅ Actualizări finalizate cu succes!');

    return rezultateAlocare;
  } catch (error) {
    console.error('❌ Eroare la alocarea materiilor:', error);
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