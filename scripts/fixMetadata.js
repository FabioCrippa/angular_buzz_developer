const fs = require('fs');
const path = require('path');

const areasDir = path.join(__dirname, '../src/assets/data/areas');

// Metadata padrão
function defaultMetadata(area, subject, questions) {
  return {
    area: area,
    subject: subject,
    name: subject.charAt(0).toUpperCase() + subject.slice(1),
    description: '',
    difficulty: 'fundamental',
    lastUpdated: new Date().toISOString().slice(0, 10),
    questionCount: Array.isArray(questions) ? questions.length : 0,
    tags: []
  };
}

fs.readdirSync(areasDir, { withFileTypes: true }).forEach(entry => {
  if (!entry.isDirectory()) return;
  const area = entry.name;
  const areaPath = path.join(areasDir, area);

  fs.readdirSync(areaPath).forEach(file => {
    if (!file.endsWith('.json')) return;
    const filePath = path.join(areaPath, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Erro ao ler ${filePath}:`, e);
      return;
    }

    let changed = false;
    let questions = Array.isArray(json) ? json : json.questions;
    if (!Array.isArray(questions)) {
      console.error(`Arquivo ${filePath} não possui array de questões.`);
      return;
    }

    // Corrige estrutura para objeto com metadata e questions
    if (Array.isArray(json)) {
      json = {
        metadata: defaultMetadata(area, file.replace('.json', ''), questions),
        questions: questions
      };
      changed = true;
    } else {
      // Adiciona metadata se faltar
      if (!json.metadata) {
        json.metadata = defaultMetadata(area, file.replace('.json', ''), questions);
        changed = true;
      } else {
        // Atualiza campos principais
        json.metadata.area = area;
        json.metadata.subject = file.replace('.json', '');
        json.metadata.questionCount = questions.length;
        json.metadata.lastUpdated = new Date().toISOString().slice(0, 10);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      console.log(`Corrigido: ${filePath}`);
    }
  });
});