import * as fs from 'fs';

// Carregar o JSON existente
const quizzQuestions = require('./quizz_questions.json');

// Obter todas as categorias únicas
const categories = Array.from(new Set(quizzQuestions.questions.map((q: any) => q.category)));

// Criar uma nova lista de perguntas com 10 perguntas por categoria
const newQuestions = categories.map(category => {
  const questionsForCategory = quizzQuestions.questions.filter((q: any) => q.category === category);
  return questionsForCategory.slice(0, 10); // Pegar no máximo 10 perguntas por categoria
}).flat(); // Combinar todas as categorias em uma única lista

// Remover a propriedade 'difficulty' de cada pergunta
newQuestions.forEach((q: any) => {
  delete q.difficulty;
});

// Criar o novo JSON
const newQuizzQuestions = {
  title: quizzQuestions.title,
  questions: newQuestions,
  results: quizzQuestions.results
};

// Salvar o novo JSON em um arquivo
fs.writeFileSync('./new_quizz_questions.json', JSON.stringify(newQuizzQuestions, null, 2));

console.log('Novo JSON gerado com sucesso!');