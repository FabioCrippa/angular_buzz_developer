const fs = require('fs');
const path = require('path');

console.log('📚 Adicionando explanations em todas as questões...\n');

// Carregar arquivo principal
const filePath = './quizz_questions.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`📊 Total de questões encontradas: ${data.questions.length}`);

// Contador de questões modificadas
let questionsUpdated = 0;

// Explanations específicas por categoria e ID
const explanations = {
  // ===== HTML =====
  html: {
    1: "HTML significa HyperText Markup Language, a linguagem de marcação padrão usada para criar páginas web e estruturar seu conteúdo.",
    2: "A tag <a> (anchor) é usada para criar links em HTML. O atributo href especifica o destino do link.",
    3: "O atributo target='_blank' faz com que o link seja aberto em uma nova aba ou janela do navegador.",
    4: "A tag <meta> fornece metadados sobre o documento HTML, como charset, descrição, palavras-chave e configurações de viewport.",
    5: "O atributo 'alt' fornece texto alternativo para imagens, essencial para acessibilidade e SEO quando a imagem não pode ser exibida.",
    6: "<section> é uma tag semântica que define seções temáticas do conteúdo, enquanto <div> é um contêiner genérico sem significado semântico.",
    7: "O atributo 'defer' faz com que o script seja executado apenas após o HTML ter sido completamente analisado, mantendo a ordem de execução.",
    8: "A tag <template> define blocos de HTML que não são renderizados até serem clonados e inseridos no DOM via JavaScript.",
    9: "O atributo 'contenteditable' permite que o usuário edite o conteúdo do elemento diretamente na página web.",
    10: "O atributo 'aria-label' fornece uma descrição acessível para elementos, especialmente útil para leitores de tela.",
    11: "O DOM representa a estrutura hierárquica de um documento HTML/XML como uma árvore de objetos que pode ser manipulada via JavaScript.",
    12: "A meta tag viewport controla como a página é dimensionada e exibida em dispositivos móveis, essencial para design responsivo.",
    13: "A tag <header> define o cabeçalho de uma página ou seção, tipicamente contendo elementos de navegação, logos ou títulos.",
    14: "A tag <footer> define o rodapé de uma página ou seção, geralmente contendo informações de copyright, links ou contatos.",
    15: "O atributo 'lang' especifica o idioma principal do documento, importante para SEO e tecnologias assistivas.",
    16: "O atributo 'charset' especifica a codificação de caracteres do documento, UTF-8 é o padrão recomendado.",
    17: "A tag <aside> define conteúdo relacionado ao conteúdo principal, como barras laterais, publicidade ou links relacionados.",
    default: "HTML5 fornece estrutura semântica e acessível para páginas web modernas."
  },

  // ===== CSS =====
  css: {
    101: "A propriedade 'color' define a cor do texto. Aceita valores em hexadecimal, RGB, HSL ou nomes de cores predefinidos.",
    102: "display: inline não quebra linha e ignora width/height. block quebra linha e aceita dimensões. inline-block combina ambos os comportamentos.",
    103: "box-sizing: border-box faz com que width inclua padding e border, facilitando cálculos de layout responsivo.",
    104: "A propriedade 'font-size' controla o tamanho da fonte, aceita valores em px, em, rem, %, etc.",
    105: "A propriedade 'background-color' define a cor de fundo de um elemento.",
    106: "A propriedade 'text-align' controla o alinhamento horizontal do texto dentro de um elemento.",
    107: "CSS (Cascading Style Sheets) é uma linguagem de estilo usada para definir a apresentação de documentos HTML.",
    108: "CSS inline tem maior especificidade, interno fica no <head>, externo em arquivo separado. Externo é mais maintível.",
    109: "Especificidade determina qual regra CSS se aplica quando há conflitos: IDs (100) > Classes (10) > Elementos (1).",
    110: "Pseudo-elementos como ::before e ::after permitem estilizar partes específicas de elementos ou criar conteúdo virtual.",
    111: "z-index controla a ordem de empilhamento de elementos posicionados. Valores maiores ficam na frente.",
    112: "O box model define como elementos são renderizados: content, padding, border e margin formam o tamanho total.",
    113: "position: relative move elemento relativo à posição original. absolute posiciona relativo ao ancestral posicionado. fixed relativo à viewport.",
    114: "Media queries permitem aplicar estilos diferentes baseados em características do dispositivo como largura da tela.",
    115: "flex-grow define quanto um item flex pode crescer em relação aos outros itens no mesmo container.",
    116: "grid-template-columns define o número e tamanho das colunas em um layout CSS Grid.",
    default: "CSS controla a apresentação visual, layout e responsividade de páginas web."
  },

  // ===== JAVASCRIPT =====
  javascript: {
    201: "O método filter() cria um novo array contendo apenas os elementos que passam no teste implementado pela função fornecida.",
    202: "Hoisting é o comportamento de mover declarações de variáveis e funções para o topo do escopo durante a compilação.",
    203: "let e const têm escopo de bloco e Temporal Dead Zone. var tem escopo de função e hoisting com inicialização undefined.",
    default: "JavaScript é a linguagem de programação que adiciona interatividade e comportamento dinâmico às páginas web."
  },

  // ===== TYPESCRIPT =====
  typescript: {
    default: "TypeScript adiciona tipagem estática ao JavaScript, melhorando detecção de erros e experiência de desenvolvimento."
  },

  // ===== ANGULAR =====
  angular: {
    default: "Angular é um framework TypeScript para construir aplicações web escaláveis com arquitetura baseada em componentes."
  },

  // ===== FRONT-END =====
  'front-end': {
    601: "Esse erro ocorre quando tentamos acessar propriedades de valores null ou undefined. Sempre valide se o objeto existe antes de acessar suas propriedades.",
    602: "HTTP 404 indica que o recurso solicitado não foi encontrado no servidor. Pode ser URL incorreta ou recurso removido/movido.",
    603: "CORS é uma política de segurança que impede requisições cross-origin sem permissões adequadas. Configure headers no servidor ou use proxy.",
    604: "ReferenceError indica que uma variável foi usada antes de ser declarada ou está fora do escopo atual.",
    605: "Unexpected token geralmente indica erro de sintaxe: parênteses/chaves não fechados, vírgulas extras ou caracteres inválidos.",
    default: "Desenvolvimento front-end moderno envolve HTML, CSS, JavaScript e frameworks para criar interfaces interativas."
  },

  // ===== RESPONSIVIDADE =====
  responsividade: {
    default: "Design responsivo adapta layouts para diferentes tamanhos de tela usando media queries, flexbox e grid."
  },

  // ===== BOAS PRÁTICAS =====
  'boas-praticas': {
    default: "Boas práticas de código incluem nomenclatura clara, funções pequenas, testes automatizados e documentação adequada."
  },

  // ===== VERSIONAMENTO =====
  versionamento: {
    default: "Controle de versão permite rastrear mudanças no código, colaborar em equipe e manter histórico de desenvolvimento."
  },

  // ===== SCRUM =====
  scrum: {
    default: "Scrum é um framework ágil que organiza desenvolvimento em sprints com roles, eventos e artefatos bem definidos."
  },

  // ===== DEVOPS =====
  devops: {
    default: "DevOps integra desenvolvimento e operações para automatizar deploys, melhorar colaboração e acelerar entregas."
  },

  // ===== CI/CD =====
  'ci-cd': {
    default: "CI/CD automatiza integração, testes e deploy de código, reduzindo erros e acelerando time-to-market."
  },

  // ===== CODE REVIEW =====
  'code-review': {
    default: "Code review melhora qualidade do código através de revisão por pares, compartilhamento de conhecimento e detecção precoce de bugs."
  },

  // ===== TESTES UNITÁRIOS =====
  'testes-unitarios': {
    default: "Testes unitários verificam o funcionamento de pequenas partes do código isoladamente, garantindo qualidade e facilitando refatoração."
  },

  // ===== CRIPTOGRAFIA =====
  criptografia: {
    default: "Criptografia protege dados através de algoritmos matemáticos, garantindo confidencialidade, integridade e autenticidade."
  },

  // ===== FIGMA =====
  figma: {
    default: "Figma é uma ferramenta de design colaborativo baseada em nuvem para criar interfaces, protótipos e design systems."
  },

  // ===== MICRO FRONT-END =====
  'micro-front-end': {
    default: "Micro front-ends dividem aplicações em módulos independentes, permitindo desenvolvimento autônomo por diferentes equipes."
  },

  // ===== ENTREVISTA =====
  entrevista: {
    default: "Questões de entrevista técnica cobrem fundamentos, experiência prática e capacidade de resolver problemas reais."
  }
};

// Função para obter explanation
function getExplanation(question) {
  const category = question.category || 'default';
  const categoryExplanations = explanations[category] || {};
  
  // Tentar explanation específica por ID
  if (categoryExplanations[question.id]) {
    return categoryExplanations[question.id];
  }
  
  // Explanation padrão da categoria
  if (categoryExplanations.default) {
    return categoryExplanations.default;
  }
  
  // Explanation geral
  return "Conceito fundamental para desenvolvimento de software moderno e práticas profissionais da indústria.";
}

// Processar questões
data.questions.forEach((question, index) => {
  // Verificar se questão não tem explanation ou está vazia
  if (!question.explanation || question.explanation.trim() === '') {
    const newExplanation = getExplanation(question);
    question.explanation = newExplanation;
    questionsUpdated++;
    
    console.log(`✅ ID ${question.id} (${question.category || 'sem categoria'}): Explanation adicionada`);
  } else {
    console.log(`✓ ID ${question.id} (${question.category || 'sem categoria'}): Já possui explanation`);
  }
});

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = `./quizz_questions_backup_${timestamp}.json`;
fs.writeFileSync(backupFile, fs.readFileSync(filePath, 'utf8'));

// Salvar arquivo atualizado
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('\n🎉 Processamento concluído!');
console.log(`📊 Total de questões: ${data.questions.length}`);
console.log(`✅ Questões atualizadas: ${questionsUpdated}`);
console.log(`✓ Questões que já tinham explanation: ${data.questions.length - questionsUpdated}`);
console.log(`💾 Backup criado: ${backupFile}`);

// Relatório por categoria
console.log('\n📋 RELATÓRIO POR CATEGORIA:');
console.log('=====================================');

const categoryStats = {};
data.questions.forEach(question => {
  const category = question.category || 'sem categoria';
  if (!categoryStats[category]) {
    categoryStats[category] = { total: 0, hasExplanation: 0 };
  }
  categoryStats[category].total++;
  if (question.explanation && question.explanation.trim() !== '') {
    categoryStats[category].hasExplanation++;
  }
});

Object.keys(categoryStats).sort().forEach(category => {
  const stats = categoryStats[category];
  const percentage = Math.round((stats.hasExplanation / stats.total) * 100);
  console.log(`${category.padEnd(20)} | ${stats.hasExplanation}/${stats.total} (${percentage}%)`);
});

console.log('=====================================');
console.log(`🎯 Coverage geral: ${Math.round((data.questions.filter(q => q.explanation && q.explanation.trim() !== '').length / data.questions.length) * 100)}%`);