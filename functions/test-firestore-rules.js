#!/usr/bin/env node

/**
 * 🧪 TESTE DIRETO DE FIRESTORE RULES - SUBSCRIPTION ACCESS
 * Testa se Firestore está bloqueando corretamente alunos de escolas inativas
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: 'angular-buzz-developer'
});

const db = admin.firestore();

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTE DE FIRESTORE RULES - SUBSCRIPTION ACCESS CONTROL');
  console.log('='.repeat(80) + '\n');

  try {
    // 1️⃣ LISTAR ESCOLAS E SEUS STATUS
    console.log('📚 [1/3] Coletando informações de escolas...\n');
    const schoolsSnapshot = await db.collection('schools').get();
    const schools = [];
    
    for (const doc of schoolsSnapshot.docs) {
      const data = doc.data();
      schools.push({
        id: doc.id,
        name: data.name,
        status: data.subscriptionStatus,
        expiresAt: data.expiresAt?.toDate?.() || 'N/A'
      });
      console.log(`   ✅ ${data.name}`);
      console.log(`      • ID: ${doc.id}`);
      console.log(`      • Status: ${data.subscriptionStatus}`);
      console.log(`      • Expira: ${data.expiresAt?.toDate?.() || 'N/A'}\n`);
    }

    // 2️⃣ CRIAR ALUNOS DE TESTE
    console.log('\n📝 [2/3] Criando alunos de teste...\n');
    
    const testStudents = [];
    
    // Aluno em escola ATIVA
    if (schools.length > 0) {
      const activeSchool = schools.find(s => s.status === 'active') || schools[1];
      const studentId = 'TEST_ATIVO_' + Date.now();
      
      await db
        .collection(`school_students/${activeSchool.id}/students`)
        .doc(studentId)
        .set({
          uid: 'uid_test_ativo_' + Date.now(),
          name: 'Aluno Escola Ativa',
          email: 'teste_ativo_' + Date.now() + '@sowlfy.com',
          schoolId: activeSchool.id,
          class: '3A',
          createdAt: new Date()
        });
      
      testStudents.push({
        label: '✅ ALUNO DE ESCOLA ATIVA',
        schoolId: activeSchool.id,
        schoolName: activeSchool.name,
        schoolStatus: activeSchool.status,
        studentId,
        shouldHaveAccess: true
      });
      
      console.log(`   ✅ Criado: ${testStudents[testStudents.length - 1].label}`);
      console.log(`      • Escola: ${activeSchool.name} (${activeSchool.status})`);
      console.log(`      • Student ID: ${studentId}\n`);
    }
    
    // Aluno em escola CANCELADA
    if (schools.length > 0) {
      const cancelledSchool = schools.find(s => s.status === 'cancelled') || schools[0];
      const studentId = 'TEST_CANCELADO_' + Date.now();
      
      await db
        .collection(`school_students/${cancelledSchool.id}/students`)
        .doc(studentId)
        .set({
          uid: 'uid_test_cancelado_' + Date.now(),
          name: 'Aluno Escola Cancelada',
          email: 'teste_cancelado_' + Date.now() + '@sowlfy.com',
          schoolId: cancelledSchool.id,
          class: '3B',
          createdAt: new Date()
        });
      
      testStudents.push({
        label: '❌ ALUNO DE ESCOLA CANCELADA',
        schoolId: cancelledSchool.id,
        schoolName: cancelledSchool.name,
        schoolStatus: cancelledSchool.status,
        studentId,
        shouldHaveAccess: false
      });
      
      console.log(`   ✅ Criado: ${testStudents[testStudents.length - 1].label}`);
      console.log(`      • Escola: ${cancelledSchool.name} (${cancelledSchool.status})`);
      console.log(`      • Student ID: ${studentId}\n`);
    }

    // 3️⃣ TESTAR ACESSO
    console.log('\n🔐 [3/3] Testando acesso de alunos...\n');
    
    for (const student of testStudents) {
      console.log(`   📍 ${student.label}`);
      console.log(`      Escola: ${student.schoolName} (${student.schoolStatus})`);
      
      try {
        // Tentar ler documento do aluno
        const docRef = db
          .collection(`school_students/${student.schoolId}/students`)
          .doc(student.studentId);
        
        const docSnapshot = await docRef.get();
        
        if (docSnapshot.exists) {
          console.log(`      ✅ LEITURA BEM-SUCEDIDA - Aluno pode acessar os dados`);
          
          if (student.shouldHaveAccess) {
            console.log(`      🎉 ✅ RESULTADO ESPERADO - Aluno de escola ativa TEM acesso\n`);
          } else {
            console.log(`      ⚠️  RESULTADO INESPERADO - Aluno de escola cancelada conseguiu acessar!\n`);
          }
        } else {
          console.log(`      ⚠️  Documento não encontrado\n`);
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log(`      ❌ ACESSO BLOQUEADO - Firestore retornou PERMISSION_DENIED`);
          
          if (!student.shouldHaveAccess) {
            console.log(`      🎉 ✅ RESULTADO ESPERADO - Aluno de escola cancelada foi bloqueado\n`);
          } else {
            console.log(`      ⚠️  RESULTADO INESPERADO - Aluno de escola ativa foi bloqueado!\n`);
          }
        } else {
          console.log(`      ⚠️  Erro: ${error.message}\n`);
        }
      }
    }

    console.log('='.repeat(80));
    console.log('✅ TESTES CONCLUÍDOS');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    process.exit(0);
  }
}

runTests();
