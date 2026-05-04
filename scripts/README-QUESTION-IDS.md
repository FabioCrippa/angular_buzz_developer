# 📚 Sistema de Gerenciamento de IDs de Questões

## 🎯 Visão Geral

Sistema automatizado para gerenciar IDs de questões com prefixo por área, eliminando o risco de duplicatas.

### Estrutura de IDs

```
ANA: ana1001 → ana1999  (Análise e Desenvolvimento de Sistemas)
INF: inf3001 → inf3999  (Informática Geral)
MAT: mat5001 → mat5999  (Matemática)
PORT: port7001 → port7999  (Português)
```

**Vantagens:**
- ✅ Impossível ter duplicatas (ranges separados)
- ✅ Legível (sabe-se qual área pertence o ID)
- ✅ Auto-incrementável
- ✅ Suporta até 999 questões por área
- ✅ Alternativas continuam com IDs simples (1, 2, 3...)

---

## 🔧 Scripts Disponíveis

### 1. **Migrate-QuestionIds.ps1**
Migra todos os IDs atuais para novo formato

**Uso:**
```powershell
# Modo simulação (recomendado primeiro)
.\Migrate-QuestionIds.ps1 -DryRun $true

# Modo real (fazer backup antes!)
.\Migrate-QuestionIds.ps1 -DryRun $false
```

**O que faz:**
- Varre todos os JSONs
- Converte IDs para novo formato
- Gera log detalhado
- Não altera IDs das alternativas

---

### 2. **Add-Question.ps1**
Gera template com próximo ID disponível

**Uso:**
```powershell
# Para JavaScript (Análise)
.\Add-Question.ps1 -Area analise -JsonFile "src/assets/data/areas/analise-desenvolvimento-sistemas/fundamentos-programacao/javascript.json"

# Para Matemática
.\Add-Question.ps1 -Area matematica -JsonFile "src/assets/data/areas/matematica/numeros-operacoes/porcentagem.json"

# Para Português
.\Add-Question.ps1 -Area portugues -JsonFile "src/assets/data/areas/portugues/linguagem-texto/gramatica.json"

# Para Informática
.\Add-Question.ps1 -Area informatica -JsonFile "src/assets/data/areas/informatica-geral/conceitos-basicos/hardware.json"
```

**O que faz:**
1. ✅ Lê o arquivo JSON
2. ✅ Calcula próximo ID disponível
3. ✅ Mostra template formatado para Copilot
4. ✅ Exibe instruções passo-a-passo

**Exemplo de Output:**
```
✅ PRÓXIMO ID DISPONÍVEL: ana1084 (Área: Análise e Desenvolvimento de Sistemas)

📋 TEMPLATE PARA COPILOT:
================================================================================
Gere uma questão para Análise e Desenvolvimento de Sistemas com a estrutura:

{
  "id": "ana1084",
  "question": "[ESCREVA A PERGUNTA AQUI]",
  "options": [
    {
      "id": 1,
      "name": "[OPÇÃO A]",
      "alias": "a"
    },
    ...
  ],
  "correct": "a",
  "category": "[CATEGORIA]",
  "explanation": "[EXPLICAÇÃO]"
}
================================================================================

💡 APÓS GERAR NO COPILOT:
1. Copie apenas o JSON (sem formatação extra)
2. Cole no seu editor no arquivo JSON
3. Salve o arquivo
4. Execute: .\Validate-Questions.ps1
```

---

### 3. **Validate-Questions.ps1**
Valida integridade de todas as questões

**Uso:**
```powershell
# Validação simples
.\Validate-Questions.ps1

# Com detalhes
.\Validate-Questions.ps1 -Verbose $true

# Com correção automática
.\Validate-Questions.ps1 -FixDuplicates $true
```

**Verifica:**
- ✅ IDs duplicados (global)
- ✅ IDs com formato inválido
- ✅ Estrutura JSON (campos obrigatórios)
- ✅ Alternativas válidas
- ✅ Resposta correta definida

**Exemplo de Output:**
```
🔍 Validando questões...
Date: 29/04/2026

✅ javascript.json | 25 questões OK
✅ typescript.json | 25 questões OK
✅ html.json | 25 questões OK
...

📊 RELATÓRIO FINAL:
Arquivos processados: 51
Questões totais: 1200
IDs duplicados: 0
IDs inválidos: 0
Erros de estrutura: 0
Arquivos com erros: 0

✅ Todas as questões estão válidas!
```

---

## 📋 Workflow Completo

### Passo 1: Preparar Nova Questão

```powershell
# Discover próximo ID
.\Add-Question.ps1 -Area analise -JsonFile "src/assets/data/areas/analise-desenvolvimento-sistemas/fundamentos-programacao/javascript.json"
```

### Passo 2: Gerar no Copilot

Mostra o template. Você copia este template exato e cola no Copilot:

```
Gere uma questão sobre JavaScript hooks com este formato JSON exato...
```

### Passo 3: Copiar Response do Copilot

Copilot gera:
```json
{
  "id": "ana1084",
  "question": "O que é um React Hook?",
  "options": [
    {
      "id": 1,
      "name": "Uma função que permite usar state em componentes funcionais",
      "alias": "a"
    },
    ...
  ],
  "correct": "a",
  "category": "javascript",
  "explanation": "React Hooks são funções especiais que permitem usar features do React..."
}
```

### Passo 4: Colar no Arquivo

1. Abra `src/assets/data/areas/.../javascript.json`
2. No final do array `questions`, cole o JSON
3. Adicione vírgula se necessário
4. Salve

### Passo 5: Validar

```powershell
# Valida integridade
.\Validate-Questions.ps1

# Se tudo OK:
✅ Todas as questões estão válidas!
```

### Passo 6: Commit

```powershell
git add src/assets/data/areas/
git commit -m "Add 3 new questions for JavaScript topic"
```

---

## 🚀 Primeira Execução (Migração)

**⚠️ IMPORTANTE: Faça backup antes!**

```powershell
# 1. Teste modo simulação
cd c:\Users\cripp\projects(workspace)\angular_buzz_developer\scripts
.\Migrate-QuestionIds.ps1 -DryRun $true

# 2. Se tudo certo, execute migração
.\Migrate-QuestionIds.ps1 -DryRun $false

# 3. Valide resultado
.\Validate-Questions.ps1 -Verbose $true
```

---

## 📊 Estrutura Esperada do JSON

```json
{
  "metadata": {
    "area": "desenvolvimento-web",
    "subject": "javascript",
    "name": "JavaScript ES6+",
    "description": "...",
    "difficulty": "intermediate",
    "lastUpdated": "2025-10-21",
    "questionCount": 26,
    "tags": ["javascript", "es6"]
  },
  "questions": [
    {
      "id": "ana1084",                    ← ID PREFIXADO
      "question": "O que é JavaScript?",
      "options": [
        {
          "id": 1,                       ← ALTERNATIVAS: números simples
          "name": "Uma linguagem de programação",
          "alias": "a"
        },
        {
          "id": 2,
          "name": "Um framework",
          "alias": "b"
        }
      ],
      "correct": "a",
      "category": "javascript",
      "explanation": "JavaScript é uma linguagem de programação..."
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Erro: "ID inválido"
**Causa:** ID não segue padrão (deveria ser ana/inf/mat/port + 4 dígitos)
**Solução:** Use `Validate-Questions.ps1` para identificar e use `Migrate-QuestionIds.ps1`

### Erro: "ID duplicado"
**Causa:** Mesmo ID em dois arquivos
**Solução:** 
```powershell
.\Validate-Questions.ps1 -Verbose $true
# Identifica qual arquivo, corija manualmente ou use script de correção
```

### "Arquivo não encontrado"
**Causa:** Caminho incorreto
**Solução:** Use caminhos relativos partindo de `/src/assets/data/areas/`

---

## 📝 Logs

Todos os scripts geram logs em:
```
scripts/migration-log-YYYY-MM-DD-HHMMSS.txt
scripts/validation-log-YYYY-MM-DD-HHMMSS.txt
```

Verifique logs se algo der errado.

---

## ✅ Checklist

Antes de fazer push:

- [ ] Executou `Add-Question.ps1` para gerar template
- [ ] Gerou questão no Copilot com template
- [ ] Colou JSON no arquivo correto
- [ ] Executou `Validate-Questions.ps1` e passou
- [ ] Build Angular compilou sem erros
- [ ] Testou no navegador (se possível)
- [ ] Commit message descritivo

---

## 🔗 Próximos Passos

1. ✅ Migrar todos os IDs atuais
2. ✅ Usar `Add-Question.ps1` para próximas adições
3. ⏳ Integrar validação no pre-commit hook do Git
4. ⏳ Dashboard para visualizar distribuição de questões

---

**Última atualização:** 29/04/2026  
**Versão:** 1.0
