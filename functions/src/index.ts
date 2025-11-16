// ===============================================
// 🔧 INDEX.TS SEGUINDO GOOGLE STYLE
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\
// functions\src\index.ts

import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as express from "express";
import * as cors from "cors";
import Stripe from "stripe";

setGlobalOptions({
  region: "southamerica-east1",
  maxInstances: 10,
});

// ✅ STRIPE COM apiVersion
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ||
  "sk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68" +
  "NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH",
  {
    apiVersion: "2023-08-16",
  }
);

const app = express();

app.use(cors({
  origin: [
    "http://localhost:4200",
    "https://sowlfy.web.app",
    "https://sowlfy.firebaseapp.com",
  ],
  credentials: true,
}));

app.use(express.json());

// ✅ HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    message: "🦉 SOWLFY Firebase Backend v1.0.0",
    status: "online",
    pricing: "R$ 39,90/mês",
    trial: "7 dias grátis",
    timestamp: new Date().toISOString(),
  });
});

// ✅ HEALTH CHECK DETALHADO
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "SOWLFY Backend",
    version: "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    region: "southamerica-east1",
    timestamp: new Date().toISOString(),
  });
});

// ✅ CRIAR CHECKOUT SESSION - R$ 39,90
app.post("/api/v1/payments/create-checkout", async (req, res) => {
  try {
    console.log("💳 Criando checkout session R$ 39,90...");

    const product = await stripe.products.create({
      name: "SOWLFY Pro",
      description: "Acesso completo à plataforma SOWLFY com quizzes ilimitados",
      images: ["https://sowlfy.web.app/assets/logo-512.png"],
      metadata: {
        plan_type: "premium",
        price_brl: "39.90",
      },
    });

    // ✅ PREÇO REAL: R$ 39,90/MÊS
    const price = await stripe.prices.create({
      unit_amount: 3990, // R$ 39,90 em centavos
      currency: "brl",
      recurring: {
        interval: "month",
        trial_period_days: 7,
      },
      product: product.id,
      metadata: {
        plan_id: "sowlfy-pro-monthly",
        price_display: "R$ 39,90",
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price: price.id,
        quantity: 1,
      }],
      mode: "subscription",
      success_url: req.body.successUrl ||
        "https://sowlfy.web.app/payment/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: req.body.cancelUrl ||
        "https://sowlfy.web.app/payment/cancel",
      metadata: {
        planId: req.body.planId || "sowlfy-pro-monthly",
        userId: req.body.userId || "anonymous",
        source: "firebase_function",
        version: "1.0.0",
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan_type: "premium",
          price_brl: "39.90",
        },
      },
      customer_creation: "always",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      locale: "pt-BR",
    });

    res.json({
      id: session.id,
      url: session.url,
      status: "pending",
      planId: "sowlfy-pro-monthly",
      amount: 3990,
      currency: "brl",
      trial_days: 7,
      price_display: "R$ 39,90/mês",
    });
  } catch (error) {
    console.error("❌ Erro checkout:", error);
    res.status(400).json({
      error: (error as Error).message,
      code: "CHECKOUT_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ VERIFICAR PAGAMENTO
app.get("/api/v1/payments/verify/:sessionId", async (req, res) => {
  try {
    console.log(`🔍 Verificando sessão: ${req.params.sessionId}`);

    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
      {
        expand: ["subscription", "customer"],
      }
    );

    res.json({
      success: session.payment_status === "paid",
      status: session.payment_status,
      session: {
        id: session.id,
        customer: session.customer,
        subscription: session.subscription,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status,
      },
      verified_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro verificar:", error);
    res.status(400).json({
      error: (error as Error).message,
      code: "VERIFICATION_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ PLANOS - FREE + PRO R$ 39,90
app.get("/api/v1/payments/plans", (req, res) => {
  res.json({
    plans: [
      {
        id: "sowlfy-free",
        name: "SOWLFY Free",
        price: 0,
        currency: "BRL",
        features: [
          "🆓 3 tentativas por dia",
          "📚 500+ questões básicas",
          "📊 Estatísticas simples",
          "📱 Acesso mobile",
        ],
        popular: false,
      },
      {
        id: "sowlfy-pro-monthly",
        name: "SOWLFY Pro",
        price: 39.90,
        currency: "BRL",
        interval: "month",
        trial_days: 7,
        features: [
          "🚀 Tentativas ilimitadas",
          "📚 2.500+ questões premium",
          "📊 Relatórios detalhados",
          "🎯 Quiz inteligente",
          "⭐ Favoritos ilimitados",
          "📈 Analytics avançado",
          "💬 Suporte prioritário",
        ],
        popular: true,
        badge: "7 dias grátis",
      },
    ],
    updated_at: new Date().toISOString(),
  });
});

// ✅ WEBHOOK STRIPE
app.post("/webhook/stripe",
  express.raw({type: "application/json"}),
  (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET não configurado");
      return res.status(400).send("Webhook secret não configurado");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("✅ Webhook recebido:", event.type);
    } catch (err) {
      console.error("❌ Webhook error:", (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    switch (event.type) {
    case "checkout.session.completed":
      console.log("🎉 Pagamento confirmado:", event.data.object.id);
      break;

    case "invoice.payment_succeeded":
      console.log("💰 Pagamento recorrente:", event.data.object.id);
      break;

    case "customer.subscription.deleted":
      console.log("❌ Assinatura cancelada:", event.data.object.id);
      break;

    default:
      console.log(`📋 Evento não tratado: ${event.type}`);
    }

    return res.json({received: true});
  });

export const api = onRequest({
  region: "southamerica-east1",
  cors: true,
}, app);
