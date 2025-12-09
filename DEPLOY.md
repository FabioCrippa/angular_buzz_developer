# 🚀 GUIA DE DEPLOY - SOWLFY

## 📋 PRÉ-REQUISITOS

- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Railway](https://railway.app) ou Render
- [ ] Git instalado
- [ ] Repositório no GitHub atualizado

---

## 🎯 DEPLOY FRONTEND (VERCEL)

### 1️⃣ Preparar Repositório

```bash
# Commit todas as alterações
git add .
git commit -m "feat: deploy production ready"
git push origin main
```

### 2️⃣ Deploy no Vercel

**Opção A: Via Vercel CLI**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login no Vercel
vercel login

# Deploy para produção
cd c:\Users\cripp\projetos-andamento\angular_buzz_developer
vercel --prod
```

**Opção B: Via Dashboard Vercel**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte seu GitHub
3. Selecione o repositório `angular_buzz_developer`
4. Configure:
   - **Framework Preset**: Angular
   - **Build Command**: `ng build --configuration production`
   - **Output Directory**: `dist/buzz_developter`
   - **Install Command**: `npm install`

### 3️⃣ Configurar Variáveis de Ambiente no Vercel

No Dashboard do Vercel → Settings → Environment Variables:

```
NODE_ENV=production
```

### 4️⃣ Configurar Domínio (Opcional)

1. Vercel Dashboard → Settings → Domains
2. Adicione seu domínio customizado: `sowlfy.com`

---

## 🗄️ DEPLOY BACKEND (RAILWAY)

### 1️⃣ Preparar Backend

```bash
# Criar arquivo Procfile no backend
cd backend
echo "web: node server.js" > Procfile
```

### 2️⃣ Deploy no Railway

**Via Railway CLI**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Iniciar projeto
cd backend
railway init

# Deploy
railway up
```

**Via Dashboard Railway**
1. Acesse [railway.app/new](https://railway.app/new)
2. Conecte GitHub
3. Selecione o repositório
4. Configure:
   - **Root Directory**: `/backend`
   - **Start Command**: `node server.js`

### 3️⃣ Configurar Variáveis de Ambiente no Railway

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=seu-jwt-secret-forte-aqui-mudar
JWT_EXPIRES_IN=24h
MP_ACCESS_TOKEN=APP_USR-6662176706831400-120807-f8259a592c79bbf4dc0e3297bfc1eb60-1106373637
MP_PUBLIC_KEY=APP_USR-d11ca329-064b-4623-af41-1b56a4f75eb0
MP_PREAPPROVAL_PLAN_ID=c7a60c8054f54360b00298b9b4bfe0b4
STRIPE_SECRET_KEY=sk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH
STRIPE_PUBLIC_KEY=pk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH
FRONTEND_URL_PROD=https://seu-app.vercel.app
WEBHOOK_URL=https://seu-backend.railway.app/api/payments/webhook
```

### 4️⃣ Obter URL do Backend

Após deploy, Railway fornecerá uma URL:
```
https://seu-backend.railway.app
```

---

## 🔗 CONECTAR FRONTEND AO BACKEND

### 1️⃣ Atualizar environment.prod.ts

```typescript
export const environment = {
  production: true,
  apiUrl: "https://seu-backend.railway.app",
  mercadoPagoPublicKey: "APP_USR-d11ca329-064b-4623-af41-1b56a4f75eb0",
  // ... resto
};
```

### 2️⃣ Atualizar Serviços

**src/app/core/services/auth.service.ts:**
```typescript
private readonly API_URL = 'https://seu-backend.railway.app/api';
```

**src/app/core/services/mercadopago.service.ts:**
```typescript
private readonly API_URL = 'https://seu-backend.railway.app';
```

**src/app/core/services/payment.service.ts:**
```typescript
private readonly API_URL = 'https://seu-backend.railway.app';
```

### 3️⃣ Commit e Redeploy

```bash
git add .
git commit -m "fix: update backend URLs for production"
git push origin main
```

Vercel fará redeploy automático!

---

## 🔔 CONFIGURAR WEBHOOKS MERCADO PAGO

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá em **Suas integrações** → **Produção**
3. Configure Webhook:
   - **URL**: `https://seu-backend.railway.app/api/payments/webhook`
   - **Eventos**: 
     - ✅ payment
     - ✅ subscription
     - ✅ preapproval

---

## ✅ CHECKLIST PRÉ-DEPLOY

### Backend
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET alterado (forte e único)
- [ ] Mercado Pago PRODUÇÃO configurado
- [ ] CORS configurado com URLs corretas
- [ ] Testes de API funcionando

### Frontend
- [ ] Build de produção sem erros
- [ ] URLs do backend atualizadas
- [ ] Environment.prod.ts configurado
- [ ] Credenciais de produção
- [ ] Console.logs removidos (✅ 471 removidos)

### Mercado Pago
- [ ] Plano de assinatura criado
- [ ] Webhook configurado
- [ ] Credenciais de PRODUÇÃO
- [ ] URLs de retorno configuradas

---

## 🧪 TESTAR EM PRODUÇÃO

### 1️⃣ Frontend
```
https://seu-app.vercel.app
```

Testar:
- [ ] Home carrega
- [ ] Login funciona
- [ ] Dashboard acessível
- [ ] Quiz funcional
- [ ] Botões de upgrade

### 2️⃣ Backend
```bash
curl https://seu-backend.railway.app/api/payments/plans
```

Deve retornar JSON com planos.

### 3️⃣ Fluxo Completo
1. Registrar novo usuário
2. Fazer login
3. Clicar "Ativar Premium"
4. Redirecionar para Mercado Pago
5. Completar pagamento de teste
6. Verificar webhook recebido
7. Verificar usuário virou premium

---

## 🔧 TROUBLESHOOTING

### CORS Error
Adicionar URL do Vercel no backend:
```javascript
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://seu-app.vercel.app'
  ]
}));
```

### Build Error no Vercel
- Verificar `angular.json`
- Verificar `package.json` tem todas as dependências
- Logs no Vercel Dashboard

### Backend não responde
- Verificar logs no Railway
- Verificar variáveis de ambiente
- Testar endpoint manualmente

---

## 📊 MONITORAMENTO

### Vercel Analytics
Dashboard → Analytics → Ver métricas

### Railway Logs
Dashboard → Logs → Ver logs em tempo real

### Mercado Pago
Dashboard → Transações → Acompanhar pagamentos

---

## 🎉 DEPLOY COMPLETO!

Agora o SOWLFY está em produção! 🚀

**URLs:**
- Frontend: https://seu-app.vercel.app
- Backend: https://seu-backend.railway.app
- Checkout: https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=c7a60c8054f54360b00298b9b4bfe0b4
