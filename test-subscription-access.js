#!/usr/bin/env node

/**
 * 🧪 TESTE COMPLETO DE ACESSO DE ALUNOS
 * Testa subscription-based access para alunos
 */

const admin = require('firebase-admin');
const https = require('https');

// Inicializar Firebase Admin (assume que GOOGLE_APPLICATION_CREDENTIALS está setado)
try {
  admin.initializeApp({
    projectId: 'angular-buzz-developer'
  });
} catch (e) {
  // Já inicializado
}

const auth = admin.auth();
const db = admin.firestore();

// Dados de teste
const TEST_STUDENTS = [
  {
    email: 'teste_ativo@sowlfy.com',
    password: 'Test@123456',
    name: 'Aluno Escola Ativa',
    schoolId: 'escola-admin-test', // Escola ATIVA
    raId: 'TEST_ATIVO_001',
    expectedAccess: true,
    label: '✅ DEVE TER ACESSO'
  },
  {
    email: 'teste_cancelado@sowlfy.com',
    password: 'Test@123456',
    name: 'Aluno Escola Cancelada',
    schoolId: 'escola-teste-sowlfy', // Escola CANCELADA
    raId: 'TEST_CANCELADO_001',
    expectedAccess: false,
    label: '❌ DEVE SER BLOQUEADO'
  }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(method, path, data, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'southamerica-east1-angular-buzz-developer.cloudfunctions.net',
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testStudentAccess() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTE DE ACESSO DE ALUNOS - SUBSCRIPTION CONTROL');
  console.log('='.repeat(70) + '\n');

  for (const student of TEST_STUDENTS) {
    console.log(`\n📍 TESTANDO: ${student.label}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Escola: ${student.schoolId}`);
    console.log('-'.repeat(70));

    try {
      // 1️⃣ CRIAR USUÁRIO
      console.log('   [1/5] Criando usuário na Firebase Auth...');
      let user;
      try {
        user = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.name
        });
        console.log(`       ✅ Usuário criado: ${user.uid}`);
      } catch (e) {
        if (e.code === 'auth/email-already-exists') {
          console.log(`       ⚠️  Usuário já existe, usando existente`);
          const userRecord = await auth.getUserByEmail(student.email);
          user = userRecord;
        } else {
          throw e;
        }
      }

      // 2️⃣ CRIAR DOCUMENTO DE ALUNO NO FIRESTORE
      console.log('   [2/5] Criando documento de aluno no Firestore...');
      await db
        .collection(`school_students/${student.schoolId}/students`)
        .doc(student.raId)
        .set({
          uid: user.uid,
          name: student.name,
          email: student.email,
          schoolId: student.schoolId,
          createdAt: new Date(),
          active: true
        });
      console.log(`       ✅ Documento criado em school_students/${student.schoolId}/students/${student.raId}`);

      // 3️⃣ LOGIN
      console.log('   [3/5] Fazendo login...');
      const tokenResponse = await makeRequest('POST', '/login', {
        email: student.email,
        password: student.password
      });
      
      if (tokenResponse.status !== 200) {
        console.log(`       ⚠️  Login falhou (status ${tokenResponse.status})`);
        continue;
      }
      
      const token = tokenResponse.data.token;
      console.log(`       ✅ Login bem-sucedido, token obtido`);

      await delay(500);

      // 4️⃣ VERIFICAR ACESSO
      console.log('   [4/5] Verificando acesso à escola...');
      const accessResponse = await makeRequest('POST', '/checkSchoolAccess', {
        schoolId: student.schoolId
      });

      const hasAccess = accessResponse.data.hasAccess;
      const subscriptionStatus = accessResponse.data.subscriptionStatus;
      
      console.log(`       Status da subscription: ${subscriptionStatus}`);
      console.log(`       Acesso permitido: ${hasAccess ? '✅ SIM' : '❌ NÃO'}`);

      // 5️⃣ TESTAR LEITURA DO FIRESTORE
      console.log('   [5/5] Testando leitura de dados do Firestore...');
      try {
        const studentDoc = await db
          .collection(`school_students/${student.schoolId}/students`)
          .doc(student.raId)
          .get();
        
        if (studentDoc.exists) {
          console.log(`       ✅ Firestore leitura bem-sucedida: ${JSON.stringify(studentDoc.data()).substring(0, 50)}...`);
        }
      } catch (e) {
        if (e.code === 'permission-denied') {
          console.log(`       ❌ Firestore leitura bloqueada: PERMISSION_DENIED`);
        } else {
          console.log(`       ⚠️  Firestore leitura erro: ${e.message}`);
        }
      }

      // 🎯 VERIFICAÇÃO FINAL
      console.log('\n   📊 RESULTADO:');
      const accessMatches = hasAccess === student.expectedAccess;
      if (accessMatches) {
        console.log(`   🎉 ✅ TESTE PASSOU! Acesso é ${hasAccess ? 'permitido' : 'bloqueado'} como esperado`);
      } else {
        console.log(`   ⚠️  ⚠️  TESTE FALHOU! Esperado ${student.expectedAccess}, recebido ${hasAccess}`);
      }

    } catch (error) {
      console.log(`   ❌ ERRO NO TESTE: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ TESTES CONCLUÍDOS');
  console.log('='.repeat(70) + '\n');

  process.exit(0);
}

// Executar testes
testStudentAccess().catch(error => {
  console.error('❌ ERRO FATAL:', error);
  process.exit(1);
});
