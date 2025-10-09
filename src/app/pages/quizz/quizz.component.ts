// Importações principais do Angular e dependências necessárias
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // ✅ ADICIONAR MAP AQUI
import { MatSnackBar } from '@angular/material/snack-bar';

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
  
  // ✅ PROPRIEDADES FALTANTES
  mode: string = 'mixed'; // ✅ ADICIONAR ESTA LINHA
  
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

  // ✅ ADICIONAR NO CONSTRUCTOR
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar // ✅ ADICIONAR ESTA LINHA
  ) {}

  // ✅ ADICIONAR PROPRIEDADES PARA O INDEX
  appInfo: any = null;
  availableAreas: string[] = [];
  areaStructure: any = {};
  areaStats: any = {};

  // ✅ MÉTODO ngOnInit CORRIGIDO
  ngOnInit(): void {
    console.log('🚀 Inicializando Quizz Component');
    
    // ✅ CARREGAR PARÂMETROS DA ROTA E QUERY PARAMS
    this.route.params.subscribe(params => {
      this.area = params['area'] || '';
      this.subject = params['subject'] || '';
      
      console.log('📋 Parâmetros da rota:', { 
        area: this.area, 
        subject: this.subject 
      });
    });

    // ✅ CARREGAR QUERY PARAMETERS (IMPORTANTE!)
    this.route.queryParams.subscribe(queryParams => {
      const queryMode = queryParams['mode'];
      const queryType = queryParams['type'];
      const questionLimit = queryParams['limit'];
      
      console.log('🔍 Query parameters:', { queryMode, queryType, questionLimit });
      
      // ✅ DETERMINAR O MODO BASEADO EM PARÂMETROS E QUERY
      if (queryMode === 'mixed' || queryType === 'free-trial') {
        this.mode = 'mixed';
        console.log('🎲 Modo definido: Quiz Misto (Teste Grátis)');
      } else if (this.area && this.subject) {
        this.mode = 'subject';
      } else if (this.area) {
        this.mode = 'area';
      } else {
        this.mode = 'mixed';
        console.log('🎲 Modo padrão: Quiz Misto');
      }
      
      console.log(`🎯 Modo final determinado: ${this.mode}`);
      
      // ✅ CARREGAR QUESTÕES
      this.startTime = new Date();
      this.loadAppIndex();
    });
  }

  // ✅ MÉTODO PARA CARREGAR O INDEX PRIMEIRO
  private loadAppIndex(): void {
    console.log('📋 Carregando índice da aplicação...');
    
    this.http.get<any>('assets/data/index.json').subscribe({
      next: (indexData) => {
        console.log('✅ Index carregado:', indexData);
        
        // ✅ CARREGAR DADOS DO INDEX
        this.appInfo = indexData.appInfo;
        this.availableAreas = indexData.areas || Object.keys(indexData.structure || {});
        this.areaStructure = indexData.structure || {};
        this.areaStats = indexData.stats?.byArea || {};
        
        console.log(`📊 Aplicação: ${this.appInfo?.name} v${this.appInfo?.version}`);
        console.log(`📚 Áreas disponíveis: ${this.availableAreas.join(', ')}`);
        
        // ✅ CARREGAR QUESTÕES BASEADO NO MODO
        this.loadQuestionsBasedOnMode();
      },
      error: (error) => {
        console.warn('⚠️ Index não encontrado, tentando carregamento direto:', error);
        
        // ✅ FALLBACK: TENTAR CARREGAR DIRETAMENTE
        if (this.mode === 'mixed') {
          this.loadMixedQuestionsWithIndex();
        } else {
          // ✅ ÚLTIMO RECURSO: QUESTÕES DE EMERGÊNCIA
          console.warn('🚨 Usando questões de emergência como fallback');
          this.loadEmergencyQuestions();
        }
      }
    });
  }

  // ✅ MÉTODO SIMPLIFICADO PARA DETERMINAR TIPO DE CARREGAMENTO
  private loadQuestionsBasedOnMode(): void {
    console.log(`🎯 Carregando questões no modo: ${this.mode}`);
    
    switch (this.mode) {
      case 'subject':
        if (this.area && this.subject) {
          this.loadSubjectQuestionsWithIndex();
        } else {
          this.showError('Parâmetros de área e subject são obrigatórios para este modo');
        }
        break;
        
      case 'area':
        if (this.area) {
          this.loadAreaQuestionsWithIndex();
        } else {
          this.showError('Parâmetro de área é obrigatório para este modo');
        }
        break;
        
      case 'mixed':
      default:
        this.loadMixedQuestionsWithIndex();
        break;
    }
  }

  // ✅ MÉTODO INTELIGENTE QUE USA O INDEX
  private loadQuestionsWithIndex(): void {
    if (this.mode === 'area' && this.area) {
      this.loadAreaQuestionsWithIndex();
    } else if (this.mode === 'subject' && this.subject && this.area) {
      this.loadSubjectQuestionsWithIndex();
    } else if (this.mode === 'mixed') {
      this.loadMixedQuestionsWithIndex();
    } else {
      console.log('🎲 Modo padrão: carregando quiz misto');
      this.loadMixedQuestionsWithIndex();
    }
  }

  // ✅ CARREGAR QUESTÕES DE UMA ÁREA USANDO O INDEX
  private loadAreaQuestionsWithIndex(): void {
    if (!this.availableAreas.includes(this.area)) {
      this.showError(`Área "${this.area}" não encontrada. Áreas disponíveis: ${this.availableAreas.join(', ')}`);
      return;
    }

    const questionCount = this.areaStats[this.area] || 0;
    console.log(`📊 Carregando área "${this.area}" com ${questionCount} questões`);

    const filePath = `assets/data/areas/${this.area}.json`;
    
    this.http.get<any>(filePath).subscribe({
      next: (data) => {
        this.processQuestionsData(data, `Área: ${this.area}`);
      },
      error: (error) => {
        console.error(`❌ Erro ao carregar ${this.area}:`, error);
        this.showError(`Erro ao carregar questões de ${this.area}`);
      }
    });
  }

  // ✅ CARREGAR QUESTÕES DE UM ASSUNTO ESPECÍFICO
  private loadSubjectQuestionsWithIndex(): void {
    const areaSubjects = this.areaStructure[this.area] || [];
    
    if (!areaSubjects.includes(this.subject)) {
      this.showError(`Assunto "${this.subject}" não encontrado na área "${this.area}". Assuntos disponíveis: ${areaSubjects.join(', ')}`);
      return;
    }

    console.log(`📖 Carregando assunto "${this.subject}" da área "${this.area}"`);

    const filePath = `assets/data/${this.area}/${this.subject}.json`;
    
    this.http.get<any>(filePath).subscribe({
      next: (data) => {
        this.processQuestionsData(data, `${this.area} → ${this.subject}`);
      },
      error: (error) => {
        console.error(`❌ Erro ao carregar ${this.area}/${this.subject}:`, error);
        // ✅ FALLBACK: tentar carregar toda a área e filtrar
        this.loadAreaAndFilterSubject();
      }
    });
  }

  // ✅ FALLBACK: CARREGAR ÁREA E FILTRAR ASSUNTO
  private loadAreaAndFilterSubject(): void {
    console.log(`🔄 Fallback: filtrando assunto "${this.subject}" da área "${this.area}"`);
    
    const filePath = `assets/data/areas/${this.area}.json`;
    
    this.http.get<any>(filePath).subscribe({
      next: (data) => {
        if (data && data.questions) {
          // ✅ FILTRAR QUESTÕES PELO ASSUNTO
          const filteredQuestions = data.questions.filter((q: any) => 
            q.subject === this.subject || q.category === this.subject
          );
          
          if (filteredQuestions.length > 0) {
            const filteredData = {
              ...data,
              questions: filteredQuestions,
              title: `${data.title} - ${this.subject}`
            };
            this.processQuestionsData(filteredData, `${this.area} → ${this.subject} (filtrado)`);
          } else {
            this.showError(`Nenhuma questão encontrada para o assunto "${this.subject}"`);
          }
        }
      },
      error: (error) => {
        this.showError(`Erro ao carregar questões: ${error.message}`);
      }
    });
  }

  // ✅ QUIZ MISTO INTELIGENTE BASEADO NO INDEX
  private loadMixedQuestionsWithIndex(): void {
    console.log('🎲 Criando quiz misto...');
    
    // ✅ USAR APENAS ÁREAS QUE REALMENTE EXISTEM
    const defaultAreas = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];
    
    // ✅ SE O INDEX TEM ÁREAS, FILTRAR APENAS AS QUE EXISTEM
    let areasToLoad = defaultAreas;
    if (this.availableAreas.length > 0) {
      areasToLoad = this.availableAreas.filter(area => 
        defaultAreas.includes(area)
      );
      console.log('📚 Áreas filtradas do index:', areasToLoad);
    }
    
    console.log('📚 Áreas para carregar:', areasToLoad);
    
    const requests = areasToLoad.map(area => {
      console.log(`📂 Tentando carregar: assets/data/areas/${area}.json`);
      
      return this.http.get<any>(`assets/data/areas/${area}.json`).pipe(
        map(data => ({ 
          area, 
          data, 
          maxQuestions: 3
        })),
        catchError(error => {
          console.warn(`⚠️ Erro ao carregar ${area}:`, error.status, error.message);
          return of(null);
        })
      );
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        console.log('📊 Resultados do carregamento:', results);
        
        const allQuestions: any[] = [];
        const loadedAreas: string[] = [];
        const failedAreas: string[] = [];
        
        results.forEach(result => {
          if (result && result.data && result.data.questions && result.data.questions.length > 0) {
            const shuffledQuestions = this.shuffleArray([...result.data.questions]);
            const selectedQuestions = shuffledQuestions.slice(0, result.maxQuestions);
            allQuestions.push(...selectedQuestions);
            loadedAreas.push(result.area);
            
            console.log(`✅ ${result.area}: ${selectedQuestions.length} questões adicionadas`);
          } else {
            if (result?.area) {
              failedAreas.push(result.area);
              console.warn(`⚠️ ${result.area}: Falha no carregamento`);
            }
          }
        });

        console.log(`🎯 Total de questões coletadas: ${allQuestions.length}`);
        console.log(`✅ Áreas carregadas: ${loadedAreas.join(', ')}`);
        if (failedAreas.length > 0) {
          console.log(`❌ Áreas com falha: ${failedAreas.join(', ')}`);
        }

        if (allQuestions.length > 0) {
          const mixedData = {
            title: `Quiz Misto - ${loadedAreas.length} Áreas`,
            description: `Questões de: ${loadedAreas.join(', ')}`,
            questions: this.shuffleArray(allQuestions).slice(0, 15)
          };
          
          console.log('🎉 Dados do quiz misto preparados:', mixedData);
          this.processQuestionsData(mixedData, `Quiz Misto (${loadedAreas.length} áreas)`);
          
        } else {
          console.error('❌ Nenhuma questão foi carregada, usando fallback');
          this.loadEmergencyQuestions();
        }
      },
      error: (error) => {
        console.error('❌ Erro geral ao carregar quiz misto:', error);
        console.log('🚨 Fallback: carregando questões de emergência');
        this.loadEmergencyQuestions();
      }
    });
  }

  // ✅ CALCULAR QUESTÕES POR ÁREA DE FORMA PROPORCIONAL
  private calculateMaxQuestionsPerArea(totalInArea: number): number {
    if (totalInArea >= 100) return 5; // Áreas grandes: 5 questões
    if (totalInArea >= 50) return 3;  // Áreas médias: 3 questões
    if (totalInArea >= 20) return 2;  // Áreas pequenas: 2 questões
    return 1; // Áreas muito pequenas: 1 questão
  }

  // ✅ MÉTODO CENTRALIZADO PARA PROCESSAR DADOS
  // ✅ MÉTODO processQuestionsData MELHORADO
  private processQuestionsData(data: any, source: string): void {
    console.log(`🔄 Processando questões de: ${source}`, data);
    
    if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      this.showError(`Nenhuma questão válida encontrada em: ${source}`);
      return;
    }
    
    try {
      this.questions = data.questions.map((q: any, index: number) => ({
        id: q.id || `${source.replace(/\s+/g, '-')}-${index + 1}`,
        category: q.subject || q.category || q.area || 'Geral',
        question: q.question || 'Pergunta não disponível',
        options: (q.options || []).map((opt: any, optIndex: number) => ({
          id: optIndex,
          name: opt.name || opt || `Opção ${optIndex + 1}`,
          alias: opt.alias || String.fromCharCode(97 + optIndex)
        })),
        correct: q.correct || (q.correctAnswer !== undefined ? String.fromCharCode(97 + q.correctAnswer) : 'a'),
        explanation: q.explanation || 'Explicação não disponível',
        difficulty: q.difficulty || 'medium',
        studyTip: q.studyTip || '',
        examTip: q.examTip || '',
        interviewTip: q.interviewTip || ''
      }));
      
      // ✅ VALIDAR SE TODAS AS QUESTÕES TÊM OPÇÕES
      this.questions = this.questions.filter(q => q.options && q.options.length >= 2);
      
      if (this.questions.length === 0) {
        this.showError('Nenhuma questão válida após filtragem');
        return;
      }
      
      this.questions = this.shuffleArray([...this.questions]);
      this.totalQuestions = this.questions.length;
      this.isLoading = false;
      
      console.log(`🎉 ${this.totalQuestions} questões carregadas de: ${source}`);
      this.showSuccessMessage(`Quiz carregado! ${this.totalQuestions} questões de ${source}.`);
      
    } catch (error) {
      console.error('❌ Erro ao processar questões:', error);
      this.showError(`Erro ao processar questões de: ${source}`);
    }
  }

  // ✅ MÉTODO DE FALLBACK SIMPLIFICADO
  private loadQuestions() {
    console.log('📚 Método de fallback - carregando questões...');
    
    this.isLoading = true;
    this.hasError = false;
    this.startTime = new Date();

    // ✅ USAR ESTRUTURA SIMPLIFICADA
    if (this.area && this.subject) {
      console.log(`🎯 Fallback: carregando ${this.area}/${this.subject}`);
      this.loadSubjectQuestionsWithIndex();
    } else if (this.area) {
      console.log(`📖 Fallback: carregando área ${this.area}`);
      this.loadAreaQuestionsWithIndex();
    } else {
      console.log('🎲 Fallback: carregando quiz misto');
      this.loadMixedQuestionsWithIndex();
    }
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
    
    if (this.showExplanation) {
      this.showWarningMessage('⚠️ Você já respondeu esta questão!');
      return;
    }
    
    if (!alias || typeof alias !== 'string') {
      console.error('❌ Alias inválido:', alias);
      return;
    }
    
    this.selectedAnswer = alias;
    console.log(`✅ Resposta selecionada: ${alias}`);
    
    // ✅ FEEDBACK IMEDIATO
    this.showSuccessMessage(`Alternativa ${alias.toUpperCase()} selecionada!`);
  }

  // ✅ MÉTODO SUBMITANSWER CORRIGIDO COMPLETO
  submitAnswer() {
    console.log('📤 Submetendo resposta...');
    
    if (!this.selectedAnswer) {
      this.showWarningMessage('⚠️ Selecione uma alternativa primeiro!');
      return;
    }
    
    if (this.showExplanation) { // ✅ CORRIGIDO: ADICIONADO PARÊNTESE ABERTURA
      this.showWarningMessage('⚠️ Resposta já foi submetida!');
      return;
    }
    
    if (!this.currentQuestion) {
      this.showErrorMessage('❌ Erro: questão não encontrada!');
      return;
    }

    const currentQ = this.currentQuestion;
    const isCorrect = this.selectedAnswer === currentQ.correct;
    
    this.answers[currentQ.id] = this.selectedAnswer;
    
    if (isCorrect) {
      this.correctAnswers++;
      this.showSuccessMessage('🎉 Resposta correta! Parabéns!');
    } else {
      this.showErrorMessage('❌ Resposta incorreta. Veja a explicação!');
    }

    this.showExplanation = true;
  }

  // ✅ MÉTODO NEXTQUESTION CORRIGIDO
  nextQuestion() {
    console.log('➡️ Próxima questão...');
    
    if (this.selectedAnswer && !this.showExplanation) {
      this.submitAnswer();
      return;
    }
    
    if (this.canGoNext) {
      this.currentQuestionIndex++;
      this.selectedAnswer = '';
      this.showExplanation = false;
      
      this.showSuccessMessage(`Questão ${this.currentQuestionIndex + 1} de ${this.totalQuestions}`);
    } else {
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
    
    // ✅ FEEDBACK FINAL MOTIVACIONAL
    let message = '';
    if (this.score >= 90) {
      message = '🏆 Excelente! Você é um expert!';
    } else if (this.score >= 70) {
      message = '🎉 Muito bom! Continue assim!';
    } else if (this.score >= 50) {
      message = '👍 Bom trabalho! Pode melhorar!';
    } else {
      message = '💪 Continue estudando! Você consegue!';
    }
    
    this.showSuccessMessage(message);
    
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

  // 🎉 NOTIFICAÇÕES MELHORADAS
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['warning-snackbar']
    });
  }

  // ✅ ADICIONAR MÉTODO PARA FAVORITOS (BÁSICO)
  toggleFavorite(): void {
    if (!this.currentQuestion) return;
    
    // Simulação simples de favoritos
    const favorites = JSON.parse(localStorage.getItem('quiz_favorites') || '[]');
    const questionId = this.currentQuestion.id;
    
    const index = favorites.indexOf(questionId);
    if (index > -1) {
      favorites.splice(index, 1);
      this.showSuccessMessage('❤️ Removido dos favoritos');
    } else {
      favorites.push(questionId);
      this.showSuccessMessage('⭐ Adicionado aos favoritos');
    }
    
    localStorage.setItem('quiz_favorites', JSON.stringify(favorites));
  }

  isFavorite(): boolean {
    if (!this.currentQuestion) return false;
    
    const favorites = JSON.parse(localStorage.getItem('quiz_favorites') || '[]');
    return favorites.includes(this.currentQuestion.id);
  }

  // ✅ ADICIONAR CONTROLE DE PAUSA
  isPaused: boolean = false;

  pauseQuiz(): void {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.showWarningMessage('⏸️ Quiz pausado');
    } else {
      this.showSuccessMessage('▶️ Quiz retomado');
    }
  }

  // ✅ ADICIONAR TIMER VISUAL (BÁSICO)
  getTimeSpentFormatted(): string {
    const seconds = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // ✅ MÉTODO DE EMERGÊNCIA - QUESTÕES HARDCODED
  private loadEmergencyQuestions(): void {
    console.log('🚨 Carregando questões de emergência...');
    
    const emergencyQuestions = [
      {
        id: 1,
        category: 'JavaScript',
        question: 'Qual é a diferença entre let, const e var?',
        options: [
          { id: 0, alias: 'a', name: 'Não há diferença' }, // ✅ ADICIONADO ID
          { id: 1, alias: 'b', name: 'let e const têm escopo de bloco' }, // ✅ ADICIONADO ID
          { id: 2, alias: 'c', name: 'var é mais moderno' }, // ✅ ADICIONADO ID
          { id: 3, alias: 'd', name: 'Todas são iguais' } // ✅ ADICIONADO ID
        ],
        correct: 'b',
        explanation: 'let e const têm escopo de bloco, var tem escopo de função',
        difficulty: 'medium'
      },
      {
        id: 2,
        category: 'React',
        question: 'Qual hook é usado para estado?',
        options: [
          { id: 0, alias: 'a', name: 'useEffect' }, // ✅ ADICIONADO ID
          { id: 1, alias: 'b', name: 'useState' }, // ✅ ADICIONADO ID
          { id: 2, alias: 'c', name: 'useContext' }, // ✅ ADICIONADO ID
          { id: 3, alias: 'd', name: 'useReducer' } // ✅ ADICIONADO ID
        ],
        correct: 'b',
        explanation: 'useState é o hook para gerenciar estado local',
        difficulty: 'easy'
      },
      {
        id: 3,
        category: 'CSS',
        question: 'Qual propriedade cria layout flexível?',
        options: [
          { id: 0, alias: 'a', name: 'display: block' }, // ✅ ADICIONADO ID
          { id: 1, alias: 'b', name: 'display: flex' }, // ✅ ADICIONADO ID
          { id: 2, alias: 'c', name: 'display: grid' }, // ✅ ADICIONADO ID
          { id: 3, alias: 'd', name: 'display: table' } // ✅ ADICIONADO ID
        ],
        correct: 'b',
        explanation: 'display: flex ativa o Flexbox',
        difficulty: 'easy'
      }
    ];
    
    this.questions = emergencyQuestions;
    this.totalQuestions = this.questions.length;
    this.isLoading = false;
    
    this.showSuccessMessage('Quiz de demonstração carregado!');
    console.log('✅ Questões de emergência carregadas:', this.questions);
  }
}
