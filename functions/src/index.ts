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
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

// ✅ INICIALIZAR FIREBASE ADMIN
admin.initializeApp();

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

// 🔧 MIDDLEWARE CUSTOMIZADO PARA CORS + DEBUG
app.use((req, res, next): void => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin}`);
  console.log(`   IP: ${req.headers["x-forwarded-for"] || req.socket.remoteAddress}`);
  
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    console.log("✅ Respondendo a preflight OPTIONS");
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(cors({
  origin: "*",
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

// ===============================================
// 🎯 VALIDAÇÃO DE TENTATIVAS - QUIZ ANÔNIMO
// ===============================================

// ✅ VALIDAR E INCREMENTAR TENTATIVAS ANÔNIMAS
app.get("/api/v1/anonymous/validate-attempt", async (req, res) => {
  try {
    const { deviceId, userIp } = req.query;

    if (!deviceId || !userIp) {
      return res.status(400).json({
        error: "deviceId e userIp são obrigatórios",
        code: "MISSING_PARAMS"
      });
    }

    const db = admin.firestore();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const docId = `${userIp}_${deviceId}`;
    const docRef = db.collection("anonymousAttempts").doc(today).collection("devices").doc(docId);

    const doc = await docRef.get();
    const attempts = doc.exists ? doc.data()?.attempts || 0 : 0;
    const maxAttempts = 7;

    if (attempts >= maxAttempts) {
      return res.json({
        allowed: false,
        attempts,
        remaining: 0,
        message: `Limite de ${maxAttempts} tentativas diárias atingido`,
        resetAt: new Date(today).getTime() + 24 * 60 * 60 * 1000 // Próxima meia-noite
      });
    }

    // ✅ INCREMENTAR TENTATIVA
    await docRef.set({
      attempts: attempts + 1,
      lastAttempt: new Date().toISOString(),
      deviceId,
      userIp,
      createdAt: doc.exists ? doc.data()?.createdAt : new Date().toISOString()
    });

    return res.json({
      allowed: true,
      attempts: attempts + 1,
      remaining: maxAttempts - (attempts + 1),
      message: "Tentativa registrada com sucesso",
      nextResetAt: new Date(today).getTime() + 24 * 60 * 60 * 1000
    });

  } catch (error) {
    console.error("❌ Erro ao validar tentativa:", error);
    return res.status(500).json({
      error: (error as Error).message,
      code: "VALIDATION_ERROR"
    });
  }
});

// ✅ OBTER TENTATIVAS RESTANTES DO DIA
app.get("/api/v1/anonymous/get-remaining-attempts", async (req, res) => {
  try {
    console.log("🔍 [GET] /api/v1/anonymous/get-remaining-attempts");
    const { deviceId, userIp } = req.query;
    console.log(`   deviceId: ${deviceId}, userIp: ${userIp}`);

    if (!deviceId || !userIp) {
      return res.status(400).json({
        error: "deviceId e userIp são obrigatórios",
        code: "MISSING_PARAMS"
      });
    }

    const db = admin.firestore();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const docId = `${userIp}_${deviceId}`;
    const docRef = db.collection("anonymousAttempts").doc(today).collection("devices").doc(docId);

    const doc = await docRef.get();
    const attempts = doc.exists ? doc.data()?.attempts || 0 : 0;
    const maxAttempts = 7;

    return res.json({
      attempts,
      remaining: Math.max(0, maxAttempts - attempts),
      maxAttempts,
      today,
      deviceId,
      lastAttempt: doc.exists ? doc.data()?.lastAttempt : null,
      resetAt: new Date(today).getTime() + 24 * 60 * 60 * 1000
    });

  } catch (error) {
    console.error("❌ Erro ao obter tentativas:", error);
    return res.status(500).json({
      error: (error as Error).message,
      code: "GET_ATTEMPTS_ERROR"
    });
  }
});

// ===============================================
// 📊 ANALYTICS - ESTATÍSTICAS DO DIA
// ===============================================

// ✅ OBTER ESTATÍSTICAS DE CONVERSÃO DO DIA
app.get("/api/v1/analytics/trial-stats", async (req, res) => {
  try {
    const { date } = req.query;
    const today = date ? String(date) : new Date().toISOString().split("T")[0];

    const db = admin.firestore();
    
    // Buscar todas as sessões do dia
    const sessionsRef = db.collection("trialAnalytics").doc("sessions");
    const sessionsSnapshot = await sessionsRef.collection("all").get();

    let stats = {
      totalSessions: 0,
      totalQuizzesStarted: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      totalLimitsReached: 0,
      totalUpgradesClicked: 0,
      conversionRate: 0,
      avgTimePerSession: 0,
      totalTimeSpent: 0,
      date: today
    };

    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.date === today) {
        stats.totalSessions++;
        stats.totalQuizzesStarted += data.quizzesStarted || 0;
        stats.totalQuestionsAnswered += data.questionsAnswered || 0;
        stats.totalCorrectAnswers += data.correctAnswers || 0;
        stats.totalLimitsReached += data.limitsReached || 0;
        stats.totalUpgradesClicked += data.upgradesClicked || 0;
        stats.totalTimeSpent += data.totalTimeSpent || 0;
      }
    });

    stats.conversionRate = stats.totalSessions > 0
      ? Math.round((stats.totalUpgradesClicked / stats.totalSessions) * 100)
      : 0;

    stats.avgTimePerSession = stats.totalSessions > 0
      ? Math.round(stats.totalTimeSpent / stats.totalSessions)
      : 0;

    res.json(stats);

  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    res.status(500).json({
      error: (error as Error).message,
      code: "STATS_ERROR"
    });
  }
});

// ✅ OBTER FUNNEL DE CONVERSÃO (PASSO A PASSO)
app.get("/api/v1/analytics/conversion-funnel", async (req, res) => {
  try {
    const { date } = req.query;
    const today = date ? String(date) : new Date().toISOString().split("T")[0];

    const db = admin.firestore();
    
    // Buscar todos os eventos do dia
    const eventsRef = db.collection("trialAnalytics").doc("events").collection("log");
    const q = await eventsRef.where("data.date", "==", today).get();

    let funnel = {
      step1_quizzesStarted: 0,
      step2_limitsReached: 0,
      step3_upgradesClicked: 0,
      conversionRate_step1_to_step2: 0,
      conversionRate_step2_to_step3: 0,
      conversionRate_overall: 0,
      date: today
    };

    q.docs.forEach(doc => {
      const data = doc.data();
      if (data.eventType === "quiz_started") funnel.step1_quizzesStarted++;
      if (data.eventType === "attempts_limit_reached") funnel.step2_limitsReached++;
      if (data.eventType === "upgrade_clicked") funnel.step3_upgradesClicked++;
    });

    funnel.conversionRate_step1_to_step2 = funnel.step1_quizzesStarted > 0
      ? Math.round((funnel.step2_limitsReached / funnel.step1_quizzesStarted) * 100)
      : 0;

    funnel.conversionRate_step2_to_step3 = funnel.step2_limitsReached > 0
      ? Math.round((funnel.step3_upgradesClicked / funnel.step2_limitsReached) * 100)
      : 0;

    funnel.conversionRate_overall = funnel.step1_quizzesStarted > 0
      ? Math.round((funnel.step3_upgradesClicked / funnel.step1_quizzesStarted) * 100)
      : 0;

    res.json(funnel);

  } catch (error) {
    console.error("❌ Erro ao obter funnel de conversão:", error);
    res.status(500).json({
      error: (error as Error).message,
      code: "FUNNEL_ERROR"
    });
  }
});

export const api = onRequest(
  {
    region: "southamerica-east1",
  },
  app
);

// ===============================================
// 🎓 CLOUD FUNCTIONS - SISTEMA DE ESCOLAS
// ===============================================

/**
 * Criar nova escola
 */
export const createSchool = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { name, city, state, directorName, email, phone, subscriptionType } = req.body;
      const adminUid = req.headers["x-admin-uid"];

      if (!adminUid || !name || !city) {
        res.status(400).json({ error: "Dados obrigatórios faltando" });
        return;
      }

      // Validar tipo de subscription
      const type = (subscriptionType === "sold" ? "sold" : "donated") as "sold" | "donated";

      // Gerar ID único da escola
      const schoolId = `school_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Gerar senha única de 6 caracteres alfanuméricos
      // Gerar senha: PrimeiroNomeSignificativo + ano2digitos + #
      // Ex: "E.E. Leticia de Godoy" → "Leticia26#"
      const prefixes = /^(e\.e\.|emef|emei|escola|colégio|colegio|centro|inst\.|instituto|prof\.?|professor|professora|dr\.?|doutor|doutora|ses|see|eep|eei|cei)\s*/i;
      const words = name.split(/\s+/);
      let firstMeaningfulWord = "";
      for (const word of words) {
        const cleaned = word.replace(/[^a-záéíóúâêîôûãõàèìòùç]/gi, "");
        if (cleaned.length > 1 && !prefixes.test(cleaned + " ")) {
          firstMeaningfulWord = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
          break;
        }
      }
      if (!firstMeaningfulWord) firstMeaningfulWord = "Escola";
      const rand2 = String(Math.floor(Math.random() * 90) + 10); // 10–99
      const sharedPassword = `${firstMeaningfulWord}${rand2}#`;

      // Calcular data de expiração (30 dias a partir de hoje)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Salvar escola com dados de assinatura
      await admin.firestore().collection("schools").doc(schoolId).set({
        schoolId,
        name,
        city,
        state: state || "",
        directorName: directorName || "",
        email: email || "",
        phone: phone || "",
        adminUid,
        sharedPassword,
        totalStudents: 0,
        activeStudents: 0,
        createdAt: new Date(),
        status: "active",
        // ✅ ASSINATURA (B2B Model)
        subscriptionType: type, // 'donated' ou 'sold' - definido pelo usuário
        subscriptionStatus: "active", // 'active', 'expired', 'cancelled'
        expiresAt,
        lastPaymentDate: new Date(),
      });

      res.json({
        success: true,
        schoolId,
        sharedPassword,
        subscriptionType: type,
      });
    } catch (error) {
      console.error("Erro ao criar escola:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * Upload de CSV com alunos
 */
export const uploadStudentsCsv = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { schoolId, csvContent } = req.body;

      if (!schoolId || !csvContent) {
        res.status(400).json({ error: "Dados obrigatórios faltando" });
        return;
      }

      const lines = csvContent.split("\n");
      const students = [];
      const batch = admin.firestore().batch();

      // Pular header e processar alunos
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(",").map((v: string) => v.trim());
        if (values.length < 4) continue;

        const ra = values[0];
        const name = values[1];
        const email = values[2];
        const classe = values[3];

        // Salvar aluno
        const studentRef = admin
          .firestore()
          .collection(`school_students/${schoolId}/students`)
          .doc(ra);

        batch.set(studentRef, {
          ra,
          name,
          email,
          class: classe,
          uid: null,
          accessLevel: "school_premium",
          accessExpiresAt: new Date(Date.now() + 365 * 86400000),
          status: "active",
          createdAt: new Date(),
          firstLogin: true,
        });

        students.push({ ra, name, email, classe });
      }

      // Atualizar contagem na escola
      const schoolRef = admin.firestore().collection("schools").doc(schoolId);
      batch.update(schoolRef, {
        totalStudents: students.length,
      });

      await batch.commit();

      res.json({
        success: true,
        processedCount: students.length,
        students,
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * Registrar tentativa de quiz
 */
export const recordQuizAttempt = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const {
        schoolId,
        ra,
        studentName,
        score,
        totalQuestions,
        duration,
        questionsAnswered,
      } = req.body;

      if (!schoolId || !ra || score === undefined || !totalQuestions) {
        res.status(400).json({ error: "Dados obrigatórios faltando" });
        return;
      }

      const attemptId = `attempt_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const percentage = (score / totalQuestions) * 100;

      // Salvar na collection global
      await admin
        .firestore()
        .collection("quiz_attempts")
        .doc(attemptId)
        .set({
          attemptId,
          schoolId,
          ra,
          studentName,
          score,
          totalQuestions,
          percentage: Math.round(percentage),
          duration,
          questionsAnswered,
          timestamp: new Date(),
          type: "pool_fixo",
        });

      // Salvar no histórico do aluno também
      await admin
        .firestore()
        .collection(`school_students/${schoolId}/students/${ra}/attempts`)
        .doc(attemptId)
        .set({
          score,
          totalQuestions,
          percentage: Math.round(percentage),
          duration,
          timestamp: new Date(),
        });

      res.json({
        success: true,
        attemptId,
      });
    } catch (error) {
      console.error("Erro ao registrar tentativa:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * 🔄 RENOVAR ASSINATURA - Estende por 30 dias
 */
export const renewSubscription = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { schoolId } = req.body;

      if (!schoolId) {
        res.status(400).json({ error: "schoolId obrigatório" });
        return;
      }

      // Verificar se escola existe
      const schoolDoc = await admin
        .firestore()
        .collection("schools")
        .doc(schoolId)
        .get();

      if (!schoolDoc.exists) {
        res.status(404).json({ error: "Escola não encontrada" });
        return;
      }

      // Calcular nova data de expiração (30 dias a partir de agora)
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      // Atualizar assinatura
      await admin
        .firestore()
        .collection("schools")
        .doc(schoolId)
        .update({
          subscriptionStatus: "active",
          expiresAt: newExpiresAt,
          lastPaymentDate: new Date(),
        });

      console.log(`✅ Assinatura renovada: ${schoolId} até ${newExpiresAt.toISOString()}`);

      res.json({
        success: true,
        schoolId,
        expiresAt: newExpiresAt,
        message: "Assinatura renovada por 30 dias",
      });
    } catch (error) {
      console.error("Erro ao renovar assinatura:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * 🚫 CANCELAR ASSINATURA - Bloqueia acesso imediatamente
 */
export const cancelSubscription = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { schoolId } = req.body;

      if (!schoolId) {
        res.status(400).json({ error: "schoolId obrigatório" });
        return;
      }

      // Verificar se escola existe
      const schoolDoc = await admin
        .firestore()
        .collection("schools")
        .doc(schoolId)
        .get();

      if (!schoolDoc.exists) {
        res.status(404).json({ error: "Escola não encontrada" });
        return;
      }

      // Cancelar assinatura
      const cancelledAt = new Date();
      await admin
        .firestore()
        .collection("schools")
        .doc(schoolId)
        .update({
          subscriptionStatus: "cancelled",
          cancelledAt,
        });

      console.log(`🚫 Assinatura cancelada: ${schoolId}`);

      res.json({
        success: true,
        schoolId,
        cancelledAt,
        message: "Assinatura cancelada. Alunos perderam acesso.",
      });
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * ⏰ MARCAR ASSINATURA COMO EXPIRADA
 */
export const expireSubscription = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { schoolId } = req.body;

      if (!schoolId) {
        res.status(400).json({ error: "schoolId obrigatório" });
        return;
      }

      // Verificar se escola existe
      const schoolDoc = await admin
        .firestore()
        .collection("schools")
        .doc(schoolId)
        .get();

      if (!schoolDoc.exists) {
        res.status(404).json({ error: "Escola não encontrada" });
        return;
      }

      // Marcar como expirada
      await admin
        .firestore()
        .collection("schools")
        .doc(schoolId)
        .update({
          subscriptionStatus: "expired",
          expiredAt: new Date(),
        });

      console.log(`⏰ Assinatura expirada: ${schoolId}`);

      res.json({
        success: true,
        schoolId,
        message: "Assinatura marcada como expirada.",
      });
    } catch (error) {
      console.error("Erro ao expirar assinatura:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * 🔐 LOGIN ADMIN - Autenticar administrador
 */
export const adminLogin = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validar entrada
      if (!email || !password) {
        res.status(400).json({ 
          success: false, 
          error: "Email e senha são obrigatórios" 
        });
        return;
      }

      // Credenciais padrão do admin (em produção, usar Firestore ou banco de dados)
      const ADMIN_EMAIL = "admin@sowlfy.com.br";
      const ADMIN_PASSWORD = "admin123"; // TODO: Usar hash em produção

      // Validar email
      if (email !== ADMIN_EMAIL) {
        console.warn(`⚠️ Tentativa de login com email incorreto: ${email}`);
        res.status(401).json({ 
          success: false, 
          error: "Email ou senha incorretos" 
        });
        return;
      }

      // Validar senha
      if (password !== ADMIN_PASSWORD) {
        console.warn(`⚠️ Tentativa de login com senha incorreta para: ${email}`);
        res.status(401).json({ 
          success: false, 
          error: "Email ou senha incorretos" 
        });
        return;
      }

      // Gerar JWT token (válido por 24 horas)
      const token = jwt.sign(
        {
          email,
          role: "admin",
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET || "sowlfy_admin_secret_key",
        { expiresIn: "24h" }
      );

      console.log(`✅ Admin logado com sucesso: ${email}`);

      res.json({
        success: true,
        token,
        adminData: {
          email,
          role: "admin",
          name: "Administrador SOWLFY"
        },
        message: "Login realizado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }
);

/**
 * ✅ Cloud Function: Verificar se a escola tem acesso (subscription ativa)
 * POST /checkSchoolAccess
 * Body: { schoolId: string }
 * Returns: { hasAccess: boolean, subscriptionStatus: string }
 */
export const checkSchoolAccess = onRequest(
  {cors: true},
  async (req, res) => {
    const {schoolId} = req.body;

    if (!schoolId || typeof schoolId !== "string") {
      res.status(400).json({
        success: false,
        error: "schoolId é obrigatório"
      });
      return;
    }

    try {
      const schoolDoc = await admin.firestore().collection("schools").doc(schoolId).get();

      if (!schoolDoc.exists) {
        res.status(404).json({
          success: false,
          error: "Escola não encontrada",
          hasAccess: false
        });
        return;
      }

      const schoolData = schoolDoc.data() as any;
      const hasAccess = schoolData?.subscriptionStatus === "active";

      res.json({
        success: true,
        hasAccess,
        subscriptionStatus: schoolData?.subscriptionStatus || "unknown",
        message: hasAccess ? "Acesso permitido" : "Acesso negado - subscription inativa"
      });
    } catch (error) {
      console.error("Erro ao verificar acesso da escola:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        hasAccess: false
      });
    }
  }
);

/**
 * ✅ Cloud Function: Deletar Escola
 * POST /deleteSchool
 * Body: { schoolId: string }
 * Deleta a escola e TODAS as subcoleções (alunos, tentativas, etc)
 * Returns: { success: boolean }
 */
export const deleteSchool = onRequest(
  {cors: true},
  async (req, res) => {
    const {schoolId} = req.body;

    if (!schoolId || typeof schoolId !== "string") {
      res.status(400).json({
        success: false,
        error: "schoolId é obrigatório"
      });
      return;
    }

    try {
      const db = admin.firestore();
      const batch = db.batch();

      // 1️⃣ Deletar todos os alunos e suas subcoleções
      const schoolStudentsRef = db.collection(`school_students/${schoolId}/students`);
      const studentsSnapshot = await schoolStudentsRef.get();

      for (const studentDoc of studentsSnapshot.docs) {
        // Deletar tentativas do aluno
        const attemptsRef = schoolStudentsRef.doc(studentDoc.id).collection("attempts");
        const attemptsSnapshot = await attemptsRef.get();
        
        for (const attemptDoc of attemptsSnapshot.docs) {
          batch.delete(attemptDoc.ref);
        }

        // Deletar documento do aluno
        batch.delete(studentDoc.ref);
      }

      // 2️⃣ Deletar coleção school_students/{schoolId}
      const schoolStudentsDocRef = db.collection("school_students").doc(schoolId);
      batch.delete(schoolStudentsDocRef);

      // 3️⃣ Deletar documento da escola
      const schoolRef = db.collection("schools").doc(schoolId);
      batch.delete(schoolRef);

      // 4️⃣ Deletar tentativas globais dessa escola (quiz_attempts)
      const quizAttemptsRef = db.collection("quiz_attempts");
      const quizAttemptSnapshot = await quizAttemptsRef
        .where("schoolId", "==", schoolId)
        .get();

      for (const doc of quizAttemptSnapshot.docs) {
        batch.delete(doc.ref);
      }

      // Executar batch
      await batch.commit();

      console.log(`✅ Escola ${schoolId} deletada com sucesso`);
      res.json({
        success: true,
        message: "Escola deletada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao deletar escola:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
);

/**
 * ✅ Cloud Function: Deletar Turma (Hard Delete)
 * POST /deleteClass
 * Body: { schoolId: string, className: string }
 * Deleta todos os alunos da turma + seus resultados de simulados e tentativas
 */
export const deleteClass = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    const { schoolId, className } = req.body;
    if (!schoolId || !className) {
      res.status(400).json({ success: false, error: "schoolId e className são obrigatórios" });
      return;
    }
    try {
      const db = admin.firestore();
      const studentsSnap = await db
        .collection(`school_students/${schoolId}/students`)
        .where("class", "==", className)
        .get();

      let deletedCount = 0;
      for (const studentDoc of studentsSnap.docs) {
        // Deletar resultados de simulados
        const resultsSnap = await studentDoc.ref.collection("simulado_results").get();
        const batch = db.batch();
        for (const r of resultsSnap.docs) batch.delete(r.ref);
        // Deletar tentativas
        const attemptsSnap = await studentDoc.ref.collection("attempts").get();
        for (const a of attemptsSnap.docs) batch.delete(a.ref);
        // Deletar o aluno
        batch.delete(studentDoc.ref);
        await batch.commit();
        deletedCount++;
      }

      res.json({ success: true, deletedCount, message: `${deletedCount} aluno(s) da turma "${className}" deletados.` });
    } catch (error) {
      console.error("Erro ao deletar turma:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * ✅ Cloud Function: Alterar Senha do Admin
 * POST /changeAdminPassword
 * Body: { email: string, currentPassword: string, newPassword: string }
 * Returns: { success: boolean, message?: string, error?: string }
 */
export const changeAdminPassword = onRequest(
  {cors: true},
  async (req, res) => {
    const {email, currentPassword, newPassword} = req.body;

    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: "Email, senha atual e nova senha são obrigatórios"
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: "Nova senha deve ter no mínimo 6 caracteres"
      });
      return;
    }

    try {
      // 🔐 MVP: Credenciais hardcoded (em produção, usar banco de dados)
      const ADMIN_EMAIL = "admin@sowlfy.com.br";
      const ADMIN_PASSWORD = "admin123";

      // Validar email
      if (email !== ADMIN_EMAIL) {
        res.status(401).json({
          success: false,
          error: "Email não autorizado"
        });
        return;
      }

      // Validar senha atual
      if (currentPassword !== ADMIN_PASSWORD) {
        res.status(401).json({
          success: false,
          error: "Senha atual incorreta"
        });
        return;
      }

      // ✅ TODO: Aqui você poderia armazenar a nova senha em:
      // 1. Firestore em collection admin_credentials
      // 2. Cloud Firestore Rules ou Secret Manager
      // Para MVP, estamos apenas validando
      
      console.log(`✅ Senha do admin ${email} seria alterada (MVP mode)`);

      res.json({
        success: true,
        message: "Senha alterada com sucesso! (MVP: mudança em memória)"
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
);

/**
 * ✏️ Cloud Function: Atualizar dados da escola
 * POST /updateSchool
 * Body: { schoolId, name, city, state, directorName, email, phone, subscriptionType }
 */
export const updateSchool = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    const { schoolId, name, city, state, directorName, email, phone, subscriptionType } = req.body;

    if (!schoolId || !name || !city) {
      res.status(400).json({ success: false, error: "schoolId, name e city são obrigatórios" });
      return;
    }

    try {
      const schoolRef = admin.firestore().collection("schools").doc(schoolId);
      const schoolDoc = await schoolRef.get();

      if (!schoolDoc.exists) {
        res.status(404).json({ success: false, error: "Escola não encontrada" });
        return;
      }

      const updateData: any = {
        name,
        city,
        state: state || "",
        directorName: directorName || "",
        email: email || "",
        phone: phone || "",
        updatedAt: new Date(),
      };

      if (subscriptionType === "sold" || subscriptionType === "donated") {
        updateData.subscriptionType = subscriptionType;
      }

      await schoolRef.update(updateData);

      console.log(`✅ Escola ${schoolId} atualizada`);
      res.json({ success: true, message: "Escola atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar escola:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 🔑 Cloud Function: Gerar nova senha para escola
 * POST /regenerateSchoolPassword
 * Body: { schoolId }
 */
export const regenerateSchoolPassword = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    const { schoolId } = req.body;

    if (!schoolId) {
      res.status(400).json({ success: false, error: "schoolId é obrigatório" });
      return;
    }

    try {
      const schoolRef = admin.firestore().collection("schools").doc(schoolId);
      const schoolDoc = await schoolRef.get();

      if (!schoolDoc.exists) {
        res.status(404).json({ success: false, error: "Escola não encontrada" });
        return;
      }

      const schoolData = schoolDoc.data() as any;
      const name = schoolData.name || "Escola";

      // Gerar nova senha com o mesmo algoritmo de createSchool
      const prefixes = /^(e\.e\.|emef|emei|escola|colégio|colegio|centro|inst\.|instituto|prof\.?|professor|professora|dr\.?|doutor|doutora|ses|see|eep|eei|cei)\s*/i;
      const words = name.split(/\s+/);
      let firstMeaningfulWord = "";
      for (const word of words) {
        const cleaned = word.replace(/[^a-záéíóúâêîôûãõàèìòùç]/gi, "");
        if (cleaned.length > 1 && !prefixes.test(cleaned + " ")) {
          firstMeaningfulWord = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
          break;
        }
      }
      if (!firstMeaningfulWord) firstMeaningfulWord = "Escola";
      const rand2 = String(Math.floor(Math.random() * 90) + 10);
      const newPassword = `${firstMeaningfulWord}${rand2}#`;

      await schoolRef.update({ sharedPassword: newPassword, passwordUpdatedAt: new Date() });

      console.log(`🔑 Nova senha gerada para escola ${schoolId}: ${newPassword}`);
      res.json({ success: true, sharedPassword: newPassword, message: "Nova senha gerada com sucesso" });
    } catch (error) {
      console.error("Erro ao gerar nova senha:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 💾 Cloud Function: Salvar resultado de simulado do aluno
 * POST /saveSimuladoResult
 */
export const saveSimuladoResult = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    try {
      const { schoolId, ra, studentName, className, simuladoId, simuladoName, score, correct, total, timeFormatted, byArea, questionsData } = req.body;
      if (!schoolId || !ra || !simuladoId) {
        res.status(400).json({ success: false, error: "schoolId, ra e simuladoId são obrigatórios" });
        return;
      }
      const db = admin.firestore();
      const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await db
        .collection(`school_students/${schoolId}/students/${ra}/simulado_results`)
        .doc(resultId)
        .set({
          simuladoId,
          simuladoName,
          score,
          correct,
          total,
          timeFormatted: timeFormatted || "",
          byArea: byArea || [],
          questionsData: questionsData || [],
          studentName: studentName || "",
          className: className || "",
          ra,
          schoolId,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      res.json({ success: true, resultId });
    } catch (error) {
      console.error("Erro ao salvar resultado do simulado:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 👨‍🏫 Cloud Function: Login do Professor/Coordenador
 * POST /teacherLogin
 * Body: { email: string, password: string }
 */
export const teacherLogin = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: "Email e senha são obrigatórios" });
        return;
      }
      const db = admin.firestore();
      // Buscar em todas as escolas por um professor com esse email
      const schoolsSnap = await db.collection("schools").get();
      let foundTeacher: any = null;
      let foundSchool: any = null;

      for (const schoolDoc of schoolsSnap.docs) {
        const schoolData = schoolDoc.data();
        // Verificar senha da escola
        if (schoolData.sharedPassword !== password) continue;
        // Buscar professor com esse email nesta escola
        const teacherSnap = await db
          .collection(`schools/${schoolDoc.id}/teachers`)
          .where("email", "==", email)
          .get();
        if (!teacherSnap.empty) {
          foundTeacher = { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() };
          foundSchool = { id: schoolDoc.id, ...schoolData };
          break;
        }
      }

      if (!foundTeacher || !foundSchool) {
        res.status(401).json({ success: false, error: "Email ou senha incorretos" });
        return;
      }

      const token = jwt.sign(
        {
          teacherId: foundTeacher.id,
          email: foundTeacher.email,
          name: foundTeacher.name,
          role: foundTeacher.role,
          schoolId: foundSchool.id,
          schoolName: foundSchool.name,
          type: "teacher",
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        },
        process.env.JWT_SECRET || "sowlfy_student_secret_key"
      );

      res.json({
        success: true,
        token,
        teacher: {
          id: foundTeacher.id,
          name: foundTeacher.name,
          email: foundTeacher.email,
          role: foundTeacher.role,
          schoolId: foundSchool.id,
          schoolName: foundSchool.name
        }
      });
    } catch (error) {
      console.error("Erro no login do professor:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 👨‍🏫 Cloud Function: Listar professores da escola
 * POST /getTeachers
 * Body: { schoolId }
 */
export const getTeachers = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    try {
      const { schoolId } = req.body;
      if (!schoolId) {
        res.status(400).json({ success: false, error: "schoolId é obrigatório" });
        return;
      }
      const snap = await admin.firestore().collection(`schools/${schoolId}/teachers`).get();
      const teachers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ success: true, teachers });
    } catch (error) {
      console.error("Erro ao listar professores:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 👨‍🏫 Cloud Function: Adicionar professor à escola
 * POST /addTeacher
 * Body: { schoolId, name, email, role: 'professor'|'coordenador' }
 */
export const addTeacher = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    try {
      const { schoolId, name, email, role } = req.body;
      if (!schoolId || !name || !email) {
        res.status(400).json({ success: false, error: "schoolId, name e email são obrigatórios" });
        return;
      }
      const db = admin.firestore();
      // Verificar se email já existe nessa escola
      const existing = await db
        .collection(`schools/${schoolId}/teachers`)
        .where("email", "==", email)
        .get();
      if (!existing.empty) {
        res.status(409).json({ success: false, error: "Este email já está cadastrado nesta escola" });
        return;
      }
      const teacherRef = db.collection(`schools/${schoolId}/teachers`).doc();
      await teacherRef.set({
        name,
        email,
        role: role || "professor",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, teacherId: teacherRef.id });
    } catch (error) {
      console.error("Erro ao adicionar professor:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 👨‍🏫 Cloud Function: Remover professor da escola
 * POST /removeTeacher
 * Body: { schoolId, teacherId }
 */
export const removeTeacher = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    try {
      const { schoolId, teacherId } = req.body;
      if (!schoolId || !teacherId) {
        res.status(400).json({ success: false, error: "schoolId e teacherId são obrigatórios" });
        return;
      }
      await admin.firestore()
        .collection(`schools/${schoolId}/teachers`)
        .doc(teacherId)
        .delete();
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao remover professor:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * 📊 Cloud Function: Buscar resultados de simulados da escola (para professor)
 * POST /getSchoolSimuladoResults
 * Body: { schoolId, teacherToken }
 */
export const getSchoolSimuladoResults = onRequest(
  { region: "southamerica-east1", cors: true },
  async (req, res) => {
    try {
      const { schoolId, teacherToken } = req.body;
      if (!schoolId || !teacherToken) {
        res.status(400).json({ success: false, error: "Dados obrigatórios faltando" });
        return;
      }
      // Verificar token
      let decoded: any;
      try {
        decoded = jwt.verify(teacherToken, process.env.JWT_SECRET || "sowlfy_student_secret_key");
      } catch {
        res.status(401).json({ success: false, error: "Token inválido" });
        return;
      }
      if (decoded.type !== "teacher" || decoded.schoolId !== schoolId) {
        res.status(403).json({ success: false, error: "Acesso negado" });
        return;
      }

      const db = admin.firestore();
      // Buscar todos os alunos da escola
      const studentsSnap = await db
        .collection(`school_students/${schoolId}/students`)
        .get();

      const results: any[] = [];
      for (const studentDoc of studentsSnap.docs) {
        const student = studentDoc.data();
        const resultsSnap = await db
          .collection(`school_students/${schoolId}/students/${studentDoc.id}/simulado_results`)
          .orderBy("completedAt", "desc")
          .get();
        for (const resultDoc of resultsSnap.docs) {
          const r = resultDoc.data();
          results.push({
            id: resultDoc.id,
            ra: student.ra || studentDoc.id,
            studentName: student.name || r.studentName || "",
            className: student.class || r.className || "",
            simuladoId: r.simuladoId,
            simuladoName: r.simuladoName,
            score: r.score,
            correct: r.correct,
            total: r.total,
            timeFormatted: r.timeFormatted,
            byArea: r.byArea || [],
            questionsData: r.questionsData || [],
            completedAt: r.completedAt ? r.completedAt.toDate().toISOString() : null
          });
        }
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error("Erro ao buscar resultados:", error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
);

/**
 * ✅ Cloud Function: Login do Estudante
 * POST /studentLogin
 * Body: { ra: string, password: string }
 * Returns: { success: boolean, user: {...}, token: string, error?: string }
 */
export const studentLogin = onRequest(
  {cors: true},
  async (req, res) => {
    const {ra, password} = req.body;

    if (!ra || !password) {
      res.status(400).json({
        success: false,
        error: "RA e senha são obrigatórios"
      });
      return;
    }

    try {
      const db = admin.firestore();
      
      let studentData: any = null;
      let schoolId: string = "";
      let foundRA: string = "";

      // Buscar o estudante via collectionGroup para evitar dependência de documento pai
      const inputRA = String(ra).trim().toLowerCase();
      const studentsSnapshot = await db.collectionGroup("students").get();

      for (const studentDoc of studentsSnapshot.docs) {
        const student = studentDoc.data();
        const storedRA = String(student.ra || "").trim().toLowerCase();

        if (storedRA === inputRA) {
          // Extrair schoolId a partir do caminho: school_students/{schoolId}/students/{ra}
          const pathSegments = studentDoc.ref.path.split("/");
          const extractedSchoolId = pathSegments[1]; // índice 1 = schoolId

          // Buscar senha da escola
          const schoolDoc = await db.collection("schools").doc(extractedSchoolId).get();
          const schoolDocData = schoolDoc.data();
          const schoolPassword = schoolDocData?.sharedPassword || "";

          if (schoolPassword !== password) {
            res.status(401).json({
              success: false,
              error: "RA ou senha incorretos"
            });
            return;
          }

          studentData = {
            ra: student.ra,
            name: student.name,
            email: student.email,
            className: student.className || student.class,
            ...student
          };
          schoolId = extractedSchoolId;
          foundRA = student.ra;
          break;
        }
      }

      if (!studentData) {
        res.status(401).json({
          success: false,
          error: "RA ou senha incorretos"
        });
        return;
      }

      // Gerar token JWT para estudante
      const token = jwt.sign(
        {
          ra: foundRA,
          schoolId,
          type: "student",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        },
        process.env.JWT_SECRET || "sowlfy_student_secret_key"
      );

      console.log(`✅ Estudante ${foundRA} fez login com sucesso`);

      res.json({
        success: true,
        user: studentData,
        schoolId,
        token
      });
    } catch (error) {
      console.error("Erro ao fazer login do estudante:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
);


