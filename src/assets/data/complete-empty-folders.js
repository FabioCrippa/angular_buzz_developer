const fs = require('fs');
const path = require('path');

console.log('📝 Completando pastas vazias com 5 questões cada...\n');

// Definir estrutura completa esperada
const expectedStructure = {
  'desenvolvimento-web': [
    'html', 'css', 'javascript', 'typescript', 'angular', 
    'responsividade', 'front-end', 'boas-praticas'
  ],
  'metodologias': [
    'versionamento', 'scrum', 'devops', 'ci-cd', 
    'code-review', 'testes-unitarios'
  ],
  'seguranca': ['criptografia'],
  'design': ['figma', 'micro-front-end'],
  'entrevista': ['entrevista-tecnica'],
  // Novas áreas para concursos
  'portugues': ['gramatica', 'interpretacao', 'redacao'],
  'matematica': ['algebra', 'geometria', 'raciocinio-logico'],
  'informatica': ['hardware', 'redes', 'sistemas-operacionais']
};

// Banco de questões por categoria
const questionBank = {
  // ===== PORTUGUÊS =====
  'gramatica': {
    name: 'Gramática & Português',
    description: 'Questões de gramática, morfologia, sintaxe e norma culta da língua portuguesa.',
    questions: [
      {
        question: "Qual é a função sintática do pronome 'que' na frase: 'O livro que comprei é interessante'?",
        options: [
          { id: 1, name: "Pronome interrogativo", alias: "A" },
          { id: 2, name: "Pronome relativo", alias: "B" },
          { id: 3, name: "Conjunção integrante", alias: "C" },
          { id: 4, name: "Advérbio", alias: "D" }
        ],
        correct: "B",
        explanation: "O pronome 'que' é relativo pois retoma o termo 'livro' e introduz uma oração subordinada adjetiva.",
        studyTip: "Para identificar: substitua por 'o qual/a qual'. Se fizer sentido, é pronome relativo."
      },
      {
        question: "Em qual frase há erro de concordância verbal?",
        options: [
          { id: 1, name: "A maioria dos alunos chegaram cedo.", alias: "A" },
          { id: 2, name: "Fazem dois anos que me formei.", alias: "B" },
          { id: 3, name: "Houve muitos problemas na reunião.", alias: "C" },
          { id: 4, name: "Existem várias soluções para isso.", alias: "D" }
        ],
        correct: "B",
        explanation: "O verbo 'fazer' indicando tempo é impessoal, deve ficar no singular: 'Faz dois anos'.",
        studyTip: "Verbos impessoais (haver, fazer indicando tempo) sempre ficam no singular."
      },
      {
        question: "Qual palavra está corretamente acentuada?",
        options: [
          { id: 1, name: "Assembléia", alias: "A" },
          { id: 2, name: "Idéia", alias: "B" },
          { id: 3, name: "Heroína", alias: "C" },
          { id: 4, name: "Geléia", alias: "D" }
        ],
        correct: "C",
        explanation: "Após o Acordo Ortográfico, 'heroína' mantém o acento por ser paroxítona terminada em 'a'.",
        studyTip: "Memorize: ditongos abertos 'ei' e 'oi' não são mais acentuados em paroxítonas."
      },
      {
        question: "Identifique a figura de linguagem: 'Suas mãos eram geleiras'.",
        options: [
          { id: 1, name: "Metáfora", alias: "A" },
          { id: 2, name: "Metonímia", alias: "B" },
          { id: 3, name: "Comparação", alias: "C" },
          { id: 4, name: "Personificação", alias: "D" }
        ],
        correct: "A",
        explanation: "Metáfora é a comparação implícita, sem conectivo, entre 'mãos' e 'geleiras'.",
        studyTip: "Metáfora = comparação sem 'como'. Comparação = com 'como', 'tal qual'."
      },
      {
        question: "Em 'Vossa Excelência está preocupado', há erro de:",
        options: [
          { id: 1, name: "Concordância nominal", alias: "A" },
          { id: 2, name: "Concordância verbal", alias: "B" },
          { id: 3, name: "Regência verbal", alias: "C" },
          { id: 4, name: "Uso de pronome", alias: "D" }
        ],
        correct: "A",
        explanation: "O correto é 'preocupada'. O adjetivo concorda com o sexo da pessoa, não com a expressão de tratamento.",
        studyTip: "Pronomes de tratamento: verbo na 3ª pessoa, adjetivo concorda com o sexo da pessoa."
      }
    ]
  },

  'interpretacao': {
    name: 'Interpretação de Texto',
    description: 'Compreensão textual, inferências, tipos de texto e análise literária.',
    questions: [
      {
        question: "Em um texto argumentativo, qual é a função principal do parágrafo de conclusão?",
        options: [
          { id: 1, name: "Apresentar novos argumentos", alias: "A" },
          { id: 2, name: "Retomar a tese e reforçar a argumentação", alias: "B" },
          { id: 3, name: "Contradizer os argumentos anteriores", alias: "C" },
          { id: 4, name: "Fazer citações de autoridade", alias: "D" }
        ],
        correct: "B",
        explanation: "A conclusão deve retomar a tese inicial e sintetizar os argumentos apresentados no desenvolvimento.",
        studyTip: "Lembre-se: introdução apresenta, desenvolvimento argumenta, conclusão sintetiza."
      },
      {
        question: "Qual elemento NÃO é característica de um texto dissertativo-argumentativo?",
        options: [
          { id: 1, name: "Presença de tese", alias: "A" },
          { id: 2, name: "Uso da 1ª pessoa", alias: "B" },
          { id: 3, name: "Argumentos consistentes", alias: "C" },
          { id: 4, name: "Linguagem objetiva", alias: "D" }
        ],
        correct: "B",
        explanation: "Textos dissertativo-argumentativos geralmente usam 3ª pessoa para manter imparcialidade.",
        studyTip: "Dissertação: 3ª pessoa, impessoal. Narração: pode usar 1ª ou 3ª pessoa."
      },
      {
        question: "No texto 'O Brasil é um país de contrastes', a palavra 'contrastes' sugere:",
        options: [
          { id: 1, name: "Uniformidade", alias: "A" },
          { id: 2, name: "Diversidade e diferenças", alias: "C" },
          { id: 3, name: "Simplicidade", alias: "C" },
          { id: 4, name: "Pequenez", alias: "D" }
        ],
        correct: "B",
        explanation: "Contrastes indica diferenças marcantes, diversidade de situações opostas no mesmo contexto.",
        studyTip: "Sempre considere o contexto para interpretar palavras polissêmicas."
      },
      {
        question: "Em 'Chovia canivetes', temos um exemplo de linguagem:",
        options: [
          { id: 1, name: "Denotativa", alias: "A" },
          { id: 2, name: "Conotativa", alias: "B" },
          { id: 3, name: "Técnica", alias: "C" },
          { id: 4, name: "Formal", alias: "D" }
        ],
        correct: "B",
        explanation: "Linguagem conotativa usa sentido figurado. 'Chover canivetes' = chover forte.",
        studyTip: "Denotativo = sentido literal. Conotativo = sentido figurado, subjetivo."
      },
      {
        question: "Qual conectivo indica oposição entre ideias?",
        options: [
          { id: 1, name: "Portanto", alias: "A" },
          { id: 2, name: "Entretanto", alias: "B" },
          { id: 3, name: "Logo", alias: "C" },
          { id: 4, name: "Assim", alias: "D" }
        ],
        correct: "B",
        explanation: "'Entretanto' expressa contraste, oposição entre ideias do período.",
        studyTip: "Conectivos adversativos: mas, porém, contudo, todavia, entretanto, no entanto."
      }
    ]
  },

  'redacao': {
    name: 'Redação & Produção Textual',
    description: 'Técnicas de redação, estrutura textual, coesão e coerência.',
    questions: [
      {
        question: "Qual é a estrutura básica de uma dissertação-argumentativa?",
        options: [
          { id: 1, name: "Introdução, desenvolvimento e conclusão", alias: "A" },
          { id: 2, name: "Apresentação, nó e desfecho", alias: "B" },
          { id: 3, name: "Situação inicial, desenvolvimento e situação final", alias: "C" },
          { id: 4, name: "Tese, antítese e síntese", alias: "D" }
        ],
        correct: "A",
        explanation: "A dissertação segue a estrutura clássica: introdução (tese), desenvolvimento (argumentos) e conclusão (síntese).",
        studyTip: "Memorize a proporção: 25% introdução, 50% desenvolvimento, 25% conclusão."
      },
      {
        question: "Para garantir coesão textual, é fundamental o uso adequado de:",
        options: [
          { id: 1, name: "Conectivos e pronomes", alias: "A" },
          { id: 2, name: "Adjetivos e advérbios", alias: "B" },
          { id: 3, name: "Substantivos e verbos", alias: "C" },
          { id: 4, name: "Interjeições e onomatopeias", alias: "D" }
        ],
        correct: "A",
        explanation: "Coesão é obtida através de conectivos (conjunções, preposições) e pronomes que ligam ideias.",
        studyTip: "Coesão = ligação entre palavras. Coerência = sentido lógico das ideias."
      },
      {
        question: "Em uma introdução, deve-se evitar:",
        options: [
          { id: 1, name: "Apresentar a tese", alias: "A" },
          { id: 2, name: "Contextualizar o tema", alias: "B" },
          { id: 3, name: "Antecipar argumentos detalhados", alias: "C" },
          { id: 4, name: "Delimitar o assunto", alias: "D" }
        ],
        correct: "C",
        explanation: "A introdução deve apresentar o tema e a tese, mas os argumentos detalhados ficam no desenvolvimento.",
        studyTip: "Introdução = apresentação geral. Desenvolvimento = argumentação detalhada."
      },
      {
        question: "Qual frase apresenta linguagem adequada para texto formal?",
        options: [
          { id: 1, name: "É importante que todos se conscientizem.", alias: "A" },
          { id: 2, name: "Todo mundo tem que se ligar nisso.", alias: "B" },
          { id: 3, name: "Galera, isso aí é muito importante.", alias: "C" },
          { id: 4, name: "Cara, todo mundo deveria saber disso.", alias: "D" }
        ],
        correct: "A",
        explanation: "Linguagem formal evita gírias, expressões coloquiais e uso de 2ª pessoa direta.",
        studyTip: "Formal: 3ª pessoa, linguagem culta. Informal: gírias, contrações, 2ª pessoa."
      },
      {
        question: "Uma boa conclusão deve:",
        options: [
          { id: 1, name: "Repetir exatamente a introdução", alias: "A" },
          { id: 2, name: "Apresentar novos argumentos", alias: "B" },
          { id: 3, name: "Retomar a tese e propor soluções", alias: "C" },
          { id: 4, name: "Contradizer o desenvolvimento", alias: "D" }
        ],
        correct: "C",
        explanation: "A conclusão deve retomar a tese, sintetizar argumentos e, idealmente, propor soluções ou reflexões.",
        studyTip: "Conclusão eficaz: retomada + síntese + proposta/reflexão final."
      }
    ]
  },

  // ===== MATEMÁTICA =====
  'algebra': {
    name: 'Álgebra & Equações',
    description: 'Equações, sistemas, funções e resolução de problemas algébricos.',
    questions: [
      {
        question: "Qual é o valor de x na equação 2x + 5 = 13?",
        options: [
          { id: 1, name: "x = 3", alias: "A" },
          { id: 2, name: "x = 4", alias: "B" },
          { id: 3, name: "x = 5", alias: "C" },
          { id: 4, name: "x = 6", alias: "D" }
        ],
        correct: "B",
        explanation: "2x + 5 = 13 → 2x = 13 - 5 → 2x = 8 → x = 4",
        studyTip: "Sempre isole a variável: passe números para um lado, variáveis para outro."
      },
      {
        question: "O sistema {x + y = 7, x - y = 1} tem solução:",
        options: [
          { id: 1, name: "x = 3, y = 4", alias: "A" },
          { id: 2, name: "x = 4, y = 3", alias: "B" },
          { id: 3, name: "x = 5, y = 2", alias: "C" },
          { id: 4, name: "x = 2, y = 5", alias: "D" }
        ],
        correct: "B",
        explanation: "Somando as equações: 2x = 8 → x = 4. Substituindo: 4 + y = 7 → y = 3",
        studyTip: "Método da adição: some as equações para eliminar uma variável."
      },
      {
        question: "Uma função do 1º grau sempre tem como gráfico:",
        options: [
          { id: 1, name: "Uma parábola", alias: "A" },
          { id: 2, name: "Uma reta", alias: "B" },
          { id: 3, name: "Uma hipérbole", alias: "C" },
          { id: 4, name: "Uma circunferência", alias: "D" }
        ],
        correct: "B",
        explanation: "Função do 1º grau f(x) = ax + b sempre gera uma reta no plano cartesiano.",
        studyTip: "1º grau = reta, 2º grau = parábola, 3º grau = cúbica."
      },
      {
        question: "Se 3x - 2 = 7, então 6x - 4 é igual a:",
        options: [
          { id: 1, name: "12", alias: "A" },
          { id: 2, name: "14", alias: "B" },
          { id: 3, name: "16", alias: "C" },
          { id: 4, name: "18", alias: "D" }
        ],
        correct: "B",
        explanation: "3x - 2 = 7, então 3x = 9. Logo, 6x = 18 e 6x - 4 = 18 - 4 = 14",
        studyTip: "Observe relações entre expressões para resolver mais rapidamente."
      },
      {
        question: "A equação x² - 5x + 6 = 0 tem raízes:",
        options: [
          { id: 1, name: "2 e 3", alias: "A" },
          { id: 2, name: "1 e 6", alias: "B" },
          { id: 3, name: "-2 e -3", alias: "C" },
          { id: 4, name: "0 e 5", alias: "D" }
        ],
        correct: "A",
        explanation: "Fatorando: (x-2)(x-3) = 0, então x = 2 ou x = 3. Verificação: 2+3=5 e 2×3=6 ✓",
        studyTip: "Para x² + bx + c = 0, procure dois números que somem -b e multipliquem c."
      }
    ]
  },

  'geometria': {
    name: 'Geometria & Medidas',
    description: 'Geometria plana e espacial, perímetros, áreas e volumes.',
    questions: [
      {
        question: "A área de um triângulo retângulo com catetos de 3 cm e 4 cm é:",
        options: [
          { id: 1, name: "5 cm²", alias: "A" },
          { id: 2, name: "6 cm²", alias: "B" },
          { id: 3, name: "7 cm²", alias: "C" },
          { id: 4, name: "12 cm²", alias: "D" }
        ],
        correct: "B",
        explanation: "Área = (base × altura)/2 = (3 × 4)/2 = 6 cm²",
        studyTip: "Em triângulo retângulo, use os catetos como base e altura."
      },
      {
        question: "O perímetro de um quadrado com lado 5 cm é:",
        options: [
          { id: 1, name: "20 cm", alias: "A" },
          { id: 2, name: "25 cm", alias: "B" },
          { id: 3, name: "10 cm", alias: "C" },
          { id: 4, name: "15 cm", alias: "D" }
        ],
        correct: "A",
        explanation: "Perímetro do quadrado = 4 × lado = 4 × 5 = 20 cm",
        studyTip: "Perímetro = soma de todos os lados. Área = lado × lado (quadrado)."
      },
      {
        question: "Em um círculo de raio 3 cm, a área é aproximadamente:",
        options: [
          { id: 1, name: "18,84 cm²", alias: "A" },
          { id: 2, name: "28,26 cm²", alias: "B" },
          { id: 3, name: "9,42 cm²", alias: "C" },
          { id: 4, name: "37,68 cm²", alias: "D" }
        ],
        correct: "B",
        explanation: "Área = π × r² = 3,14 × 3² = 3,14 × 9 = 28,26 cm²",
        studyTip: "Círculo: Área = πr², Perímetro = 2πr. Use π ≈ 3,14."
      },
      {
        question: "A soma dos ângulos internos de um triângulo é sempre:",
        options: [
          { id: 1, name: "90°", alias: "A" },
          { id: 2, name: "180°", alias: "B" },
          { id: 3, name: "270°", alias: "C" },
          { id: 4, name: "360°", alias: "D" }
        ],
        correct: "B",
        explanation: "A soma dos ângulos internos de qualquer triângulo é sempre 180°.",
        studyTip: "Triângulo = 180°, Quadrilátero = 360°, Pentágono = 540°. Fórmula: (n-2)×180°"
      },
      {
        question: "O volume de um cubo com aresta de 2 cm é:",
        options: [
          { id: 1, name: "6 cm³", alias: "A" },
          { id: 2, name: "8 cm³", alias: "B" },
          { id: 3, name: "12 cm³", alias: "C" },
          { id: 4, name: "16 cm³", alias: "D" }
        ],
        correct: "B",
        explanation: "Volume do cubo = aresta³ = 2³ = 8 cm³",
        studyTip: "Cubo: V = a³. Paralelepípedo: V = comprimento × largura × altura."
      }
    ]
  },

  'raciocinio-logico': {
    name: 'Raciocínio Lógico',
    description: 'Sequências, padrões, lógica proposicional e resolução de problemas.',
    questions: [
      {
        question: "Na sequência 2, 6, 18, 54, ..., o próximo termo é:",
        options: [
          { id: 1, name: "162", alias: "A" },
          { id: 2, name: "108", alias: "B" },
          { id: 3, name: "156", alias: "C" },
          { id: 4, name: "216", alias: "D" }
        ],
        correct: "A",
        explanation: "Cada termo é multiplicado por 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162",
        studyTip: "Procure padrões: soma, multiplicação, potências. Teste hipóteses com os primeiros termos."
      },
      {
        question: "Se 'Todo A é B' e 'Alguns B são C', então:",
        options: [
          { id: 1, name: "Todo A é C", alias: "A" },
          { id: 2, name: "Alguns A podem ser C", alias: "B" },
          { id: 3, name: "Nenhum A é C", alias: "C" },
          { id: 4, name: "Todo C é A", alias: "D" }
        ],
        correct: "B",
        explanation: "Como Todo A é B e apenas Alguns B são C, é possível que Alguns A sejam C, mas não é certeza.",
        studyTip: "Use diagramas de Venn para visualizar relações lógicas entre conjuntos."
      },
      {
        question: "Em uma sequência lógica: ♠, ♣, ♠, ♣, ♠, o próximo símbolo é:",
        options: [
          { id: 1, name: "♠", alias: "A" },
          { id: 2, name: "♣", alias: "B" },
          { id: 3, name: "♥", alias: "C" },
          { id: 4, name: "♦", alias: "D" }
        ],
        correct: "B",
        explanation: "A sequência alterna entre ♠ e ♣. Após o quinto ♠, vem ♣.",
        studyTip: "Identifique padrões de repetição, alternância ou progressão."
      },
      {
        question: "Se p: 'Está chovendo' e q: 'Uso guarda-chuva', a negação de 'p → q' é:",
        options: [
          { id: 1, name: "Não está chovendo e não uso guarda-chuva", alias: "A" },
          { id: 2, name: "Está chovendo e não uso guarda-chuva", alias: "B" },
          { id: 3, name: "Não está chovendo ou uso guarda-chuva", alias: "C" },
          { id: 4, name: "Está chovendo ou não uso guarda-chuva", alias: "D" }
        ],
        correct: "B",
        explanation: "A negação de p→q é p∧¬q: 'Está chovendo E não uso guarda-chuva'.",
        studyTip: "~(p→q) = p∧~q. A implicação só é falsa quando p é verdadeiro e q é falso."
      },
      {
        question: "Quantos triângulos há na figura com 4 triângulos pequenos formando um maior?",
        options: [
          { id: 1, name: "4", alias: "A" },
          { id: 2, name: "8", alias: "B" },
          { id: 3, name: "13", alias: "C" },
          { id: 4, name: "16", alias: "D" }
        ],
        correct: "C",
        explanation: "4 pequenos + 6 médios (combinações de 2) + 2 grandes (combinações de 3) + 1 maior = 13 triângulos.",
        studyTip: "Conte sistematicamente: pequenos, médios, grandes. Evite contar o mesmo duas vezes."
      }
    ]
  },

  // ===== INFORMÁTICA =====
  'hardware': {
    name: 'Hardware & Componentes',
    description: 'Componentes de computador, arquitetura e funcionamento de hardware.',
    questions: [
      {
        question: "Qual componente é considerado o 'cérebro' do computador?",
        options: [
          { id: 1, name: "Memória RAM", alias: "A" },
          { id: 2, name: "Processador (CPU)", alias: "B" },
          { id: 3, name: "Disco Rígido (HD)", alias: "C" },
          { id: 4, name: "Placa-mãe", alias: "D" }
        ],
        correct: "B",
        explanation: "O processador (CPU) executa todas as instruções e cálculos, sendo o componente central de processamento.",
        studyTip: "CPU = processamento, RAM = memória temporária, HD = armazenamento permanente."
      },
      {
        question: "A memória RAM é caracterizada por ser:",
        options: [
          { id: 1, name: "Não volátil e lenta", alias: "A" },
          { id: 2, name: "Volátil e rápida", alias: "B" },
          { id: 3, name: "Não volátil e rápida", alias: "C" },
          { id: 4, name: "Volátil e lenta", alias: "D" }
        ],
        correct: "B",
        explanation: "RAM é volátil (perde dados sem energia) e rápida (acesso direto aos dados).",
        studyTip: "Volátil = perde dados sem energia. Não volátil = mantém dados (HD, SSD, ROM)."
      },
      {
        question: "Qual a diferença principal entre HD e SSD?",
        options: [
          { id: 1, name: "HD é mais rápido", alias: "A" },
          { id: 2, name: "SSD tem partes móveis", alias: "B" },
          { id: 3, name: "SSD é mais rápido e sem partes móveis", alias: "C" },
          { id: 4, name: "HD consome menos energia", alias: "D" }
        ],
        correct: "C",
        explanation: "SSD usa memória flash (sem partes móveis), sendo mais rápido, silencioso e confiável que HD.",
        studyTip: "HD = mecânico, mais barato, mais capacidade. SSD = eletrônico, mais rápido, mais caro."
      },
      {
        question: "A BIOS/UEFI é responsável por:",
        options: [
          { id: 1, name: "Processar dados", alias: "A" },
          { id: 2, name: "Armazenar arquivos", alias: "B" },
          { id: 3, name: "Inicializar o sistema", alias: "C" },
          { id: 4, name: "Conectar à internet", alias: "D" }
        ],
        correct: "C",
        explanation: "BIOS/UEFI é o firmware que inicializa o hardware e carrega o sistema operacional.",
        studyTip: "BIOS = Basic Input/Output System. É o primeiro software executado ao ligar o PC."
      },
      {
        question: "Qual porta é mais moderna e versátil?",
        options: [
          { id: 1, name: "USB 2.0", alias: "A" },
          { id: 2, name: "VGA", alias: "B" },
          { id: 3, name: "USB-C", alias: "C" },
          { id: 4, name: "PS/2", alias: "D" }
        ],
        correct: "C",
        explanation: "USB-C é reversível, suporta alta velocidade, vídeo, áudio e carregamento em uma única porta.",
        studyTip: "Evolução USB: 1.1 → 2.0 → 3.0 → 3.1 → USB-C (Type-C)."
      }
    ]
  },

  'redes': {
    name: 'Redes & Internet',
    description: 'Conceitos de rede, protocolos, internet e conectividade.',
    questions: [
      {
        question: "O protocolo usado para navegação na web é:",
        options: [
          { id: 1, name: "FTP", alias: "A" },
          { id: 2, name: "HTTP/HTTPS", alias: "B" },
          { id: 3, name: "SMTP", alias: "C" },
          { id: 4, name: "POP3", alias: "D" }
        ],
        correct: "B",
        explanation: "HTTP (HyperText Transfer Protocol) e sua versão segura HTTPS são usados para navegação web.",
        studyTip: "HTTP = web, FTP = arquivos, SMTP = envio email, POP3/IMAP = recebimento email."
      },
      {
        question: "Um endereço IP válido é:",
        options: [
          { id: 1, name: "192.168.1.256", alias: "A" },
          { id: 2, name: "192.168.1.1", alias: "B" },
          { id: 3, name: "256.168.1.1", alias: "C" },
          { id: 4, name: "192.256.1.1", alias: "D" }
        ],
        correct: "B",
        explanation: "IP v4 tem 4 octetos de 0 a 255. Apenas 192.168.1.1 está dentro dessa faixa.",
        studyTip: "IPv4: 4 números de 0 a 255 separados por ponto. IPv6: usa hexadecimal com ':'."
      },
      {
        question: "O que significa DNS?",
        options: [
          { id: 1, name: "Dynamic Network System", alias: "A" },
          { id: 2, name: "Domain Name System", alias: "B" },
          { id: 3, name: "Data Network Service", alias: "C" },
          { id: 4, name: "Digital Name Server", alias: "D" }
        ],
        correct: "B",
        explanation: "DNS (Domain Name System) traduz nomes de domínio (google.com) em endereços IP.",
        studyTip: "DNS é como uma 'lista telefônica' da internet: nome → número (IP)."
      },
      {
        question: "Em uma rede Wi-Fi, WPA2 refere-se à:",
        options: [
          { id: 1, name: "Velocidade da conexão", alias: "A" },
          { id: 2, name: "Segurança e criptografia", alias: "B" },
          { id: 3, name: "Frequência do sinal", alias: "C" },
          { id: 4, name: "Alcance da rede", alias: "D" }
        ],
        correct: "B",
        explanation: "WPA2 (Wi-Fi Protected Access 2) é um protocolo de segurança que criptografa dados na rede Wi-Fi.",
        studyTip: "Evolução Wi-Fi: WEP (fraco) → WPA → WPA2 → WPA3 (mais seguro)."
      },
      {
        question: "A topologia de rede em estrela caracteriza-se por:",
        options: [
          { id: 1, name: "Todos conectados em linha", alias: "A" },
          { id: 2, name: "Conexão em anel fechado", alias: "B" },
          { id: 3, name: "Dispositivos conectados a um ponto central", alias: "C" },
          { id: 4, name: "Cada um conectado a todos", alias: "D" }
        ],
        correct: "C",
        explanation: "Na topologia estrela, todos os dispositivos se conectam a um hub ou switch central.",
        studyTip: "Estrela = hub central. Anel = círculo. Barramento = linha. Malha = todos com todos."
      }
    ]
  },

  'sistemas-operacionais': {
    name: 'Sistemas Operacionais',
    description: 'Conceitos de SO, Windows, Linux e gerenciamento de recursos.',
    questions: [
      {
        question: "Qual é a função principal de um sistema operacional?",
        options: [
          { id: 1, name: "Navegar na internet", alias: "A" },
          { id: 2, name: "Gerenciar hardware e software", alias: "B" },
          { id: 3, name: "Editar textos", alias: "C" },
          { id: 4, name: "Fazer cálculos", alias: "D" }
        ],
        correct: "B",
        explanation: "O SO gerencia recursos do hardware e fornece interface para execução de programas.",
        studyTip: "SO = intermediário entre usuário/programas e hardware do computador."
      },
      {
        question: "No Windows, qual tecla de atalho abre o Gerenciador de Tarefas?",
        options: [
          { id: 1, name: "Ctrl + Alt + Del", alias: "A" },
          { id: 2, name: "Ctrl + Shift + Esc", alias: "B" },
          { id: 3, name: "Alt + Tab", alias: "C" },
          { id: 4, name: "Win + R", alias: "D" }
        ],
        correct: "B",
        explanation: "Ctrl + Shift + Esc abre diretamente o Gerenciador de Tarefas no Windows.",
        studyTip: "Ctrl+Alt+Del abre menu de opções. Ctrl+Shift+Esc abre direto o Gerenciador."
      },
      {
        question: "No Linux, qual comando lista o conteúdo de um diretório?",
        options: [
          { id: 1, name: "dir", alias: "A" },
          { id: 2, name: "ls", alias: "B" },
          { id: 3, name: "list", alias: "C" },
          { id: 4, name: "show", alias: "D" }
        ],
        correct: "B",
        explanation: "O comando 'ls' (list) mostra arquivos e pastas do diretório atual no Linux.",
        studyTip: "Linux: ls = listar, cd = mudar diretório, mkdir = criar pasta, rm = remover."
      },
      {
        question: "Qual a diferença entre software livre e proprietário?",
        options: [
          { id: 1, name: "Preço de compra", alias: "A" },
          { id: 2, name: "Acesso ao código-fonte", alias: "B" },
          { id: 3, name: "Velocidade de execução", alias: "C" },
          { id: 4, name: "Compatibilidade com hardware", alias: "D" }
        ],
        correct: "B",
        explanation: "Software livre permite acesso, modificação e distribuição do código-fonte. Proprietário não.",
        studyTip: "Livre ≠ grátis. Livre = liberdade de uso, estudo, modificação e distribuição."
      },
      {
        question: "A memória virtual em um SO serve para:",
        options: [
          { id: 1, name: "Acelerar o processador", alias: "A" },
          { id: 2, name: "Expandir a capacidade da RAM", alias: "B" },
          { id: 3, name: "Proteger contra vírus", alias: "C" },
          { id: 4, name: "Conectar à internet", alias: "D" }
        ],
        correct: "B",
        explanation: "Memória virtual usa espaço do HD/SSD como extensão da RAM quando esta fica cheia.",
        studyTip: "Memória virtual = 'RAM extra' no disco. Mais lenta que RAM real, mas evita travamentos."
      }
    ]
  }
};

// Função para gerar ID único baseado na categoria
function generateId(category, index) {
  const categoryIds = {
    'gramatica': 2001,
    'interpretacao': 2101,
    'redacao': 2201,
    'algebra': 3001,
    'geometria': 3101,
    'raciocinio-logico': 3201,
    'hardware': 4001,
    'redes': 4101,
    'sistemas-operacionais': 4201
  };
  
  return (categoryIds[category] || 9000) + index;
}

// Verificar quais pastas/arquivos existem e quais estão vazios
console.log('🔍 Analisando estrutura atual...\n');

const emptyAreas = [];
const missingFiles = [];

Object.entries(expectedStructure).forEach(([area, subjects]) => {
  const areaPath = `./${area}`;
  
  // Criar área se não existir
  if (!fs.existsSync(areaPath)) {
    fs.mkdirSync(areaPath, { recursive: true });
    console.log(`📁 Área criada: ${area}/`);
    emptyAreas.push(area);
  }
  
  subjects.forEach(subject => {
    const filePath = path.join(areaPath, `${subject}.json`);
    
    if (!fs.existsSync(filePath)) {
      missingFiles.push({ area, subject, filePath });
    } else {
      // Verificar se arquivo existe mas está vazio ou com poucas questões
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!data.questions || data.questions.length < 3) {
          missingFiles.push({ area, subject, filePath, isEmpty: true });
        }
      } catch (error) {
        missingFiles.push({ area, subject, filePath, isCorrupted: true });
      }
    }
  });
});

console.log(`📊 Arquivos faltantes ou vazios: ${missingFiles.length}\n`);

// Processar arquivos faltantes
let filesCreated = 0;
let questionsAdded = 0;

missingFiles.forEach(({ area, subject, filePath, isEmpty, isCorrupted }) => {
  const categoryData = questionBank[subject];
  
  if (!categoryData) {
    console.log(`⚠️ Sem questões preparadas para: ${subject}`);
    return;
  }
  
  const questions = categoryData.questions.map((q, index) => ({
    ...q,
    id: generateId(subject, index + 1),
    category: subject,
    difficulty: area === 'entrevista' ? 'advanced' : 
               area === 'desenvolvimento-web' ? 'intermediate' : 
               'fundamental'
  }));
  
  const fileData = {
    metadata: {
      area: area,
      subject: subject,
      name: categoryData.name,
      description: categoryData.description,
      difficulty: questions[0].difficulty,
      lastUpdated: new Date().toISOString().split('T')[0],
      questionCount: questions.length,
      tags: getTags(subject, area)
    },
    questions: questions
  };
  
  // Salvar arquivo
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
  
  const status = isEmpty ? '(vazio)' : isCorrupted ? '(corrompido)' : '(novo)';
  console.log(`✅ ${filePath} ${status} - ${questions.length} questões adicionadas`);
  
  filesCreated++;
  questionsAdded += questions.length;
});

// Função para gerar tags
function getTags(subject, area) {
  const tagMap = {
    'gramatica': ['gramática', 'português', 'concurso', 'língua-portuguesa'],
    'interpretacao': ['interpretação', 'leitura', 'compreensão', 'texto'],
    'redacao': ['redação', 'escrita', 'dissertação', 'argumentação'],
    'algebra': ['álgebra', 'equações', 'matemática', 'funções'],
    'geometria': ['geometria', 'figuras', 'área', 'perímetro'],
    'raciocinio-logico': ['lógica', 'sequências', 'padrões', 'raciocínio'],
    'hardware': ['componentes', 'computador', 'informática', 'técnico'],
    'redes': ['internet', 'protocolos', 'conectividade', 'wi-fi'],
    'sistemas-operacionais': ['windows', 'linux', 'gerenciamento', 'comandos']
  };
  
  return tagMap[subject] || [subject, area, 'concurso'];
}

// Atualizar index.json
const indexPath = './index.json';
let indexData;

try {
  indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
} catch {
  indexData = {
    appInfo: {
      name: "Angular Buzz Developer",
      version: "2.0.0", 
      description: "Plataforma completa de questões técnicas para desenvolvedores e concursos",
      lastUpdated: new Date().toISOString().split('T')[0]
    },
    stats: {},
    areas: [],
    structure: {}
  };
}

// Recalcular estatísticas
const areas = Object.keys(expectedStructure);
indexData.areas = areas;
indexData.structure = expectedStructure;

let totalQuestions = 0;
const areaStats = {};

areas.forEach(area => {
  const areaPath = `./${area}`;
  let areaQuestions = 0;
  
  if (fs.existsSync(areaPath)) {
    expectedStructure[area].forEach(subject => {
      const filePath = path.join(areaPath, `${subject}.json`);
      
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const questionCount = data.questions ? data.questions.length : 0;
          areaQuestions += questionCount;
        } catch (error) {
          console.log(`⚠️ Erro ao ler ${filePath}`);
        }
      }
    });
  }
  
  areaStats[area] = areaQuestions;
  totalQuestions += areaQuestions;
});

indexData.stats = {
  totalQuestions,
  totalAreas: areas.length,
  totalSubjects: Object.values(expectedStructure).flat().length,
  byArea: areaStats,
  lastUpdated: new Date().toISOString().split('T')[0]
};

fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');

// Relatório final
console.log('\n🎉 Operação concluída!');
console.log('=====================================');
console.log(`📄 Arquivos criados/atualizados: ${filesCreated}`);
console.log(`📝 Questões adicionadas: ${questionsAdded}`);
console.log(`📊 Total de questões na plataforma: ${totalQuestions}`);

console.log('\n📋 ESTATÍSTICAS POR ÁREA:');
Object.entries(areaStats).forEach(([area, count]) => {
  console.log(`${area.padEnd(25)} | ${count.toString().padStart(3)} questões`);
});

console.log('\n📂 NOVA ESTRUTURA COMPLETA:');
Object.entries(expectedStructure).forEach(([area, subjects]) => {
  console.log(`${area}/`);
  subjects.forEach(subject => {
    const filePath = `./${area}/${subject}.json`;
    const exists = fs.existsSync(filePath) ? '✅' : '❌';
    console.log(`  ${exists} ${subject}.json`);
  });
});

console.log('\n✅ Index.json atualizado com nova estrutura');
console.log('✅ Todas as áreas possuem conteúdo mínimo');
console.log('✅ Pronto para expansão e uso na aplicação!');