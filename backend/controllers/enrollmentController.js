const { alocaMateriiPreferate, verificaPerioadaInscriere } = require('../services/enrollmentService');
const admin = require('../config/firebase');
const db = admin.firestore();

/**
 * Procesează înscrierea automată pentru un pachet de materii
 * și asignează locuri în baza mediilor și preferințelor studenților
 */
const proceseazaInscriere = async (req, res) => {
  try {
    const { pachetId } = req.params;
    
    if (!pachetId) {
      return res.status(400).json({ 
        message: 'ID-ul pachetului este necesar' 
      });
    }
    
    // Verifică dacă pachetul există
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      return res.status(404).json({ 
        message: 'Pachetul specificat nu a fost găsit' 
      });
    }
    
    // Procesează alocarea materiilor
    const rezultate = await alocaMateriiPreferate(pachetId);
    
    res.status(200).json({
      message: 'Alocarea materiilor a fost procesată cu succes',
      rezultate
    });
  } catch (error) {
    console.error('Eroare la procesarea înscrierilor:', error);
    res.status(500).json({ 
      message: 'Eroare la procesarea înscrierilor',
      error: error.message 
    });
  }
};

/**
 * Obține preferințele unui student pentru materiile dintr-un pachet
 */
const getPreferinteStudent = async (req, res) => {
  try {
    const { studentId, pachetId } = req.params;
    
    if (!studentId || !pachetId) {
      return res.status(400).json({ 
        message: 'ID-ul studentului și ID-ul pachetului sunt necesare' 
      });
    }
    
    // Obține documentul studentului
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        message: 'Studentul specificat nu a fost găsit' 
      });
    }
    
    const studentData = studentDoc.data();
    
    // Verifică dacă studentul are preferințe pentru pachetul specificat
    if (!studentData.preferinteMateriiOptionale || 
        !studentData.preferinteMateriiOptionale[pachetId]) {
      return res.status(404).json({ 
        message: 'Nu există preferințe pentru pachetul specificat' 
      });
    }
    
    // Obține lista de preferințe a studentului
    const preferinte = studentData.preferinteMateriiOptionale[pachetId];
    
    // Obține detaliile despre materii pentru a returna informații complete
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      return res.status(404).json({ 
        message: 'Pachetul specificat nu a fost găsit' 
      });
    }
    
    const pachetData = pachetDoc.data();
    const materiiInPachet = pachetData.materii || [];
    
    // Construiește lista de preferințe cu detalii complete
    const preferinteDetailed = preferinte.map((materieId, index) => {
      const materie = materiiInPachet.find(m => m.id === materieId);
      return {
        materieId,
        nume: materie ? materie.nume : 'Materie necunoscută',
        pozitie: index + 1
      };
    });
    
    res.status(200).json({
      studentId,
      pachetId,
      preferinte: preferinteDetailed
    });
  } catch (error) {
    console.error('Eroare la obținerea preferințelor:', error);
    res.status(500).json({ 
      message: 'Eroare la obținerea preferințelor',
      error: error.message 
    });
  }
};

/**
 * Setează preferințele unui student pentru materiile dintr-un pachet
 */
const setPreferinteStudent = async (req, res) => {
  try {
    const { studentId, pachetId } = req.params;
    const { preferinte } = req.body;
    
    if (!studentId || !pachetId) {
      return res.status(400).json({ 
        message: 'ID-ul studentului și ID-ul pachetului sunt necesare' 
      });
    }
    
    if (!Array.isArray(preferinte)) {
      return res.status(400).json({ 
        message: 'Preferințele trebuie să fie o listă de ID-uri de materii' 
      });
    }
    
    // Verifică dacă perioada de înscriere este activă
    const inscriereActiva = await verificaPerioadaInscriere(pachetId);
    if (!inscriereActiva) {
      return res.status(403).json({ 
        message: 'Perioada de înscriere pentru acest pachet nu este activă' 
      });
    }
    
    // Verifică dacă studentul există
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        message: 'Studentul specificat nu a fost găsit' 
      });
    }
    
    // Verifică dacă pachetul există
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      return res.status(404).json({ 
        message: 'Pachetul specificat nu a fost găsit' 
      });
    }
    
    // Verifică dacă materiile din preferințe există în pachet
    const pachetData = pachetDoc.data();
    const materiiInPachet = pachetData.materii || [];
    const materiiIds = materiiInPachet.map(m => m.id);
    
    for (const materieId of preferinte) {
      if (!materiiIds.includes(materieId)) {
        return res.status(400).json({ 
          message: `Materia cu ID-ul ${materieId} nu există în pachetul specificat` 
        });
      }
    }
    
    // Actualizează preferințele studentului
    const studentData = studentDoc.data();
    const preferinteExistente = studentData.preferinteMateriiOptionale || {};
    
    await db.collection('users').doc(studentId).update({
      preferinteMateriiOptionale: {
        ...preferinteExistente,
        [pachetId]: preferinte
      }
    });
    
    res.status(200).json({
      message: 'Preferințele au fost actualizate cu succes',
      studentId,
      pachetId,
      preferinte
    });
  } catch (error) {
    console.error('Eroare la setarea preferințelor:', error);
    res.status(500).json({ 
      message: 'Eroare la setarea preferințelor',
      error: error.message 
    });
  }
};

/**
 * Obține status-ul de înscriere pentru un pachet
 * Returnează informații despre perioada de înscriere și dacă este activă
 */
const getStatusInscriere = async (req, res) => {
  try {
    const { pachetId } = req.params;
    
    if (!pachetId) {
      return res.status(400).json({ 
        message: 'ID-ul pachetului este necesar' 
      });
    }
    
    // Verifică dacă pachetul există
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      return res.status(404).json({ 
        message: 'Pachetul specificat nu a fost găsit' 
      });
    }
    
    const pachetData = pachetDoc.data();
    const dataStart = pachetData.dataStart ? new Date(pachetData.dataStart) : null;
    const dataFinal = pachetData.dataFinal ? new Date(pachetData.dataFinal) : null;
    const acum = new Date();
    
    // Verifică status-ul înscrierii
    let status = 'inactiv';
    
    if (dataStart && dataFinal) {
      if (acum < dataStart) {
        status = 'urmează';
      } else if (acum >= dataStart && acum <= dataFinal) {
        status = 'activ';
      } else {
        status = 'încheiat';
      }
    }
    
    res.status(200).json({
      pachetId,
      nume: pachetData.nume || '',
      status,
      dataStart: dataStart ? dataStart.toISOString() : null,
      dataFinal: dataFinal ? dataFinal.toISOString() : null,
      active: status === 'activ'
    });
  } catch (error) {
    console.error('Eroare la obținerea status-ului de înscriere:', error);
    res.status(500).json({ 
      message: 'Eroare la obținerea status-ului de înscriere',
      error: error.message 
    });
  }
};

/**
 * Setează perioada de înscriere pentru un pachet
 */
const setPerioadaInscriere = async (req, res) => {
  try {
    const { pachetId } = req.params;
    const { dataStart, dataFinal } = req.body;
    
    if (!pachetId) {
      return res.status(400).json({ 
        message: 'ID-ul pachetului este necesar' 
      });
    }
    
    if (!dataStart || !dataFinal) {
      return res.status(400).json({ 
        message: 'Data de început și data de final sunt necesare' 
      });
    }
    
    // Verifică dacă pachetul există
    const pachetDoc = await db.collection('pachete').doc(pachetId).get();
    if (!pachetDoc.exists) {
      return res.status(404).json({ 
        message: 'Pachetul specificat nu a fost găsit' 
      });
    }
    
    // Verifică dacă datele sunt valide
    const startDate = new Date(dataStart);
    const finalDate = new Date(dataFinal);
    
    if (isNaN(startDate.getTime()) || isNaN(finalDate.getTime())) {
      return res.status(400).json({ 
        message: 'Datele introduse nu sunt valide' 
      });
    }
    
    if (startDate >= finalDate) {
      return res.status(400).json({ 
        message: 'Data de început trebuie să fie înainte de data de final' 
      });
    }
    
    // Actualizează perioada de înscriere
    await db.collection('pachete').doc(pachetId).update({
      dataStart: startDate.toISOString(),
      dataFinal: finalDate.toISOString()
    });
    
    res.status(200).json({
      message: 'Perioada de înscriere a fost actualizată cu succes',
      pachetId,
      dataStart: startDate.toISOString(),
      dataFinal: finalDate.toISOString()
    });
  } catch (error) {
    console.error('Eroare la setarea perioadei de înscriere:', error);
    res.status(500).json({ 
      message: 'Eroare la setarea perioadei de înscriere',
      error: error.message 
    });
  }
};

module.exports = {
  proceseazaInscriere,
  getPreferinteStudent,
  setPreferinteStudent,
  getStatusInscriere,
  setPerioadaInscriere
}; 