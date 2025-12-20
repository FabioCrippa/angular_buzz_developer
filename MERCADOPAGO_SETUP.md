# ===============================================
# � CONFIGURAÇÃO MERCADO PAGO - GUIA COMPLETO
# ===============================================

## 📋 CHECKLIST RÁPIDO

- [ ] Obter credenciais Sandbox
- [ ] Configurar webhook no painel
- [ ] Testar assinatura local
- [ ] Verificar ativação premium no Firestore
- [ ] Migrar para produção

---

## 1️⃣ OBTER CREDENCIAIS

### Painel do Desenvolvedor
👉 https://www.mercadopago.com.br/developers/panel/app

1. **Criar aplicação** (se não tiver)
   - Nome: "SOWLFY Quiz"
   - Tipo: Pagamentos online

2. **Copiar credenciais SANDBOX** (aba "Credenciais de teste")
   ```
   Public Key:   TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Access Token: TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

---

## 2️⃣ CONFIGURAR WEBHOOK

### No Painel Mercado Pago

1. Ir em **Suas integrações** → Selecionar sua aplicação
2. Menu lateral: **Webhooks**
3. Clicar em **Configurar notificações**

**Configurações:**
```
URL de produção: https://seu-backend.railway.app/api/payments/webhook
URL de teste:    https://seu-ngrok-url.ngrok.io/api/payments/webhook

Eventos selecionados:
☑ payment (Pagamentos)
☑ subscription_preapproval (Assinaturas)
```

### Testar Localmente com ngrok

```bash
# Instalar ngrok
winget install ngrok

# Expor porta do backend
ngrok http 3000

# Copiar URL pública (ex: https://abc123.ngrok.io)
# Usar no Mercado Pago: https://abc123.ngrok.io/api/payments/webhook
```

---

## 3️⃣ CONFIGURAR BACKEND

**Arquivo:** `backend/.env`

```env
# Mercado Pago - SANDBOX (Testes)
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-access-token-aqui

# Firebase Admin (copiar de firebase-service-account.json)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# URLs
PORT=3000
FRONTEND_URL=http://localhost:4200
```

---

## 4️⃣ TESTAR ASSINATURA

### A. Iniciar Backend
```bash
cd backend
npm install
npm run dev
```

### B. Usar Cartões de Teste

**Aprovado:**
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Nome: APRO (qualquer nome)
```

**Recusado:**
```
Nome: OTHE (para testar recusa)
```

👉 Mais cartões: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

### C. Fluxo de Teste

1. Frontend: Ir em `/upgrade`
2. Clicar em **Assinar Premium**
3. Preencher dados do cartão teste
4. Confirmar pagamento

**Verificar logs do backend:**
```
📩 Webhook recebido: {...}
📋 Processando assinatura: 1234567
✅ Assinatura autorizada! Ativando premium...
✅ Premium ativado para usuário: abc123
```

**Verificar Firestore:**
```
/users/{userId}
  isPremium: true ✅
  premiumSince: 2025-12-20...
  premiumExpiresAt: 2026-01-20...
  subscriptionId: "1234567"

/subscriptions/{subscriptionId}
  userId: "abc123"
  status: "authorized"
  amount: 39.90
```

---

## 5️⃣ SOLUÇÃO DE PROBLEMAS

### Webhook não recebe notificações

**Verificar:**
1. URL está correta no painel MP
2. Backend está rodando e acessível
3. ngrok está ativo (se local)
4. Firewall não bloqueia porta 3000

**Testar manualmente:**
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription_preapproval",
    "data": {"id": "1234567"}
  }'
```

### Premium não ativa

**Verificar logs:**
```javascript
// Em payments.js - Linha ~65
console.log('📧 Email do pagador:', subscription.payer_email);
console.log('🆔 UserId:', userId);
```

**Checar Firebase Admin:**
- Credenciais corretas no `.env`
- `firebase-admin` instalado: `npm list firebase-admin`

---

## 6️⃣ MIGRAR PARA PRODUÇÃO

### Credenciais de Produção

1. Painel MP → **Credenciais de produção**
2. Copiar `APP_USR-...` (Access Token)

**Atualizar `.env` produção:**
```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-token-producao
```

### Webhook Produção

**URL final:** `https://seu-backend.railway.app/api/payments/webhook`

Configure no painel Mercado Pago em **modo produção**.

**Arquivo:** `src/app/core/services/mercadopago.service.ts`

Linha 24 - Substituir:
```typescript
private readonly MP_PUBLIC_KEY = 'TEST-sua-public-key-aqui';
```

---

### 4. Testar Localmente

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm start
```

Acesse: http://localhost:4200/upgrade

---

### 5. Contas de Teste do Mercado Pago

Para testar pagamentos, use:

**Cartões de Teste:**
- Mastercard: `5031 4332 1540 6351`
- Visa: `4509 9535 6623 3704`
- CVV: `123`
- Validade: Qualquer data futura
- Nome: Qualquer nome

**Status de Teste:**
- Aprovado: CPF `123.456.789-01`
- Recusado: CPF `987.654.321-00`

---

### 6. Configurar Webhook (Produção)

No painel do Mercado Pago:

1. Acesse: Configurações > Notificações
2. Configure a URL: `https://seu-backend.com/api/payments/webhook`
3. Selecione eventos: `payment`, `subscription`

---

### 7. Deploy

#### Backend (Heroku/Railway/Render):

```bash
# Adicionar variáveis de ambiente:
MP_ACCESS_TOKEN=APP_USR-seu-token-producao
MP_PUBLIC_KEY=APP_USR-sua-key-producao
FRONTEND_URL_PROD=https://seu-frontend.vercel.app
WEBHOOK_URL=https://seu-backend.com/api/payments/webhook
```

#### Frontend (Vercel):

1. Deploy normalmente
2. Configurar variável de ambiente:
   - `MERCADOPAGO_PUBLIC_KEY` = `APP_USR-sua-key-producao`

---

### 8. Endpoints Disponíveis

#### Backend:

```
GET  /api/payments/plans
POST /api/payments/create-preference
GET  /api/payments/payment/:paymentId
POST /api/payments/webhook
GET  /api/payments/verify-payment
```

#### Frontend:

```
/upgrade - Página de planos
/payment/success - Pagamento aprovado
/payment/failure - Pagamento recusado
/payment/pending - Pagamento pendente
```

---

## 🧪 TESTAR FLUXO COMPLETO

1. Acesse `/upgrade`
2. Clique em "Começar 7 Dias Grátis"
3. Será redirecionado para o Mercado Pago
4. Use os cartões de teste
5. Será redirecionado de volta com status

---

## 🆘 TROUBLESHOOTING

### Erro: "Public Key inválida"
- Verifique se copiou a chave completa
- Certifique-se de usar `TEST-` para sandbox

### Erro: "CORS blocked"
- Configure CORS no backend (já configurado ✅)
- Verifique se o backend está rodando

### Webhook não recebe notificações
- Use `ngrok` para testes locais
- Verifique logs do backend

---

## 📚 DOCUMENTAÇÃO

- Mercado Pago Docs: https://www.mercadopago.com.br/developers/pt/docs
- SDK JS: https://github.com/mercadopago/sdk-js
- SDK Node: https://github.com/mercadopago/sdk-nodejs

---

## ✅ CHECKLIST FINAL

- [ ] Credenciais configuradas no backend
- [ ] Credenciais configuradas no frontend
- [ ] Backend rodando na porta 3000
- [ ] Frontend rodando na porta 4200
- [ ] Testado fluxo de pagamento com cartão de teste
- [ ] Páginas de callback funcionando
- [ ] Webhook configurado (produção)

---

🎉 **Tudo pronto! Seu sistema de pagamentos está integrado com Mercado Pago!**
