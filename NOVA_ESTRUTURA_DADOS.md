# 📚 Nova Estrutura Hierárquica de Dados - SOWLFY v3.0

## 📋 Sumário

A plataforma SOWLFY foi reorganizada de uma estrutura **plana** para uma estrutura **hierárquica** modelada após a realidade de um curso universitário, com:
- **4 Cursos** principais
- **12 Disciplinas** subdivididas
- **51 Tópicos** (arquivos JSON) cada um com múltiplas questões

---

## 🏗️ Estrutura Hierárquica

```
📦 Análise e Desenvolvimento de Sistemas (600 questões)
 ├─ 📖 Fundamentos de Programação
 │  ├─ JavaScript
 │  ├─ TypeScript
 │  └─ Boas Práticas
 ├─ 🎨 Desenvolvimento Web Frontend
 │  ├─ HTML
 │  ├─ CSS
 │  ├─ Responsividade
 │  ├─ Angular
 │  ├─ React
 │  └─ Frontend Geral
 ├─ 🎭 Design e Interface
 │  ├─ Figma
 │  └─ Micro Frontend
 ├─ ⚙️  Metodologias e DevOps
 │  ├─ Scrum
 │  ├─ CI/CD
 │  ├─ DevOps
 │  ├─ Versionamento
 │  ├─ Code Review
 │  └─ Testes Unitários
 ├─ 🔒 Segurança em Desenvolvimento
 │  ├─ Criptografia
 │  └─ Autenticação
 └─ 💼 Preparação para Entrevista
    └─ Entrevista Técnica

📦 Informática Geral (75 questões)
 ├─ 🔧 Conceitos Básicos
 │  ├─ Hardware
 │  ├─ Sistemas Operacionais
 │  └─ Internet
 └─ 📊 Ferramentas Office
    ├─ Editor de Texto
    ├─ Planilhas
    └─ Redes

📦 Matemática (80 questões)
 ├─ ➕ Números e Operações
 │  ├─ Porcentagem
 │  ├─ Razão
 │  ├─ Proporção
 │  └─ Regra de Três
 ├─ 📐 Álgebra
 │  ├─ Álgebra
 │  └─ Equações
 └─ ▲ Geometria
    └─ Geometria

📦 Português (140 questões)
 ├─ ✍️ Linguagem e Texto
 │  ├─ Gramática
 │  ├─ Ortografia
 │  └─ Semântica
 └─ 📖 Produção e Compreensão
    ├─ Interpretação
    ├─ Redação
    ├─ Coerência
    └─ Coesão
```

---

## 💾 Localização dos Arquivos

### Estrutura no Sistema de Arquivos

```
src/assets/data/
├─ index.json (novo - índice hierárquico)
├─ index-backup-antigo.json (backup)
└─ areas/
   ├─ analise-desenvolvimento-sistemas/
   │  ├─ fundamentos-programacao/
   │  │  ├─ javascript.json
   │  │  ├─ typescript.json
   │  │  └─ boas-praticas.json
   │  ├─ desenvolvimento-web-frontend/
   │  │  ├─ html.json
   │  │  ├─ css.json
   │  │  ├─ responsividade.json
   │  │  ├─ angular.json
   │  │  ├─ react.json
   │  │  └─ front-end.json
   │  ├─ design-interface/
   │  │  ├─ figma.json
   │  │  └─ micro-front-end.json
   │  ├─ metodologias-devops/
   │  │  ├─ scrum.json
   │  │  ├─ ci-cd.json
   │  │  ├─ devops.json
   │  │  ├─ versionamento.json
   │  │  ├─ code-review.json
   │  │  └─ testes-unitarios.json
   │  ├─ seguranca-desenvolvimento/
   │  │  ├─ criptografia.json
   │  │  └─ autenticacao.json
   │  └─ prep-entrevista/
   │     └─ entrevista-tecnica.json
   ├─ informatica-geral/
   │  ├─ conceitos-basicos/
   │  │  ├─ hardware.json
   │  │  ├─ sistemasOperacionais.json
   │  │  └─ internet.json
   │  └─ ferramentas-office/
   │     ├─ editorTexto.json
   │     ├─ planilhas.json
   │     └─ redes.json
   ├─ matematica/
   │  ├─ numeros-operacoes/
   │  │  ├─ porcentagem.json
   │  │  ├─ razao.json
   │  │  ├─ proporcao.json
   │  │  └─ regraTres.json
   │  ├─ algebra/
   │  │  ├─ algebra.json
   │  │  └─ equacoes.json
   │  └─ geometria/
   │     └─ geometria.json
   └─ portugues/
      ├─ linguagem-texto/
      │  ├─ gramatica.json
      │  ├─ ortografia.json
      │  └─ semantica.json
      └─ producao-compreensao/
         ├─ interpretacao.json
         ├─ redacao.json
         ├─ coerencia.json
         └─ coesao.json
```

---

## 🔌 Uso na Aplicação Angular

### 1️⃣ Carregar Cursos Disponíveis

```typescript
import { QuizService } from '@app/core/services/quiz.service';

constructor(private quizService: QuizService) {}

carregarCursos() {
  this.quizService.getCursos().subscribe(data => {
    console.log(data.cursos);
    // Renderizar lista de cursos
  });
}
```

### 2️⃣ Obter Disciplinas de um Curso

```typescript
obterDisciplinas(cursoId: string) {
  this.quizService.getDisciplinas(cursoId).subscribe(disciplinas => {
    console.log(disciplinas);
    // Renderizar disciplinas para este curso
  });
}
```

### 3️⃣ Carregar Questões de um Tópico

```typescript
carregarQuestoes(curso: string, disciplina: string, topico: string) {
  this.quizService.getQuestionsByTopic(curso, disciplina, topico)
    .subscribe(questoes => {
      console.log(questoes);
      // Iniciar quiz com estas questões
    });
}
```

### 4️⃣ Exemplos Práticos

```typescript
// Obter questões de JavaScript
this.quizService.getQuestionsByTopic(
  'analise-desenvolvimento-sistemas',
  'fundamentos-programacao',
  'javascript'
).subscribe(questions => {
  // Carregar quiz de JavaScript
});

// Obter questões de Álgebra
this.quizService.getQuestionsByTopic(
  'matematica',
  'algebra',
  'algebra'
).subscribe(questions => {
  // Carregar quiz de Álgebra
});
```

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Total de Cursos | 4 |
| Total de Disciplinas | 12 |
| Total de Tópicos | 51 |
| Total de Questões | 895 |
| Análise e Desenvolvimento | 600 |
| Informática Geral | 75 |
| Matemática | 80 |
| Português | 140 |

---

## 🔄 Retrocompatibilidade

A função `getQuestionsByArea()` ainda está disponível para manter compatibilidade com código legado, mas a estrutura foi reorganizada internamente.

### Antes (Estrutura Plana)
```
areas/
├─ javascript.json
├─ typescript.json
├─ html.json
├─ css.json
└─ ... (51 arquivos no mesmo nível)
```

### Depois (Estrutura Hierárquica)
```
areas/
├─ analise-desenvolvimento-sistemas/
│  ├─ fundamentos-programacao/
│  │  ├─ javascript.json
│  │  ├─ typescript.json
│  │  └─ ...
│  └─ ...
├─ informatica-geral/
└─ ...
```

---

## 📝 Index.json - Referência Completa

O arquivo `src/assets/data/index.json` contém:

```json
{
  "appInfo": {
    "name": "SOWLFY",
    "version": "3.0.0",
    "description": "Plataforma completa de preparação profissional"
  },
  "cursos": [
    {
      "id": "analise-desenvolvimento-sistemas",
      "nome": "Análise e Desenvolvimento de Sistemas",
      "icon": "💻",
      "cor": "#007bff",
      "totalQuestoes": 600,
      "disciplinas": [
        {
          "id": "fundamentos-programacao",
          "nome": "Fundamentos de Programação",
          "topicos": [
            {
              "id": "javascript",
              "nome": "JavaScript",
              "arquivo": "javascript.json"
            },
            // ... mais tópicos
          ]
        },
        // ... mais disciplinas
      ]
    },
    // ... mais cursos
  ],
  "stats": { /* estatísticas */ }
}
```

---

## ✨ Benefícios da Nova Estrutura

✅ **Organização Intuitiva**: Estrutura reflete a realidade de um curso universitário  
✅ **Fácil Expansão**: Adicione disciplinas facilmente conforme aprende novas matérias  
✅ **Melhor UX**: UI pode mostrar estrutura hierárquica clara (Curso → Disciplina → Tópico)  
✅ **Escalabilidade**: Suporta crescimento sem reorganização futura  
✅ **Manutenibilidade**: Código mais limpo e fácil de debugar  
✅ **Retrospectiva**: Pode acompanhar seu progresso por disciplina  

---

## 🚀 Próximos Passos

1. ✅ Estrutura de arquivos criada e deploy em produção
2. ⏳ Atualizar componentes de UI para exibir nova hierarquia
3. ⏳ Adicionar novos cursos/disciplinas conforme necessário
4. ⏳ Implementar filtros por disciplina na interface

---

**Última Atualização**: 29 de Abril de 2026  
**Versão**: 3.0.0  
**Status**: ✅ Ativo em Produção
