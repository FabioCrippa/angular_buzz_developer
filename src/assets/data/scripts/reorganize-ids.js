const fs = require('fs');
const path = require('path');

console.log('🔧 Reorganizando IDs do quizz_questions.json...\n');

// Carregar arquivo original
const originalFile = './quizz_questions.json';
const originalData = JSON.parse(fs.readFileSync(originalFile, 'utf8'));

console.log(`📊 Total de questões encontradas: ${originalData.questions.length}`);

// Mapeamento de categorias para ranges de ID
const categoryIdRanges = {
  'html': { start: 1, count: 0 },
  'css': { start: 101, count: 0 },
  'javascript': { start: 201, count: 0 },
  'typescript': { start: 301, count: 0 },
  'angular': { start: 401, count: 0 },
  'responsividade': { start: 501, count: 0 },
  'front-end': { start: 601, count: 0 },
  'boas-praticas': { start: 701, count: 0 },
  'versionamento': { start: 801, count: 0 },
  'scrum': { start: 901, count: 0 },
  'devops': { start: 1001, count: 0 },
  'ci-cd': { start: 1101, count: 0 },
  'code-review': { start: 1201, count: 0 },
  'testes-unitarios': { start: 1301, count: 0 },
  'criptografia': { start: 1401, count: 0 },
  'figma': { start: 1501, count: 0 },
  'micro-front-end': { start: 1601, count: 0 },
  'entrevista': { start: 1701, count: 0 },
  'outros': { start: 9001, count: 0 } // Para categorias não mapeadas
};

// Separar questões por categoria
const questionsByCategory = {};

originalData.questions.forEach(question => {
  const category = question.category || 'outros';
  
  if (!questionsByCategory[category]) {
    questionsByCategory[category] = [];
  }
  
  questionsByCategory[category].push(question);
});

// Reorganizar IDs por categoria
let reorganizedQuestions = [];
let stats = {};

Object.keys(questionsByCategory).forEach(category => {
  const questions = questionsByCategory[category];
  const categoryRange = categoryIdRanges[category] || categoryIdRanges['outros'];
  
  console.log(`\n📂 Processando categoria: ${category}`);
  console.log(`   📊 Questões: ${questions.length}`);
  console.log(`   🆔 Range ID: ${categoryRange.start} - ${categoryRange.start + questions.length - 1}`);
  
  questions.forEach((question, index) => {
    const oldId = question.id;
    const newId = categoryRange.start + index;
    
    question.id = newId;
    
    console.log(`   ✅ ID ${oldId} → ${newId}`);
    reorganizedQuestions.push(question);
  });
  
  stats[category] = {
    count: questions.length,
    startId: categoryRange.start,
    endId: categoryRange.start + questions.length - 1
  };
});

// Ordenar questões por ID
reorganizedQuestions.sort((a, b) => a.id - b.id);

// Atualizar dados originais
originalData.questions = reorganizedQuestions;

// Criar backup do arquivo original
const backupFile = './quizz_questions_backup.json';
fs.writeFileSync(backupFile, JSON.stringify(JSON.parse(fs.readFileSync(originalFile, 'utf8')), null, 2), 'utf8');
console.log(`\n💾 Backup criado: ${backupFile}`);

// Salvar arquivo reorganizado
fs.writeFileSync(originalFile, JSON.stringify(originalData, null, 2), 'utf8');

console.log('\n🎉 Reorganização concluída!');
console.log('\n📊 RELATÓRIO DE IDs POR CATEGORIA:');
console.log('================================================');

Object.keys(stats).forEach(category => {
  const stat = stats[category];
  console.log(`${category.padEnd(20)} | ${stat.count.toString().padStart(3)} questões | IDs ${stat.startId}-${stat.endId}`);
});

console.log('================================================');
console.log(`📈 Total: ${reorganizedQuestions.length} questões reorganizadas`);

// Verificar se há IDs duplicados
const ids = reorganizedQuestions.map(q => q.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicates.length > 0) {
  console.log(`\n⚠️  IDs duplicados encontrados: ${duplicates}`);
} else {
  console.log('\n✅ Nenhum ID duplicado encontrado!');
}

// Gerar relatório detalhado
const report = {
  timestamp: new Date().toISOString(),
  totalQuestions: reorganizedQuestions.length,
  categoriesProcessed: Object.keys(stats).length,
  categoryStats: stats,
  idRanges: categoryIdRanges
};

fs.writeFileSync('./reorganization_report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('\n📄 Relatório detalhado salvo em: reorganization_report.json');