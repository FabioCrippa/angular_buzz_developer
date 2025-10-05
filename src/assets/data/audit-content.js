const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORIA COMPLETA DO CONTEÚDO\n');
console.log('=====================================\n');

// Configurações da auditoria
const config = {
  minQuestionsPerFile: 5,
  maxQuestionsPerFile: 100,
  requiredFields: ['id', 'question', 'options', 'correct', 'explanation', 'category'],
  optionalFields: ['interviewTip', 'studyTip', 'examTip', 'difficulty', 'tags'],
  minExplanationLength: 20,
  minQuestionLength: 10,
  minOptionsCount: 2,
  maxOptionsCount: 6
};

// Resultado da auditoria
const auditResult = {
  totalFiles: 0,
  totalQuestions: 0,
  errors: [],
  warnings: [],
  duplicates: [],
  statistics: {
    byArea: {},
    byDifficulty: {},
    withTips: 0,
    withoutExplanation: 0,
    shortExplanations: 0
  },
  recommendations: []
};

// Função para escanear diretórios recursivamente
function scanDirectory(dir, area = '') {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && !item.startsWith('.')) {
      console.log(`📁 Escaneando área: ${item}`);
      scanDirectory(fullPath, item);
    } else if (item.endsWith('.json') && item !== 'index.json') {
      auditFile(fullPath, area, item);
    }
  });
}

// Função para auditar um arquivo específico
function auditFile(filePath, area, fileName) {
  auditResult.totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log(`📄 Auditando: ${area}/${fileName}`);
    
    // Verificar estrutura do arquivo
    auditFileStructure(data, filePath, area);
    
    // Auditar questões
    if (data.questions && Array.isArray(data.questions)) {
      data.questions.forEach((question, index) => {
        auditQuestion(question, filePath, area, index + 1);
      });
      
      auditResult.totalQuestions += data.questions.length;
      
      // Estatísticas por área
      if (!auditResult.statistics.byArea[area]) {
        auditResult.statistics.byArea[area] = 0;
      }
      auditResult.statistics.byArea[area] += data.questions.length;
    }
    
    console.log(`   ✓ ${data.questions?.length || 0} questões processadas`);
    
  } catch (error) {
    auditResult.errors.push({
      type: 'FILE_ERROR',
      file: filePath,
      message: `Erro ao processar arquivo: ${error.message}`
    });
    console.log(`   ❌ ERRO: ${error.message}`);
  }
}

// Auditar estrutura do arquivo
function auditFileStructure(data, filePath, area) {
  // Verificar se tem metadata
  if (!data.metadata) {
    auditResult.warnings.push({
      type: 'MISSING_METADATA',
      file: filePath,
      message: 'Arquivo sem metadata'
    });
  } else {
    // Verificar campos obrigatórios da metadata
    const requiredMetaFields = ['area', 'subject', 'name', 'description'];
    requiredMetaFields.forEach(field => {
      if (!data.metadata[field]) {
        auditResult.warnings.push({
          type: 'INCOMPLETE_METADATA',
          file: filePath,
          message: `Metadata sem campo: ${field}`
        });
      }
    });
  }
  
  // Verificar se tem questões
  if (!data.questions || !Array.isArray(data.questions)) {
    auditResult.errors.push({
      type: 'NO_QUESTIONS',
      file: filePath,
      message: 'Arquivo sem array de questões'
    });
    return;
  }
  
  // Verificar quantidade de questões
  const questionCount = data.questions.length;
  if (questionCount < config.minQuestionsPerFile) {
    auditResult.warnings.push({
      type: 'FEW_QUESTIONS',
      file: filePath,
      message: `Apenas ${questionCount} questões (mínimo: ${config.minQuestionsPerFile})`
    });
  }
  
  if (questionCount > config.maxQuestionsPerFile) {
    auditResult.warnings.push({
      type: 'TOO_MANY_QUESTIONS',
      file: filePath,
      message: `${questionCount} questões (máximo recomendado: ${config.maxQuestionsPerFile})`
    });
  }
}

// Auditar questão individual
function auditQuestion(question, filePath, area, questionIndex) {
  const questionId = `${path.basename(filePath)}-Q${questionIndex}`;
  
  // Verificar campos obrigatórios
  config.requiredFields.forEach(field => {
    if (!question[field]) {
      auditResult.errors.push({
        type: 'MISSING_FIELD',
        file: filePath,
        question: questionIndex,
        field: field,
        message: `Questão ${questionIndex}: Campo obrigatório '${field}' ausente`
      });
    }
  });
  
  // Verificar ID único
  if (question.id) {
    if (global.usedIds) {
      if (global.usedIds.has(question.id)) {
        auditResult.duplicates.push({
          type: 'DUPLICATE_ID',
          id: question.id,
          files: [global.usedIds.get(question.id), filePath],
          message: `ID ${question.id} duplicado`
        });
      } else {
        global.usedIds.set(question.id, filePath);
      }
    } else {
      global.usedIds = new Map();
      global.usedIds.set(question.id, filePath);
    }
  }
  
  // Verificar qualidade da pergunta
  if (question.question) {
    if (question.question.length < config.minQuestionLength) {
      auditResult.warnings.push({
        type: 'SHORT_QUESTION',
        file: filePath,
        question: questionIndex,
        message: `Questão muito curta: ${question.question.length} caracteres`
      });
    }
    
    // Verificar se pergunta termina com ?
    if (!question.question.trim().endsWith('?') && !question.question.includes(':')) {
      auditResult.warnings.push({
        type: 'QUESTION_FORMAT',
        file: filePath,
        question: questionIndex,
        message: 'Pergunta não termina com ? ou :'
      });
    }
  }
  
  // Verificar opções
  if (question.options) {
    if (!Array.isArray(question.options)) {
      auditResult.errors.push({
        type: 'INVALID_OPTIONS',
        file: filePath,
        question: questionIndex,
        message: 'Options deve ser um array'
      });
    } else {
      if (question.options.length < config.minOptionsCount) {
        auditResult.errors.push({
          type: 'FEW_OPTIONS',
          file: filePath,
          question: questionIndex,
          message: `Apenas ${question.options.length} opções (mínimo: ${config.minOptionsCount})`
        });
      }
      
      if (question.options.length > config.maxOptionsCount) {
        auditResult.warnings.push({
          type: 'MANY_OPTIONS',
          file: filePath,
          question: questionIndex,
          message: `${question.options.length} opções (máximo recomendado: ${config.maxOptionsCount})`
        });
      }
      
      // Verificar estrutura das opções
      const aliases = [];
      question.options.forEach((option, optIndex) => {
        if (!option.alias || !option.name) {
          auditResult.errors.push({
            type: 'INVALID_OPTION_STRUCTURE',
            file: filePath,
            question: questionIndex,
            option: optIndex + 1,
            message: 'Opção deve ter alias e name'
          });
        }
        
        if (option.alias && aliases.includes(option.alias)) {
          auditResult.errors.push({
            type: 'DUPLICATE_ALIAS',
            file: filePath,
            question: questionIndex,
            message: `Alias '${option.alias}' duplicado na questão`
          });
        }
        aliases.push(option.alias);
      });
      
      // Verificar se resposta correta existe nas opções
      if (question.correct && question.options) {
        const correctOption = question.options.find(opt => opt.alias === question.correct);
        if (!correctOption) {
          auditResult.errors.push({
            type: 'INVALID_CORRECT_ANSWER',
            file: filePath,
            question: questionIndex,
            message: `Resposta correta '${question.correct}' não encontrada nas opções`
          });
        }
      }
    }
  }
  
  // Verificar explanation
  if (question.explanation) {
    if (question.explanation.length < config.minExplanationLength) {
      auditResult.statistics.shortExplanations++;
      auditResult.warnings.push({
        type: 'SHORT_EXPLANATION',
        file: filePath,
        question: questionIndex,
        message: `Explanation muito curta: ${question.explanation.length} caracteres`
      });
    }
  } else {
    auditResult.statistics.withoutExplanation++;
    auditResult.warnings.push({
      type: 'NO_EXPLANATION',
      file: filePath,
      question: questionIndex,
      message: 'Questão sem explanation'
    });
  }
  
  // Verificar tips
  const hasTips = question.interviewTip || question.studyTip || question.examTip;
  if (hasTips) {
    auditResult.statistics.withTips++;
  }
  
  // Verificar dificuldade
  if (question.difficulty) {
    const validDifficulties = ['fundamental', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(question.difficulty)) {
      auditResult.warnings.push({
        type: 'INVALID_DIFFICULTY',
        file: filePath,
        question: questionIndex,
        message: `Dificuldade inválida: ${question.difficulty}`
      });
    } else {
      if (!auditResult.statistics.byDifficulty[question.difficulty]) {
        auditResult.statistics.byDifficulty[question.difficulty] = 0;
      }
      auditResult.statistics.byDifficulty[question.difficulty]++;
    }
  }
}

// Função para gerar recomendações
function generateRecommendations() {
  const recs = auditResult.recommendations;
  
  // Recomendações baseadas em estatísticas
  if (auditResult.statistics.withoutExplanation > 0) {
    recs.push({
      type: 'CONTENT_QUALITY',
      priority: 'HIGH',
      message: `${auditResult.statistics.withoutExplanation} questões sem explanation precisam ser completadas`
    });
  }
  
  if (auditResult.statistics.shortExplanations > 5) {
    recs.push({
      type: 'CONTENT_QUALITY',
      priority: 'MEDIUM',
      message: `${auditResult.statistics.shortExplanations} explanations muito curtas podem ser expandidas`
    });
  }
  
  if (auditResult.duplicates.length > 0) {
    recs.push({
      type: 'DATA_INTEGRITY',
      priority: 'HIGH',
      message: `${auditResult.duplicates.length} IDs duplicados precisam ser corrigidos`
    });
  }
  
  if (auditResult.statistics.withTips / auditResult.totalQuestions < 0.3) {
    recs.push({
      type: 'FEATURE_ENHANCEMENT',
      priority: 'MEDIUM',
      message: 'Considere adicionar mais tips (studyTip, interviewTip) para melhorar valor educacional'
    });
  }
  
  // Recomendações por área
  Object.entries(auditResult.statistics.byArea).forEach(([area, count]) => {
    if (count < 10) {
      recs.push({
        type: 'CONTENT_EXPANSION',
        priority: 'MEDIUM',
        message: `Área '${area}' tem apenas ${count} questões - considere expandir`
      });
    }
  });
}

// Função principal
function runAudit() {
  console.log('🚀 Iniciando auditoria...\n');
  
  // Escanear diretório atual
  scanDirectory('./');
  
  // Gerar recomendações
  generateRecommendations();
  
  // Gerar relatório
  generateReport();
}

// Gerar relatório final
function generateReport() {
  console.log('\n🎉 AUDITORIA CONCLUÍDA!\n');
  console.log('=====================================');
  
  // Resumo geral
  console.log('📊 RESUMO GERAL:');
  console.log(`   📄 Arquivos auditados: ${auditResult.totalFiles}`);
  console.log(`   📝 Total de questões: ${auditResult.totalQuestions}`);
  console.log(`   ❌ Erros encontrados: ${auditResult.errors.length}`);
  console.log(`   ⚠️  Avisos: ${auditResult.warnings.length}`);
  console.log(`   🔄 Duplicatas: ${auditResult.duplicates.length}`);
  
  // Estatísticas por área
  console.log('\n📁 QUESTÕES POR ÁREA:');
  Object.entries(auditResult.statistics.byArea)
    .sort((a, b) => b[1] - a[1])
    .forEach(([area, count]) => {
      console.log(`   ${area.padEnd(20)} | ${count.toString().padStart(3)} questões`);
    });
  
  // Qualidade do conteúdo
  console.log('\n📚 QUALIDADE DO CONTEÚDO:');
  console.log(`   ✅ Com tips: ${auditResult.statistics.withTips} questões`);
  console.log(`   ❌ Sem explanation: ${auditResult.statistics.withoutExplanation} questões`);
  console.log(`   ⚠️  Explanations curtas: ${auditResult.statistics.shortExplanations} questões`);
  
  // Dificuldade
  if (Object.keys(auditResult.statistics.byDifficulty).length > 0) {
    console.log('\n📈 POR DIFICULDADE:');
    Object.entries(auditResult.statistics.byDifficulty).forEach(([diff, count]) => {
      console.log(`   ${diff.padEnd(15)} | ${count.toString().padStart(3)} questões`);
    });
  }
  
  // Erros críticos
  if (auditResult.errors.length > 0) {
    console.log('\n❌ ERROS CRÍTICOS:');
    auditResult.errors.slice(0, 10).forEach(error => {
      console.log(`   • ${error.message}`);
    });
    if (auditResult.errors.length > 10) {
      console.log(`   ... e mais ${auditResult.errors.length - 10} erros`);
    }
  }
  
  // Duplicatas
  if (auditResult.duplicates.length > 0) {
    console.log('\n🔄 IDs DUPLICADOS:');
    auditResult.duplicates.forEach(dup => {
      console.log(`   • ID ${dup.id}: ${dup.files.join(' | ')}`);
    });
  }
  
  // Recomendações
  if (auditResult.recommendations.length > 0) {
    console.log('\n💡 RECOMENDAÇÕES:');
    auditResult.recommendations.forEach(rec => {
      const priority = rec.priority === 'HIGH' ? '🔥' : rec.priority === 'MEDIUM' ? '⚡' : '💡';
      console.log(`   ${priority} ${rec.message}`);
    });
  }
  
  // Salvar relatório detalhado
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: auditResult.totalFiles,
      totalQuestions: auditResult.totalQuestions,
      errorCount: auditResult.errors.length,
      warningCount: auditResult.warnings.length,
      duplicateCount: auditResult.duplicates.length
    },
    statistics: auditResult.statistics,
    errors: auditResult.errors,
    warnings: auditResult.warnings,
    duplicates: auditResult.duplicates,
    recommendations: auditResult.recommendations
  };
  
  fs.writeFileSync('./audit-report.json', JSON.stringify(reportData, null, 2), 'utf8');
  console.log('\n💾 Relatório detalhado salvo em: audit-report.json');
  
  // Score de qualidade
  const qualityScore = calculateQualityScore();
  console.log(`\n🏆 SCORE DE QUALIDADE: ${qualityScore}/100`);
  
  if (qualityScore >= 90) {
    console.log('🎉 EXCELENTE! Conteúdo de alta qualidade!');
  } else if (qualityScore >= 70) {
    console.log('✅ BOM! Algumas melhorias recomendadas.');
  } else if (qualityScore >= 50) {
    console.log('⚠️  REGULAR. Precisa de atenção em várias áreas.');
  } else {
    console.log('❌ BAIXO. Requer correções urgentes.');
  }
}

// Calcular score de qualidade
function calculateQualityScore() {
  if (auditResult.totalQuestions === 0) return 0;
  
  let score = 100;
  
  // Penalizar por erros críticos
  score -= (auditResult.errors.length * 5);
  
  // Penalizar por duplicatas
  score -= (auditResult.duplicates.length * 10);
  
  // Penalizar por questões sem explanation
  score -= (auditResult.statistics.withoutExplanation * 2);
  
  // Penalizar por explanations muito curtas
  score -= (auditResult.statistics.shortExplanations * 0.5);
  
  // Bonificar por tips
  score += Math.min(10, (auditResult.statistics.withTips / auditResult.totalQuestions) * 20);
  
  return Math.max(0, Math.round(score));
}

// Executar auditoria
runAudit();