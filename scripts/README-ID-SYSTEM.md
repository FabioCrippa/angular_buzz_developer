# Sistema de IDs com Prefixo de Arquivo (Ana-xyz1001)

## 📋 Referência Rápida

Novo formato: **`[prefixo-curso]-[prefixo-arquivo][numero]`**

Exemplo: `ana-jav1001` = **Análise** > **JavaScript** > questão 1001

---

## 📊 Mapeamento Completo

### ANÁLISE E DESENVOLVIMENTO (ana-)

| Arquivo | Prefixo | Range | Qtd |
|---------|---------|-------|-----|
| angular.json | `ana-ang` | 1001-1024 | 24 |
| css.json | `ana-css` | 1001-1035 | 35 |
| debugging-frontend.json | `ana-deb` | 1001-1025 | 25 |
| html.json | `ana-htm` | 1001-1025 | 25 |
| react.json | `ana-rea` | 1001-1040 | 40 |
| responsividade.json | `ana-res` | 1001-1030 | 30 |
| figma.json | `ana-fig` | 1001-1025 | 25 |
| micro-front-end.json | `ana-mic` | 1001-1025 | 25 |
| boas-praticas.json | `ana-boa` | 1001-1025 | 25 |
| javascript.json | `ana-jav` | 1001-1025 | 25 |
| typescript.json | `ana-typ` | 1001-1025 | 25 |
| ci-cd.json | `ana-cic` | 1001-1025 | 25 |
| code-review.json | `ana-cod` | 1001-1025 | 25 |
| devops.json | `ana-dev` | 1001-1025 | 25 |
| scrum.json | `ana-scr` | 1001-1025 | 25 |
| testes-unitarios.json | `ana-tes` | 1001-1025 | 25 |
| versionamento.json | `ana-ver` | 1001-1025 | 25 |
| entrevista-tecnica.json | `ana-ent` | 1001-1080 | 80 |
| autenticacao.json | `ana-aut` | 1001-1020 | 20 |
| criptografia.json | `ana-cri` | 1001-1023 | 23 |
| **Total** | | | **479** |

### INFORMÁTICA GERAL (inf-)

| Arquivo | Prefixo | Range | Qtd |
|---------|---------|-------|-----|
| hardware.json | `inf-har` | 1001-1025 | 25 |
| internet.json | `inf-int` | 1001-1020 | 20 |
| sistemasOperacionais.json | `inf-sis` | 1001-1021 | 21 |
| editorTexto.json | `inf-edi` | 1001-1020 | 20 |
| planilhas.json | `inf-pla` | 1001-1020 | 20 |
| redes.json | `inf-red` | 1001-1030 | 30 |
| **Total** | | | **136** |

### MATEMÁTICA (mat-)

| Arquivo | Prefixo | Range | Qtd |
|---------|---------|-------|-----|
| raciocinio-logico.json | `mat-rac` | 1001-1005 | 5 |
| algebra.json | `mat-alg` | 1001-1005 | 5 |
| equacoes.json | `mat-equ` | 1001-1050 | 50 |
| geometria.json | `mat-geo` | 1001-1005 | 5 |
| porcentagem.json | `mat-por` | 1001-1050 | 50 |
| proporcao.json | `mat-pro` | 1001-1020 | 20 |
| razao.json | `mat-raz` | 1001-1030 | 30 |
| regraTres.json | `mat-reg` | 1001-1030 | 30 |
| **Total** | | | **230** |

### PORTUGUÊS (port-)

| Arquivo | Prefixo | Range | Qtd |
|---------|---------|-------|-----|
| gramatica.json | `port-gra` | 1001-1135 | 135 |
| ortografia.json | `port-ort` | 1001-1050 | 50 |
| semantica.json | `port-sem` | 1001-1023 | 23 |
| coerencia.json | `port-coe` | 1001-1040 | 40 |
| coesao.json | `port-ces` | 1001-1050 | 50 |
| interpretacao.json | `port-int` | 1001-1050 | 50 |
| redacao.json | `port-red` | 1001-1045 | 45 |
| **Total** | | | **456** |

---

## 🚀 Como Adicionar Novas Questões (SEM SCRIPT!)

### Passo 1: Abrir o arquivo
```json
// javascript.json
{
  "metadata": { ... },
  "questions": [
    { "id": "ana-jav1001", ... },
    { "id": "ana-jav1002", ... },
    // ...
    { "id": "ana-jav1025", ... }  ← Última questão
  ]
}
```

### Passo 2: Copiar template da IA
```json
{
  "id": "ana-jav1026",  ← Próximo ID = último + 1
  "question": "SUA_PERGUNTA_AQUI",
  "options": [
    { "id": "a", "name": "Opção A" },
    { "id": "b", "name": "Opção B" },
    { "id": "c", "name": "Opção C" },
    { "id": "d", "name": "Opção D" },
    { "id": "e", "name": "Opção E" }
  ],
  "correct": "a",
  "category": "CATEGORIA",
  "explanation": "EXPLICAÇÃO"
}
```

### Passo 3: Adicionar ao array `questions`
```json
"questions": [
  // ... questões existentes ...
  { "id": "ana-jav1025", ... },
  { "id": "ana-jav1026", ... }  ← Nova questão
]
```

---

## ✅ Garantias do Sistema

| Garantia | Motivo | Risco |
|----------|--------|-------|
| **Sem duplicação** | Cada arquivo tem namespace próprio | ❌ Zero |
| **Sem scripts necessários** | Incremente manualmente (1001→1002) | ❌ Zero |
| **Rastreabilidade** | ID mostra arquivo: `ana-jav1001` | ❌ Perfeita |
| **Escalabilidade** | Novos arquivos = novo prefixo | ❌ Infinita |

---

## 🔍 Exemplo Real: Adicionando em react.json

**Situação Atual:**
```json
"questions": [
  { "id": "ana-rea1001", ... },  // React - React.StrictMode
  { "id": "ana-rea1002", ... },  // React - Hooks
  // ... 38 mais ...
  { "id": "ana-rea1040", ... }   // React - Refs
]
```

**Nova Questão:**
- Último ID em react.json: `ana-rea1040`
- Próximo ID: `ana-rea1041`
- Copiar template com `ana-rea1041`, preencher dados, adicionar ao array

**Resultado:**
```json
"questions": [
  // ... 1 a 1040 ...
  { "id": "ana-rea1040", "question": "...", ... },
  { "id": "ana-rea1041", "question": "Sua nova pergunta", ... }
]
```

**Garantia:** `ana-rea1041` **NUNCA** pode existir em outro arquivo (angular.json, css.json, etc)

---

## 📝 Status Geral

- **Total de Questões Migradas:** 1.301
- **Total de Arquivos:** 41
- **Formato Anterior:** `ana1001`, `inf3001`, `mat5001`, `port7001`
- **Formato Novo:** `ana-ang1001`, `inf-har1001`, `mat-equ1001`, `port-gra1001`
- **Data da Migração:** 29/04/2026
- **Status:** ✅ Produção

---

## 🛠️ Scripts Disponíveis

### 1. Migration-ToFilePrefix.ps1
Fez a migração de `ana1001` → `ana-ang1001` (já executado, não precisa mais)

```powershell
.\Migration-ToFilePrefix.ps1 -Execute $true
```

### 2. Validate-Questions.ps1
Valida integridade de IDs e estrutura

```powershell
.\Validate-Questions.ps1 -Verbose $true
```

---

## ⚠️ Importante

**NÃO use mais scripts para adicionar IDs!** 

Basta:
1. Achar o último ID do arquivo
2. Incrementar o número (1040 → 1041)
3. Copiar template com novo ID

Exemplo: Se `react.json` termina em `ana-rea1040`, próximo é `ana-rea1041`. ✅

