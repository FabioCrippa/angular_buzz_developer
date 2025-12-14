# ✅ Checklist de Testes - SOWLFY

## 📋 Índice
- [1. Autenticação](#1-autenticação)
- [2. Modo Gratuito](#2-modo-gratuito)
- [3. Modo Premium](#3-modo-premium)
- [4. Navegação e Links](#4-navegação-e-links)
- [5. Componentes](#5-componentes)
- [6. Quiz e Questões](#6-quiz-e-questões)
- [7. Integrações](#7-integrações)
- [8. Responsividade](#8-responsividade)
- [9. Performance](#9-performance)

---

## 1. Autenticação

### 1.1 Cadastro de Novo Usuário
- [ok] Acessar página de registro
- [ok] Campos obrigatórios funcionam (nome, email, senha)
- [ok] Validação de email (formato correto)
- [ok] Validação de senha (mínimo de caracteres)
- [ok] Mensagem de erro se email já existe
- [ok] Cadastro cria usuário no Firebase Authentication
- [ok] Cadastro cria documento no Firestore `/users/{uid}`
- [ok] Documento criado com campos:
  - [ok] `email`
  - [ok] `name`
  - [ok] `isPremium: false`
  - [ok] `plan: 'free'`
  - [ ] `stats.questionsAnswered: 0`
  - [ ] `stats.correctAnswers: 0`
  - [ ] `preferences.areas: []`
- [ok] Redirecionamento após cadastro (dashboard ou home)

### 1.2 Login
- [ok] Acessar página de login
- [ok] Login com email e senha corretos funciona
- [ok] Mensagem de erro com credenciais inválidas. [ok] Melhorias: trocar mensagem "Erro ao processar autenticação" por "Email ou senha inválidos".

- [ok] Carrega dados do usuário do Firestore
- [ok] Carrega `isPremium`, `plan`, `stats`
- [ok] Redirecionamento correto após login
- [ok] Sessão persiste (refresh da página mantém login)

### 1.3 Logout
- [ok] Botão de logout visível quando autenticado
- [ ] Logout desconecta do Firebase Authentication.
- [ ] Limpa dados do usuário da memória
- [ok] Redireciona para página home/login
- [ok] Não permite acesso a rotas protegidas após logout. [ok] Melhorias: Logout feito (refresh da página volta o usuário logado)

### 1.4 Proteção de Rotas
- [ ] Rotas protegidas só acessíveis com login (auth.guard)
- [ok] dashboard 
- [ok] quiz 
- [ok] quiz/:mode 
- [ok] quiz/:mode/:area 
- [ok] quiz/:area/:subject 
- [ok] area/:id 
- [ok] progress
- [ok] favorites 
- [ok] profile 
- [ok] settings 
- [ ] help 
- [ ] termos 
- [ ] privacidade
- [ok] Redireciona para login se não autenticado
- [ok] Rotas de guest só acessíveis sem login (guest.guard). [ok]Melhorias: direcionar para tela de login 
- [ok] Rotas premium só acessíveis para assinantes (premium.guard)

---

## 2. Modo Gratuito

### 2.1 Limite de 3 Tentativas/Dia
- [ok] Usuário gratuito inicia com 3 tentativas disponíveis.
- [ok] Cada quiz completo desconta 1 tentativa na área de desenvolvimento web
- [ok] Cada quiz completo desconta 1 tentativa na área de português
- [ok] Cada quiz completo desconta 1 tentativa na área de matemática
- [ok] Cada quiz completo desconta 1 tentativa na área de informática
- [ok] Contador de tentativas visível no dashboard
- [ok] Contador de tentativas visível na área de desenvolvimento web
- [ok] Contador de tentativas visível na área de português
- [ok] Contador de tentativas visível na área de matemática
- [ok] Contador de tentativas visível na área de informática
- [ok] Mensagem clara quando atinge limite na área de desenvolvimento web
- [ok] Mensagem clara quando atinge limite na área de português
- [ok] Mensagem clara quando atinge limite na área de matemática
- [ok] Mensagem clara quando atinge limite na área de informática
- [x] Não permite iniciar novo quiz sem tentativas. [] O usuário inicia um novo quiz quando esgota as tentativas.
- [x] Botão "Fazer Quiz" desabilitado sem tentativas
- [ok] Exibe mensagem incentivando upgrade para Premium para a área de desenvolvimento web
- [ok] Exibe mensagem incentivando upgrade para Premium para a área de português
- [ok] Exibe mensagem incentivando upgrade para Premium para a área de matemática
- [ok] Exibe mensagem incentivando upgrade para Premium para a área de informática

### 2.2 Reset de Tentativas
- [ ] Tentativas resetam à meia-noite (00:00)
- [ ] Verificar se usa timezone correto (America/Sao_Paulo)
- [ ] Após reset, contador volta para 3
- [ ] Storage local atualiza corretamente

### 2.3 Funcionalidades Disponíveis (Gratuito)
- [ ] Pode fazer 3 quizzes por dia
- [ ] Pode visualizar progresso básico
- [ ] Pode marcar/desmarcar favoritos
- [ ] Pode ver histórico de questões respondidas
- [ ] Não tem acesso a estatísticas avançadas
- [ ] Não pode filtrar por área específica (ou limitado)

---

## 3. Modo Premium

### 3.1 Upgrade para Premium
- [ ] Página `/upgrade` acessível
- [ ] Exibe plano: R$ 39,90/mês
- [ ] Botão "Assinar Agora" funciona
- [ ] Redireciona para checkout do Mercado Pago
- [ ] Checkout carrega corretamente
- [ ] Dados do plano corretos (valor, recorrência)

### 3.2 Pagamento e Ativação
- [ ] Conclusão do pagamento no Mercado Pago
- [ ] Webhook recebe notificação
- [ ] Backend busca usuário por email no Firestore
- [ ] Atualiza `isPremium: true`
- [ ] Atualiza `plan: 'premium'`
- [ ] Atualiza `subscription` com dados do Mercado Pago
- [ ] Usuário tem acesso imediato ao Premium
- [ ] Redireciona para `/payment/success`

### 3.3 Funcionalidades Premium
- [ ] Quizzes ilimitados (sem limite de 3/dia)
- [ ] Contador de tentativas não aparece/desabilitado
- [ ] Acesso a todas as áreas de questões
- [ ] Filtros avançados funcionam
- [ ] Estatísticas detalhadas disponíveis
- [ ] Gráficos de desempenho visíveis
- [ ] Badge/indicador de usuário Premium visível

### 3.4 Cancelamento de Assinatura
- [ ] Usuário pode cancelar no Mercado Pago
- [ ] Webhook recebe notificação de cancelamento
- [ ] Backend atualiza `isPremium: false`
- [ ] Backend atualiza `plan: 'free'`
- [ ] Usuário volta ao modo gratuito
- [ ] Limite de 3 tentativas/dia retorna

---

## 4. Navegação e Links

### 4.1 Menu Principal
- [ ] Logo clicável (vai para home)
- [ ] Links do menu funcionam
- [ ] Menu responsivo (mobile hamburger)
- [ ] Itens autenticados aparecem apenas se logado
- [ ] Link "Upgrade" visível para usuários gratuitos
- [ ] Link "Upgrade" oculto para usuários Premium

### 4.2 Páginas Principais
- [ ] `/` - Home carrega corretamente
- [ ] `/login` - Página de login funciona
- [ ] `/register` - Página de cadastro funciona
- [ ] `/dashboard` - Dashboard do usuário (protegido)
- [ ] `/quiz` - Página de quiz (protegido)
- [ ] `/area` - Seleção de áreas (protegido)
- [ ] `/progress` - Progresso do usuário (protegido)
- [ ] `/favorites` - Questões favoritas (protegido)
- [ ] `/upgrade` - Página de upgrade (protegido)
- [ ] `/help` - Página de ajuda
- [ ] `/privacy` - Política de privacidade
- [ ] `/terms` - Termos de uso

### 4.3 Links Externos
- [ ] Link para Mercado Pago funciona
- [ ] Abre em nova aba (_blank)
- [ ] Links de redes sociais (se houver)

---

## 5. Componentes

### 5.1 Header/Navbar
- [ ] Logo exibe corretamente
- [ ] Nome do usuário aparece quando logado
- [ ] Avatar/foto de perfil (se houver)
- [ ] Botão de logout funcional
- [ ] Menu mobile funciona em telas pequenas
- [ ] Indicador de usuário Premium (se aplicável)

### 5.2 Botões
- [ ] Botões mudam de estado (hover, active)
- [ ] Botões desabilitados têm visual diferente
- [ ] Loading states funcionam (spinners)
- [ ] Botão "Fazer Quiz" funciona
- [ ] Botão "Assinar Premium" funciona
- [ ] Botão "Favoritar" funciona
- [ ] Botão "Próxima Questão" funciona
- [ ] Botão "Finalizar Quiz" funciona

### 5.3 Cards e Listas
- [ ] Cards de questões exibem corretamente
- [ ] Lista de áreas carrega e exibe
- [ ] Cards clicáveis respondem ao click
- [ ] Imagens nos cards carregam
- [ ] Ícones exibem corretamente

### 5.4 Formulários
- [ ] Inputs aceitam texto
- [ ] Validações em tempo real funcionam
- [ ] Mensagens de erro aparecem
- [ ] Submit funciona corretamente
- [ ] Clear/reset de formulário funciona

### 5.5 Modais e Popups
- [ ] Modal de confirmação abre/fecha
- [ ] Overlay bloqueia interação com fundo
- [ ] Botão fechar (X) funciona
- [ ] ESC fecha modal (se aplicável)
- [ ] Modais são acessíveis (ARIA)

---

## 6. Quiz e Questões

### 6.1 Iniciar Quiz
- [ ] Seleção de área funciona
- [ ] Quantidade de questões configurável
- [ ] Dificuldade selecionável (se houver)
- [ ] Botão "Iniciar" carrega questões
- [ ] Loading enquanto carrega
- [ ] Questões carregam do JSON ou Firestore

### 6.2 Durante o Quiz
- [ ] Questão exibe corretamente
- [ ] Alternativas (A, B, C, D) aparecem
- [ ] Seleção de alternativa funciona
- [ ] Visual de alternativa selecionada
- [ ] Botão "Confirmar" ou "Próxima"
- [ ] Feedback imediato (certo/errado)
- [ ] Cor verde para correta
- [ ] Cor vermelha para incorreta
- [ ] Explicação da resposta aparece
- [ ] Contador de questões (1/10, 2/10...)
- [ ] Barra de progresso visual

### 6.3 Finalizar Quiz
- [ ] Botão "Finalizar" aparece na última questão
- [ ] Tela de resultados exibe:
  - [ ] Pontuação total
  - [ ] Percentual de acertos
  - [ ] Número de acertos/erros
  - [ ] Tempo gasto (se houver)
- [ ] Botão "Fazer Outro Quiz"
- [ ] Botão "Ver Estatísticas"
- [ ] Resultados salvam no Firestore
- [ ] Atualiza `stats.questionsAnswered`
- [ ] Atualiza `stats.correctAnswers`

### 6.4 Questões
- [ ] Texto da questão legível
- [ ] Formatação correta (negrito, itálico)
- [ ] Imagens carregam (se houver)
- [ ] Código formata corretamente (se questões técnicas)
- [ ] Alternativas embaralhadas (se configurado)
- [ ] Questões não se repetem no mesmo quiz

---

## 7. Integrações

### 7.1 Firebase Authentication
- [ ] Cadastro cria usuário
- [ ] Login autentica corretamente
- [ ] Logout funciona
- [ ] Sessão persiste entre refreshes
- [ ] Recuperação de senha funciona (se implementado)
- [ ] Erros do Firebase são tratados

### 7.2 Firestore Database
- [ ] Leitura de dados do usuário funciona
- [ ] Escrita de novos dados funciona
- [ ] Atualização de dados funciona
- [ ] Queries por email funcionam
- [ ] Security rules permitem operações corretas
- [ ] Security rules bloqueiam operações não autorizadas
- [ ] Dados em tempo real (se usar subscriptions)

### 7.3 Firebase Admin SDK (Backend)
- [ ] Inicialização com credenciais funciona
- [ ] Queries do backend ao Firestore funcionam
- [ ] Atualizações via backend funcionam
- [ ] Logs mostram operações corretas
- [ ] Erros são tratados adequadamente

### 7.4 Mercado Pago
- [ ] Checkout carrega corretamente
- [ ] Pagamento processa
- [ ] Webhook recebe notificações
- [ ] Backend atualiza usuário após pagamento
- [ ] Notificação de teste funciona
- [ ] Logs mostram dados da notificação
- [ ] Erros de pagamento são tratados

### 7.5 Backend API (Render)
- [ ] API responde em https://api.sowlfy.com.br
- [ ] CORS configurado corretamente
- [ ] Endpoints funcionam:
  - [ ] POST `/api/payments/webhook`
  - [ ] POST `/api/payments/test-premium`
- [ ] Logs acessíveis no Render
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS funciona

---

## 8. Responsividade

### 8.1 Mobile (< 768px)
- [ ] Layout se adapta a tela pequena
- [ ] Menu hamburger funciona
- [ ] Botões são clicáveis (tamanho adequado)
- [ ] Textos legíveis (não muito pequenos)
- [ ] Cards empilham verticalmente
- [ ] Formulários usáveis
- [ ] Quiz jogável no mobile

### 8.2 Tablet (768px - 1024px)
- [ ] Layout intermediário funciona
- [ ] Elementos não ficam espremidos
- [ ] Navegação clara
- [ ] Quiz confortável de usar

### 8.3 Desktop (> 1024px)
- [ ] Layout utiliza espaço disponível
- [ ] Elementos bem distribuídos
- [ ] Não há elementos muito esticados
- [ ] Imagens em boa resolução

### 8.4 Orientação
- [ ] Funciona em portrait (vertical)
- [ ] Funciona em landscape (horizontal)
- [ ] Mensagem se necessário mudar orientação

---

## 9. Performance

### 9.1 Carregamento
- [ ] Página inicial carrega em < 3s
- [ ] Assets otimizados (imagens comprimidas)
- [ ] Lazy loading de componentes (se aplicável)
- [ ] Bundle size aceitável
- [ ] Lighthouse score > 80

### 9.2 Operações
- [ ] Login responde rapidamente
- [ ] Questões carregam sem delay perceptível
- [ ] Transições suaves
- [ ] Sem travamentos ou freezes
- [ ] Scroll suave

### 9.3 Banco de Dados
- [ ] Queries otimizadas
- [ ] Índices criados no Firestore
- [ ] Pagination implementada (se muitos dados)
- [ ] Cache local funciona (se implementado)

---

## 10. Segurança

### 10.1 Autenticação
- [ ] Senhas não aparecem em logs
- [ ] Tokens JWT válidos
- [ ] Sessão expira adequadamente
- [ ] Não há rotas desprotegidas

### 10.2 Firestore Rules
- [ ] Usuário só lê/escreve seus próprios dados
- [ ] Dados sensíveis protegidos
- [ ] Regras testadas no simulador Firebase

### 10.3 Backend
- [ ] Variáveis de ambiente não vazam
- [ ] Credenciais não no código
- [ ] Validação de inputs
- [ ] Rate limiting (se implementado)

---

## 11. Bugs Conhecidos e Edge Cases

### 11.1 Testar Cenários Extremos
- [ ] Usuário faz quiz exatamente à meia-noite
- [ ] Dois pagamentos simultâneos para mesmo usuário
- [ ] Email com caracteres especiais
- [ ] Nome muito longo
- [ ] Respostas muito rápidas (< 1s por questão)
- [ ] Fechar browser durante quiz
- [ ] Perder conexão durante quiz
- [ ] Quiz com 0 questões disponíveis

### 11.2 Testes de Regressão
- [ ] Funcionalidades antigas ainda funcionam após novos deploys
- [ ] Dados antigos compatíveis com novo código
- [ ] Migrações de dados (se houver)

---

## 12. UX/UI

### 12.1 Usabilidade
- [ ] Fluxo intuitivo
- [ ] Botões têm labels claros
- [ ] Mensagens de erro úteis
- [ ] Feedback visual em ações
- [ ] Loading states claros
- [ ] Sem textos cortados ou truncados

### 12.2 Acessibilidade
- [ ] Contraste de cores adequado
- [ ] Textos alternativos em imagens
- [ ] Navegação por teclado funciona
- [ ] Screen readers compatíveis (básico)
- [ ] Foco visível em elementos

### 12.3 Erros e Mensagens
- [ ] Mensagens de erro em português claro
- [ ] Mensagens de sucesso aparecem
- [ ] Toasts/notifications funcionam
- [ ] Erros não quebram a aplicação

---

## 📝 Notas

### Prioridades:
1. **CRÍTICO**: Autenticação, limites gratuitos, pagamento Premium
2. **ALTO**: Quiz completo, navegação, integrações
3. **MÉDIO**: Responsividade, performance
4. **BAIXO**: UX avançado, edge cases raros

### Como Usar Este Checklist:
1. Marque `[x]` nos itens testados e aprovados
2. Adicione comentários se encontrar bugs: `- [ ] Item X - BUG: descrição do problema`
3. Priorize testar fluxos críticos primeiro
4. Teste em diferentes navegadores (Chrome, Firefox, Safari, Edge)
5. Teste em dispositivo mobile real, não só DevTools

### Ferramentas Recomendadas:
- **Lighthouse** (Chrome DevTools) - Performance e acessibilidade
- **Firebase Console** - Verificar dados em tempo real
- **Render Logs** - Monitorar backend
- **Mercado Pago Dashboard** - Verificar webhooks

---

**Data de Criação**: 13/12/2025
**Última Atualização**: 13/12/2025
**Status**: Checklist inicial criado ✅
