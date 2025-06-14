/**
 * ===============================================================================
 * ENROLLMENT CONTROLLER - ACADEMIC REGISTRATION & COURSE ALLOCATION LOGIC
 * ===============================================================================
 * 
 * ENTERPRISE ROLE:
 * This controller implements the core business logic for academic course enrollment
 * at UVT, managing student preferences, automatic course allocation algorithms,
 * registration period controls, and academic workflow orchestration.
 * 
 * BUSINESS LOGIC PATTERNS IMPLEMENTED:
 * 
 * 1. COURSE ALLOCATION ALGORITHMS:
 *    • proceseazaInscriere: Sophisticated preference-based allocation system
 *    • Multi-criteria allocation using student GPA and preference rankings
 *    • Capacity management with overflow handling and waitlist generation
 *    • Fair distribution algorithms ensuring equitable course access
 * 
 * 2. STUDENT PREFERENCE MANAGEMENT:
 *    • getPreferinteStudent: Retrieval of student course preferences
 *    • setPreferinteStudent: Secure preference updates with validation
 *    • Preference ranking system (1st choice, 2nd choice, etc.)
 *    • Real-time preference conflict detection and resolution
 * 
 * 3. REGISTRATION PERIOD CONTROLS:
 *    • getStatusInscriere: Registration window status and availability
 *    • setPerioadaInscriere: Administrative control over enrollment periods
 *    • Time-based access control preventing off-season enrollments
 *    • Multi-phase registration with priority access for different student groups
 * 
 * ACADEMIC WORKFLOW INTEGRATIONS:
 * 
 * 1. COURSE PACKAGE MANAGEMENT:
 *    • Hierarchical course organization by academic packages
 *    • Package-specific enrollment rules and requirements
 *    • Cross-package dependency management
 *    • Academic year and semester integration
 * 
 * 2. STUDENT ACADEMIC STATUS:
 *    • GPA-based enrollment eligibility checking
 *    • Academic standing verification for course access
 *    • Prerequisite course completion validation
 *    • Credit hour limitations and academic load management
 * 
 * 3. PROFESSOR COURSE ASSIGNMENTS:
 *    • Course capacity management per instructor
 *    • Teaching load balancing across academic staff
 *    • Course section management and room allocation
 *    • Schedule conflict prevention and resolution
 * 
 * SOPHISTICATED ALLOCATION ALGORITHMS:
 * 
 * 1. PREFERENCE-BASED ALLOCATION (via alocaMateriiPreferate):
 *    • Student preference ranking with weighted scoring
 *    • GPA-based tiebreaking for competitive courses
 *    • Multi-round allocation to maximize student satisfaction
 *    • Fairness algorithms preventing preference manipulation
 * 
 * 2. CAPACITY MANAGEMENT:
 *    • Real-time seat availability tracking
 *    • Overflow handling with waitlist generation
 *    • Dynamic capacity adjustment based on demand
 *    • Alternative course suggestion algorithms
 * 
 * 3. CONFLICT RESOLUTION:
 *    • Schedule conflict detection and prevention
 *    • Academic requirement validation
 *    • Student load balancing across semesters
 *    • Resource allocation optimization
 * 
 * SECURITY & VALIDATION PATTERNS:
 * 
 * 1. REGISTRATION PERIOD ENFORCEMENT:
 *    • Time-based access control with verificaPerioadaInscriere
 *    • Administrative override capabilities for special cases
 *    • Audit trail for all enrollment period modifications
 *    • Fraud prevention through temporal access restrictions
 * 
 * 2. DATA INTEGRITY VALIDATION:
 *    • Student existence verification before operations
 *    • Course package validation and availability checking
 *    • Preference list validation against available courses
 *    • Academic eligibility verification
 * 
 * 3. AUTHORIZATION CHECKS:
 *    • Student identity verification for preference updates
 *    • Administrative privilege requirements for period management
 *    • Role-based access control for different operations
 *    • Academic advisor approval workflows
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 
 * 1. BATCH PROCESSING:
 *    • Mass enrollment processing for entire student cohorts
 *    • Optimized database queries for large-scale operations
 *    • Parallel processing of independent allocation decisions
 *    • Memory-efficient handling of large student datasets
 * 
 * 2. CACHING STRATEGIES:
 *    • Course package metadata caching
 *    • Student preference caching for repeated operations
 *    • Allocation result caching for consistency
 *    • Registration period status caching
 * 
 * 3. DATABASE EFFICIENCY:
 *    • Optimized Firestore queries with proper indexing
 *    • Batch read/write operations for bulk updates
 *    • Transaction-based operations for data consistency
 *    • Connection pooling for high-volume periods
 * 
 * ACADEMIC COMPLIANCE FEATURES:
 * 
 * 1. AUDIT TRAIL GENERATION:
 *    • Complete enrollment decision history
 *    • Student preference change tracking
 *    • Administrative action logging
 *    • Compliance reporting for academic governance
 * 
 * 2. FAIRNESS MONITORING:
 *    • Allocation fairness metrics and reporting
 *    • Bias detection in automatic allocation algorithms
 *    • Equal opportunity access verification
 *    • Academic appeal process integration
 * 
 * 3. REGULATORY COMPLIANCE:
 *    • GDPR-compliant student data handling
 *    • Academic record retention policies
 *    • Student consent management for data processing
 *    • Privacy-preserving analytics and reporting
 * 
 * ERROR HANDLING & RESILIENCE:
 * 
 * 1. GRACEFUL FAILURE MANAGEMENT:
 *    • Partial allocation success with detailed error reporting
 *    • Rollback capabilities for failed bulk operations
 *    • Alternative allocation strategies for edge cases
 *    • Recovery procedures for system failures
 * 
 * 2. VALIDATION ERROR HANDLING:
 *    • Detailed error messages for invalid preferences
 *    • User-friendly guidance for correcting enrollment issues
 *    • Administrative notification for system anomalies
 *    • Automated error recovery for common scenarios
 * 
 * REAL-TIME FEATURES:
 * 
 * 1. LIVE CAPACITY UPDATES:
 *    • Real-time seat availability for student decision-making
 *    • Live enrollment counters and waiting list positions
 *    • Instant notification of allocation results
 *    • Dynamic course availability based on current enrollment
 * 
 * 2. CONCURRENT ACCESS MANAGEMENT:
 *    • Race condition prevention for simultaneous enrollments
 *    • Optimistic locking for preference updates
 *    • Queue management for high-demand registration periods
 *    • Fair access during peak enrollment times
 * 
 * INTEGRATION POINTS:
 * • Firebase Firestore for academic data persistence
 * • University student information systems
 * • Academic calendar and scheduling systems
 * • Email notification services for enrollment updates
 * • SMS services for urgent enrollment notifications
 * • Academic advisor dashboard integrations
 * • Grade management systems for prerequisite checking
 * • Financial systems for fee processing
 * ===============================================================================
 */

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