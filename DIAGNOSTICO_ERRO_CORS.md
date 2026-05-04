# 🔧 DIAGNÓSTICO DO ERRO - CORS E URLs DE CALLBACK

## ❌ Problema Identificado

**Erro no Console**: `Unsafe attempt to load URL http://sowlfy.com.br/ from frame with URL chrome-error://chromewebdata/`

## 🎯 Causa Raiz

No arquivo `backend/server.js` (linha 95), havia uma URL hardcoded para pagamento:
```javascript
back_url: 'https://sowlfy.com.br/payment/success'
```

### Problemas:
1. **Domínio inválido em produção**: O domínio `sowlfy.com.br` não é um domínio real ou não está registrado
2. **CORS violation**: O navegador bloqueia redirecionamentos para domínios não configurados
3. **Mismatch de ambiente**: A URL de produção não corresponde ao seu ambiente de desenvolvimento

## ✅ Soluções Implementadas

### 1. Corrigido `backend/server.js` (linha 95)
```javascript
// ❌ ANTES
back_url: 'https://sowlfy.com.br/payment/success'

// ✅ DEPOIS
back_url: process.env.BACK_URL || 'http://localhost:4200/payment/success'
```

### 2. Adicionado `BACK_URL` ao `.env`
```env
BACK_URL=http://localhost:4200/payment/success
```

## 📝 Configuração para Diferentes Ambientes

### Desenvolvimento (`.env`)
```env
BACK_URL=http://localhost:4200/payment/success
FRONTEND_URL=http://localhost:4200
```

### Produção (quando deployar)
```env
BACK_URL=https://seu-dominio-real.com/payment/success
FRONTEND_URL=https://seu-dominio-real.com
```

## 🚀 Próximos Passos

1. **Reinicie o backend**:
   ```powershell
   cd backend
   npm start
   ```

2. **Teste localmente** em `http://localhost:4200`

3. **Quando for para produção**:
   - Registre um domínio real
   - Use HTTPS (obrigatório)
   - Configure as variáveis de ambiente corretamente
   - Valide que o Mercado Pago está configurado para usar o domínio correto

## 🔍 Outros Arquivos Relacionados

- `backend/routes/payments.js` - ✅ Já está usando `process.env.FRONTEND_URL` corretamente
- `src/environments/environment.prod.ts` - ✅ Está usando `https://sowlfy-backend-new.onrender.com`

## ⚠️ Importante

Após fazer as alterações:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Feche todas as abas abertas do site
3. Reinicie o backend
4. Teste novamente
