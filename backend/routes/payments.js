const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, PreApproval, Payment } = require('mercadopago');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preApprovalClient = new PreApproval(client);
const paymentClient = new Payment(client);

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
      external_reference: userId,
      // Métodos de pagamento habilitados
      payment_methods_allowed: {
        payment_types: [
          { id: 'credit_card' },      // Cartão de crédito
          { id: 'account_money' },    // Saldo Mercado Pago
          { id: 'bank_transfer' }     // PIX
        ],
        payment_methods: []  // Sem restrições de bandeiras
      }
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
    console.log('Webhook received:', req.body);

    const { type, data } = req.body;

    if (type === 'payment') {
      // Processar pagamento
      const payment = await paymentClient.get({ id: data.id });
      console.log('Payment status:', payment.status);
      
      // Aqui você atualizaria o status premium do usuário
      // Se payment.status === 'approved', ativar premium
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Erro no webhook' });
  }
});

module.exports = router;
