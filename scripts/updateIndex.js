const fs = require('fs');
const path = require('path');
const readline = require('readline');

const indexPath = path.join(__dirname, '../src/assets/data/index.json');
const areasDir = path.join(__dirname, '../src/assets/data/areas');

function getJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  });
  return results;
}

function countQuestionsInFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    if (Array.isArray(json.questions)) {
      return json.questions.length;
    }
    if (Array.isArray(json)) {
      return json.length;
    }
    return 0;
  } catch (e) {
    return 0;
  }
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

function removeDuplicates(questions) {
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

function askYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 's');
    });
  });
}

async function main() {
  // Carrega o index.json atual
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const structure = index.structure;

  let totalQuestions = 0;
  let byArea = {};
  let totalSubjects = 0;

  for (const area of Object.keys(structure)) {
    let areaTotal = 0;
    for (const subject of structure[area]) {
      const subjectFile = path.join(areasDir, area, `${subject}.json`);
      let count = 0;
      if (fs.existsSync(subjectFile)) {
        let fileChanged = false;
        let fileData = fs.readFileSync(subjectFile, 'utf8');
        let json = JSON.parse(fileData);
        let questions = Array.isArray(json.questions) ? json.questions : (Array.isArray(json) ? json : []);
        // Verifica duplicatas
        const { duplicateIds, duplicateQuestions } = checkDuplicates(questions);
        if (duplicateIds.length > 0 || duplicateQuestions.length > 0) {
          console.log(`\nArquivo: ${subjectFile}`);
          if (duplicateIds.length > 0) {
            console.log(`  IDs duplicados: ${duplicateIds.map(d => d.id).join(', ')}`);
          }
          if (duplicateQuestions.length > 0) {
            console.log(`  Perguntas duplicadas:`);
            duplicateQuestions.forEach(d => console.log(`    - ${d.question}`));
          }
          const corrigir = await askYesNo('Deseja remover duplicadas e corrigir IDs? (s/n): ');
          if (corrigir) {
            questions = removeDuplicates(questions);
            if (Array.isArray(json.questions)) {
              json.questions = questions;
            } else if (Array.isArray(json)) {
              json = questions;
            }
            fileChanged = true;
            console.log('  Duplicatas removidas e IDs corrigidos.');
          }
        }
        count = questions.length;
        // Atualiza metadata
        if (json.metadata) {
          json.metadata.questionCount = count;
          json.metadata.lastUpdated = new Date().toISOString().slice(0, 10);
          fileChanged = true;
        }
        if (fileChanged) {
          fs.writeFileSync(subjectFile, JSON.stringify(json, null, 2));
        }
      }
      areaTotal += count;
      totalSubjects += 1;
    }
    byArea[area] = areaTotal;
    totalQuestions += areaTotal;
  }

  // Atualiza stats
  index.stats.totalQuestions = totalQuestions;
  index.stats.totalAreas = Object.keys(structure).length;
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
}

main();