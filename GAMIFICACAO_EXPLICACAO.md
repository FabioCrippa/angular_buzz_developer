# 🎮 SISTEMA DE GAMIFICAÇÃO - COMO FUNCIONA

## 📊 Visão Geral

O sistema de gamificação motiva o usuário a estudar mais através de **XP (Experiência)**, **Levels (Níveis)** e **Streak (Sequência de Dias)**.

---

## 🎯 Componentes Principais

### **1. XP (Experiência)**
Pontos ganhos ao completar quizzes e acertar questões.

### **2. Level (Nível)**
Calculado automaticamente baseado no XP total acumulado.

### **3. Streak (Sequência)**
Contador de dias consecutivos estudando.

---

## 💰 Como Ganhar XP

### **XP Base:**
| Ação | XP Ganho |
|------|----------|
| Completar um quiz | **+50 XP** |
| Cada resposta correta | **+5 XP** |

### **Bônus de Performance:**
| Condição | Bônus |
|----------|-------|
| **Score Perfeito** (100% de acerto) | **+100 XP** 🌟 |

### **Bônus de Streak:**
| Dias Consecutivos | Bônus |
|-------------------|-------|
| 3 dias | **+20 XP** 🔥 |
| 7 dias | **+50 XP** 🔥🔥 |
| 30 dias | **+200 XP** 🔥🔥🔥 |

---

## 📈 Sistema de Levels

### **Tabela de XP por Level:**

| Level | XP Necessário | Nome do Level |
|-------|---------------|---------------|
| 1 | 0 XP | Iniciante |
| 2 | 100 XP | Aprendiz |
| 3 | 250 XP | Estudante |
| 4 | 500 XP | Dedicado |
| 5 | 1.000 XP | Experiente |
| 6 | 2.000 XP | Profissional |
| 7 | 3.500 XP | Expert |
| 8 | 5.500 XP | Mestre |
| 9 | 8.000 XP | Sábio |
| 10 | 11.000 XP | Lendário |
| 11 | 15.000 XP | Mestre Supremo |
| 12 | 20.000 XP | Gênio |
| 13 | 26.000 XP | Prodígio |
| 14 | 33.000 XP | Virtuoso |
| 15 | 41.000 XP | Iluminado |
| 16+ | 50.000 XP | Divino |

**O level é calculado automaticamente!** Quando o XP atinge o valor necessário, o usuário sobe de nível.

---

## 🔥 Sistema de Streak

### **Como Funciona:**

1. **Estudar pela primeira vez:** Streak = 1 dia
2. **Estudar no dia seguinte:** Streak = 2 dias (bônus quando atingir 3, 7, 30)
3. **Pular um dia:** Streak volta para 1

### **Regras:**
- ✅ Estudar hoje: Mantém streak
- ✅ Estudar ontem e hoje: Incrementa streak
- ❌ Não estudar por 1+ dias: Reseta para 1

### **Exemplo Prático:**
```
Segunda: Quiz completado → Streak = 1
Terça: Quiz completado → Streak = 2
Quarta: Quiz completado → Streak = 3 (+20 XP bônus! 🔥)
Quinta: Não estudou → Streak reseta para 1
Sexta: Quiz completado → Streak = 1
```

---

## 🎯 Exemplo Completo de XP

### **Cenário: Quiz de Matemática**
- **Total de questões:** 10
- **Acertos:** 10 (100%)
- **É o 3º dia consecutivo estudando**

**Cálculo:**
```
XP Base do Quiz:              +50 XP
10 respostas corretas (10x5): +50 XP
Bônus de Score Perfeito:      +100 XP
Bônus de 3 dias streak:       +20 XP
─────────────────────────────────────
TOTAL:                        +220 XP 🎉
```

Se tinha 150 XP antes → agora tem **370 XP** (subiu do Level 2 para Level 3!)

---

## 📊 Estrutura no Firestore

```
users/
  └── {userId}/
      └── progress/
          └── stats/
              ├── userId: "..."
              ├── xp: 370
              ├── level: 3
              ├── streak: 3
              ├── lastActivityDate: "2025-12-19"
              ├── totalQuizzes: 15
              ├── totalQuestions: 200
              ├── correctAnswers: 165
              ├── studyTimeMinutes: 85
              ├── createdAt: Timestamp
              └── updatedAt: Timestamp
```

---

## 🔄 Fluxo de Integração no Quiz

### **1. Quando o usuário completa um quiz:**
```typescript
// No método completeQuiz() do quiz.component.ts
const result = await gamificationService.addXPForQuiz(
  userId,
  correctAnswers,  // 10
  totalQuestions,  // 10
  timeSpent        // 180 segundos
);

// result = {
//   xpGained: 220,
//   leveledUp: true,
//   newLevel: 3
// }
```

### **2. Mostrar feedback ao usuário:**
```typescript
if (result.leveledUp) {
  this.showSuccessMessage(`🎉 PARABÉNS! Você subiu para o Level ${result.newLevel}!`);
} else {
  this.showSuccessMessage(`✨ +${result.xpGained} XP ganhos!`);
}
```

---

## 🎨 Interface Visual (Futura)

### **No Perfil/Dashboard:**
```
┌─────────────────────────────────────┐
│  👤 João Silva                      │
│  Level 3 - Estudante                │
│  ███████░░░ 370/500 XP (74%)       │
│  🔥 Streak: 3 dias                  │
│  📊 15 quizzes | 82% de acerto     │
└─────────────────────────────────────┘
```

### **Notificação de Level Up:**
```
┌─────────────────────────────────────┐
│           🎉 LEVEL UP! 🎉          │
│                                     │
│       Level 2 → Level 3            │
│         ESTUDANTE                   │
│                                     │
│    Continue estudando para         │
│    desbloquear novos recursos!     │
└─────────────────────────────────────┘
```

---

## 🎯 Benefícios do Sistema

### **Para o Usuário:**
✅ Motivação para estudar diariamente (streak)  
✅ Sensação de progresso visível (XP/Level)  
✅ Recompensas por dedicação (bônus)  
✅ Competição consigo mesmo (melhorar score)  

### **Para o Produto:**
✅ Aumenta retenção (usuários voltam diariamente)  
✅ Aumenta engajamento (fazer mais quizzes)  
✅ Métricas claras de uso (XP = atividade)  
✅ Gamificação leve, sem "pay-to-win"  

---

## 🔒 Regras do Firebase Necessárias

Adicione no Firestore Rules:

```javascript
// Progresso do usuário
match /users/{userId}/progress/{progressId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 📝 Próximos Passos

1. ✅ Serviço criado
2. ⏳ Integrar no quiz component
3. ⏳ Atualizar perfil para mostrar XP/Level
4. ⏳ Criar dashboard com gráficos
5. ⏳ Adicionar badges/conquistas (futuro)
6. ⏳ Adicionar ranking entre usuários (futuro)

---

**Sistema criado!** Agora vou integrar no quiz component. ✨
