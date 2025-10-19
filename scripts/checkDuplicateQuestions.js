const fs = require('fs');
const path = require('path');

// Altere aqui para o arquivo desejado:
const filePath = path.join(__dirname, '../src/assets/data/areas/portugues/gramatica.json');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo:', err);
    return;
  }
  try {
    const json = JSON.parse(data);
    if (!Array.isArray(json.questions)) {
      console.error('Arquivo não possui array "questions".');
      return;
    }
    const seen = new Map();
    const duplicates = [];
    json.questions.forEach((q, idx) => {
      const text = (q.question || '').trim().toLowerCase();
      if (seen.has(text)) {
        duplicates.push({ index: idx, question: q.question, originalIndex: seen.get(text) });
      } else {
        seen.set(text, idx);
      }
    });
    if (duplicates.length === 0) {
      console.log('Nenhuma pergunta repetida encontrada.');
    } else {
      console.log(`Encontradas ${duplicates.length} perguntas repetidas:`);
      duplicates.forEach(d => {
        console.log(`Pergunta repetida no índice ${d.index} (original no índice ${d.originalIndex}): "${d.question}"`);
      });
    }
  } catch (e) {
    console.error('Erro ao processar o JSON:', e);
  }
});

// node scripts/checkDuplicateQuestions.js