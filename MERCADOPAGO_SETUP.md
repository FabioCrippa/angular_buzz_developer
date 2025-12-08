# ===============================================
# 📝 GUIA DE CONFIGURAÇÃO - MERCADO PAGO
# ===============================================

## 🚀 PASSOS PARA CONFIGURAR

### 1. Obter Credenciais do Mercado Pago

Acesse: https://www.mercadopago.com.br/developers/panel

#### Sandbox (Testes):
- Public Key: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Access Token: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### Produção:
- Public Key: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Access Token: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

### 2. Configurar Backend

**Arquivo:** `backend/.env`

```env
# Mercado Pago - Sandbox
MP_ACCESS_TOKEN=TEST-seu-access-token-aqui
MP_PUBLIC_KEY=TEST-sua-public-key-aqui

# URLs
FRONTEND_URL_DEV=http://localhost:4200
WEBHOOK_URL=https://seu-backend.com/api/payments/webhook
```

**Arquivo:** `backend/config/mercadopago.config.js`

Já configurado! ✅

---

### 3. Configurar Frontend

**Arquivo:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  mercadoPagoPublicKey: "TEST-sua-public-key-aqui"
};
```

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
