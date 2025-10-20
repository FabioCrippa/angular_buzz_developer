const fs = require('fs');
const path = require('path');

const areasDir = path.join(__dirname, '../src/assets/data/areas');

// Estrutura padrão de uma questão
const requiredFields = [
  'id', 'question', 'options', 'correct', 'explanation'
];

// Função para validar e corrigir uma questão
function sanitizeQuestion(q, idx, usedIds, usedQuestions) {
  let valid = true;
  let issues = [];

  // Corrige campos ausentes
  requiredFields.forEach(field => {
    if (!(field in q)) {
      valid = false;
      issues.push(`Faltando campo: ${field}`);
      // Corrige com valor padrão
      if (field === 'options') q.options = [];
      else if (field === 'id') q.id = 100000 + idx;
      else q[field] = '';
    }
  });

  // Corrige id duplicado
  if (usedIds.has(q.id)) {
    valid = false;
    issues.push('ID duplicado');
    q.id = 100000 + idx;
  }
  usedIds.add(q.id);

  // Corrige pergunta duplicada
  const questionText = (q.question || '').trim().toLowerCase();
  if (usedQuestions.has(questionText)) {
    valid = false;
    issues.push('Pergunta duplicada');
    // Adiciona sufixo para diferenciar
    q.question += ' (DUPLICADA)';
  }
  usedQuestions.add(questionText);

  // Corrige options para garantir estrutura
  if (!Array.isArray(q.options)) q.options = [];
  q.options = q.options.map((opt, i) => ({
    id: opt.id ?? i + 1,
    name: opt.name ?? '',
    alias: opt.alias ?? String.fromCharCode(65 + i)
  }));

  return { question: q, valid, issues };
}

// Processa todos os arquivos JSON da pasta areas
fs.readdir(areasDir, (err, files) => {
  if (err) {
    console.error('Erro ao ler pasta:', err);
    return;
  }

  files.filter(f => f.endsWith('.json')).forEach(file => {
    const filePath = path.join(areasDir, file);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Erro ao ler ${file}:`, err);
        return;
      }
      let json;
      try {
        json = JSON.parse(data);
      } catch (e) {
        console.error(`Arquivo inválido: ${file}`);
        return;
      }

      // ADICIONE ESTE LOG:
      console.log(`Processando arquivo: ${file}`);

      // Detecta se é array ou objeto com array
      let questions = Array.isArray(json) ? json : json.questions;
      if (!Array.isArray(questions)) {
        console.error(`Estrutura inválida em ${file}: não há array de questões`);
        return;
      }

      const usedIds = new Set();
      const usedQuestions = new Set();
      const sanitized = [];
      const report = [];

      questions.forEach((q, idx) => {
        const { question, valid, issues } = sanitizeQuestion(q, idx, usedIds, usedQuestions);
        sanitized.push(question);
        if (!valid) {
          report.push({ idx, issues, question: question.question });
        }
      });

      // Salva arquivo corrigido
      if (Array.isArray(json)) {
        fs.writeFile(filePath, JSON.stringify(sanitized, null, 2), err => {
          if (err) console.error(`Erro ao salvar ${file}:`, err);
        });
      } else {
        json.questions = sanitized;
        fs.writeFile(filePath, JSON.stringify(json, null, 2), err => {
          if (err) console.error(`Erro ao salvar ${file}:`, err);
        });
      }

      // Relatório
      if (report.length > 0) {
        console.log(`Arquivo ${file} corrigido. Problemas encontrados:`);
        report.forEach(r => {
          console.log(`  Questão ${r.idx}: ${r.issues.join(', ')}`);
        });
      } else {
        console.log(`Arquivo ${file}: OK`);
      }
    });
  });
});