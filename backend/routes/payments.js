const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, PreApproval, Payment } = require('mercadopago');
const admin = require('firebase-admin');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preApprovalClient = new PreApproval(client);
const paymentClient = new Payment(client);

// Referência ao Firestore
const db = admin.firestore();

// Criar assinatura Premium
router.post('/create-subscription', async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ error: 'Email e userId são obrigatórios' });
    }

    // Criar preferência de assinatura
    const preapproval = {
      reason: 'Assinatura Premium SOWLFY',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 39.90,
        currency_id: 'BRL'
      },
      back_url: `${process.env.FRONTEND_URL}/upgrade`,
      payer_email: email,
      external_reference: userId
    };

    const response = await preApprovalClient.create({ body: preapproval });

    res.json({
      subscriptionId: response.id,
      initPoint: response.init_point,
      status: response.status
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      error: 'Erro ao criar assinatura',
      details: error.message 
    });
  }
});

// Verificar status da assinatura
router.get('/subscription-status/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const response = await preApprovalClient.get({ id: subscriptionId });

    res.json({
      status: response.status,
      reason: response.reason,
      amount: response.auto_recurring?.transaction_amount
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Erro ao verificar status da assinatura' });
  }
});

// Webhook do Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook recebido:', req.body);

    const { type, data, action } = req.body;

    // Responder imediatamente ao Mercado Pago
    res.status(200).json({ received: true });

    // Processar assinatura
    if (type === 'subscription_preapproval') {
      const subscriptionId = data.id;
      console.log('📋 Processando assinatura:', subscriptionId);

      try {
        // Buscar detalhes da assinatura
        const subscription = await preApprovalClient.get({ id: subscriptionId });
        console.log('📋 Status da assinatura:', subscription.status);
        console.log('📧 Email do pagador:', subscription.payer_email);

        const userId = subscription.external_reference;

        if (!userId) {
          console.error('❌ userId não encontrado no external_reference');
          return;
        }

        // Status: authorized, paused, cancelled, pending, etc
        if (subscription.status === 'authorized') {
          console.log('✅ Assinatura autorizada! Ativando premium...');

          // Calcular data de expiração (1 mês a partir de agora)
          const now = new Date();
          const expirationDate = new Date(now);
          expirationDate.setMonth(expirationDate.getMonth() + 1);

          // Atualizar usuário no Firestore
          await db.collection('users').doc(userId).set({
            isPremium: true,
            premiumSince: admin.firestore.FieldValue.serverTimestamp(),
            premiumExpiresAt: expirationDate,
            subscriptionId: subscriptionId,
            subscriptionStatus: subscription.status,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Salvar assinatura na coleção de subscriptions
          await db.collection('subscriptions').doc(subscriptionId).set({
            userId: userId,
            status: subscription.status,
            amount: subscription.auto_recurring?.transaction_amount || 39.90,
            currency: subscription.auto_recurring?.currency_id || 'BRL',
            payerEmail: subscription.payer_email,
            reason: subscription.reason,
            startDate: admin.firestore.FieldValue.serverTimestamp(),
            nextBillingDate: expirationDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log('✅ Premium ativado para usuário:', userId);
        } 
        else if (subscription.status === 'cancelled' || subscription.status === 'paused') {
          console.log('⚠️ Assinatura cancelada/pausada. Desativando premium...');

          // Desativar premium
          await db.collection('users').doc(userId).set({
            isPremium: false,
            subscriptionStatus: subscription.status,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Atualizar status da assinatura
          await db.collection('subscriptions').doc(subscriptionId).update({
            status: subscription.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log('✅ Premium desativado para usuário:', userId);
        }
      } catch (error) {
        console.error('❌ Erro ao processar assinatura:', error);
      }
    }

    // Processar pagamento individual (se houver)
    if (type === 'payment') {
      const paymentId = data.id;
      console.log('💳 Processando pagamento:', paymentId);

      try {
        const payment = await paymentClient.get({ id: paymentId });
        console.log('💳 Status do pagamento:', payment.status);

        if (payment.status === 'approved') {
          console.log('✅ Pagamento aprovado!');
          // Lógica adicional se necessário
        }
      } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
      }
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Já respondemos com 200, apenas logamos o erro
  }
});

module.exports = router;
