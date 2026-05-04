const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'angular-buzz-developer'
});

const db = admin.firestore();

async function testStudentAccess() {
  try {
    console.log('🔍 Procurando escolas e alunos no Firestore...\n');
    
    // Buscar escolas
    const schoolsSnapshot = await db.collection('schools').get();
    console.log(`📚 Encontradas ${schoolsSnapshot.size} escolas:`);
    
    for (const schoolDoc of schoolsSnapshot.docs) {
      const schoolData = schoolDoc.data();
      console.log(`\n  📍 ${schoolDoc.id}`);
      console.log(`     Nome: ${schoolData.name}`);
      console.log(`     Status: ${schoolData.subscriptionStatus}`);
      console.log(`     Expira: ${schoolData.expiresAt?.toDate?.() || 'N/A'}`);
      
      // Buscar alunos dessa escola
      const studentsSnapshot = await db.collection(`school_students/${schoolDoc.id}/students`).get();
      console.log(`     👥 ${studentsSnapshot.size} alunos:`);
      
      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data();
        console.log(`        • ${studentDoc.id}: ${studentData.name} (UID: ${studentData.uid})`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testStudentAccess();
