const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================================
// 🔥 FIREBASE ADMIN INITIALIZATION
// ===============================================
// Inicializar com credenciais padrão do ambiente (para Render/Cloud)
// ou com variável de ambiente FIREBASE_SERVICE_ACCOUNT
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Para ambiente local - usar credenciais do Firebase CLI
    admin.initializeApp();
  }
  console.log('✅ Firebase Admin inicializado');
} catch (error) {
  console.error('⚠️ Erro ao inicializar Firebase Admin:', error.message);
}

const db = admin.firestore();

// CORS simples para local
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'SOWLFY Backend Online', status: 'OK' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Rotas de autenticação
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ 
    token: 'fake-token-123', 
    user: { email, name: 'Test User', isPremium: false }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name } = req.body;
  res.json({ 
    token: 'fake-token-456', 
    user: { email, name, isPremium: false }
  });
});

// Rota de criação de assinatura Mercado Pago
app.post('/api/payments/create-subscription', async (req, res) => {
  try {
    const { MercadoPagoConfig, PreApproval } = require('mercadopago');
    
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN 
    });
    const preApproval = new PreApproval(client);
    
    const body = {
      reason: 'Assinatura Premium SOWLFY',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 39.90,
        currency_id: 'BRL'
      },
      back_url: 'https://sowlfy.com.br/payment/success',
      payer_email: req.body.email || 'test@test.com',
      status: 'pending'
    };
    
    const result = await preApproval.create({ body });
    
    res.json({
      id: result.id,
      init_point: result.init_point,
      status: result.status
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================================
// 🔔 WEBHOOK DO MERCADO PAGO
// ===============================================
app.post('/api/payments/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook recebido:', req.body);

    const { type, data } = req.body;

    // Mercado Pago envia notificação de assinatura
    if (type === 'subscription_preapproval' || type === 'preapproval') {
      const preapprovalId = data?.id || req.query.id;

      if (!preapprovalId) {
        return res.status(400).json({ error: 'ID da assinatura não fornecido' });
      }

      // Buscar detalhes da assinatura no Mercado Pago
      const { MercadoPagoConfig, PreApproval } = require('mercadopago');
      const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN 
      });
      const preApproval = new PreApproval(client);
      
      const subscription = await preApproval.get({ id: preapprovalId });
      
      console.log('📋 Status da assinatura:', subscription.status);
      console.log('📧 Email do pagador:', subscription.payer_email);

      // Se assinatura foi autorizada/aprovada
      if (subscription.status === 'authorized' || subscription.status === 'approved') {
        const payerEmail = subscription.payer_email;

        // Buscar usuário no Firestore por email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', payerEmail).get();

        if (snapshot.empty) {
          console.log('⚠️ Usuário não encontrado:', payerEmail);
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Atualizar primeiro usuário encontrado
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
          isPremium: true,
          plan: 'premium',
          subscription: {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.next_payment_date),
            mercadoPagoPreapprovalId: preapprovalId
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Usuário atualizado para Premium:', payerEmail);
        
        return res.json({ 
          success: true, 
          message: 'Usuário atualizado para Premium',
          userId: userDoc.id
        });
      }

      // Se assinatura foi cancelada ou pausada
      if (subscription.status === 'cancelled' || subscription.status === 'paused') {
        const payerEmail = subscription.payer_email;
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', payerEmail).get();

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            isPremium: false,
            plan: 'free',
            'subscription.status': subscription.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log('🔴 Assinatura cancelada/pausada para:', payerEmail);
        }
      }
    }

    // Sempre responder 200 OK para o Mercado Pago
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    // Mesmo com erro, responder 200 para não ficar retentando
    res.status(200).json({ received: true, error: error.message });
  }
});

// ===============================================
// 🔧 ROTA PARA TESTAR ATUALIZAÇÃO MANUAL
// ===============================================
app.post('/api/payments/test-premium', async (req, res) => {
  try {
    const { email } = req.body;
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      isPremium: true,
      plan: 'premium',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Usuário atualizado para Premium!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
