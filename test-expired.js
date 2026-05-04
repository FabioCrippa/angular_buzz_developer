const admin = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'angular-buzz-developer'
});

const db = admin.firestore();

async function createExpiredSchool() {
  try {
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const schoolId = school_test_expired_;
    
    await db.collection('schools').doc(schoolId).set({
      schoolId,
      name: 'Escola Teste Expirada',
      city: 'Rio de Janeiro',
      state: 'RJ',
      totalStudents: 5,
      activeStudents: 3,
      sharedPassword: 'ETE25',
      createdAt: new Date(),
      subscriptionType: 'donated',
      subscriptionStatus: 'active',
      expiresAt: yesterdayDate,
      lastPaymentDate: new Date()
    });

    console.log('Escola expirada criada!');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

createExpiredSchool();
