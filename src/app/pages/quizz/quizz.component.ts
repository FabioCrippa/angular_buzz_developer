// ✅ VERSÃO CORRIGIDA - quizz.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FreeTrialService } from '../../core/services/free-trial.service';
import { ProgressService } from 'src/app/core/services/progress.service';
import { Title } from '@angular/platform-browser';

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

// ✅ ENUM PARA ESTADOS
enum QuizState {
  INITIALIZING = 'INITIALIZING',
  LOADING = 'LOADING', 
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// ✅ INTERFACE PARA ANALYTICS
interface QuizAnalytics {
  startTime: Date;
  endTime?: Date;
  questionsAnswered: number;
  correctAnswers: number;
  timePerQuestion: number[];
  abandonedAt?: number;
  retries: number;
}

@Component({ // ✅ ADICIONAR O DECORATOR @Component
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css']
})
export class QuizzComponent implements OnInit, OnDestroy {
  
  // ✅ PROPRIEDADES PRINCIPAIS
  mode: string = 'mixed';
  
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
  
  // ✅ ADICIONE ESTA PROPRIEDADE PARA FAVORITOS
  favoriteQuestions: Set<number> = new Set<number>();
  
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
  questionStartTime: Date = new Date();
  finalTime: number = 0;
  finalTimeFormatted: string = '00:00';
  
  // ✅ PROPRIEDADES PARA O INDEX
  appInfo: any = null;
  availableAreas: string[] = [];
  areaStructure: any = {};
  areaStats: any = {};

  // ✅ TIMER MELHORADO
  private timer: any;
  currentTimeFormatted: string = '00:00';

  // ✅ ESTADO E ANALYTICS
  currentState: QuizState = QuizState.INITIALIZING;
  private analytics: QuizAnalytics = {
    startTime: new Date(),
    questionsAnswered: 0,
    correctAnswers: 0,
    timePerQuestion: [],
    retries: 0
  };

  // ✅ CACHE DE QUESTÕES E FAVORITOS
  questionCache = new Map<string, any>();
  subscriptions: Subscription[] = [];

  // ✅ PROPRIEDADES PARA CONTROLE DE TENTATIVAS
  isFreeTrial: boolean = true;
  canStartQuiz: boolean = true;
  remainingAttempts: number = 3;
  trialMessage: string = '';
  showTrialWarning: boolean = false;

  // ===============================================
  // 📄 PROPRIEDADES DE TÍTULO E INTERFACE
  // ===============================================
  title: string = 'Quiz Interativo';

  // ===============================================
  // 📊 PROPRIEDADES DE LOADING E PROGRESSO
  // ===============================================
  loadingMessage: string = 'Carregando questões incríveis para você!';
  loadingProgress: number = 0;

  // ===============================================
  // 🔊 PROPRIEDADES DE ÁUDIO
  // ===============================================
  soundEnabled: boolean = true;

  // ===============================================
  // ⏳ PROPRIEDADES DE LOADING STATES PARA AÇÕES
  // ===============================================
  isRestarting: boolean = false;
  isNavigating: boolean = false;

  // ===============================================
  // ⌨️ PROPRIEDADES PARA CONTROLE DE TECLADO
  // ===============================================
  private keyboardListenerActive: boolean = true;

  // ✅ CONSTRUCTOR
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private freeTrialService: FreeTrialService,
    private progressService: ProgressService, // <-- Adicione esta linha
    private titleService: Title // <-- Adicione esta linha
  ) {}

  // ✅ GETTERS PARA ESTADO
  get isInitializing(): boolean { return this.currentState === QuizState.INITIALIZING; }
  get isReady(): boolean { return this.currentState === QuizState.READY; }
  get isInProgress(): boolean { return this.currentState === QuizState.IN_PROGRESS; }
  get isPaused(): boolean { return this.currentState === QuizState.PAUSED; }
  get isCompleted(): boolean { return this.currentState === QuizState.COMPLETED; }

  // ✅ GETTER PARA QUESTÃO ATUAL
  get currentQuestion(): Question | null {
    // ✅ ADICIONAR VALIDAÇÃO:
    if (!this.questions || this.questions.length === 0) return null;
    if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) return null;
    return this.questions[this.currentQuestionIndex] || null;
  }

  // ✅ GETTER PARA PROGRESSO
  get progressPercentage(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.currentQuestionIndex / this.totalQuestions) * 100);
  }

  // ✅ GETTERS PARA MATH E FORMATAÇÃO
  get Math(): typeof Math {
    return Math;
  }

  get progressPercentageRounded(): number {
    return Math.round(this.progressPercentage);
  }

  get progressAriaLabel(): string {
    return `Progresso: ${Math.round(this.progressPercentage)}%`;
  }

  // ✅ GETTERS DE NAVEGAÇÃO
  get canGoNext(): boolean {
    return this.currentQuestionIndex < this.totalQuestions - 1;
  }

  get canGoPrevious(): boolean {
    return this.currentQuestionIndex > 0;
  }

  // ✅ ngOnInit
  ngOnInit(): void {
    console.log('🚀 Inicializando QuizComponent...');
    
    // Carregar preferências
    this.loadSoundPreference();
    this.loadFavorites();
    
    // ✅ UMA ÚNICA SUBSCRIÇÃO PARA OS PARÂMETROS
    const routeParamsSub = this.route.params.subscribe(params => {
      this.area = params['area'] || '';
      this.subject = params['subject'] || '';
      
      console.log('📍 Parâmetros da rota capturados:');
      console.log('📍 Area:', this.area);
      console.log('📍 Subject:', this.subject);
      
      // Atualizar título quando parâmetros mudarem
      this.updateTitle();
    });

    // ✅ UMA ÚNICA SUBSCRIÇÃO PARA QUERY PARAMS
    const queryParamsSub = this.route.queryParams.subscribe(queryParams => {
      const queryMode = queryParams['mode'];
      const queryType = queryParams['type'];
      const questionLimit = queryParams['limit'];
      
      console.log('🔍 Query parameters:', { queryMode, queryType, questionLimit });
      
      this.isFreeTrial = queryType === 'free-trial' || queryMode === 'mixed';
      
      if (queryMode === 'mixed' || queryType === 'free-trial') {
        this.mode = 'mixed';
        console.log('🎲 Modo definido: Quiz Misto (Teste Grátis)');
      } else if (this.area && this.subject) {
        this.mode = 'subject';
        console.log('📖 Modo definido: Subject');
      } else if (this.area) {
        this.mode = 'area';
        console.log('📚 Modo definido: Area');
      } else {
        this.mode = 'mixed';
        this.isFreeTrial = true;
        console.log('🎲 Modo padrão: Quiz Misto');
      }
      
      console.log(`🎯 Modo final determinado: ${this.mode} | Trial: ${this.isFreeTrial}`);
      
      // Verificar trial apenas se necessário
      if (this.isFreeTrial) {
        this.checkTrialLimits();
      }
      
      // Inicializar o quiz apenas após ter todos os parâmetros
      this.initializeQuiz();
    });

    this.subscriptions.push(routeParamsSub, queryParamsSub);
    this.setState(QuizState.INITIALIZING);
  }

  // ✅ ADICIONE ESTE NOVO MÉTODO PARA INICIALIZAR O QUIZ
  private initializeQuiz(): void {
    console.log('🎯 Inicializando quiz com parâmetros:', {
      area: this.area,
      subject: this.subject,
      mode: this.mode,
      isFreeTrial: this.isFreeTrial
    });
    
    this.startTime = new Date();
    this.startTimer();
    this.loadAppIndex();
  }

  // ✅ ngOnDestroy
  ngOnDestroy(): void {
    console.log('🧹 Destruindo QuizComponent...');
    
    // Desativar listeners de teclado
    this.keyboardListenerActive = false;
    
    // Limpar timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Limpar loading states
    this.isRestarting = false;
    this.isNavigating = false;
    
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  // ✅ MÉTODOS DE ESTADO
  private setState(newState: QuizState): void {
    console.log(`🔄 Estado: ${this.currentState} → ${newState}`);
    
    const previousState = this.currentState;
    this.currentState = newState;
    
    this.isLoading = newState === QuizState.LOADING || newState === QuizState.INITIALIZING;
    this.hasError = newState === QuizState.ERROR;
    this.quizCompleted = newState === QuizState.COMPLETED;
    
    if ((newState === QuizState.COMPLETED || newState === QuizState.ERROR) && this.timer) {
      console.log('⏹️ Parando timer - estado final alcançado');
      clearInterval(this.timer);
      this.timer = null;
    }
    
    if (newState === QuizState.IN_PROGRESS && !this.timer) {
      console.log('▶️ Iniciando timer - quiz em progresso');
      this.startTimer();
    }
  }

  // ✅ TIMER
  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      this.currentTimeFormatted = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      this.timeSpent = seconds;
    }, 1000);
  }

  // ✅ MÉTODOS DE FORMATAÇÃO
  getTimeSpentFormatted(): string {
    if (this.quizCompleted && this.currentTimeFormatted !== '00:00') {
      return this.currentTimeFormatted;
    }
    
    const seconds = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getFinalTimeFormatted(): string {
    return this.quizCompleted ? this.finalTimeFormatted : this.getTimeSpentFormatted();
  }

  getFormattedTime(): string {
    return this.getTimeSpentFormatted();
  }

  // ✅ DISPOSITIVOS
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  isTablet(): boolean {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  // ✅ MÉTODOS DE OPÇÕES
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  // ===============================================
  // 🎮 MÉTODOS PRINCIPAIS DO QUIZ
  // ===============================================

  // ✅ SELECIONAR RESPOSTA
  selectAnswer(alias: string): void {
    if (this.showExplanation) return;
    
    this.selectedAnswer = alias;
    this.showSuccessMessage(`Alternativa ${alias.toUpperCase()} selecionada`);
  }

  // ✅ SUBMETER RESPOSTA
  submitAnswer(): void {
    if (!this.selectedAnswer) {
      this.showErrorMessage('Selecione uma alternativa');
      return;
    }
    
    if (this.showExplanation) {
      this.showErrorMessage('Já respondida');
      return;
    }
    
    if (!this.currentQuestion) {
      this.showErrorMessage('Questão não encontrada');
      return;
    }

    const currentQ = this.currentQuestion;
    const isCorrect = this.selectedAnswer === currentQ.correct;
    
    // ✅ ADICIONE ESTES LOGS PARA DEBUG
    console.log('🔍 Dados da área atual no quiz:');
    console.log('📍 this.area:', this.area);
    console.log('📍 this.subject:', this.subject);
    console.log('📍 Route params:', this.route.snapshot.params);

    // Calcular tempo gasto na questão
    const questionTimeSpent = this.questionStartTime 
      ? Math.floor((Date.now() - this.questionStartTime.getTime()) / 1000)
      : 30;

    // ✅ SALVAR PROGRESSO NO PROGRESSSERVICE
    const answerData = {
      area: this.area || 'desenvolvimento-web', // área atual ou padrão
      questionId: currentQ.id,
      correct: isCorrect,
      timeSpent: questionTimeSpent,
      date: new Date().toISOString(),
      subarea: this.subject // opcional
    };

    console.log('💾 Dados que serão salvos:', answerData);

    this.progressService.addAnswer(answerData);

    this.answers[currentQ.id] = this.selectedAnswer;
    this.analytics.questionsAnswered++;
    
    if (isCorrect) {
      this.correctAnswers++;
      this.analytics.correctAnswers++;
      this.showSuccessMessage('🎉 Correto!');
      this.playCorrectSound();
    } else {
      this.showErrorMessage('❌ Incorreto');
      this.playIncorrectSound();
    }

    this.showExplanation = true;
    this.trackAnswerTime();
  }

  // ✅ PRÓXIMA QUESTÃO
  nextQuestion(): void {
    console.log('➡️ Próxima questão...');
    
    if (this.selectedAnswer && !this.showExplanation) {
      this.submitAnswer();
      return;
    }
    
    if (this.canGoNext) {
      this.currentQuestionIndex++;
      this.selectedAnswer = '';
      this.showExplanation = false;
      
      if (this.currentQuestionIndex >= this.totalQuestions) {
        this.completeQuiz();
      } else {
        this.showSuccessMessage(`Questão ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
      }
    } else {
      this.completeQuiz();
    }
  }

  // ✅ QUESTÃO ANTERIOR
  previousQuestion(): void {
    if (this.canGoPrevious) {
      this.currentQuestionIndex--;
      this.selectedAnswer = '';
      this.showExplanation = false;
      this.showSuccessMessage(`Questão ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
    }
  }

  // ✅ COMPLETAR QUIZ
  completeQuiz(): void {
    console.log('🏁 Finalizando quiz...');
    
    this.finalTime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    const finalMinutes = Math.floor(this.finalTime / 60);
    const finalSeconds = this.finalTime % 60;
    this.finalTimeFormatted = `${finalMinutes.toString().padStart(2, '0')}:${finalSeconds.toString().padStart(2, '0')}`;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.setState(QuizState.COMPLETED);
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    this.analytics.endTime = new Date();
    
    let completionMessage = `🎉 Quiz concluído! ${this.score}% de acertos`;
    
    if (this.isFreeTrial) {
      const remaining = this.freeTrialService.getRemainingAttempts(this.area || 'desenvolvimento-web');
      if (remaining > 0) {
        completionMessage += ` | ${remaining} tentativas restantes hoje`;
      } else {
        completionMessage += ` | Tentativas diárias esgotadas`;
      }
    }
    
    this.showSuccessMessage(completionMessage);
    
    console.log('🏁 Quiz finalizado!', {
      score: this.score,
      correct: this.correctAnswers,
      total: this.totalQuestions,
      timeSpent: this.finalTimeFormatted,
      isFreeTrial: this.isFreeTrial,
      remainingAttempts: this.isFreeTrial ? this.freeTrialService.getRemainingAttempts(this.area || 'desenvolvimento-web') : 'Ilimitado'
    });
  }

  // ✅ REINICIAR QUIZ
  async restartQuiz(): Promise<void> {
    if (this.isRestarting) return;
    
    // Verificar se pode reiniciar (trial)
    if (this.isFreeTrial && !this.canStartQuizInArea(this.area || 'desenvolvimento-web')) {
      this.showErrorMessage('Você esgotou suas tentativas diárias para esta área!');
      return;
    }
    
    this.isRestarting = true;
    console.log('🔄 Reiniciando quiz...');
    
    try {
      // Limpar timer
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      // Reset completo
      this.currentQuestionIndex = 0;
      this.selectedAnswer = '';
      this.showExplanation = false;
      this.correctAnswers = 0;
      this.score = 0;
      this.answers = {};
      this.timeSpent = 0;
      this.currentTimeFormatted = '00:00';
      this.quizCompleted = false;
      
      // Reset de tempo
      this.startTime = new Date();
      this.questionStartTime = new Date();
      
      // Reset de analytics
      this.analytics = {
        startTime: new Date(),
        questionsAnswered: 0,
        correctAnswers: 0,
        timePerQuestion: [],
        retries: this.analytics.retries + 1
      };
      
      // Atualizar título
      this.updateTitle();
      
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Reiniciar
      this.setState(QuizState.IN_PROGRESS);
      this.startTimer();
      
      this.showSuccessMessage('🔄 Quiz reiniciado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao reiniciar quiz:', error);
      this.showErrorMessage('Erro ao reiniciar o quiz. Tente novamente.');
    } finally {
      this.isRestarting = false;
    }
  }

  // ✅ RECARREGAR QUESTÕES
  reloadQuestions(): void {
    console.log('🔄 Recarregando questões...');
    
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.setState(QuizState.LOADING);
    
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.selectedAnswer = '';
    this.showExplanation = false;
    this.correctAnswers = 0;
    this.score = 0;
    this.answers = {};
    
    setTimeout(() => {
      this.loadQuestionsBasedOnMode();
    }, 500);
  }

  // ✅ VOLTAR PARA HOME
  async goHome(): Promise<void> {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    console.log('🏠 Voltando para home...');
    
    try {
      // Salvar estatísticas se necessário
      if (this.isFreeTrial) {
        const summary = this.freeTrialService.getDailySummary();
        console.log('📊 Resumo diário das tentativas:', summary);
      }
      
      // Limpar timer se ativo
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navegar
      this.router.navigate(['/']);
      
    } catch (error) {
      console.error('❌ Erro ao navegar para home:', error);
      this.showErrorMessage('Erro ao navegar. Tente novamente.');
    } finally {
      this.isNavigating = false;
    }
  }

  // ===============================================
  // 🎯 MÉTODOS PARA TRIAL E ÁREAS DISPONÍVEIS
  // ===============================================
  
  // ✅ OBTER ÁREAS DISPONÍVEIS FORMATADAS
  getAvailableAreasFormatted(): string {
    const availableAreas = this.freeTrialService.getAvailableAreas();
    
    if (availableAreas.length === 0) {
      return 'Nenhuma área disponível';
    }
    
    return availableAreas
      .map(area => this.getCategoryTitle(area))
      .join(', ');
  }

  // ✅ VERIFICAR SE HÁ OUTRAS ÁREAS DISPONÍVEIS
  hasOtherAreasAvailable(): boolean {
    const availableAreas = this.freeTrialService.getAvailableAreas();
    return availableAreas.length > 0;
  }

  // ✅ OBTER ÁREAS DISPONÍVEIS (MÉTODO BASE)
  getAvailableAreas(): string[] {
    return this.freeTrialService.getAvailableAreas();
  }

  // ✅ OBTER TENTATIVAS RESTANTES NA ÁREA ATUAL
  getCurrentAreaRemainingAttempts(): number {
    const currentArea = this.area || 'desenvolvimento-web';
    return this.freeTrialService.getRemainingAttempts(currentArea);
  }

  // ✅ VERIFICAR SE PODE INICIAR QUIZ EM ÁREA ESPECÍFICA
  canStartQuizInArea(area: string): boolean {
    return this.freeTrialService.canStartQuiz(area);
  }

  // ✅ VERIFICAR SE ESGOTOU TODAS AS TENTATIVAS
  hasExhaustedTrialAttempts(): boolean {
    return this.freeTrialService.hasExhaustedAllAttempts();
  }

  // ✅ OBTER TOTAL DE TENTATIVAS RESTANTES
  getTotalRemainingAttempts(): number {
    return this.freeTrialService.getTotalRemainingAttempts();
  }

  // ✅ OBTER ESTATÍSTICAS DO TRIAL
  getTrialStats(): any {
    return this.freeTrialService.getTrialStats();
  }

  // ✅ VERIFICAR SE PODE REINICIAR QUIZ ATUAL
  canRestartCurrentQuiz(): boolean {
    if (!this.isFreeTrial) return true;
    const currentArea = this.area || 'desenvolvimento-web';
    return this.freeTrialService.canStartQuiz(currentArea);
  }

  // ✅ MÉTODO PARA NAVEGAR PARA UPGRADE
  navigateToUpgrade(): void {
    console.log('🚀 Navegando para página de upgrade...');
    
    // ✅ ANALYTICS: TRACK UPGRADE INTENT
    if (this.isFreeTrial) {
      console.log('📊 Analytics: Usuário tentou fazer upgrade', {
        area: this.area,
        remainingAttempts: this.getCurrentAreaRemainingAttempts(),
        score: this.score,
        questionsCompleted: this.analytics.questionsAnswered
      });
    }
    
    // ✅ NAVEGAR PARA PÁGINA DE UPGRADE
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'quiz-completion',
        area: this.area || 'mixed',
        score: this.score
      }
    });
  }

  // ✅ OBTER ÁREAS DISPONÍVEIS COM CONTADORES (OPCIONAL)
  getAvailableAreasWithCount(): string {
    const availableAreas = this.freeTrialService.getAvailableAreas();
    
    if (availableAreas.length === 0) {
      return 'Todas as áreas foram utilizadas hoje';
    }
    
    const formattedAreas = availableAreas.map(area => {
      const remaining = this.freeTrialService.getRemainingAttempts(area);
      const title = this.getCategoryTitle(area);
      return `${title} (${remaining} tentativa${remaining !== 1 ? 's' : ''})`;
    });
    
    return formattedAreas.join(', ');
  }

  // ✅ OBTER RESUMO COMPLETO DE TENTATIVAS
  getTrialSummaryFormatted(): string {
    const stats = this.freeTrialService.getTrialStats();
    return `${stats.usedAttempts}/${stats.totalAttempts} tentativas utilizadas hoje`;
  }

  // ✅ VERIFICAR SE PODE SUGERIR OUTRAS ÁREAS
  canSuggestOtherAreas(): boolean {
    // Só sugere se a área atual está esgotada mas há outras disponíveis
    const currentArea = this.area || 'desenvolvimento-web';
    const canStartCurrentArea = this.freeTrialService.canStartQuiz(currentArea);
    const hasOtherAreas = this.hasOtherAreasAvailable();
    
    return !canStartCurrentArea && hasOtherAreas;
  }

  // ✅ CORRIGIR O MÉTODO processQuestionsData (LINHA 801)
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
      
      this.questions = this.questions.filter(q => q.options && q.options.length >= 2);
      
      if (this.questions.length === 0) {
        this.showError('Nenhuma questão válida após filtragem');
        return;
      }
      
      this.questions = this.shuffleArray([...this.questions]);
      this.totalQuestions = this.questions.length;
      this.setState(QuizState.READY);
      
      console.log(`🎉 ${this.totalQuestions} questões carregadas de: ${source}`);
      this.showSuccessMessage(`Quiz carregado! ${this.totalQuestions} questões`); // ✅ AGORA FUNCIONA
      
    } catch (error) {
      console.error('❌ Erro ao processar questões:', error);
      this.showError(`Erro ao processar questões de: ${source}`);
    }
  }

  // ===============================================
  // 🛠️ MÉTODOS ESSENCIAIS FALTANTES
  // ===============================================

  // ✅ CATEGORIA - MÉTODO FALTANTE
  getCategoryTitle(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'portugues': 'Português',
      'matematica': 'Matemática',
      'informatica': 'Informática',
      'logica': 'Lógica',
      'algoritmos': 'Algoritmos'
    };
    
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  // ✅ FAVORITOS - MÉTODOS FALTANTES
  isFavorite(): boolean {
    return this.currentQuestion ? this.favoriteQuestions.has(this.currentQuestion.id) : false;
  }

  toggleFavorite(): void {
    if (!this.currentQuestion) return;
    
    const questionId = this.currentQuestion.id;
    if (this.favoriteQuestions.has(questionId)) {
      this.favoriteQuestions.delete(questionId);
      this.showSuccessMessage('Removido dos favoritos');
    } else {
      this.favoriteQuestions.add(questionId);
      this.showSuccessMessage('Adicionado aos favoritos');
    }
    
    localStorage.setItem('favoriteQuestions', JSON.stringify([...this.favoriteQuestions]));
  }

  // ✅ CARREGAR FAVORITOS
  private loadFavorites(): void {
    try {
      const saved = localStorage.getItem('favoriteQuestions');
      if (saved) {
        const favoriteIds = JSON.parse(saved);
        this.favoriteQuestions = new Set(favoriteIds);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar favoritos:', error);
    }
  }

  // ✅ PAUSAR/RETOMAR QUIZ
  pauseQuiz(): void {
    if (this.isPaused) {
      this.setState(QuizState.IN_PROGRESS);
      this.showSuccessMessage('Quiz retomado');
      this.startTimer();
    } else {
      this.setState(QuizState.PAUSED);
      this.showSuccessMessage('Quiz pausado');
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  // ✅ SELECIONAR OPÇÃO POR NÚMERO
  selectOptionByNumber(index: number): void {
    if (this.currentQuestion && this.currentQuestion.options[index] && !this.showExplanation) { // ✅ ADICIONAR PARÊNTESES
      const option = this.currentQuestion.options[index];
      this.selectAnswer(option.alias);
    }
  }

  // ✅ NOTIFICAÇÕES
  private showSuccessMessage(message: string): void {
    console.log('✅ Success:', message);
    
    this.snackBar.dismiss();
    
    setTimeout(() => {
      this.snackBar.open(message, 'Fechar', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }, 100);
  }

  private showErrorMessage(message: string): void {
    console.error('❌ Error:', message);
    
    this.snackBar.dismiss();
    
    setTimeout(() => {
      this.snackBar.open(message, 'Fechar', {
        duration: 6000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }, 100);
  }

  // ✅ RASTREAR TEMPO DE RESPOSTA
  private trackAnswerTime(): void {
    if (this.questionStartTime) {
      const timeSpent = Date.now() - this.questionStartTime.getTime();
      this.analytics.timePerQuestion.push(timeSpent);
    }
    this.questionStartTime = new Date();
  }

  // ✅ MOSTRAR ERRO
  private showError(message: string): void {
    console.error('❌ Erro no quiz:', message);
    this.setState(QuizState.ERROR);
    this.errorMessage = message;
    this.showErrorMessage(message);
  }

  // ✅ EMBARALHAR ARRAY
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ✅ VERIFICAR LIMITES DO TRIAL
  private checkTrialLimits(): void {
    console.log('🔍 Verificando limites do trial gratuito...');
    
    let areaToCheck = this.area;
    if (this.mode === 'mixed') {
      areaToCheck = 'desenvolvimento-web';
    }
    
    if (!areaToCheck) {
      console.warn('⚠️ Área não definida para verificação de trial');
      return;
    }
    
    this.canStartQuiz = this.freeTrialService.canStartQuiz(areaToCheck);
    this.remainingAttempts = this.freeTrialService.getRemainingAttempts(areaToCheck);
    
    console.log(`📊 Trial Status - Área: ${areaToCheck}`, {
      canStart: this.canStartQuiz,
      remaining: this.remainingAttempts,
      totalRemaining: this.freeTrialService.getTotalRemainingAttempts()
    });
    
    if (!this.canStartQuiz) {
      const availableAreas = this.freeTrialService.getAvailableAreas();
      
      if (availableAreas.length > 0) {
        this.trialMessage = `Tentativas esgotadas em ${this.getCategoryTitle(areaToCheck)}. Tente: ${availableAreas.map(area => this.getCategoryTitle(area)).join(', ')}`;
      } else {
        this.trialMessage = `Todas as tentativas diárias foram utilizadas. Suas tentativas serão renovadas automaticamente à meia-noite.`;
      }
      
      this.showTrialWarning = true;
      this.setState(QuizState.ERROR);
      this.errorMessage = this.trialMessage;
      return;
    }
    
    if (this.remainingAttempts === 1) {
      this.trialMessage = `⚠️ Última tentativa disponível para ${this.getCategoryTitle(areaToCheck)} hoje!`;
      this.showTrialWarning = true;
    } else if (this.remainingAttempts === 2) {
      this.trialMessage = `Restam ${this.remainingAttempts} tentativas para ${this.getCategoryTitle(areaToCheck)} hoje`;
      this.showTrialWarning = true;
    }
  }

  // ✅ CARREGAR INDEX
  private loadAppIndex(): void {
    console.log('📋 Carregando índice da aplicação...');
    this.setState(QuizState.LOADING);
    
    this.http.get<any>('assets/data/index.json').subscribe({
      next: (indexData) => {
        console.log('✅ Index carregado:', indexData);
        
        this.appInfo = indexData.appInfo;
        this.availableAreas = Object.keys(indexData.areas || {});
        this.areaStructure = indexData.structure || {};
        this.areaStats = indexData.stats?.byArea || {};
        
        console.log(`📊 Aplicação: ${this.appInfo?.name} v${this.appInfo?.version}`);
        console.log(`📚 Áreas disponíveis: ${this.availableAreas.join(', ')}`);
        
        this.loadQuestionsBasedOnMode();
      },
      error: (error) => {
        console.warn('⚠️ Index não encontrado, tentando carregamento direto:', error);
        
        if (this.mode === 'mixed') {
          this.loadMixedQuestionsWithIndex();
        } else {
          console.warn('🚨 Usando questões de emergência como fallback');
          this.loadEmergencyQuestions();
        }
      }
    });
  }

  // ✅ CARREGAR QUESTÕES BASEADO NO MODO
  private loadQuestionsBasedOnMode(): void {
    console.log(`🎯 Carregando questões no modo: ${this.mode}`);
    
    if (this.isFreeTrial && this.canStartQuiz) {
      let areaToRegister = this.area;
      if (this.mode === 'mixed') {
        areaToRegister = 'desenvolvimento-web';
      }
      
      if (areaToRegister) {
        const registered = this.freeTrialService.registerAttempt(areaToRegister);
        if (!registered) {
          this.showError('Limite de tentativas diárias excedido!');
          return;
        }
        
        this.remainingAttempts = this.freeTrialService.getRemainingAttempts(areaToRegister);
        console.log(`✅ Tentativa registrada! Restantes: ${this.remainingAttempts}`);
      }
    }
    
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

  // ✅ MÉTODOS DE CARREGAMENTO ADICIONAIS (IMPLEMENTAR CONFORME NECESSÁRIO)
  private loadMixedQuestionsWithIndex(): void {
    console.log('🎲 Carregando quiz misto (trial gratuito)...');
    
    // ✅ DEFINIR ARQUIVOS DE QUESTÕES DISPONÍVEIS
    const questionFiles = [
      'assets/data/desenvolvimento-web/html-css.json',
      'assets/data/desenvolvimento-web/javascript.json',
      'assets/data/portugues/ortografia.json',
      'assets/data/matematica/basica.json',
      'assets/data/informatica/conceitos.json'
    ];
    
    // ✅ CARREGAR MÚLTIPLOS ARQUIVOS
    const requests = questionFiles.map(file => 
      this.http.get<any>(file).pipe(
        catchError(error => {
          console.warn(`⚠️ Erro ao carregar ${file}:`, error);
          return of(null); // Retorna null se falhar
        })
      )
    );
    
    // ✅ AGUARDAR TODOS OS REQUESTS
    forkJoin(requests).subscribe({
      next: (results) => {
        console.log('📊 Resultados do carregamento:', results);
        
        // ✅ FILTRAR RESULTADOS VÁLIDOS
        const validResults = results.filter(result => result && result.questions);
        
        if (validResults.length === 0) {
          console.warn('⚠️ Nenhum arquivo válido encontrado, tentando carregamento de emergência...');
          this.loadEmergencyQuestions();
          return;
        }
        
        // ✅ COMBINAR TODAS AS QUESTÕES
        let allQuestions: any[] = [];
        validResults.forEach(result => {
          if (result.questions && Array.isArray(result.questions)) {
            allQuestions = [...allQuestions, ...result.questions];
          }
        });
        
        if (allQuestions.length === 0) {
          console.warn('⚠️ Nenhuma questão encontrada nos arquivos válidos');
          this.loadEmergencyQuestions();
          return;
        }
        
        // ✅ EMBARALHAR E LIMITAR QUESTÕES (MÁXIMO 20 PARA TRIAL)
        const shuffledQuestions = this.shuffleArray(allQuestions);
        const limitedQuestions = shuffledQuestions.slice(0, 20);
        
        // ✅ PROCESSAR QUESTÕES
        const questionData = {
          metadata: {
            area: 'mixed',
            subject: 'Quiz Misto',
            name: 'Quiz Gratuito - Múltiplas Áreas',
            description: 'Seleção de questões de várias áreas do conhecimento',
            questionCount: limitedQuestions.length
          },
          questions: limitedQuestions
        };
        
        console.log(`🎉 ${limitedQuestions.length} questões mistas carregadas!`);
        this.processQuestionsData(questionData, 'Quiz Misto');
        
      },
      error: (error) => {
        console.error('❌ Erro ao carregar questões mistas:', error);
        this.loadEmergencyQuestions();
      }
    });
  }

  private loadAreaQuestionsWithIndex(): void {
    console.log(`📚 Carregando questões da área: ${this.area}`);
    
    if (!this.area) {
      this.showError('Área não especificada');
      return;
    }
    
    // ✅ MAPEAR ÁREA PARA ARQUIVOS
    const areaFiles: { [key: string]: string[] } = {
      'desenvolvimento-web': [
        'assets/data/desenvolvimento-web/html-css.json',
        'assets/data/desenvolvimento-web/javascript.json',
        'assets/data/desenvolvimento-web/react.json',
        'assets/data/desenvolvimento-web/nodejs.json'
      ],
      'portugues': [
        'assets/data/portugues/ortografia.json',
        'assets/data/portugues/gramatica.json',
        'assets/data/portugues/interpretacao.json'
      ],
      'matematica': [
        'assets/data/matematica/basica.json',
        'assets/data/matematica/algebra.json',
        'assets/data/matematica/geometria.json'
      ],
      'informatica': [
        'assets/data/informatica/conceitos.json',
        'assets/data/informatica/hardware.json',
        'assets/data/informatica/software.json'
      ]
    };
    
    const files = areaFiles[this.area];
    if (!files || files.length === 0) {
      console.warn(`⚠️ Nenhum arquivo encontrado para área: ${this.area}`);
      this.loadEmergencyQuestions();
      return;
    }
    
    // ✅ CARREGAR ARQUIVOS DA ÁREA
    const requests = files.map(file => 
      this.http.get<any>(file).pipe(
        catchError(error => {
          console.warn(`⚠️ Erro ao carregar ${file}:`, error);
          return of(null);
        })
      )
    );
    
    forkJoin(requests).subscribe({
      next: (results) => {
        const validResults = results.filter(result => result && result.questions);
        
        if (validResults.length === 0) {
          this.loadEmergencyQuestions();
          return;
        }
        
        // ✅ COMBINAR QUESTÕES DA ÁREA
        let areaQuestions: any[] = [];
        validResults.forEach(result => {
          if (result.questions && Array.isArray(result.questions)) {
            areaQuestions = [...areaQuestions, ...result.questions];
          }
        });
        
        // ✅ EMBARALHAR E LIMITAR (30 questões para área específica)
        const shuffledQuestions = this.shuffleArray(areaQuestions);
        const limitedQuestions = shuffledQuestions.slice(0, 30);
        
        const questionData = {
          metadata: {
            area: this.area,
            subject: this.getCategoryTitle(this.area),
            name: `Quiz de ${this.getCategoryTitle(this.area)}`,
            description: `Questões específicas da área de ${this.getCategoryTitle(this.area)}`,
            questionCount: limitedQuestions.length
          },
          questions: limitedQuestions
        };
        
        console.log(`🎉 ${limitedQuestions.length} questões de ${this.area} carregadas!`);
        this.processQuestionsData(questionData, this.getCategoryTitle(this.area));
        
      },
      error: (error) => {
        console.error(`❌ Erro ao carregar questões da área ${this.area}:`, error);
        this.loadEmergencyQuestions();
      }
    });
  }

  private loadSubjectQuestionsWithIndex(): void {
    console.log(`📖 Carregando questões do assunto: ${this.area}/${this.subject}`);
    
    if (!this.area || !this.subject) {
      this.showError('Área e assunto devem ser especificados');
      return;
    }
    
    // ✅ CONSTRUIR CAMINHO DO ARQUIVO
    const filePath = `assets/data/${this.area}/${this.subject}.json`;
    
    this.http.get<any>(filePath).subscribe({
      next: (data) => {
        if (!data || !data.questions || data.questions.length === 0) {
          console.warn(`⚠️ Nenhuma questão encontrada em: ${filePath}`);
          this.loadEmergencyQuestions();
          return;
        }
        
        // ✅ EMBARALHAR QUESTÕES DO ASSUNTO
        const shuffledQuestions = this.shuffleArray(data.questions);
        const limitedQuestions = shuffledQuestions.slice(0, 25);
        
        const questionData = {
          metadata: {
            area: this.area,
            subject: this.subject,
            name: `${this.getCategoryTitle(this.area)} - ${this.subject}`,
            description: `Questões específicas de ${this.subject}`,
            questionCount: limitedQuestions.length
          },
          questions: limitedQuestions
        };
        
        console.log(`🎉 ${limitedQuestions.length} questões de ${this.subject} carregadas!`);
        this.processQuestionsData(questionData, `${this.getCategoryTitle(this.area)} - ${this.subject}`);
        
      },
      error: (error) => {
        console.error(`❌ Erro ao carregar ${filePath}:`, error);
        this.loadEmergencyQuestions();
      }
    });
  }

  // ✅ QUESTÕES DE EMERGÊNCIA (FALLBACK)
  private loadEmergencyQuestions(): void {
    console.log('🚨 Carregando questões de emergência...');
    
    // ✅ QUESTÕES HARDCODED COMO FALLBACK
    const emergencyQuestions = [
      {
        id: 1,
        category: 'Desenvolvimento Web',
        question: 'Qual tag HTML é usada para criar um link?',
        options: [
          { id: 0, name: '<a>', alias: 'a' },
          { id: 1, name: '<link>', alias: 'b' },
          { id: 2, name: '<href>', alias: 'c' },
          { id: 3, name: '<url>', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'A tag <a> (anchor) é usada para criar hyperlinks em HTML.',
        difficulty: 'easy'
      },
      {
        id: 2,
        category: 'JavaScript',
        question: 'Como declarar uma variável em JavaScript?',
        options: [
          { id: 0, name: 'var nome;', alias: 'a' },
          { id: 1, name: 'variable nome;', alias: 'b' },
          { id: 2, name: 'v nome;', alias: 'c' },
          { id: 3, name: 'declare nome;', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'Em JavaScript, usamos "var", "let" ou "const" para declarar variáveis.',
        difficulty: 'easy'
      },
      {
        id: 3,
        category: 'CSS',
        question: 'Qual propriedade CSS define a cor do texto?',
        options: [
          { id: 0, name: 'color', alias: 'a' },
          { id: 1, name: 'text-color', alias: 'b' },
          { id: 2, name: 'font-color', alias: 'c' },
          { id: 3, name: 'text-style', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'A propriedade "color" define a cor do texto em CSS.',
        difficulty: 'easy'
      },
      {
        id: 4,
        category: 'Português',
        question: 'Qual é o plural de "cidadão"?',
        options: [
          { id: 0, name: 'cidadãos', alias: 'a' },
          { id: 1, name: 'cidadões', alias: 'b' },
          { id: 2, name: 'cidadans', alias: 'c' },
          { id: 3, name: 'cidadãos', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'O plural de "cidadão" é "cidadãos".',
        difficulty: 'medium'
      },
      {
        id: 5,
        category: 'Matemática',
        question: 'Quanto é 2 + 2 × 3?',
        options: [
          { id: 0, name: '8', alias: 'a' },
          { id: 1, name: '12', alias: 'b' },
          { id: 2, name: '10', alias: 'c' },
          { id: 3, name: '6', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'Seguindo a ordem das operações: 2 + (2 × 3) = 2 + 6 = 8.',
        difficulty: 'medium'
      }
    ];
    
    const questionData = {
      metadata: {
        area: 'emergency',
        subject: 'Questões de Emergência',
        name: 'Quiz de Demonstração',
        description: 'Questões básicas para demonstração do sistema',
        questionCount: emergencyQuestions.length
      },
      questions: emergencyQuestions
    };
    
    console.log('🆘 Usando questões de emergência como fallback');
    this.processQuestionsData(questionData, 'Quiz de Demonstração');
  }
  
  // ===============================================
  // ⌨️ MÉTODOS DE TECLADO E NAVEGAÇÃO
  // ===============================================

  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (!this.keyboardListenerActive) return;
    
    // Prevenir atalhos se estiver em input/textarea ou pausado
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || this.isPaused) {
      return;
    }

    switch (event.key) {
      case '1':
      case '2': 
      case '3':
      case '4':
        event.preventDefault();
        const optionIndex = parseInt(event.key) - 1;
        if (this.currentQuestion && this.currentQuestion.options[optionIndex] && !this.showExplanation) {
          this.selectOptionByNumber(optionIndex);
        }
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.selectedAnswer && !this.showExplanation) {
          this.submitAnswer();
        } else if (this.showExplanation && this.canGoNext) {
          this.nextQuestion();
        } else if (this.showExplanation && !this.canGoNext) {
          this.completeQuiz();
        }
        break;
      
      case 'ArrowLeft':
        if (this.showExplanation && this.canGoPrevious) {
          event.preventDefault();
          this.previousQuestion();
        }
        break;
      
      case 'ArrowRight':
        if (this.showExplanation && this.canGoNext) {
          event.preventDefault();
          this.nextQuestion();
        }
        break;
        
      case 'p':
      case 'P':
        if (this.currentQuestion) {
          event.preventDefault();
          this.pauseQuiz();
        }
        break;
    }
  }

  handleOptionKeydown(event: KeyboardEvent, alias: string, index: number): void {
    if (this.showExplanation) return; // ✅ ADICIONAR PARÊNTESES
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectAnswer(alias);
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextOption(index);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousOption(index);
        break;
    }
  }

  private focusNextOption(currentIndex: number): void {
    if (!this.currentQuestion) return;
    
    const nextIndex = (currentIndex + 1) % this.currentQuestion.options.length;
    const nextOption = document.querySelector(`.option-item:nth-child(${nextIndex + 1})`) as HTMLElement;
    nextOption?.focus();
  }

  private focusPreviousOption(currentIndex: number): void {
    if (!this.currentQuestion) return;
    
    const prevIndex = currentIndex === 0 ? this.currentQuestion.options.length - 1 : currentIndex - 1;
    const prevOption = document.querySelector(`.option-item:nth-child(${prevIndex + 1})`) as HTMLElement;
    prevOption?.focus();
  }

  // ===============================================
  // 🔊 MÉTODOS DE CONTROLE DE ÁUDIO
  // ===============================================

  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('quiz_sound_enabled', this.soundEnabled.toString());
    
    this.showSuccessMessage(
      this.soundEnabled ? '🔊 Sons ativados' : '🔇 Sons desativados'
    );
  }

  private loadSoundPreference(): void {
    const saved = localStorage.getItem('quiz_sound_enabled');
    this.soundEnabled = saved !== null ? saved === 'true' : true;
  }

  private playCorrectSound(): void {
    if (!this.soundEnabled) return;
    
    try {
      const audio = document.querySelector('#correctSound') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.warn('⚠️ Não foi possível reproduzir som de acerto:', error);
        });
      }
    } catch (error) {
      console.warn('⚠️ Erro ao reproduzir som:', error);
    }
  }

  private playIncorrectSound(): void {
    if (!this.soundEnabled) return;
    
    try {
      const audio = document.querySelector('#incorrectSound') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.warn('⚠️ Não foi possível reproduzir som de erro:', error);
        });
      }
    } catch (error) {
      console.warn('⚠️ Erro ao reproduzir som:', error);
    }
  }

  // ===============================================
  // 🏷️ MÉTODO PARA TÍTULO DINÂMICO
  // ===============================================

  private updateTitle(): void {
    if (this.mode === 'area' && this.area) {
      this.title = `Quiz de ${this.getCategoryTitle(this.area)}`;
    } else if (this.mode === 'subject' && this.area && this.subject) {
      this.title = `${this.getCategoryTitle(this.area)} - ${this.subject}`;
    } else if (this.mode === 'mixed') {
      this.title = 'Quiz Misto - Todas as Áreas';
    } else {
      this.title = 'Quiz Interativo';
    }
    
    // Adicionar indicador de trial
    if (this.isFreeTrial) {
      this.title += ' (Gratuito)';
    }
  }

  // Método para verificar o progresso salvo (debug)
  checkProgress(): void {
    const stats = this.progressService.getStats();
    const areaStats = this.progressService.getAreaStats(this.area || 'desenvolvimento-web');
    
    console.log('📊 Estatísticas gerais:', stats);
    console.log('📊 Estatísticas da área atual:', areaStats);
    
    this.showSuccessMessage(`Progresso: ${stats.totalCompleted} questões respondidas`);
  }

  // Método para carregar questões de uma área específica
  private loadQuestionsByArea(area: string): void {
    console.log('📚 Carregando questões da área:', area);
    
    if (!area) {
      this.showError('Área não especificada');
      return;
    }
    
    this.isLoading = true;
    
    // Mapear área para arquivos disponíveis
    const areaFiles: { [key: string]: string[] } = {
      'desenvolvimento-web': [
        'assets/data/desenvolvimento-web/html-css.json',
        'assets/data/desenvolvimento-web/javascript.json',
        'assets/data/desenvolvimento-web/react.json',
        'assets/data/desenvolvimento-web/nodejs.json'
      ],
      'portugues': [
        'assets/data/portugues/ortografia.json',
        'assets/data/portugues/gramatica.json',
        'assets/data/portugues/interpretacao.json'
      ],
      'matematica': [
        'assets/data/matematica/basica.json',
        'assets/data/matematica/algebra.json',
        'assets/data/matematica/geometria.json'
      ],
      'informatica': [
        'assets/data/informatica/conceitos.json',
        'assets/data/informatica/hardware.json',
        'assets/data/informatica/software.json'
      ]
    };
    
    const files = areaFiles[area];
    if (!files || files.length === 0) {
      console.warn(`⚠️ Nenhum arquivo encontrado para área: ${area}`);
      this.showError(`Área "${area}" não possui questões disponíveis`);
      return;
    }
    
    // Carregar arquivos da área
    const requests = files.map(file => 
      this.http.get<any>(file).pipe(
        catchError(error => {
          console.warn(`⚠️ Erro ao carregar ${file}:`, error);
          return of(null);
        })
      )
    );
    
    forkJoin(requests).subscribe({
      next: (results) => {
        const validResults = results.filter(result => result && result.questions);
        
        if (validResults.length === 0) {
          this.showError(`Nenhuma questão válida encontrada para a área: ${area}`);
          return;
        }
        
        // Combinar questões da área
        let areaQuestions: any[] = [];
        validResults.forEach(result => {
          if (result.questions && Array.isArray(result.questions)) {
            areaQuestions = [...areaQuestions, ...result.questions];
          }
        });
        
        if (areaQuestions.length === 0) {
          this.showError(`Nenhuma questão encontrada para a área: ${area}`);
          return;
        }
        
        // Embaralhar e limitar (30 questões para área específica)
        const shuffledQuestions = this.shuffleArray(areaQuestions);
        const limitedQuestions = shuffledQuestions.slice(0, 30);
        
        const questionData = {
          metadata: {
            area: area,
            subject: this.getCategoryTitle(area),
            name: `Quiz de ${this.getCategoryTitle(area)}`,
            description: `Questões específicas da área de ${this.getCategoryTitle(area)}`,
            questionCount: limitedQuestions.length
          },
          questions: limitedQuestions
        };
        
        console.log(`🎉 ${limitedQuestions.length} questões de ${area} carregadas!`);
        this.processQuestionsData(questionData, this.getCategoryTitle(area));
        
        this.isLoading = false;
        this.setState(QuizState.READY);
        
      },
      error: (error) => {
        console.error(`❌ Erro ao carregar questões da área ${area}:`, error);
        this.hasError = true;
        this.errorMessage = `Erro ao carregar questões da área: ${area}`;
        this.isLoading = false;
        this.showErrorMessage(`Erro ao carregar questões da área: ${area}`);
      }
    });
  }

  // ✅ MÉTODO PARA CARREGAR QUESTÕES POR MATÉRIA ESPECÍFICA
  private loadQuestionsBySubject(area: string, subject: string): void {
    console.log(`📖 Carregando questões: ${area}/${subject}`);
    
    if (!area || !subject) {
      this.showError('Área e matéria devem ser especificadas');
      return;
    }
    
    this.isLoading = true;
    
    // Construir caminho do arquivo
    const filePath = `assets/data/${area}/${subject}.json`;
    
    this.http.get<any>(filePath).subscribe({
      next: (data: any) => {
        if (!data || !data.questions || data.questions.length === 0) {
          console.warn(`⚠️ Nenhuma questão encontrada em: ${filePath}`);
          this.loadEmergencyQuestions();
          return;
        }
        
        // Embaralhar questões da matéria
        const shuffledQuestions = this.shuffleArray(data.questions);
        const limitedQuestions = shuffledQuestions.slice(0, 25);
        
        const questionData = {
          metadata: {
            area: area,
            subject: subject,
            name: `${this.getCategoryTitle(area)} - ${subject}`,
            description: `Questões específicas de ${subject}`,
            questionCount: limitedQuestions.length
          },
          questions: limitedQuestions
        };
        
        console.log(`🎉 ${limitedQuestions.length} questões de ${subject} carregadas!`);
        this.processQuestionsData(questionData, `${this.getCategoryTitle(area)} - ${subject}`);
        
        this.isLoading = false;
        this.setState(QuizState.READY);
        
      },
      error: (error) => {
        console.error(`❌ Erro ao carregar ${filePath}:`, error);
        this.hasError = true;
        this.errorMessage = `Erro ao carregar questões de ${subject}`;
        this.isLoading = false;
        this.showErrorMessage(`Erro ao carregar questões de ${subject}`);
      }
    });
  }
} // ✅ CHAVE DE FECHAMENTO DA CLASSE QuizzComponent
