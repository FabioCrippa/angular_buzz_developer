// ===============================================
// 🧪 SCRIPT PARA TESTAR WEBHOOK LOCALMENTE
// ===============================================

const http = require('http');

const BACKEND_URL = 'http://localhost:3000';

// ===============================================
// 📋 SIMULAR WEBHOOK DE ASSINATURA AUTORIZADA
// ===============================================

function testAuthorizedSubscription(subscriptionId = '12345678') {
  const payload = {
    type: 'subscription_preapproval',
    action: 'updated',
    data: {
      id: subscriptionId
    }
  };

  console.log('🧪 Testando webhook - Assinatura Autorizada');
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  sendWebhook(payload);
}

// ===============================================
// 💳 SIMULAR WEBHOOK DE PAGAMENTO APROVADO
// ===============================================

function testApprovedPayment(paymentId = '87654321') {
  const payload = {
    type: 'payment',
    action: 'updated',
    data: {
      id: paymentId
    }
  };

  console.log('🧪 Testando webhook - Pagamento Aprovado');
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  sendWebhook(payload);
}

// ===============================================
// 🚫 SIMULAR WEBHOOK DE ASSINATURA CANCELADA
// ===============================================

function testCancelledSubscription(subscriptionId = '12345678') {
  const payload = {
    type: 'subscription_preapproval',
    action: 'cancelled',
    data: {
      id: subscriptionId
    }
  };

  console.log('🧪 Testando webhook - Assinatura Cancelada');
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  sendWebhook(payload);
}

// ===============================================
// 📨 ENVIAR REQUISIÇÃO PARA O WEBHOOK
// ===============================================

function sendWebhook(payload) {
  const data = JSON.stringify(payload);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log('\n✅ Resposta do servidor:');
    console.log(`Status: ${res.statusCode}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('Body:', JSON.parse(body));
      } catch {
        console.log('Body:', body);
      }
      console.log('\n' + '='.repeat(50) + '\n');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro ao enviar webhook:', error.message);
    console.log('\n⚠️  Certifique-se que o backend está rodando em http://localhost:3000\n');
  });

  req.write(data);
  req.end();
}

// ===============================================
// 🎯 MENU DE TESTES
// ===============================================

console.log('\n' + '='.repeat(50));
console.log('🧪 TESTADOR DE WEBHOOK - MERCADO PAGO');
console.log('='.repeat(50) + '\n');

console.log('Escolha o teste:');
console.log('1️⃣  Assinatura Autorizada (ativa premium)');
console.log('2️⃣  Pagamento Aprovado');
console.log('3️⃣  Assinatura Cancelada (desativa premium)');
console.log('\n');

// Pegar argumento da linha de comando
const testType = process.argv[2] || '1';

switch(testType) {
  case '1':
    testAuthorizedSubscription();
    break;
  case '2':
    testApprovedPayment();
    break;
  case '3':
    testCancelledSubscription();
    break;
  default:
    console.log('❌ Opção inválida. Use: node test-webhook.js [1|2|3]');
}

// ===============================================
// 📚 INSTRUÇÕES DE USO
// ===============================================

console.log('💡 Como usar:');
console.log('   node test-webhook.js 1  → Testar assinatura autorizada');
console.log('   node test-webhook.js 2  → Testar pagamento aprovado');
console.log('   node test-webhook.js 3  → Testar assinatura cancelada\n');
