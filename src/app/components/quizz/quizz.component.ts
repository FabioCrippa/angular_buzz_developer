// Importações principais do Angular e dependências necessárias
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ✅ INTERFACES ESSENCIAIS
interface QuestionOption {
  id: number;
  name: string;
  alias: string;
}

interface Question {
  id: number;
  category: string;
  question: string;
  options: QuestionOption[];
  correct: string;
  explanation: string;
  interviewTip?: string;
  difficulty?: string;
  studyTip?: string;
  examTip?: string;
}

interface QuestionFile {
  metadata: {
    area: string;
    subject: string;
    name: string;
    description: string;
    questionCount: number;
  };
  questions: Question[];
}

interface IndexData {
  appInfo: {
    name: string;
    version: string;
    description: string;
  };
  stats: {
    totalQuestions: number;
    byArea: { [key: string]: number };
  };
  structure: { [key: string]: string[] };
}

@Component({
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css']
})
export class QuizzComponent implements OnInit {
  
  // Estados do componente
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Dados do quiz
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  selectedAnswer: string = '';
  showExplanation: boolean = false;
  quizCompleted: boolean = false;
  
  // Estatísticas
  score: number = 0;
  correctAnswers: number = 0;
  totalQuestions: number = 0;
  answers: { [key: number]: string } = {};
  
  // Configuração da rota
  area: string = '';
  subject: string = '';
  
  // Timer
  timeSpent: number = 0;
  startTime: Date = new Date();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando Quizz Component');
    
    // Debug inicial
    this.debugQuizState();
    
    this.route.params.subscribe(params => {
      this.area = params['area'] || '';
      this.subject = params['subject'] || '';
      
      console.log('📋 Parâmetros da rota:', { area: this.area, subject: this.subject });
      
      this.loadQuestions();
    });

    this.route.queryParams.subscribe(queryParams => {
      const questionLimit = queryParams['limit'];
      if (questionLimit) {
        console.log(`🔢 Limite de questões: ${questionLimit}`);
      }
    });
  }

  private loadQuestions() {
    console.log('📚 Carregando questões...');
    
    this.isLoading = true;
    this.hasError = false;
    this.startTime = new Date();

    if (this.area && this.subject) {
      console.log(`🎯 Carregando questões específicas: ${this.area}/${this.subject}`);
      this.loadSubjectQuestions();
    } else if (this.area) {
      console.log(`📖 Carregando questões da área: ${this.area}`);
      this.loadAreaQuestions();
    } else {
      console.log('🎲 Carregando questões mistas');
      this.loadMixedQuestions();
    }
  }

  private loadSubjectQuestions() {
    const filePath = `assets/data/${this.area}/${this.subject}.json`;
    console.log(`📁 Tentando carregar: ${filePath}`);
    
    this.http.get<QuestionFile>(filePath).subscribe({
      next: (data) => {
        console.log('✅ Arquivo carregado com sucesso:', data);
        
        if (data.questions && data.questions.length > 0) {
          this.questions = this.shuffleArray([...data.questions]);
          this.totalQuestions = this.questions.length;
          this.isLoading = false;
          
          console.log(`🎉 ${this.totalQuestions} questões carregadas e embaralhadas`);
        } else {
          this.showError('Nenhuma questão encontrada para esta disciplina.');
        }
      },
      error: (error) => {
        console.error('❌ Erro ao carregar questões:', error);
        this.showError(`Erro ao carregar questões de ${this.subject}. Arquivo não encontrado ou inválido.`);
      }
    });
  }

  private loadAreaQuestions() {
    console.log(`📊 Carregando index para área: ${this.area}`);
    
    this.http.get<IndexData>('assets/data/index.json').subscribe({
      next: (indexData) => {
        console.log('📋 Index carregado:', indexData);
        
        const subjects = indexData.structure[this.area] || [];
        
        if (subjects.length === 0) {
          this.showError(`Nenhuma disciplina encontrada na área "${this.area}".`);
          return;
        }

        console.log(`📚 Disciplinas encontradas: ${subjects.join(', ')}`);

        const requests = subjects.map(subject => {
          const filePath = `assets/data/${this.area}/${subject}.json`;
          return this.http.get<QuestionFile>(filePath).pipe(
            catchError(error => {
              console.warn(`⚠️ Erro ao carregar ${subject}:`, error);
              return of(null);
            })
          );
        });

        forkJoin(requests).subscribe({
          next: (results) => {
            const allQuestions: Question[] = [];
            let filesLoaded = 0;
            
            results.forEach((result, index) => {
              if (result && result.questions) {
                allQuestions.push(...result.questions);
                filesLoaded++;
                console.log(`✅ ${subjects[index]}: ${result.questions.length} questões`);
              }
            });

            console.log(`📊 Total: ${allQuestions.length} questões de ${filesLoaded} arquivos`);

            if (allQuestions.length > 0) {
              this.questions = this.shuffleArray(allQuestions).slice(0, 25);
              this.totalQuestions = this.questions.length;
              this.isLoading = false;
              
              console.log(`🎯 Quiz preparado com ${this.totalQuestions} questões`);
            } else {
              this.showError(`Nenhuma questão válida encontrada na área "${this.area}".`);
            }
          },
          error: (error) => {
            console.error('❌ Erro ao carregar questões da área:', error);
            this.showError('Erro ao carregar questões da área.');
          }
        });
      },
      error: (error) => {
        console.error('❌ Erro ao carregar index:', error);
        this.showError('Erro ao carregar configuração do sistema.');
      }
    });
  }

  private loadMixedQuestions() {
    console.log('🎲 Preparando quiz misto com questões de várias áreas');
    
    this.http.get<IndexData>('assets/data/index.json').subscribe({
      next: (indexData) => {
        const allRequests: Observable<QuestionFile | null>[] = [];
        
        Object.entries(indexData.structure).forEach(([area, subjects]) => {
          subjects.forEach(subject => {
            const request = this.http.get<QuestionFile>(`assets/data/${area}/${subject}.json`).pipe(
              catchError(error => {
                console.warn(`⚠️ Erro ao carregar ${area}/${subject}:`, error);
                return of(null);
              })
            );
            allRequests.push(request);
          });
        });

        console.log(`📊 Tentando carregar ${allRequests.length} arquivos diferentes`);

        forkJoin(allRequests).subscribe({
          next: (results) => {
            const allQuestions: Question[] = [];
            let filesLoaded = 0;
            
            results.forEach(result => {
              if (result && result.questions && result.questions.length > 0) {
                const selectedQuestions = this.shuffleArray(result.questions).slice(0, 3);
                allQuestions.push(...selectedQuestions);
                filesLoaded++;
              }
            });

            console.log(`🎯 Quiz misto: ${allQuestions.length} questões de ${filesLoaded} fontes`);

            if (allQuestions.length > 0) {
              this.questions = this.shuffleArray(allQuestions).slice(0, 20);
              this.totalQuestions = this.questions.length;
              this.isLoading = false;
              
              console.log(`🎉 Quiz misto pronto: ${this.totalQuestions} questões`);
            } else {
              this.showError('Nenhuma questão encontrada no sistema.');
            }
          },
          error: (error) => {
            console.error('❌ Erro ao carregar questões mistas:', error);
            this.showError('Erro ao carregar questões do sistema.');
          }
        });
      },
      error: (error) => {
        console.error('❌ Erro ao carregar configuração:', error);
        this.showError('Erro ao acessar configuração do sistema.');
      }
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private showError(message: string) {
    console.error('❌ Erro no quiz:', message);
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }

  // Getters para o template
  get currentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progressPercentage(): number {
    return this.totalQuestions > 0 ? ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100 : 0;
  }

  get questionNumber(): string {
    return `${this.currentQuestionIndex + 1} de ${this.totalQuestions}`;
  }

  get canGoNext(): boolean {
    return this.currentQuestionIndex < this.totalQuestions - 1;
  }

  get canGoPrevious(): boolean {
    return this.currentQuestionIndex > 0;
  }

  // Propriedades para compatibilidade com template
  get title(): string {
    if (this.area && this.subject) {
      return `${this.getAreaDisplayName(this.area)} - ${this.subject.charAt(0).toUpperCase() + this.subject.slice(1)}`;
    } else if (this.area) {
      return this.getAreaDisplayName(this.area);
    }
    return 'Quiz Misto';
  }

  get questionIndex(): number {
    return this.currentQuestionIndex;
  }

  get finished(): boolean {
    return this.quizCompleted;
  }

  get progress(): number {
    return Math.round(this.progressPercentage);
  }

  get showFeedback(): boolean {
    return this.showExplanation;
  }

  get quizResult(): any {
    if (!this.quizCompleted) return null;
    
    return {
      score: this.correctAnswers,
      total: this.totalQuestions,
      percentage: this.score,
      categoryResults: this.getCategoryResults()
    };
  }

  // Métodos de interação
  selectAnswer(alias: string) {
    console.log('🖱️ Clique detectado na alternativa:', alias);
    
    // Verifica se o quiz não está em modo de explicação
    if (this.showExplanation) {
      console.warn('⚠️ Não é possível alterar resposta - explicação já mostrada');
      return;
    }
    
    // Verifica se alias é válido
    if (!alias || typeof alias !== 'string') {
      console.error('❌ Alias inválido:', alias);
      return;
    }
    
    // Atualiza a resposta selecionada
    this.selectedAnswer = alias;
    console.log(`✅ Resposta selecionada: ${alias}`);
    
    // Log adicional para debug
    console.log('📊 Estado atual:', {
      selectedAnswer: this.selectedAnswer,
      showExplanation: this.showExplanation,
      currentQuestionIndex: this.currentQuestionIndex
    });
  }

  // ✅ MÉTODO SUBMITANSWER CORRIGIDO
  submitAnswer() {
    console.log('📤 Tentativa de submeter resposta');
    console.log('📊 Estado antes da submissão:', {
      selectedAnswer: this.selectedAnswer,
      showExplanation: this.showExplanation,
      currentQuestion: this.currentQuestion?.id
    });
    
    // Validações
    if (!this.selectedAnswer) {
      console.warn('⚠️ Nenhuma resposta selecionada');
      alert('Por favor, selecione uma alternativa antes de continuar.');
      return;
    }
    
    if (this.showExplanation) {
      console.warn('⚠️ Resposta já foi submetida');
      return;
    }
    
    if (!this.currentQuestion) {
      console.error('❌ Questão atual não encontrada');
      return;
    }

    const currentQ = this.currentQuestion;
    const isCorrect = this.selectedAnswer === currentQ.correct;
    
    // Registra a resposta
    this.answers[currentQ.id] = this.selectedAnswer;
    
    // Atualiza estatísticas
    if (isCorrect) {
      this.correctAnswers++;
      console.log('✅ Resposta correta!');
    } else {
      console.log(`❌ Resposta incorreta. Correta era: ${currentQ.correct}`);
    }

    // Mostra explicação
    this.showExplanation = true;
    
    console.log('📊 Estado após submissão:', {
      correctAnswers: this.correctAnswers,
      showExplanation: this.showExplanation,
      totalAnswered: Object.keys(this.answers).length
    });
  }

  // ✅ MÉTODO NEXTQUESTION CORRIGIDO
  nextQuestion() {
    console.log('➡️ Tentativa de ir para próxima questão');
    
    // Se ainda não submeteu a resposta, submete automaticamente
    if (this.selectedAnswer && !this.showExplanation) {
      console.log('📤 Auto-submetendo resposta antes de avançar');
      this.submitAnswer();
      return; // Para aqui, deixa o usuário clicar novamente para avançar
    }
    
    if (this.canGoNext) {
      this.currentQuestionIndex++;
      
      // Reset do estado para a próxima questão
      this.selectedAnswer = '';
      this.showExplanation = false;
      
      console.log(`➡️ Avançou para questão: ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
      
      // Log da nova questão
      console.log('📋 Nova questão:', {
        id: this.currentQuestion?.id,
        question: this.currentQuestion?.question?.substring(0, 50) + '...',
        options: this.currentQuestion?.options?.length
      });
      
    } else {
      console.log('🏁 Última questão - finalizando quiz');
      this.completeQuiz();
    }
  }

  previousQuestion() {
    if (this.canGoPrevious) {
      this.currentQuestionIndex--;
      this.selectedAnswer = '';
      this.showExplanation = false;
      
      console.log(`⬅️ Questão anterior: ${this.currentQuestionIndex + 1}`);
    }
  }

  completeQuiz() {
    this.quizCompleted = true;
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    this.timeSpent = Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
    
    console.log('🏆 Quiz completado!', {
      score: this.score,
      correctAnswers: this.correctAnswers,
      totalQuestions: this.totalQuestions,
      timeSpent: this.timeSpent
    });
  }

  restartQuiz() {
    console.log('🔄 Reiniciando quiz');
    
    this.currentQuestionIndex = 0;
    this.selectedAnswer = '';
    this.showExplanation = false;
    this.quizCompleted = false;
    this.correctAnswers = 0;
    this.score = 0;
    this.answers = {};
    this.timeSpent = 0;
    this.startTime = new Date();
    
    this.questions = this.shuffleArray(this.questions);
  }

  goHome() {
    console.log('🏠 Voltando para home');
    this.router.navigate(['/']);
  }

  reloadQuestions() {
    console.log('🔄 Recarregando questões');
    this.loadQuestions();
  }

  // Métodos para o template
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  // ✅ MÉTODO GETOPTIONCLASS CORRIGIDO
  getOptionClass(alias: string): string {
    console.log(`🎨 Calculando classe para: ${alias}`, {
      selectedAnswer: this.selectedAnswer,
      showExplanation: this.showExplanation,
      correctAnswer: this.currentQuestion?.correct
    });
    
    const classes: string[] = ['option'];
    
    // Adiciona classe 'selected' se esta é a resposta selecionada
    if (this.selectedAnswer === alias) {
      classes.push('selected');
      console.log(`✅ Classe 'selected' adicionada para: ${alias}`);
    }
    
    // Se está mostrando explicação, adiciona classes de feedback
    if (this.showExplanation) {
      if (alias === this.currentQuestion?.correct) {
        classes.push('correct');
        console.log(`✅ Classe 'correct' adicionada para: ${alias}`);
      } else if (alias === this.selectedAnswer && alias !== this.currentQuestion?.correct) {
        classes.push('incorrect');
        console.log(`❌ Classe 'incorrect' adicionada para: ${alias}`);
      }
    }
    
    const finalClasses = classes.join(' ');
    console.log(`🎨 Classes finais para ${alias}: ${finalClasses}`);
    
    return finalClasses;
  }

  isCorrectAnswer(alias: string): boolean {
    return alias === this.currentQuestion?.correct;
  }

  finishQuiz(): void {
    this.completeQuiz();
  }

  getCategoryResults(): any[] {
    if (!this.questions.length) return [];
    
    const categoryStats: { [key: string]: { correct: number; total: number } } = {};
    
    this.questions.forEach(question => {
      const category = question.category || 'Geral';
      
      if (!categoryStats[category]) {
        categoryStats[category] = { correct: 0, total: 0 };
      }
      
      categoryStats[category].total++;
      
      if (this.answers[question.id] === question.correct) {
        categoryStats[category].correct++;
      }
    });
    
    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }));
  }

  getCategoryTitle(category: string): string {
    const categoryTitles: { [key: string]: string } = {
      'html': 'HTML',
      'css': 'CSS', 
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'angular': 'Angular',
      'responsividade': 'Responsividade',
      'front-end': 'Front-End',
      'boas-praticas': 'Boas Práticas',
      'versionamento': 'Versionamento',
      'scrum': 'Scrum/Agile',
      'devops': 'DevOps',
      'ci-cd': 'CI/CD',
      'code-review': 'Code Review',
      'testes-unitarios': 'Testes Unitários',
      'criptografia': 'Criptografia',
      'figma': 'Figma/Design',
      'micro-front-end': 'Micro Front-End',
      'entrevista-tecnica': 'Entrevista Técnica',
      'gramatica': 'Gramática',
      'interpretacao': 'Interpretação',
      'redacao': 'Redação',
      'algebra': 'Álgebra',
      'geometria': 'Geometria',
      'raciocinio-logico': 'Raciocínio Lógico',
      'hardware': 'Hardware',
      'redes': 'Redes',
      'sistemas-operacionais': 'Sistemas Operacionais'
    };
    
    return categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  getAreaDisplayName(area: string): string {
    const displayNames: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'metodologias': 'Metodologias Ágeis',
      'seguranca': 'Segurança',
      'design': 'Design & UX',
      'entrevista': 'Preparação para Entrevista',
      'portugues': 'Português',
      'matematica': 'Matemática',
      'informatica': 'Informática'
    };
    
    return displayNames[area] || area.charAt(0).toUpperCase() + area.slice(1);
  }

  // Funcionalidade de áudio (básica)
  readText(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      speechSynthesis.speak(utterance);
      console.log('🔊 Reproduzindo áudio:', text.substring(0, 50) + '...');
    } else {
      console.warn('⚠️ Speech Synthesis não suportado neste navegador');
    }
  }

  // ✅ MÉTODO DE DEBUG
  debugQuizState() {
    console.log('🔍 ESTADO COMPLETO DO QUIZ:', {
      isLoading: this.isLoading,
      hasError: this.hasError,
      questions: this.questions.length,
      currentQuestionIndex: this.currentQuestionIndex,
      currentQuestion: this.currentQuestion,
      selectedAnswer: this.selectedAnswer,
      showExplanation: this.showExplanation,
      quizCompleted: this.quizCompleted,
      correctAnswers: this.correctAnswers,
      totalQuestions: this.totalQuestions
    });
  }

  // ✅ ADICIONAR NO COMPONENT
  Math = Math; // Para usar Math.round e Math.floor no template
}
