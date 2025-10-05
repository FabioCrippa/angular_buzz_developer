const fs = require('fs');
const path = require('path');

console.log('📂 Separando questões por categoria e organizando em pastas...\n');

// Carregar arquivo principal
const mainFile = './quizz_questions.json';
const mainData = JSON.parse(fs.readFileSync(mainFile, 'utf8'));

console.log(`📊 Total de questões encontradas: ${mainData.questions.length}`);

// Mapeamento de categorias para áreas/pastas
const categoryMapping = {
  // Desenvolvimento Web
  'html': { area: 'desenvolvimento-web', subject: 'html', name: 'HTML5 & Semântica' },
  'css': { area: 'desenvolvimento-web', subject: 'css', name: 'CSS3 & Layout Moderno' },
  'javascript': { area: 'desenvolvimento-web', subject: 'javascript', name: 'JavaScript ES6+' },
  'typescript': { area: 'desenvolvimento-web', subject: 'typescript', name: 'TypeScript Avançado' },
  'angular': { area: 'desenvolvimento-web', subject: 'angular', name: 'Angular Framework' },
  'responsividade': { area: 'desenvolvimento-web', subject: 'responsividade', name: 'Design Responsivo' },
  'front-end': { area: 'desenvolvimento-web', subject: 'front-end', name: 'Front-End Moderno' },
  'boas-praticas': { area: 'desenvolvimento-web', subject: 'boas-praticas', name: 'Boas Práticas de Código' },
  
  // Metodologias
  'versionamento': { area: 'metodologias', subject: 'versionamento', name: 'Git & Controle de Versão' },
  'scrum': { area: 'metodologias', subject: 'scrum', name: 'Scrum & Metodologias Ágeis' },
  'devops': { area: 'metodologias', subject: 'devops', name: 'DevOps & Automação' },
  'ci-cd': { area: 'metodologias', subject: 'ci-cd', name: 'CI/CD & Deploy' },
  'code-review': { area: 'metodologias', subject: 'code-review', name: 'Code Review & Qualidade' },
  'testes-unitarios': { area: 'metodologias', subject: 'testes-unitarios', name: 'Testes Automatizados' },
  
  // Segurança
  'criptografia': { area: 'seguranca', subject: 'criptografia', name: 'Criptografia & Segurança' },
  
  // Design
  'figma': { area: 'design', subject: 'figma', name: 'Figma & Design Systems' },
  'micro-front-end': { area: 'design', subject: 'micro-front-end', name: 'Micro Front-End' },
  
  // Entrevista
  'entrevista': { area: 'entrevista', subject: 'entrevista-tecnica', name: 'Preparação para Entrevistas' }
};

// Criar estrutura de pastas se não existir
Object.values(categoryMapping).forEach(mapping => {
  const areaPath = `./${mapping.area}`;
  if (!fs.existsSync(areaPath)) {
    fs.mkdirSync(areaPath, { recursive: true });
    console.log(`📁 Pasta criada: ${areaPath}`);
  }
});

// Agrupar questões por categoria
const questionsByCategory = {};
let questionsWithoutCategory = [];

mainData.questions.forEach(question => {
  const category = question.category;
  
  if (!category) {
    questionsWithoutCategory.push(question);
    return;
  }
  
  if (!questionsByCategory[category]) {
    questionsByCategory[category] = [];
  }
  
  questionsByCategory[category].push(question);
});

// Processar cada categoria
let totalProcessed = 0;
const processingStats = {};

Object.keys(questionsByCategory).forEach(category => {
  const questions = questionsByCategory[category];
  const mapping = categoryMapping[category];
  
  if (!mapping) {
    console.log(`⚠️ Categoria '${category}' não mapeada - ${questions.length} questões ignoradas`);
    return;
  }
  
  // Criar dados do arquivo
  const fileData = {
    metadata: {
      area: mapping.area,
      subject: mapping.subject,
      name: mapping.name,
      description: getDescription(category),
      difficulty: getDifficulty(questions),
      lastUpdated: new Date().toISOString().split('T')[0],
      questionCount: questions.length,
      tags: getTags(category, questions)
    },
    questions: questions.sort((a, b) => a.id - b.id) // Ordenar por ID
  };
  
  // Caminho do arquivo
  const filePath = path.join(mapping.area, `${mapping.subject}.json`);
  
  // Salvar arquivo
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
  
  console.log(`✅ ${filePath} - ${questions.length} questões`);
  
  totalProcessed += questions.length;
  processingStats[mapping.area] = (processingStats[mapping.area] || 0) + questions.length;
});

// Função para gerar descrições baseadas na categoria
function getDescription(category) {
  const descriptions = {
    'html': 'Questões sobre HTML5, semântica, acessibilidade e estruturação de páginas web modernas.',
    'css': 'CSS3, Flexbox, Grid, animações, responsividade e técnicas avançadas de estilização.',
    'javascript': 'JavaScript ES6+, programação assíncrona, manipulação DOM e conceitos fundamentais.',
    'typescript': 'TypeScript, tipagem estática, interfaces, generics e desenvolvimento escalável.',
    'angular': 'Framework Angular, componentes, services, RxJS e arquitetura de SPAs.',
    'responsividade': 'Design responsivo, media queries, mobile-first e otimização para diferentes dispositivos.',
    'front-end': 'Desenvolvimento front-end moderno, debugging, performance e boas práticas.',
    'boas-praticas': 'Clean code, SOLID, padrões de desenvolvimento e qualidade de software.',
    'versionamento': 'Git, controle de versão, branches, merges e workflow colaborativo.',
    'scrum': 'Metodologia Scrum, práticas ágeis, sprints e gestão de projetos.',
    'devops': 'DevOps, automação, infraestrutura como código e integração contínua.',
    'ci-cd': 'Integração e entrega contínua, pipelines automatizados e deploy.',
    'code-review': 'Revisão de código, qualidade, colaboração e boas práticas de equipe.',
    'testes-unitarios': 'Testes automatizados, TDD, BDD e garantia de qualidade.',
    'criptografia': 'Segurança, criptografia, autenticação e proteção de dados.',
    'figma': 'Design colaborativo, prototipagem, design systems e handoff para desenvolvimento.',
    'micro-front-end': 'Arquitetura microfrontend, modularização e desenvolvimento distribuído.',
    'entrevista': 'Preparação para entrevistas técnicas com dicas práticas e estratégias de comunicação.'
  };
  
  return descriptions[category] || `Questões sobre ${category} para desenvolvimento profissional.`;
}

// Função para determinar dificuldade baseada no número de questões
function getDifficulty(questions) {
  const avgId = questions.reduce((sum, q) => sum + q.id, 0) / questions.length;
  
  if (avgId < 500) return 'fundamental';
  if (avgId < 1200) return 'intermediate'; 
  return 'advanced';
}

// Função para gerar tags baseadas na categoria
function getTags(category, questions) {
  const baseTags = {
    'html': ['html5', 'semantica', 'acessibilidade', 'estruturacao'],
    'css': ['css3', 'flexbox', 'grid', 'animacoes', 'responsividade'],
    'javascript': ['es6', 'assincrono', 'dom', 'programacao'],
    'typescript': ['tipagem', 'interfaces', 'generics', 'desenvolvimento'],
    'angular': ['framework', 'spa', 'componentes', 'rxjs'],
    'responsividade': ['mobile-first', 'media-queries', 'layout', 'otimizacao'],
    'front-end': ['debugging', 'performance', 'moderno', 'praticas'],
    'boas-praticas': ['clean-code', 'solid', 'qualidade', 'manutencao'],
    'versionamento': ['git', 'branches', 'colaboracao', 'workflow'],
    'scrum': ['agil', 'sprints', 'gestao', 'metodologia'],
    'devops': ['automacao', 'infraestrutura', 'integracao', 'deploy'],
    'ci-cd': ['pipeline', 'automacao', 'deploy', 'qualidade'],
    'code-review': ['revisao', 'qualidade', 'colaboracao', 'equipe'],
    'testes-unitarios': ['tdd', 'bdd', 'automacao', 'qualidade'],
    'criptografia': ['seguranca', 'autenticacao', 'protecao', 'dados'],
    'figma': ['design', 'prototipagem', 'colaboracao', 'handoff'],
    'micro-front-end': ['arquitetura', 'modular', 'escalabilidade', 'distribuido'],
    'entrevista': ['preparacao', 'comunicacao', 'estrategias', 'dicas-tecnicas']
  };
  
  const categoryTags = baseTags[category] || [category];
  
  // Adicionar tags baseadas na presença de interviewTip
  const hasInterviewTips = questions.some(q => q.interviewTip);
  if (hasInterviewTips) {
    categoryTags.push('entrevista', 'dicas-praticas');
  }
  
  return categoryTags;
}

// Tratar questões sem categoria
if (questionsWithoutCategory.length > 0) {
  console.log(`\n⚠️ ${questionsWithoutCategory.length} questões sem categoria encontradas:`);
  questionsWithoutCategory.forEach(q => {
    console.log(`   ID ${q.id}: ${q.question.substring(0, 50)}...`);
  });
  
  // Salvar questões sem categoria em arquivo separado
  const uncategorizedData = {
    metadata: {
      area: 'outros',
      subject: 'sem-categoria',
      name: 'Questões Sem Categoria',
      description: 'Questões que precisam ser categorizadas manualmente.',
      difficulty: 'mixed',
      lastUpdated: new Date().toISOString().split('T')[0],
      questionCount: questionsWithoutCategory.length,
      tags: ['uncategorized', 'review-needed']
    },
    questions: questionsWithoutCategory
  };
  
  fs.mkdirSync('./outros', { recursive: true });
  fs.writeFileSync('./outros/sem-categoria.json', JSON.stringify(uncategorizedData, null, 2), 'utf8');
  console.log(`📁 ./outros/sem-categoria.json - ${questionsWithoutCategory.length} questões`);
}

// Atualizar index.json com nova estrutura
const indexData = {
  appInfo: {
    name: "Angular Buzz Developer",
    version: "2.0.0",
    description: "Plataforma completa de questões técnicas para desenvolvedores",
    lastUpdated: new Date().toISOString().split('T')[0]
  },
  stats: {
    totalQuestions: totalProcessed,
    totalAreas: Object.keys(processingStats).length,
    totalSubjects: Object.keys(questionsByCategory).length,
    byArea: processingStats
  },
  areas: Object.keys(processingStats),
  structure: Object.keys(questionsByCategory).reduce((acc, category) => {
    const mapping = categoryMapping[category];
    if (mapping) {
      if (!acc[mapping.area]) {
        acc[mapping.area] = [];
      }
      acc[mapping.area].push(mapping.subject);
    }
    return acc;
  }, {})
};

fs.writeFileSync('./index.json', JSON.stringify(indexData, null, 2), 'utf8');

// Relatório final
console.log('\n🎉 Separação concluída com sucesso!');
console.log('=====================================');
console.log(`📊 Total processado: ${totalProcessed} questões`);
console.log(`📁 Áreas criadas: ${Object.keys(processingStats).length}`);
console.log(`📄 Arquivos gerados: ${Object.keys(questionsByCategory).length}`);

console.log('\n📋 DISTRIBUIÇÃO POR ÁREA:');
Object.entries(processingStats).forEach(([area, count]) => {
  console.log(`${area.padEnd(20)} | ${count.toString().padStart(3)} questões`);
});

console.log('\n📂 ESTRUTURA FINAL:');
Object.entries(indexData.structure).forEach(([area, subjects]) => {
  console.log(`${area}/`);
  subjects.forEach(subject => {
    console.log(`  ├── ${subject}.json`);
  });
});

console.log('\n✅ Arquivo index.json atualizado');
console.log('✅ Todas as questões organizadas por categoria');
console.log('✅ Metadados completos adicionados');
console.log('✅ Pronto para uso modular na aplicação!');

// Verificação de integridade
const categoriesFound = Object.keys(questionsByCategory).length;
const filesCreated = Object.keys(categoryMapping).filter(cat => 
  questionsByCategory[cat]
).length;

if (categoriesFound === filesCreated) {
  console.log('\n✅ Integridade verificada: Todas as categorias foram processadas!');
} else {
  console.log(`\n⚠️ Verificar: ${categoriesFound} categorias encontradas, ${filesCreated} arquivos criados`);
}