import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Utilitar pentru curățarea duplicatelor din istoricAnual
 * ATENȚIE: Rulați această funcție doar o dată și cu precauție!
 */
export const cleanupIstoricDuplicates = async () => {
  console.log('🧹 Începe curățarea duplicatelor din istoricAnual...');
  
  try {
    // Obține toate documentele din colecția istoricAcademic
    const istoricCollection = collection(db, 'istoricAcademic');
    const snapshot = await getDocs(istoricCollection);
    
    let totalStudents = 0;
    let studentsWithDuplicates = 0;
    let totalDuplicatesRemoved = 0;
    
    for (const docSnapshot of snapshot.docs) {
      totalStudents++;
      const studentId = docSnapshot.id;
      const data = docSnapshot.data();
      
      if (!data.istoricAnual || !Array.isArray(data.istoricAnual)) {
        continue;
      }
      
      console.log(`Procesez studentul ${studentId}...`);
      
      const originalCount = data.istoricAnual.length;
      
      // Creează un Map pentru a grupa intrările unice
      const uniqueEntries = new Map();
      
      data.istoricAnual.forEach((entry, index) => {
        // Creează o cheie unică bazată pe anul universitar, anul de studiu și semestru
        const key = `${entry.anUniversitar}-${entry.anStudiu}-${entry.semestru}`;
        
        if (uniqueEntries.has(key)) {
          // Dacă existe deja o intrare cu această cheie, combină cursurile
          const existingEntry = uniqueEntries.get(key);
          
          // Adaugă cursurile noi, evitând duplicatele de cursuri
          if (entry.cursuri && Array.isArray(entry.cursuri)) {
            entry.cursuri.forEach(curs => {
              // Verifică dacă cursul nu există deja
              const cursExists = existingEntry.cursuri.some(existingCurs => existingCurs.id === curs.id);
              if (!cursExists) {
                existingEntry.cursuri.push(curs);
              }
            });
          }
        } else {
          // Prima intrare cu această cheie
          uniqueEntries.set(key, {
            anUniversitar: entry.anUniversitar,
            anStudiu: entry.anStudiu,
            semestru: entry.semestru,
            cursuri: entry.cursuri || []
          });
        }
      });
      
      // Convertește înapoi la array
      const cleanedIstoric = Array.from(uniqueEntries.values());
      const newCount = cleanedIstoric.length;
      
      if (originalCount > newCount) {
        studentsWithDuplicates++;
        const duplicatesRemoved = originalCount - newCount;
        totalDuplicatesRemoved += duplicatesRemoved;
        
        console.log(`   Șters ${duplicatesRemoved} duplicate(e) pentru ${studentId} (${originalCount} -> ${newCount})`);
        
        // Actualizează documentul în Firestore
        await updateDoc(doc(db, 'istoricAcademic', studentId), {
          istoricAnual: cleanedIstoric
        });
      } else {
        console.log(`  ✓ Nu s-au găsit duplicate pentru ${studentId}`);
      }
    }
    
    console.log('\n📊 RAPORT FINAL:');
    console.log(`👥 Total studenți procesați: ${totalStudents}`);
    console.log(`🔧 Studenți cu duplicate: ${studentsWithDuplicates}`);
    console.log(`🗑️ Total duplicate șterse: ${totalDuplicatesRemoved}`);
    console.log(' Curățarea completă!');
    
    return {
      totalStudents,
      studentsWithDuplicates,
      totalDuplicatesRemoved
    };
    
  } catch (error) {
    console.error(' Eroare la curățarea duplicatelor:', error);
    throw error;
  }
};

/**
 * Funcție pentru a analiza duplicatele fără a le șterge
 */
export const analyzeIstoricDuplicates = async () => {
  console.log(' Analizez duplicatele din istoricAnual...');
  
  try {
    const istoricCollection = collection(db, 'istoricAcademic');
    const snapshot = await getDocs(istoricCollection);
    
    const analysis = {
      totalStudents: 0,
      studentsWithDuplicates: 0,
      maxDuplicatesPerStudent: 0,
      totalDuplicates: 0,
      duplicatesByStudent: []
    };
    
    for (const docSnapshot of snapshot.docs) {
      analysis.totalStudents++;
      const studentId = docSnapshot.id;
      const data = docSnapshot.data();
      
      if (!data.istoricAnual || !Array.isArray(data.istoricAnual)) {
        continue;
      }
      
      const originalCount = data.istoricAnual.length;
      
      // Calculează intrările unice
      const uniqueKeys = new Set();
      data.istoricAnual.forEach(entry => {
        const key = `${entry.anUniversitar}-${entry.anStudiu}-${entry.semestru}`;
        uniqueKeys.add(key);
      });
      
      const uniqueCount = uniqueKeys.size;
      const duplicateCount = originalCount - uniqueCount;
      
      if (duplicateCount > 0) {
        analysis.studentsWithDuplicates++;
        analysis.totalDuplicates += duplicateCount;
        analysis.maxDuplicatesPerStudent = Math.max(analysis.maxDuplicatesPerStudent, duplicateCount);
        
        analysis.duplicatesByStudent.push({
          studentId,
          originalCount,
          uniqueCount,
          duplicateCount
        });
      }
    }
    
    console.log('\n📊 ANALIZA DUPLICATELOR:');
    console.log(`👥 Total studenți: ${analysis.totalStudents}`);
    console.log(`🔧 Studenți cu duplicate: ${analysis.studentsWithDuplicates}`);
    console.log(`🗑️ Total duplicate găsite: ${analysis.totalDuplicates}`);
    console.log(`📈 Max duplicate per student: ${analysis.maxDuplicatesPerStudent}`);
    
    if (analysis.duplicatesByStudent.length > 0) {
      console.log('\n TOP studenți cu cele mai multe duplicate:');
      analysis.duplicatesByStudent
        .sort((a, b) => b.duplicateCount - a.duplicateCount)
        .slice(0, 10)
        .forEach(student => {
          console.log(`  ${student.studentId}: ${student.duplicateCount} duplicate (${student.originalCount} -> ${student.uniqueCount})`);
        });
    }
    
    return analysis;
    
  } catch (error) {
    console.error(' Eroare la analiza duplicatelor:', error);
    throw error;
  }
}; 