# 🧪 GUIA DE TESTE - FLUXO COMPLETO MERCADO PAGO

## ✅ SERVIDORES ATIVOS

- **Backend:** http://localhost:3000 ✅ (rodando)
- **Frontend:** http://localhost:4201 ✅ (rodando)
- **Página de Upgrade:** http://localhost:4201/upgrade (aberta)

---

## 🎯 PASSO A PASSO PARA TESTAR

### 1️⃣ Verificar a Página de Upgrade
- ✅ Você já está na página `/upgrade`
- Veja os planos disponíveis:
  - **Gratuito** - R$ 0,00
  - **Premium Mensal** - R$ 39,90 (RECOMENDADO)

### 2️⃣ Fazer Login (se necessário)
Se não estiver logado, você precisa:
1. Clicar em "Login" no header
2. Fazer login ou registrar-se
3. Voltar para `/upgrade`

### 3️⃣ Iniciar o Checkout
1. Na página de upgrade, clique no botão **"Começar 7 Dias Grátis"** do plano Premium
2. Você verá a mensagem: "Redirecionando para pagamento via Mercado Pago..."
3. Aguarde o redirecionamento (pode levar 2-3 segundos)

### 4️⃣ No Checkout do Mercado Pago
Você será redirecionado para o checkout oficial do Mercado Pago.

**Use estes dados de TESTE:**

#### 💳 Cartão de Crédito (Aprovado)
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 12/25
Nome: APRO
CPF: 123.456.789-01
Email: test_user@test.com
```

#### 💳 Cartão de Crédito (Recusado - para testar falha)
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 12/25
Nome: OTHE
CPF: 987.654.321-00
Email: test_user@test.com
```

### 5️⃣ Após o Pagamento

**Pagamento APROVADO:**
- Você será redirecionado para: `/payment/success`
- Verá a mensagem de sucesso
- Premium será ativado automaticamente
- Redirecionamento automático para dashboard em 5 segundos

**Pagamento RECUSADO:**
- Você será redirecionado para: `/payment/failure`
- Verá orientações sobre o erro
- Poderá tentar novamente

**Pagamento PENDENTE (Boleto/PIX):**
- Você será redirecionado para: `/payment/pending`
- Verá instruções para completar o pagamento

---

## 🔍 VERIFICAR LOGS

### Backend Logs
Acompanhe o terminal do backend para ver:
```
📦 Criando preferência MP: { planId, userId, userEmail }
✅ Preferência criada com sucesso!
📬 Webhook recebido (após pagamento)
✅ Pagamento aprovado
```

### Frontend Console
Abra o DevTools (F12) e veja:
```
💳 Iniciando checkout para: Premium Mensal
🚀 Redirecionando para checkout MP: sowlfy-pro-monthly
✅ Redirecionamento iniciado
```

---

## 🧪 CENÁRIOS DE TESTE

### Teste 1: Fluxo Completo Aprovado ✅
1. Selecione plano Premium
2. Clique em "Começar 7 Dias Grátis"
3. Preencha com cartão APROVADO
4. Confirme o pagamento
5. Verifique redirecionamento para success
6. Confirme ativação do premium

### Teste 2: Pagamento Recusado ❌
1. Selecione plano Premium
2. Use cartão RECUSADO (OTHE)
3. Veja página de failure
4. Tente novamente se quiser

### Teste 3: Verificar Webhook 🔔
1. Após pagamento aprovado
2. Verifique logs do backend
3. Deve aparecer: "Webhook recebido"

---

## 📊 ENDPOINTS PARA VERIFICAR

### Health Check
```bash
curl http://localhost:3000/health
```

### Listar Planos
```bash
curl http://localhost:3000/api/payments/plans
```

### Criar Preferência (manual)
```bash
curl -X POST http://localhost:3000/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{
    "planId": "sowlfy-pro-monthly",
    "userId": 1,
    "userEmail": "test@example.com"
  }'
```

---

## ⚠️ PROBLEMAS COMUNS

### "Usuário não autenticado"
**Solução:** Faça login em `/login` primeiro

### "Erro ao criar preferência"
**Solução:** 
- Verifique se backend está rodando
- Confira credenciais no `.env`
- Veja logs do backend

### Não redireciona para MP
**Solução:**
- Abra DevTools (F12) e veja console
- Verifique se há erros CORS
- Confirme que Public Key está correta

### Após pagamento não volta
**Solução:**
- Verifique URLs de callback no `mercadopago.config.js`
- Devem apontar para `http://localhost:4201/payment/...`

---

## ✨ CHECKLIST DE TESTE

- [ ] Backend rodando na porta 3000
- [ ] Frontend rodando na porta 4201
- [ ] Página `/upgrade` carregando
- [ ] Usuário logado
- [ ] Botão de checkout funcionando
- [ ] Redirecionamento para MP funcionando
- [ ] Checkout do MP abrindo
- [ ] Pagamento com cartão de teste
- [ ] Redirecionamento de volta funcionando
- [ ] Página de sucesso mostrando
- [ ] Premium ativado
- [ ] Logs do backend mostrando tudo

---

## 🎉 PRÓXIMOS PASSOS APÓS TESTE

Se tudo funcionar:
1. ✅ Integração está completa
2. 🚀 Pode fazer deploy
3. 🔒 Configure webhooks em produção
4. 💾 Integre com banco de dados real
5. 📧 Adicione notificações por email

---

**AGORA É TESTAR! Abra http://localhost:4201/upgrade e comece!** 🚀
