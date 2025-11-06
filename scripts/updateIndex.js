const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../src/assets/data/index.json');
const areasDir = path.join(__dirname, '../src/assets/data/areas');

function getQuestions(json) {
  if (Array.isArray(json.questions)) return json.questions;
  if (Array.isArray(json)) return json;
  return [];
}

function fixStructure(json, area, subject, questions) {
  // Se for array, converte para objeto com metadata e questions
  if (Array.isArray(json)) {
    return {
      metadata: {
        area,
        subject,
        name: subject.charAt(0).toUpperCase() + subject.slice(1),
        description: '',
        difficulty: 'fundamental',
        lastUpdated: new Date().toISOString().slice(0, 10),
        questionCount: questions.length,
        tags: []
      },
      questions
    };
  }
  // Se não tem metadata, adiciona
  if (!json.metadata) {
    json.metadata = {
      area,
      subject,
      name: subject.charAt(0).toUpperCase() + subject.slice(1),
      description: '',
      difficulty: 'fundamental',
      lastUpdated: new Date().toISOString().slice(0, 10),
      questionCount: questions.length,
      tags: []
    };
  }
  return json;
}

function checkDuplicates(questions) {
  const seenIds = new Set();
  const seenQuestions = new Set();
  const duplicateIds = [];
  const duplicateQuestions = [];
  questions.forEach((q, idx) => {
    if (seenIds.has(q.id)) {
      duplicateIds.push({ idx, id: q.id });
    } else {
      seenIds.add(q.id);
    }
    const text = (q.question || '').trim().toLowerCase();
    if (seenQuestions.has(text)) {
      duplicateQuestions.push({ idx, question: q.question });
    } else {
      seenQuestions.add(text);
    }
  });
  return { duplicateIds, duplicateQuestions };
}

function removeDuplicatesAndFixIds(questions) {
  const seenIds = new Set();
  const seenQuestions = new Set();
  const filtered = [];
  let nextId = 100000;
  questions.forEach(q => {
    let id = q.id;
    if (seenIds.has(id)) {
      id = nextId++;
    }
    const text = (q.question || '').trim().toLowerCase();
    if (!seenQuestions.has(text)) {
      seenIds.add(id);
      seenQuestions.add(text);
      filtered.push({ ...q, id });
    }
    // Se for duplicada, não adiciona
  });
  return filtered;
}

function updateMetadata(json, questions, area, subject) {
  if (!json.metadata) json.metadata = {};
  json.metadata.area = area;
  json.metadata.subject = subject;
  json.metadata.questionCount = questions.length;
  json.metadata.lastUpdated = new Date().toISOString().slice(0, 10);
}

async function main() {
  // Carrega o index.json atual (estrutura reorganizada)
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const areas = index.areas;

  let totalQuestions = 0;
  let byArea = {};
  let totalSubjects = 0;
  let report = [];

  for (const area of Object.keys(areas)) {
    let areaTotal = 0;
    const subareas = areas[area].subareas;
    for (const subarea of Object.keys(subareas)) {
      for (const subject of subareas[subarea]) {
        const subjectFile = path.join(areasDir, area, `${subject}.json`);
        let count = 0;
        if (fs.existsSync(subjectFile)) {
          let fileChanged = false;
          let fileData = fs.readFileSync(subjectFile, 'utf8');
          let json = JSON.parse(fileData);
          let questions = getQuestions(json);

          // Corrige estrutura se necessário
          json = fixStructure(json, area, subject, questions);

          // Verifica duplicatas
          const { duplicateIds, duplicateQuestions } = checkDuplicates(json.questions);
          if (duplicateIds.length > 0 || duplicateQuestions.length > 0) {
            report.push({
              file: subjectFile,
              duplicateIds: duplicateIds.map(d => d.id),
              duplicateQuestions: duplicateQuestions.map(d => d.question)
            });
            json.questions = removeDuplicatesAndFixIds(json.questions);
            fileChanged = true;
          }

          count = json.questions.length;

          // Atualiza metadata sempre
          updateMetadata(json, json.questions, area, subject);
          fileChanged = true;

          // Salva arquivo corrigido
          if (fileChanged) {
            fs.writeFileSync(subjectFile, JSON.stringify(json, null, 2));
          }
        }
        areaTotal += count;
        totalSubjects += 1;
      }
    }
    byArea[area] = areaTotal;
    totalQuestions += areaTotal;
  }

  // Atualiza stats
  if (!index.stats) index.stats = {};
  index.stats.totalQuestions = totalQuestions;
  index.stats.totalAreas = Object.keys(areas).length;
  index.stats.totalSubjects = totalSubjects;
  index.stats.byArea = byArea;
  index.stats.lastUpdated = new Date().toISOString().slice(0, 10);

  // Atualiza appInfo
  if (index.appInfo) {
    index.appInfo.lastUpdated = index.stats.lastUpdated;
  }

  // Salva index.json atualizado
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('\nindex.json atualizado com sucesso!');

  // Relatório de correções
  if (report.length > 0) {
    console.log('\nCorreções realizadas:');
    report.forEach(r => {
      console.log(`Arquivo: ${r.file}`);
      if (r.duplicateIds.length > 0) {
        console.log(`  IDs duplicados corrigidos: ${r.duplicateIds.join(', ')}`);
      }
      if (r.duplicateQuestions.length > 0) {
        console.log(`  Perguntas duplicadas removidas:`);
        r.duplicateQuestions.forEach(q => console.log(`    - ${q}`));
      }
    });
  } else {
    console.log('\nNenhuma duplicata encontrada.');
  }
}

main();
// node scripts/updateIndex.js