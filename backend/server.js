const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Iniciar
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
