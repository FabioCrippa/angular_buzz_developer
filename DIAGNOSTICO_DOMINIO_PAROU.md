# 🔍 DIAGNÓSTICO - DOMÍNIO PAROU DE FUNCIONAR

## 📋 CHECKLIST DE VERIFICAÇÃO

### 1. Verificar o Domínio
```powershell
# Verificar DNS
nslookup seu-dominio.com

# Verificar se resolve
ping seu-dominio.com
```

### 2. Verificar Firebase Hosting
```bash
# Logar no Firebase
firebase login

# Ver status do deployment
firebase hosting:sites

# Ver logs
firebase hosting:list
```

### 3. Verificar Vercel (se estiver usando)
```bash
# Logar no Vercel
vercel login

# Ver deployments
vercel ls

# Ver logs
vercel logs
```

### 4. Verificar Railway (se estiver usando)
1. Acesse https://railway.app
2. Vá em seu projeto
3. Clique em "Logs"
4. Procure por erros recentes

### 5. Testar URLs Importantes
```
Frontend: https://angular-buzz-developer.firebaseapp.com
Frontend Custom: https://seu-dominio.com
Backend: https://sowlfy-backend-new.onrender.com/api/health
```

---

## 🚨 Cenários Comuns e Soluções

### Cenário 1: Certificado SSL Expirou
**Sintomas:** Erro de HTTPS / Aviso de segurança
```bash
# Renovar certificado
firebase hosting:channel:deploy seu-dominio
```

### Cenário 2: Domínio Expirou
**Sintomas:** DNS não resolve
- Verificar em seu registrador de domínio
- Renovar domínio se expirou

### Cenário 3: Build Falhou
**Sintomas:** Tela branca, erro 502
```bash
# Reconstruir e fazer deploy
ng build --configuration production
firebase deploy --only hosting
```

### Cenário 4: Backend Caiu
**Sintomas:** Erro ao fazer login/pagamento
```bash
# Verificar status do Railway
# Reiniciar backend
```

### Cenário 5: CORS/Configuração Quebrada
**Sintomas:** Erros no console sobre CORS
```bash
# Verificar environment.prod.ts
# Verificar URLs do backend
# Redirecionar para Vercel
```

---

## 🛠️ Ações Recomendadas

### Se Estiver no Firebase Hosting
```bash
# 1. Fazer build
ng build --configuration production

# 2. Deploy
firebase deploy --only hosting

# 3. Verificar
firebase hosting:sites
```

### Se Estiver no Vercel
```bash
# 1. Fazer deploy
vercel --prod

# 2. Aguardar conclusão
# 3. Testar URL
```

### Se Backend Caiu (Railway)
```bash
# 1. Acessar https://railway.app
# 2. Verificar logs
# 3. Reiniciar serviço
# 4. Verificar variáveis de ambiente
```

---

## 💾 Arquivos Críticos para Verificar

1. `src/environments/environment.prod.ts` - URLs corretas?
2. `firebase.json` - Configuração correta?
3. `.firebaserc` - Projeto certo?
4. `backend/.env` - Variáveis carregadas?
5. `DEPLOY.md` - Passos seguidos?

---

## 📞 Informações que Preciso

Por favor, forneça:

1. **Nome exato do domínio**: _______________
2. **Quando parou**: _______________
3. **Erro exato no console**: _______________
4. **Status HTTP recebido**: _______________
5. **Logs/screenshots**: (arquivo anexado)

---

## 🔧 Próximo Passo

Responda as perguntas acima para que eu possa:
- [ ] Verificar configurações específicas
- [ ] Revisar logs
- [ ] Identificar o culpado
- [ ] Fazer a correção
- [ ] Redeploy se necessário
