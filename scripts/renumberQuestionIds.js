const fs = require('fs');
const path = require('path');

/**
 * Script para renumerar IDs de questões por área
 * Evita duplicatas usando intervalos exclusivos para cada área
 */

// Configuração de intervalos de IDs por área
const ID_RANGES = {
  'desenvolvimento-web': { start: 1000, end: 1999 },
  'portugues': { start: 2000, end: 2999 },
  'matematica': { start: 3000, end: 3999 },
  'informatica': { start: 4000, end: 4999 }
};

// Paths
const dataPath = path.join(__dirname, '../src/assets/data');
const indexPath = path.join(dataPath, 'index.json');
const areasPath = path.join(dataPath, 'areas');

// Log de mudanças
const changeLog = {
  timestamp: new Date().toISOString(),
  changes: [],
  summary: {}
};

/**
 * Carrega o index.json
 */
function loadIndex() {
  try {
    const indexData = fs.readFileSync(indexPath, 'utf8');
    return JSON.parse(indexData);
  } catch (error) {
    console.error('❌ Erro ao carregar index.json:', error.message);
    process.exit(1);
  }
}

/**
 * Renumera as questões de uma área específica
 */
function renumberArea(areaName, subjects) {
  const range = ID_RANGES[areaName];
  if (!range) {
    console.warn(`⚠️  Área "${areaName}" não tem intervalo definido. Pulando...`);
    return;
  }

  console.log(`\n📂 Processando área: ${areaName}`);
  console.log(`   Intervalo de IDs: ${range.start} - ${range.end}`);

  let currentId = range.start;
  let totalQuestionsInArea = 0;
  const areaChanges = [];

  // Processar cada subject (arquivo JSON)
  subjects.forEach(subject => {
    const filePath = path.join(areasPath, areaName, `${subject}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  Arquivo não encontrado: ${filePath}`);
      return;
    }

    try {
      // Ler arquivo
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (!fileData.questions || !Array.isArray(fileData.questions)) {
        console.warn(`   ⚠️  Formato inválido em ${subject}.json`);
        return;
      }

      const questionsCount = fileData.questions.length;
      console.log(`   📄 ${subject}.json: ${questionsCount} questões`);

      // Renumerar questões
      fileData.questions.forEach((question, index) => {
        const oldId = question.id;
        const newId = currentId;

        // Atualizar ID
        question.id = newId;

        // Log da mudança
        areaChanges.push({
          area: areaName,
          subject: subject,
          oldId: oldId,
          newId: newId
        });

        currentId++;
      });

      // Verificar se ultrapassou o limite
      if (currentId > range.end) {
        console.error(`   ❌ ERRO: Área "${areaName}" ultrapassou o limite de IDs!`);
        console.error(`      Questões: ${currentId - range.start}, Limite: ${range.end - range.start + 1}`);
        console.error(`      Considere aumentar o intervalo para esta área.`);
        process.exit(1);
      }

      // Salvar arquivo atualizado
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
      console.log(`   ✅ ${subject}.json atualizado`);

      totalQuestionsInArea += questionsCount;

    } catch (error) {
      console.error(`   ❌ Erro ao processar ${subject}.json:`, error.message);
    }
  });

  // Resumo da área
  changeLog.changes.push(...areaChanges);
  changeLog.summary[areaName] = {
    totalQuestions: totalQuestionsInArea,
    startId: range.start,
    endId: currentId - 1,
    idsUsed: currentId - range.start,
    idsAvailable: range.end - range.start + 1
  };

  console.log(`   📊 Resumo: ${totalQuestionsInArea} questões renumeradas`);
  console.log(`   📊 IDs usados: ${range.start} a ${currentId - 1}`);
  console.log(`   📊 IDs disponíveis restantes: ${range.end - (currentId - 1)}`);
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando renumeração de IDs...\n');
  console.log('📋 Esquema de numeração:');
  Object.entries(ID_RANGES).forEach(([area, range]) => {
    console.log(`   ${area}: ${range.start} - ${range.end}`);
  });

  // Carregar index
  const indexData = loadIndex();
  const structure = indexData.structure;

  if (!structure) {
    console.error('❌ Estrutura não encontrada no index.json');
    process.exit(1);
  }

  // Processar cada área
  Object.entries(structure).forEach(([areaName, subjects]) => {
    renumberArea(areaName, subjects);
  });

  // Salvar log de mudanças
  const logPath = path.join(__dirname, '../scripts/renumber-log.json');
  fs.writeFileSync(logPath, JSON.stringify(changeLog, null, 2), 'utf8');

  // Resumo final
  console.log('\n✅ Renumeração concluída!\n');
  console.log('📊 RESUMO GERAL:');
  Object.entries(changeLog.summary).forEach(([area, stats]) => {
    console.log(`\n   ${area}:`);
    console.log(`      Total de questões: ${stats.totalQuestions}`);
    console.log(`      Range usado: ${stats.startId} - ${stats.endId}`);
    console.log(`      IDs disponíveis: ${stats.idsAvailable - stats.idsUsed} de ${stats.idsAvailable}`);
  });

  console.log(`\n📄 Log detalhado salvo em: ${logPath}`);
  console.log(`   Total de mudanças: ${changeLog.changes.length}`);
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Limpe o histórico de progresso dos usuários (localStorage)');
  console.log('   2. Faça backup antes de usar em produção');
  console.log('   3. Teste todas as funcionalidades após a renumeração\n');
}

// Executar
main();
