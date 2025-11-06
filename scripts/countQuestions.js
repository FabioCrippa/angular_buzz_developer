const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/assets/data/areas/portugues/gramatica.json');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo:', err);
    return;
  }
  try {
    const json = JSON.parse(data);
    const count = Array.isArray(json.questions) ? json.questions.length : 0;
    console.log(`Quantidade de perguntas: ${count}`);
  } catch (e) {
    console.error('Erro ao processar o JSON:', e);
  }
});

// node scripts/countQuestions.js