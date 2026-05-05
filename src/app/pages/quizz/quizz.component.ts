// ✅ VERSÃO CORRIGIDA - quizz.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FreeTrialService } from '../../core/services/free-trial.service';
import { DailyAttemptsService } from '../../core/services/daily-attempts.service';
import { QuizHistoryService, QuizResult, QuestionAnswer } from '../../core/services/quiz-history.service';
import { GamificationService } from '../../core/services/gamification.service';
import { ProgressService } from 'src/app/core/services/progress.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { AuthService } from '../../core/services/auth.service';
import { Title } from '@angular/platform-browser';
import { SoftUpgradeDialogComponent } from '../../shared/components/soft-upgrade-dialog/soft-upgrade-dialog.component';
import { HardPaywallDialogComponent } from '../../shared/components/hard-paywall-dialog/hard-paywall-dialog.component';

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

  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (!this.currentQuestion || this.showExplanation || this.isPaused()) return;
    const keyMap: { [key: string]: string } = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd' };
    const alias = keyMap[event.key.toLowerCase()];
    if (alias) {
      this.selectAnswer(alias);
    } else if (event.key === 'Enter' && this.selectedAnswer && !this.showExplanation) {
      this.submitAnswer();
    }
  }

  startNewPremiumQuiz(): void {
    this.router.navigate(['/area', this.area || 'analise-desenvolvimento-sistemas']);
  }
navigateToUpgrade(): void {
  this.isNavigating = true;
  this.router.navigate(['/upgrade'], {
    queryParams: {
      source: 'quiz-completion',
      area: this.area,
      score: this.score
    }
  }).finally(() => {
    this.isNavigating = false;
  });
}

// ✅ MOSTRAR SOFT UPGRADE DIALOG (Phase 2)
showSoftUpgradeDialog(): void {
  const questionsResolved = this.freeTrialService.getTotalQuestionsResolved();
  const daysElapsed = this.freeTrialService.getTrialDaysElapsed();
  const daysRemaining = this.freeTrialService.getTrialDaysRemaining();
  
  // Determinar o tipo de trigger
  const triggerType = questionsResolved >= 50 ? 'questions' : 'days';
  
  const dialogRef = this.dialog.open(SoftUpgradeDialogComponent, {
    width: '90%',
    maxWidth: '500px',
    disableClose: false,
    data: {
      questionsResolved,
      daysElapsed,
      daysRemaining,
      triggerType
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    console.log('🎯 Soft Upgrade Dialog Result:', result);
    if (result === 'upgrade') {
      // Usuário clicou em "Fazer Upgrade Agora"
      setTimeout(() => {
        this.router.navigate(['/'], { queryParams: { signup: true, referral: 'soft_offer' } });
      }, 300);
    } else if (result === 'snooze') {
      // Usuário clicou em "Continuar Testando Grátis"
      console.log('⏭️ Usuário continuou testando');
    } else {
      // Usuário fechou o diálogo
      console.log('❌ Dialog fechado');
    }
  });
}

// ✅ MOSTRAR HARD PAYWALL DIALOG (Phase 3 Task 6)
showHardPaywallDialog(): void {
  const daysElapsed = this.freeTrialService.getTrialDaysElapsed();
  const nextResetTime = this.getNextMidnightISO();
  
  const dialogRef = this.dialog.open(HardPaywallDialogComponent, {
    width: '90%',
    maxWidth: '520px',
    disableClose: true, // ✅ Bloqueia fechar sem escolher
    data: {
      daysElapsed,
      nextResetTime,
      maxAttemptsToday: this.maxAttemptsToday,
      usedAttempts: this.maxAttemptsToday - this.remainingAttempts
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    console.log('🔒 Hard Paywall Dialog Result:', result);
    if (result === 'upgrade') {
      // Usuário clicou em "Fazer Upgrade Agora"
      console.log('⭐ Redirecionando para upgrade...');
    } else if (result === 'dismiss') {
      // Usuário clicou em "Voltar Amanhã"
      console.log('🌙 Usuário voltará amanhã');
    }
  });
}

// ✅ OBTER ISO STRING DA PRÓXIMA MEIA-NOITE
private getNextMidnightISO(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

  getCurrentAreaRemainingAttempts(): number {
    return this.remainingAttempts;
  }

  handleOptionKeydown(event: KeyboardEvent, alias: string, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.showExplanation) this.selectAnswer(alias);
    }
  }

  // ✅ PROPRIEDADES PRINCIPAIS
  mode: string = 'mixed';
  private readonly FREE_QUESTIONS_LIMIT = 10;
  private readonly PREMIUM_QUESTIONS_LIMIT = 20;
  private countParam: string | null = null; // read from queryParams['count']
  
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
  specificQuestionId: string = ''; // ✅ Para modo single
  specificQuestionIds: string[] = []; // ✅ Para modo smart/custom com múltiplas questões específicas
  
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
  maxAttemptsToday: number = 7; // ✅ NOVO: Máximo de tentativas para hoje
  trialMessage: string = '';
  showTrialWarning: boolean = false;
  trialDaysRemaining: number = 14; // ✅ NOVO: Dias até hard paywall

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

  // ===============================================
  // 📝 PROPRIEDADES MODO SIMULADO
  // ===============================================
  isSimulado: boolean = false;
  // Respostas registradas sem feedback: chave = question.id, valor = alias escolhido
  simuladoAnswers: { [key: string]: string } = {};
  // Navegação livre: perguntas "marcadas para revisar"
  simuladoMarked: Set<string> = new Set<string>();
  simuladoFinished: boolean = false;
  simuladoResult: {
    total: number;
    correct: number;
    score: number;
    timeFormatted: string;
    byArea: { area: string; total: number; correct: number }[];
    questions: { q: Question; chosen: string; isCorrect: boolean }[];
  } | null = null;

  // ✅ CONSTRUCTOR
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private freeTrialService: FreeTrialService,
    private dailyAttemptsService: DailyAttemptsService,
    private quizHistoryService: QuizHistoryService,
    private gamificationService: GamificationService,
    private progressService: ProgressService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private titleService: Title,
    private cdr: ChangeDetectorRef
  ) {}

  // ✅ GETTERS PARA ESTADO
  get isInitializing(): boolean { return this.currentState === QuizState.INITIALIZING; }
  get isReady(): boolean { return this.currentState === QuizState.READY; }
  get isInProgress(): boolean { return this.currentState === QuizState.IN_PROGRESS; }
  get isCompleted(): boolean { return this.currentState === QuizState.COMPLETED; }

  // ✅ GETTER PARA QUESTÃO ATUAL
  get currentQuestion(): Question | null {
    // ✅ VERIFICAÇÃO SILENCIOSA - SEM CONSOLE.WARN
    if (!this.questions || this.questions.length === 0) {
      return null; // Retorna null silenciosamente durante o carregamento
    }
    
    if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    
    return this.questions[this.currentQuestionIndex];
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
    
    // Definir estado inicial
    this.setState(QuizState.INITIALIZING);
    
    // Carregar preferências
    this.loadSoundPreference();
    this.loadFavorites();
    
    // ✅ Migrar tentativas antigas do localStorage
    this.migrateAttemptsIfNeeded();
    
    // ✅ PRIMEIRO LER QUERY PARAMS (PRIORIDADE ALTA)
    const queryParamsSub = this.route.queryParams.subscribe(queryParams => {
      
      const queryMode = queryParams['mode'];
      const queryArea = queryParams['area'];
      const querySubject = queryParams['subject'];
      const queryQuestionId = queryParams['questionId'];
      const queryQuestionIds = queryParams['questionIds']; // ✅ ADICIONAR SUPORTE PARA MÚLTIPLAS QUESTÕES
      const queryType = queryParams['type'];
      const questionLimit = queryParams['limit'];
      const premiumParam = queryParams['premium'];
      this.countParam = queryParams['count'] || null;
      
      // ✅ PRIORIZAR QUERY PARAMS
      if (queryArea) {
        this.area = queryArea;
      }
      
      if (querySubject) {
        this.subject = querySubject;
      }
      
      // ✅ ARMAZENAR QUESTION ID SE FOR MODO SINGLE
      if (queryQuestionId) {
        this.specificQuestionId = queryQuestionId;
      }
      
      // ✅ ARMAZENAR MÚLTIPLOS IDs PARA MODO SMART/CUSTOM
      if (queryQuestionIds) {
        this.specificQuestionIds = queryQuestionIds.split(',').map((id: string) => id.trim());
        console.log('📋 IDs específicos carregados:', this.specificQuestionIds);
      }
      
      // ✅ DETERMINAR MODO CORRETO BASEADO NOS PARÂMETROS
      if (queryMode === 'single' && queryQuestionId) {
        this.mode = 'single';
      } else if (queryMode === 'favorites') {
        this.mode = 'favorites';
      } else if (queryMode === 'area-favorites' && this.area) {
        this.mode = 'area-favorites';
      } else if (queryMode === 'area' && this.area) {
        this.mode = 'area';
      } else if (queryMode === 'subject' && this.area && this.subject) {
        this.mode = 'subject';
      } else if (queryMode === 'simulado' && this.area && this.subject) {
        this.mode = 'simulado';
        this.isSimulado = true;
      } else if (queryMode === 'simulado-review' && this.subject) {
        this.mode = 'simulado-review';
        this.isSimulado = true;
      } else if (queryMode === 'smart') {
        this.mode = 'smart';
      } else if (queryMode === 'custom') {
        this.mode = 'custom';
      } else {
        this.mode = 'mixed';
      }
      
      // ✅ LÓGICA CORRIGIDA PARA PREMIUM
      if (premiumParam === 'true') {
        this.isFreeTrial = false;
      } else if (queryType === 'free-trial' || queryMode === 'mixed') {
        this.isFreeTrial = true;
      } else {
        const isAdminOrStudent = !!localStorage.getItem('sowlfy_admin_token') || !!localStorage.getItem('student_token');
        const savedPremiumStatus = localStorage.getItem('testPremiumStatus');
        this.isFreeTrial = !isAdminOrStudent && savedPremiumStatus !== 'true';
      }
      
      console.log(`🎯 CONFIGURAÇÃO FINAL:`, {
        mode: this.mode,
        area: this.area,
        subject: this.subject,
        isFreeTrial: this.isFreeTrial,
        isPremium: !this.isFreeTrial
      });
      
      // ✅ VERIFICAR TRIAL APENAS SE FOR GRATUITO
      if (this.isFreeTrial) {
        this.checkTrialLimits();
      } else {
        this.canStartQuiz = true;
        this.remainingAttempts = -1;
        this.showTrialWarning = false;
      }
      
      // ✅ ATUALIZAR TÍTULO BASEADO NA CONFIGURAÇÃO
      this.updateTitle();
      
      // Inicializar o quiz apenas após ter todos os parâmetros
      this.initializeQuiz();
    });
    
    // ✅ DEPOIS LER ROUTE PARAMS (PRIORIDADE BAIXA - SÓ SE NÃO TIVER QUERY PARAMS)
    const routeParamsSub = this.route.params.subscribe(params => {
      // Só sobrescrever se não foi definido por query params
      if (!this.area && params['area']) {
        this.area = params['area'];
      }
      if (!this.subject && params['subject']) {
        this.subject = params['subject'];
      }
    });

    this.subscriptions.push(queryParamsSub, routeParamsSub);
  }
  
  async checkTrialLimits() {
    if (!this.isFreeTrial) {
      this.canStartQuiz = true;
      this.showTrialWarning = false;
      this.remainingAttempts = -1; // Ilimitado
      this.maxAttemptsToday = -1; // Ilimitado
      return;
    }
    
    const user = this.authService.currentUserValue;
    const areaKey = this.area || 'analise-desenvolvimento';
    
    // ✅ NOVO: Obter informações da fase do trial
    this.maxAttemptsToday = this.freeTrialService.getMaxAttemptsForDay();
    this.trialDaysRemaining = this.freeTrialService.getTrialDaysRemaining();
    
    if (!user || !user.id) {
      // Sem usuário logado - usar sistema antigo temporariamente
      this.remainingAttempts = this.freeTrialService.getRemainingAttempts(areaKey);
      this.canStartQuiz = this.remainingAttempts > 0;
      
      if (this.remainingAttempts === 0) {
        this.showTrialWarning = true;
        if (this.freeTrialService.isInPaywallPhase()) {
          this.trialMessage = `Você esgotou suas tentativas diárias. Faça upgrade para acesso ilimitado!`;
        } else {
          this.trialMessage = `Você esgotou suas tentativas diárias. Volte amanhã ou faça upgrade!`;
        }
      }
      return;
    }
    
    // Usuário logado - usar Firestore
    try {
      const status = await this.dailyAttemptsService.canAttemptQuiz(user.id, areaKey, !this.isFreeTrial);
      
      this.remainingAttempts = status.remaining;
      this.canStartQuiz = status.canAttempt;
      
      if (!status.canAttempt) {
        this.showTrialWarning = true;
        this.trialMessage = status.message;
      } else if (status.remaining <= 0 && !this.isFreeTrial) {
        this.showTrialWarning = true;
        this.trialMessage = `Última tentativa! Aproveite para ${this.getCategoryTitle(areaKey)}.`;
      } else {
        this.showTrialWarning = false;
        this.trialMessage = status.message;
      }
      
      console.log('🎯 Trial status (Firestore):', {
        areaKey,
        remainingAttempts: this.remainingAttempts,
        canStartQuiz: this.canStartQuiz,
        showWarning: this.showTrialWarning
      });
    } catch (error) {
      console.error('❌ Erro ao verificar tentativas:', error);
      // Fallback para sistema antigo
      this.remainingAttempts = this.freeTrialService.getRemainingAttempts(areaKey);
      this.canStartQuiz = this.remainingAttempts > 0;
    }
  }
  updateTitle() {
    let title = 'Quiz Interativo';
    
    if (this.area && this.subject) {
      title = `Quiz: ${this.getCategoryTitle(this.area)} - ${this.subject}`;
    } else if (this.area) {
      title = `Quiz: ${this.getCategoryTitle(this.area)}`;
    } else if (this.mode === 'mixed') {
      title = 'Quiz Misto - Múltiplas Áreas';
    } else {
      title = 'Quiz Interativo';
    }
    
    this.title = title;
    this.titleService.setTitle(title);
  }
  async loadFavorites() {
    try {
      const user = this.authService.currentUserValue;
      if (user && user.id) {
        // Carregar do Firestore
        const favorites = await this.favoritesService.loadFavorites(user.id);
        this.favoriteQuestions = favorites;
        
        // Verificar se há favoritos no localStorage para migrar
        const savedLocal = localStorage.getItem('favoriteQuestions');
        if (savedLocal) {
          await this.favoritesService.migrateFromLocalStorage(user.id, this.area || 'matematica');
        }
      } else {
        // Usuário não logado - usar localStorage temporariamente
        const saved = localStorage.getItem('favoriteQuestions');
        if (saved) {
          const favorites = JSON.parse(saved);
          this.favoriteQuestions = new Set(favorites);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar favoritos:', error);
      this.favoriteQuestions = new Set();
    }
  }
  
  async migrateAttemptsIfNeeded() {
    try {
      const user = this.authService.currentUserValue;
      if (user && user.id) {
        await this.dailyAttemptsService.migrateFromLocalStorage(user.id);
      }
    } catch (error) {
      console.error('❌ Erro ao migrar tentativas:', error);
    }
  }
  
  loadSoundPreference() {
    try {
      const saved = localStorage.getItem('soundEnabled');
      this.soundEnabled = saved ? JSON.parse(saved) : true;
    } catch (error) {
      this.soundEnabled = true;
    }
  }

  // ✅ ADICIONE/SUBSTITUA estes métodos também:

  // ✅ CARREGAR QUESTÃO ÚNICA (MODO SINGLE)
  private async loadSingleQuestion(): Promise<void> {
    try {
      this.setState(QuizState.LOADING);
      this.loadingMessage = `Carregando questão da área ${this.area}...`;
      
      console.log('🔍 loadSingleQuestion - Área:', this.area, 'ID:', this.specificQuestionId);
      
      // Carregar index.json
      const indexResponse = await fetch('assets/data/index.json');
      if (!indexResponse.ok) {
        throw new Error('Erro ao carregar index');
      }
      
      const indexData = await indexResponse.json();

      const paths = this.getFilePathsForArea(indexData, this.area);
      if (paths.length === 0) {
        console.error('❌ Área não encontrada no index:', this.area);
        throw new Error(`Área ${this.area} não encontrada`);
      }

      console.log('🔍 Procurando questão ID:', this.specificQuestionId, 'na área:', this.area, `(${paths.length} arquivos)`);

      let totalQuestionsChecked = 0;
      let sampleIds: any[] = [];

      // Procurar a questão em todos os assuntos da área
      for (const p of paths) {
        try {
          const response = await fetch(p.filePath);
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions) {
              totalQuestionsChecked += fileData.questions.length;

              if (sampleIds.length < 5) {
                sampleIds.push(...fileData.questions.slice(0, 3).map((q: any) => ({ id: q.id, subject: p.subject })));
              }

              const foundQuestion = fileData.questions.find((q: any) => {
                const qId = String(q.id);
                const searchId = String(this.specificQuestionId);
                return qId === searchId || Number(q.id) === Number(this.specificQuestionId);
              });

              if (foundQuestion) {
                console.log('✅ Questão encontrada em:', p.subject, foundQuestion);

                this.questions = [{
                  ...foundQuestion,
                  area: this.area,
                  subject: p.subject,
                  category: this.area
                }];

                this.totalQuestions = 1;
                this.currentQuestionIndex = 0;

                this.setState(QuizState.IN_PROGRESS);
                this.isLoading = false;
                this.startTimer();

                this.showSuccessMessage('Questão carregada! Boa revisão!');
                return;
              }
            }
          }
        } catch (error) {
          console.warn(`Erro ao carregar ${p.filePath}:`, error);
        }
      }
      console.error('❌ Questão não encontrada. ID procurado:', this.specificQuestionId);
      console.log('📊 Total de questões verificadas:', totalQuestionsChecked);
      console.log('🔢 Exemplos de IDs encontrados:', sampleIds);
      throw new Error('Questão não encontrada');
      
    } catch (error) {
      console.error('❌ Erro ao carregar questão:', error);
      this.showError('Erro ao carregar a questão');
      this.setState(QuizState.ERROR);
    }
  }

  private loadAreaQuestionsWithIndex(): void {
    
    if (!this.area) {
      this.showError('Área não especificada para modo área');
      return;
    }
    
    // ✅ VALIDAR SE A ÁREA É VÁLIDA
    const validAreas = ['analise-desenvolvimento-sistemas', 'portugues', 'matematica', 'informatica-geral', 'desenvolvimento-web', 'informatica', 'simulados'];
    if (!validAreas.includes(this.area)) {
      this.showError(`Área inválida: ${this.area}. Áreas válidas: ${validAreas.join(', ')}`);
      return;
    }
    
    this.loadingMessage = `Carregando questões de ${this.getCategoryTitle(this.area)}...`;
    
    // ✅ TENTAR CARREGAR QUESTÕES REAIS DA ÁREA ESPECÍFICA
    this.tryLoadRealQuestions().then(success => {
      if (!success) {
        this.showError(`Não foi possível carregar questões de ${this.getCategoryTitle(this.area)}. Verifique a conexão e tente novamente.`);
      }
    }).catch(error => {
      this.showError(`Erro ao carregar questões: ${error?.message || 'Tente novamente.'}`);
    });
  }
  generateEmergencyQuestions() {
    // Delega para a versão que aceita área (sem área = misto)
    this.generateEmergencyQuestionsForArea();
  }

  generateEmergencyQuestionsForArea(targetArea?: string) {
    this.loadingMessage = 'Carregando questões demonstrativas...';
    
    // ✅ QUESTÕES DE EMERGÊNCIA BALANCEADAS POR ÁREA
    const emergencyQuestions: Question[] = [
      // 💻 DESENVOLVIMENTO WEB
      {
        id: 1001,
        category: 'desenvolvimento-web',
        question: 'Qual é a diferença principal entre var, let e const em JavaScript?',
        options: [
          { id: 1, name: 'Var tem escopo global, let e const têm escopo de bloco', alias: 'a' },
          { id: 2, name: 'Todas têm o mesmo comportamento', alias: 'b' },
          { id: 3, name: 'Let e const têm escopo de bloco e const não pode ser reatribuída', alias: 'c' },
          { id: 4, name: 'Apenas var pode ser usada em funções', alias: 'd' }
        ],
        correct: 'c',
        explanation: 'let e const têm escopo de bloco e const não pode ser reatribuída, enquanto var tem escopo de função.',
        difficulty: 'intermediario'
      },
      {
        id: 1002,
        category: 'desenvolvimento-web',
        question: 'O que é o Virtual DOM no React?',
        options: [
          { id: 1, name: 'Uma cópia física do DOM', alias: 'a' },
          { id: 2, name: 'Uma representação em memória do DOM real', alias: 'b' },
          { id: 3, name: 'Um banco de dados virtual', alias: 'c' },
          { id: 4, name: 'Uma biblioteca separada do React', alias: 'd' }
        ],
        correct: 'b',
        explanation: 'Virtual DOM é uma representação em memória do DOM real, permitindo atualizações mais eficientes.',
        difficulty: 'avancado'
      },
      {
        id: 1003,
        category: 'desenvolvimento-web',
        question: 'Qual é a função do método map() em JavaScript?',
        options: [
          { id: 1, name: 'Criar um novo array com os resultados da função aplicada a cada elemento', alias: 'a' },
          { id: 2, name: 'Modificar o array original', alias: 'b' },
          { id: 3, name: 'Filtrar elementos do array', alias: 'c' },
          { id: 4, name: 'Ordenar elementos do array', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'O método map() cria um novo array com os resultados da função fornecida aplicada a cada elemento.',
        difficulty: 'intermediario'
      },
      
      // 📚 PORTUGUÊS
      {
        id: 2001,
        category: 'portugues',
        question: 'Qual é a função do acento circunflexo na palavra "você"?',
        options: [
          { id: 1, name: 'Indica que a sílaba é tônica e tem som fechado', alias: 'a' },
          { id: 2, name: 'Apenas decorativo', alias: 'b' },
          { id: 3, name: 'Indica plural', alias: 'c' },
          { id: 4, name: 'Não tem função específica', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'O acento circunflexo indica que a sílaba "cê" é tônica e tem som fechado.',
        difficulty: 'basico'
      },
      {
        id: 2002,
        category: 'portugues',
        question: 'Qual é a diferença entre "há" e "a" em indicações de tempo?',
        options: [
          { id: 1, name: 'Não há diferença', alias: 'a' },
          { id: 2, name: '"Há" indica tempo passado, "a" indica tempo futuro', alias: 'b' },
          { id: 3, name: 'Ambos indicam tempo presente', alias: 'c' },
          { id: 4, name: 'São sinônimos', alias: 'd' }
        ],
        correct: 'b',
        explanation: '"Há" indica tempo passado (há 2 anos), "a" indica tempo futuro (daqui a 2 anos).',
        difficulty: 'basico'
      },
      {
        id: 2003,
        category: 'portugues',
        question: 'Qual é a classe gramatical da palavra "rapidamente"?',
        options: [
          { id: 1, name: 'Adjetivo', alias: 'a' },
          { id: 2, name: 'Advérbio', alias: 'b' },
          { id: 3, name: 'Substantivo', alias: 'c' },
          { id: 4, name: 'Verbo', alias: 'd' }
        ],
        correct: 'b',
        explanation: '"Rapidamente" é um advérbio de modo, indicando como uma ação é realizada.',
        difficulty: 'basico'
      },
      
      // 💾 INFORMÁTICA
      {
        id: 3001,
        category: 'informatica',
        question: 'Qual é a função principal da RAM em um computador?',
        options: [
          { id: 1, name: 'Armazenar dados permanentemente', alias: 'a' },
          { id: 2, name: 'Processar cálculos', alias: 'b' },
          { id: 3, name: 'Armazenar temporariamente dados e programas em execução', alias: 'c' },
          { id: 4, name: 'Conectar à internet', alias: 'd' }
        ],
        correct: 'c',
        explanation: 'A RAM (memória de acesso aleatório) armazena temporariamente dados e programas em execução.',
        difficulty: 'basico'
      },
      {
        id: 3002,
        category: 'informatica',
        question: 'O que significa a sigla CPU?',
        options: [
          { id: 1, name: 'Central Processing Unit', alias: 'a' },
          { id: 2, name: 'Computer Personal Unit', alias: 'b' },
          { id: 3, name: 'Central Program Unit', alias: 'c' },
          { id: 4, name: 'Computer Power Unit', alias: 'd' }
        ],
        correct: 'a',
        explanation: 'CPU significa Central Processing Unit (Unidade Central de Processamento).',
        difficulty: 'basico'
      },
      
      // 🔢 MATEMÁTICA
      {
        id: 4001,
        category: 'matematica',
        question: 'Qual é o resultado de 2³ + 3² ?',
        options: [
          { id: 1, name: '11', alias: 'a' },
          { id: 2, name: '13', alias: 'b' },
          { id: 3, name: '15', alias: 'c' },
          { id: 4, name: '17', alias: 'd' }
        ],
        correct: 'd',
        explanation: '2³ = 8 e 3² = 9, então 8 + 9 = 17.',
        difficulty: 'basico'
      },
      {
        id: 4002,
        category: 'matematica',
        question: 'Se x + 5 = 12, qual é o valor de x?',
        options: [
          { id: 1, name: '5', alias: 'a' },
          { id: 2, name: '7', alias: 'b' },
          { id: 3, name: '17', alias: 'c' },
          { id: 4, name: '12', alias: 'd' }
        ],
        correct: 'b',
        explanation: 'x + 5 = 12, então x = 12 - 5 = 7.',
        difficulty: 'basico'
      }
    ];
    
    // ✅ FILTRAR APENAS QUESTÕES DA ÁREA ESPECIFICADA
    const filteredQuestions = emergencyQuestions.filter(q => q.category === targetArea);
    
    
    if (filteredQuestions.length === 0) {
      // ✅ SE NÃO HÁ QUESTÕES DA ÁREA, USAR TODAS MAS AVISAR
      this.generateEmergencyQuestions(); // Usar método original
      return;
    }
    
    // ✅ EMBARALHAR E LIMITAR QUESTÕES DA ÁREA ESPECÍFICA
    const shuffled = this.shuffleArray(filteredQuestions);
    const limit = this.getQuestionLimit();
    const selectedQuestions = shuffled.slice(0, Math.min(limit, shuffled.length));
    
    // ✅ CONFIGURAR QUIZ COM QUESTÕES FILTRADAS
    this.questions = selectedQuestions;
    this.totalQuestions = selectedQuestions.length;
    this.currentQuestionIndex = 0;
    
    // ✅ FINALIZAR CARREGAMENTO
    this.setState(QuizState.IN_PROGRESS);
    this.isLoading = false;
    this.startTimer();
    
    
    // ✅ MENSAGEM ESPECÍFICA PARA ÁREA
    const categoryTitle = this.getCategoryTitle(targetArea);
    let message = `🎯 Quiz de ${categoryTitle} iniciado com ${selectedQuestions.length} questões`;
    
    if (this.isFreeTrial) {
      message += ' | Versão gratuita';
    } else {
      message += ' | Modo demonstrativo';
    }
    
    this.showSuccessMessage(message);
  }

  private loadSubjectQuestionsWithIndex(): void {
    
    if (!this.area || !this.subject) {
      this.showError('Área e subject são obrigatórios');
      return;
    }
    
    this.tryLoadRealQuestions().then(success => {
      if (!success) {
        this.showError(`Não foi possível carregar questões de ${this.subject || this.area}. Tente novamente.`);
      }
    });
  }

  // ═══════════════════════════════════════════════
  // 📝 MODO SIMULADO
  // ═══════════════════════════════════════════════

  private loadSimuladoQuestions(): void {
    this.isSimulado = true;
    this.mode = 'simulado'; // garante que tryLoadRealQuestions use o caminho correto mesmo ao reiniciar
    this.simuladoAnswers = {};
    this.simuladoMarked = new Set();
    this.simuladoFinished = false;
    this.simuladoResult = null;

    this.tryLoadRealQuestions().then(success => {
      if (!success) {
        this.showError(`Não foi possível carregar o simulado "${this.subject}". Tente novamente.`);
      } else {
        this.titleService.setTitle(`Simulado: ${this.getSimuladoTitle()} — Sowlfy`);
      }
    });
  }

  private loadSimuladoReview(): void {
    const saved = this.progressService.getSimuladoReview(this.subject || '');
    if (!saved) {
      this.showError('Nenhuma revisão encontrada para este simulado. Realize o simulado primeiro.');
      return;
    }
    this.isSimulado = true;
    this.simuladoFinished = true;
    this.simuladoResult = saved.result;
    this.titleService.setTitle(`Revisão: ${this.getSimuladoTitle()} — Sowlfy`);
    this.setState(QuizState.COMPLETED);
    this.isLoading = false;
  }

  getSimuladoTitle(): string {
    if (!this.subject) return 'Simulado';
    return this.subject
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Seleciona (ou deseleciona) resposta sem mostrar feedback
  selectSimuladoAnswer(alias: string): void {
    if (this.simuladoFinished) return;
    const q = this.currentQuestion;
    if (!q) return;
    const key = String(q.id);
    if (this.simuladoAnswers[key] === alias) {
      // Desmarcar se clicar na mesma opção
      delete this.simuladoAnswers[key];
    } else {
      this.simuladoAnswers[key] = alias;
    }
  }

  getSimuladoAnswerFor(questionId: string | number): string {
    return this.simuladoAnswers[String(questionId)] || '';
  }

  // Marca/desmarca questão para revisão
  toggleSimuladoMark(): void {
    const q = this.currentQuestion;
    if (!q) return;
    const key = String(q.id);
    if (this.simuladoMarked.has(key)) {
      this.simuladoMarked.delete(key);
    } else {
      this.simuladoMarked.add(key);
    }
  }

  isSimuladoMarked(questionId?: string | number): boolean {
    const id = questionId ?? this.currentQuestion?.id;
    return id !== undefined && this.simuladoMarked.has(String(id));
  }

  // Ir para questão específica (navegação livre)
  goToSimuladoQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentQuestionIndex = index;
    }
  }

  // Conta quantas questões foram respondidas
  get simuladoAnsweredCount(): number {
    return Object.keys(this.simuladoAnswers).length;
  }

  // Finalizar simulado e calcular resultado
  finishSimulado(): void {
    this.simuladoFinished = true;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.finalTimeFormatted = this.currentTimeFormatted;

    const byAreaMap: { [area: string]: { total: number; correct: number } } = {};
    let correct = 0;

    const questions = this.questions.map(q => {
      const chosen = this.simuladoAnswers[String(q.id)] || '';
      const isCorrect = chosen !== '' && chosen === q.correct;
      if (isCorrect) correct++;

      // Agrupar por area_conhecimento (se existir) ou fallback para subject
      const areaKey = (q as any).area_conhecimento || (q as any).subject || 'Geral';
      if (!byAreaMap[areaKey]) byAreaMap[areaKey] = { total: 0, correct: 0 };
      byAreaMap[areaKey].total++;
      if (isCorrect) byAreaMap[areaKey].correct++;

      // Salvar no progressService igual ao quiz normal
      this.progressService.addAnswer({
        area: this.area,
        questionId: q.id as any,
        correct: isCorrect,
        timeSpent: 0,
        date: new Date().toISOString(),
        subarea: this.subject
      });

      return { q, chosen, isCorrect };
    });

    const byArea = Object.entries(byAreaMap).map(([area, v]) => ({ area, ...v }));

    this.simuladoResult = {
      total: this.questions.length,
      correct,
      score: this.questions.length > 0 ? Math.round((correct / this.questions.length) * 100) : 0,
      timeFormatted: this.finalTimeFormatted,
      byArea,
      questions
    };

    // Salvar resultado completo para revisão futura
    this.progressService.saveSimuladoReview(this.subject || '', this.simuladoResult);

    this.setState(QuizState.COMPLETED);
    this.isLoading = false;
  }

  // ✅ CORRIGIR O MÉTODO initializeQuiz PARA EVITAR ERRO LINHA 1236
  private initializeQuiz(): void {
    
    try {
      // ✅ VERIFICAÇÃO MAIS ROBUSTA
      if (!this.mode) {
        this.mode = 'mixed';
      }
      
      // ✅ VERIFICAR TENTATIVAS ANTES DE INICIAR (FREE TRIAL)
      if (this.isFreeTrial) {
        const areaKey = this.area || 'desenvolvimento-web';
        const remaining = this.freeTrialService.getRemainingAttempts(areaKey);
        
        console.log('🔍 Verificando tentativas:', { areaKey, remaining, isFreeTrial: this.isFreeTrial });
        
        if (remaining <= 0) {
          // Não mostra erro nem redireciona - apenas bloqueia e mostra a landing page
          this.canStartQuiz = false;
          this.showTrialWarning = true;
          this.remainingAttempts = 0;
          this.trialMessage = `Você esgotou suas tentativas diárias para ${this.getCategoryTitle(areaKey)}.`;
          
          // Definir estados para mostrar landing page
          this.currentState = QuizState.READY;
          this.isLoading = false;
          this.hasError = false;
          this.quizCompleted = false;
          
          console.log('⚠️ Landing page de tentativas esgotadas deve aparecer', {
            isLoading: this.isLoading,
            canStartQuiz: this.canStartQuiz,
            isFreeTrial: this.isFreeTrial,
            hasError: this.hasError
          });
          return;
        }
      }
      
      this.setState(QuizState.LOADING);
      this.loadingMessage = 'Preparando suas questões...';
      
      // ✅ CARREGAR BASEADO NO MODO COM TRATAMENTO DE ERRO
      this.loadQuestionsBasedOnMode();
      
    } catch (error) {
      this.hasError = true;
      this.errorMessage = 'Erro ao inicializar quiz. Tente novamente.';
      this.isLoading = false;
    }
  }
  // ✅ IMPLEMENTAÇÃO REAL:
  loadQuestionsBasedOnMode(): void {
    
    // ✅ NÃO REGISTRAR TENTATIVA AQUI - SERÁ REGISTRADA APENAS AO COMPLETAR O QUIZ
    // Apenas verificar se ainda tem tentativas disponíveis
    if (this.isFreeTrial && !this.canStartQuiz) {
      // ✅ VERIFICAR SE ESTÁ EM HARD PAYWALL (Dia 15+)
      if (this.freeTrialService.isInPaywallPhase()) {
        console.log('🔒 Hard Paywall Trigger - Mostrar modal bloqueante');
        setTimeout(() => this.showHardPaywallDialog(), 300);
      } else {
        this.showError('Limite de tentativas diárias excedido!');
      }
      return;
    }
    
    // ✅ CARREGAR QUESTÕES BASEADO NO MODO COM VALIDAÇÃO ESPECÍFICA
    switch (this.mode) {
      case 'single':
        if (this.specificQuestionId && this.area) {
          this.loadSingleQuestion();
        } else {
          this.showError('ID da questão ou área não especificados');
        }
        break;
        
      case 'area':
        if (this.area) {
          this.loadAreaQuestionsWithIndex();
        } else {
          this.loadMixedQuestionsWithIndex();
        }
        break;
        
      case 'subject':
        if (this.area && this.subject) {
          this.loadSubjectQuestionsWithIndex();
        } else {
          if (this.area) {
            this.mode = 'area';
            this.loadAreaQuestionsWithIndex();
          } else {
            this.loadMixedQuestionsWithIndex();
          }
        }
        break;

      case 'simulado':
        if (this.area && this.subject) {
          this.loadSimuladoQuestions();
        } else {
          this.showError('Área e assunto são obrigatórios para o simulado');
        }
        break;

      case 'simulado-review':
        this.loadSimuladoReview();
        break;
        
      case 'smart':
        if (!this.isFreeTrial) {
          this.loadSmartQuestions();
        } else {
          this.showError('Quiz Inteligente é exclusivo para usuários Premium');
        }
        break;
        
      case 'custom':
        if (!this.isFreeTrial) {
          this.loadCustomQuestions();
        } else {
          this.showError('Quiz Personalizado é exclusivo para usuários Premium');
        }
        break;
        
      case 'favorites':
        this.loadFavoritesQuiz();
        break;
        
      case 'area-favorites':
        if (this.area) {
          this.loadAreaFavoritesQuiz();
        } else {
          this.showError('Área não especificada para quiz de favoritos');
        }
        break;
        
      case 'mixed':
      default:
        this.loadMixedQuestionsWithIndex();
        break;
    }
  }

  // ✅ ngOnDestroy
  ngOnDestroy(): void {
    
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
    
    const previousState = this.currentState;
    this.currentState = newState;
    
    this.isLoading = newState === QuizState.LOADING || newState === QuizState.INITIALIZING;
    this.hasError = newState === QuizState.ERROR;
    this.quizCompleted = newState === QuizState.COMPLETED;
    
    if ((newState === QuizState.COMPLETED || newState === QuizState.ERROR) && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    if (newState === QuizState.IN_PROGRESS && !this.timer) {
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
    
    // Calcular tempo gasto na questão
    const questionTimeSpent = this.questionStartTime 
      ? Math.floor((Date.now() - this.questionStartTime.getTime()) / 1000)
      : 30;

    // ✅ SALVAR PROGRESSO NO PROGRESSSERVICE
    const answerData = {
      area: this.area || 'desenvolvimento-web',
      questionId: currentQ.id,
      correct: isCorrect,
      timeSpent: questionTimeSpent,
      date: new Date().toISOString(),
      subarea: this.subject
    };

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
    
    // ✅ AUTO-SAVE APÓS CADA RESPOSTA
    setTimeout(() => {
      this.saveQuizState();
    }, 1000);
  }

  // ✅ PRÓXIMA QUESTÃO
  nextQuestion(): void {
    
    // ✅ VERIFICAR SE AINDA TEM TENTATIVAS (FREE TRIAL)
    if (this.isFreeTrial) {
      const areaKey = this.area || 'desenvolvimento-web';
      const remaining = this.freeTrialService.getRemainingAttempts(areaKey);
      
      if (remaining <= 0 && !this.quizCompleted) {
        this.showErrorMessage(`Tentativas esgotadas para ${this.getCategoryTitle(areaKey)}!`);
        this.completeQuiz();
        return;
      }
    }
    
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
    }
  }

  // ✅ COMPLETAR QUIZ
  async completeQuiz(): Promise<void> {
    
    this.finalTime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    const finalMinutes = Math.floor(this.finalTime / 60);
    const finalSeconds = this.finalTime % 60;
    this.finalTimeFormatted = `${finalMinutes.toString().padStart(2, '0')}:${finalSeconds.toString().padStart(2, '0')}`;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // ✅ LIMPAR ESTADO SALVO QUANDO COMPLETAR
    this.clearSavedQuizState();
    
    this.setState(QuizState.COMPLETED);
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    this.analytics.endTime = new Date();

    // ✅ VERIFICAR SE É ALUNO DE ESCOLA E REGISTRAR TENTATIVA
    const schoolData = this.getSchoolStudentData();
    if (schoolData) {
      await this.registerSchoolQuizAttempt(schoolData);
    }
    
    // ✅ TRACKEAR QUESTÕES RESOLVIDAS PARA SOFT OFFER (Phase 2)
    this.freeTrialService.addQuestionsResolved(this.totalQuestions);
    
    // ✅ REGISTRAR TENTATIVA NO FIRESTORE
    if (this.isFreeTrial) {
      const user = this.authService.currentUserValue;
      const areaKey = this.area || 'analise-desenvolvimento';
      const quizId = `quiz_${Date.now()}_${areaKey}`;
      
      if (user && user.id) {
        // Registrar no Firestore
        const registered = await this.dailyAttemptsService.registerAttempt(
          user.id,
          areaKey,
          quizId,
          !this.isFreeTrial
        );
        
        if (registered) {
          console.log(`✅ Tentativa registrada no Firestore para ${areaKey}`);
          
          // Atualizar status de tentativas
          const status = await this.dailyAttemptsService.canAttemptQuiz(user.id, areaKey, !this.isFreeTrial);
          this.remainingAttempts = status.remaining;
          this.canStartQuiz = status.canAttempt;
        }
      } else {
        // Fallback para localStorage se não estiver logado
        const registered = this.freeTrialService.registerAttempt(areaKey);
        if (registered) {
          console.log(`✅ Tentativa registrada localmente para ${areaKey}`);
        }
        
        const remaining = this.freeTrialService.getRemainingAttempts(areaKey);
        this.remainingAttempts = remaining;
        this.canStartQuiz = remaining > 0;
      }
    }
    
    // ✅ NÃO MOSTRAR SNACKBAR AO COMPLETAR - A TELA DE RESULTADOS JÁ MOSTRA TUDO
    // Apenas atualizar flags se tentativas esgotadas
    if (this.isFreeTrial && this.remainingAttempts === 0) {
      this.canStartQuiz = false;
      this.showTrialWarning = true;
    }
    
    // ✅ ATUALIZAR STATUS DE TODAS AS ÁREAS PARA EXIBIÇÃO CORRETA
    if (this.isFreeTrial) {
      const currentUser = this.authService.currentUserValue;
      if (currentUser && currentUser.id) {
        await this.updateAllAreasStatus(currentUser.id);
      }
    }
    
    // ✅ SALVAR HISTÓRICO DO QUIZ NO FIRESTORE
    await this.saveQuizToHistory();
    
    // ✅ VERIFICAR E DISPARAR SOFT UPGRADE OFFER (Phase 2)
    if (this.isFreeTrial && this.freeTrialService.shouldShowSoftUpgradeOffer()) {
      setTimeout(() => this.showSoftUpgradeDialog(), 500);
    }
    
    console.log('🏁 Quiz finalizado!', {
      score: this.score,
      correct: this.correctAnswers,
      total: this.totalQuestions,
      timeSpent: this.finalTimeFormatted,
      isPremium: !this.isFreeTrial,
      isFreeTrial: this.isFreeTrial,
      mode: this.mode,
      remainingAttempts: this.isFreeTrial ? this.remainingAttempts : 'Ilimitado'
    });
  }

  // ===============================================
  // 💾 SALVAR HISTÓRICO DO QUIZ
  // ===============================================
  
  private async saveQuizToHistory(): Promise<void> {
    try {
      const user = this.authService.currentUserValue;
      
      if (!user || !user.id) {
        console.log('⚠️ Usuário não logado - histórico não salvo');
        return;
      }

      // Preparar respostas
      const questionAnswers: QuestionAnswer[] = [];
      
      this.questions.forEach((question, index) => {
        const selectedAnswer = this.answers[question.id];
        const isCorrect = selectedAnswer === question.correct;
        
        questionAnswers.push({
          questionId: question.id,
          isCorrect,
          selectedAnswer: selectedAnswer || '',
          correctAnswer: question.correct,
          timeSpent: this.analytics.timePerQuestion[index] || 0
        });
      });

      // Criar resultado do quiz
      const quizResult: QuizResult = {
        id: `quiz_${Date.now()}_${this.area}`,
        userId: user.id,
        area: this.area || 'misto',
        subject: this.subject,
        mode: this.mode as any,
        totalQuestions: this.totalQuestions,
        correctAnswers: this.correctAnswers,
        score: this.score,
        timeSpent: this.finalTime,
        completedAt: new Date(),
        isPremium: !this.isFreeTrial,
        answers: questionAnswers
      };

      // Salvar no Firestore
      const saved = await this.quizHistoryService.saveQuizResult(quizResult);
      
      if (saved) {
        console.log('✅ Histórico do quiz salvo com sucesso!');
      }
      
      // ✅ ADICIONAR XP E ATUALIZAR GAMIFICAÇÃO
      await this.addXPForQuizCompletion(user.id);
      
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  }

  // ===============================================
  // 🎮 ADICIONAR XP POR QUIZ COMPLETADO
  // ===============================================
  
  private async addXPForQuizCompletion(userId: string): Promise<void> {
    try {
      const result = await this.gamificationService.addXPForQuiz(
        userId,
        this.correctAnswers,
        this.totalQuestions,
        this.finalTime
      );

      // Mostrar feedback de XP ganho
      if (result.leveledUp) {
        this.showSuccessMessage(`🎉 PARABÉNS! Você subiu para o Level ${result.newLevel}! (+${result.xpGained} XP)`);
        console.log('🎉 LEVEL UP!', result);
      } else {
        this.showSuccessMessage(`✨ +${result.xpGained} XP ganhos!`);
        console.log('✨ XP ganho:', result);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar XP:', error);
    }
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

      // Reset simulado
      this.simuladoAnswers = {};
      this.simuladoMarked = new Set();
      this.simuladoFinished = false;
      this.simuladoResult = null;
      
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
      if (this.isSimulado) {
        // Recarregar questões do arquivo e entrar no modo simulado
        this.loadSimuladoQuestions();
      } else {
        this.setState(QuizState.IN_PROGRESS);
        this.startTimer();
      }
      
      this.showSuccessMessage('🔄 ' + (this.isSimulado ? 'Simulado' : 'Quiz') + ' reiniciado com sucesso!');
      
    } catch (error) {
      this.showErrorMessage('Erro ao reiniciar o quiz. Tente novamente.');
    } finally {
      this.isRestarting = false;
    }
  }

  // ✅ RECARREGAR QUESTÕES
  reloadQuestions(): void {
    
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
    
    try {
      // Salvar estatísticas se necessário
      if (this.isFreeTrial) {
        const summary = this.freeTrialService.getDailySummary();
      }
      
      // Limpar timer se ativo
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navegar de volta para a área do quiz
      const destination = this.area ? `/area/${this.area}` : '/';
      this.router.navigate([destination]);
      
    } catch (error) {
      this.showErrorMessage('Erro ao navegar. Tente novamente.');
    } finally {
      this.isNavigating = false;
    }
  }

  // ===============================================
  // ⏸️ SISTEMA DE PAUSA E CONTROLE DO QUIZ
  // ===============================================

  // ✅ PAUSAR QUIZ
  pauseQuiz(): void {
    if (this.currentState !== QuizState.IN_PROGRESS) {
      this.showErrorMessage('Quiz não está em progresso para pausar');
      return;
    }
    
    
    // ✅ PAUSAR TIMER
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // ✅ SALVAR TEMPO PAUSADO
    this.timeSpent = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    
    // ✅ ALTERAR ESTADO
    this.setState(QuizState.PAUSED);
    
    this.showSuccessMessage('⏸️ Quiz pausado');
    console.log('⏸️ Quiz pausado - Tempo atual:', this.getTimeSpentFormatted());
  }

  // ✅ RETOMAR QUIZ
  resumeQuiz(): void {
    if (this.currentState !== QuizState.PAUSED) {
      this.showErrorMessage('Quiz não está pausado para retomar');
      return;
    }
    
    
    // ✅ AJUSTAR TEMPO DE INÍCIO PARA COMPENSAR PAUSA
    const pausedTime = this.timeSpent * 1000; // Converter para milliseconds
    this.startTime = new Date(new Date().getTime() - pausedTime);
    
    // ✅ RESETAR TIMER DA QUESTÃO ATUAL
    this.questionStartTime = new Date();
    
    // ✅ ALTERAR ESTADO E REINICIAR TIMER
    this.setState(QuizState.IN_PROGRESS);
    this.startTimer();
    
    this.showSuccessMessage('▶️ Quiz retomado');
    console.log('▶️ Quiz retomado - Tempo total:', this.getTimeSpentFormatted());
  }

  // ✅ VERIFICAR SE QUIZ ESTÁ PAUSADO
  isPaused(): boolean {
    return this.currentState === QuizState.PAUSED;
  }

  // ✅ ALTERNAR PAUSA/RESUME
  togglePause(): void {
    if (this.isPaused()) {
      this.resumeQuiz();
    } else if (this.isInProgress) {
      this.pauseQuiz();
    } else {
      this.showErrorMessage('Quiz não pode ser pausado no estado atual');
    }
  }

  // ✅ OBTER ÍCONE DO BOTÃO DE PAUSA
  getPauseIcon(): string {
    return this.isPaused() ? 'play_arrow' : 'pause';
  }

  // ✅ OBTER TOOLTIP DO BOTÃO DE PAUSA
  getPauseTooltip(): string {
    return this.isPaused() ? 'Retomar quiz' : 'Pausar quiz';
  }

  // ✅ VERIFICAR SE PODE PAUSAR
  canPause(): boolean {
    return this.isInProgress && !this.isLoading && this.questions.length > 0;
  }

  // ✅ VERIFICAR SE PODE RETOMAR
  canResume(): boolean {
    return this.isPaused() && this.questions.length > 0;
  }

  // ✅ ABANDONAR QUIZ (SAIR SEM COMPLETAR)
  abandonQuiz(): void {
    if (this.currentState === QuizState.COMPLETED) {
      this.showErrorMessage('Quiz já foi completado');
      return;
    }
    
    
    // ✅ REGISTRAR ABANDONO NAS ANALYTICS
    this.analytics.abandonedAt = this.currentQuestionIndex;
    this.analytics.endTime = new Date();
    
    // ✅ LIMPAR TIMER
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // ✅ SALVAR PROGRESSO PARCIAL SE HOUVER
    if (this.analytics.questionsAnswered > 0) {
      const partialScore = Math.round((this.correctAnswers / this.analytics.questionsAnswered) * 100);
      console.log(`📊 Progresso parcial salvo: ${this.correctAnswers}/${this.analytics.questionsAnswered} (${partialScore}%)`);
    }
    
    this.showSuccessMessage('🚪 Quiz abandonado - progresso salvo');
    
    // ✅ NAVEGAR PARA HOME APÓS PEQUENO DELAY
    setTimeout(() => {
      this.goHome();
    }, 1500);
  }

  // ✅ SALVAR ESTADO DO QUIZ (PARA CONTINUAR DEPOIS)
  saveQuizState(): void {
    if (this.currentState === QuizState.COMPLETED || this.questions.length === 0) {
      return;
    }
    
    try {
      const quizState = {
        mode: this.mode,
        area: this.area,
        subject: this.subject,
        currentQuestionIndex: this.currentQuestionIndex,
        timeSpent: this.timeSpent,
        correctAnswers: this.correctAnswers,
        answers: this.answers,
        analytics: this.analytics,
        timestamp: new Date().toISOString(),
        isFreeTrial: this.isFreeTrial
      };
      
      localStorage.setItem('savedQuizState', JSON.stringify(quizState));
    } catch (error) {
    }
  }

  // ✅ CARREGAR ESTADO SALVO DO QUIZ
  loadSavedQuizState(): boolean {
    try {
      const saved = localStorage.getItem('savedQuizState');
      if (!saved) {
        return false;
      }
      
      const quizState = JSON.parse(saved);
      
      // ✅ VERIFICAR SE É DO MESMO QUIZ
      if (quizState.mode !== this.mode || 
          quizState.area !== this.area || 
          quizState.subject !== this.subject) {
        return false;
      }
      
      // ✅ VERIFICAR SE NÃO É MUITO ANTIGO (24 horas)
      const savedTime = new Date(quizState.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        console.log('🕐 Estado salvo muito antigo (>24h), removendo...');
        localStorage.removeItem('savedQuizState');
        return false;
      }
      
      // ✅ RESTAURAR ESTADO
      this.currentQuestionIndex = quizState.currentQuestionIndex || 0;
      this.timeSpent = quizState.timeSpent || 0;
      this.correctAnswers = quizState.correctAnswers || 0;
      this.answers = quizState.answers || {};
      this.analytics = { ...this.analytics, ...quizState.analytics };
      
      console.log('✅ Estado do quiz restaurado:', {
        questão: this.currentQuestionIndex + 1,
        tempo: this.timeSpent,
        acertos: this.correctAnswers
      });
      
      this.showSuccessMessage('✅ Progresso anterior restaurado');
      return true;
      
    } catch (error) {
      localStorage.removeItem('savedQuizState');
      return false;
    }
  }

  // ✅ LIMPAR ESTADO SALVO (QUANDO QUIZ É COMPLETADO)
  clearSavedQuizState(): void {
    try {
      localStorage.removeItem('savedQuizState');
    } catch (error) {
    }
  }

  // ✅ VERIFICAR SE HÁ ESTADO SALVO
  hasSavedState(): boolean {
    try {
      const saved = localStorage.getItem('savedQuizState');
      if (!saved) return false;
      
      const quizState = JSON.parse(saved);
      
      // ✅ VERIFICAR SE É DO MESMO QUIZ E NÃO É MUITO ANTIGO
      const isCurrentQuiz = quizState.mode === this.mode && 
                           quizState.area === this.area && 
                           quizState.subject === this.subject;
      
      if (!isCurrentQuiz) return false;
      
      const savedTime = new Date(quizState.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
      
      return hoursDiff <= 24;
    } catch (error) {
      return false;
    }
  }

  // ✅ OBTER INFORMAÇÕES DO ESTADO SALVO
  getSavedStateInfo(): string {
    try {
      const saved = localStorage.getItem('savedQuizState');
      if (!saved) return '';
      
      const quizState = JSON.parse(saved);
      const questionsAnswered = Object.keys(quizState.answers || {}).length;
      const timeFormatted = this.formatTime(quizState.timeSpent || 0);
      
      return `Questão ${quizState.currentQuestionIndex + 1} • ${questionsAnswered} respondidas • ${timeFormatted}`;
    } catch (error) {
      return '';
    }
  }

  // ✅ FORMATAR TEMPO EM SEGUNDOS PARA MM:SS
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ===============================================
  // ⭐ MÉTODOS DE FAVORITOS - ADICIONE ESTES MÉTODOS
  // ===============================================

  // ✅ ALTERNAR FAVORITO DA QUESTÃO ATUAL
  async toggleFavorite(): Promise<void> {
    if (!this.currentQuestion) {
      this.showErrorMessage('Nenhuma questão para favoritar');
      return;
    }
    
    const questionId = this.currentQuestion.id;
    const user = this.authService.currentUserValue;
    
    console.log('🔄 Toggle favorite - Question ID:', questionId, 'User:', user?.id);
    
    if (!user || !user.id) {
      this.showErrorMessage('⚠️ Faça login para salvar favoritos');
      return;
    }
    
    try {
      const isFavorited = this.favoriteQuestions.has(questionId);
      console.log('📍 Estado atual:', isFavorited ? 'JÁ FAVORITADO' : 'NÃO FAVORITADO');
      
      if (isFavorited) {
        // Remover dos favoritos
        console.log('🗑️ Removendo favorito...');
        const success = await this.favoritesService.removeFavorite(user.id, questionId);
        console.log('✅ Resultado da remoção:', success);
        
        if (success) {
          this.favoriteQuestions.delete(questionId);
          this.showSuccessMessage('⭐ Removido dos favoritos');
          console.log('✅ Favorito removido com sucesso');
        } else {
          this.showErrorMessage('❌ Erro ao remover favorito');
        }
      } else {
        // Adicionar aos favoritos
        console.log('💖 Adicionando favorito...');
        console.log('📦 Dados:', {
          userId: user.id,
          questionId,
          area: this.area || this.currentQuestion.category,
          subject: this.subject,
          difficulty: this.currentQuestion.difficulty
        });
        
        const success = await this.favoritesService.addFavorite(
          user.id,
          questionId,
          this.area || this.currentQuestion.category || 'geral',
          this.subject || 'geral',
          this.currentQuestion.difficulty || 'Médio'
        );
        
        console.log('✅ Resultado da adição:', success);
        
        if (success) {
          this.favoriteQuestions.add(questionId);
          this.showSuccessMessage('💖 Adicionado aos favoritos');
          console.log('✅ Favorito adicionado com sucesso');
        } else {
          this.showErrorMessage('❌ Erro ao adicionar favorito');
        }
      }
      
      // Forçar atualização da UI
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('❌ Erro ao alternar favorito:', error);
      this.showErrorMessage('❌ Erro ao salvar favorito: ' + error);
    }
  }

  // ✅ VERIFICAR SE QUESTÃO ATUAL É FAVORITA
  isFavorite(): boolean {
    if (!this.currentQuestion) {
      return false;
    }
    
    return this.favoriteQuestions.has(this.currentQuestion.id);
  }

  // ✅ OBTER ÍCONE DO FAVORITO
  getFavoriteIcon(): string {
    return this.isFavorite() ? '❤️' : '🤍';
  }

  // ✅ OBTER TOOLTIP DO FAVORITO
  getFavoriteTooltip(): string {
    return this.isFavorite() ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  }

  // ✅ TAMBÉM ADICIONE OS MÉTODOS DE ÁUDIO QUE ESTÃO SENDO CHAMADOS:

  // ✅ TOCAR SOM DE RESPOSTA CORRETA
  playCorrectSound(): void {
    if (!this.soundEnabled) return;
    
    try {
      // ✅ USAR WEB AUDIO API OU FALLBACK
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        this.playBeepSound(800, 200); // Frequência alta, duração curta
      } else {
        // ✅ FALLBACK: USAR SPEECH SYNTHESIS PARA FEEDBACK
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Correto');
          utterance.volume = 0.1;
          utterance.rate = 2;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
    }
  }

  // ✅ TOCAR SOM DE RESPOSTA INCORRETA
  playIncorrectSound(): void {
    if (!this.soundEnabled) return;
    
    try {
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        this.playBeepSound(400, 300); // Frequência baixa, duração média
      } else {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Incorreto');
          utterance.volume = 0.1;
          utterance.rate = 2;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
    }
  }

  // ✅ GERAR BEEP SOUND COM WEB AUDIO API
  private playBeepSound(frequency: number, duration: number): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
    }
  }

  // ✅ ALTERNAR SOM
  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    
    try {
      localStorage.setItem('soundEnabled', JSON.stringify(this.soundEnabled));
      
      const message = this.soundEnabled ? '🔊 Som ativado' : '🔇 Som desativado';
      this.showSuccessMessage(message);
      
      // ✅ TOCAR SOM DE TESTE SE ATIVADO
      if (this.soundEnabled) {
        this.playCorrectSound();
      }
    } catch (error) {
    }
  }

  // ✅ TAMBÉM ADICIONE OS MÉTODOS showErrorMessage E OUTROS QUE PODEM ESTAR FALTANDO:

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top' // ✅ Mudado para topo para não ficar cortado
    });
  }

  // ✅ MÉTODO PARA VERIFICAR SE PODE INICIAR QUIZ EM UMA ÁREA
  private canStartQuizInArea(area: string): boolean {
    if (!this.isFreeTrial) {
      return true; // Premium sempre pode
    }
    
    return this.freeTrialService.getRemainingAttempts(area) > 0;
  }

  // ✅ MÉTODO PARA RASTREAR TEMPO DE RESPOSTA
  private trackAnswerTime(): void {
    if (this.questionStartTime) {
      const timeSpent = Math.floor((Date.now() - this.questionStartTime.getTime()) / 1000);
      this.analytics.timePerQuestion.push(timeSpent);
      
      // ✅ RESETAR TIMER PARA PRÓXIMA QUESTÃO
      this.questionStartTime = new Date();
    }
  }

  // ===============================================
  // 🏷️ MÉTODO DE TÍTULOS E CATEGORIAS - ADICIONE ESTE MÉTODO
  // ===============================================

  getCategoryTitle(category?: string): string {
    const titles: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web 💻',
      'portugues': 'Português 📚',
      'matematica': 'Matemática 🔢',
      'informatica': 'Informática 💾'
    };
    
    // Retornar um rótulo padrão se não houver categoria definida
    if (!category) {
      return 'Geral';
    }

    return titles[category] || category;
  }

  // ✅ MÉTODO PARA OBTER ÁREAS DISPONÍVEIS (COM TENTATIVAS RESTANTES)
  getAvailableAreas(): Array<{key: string, title: string, remaining: number}> {
    const allAreas = [
      { key: 'desenvolvimento-web', title: 'Desenvolvimento Web 💻' },
      { key: 'portugues', title: 'Português 📚' },
      { key: 'matematica', title: 'Matemática 🔢' },
      { key: 'informatica', title: 'Informática 💾' }
    ];

    if (!this.isFreeTrial) {
      // Premium tem acesso a todas as áreas
      return allAreas.map(area => ({ ...area, remaining: -1 }));
    }

    const user = this.authService.currentUserValue;
    
    // Para free trial, filtrar apenas áreas com tentativas disponíveis
    const areasWithAttempts = allAreas.map(area => {
      let remaining = 0;
      
      // Se for a área atual, usar o valor já calculado
      if (area.key === this.area) {
        remaining = this.remainingAttempts;
      } else {
        // Para outras áreas, consultar o serviço
        if (user && user.id) {
          // Usar método síncrono - buscar do cache/estado local
          const cachedStatus = this.freeTrialService.getRemainingAttempts(area.key);
          remaining = cachedStatus;
        } else {
          remaining = this.freeTrialService.getRemainingAttempts(area.key);
        }
      }
      
      return {
        ...area,
        remaining
      };
    });

    // Filtrar apenas áreas com tentativas > 0
    return areasWithAttempts.filter(area => area.remaining > 0);
  }

  // ✅ MÉTODO PARA NAVEGAR PARA ÁREA ESPECÍFICA
  goToArea(areaKey: string): void {
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'area',
        area: areaKey
      }
    });
  }

  // ✅ ATUALIZAR STATUS DE TODAS AS ÁREAS
  private async updateAllAreasStatus(userId: string): Promise<void> {
    const allAreas = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];
    
    for (const areaKey of allAreas) {
      const status = await this.dailyAttemptsService.canAttemptQuiz(userId, areaKey, false);
      // Atualizar também no localStorage para manter sincronizado
      if (status.remaining === 0) {
        this.freeTrialService.registerAttempt(areaKey);
      }
    }
  }

  // ✅ MÉTODOS DE NAVEGAÇÃO
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToUpgrade(): void {
    this.router.navigate(['/upgrade']);
  }

  // ✅ TAMBÉM CORRIJA OS MÉTODOS QUE ESTAVAM COM throw new Error:

  showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
    this.setState(QuizState.ERROR);
    this.showErrorMessage(message);
  }

  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top' // Mudado para topo para não ficar cortado
    });
  }

  // ✅ TAMBÉM IMPLEMENTE OS MÉTODOS DE CARREGAMENTO QUE ESTAVAM VAZIOS:

  private loadSmartQuestions(): void {
    console.log('🧠 Carregando Quiz Inteligente com IDs:', this.specificQuestionIds);
    
    // ✅ VERIFICAR SE TEM IDs ESPECÍFICOS
    if (!this.specificQuestionIds || this.specificQuestionIds.length === 0) {
      this.showError('Nenhuma questão específica fornecida para o Quiz Inteligente');
      this.generateEmergencyQuestions();
      return;
    }
    
    // ✅ CARREGAR QUESTÕES DA ÁREA E FILTRAR PELOS IDs
    this.loadAreaQuestionsAndFilter(this.specificQuestionIds, '🧠 Quiz Inteligente');
  }

  private loadCustomQuestions(): void {
    console.log('🎯 Carregando Quiz Personalizado com IDs:', this.specificQuestionIds);
    
    // ✅ VERIFICAR SE TEM IDs ESPECÍFICOS
    if (!this.specificQuestionIds || this.specificQuestionIds.length === 0) {
      this.showError('Nenhuma questão específica fornecida para o Quiz Personalizado');
      this.generateEmergencyQuestions();
      return;
    }
    
    // ✅ CARREGAR QUESTÕES DA ÁREA E FILTRAR PELOS IDs
    this.loadAreaQuestionsAndFilter(this.specificQuestionIds, '🎯 Quiz Personalizado');
  }
  
  // ✅ NOVO MÉTODO PARA CARREGAR E FILTRAR QUESTÕES POR IDs
  private async loadAreaQuestionsAndFilter(questionIds: string[], quizType: string): Promise<void> {
    try {
      this.loadingMessage = `Carregando ${quizType}...`;
      
      // ✅ 1. Carregar index
      const indexResponse = await fetch('assets/data/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar index.json');
      }
      
      const indexData = await indexResponse.json();

      // Suporte a novo formato (cursos) e antigo (structure)
      const areaPaths = this.getFilePathsForArea(indexData, this.area);
      if (areaPaths.length === 0) throw new Error(`Área '${this.area}' não encontrada`);

      // ✅ 2. Carregar todas as questões da área
      const allQuestions: Question[] = [];

      for (const p of areaPaths) {
        try {
          const response = await fetch(p.filePath);

          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions && fileData.questions.length > 0) {
              allQuestions.push(...fileData.questions.map((q: any) => ({
                ...q, area: this.area, subject: p.subject, category: this.area
              })));
            }
          }
        } catch (error) {
          console.warn(`Erro ao carregar ${p.filePath}:`, error);
        }
      }
      
      // ✅ 3. Filtrar apenas as questões com os IDs especificados
      const filteredQuestions = allQuestions.filter(q => {
        const questionId = String(q.id);
        
        // Verificar match direto
        if (questionIds.includes(questionId)) {
          return true;
        }
        
        // Verificar match sem prefixo da área (ex: "1" ao invés de "desenvolvimento-web-1")
        const numericId = questionId.replace(/^.*-(\d+)$/, '$1');
        if (questionIds.includes(numericId)) {
          return true;
        }
        
        return false;
      });
      
      console.log(`📊 Questões filtradas: ${filteredQuestions.length} de ${allQuestions.length} total`);
      
      if (filteredQuestions.length === 0) {
        throw new Error('Nenhuma questão encontrada com os IDs especificados');
      }
      
      // ✅ 4. Configurar quiz
      this.questions = filteredQuestions as Question[];
      this.totalQuestions = filteredQuestions.length;
      this.currentQuestionIndex = 0;
      
      this.setState(QuizState.IN_PROGRESS);
      this.isLoading = false;
      this.startTimer();
      
      this.showSuccessMessage(`${quizType} iniciado com ${filteredQuestions.length} questões!`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar questões específicas:', error);
      this.showError('Erro ao carregar questões. Usando questões demonstrativas.');
      this.generateEmergencyQuestions();
    }
  }
  
  // ✅ MÉTODO PARA CARREGAR QUIZ DE FAVORITOS
  private async loadFavoritesQuiz(): Promise<void> {
    console.log('⭐ Carregando Quiz de Favoritos');
    
    try {
      this.loadingMessage = 'Carregando questões favoritas...';
      
      // Primeiro tentar usar os IDs específicos passados como parâmetro
      let favoriteIds: string[] = [];
      
      if (this.specificQuestionIds && this.specificQuestionIds.length > 0) {
        favoriteIds = this.specificQuestionIds;
        console.log('✅ Usando IDs dos parâmetros da URL:', favoriteIds.length, 'questões');
      } else {
        // Se não tiver parâmetros, carregar do localStorage
        const savedFavorites = localStorage.getItem('favoriteQuestions');
        
        if (!savedFavorites) {
          this.showError('Você ainda não tem questões favoritas!');
          this.generateEmergencyQuestions();
          return;
        }
        
        favoriteIds = JSON.parse(savedFavorites);
        console.log('✅ Usando IDs do localStorage:', favoriteIds.length, 'questões');
      }
      
      if (favoriteIds.length === 0) {
        this.showError('Você precisa ter pelo menos uma questão favorita!');
        this.generateEmergencyQuestions();
        return;
      }
      
      console.log('🔍 IDs dos favoritos:', favoriteIds);
      
      // Carregar index para descobrir todas as áreas
      const indexResponse = await fetch('assets/data/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar index.json');
      }
      
      const indexData = await indexResponse.json();
      const allQuestions: Question[] = [];

      console.log('📂 Carregando questões de todas as áreas...');

      // Carregar questões de TODAS as áreas disponíveis (suporte a novo e antigo formato)
      for (const p of this.getFilePaths(indexData)) {
        try {
          const response = await fetch(p.filePath);
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions?.length > 0) {
              allQuestions.push(...fileData.questions.map((q: any) => ({
                ...q, area: p.area, subject: p.subject, category: p.area
              })));
            }
          }
        } catch (error) {
          console.warn(`Erro ao carregar ${p.filePath}:`, error);
        }
      }
      
      // Filtrar apenas as questões favoritas
      console.log('🔍 Total de questões carregadas:', allQuestions.length);
      console.log('🔍 IDs de favoritos procurados:', favoriteIds);
      
      const filteredQuestions = allQuestions.filter(q => {
        const questionId = String(q.id);
        const isMatch = favoriteIds.includes(questionId);
        if (isMatch) {
          console.log('✅ Match encontrado:', questionId, '-', q.question?.substring(0, 50));
        }
        return isMatch;
      });
      
      console.log(`📊 Questões favoritas encontradas: ${filteredQuestions.length} de ${favoriteIds.length} favoritos`);
      console.log('📊 IDs encontrados:', filteredQuestions.map(q => q.id));
      
      if (filteredQuestions.length === 0) {
        console.warn('⚠️ Nenhuma questão favorita encontrada! Mostrando alguns IDs de exemplo das questões carregadas:');
        console.warn('Exemplos de IDs disponíveis:', allQuestions.slice(0, 5).map(q => q.id));
        throw new Error('Nenhuma questão favorita encontrada nos dados');
      }
      
      // Configurar quiz com questões favoritas
      this.questions = filteredQuestions as Question[];
      this.totalQuestions = filteredQuestions.length;
      this.currentQuestionIndex = 0;
      
      this.setState(QuizState.IN_PROGRESS);
      this.isLoading = false;
      this.startTimer();
      
      this.showSuccessMessage(`⭐ Quiz de Favoritos iniciado com ${filteredQuestions.length} questões!`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar quiz de favoritos:', error);
      this.showError('Erro ao carregar favoritos. Usando questões demonstrativas.');
      this.generateEmergencyQuestions();
    }
  }
  
  // ✅ MÉTODO PARA CARREGAR QUIZ DE FAVORITOS POR ÁREA
  private async loadAreaFavoritesQuiz(): Promise<void> {
    console.log('⭐📂 Carregando Quiz de Favoritos da Área:', this.area);
    
    try {
      this.loadingMessage = `Carregando questões favoritas de ${this.area}...`;
      
      // Primeiro tentar usar os IDs específicos passados como parâmetro
      let areaFavoriteIds: string[] = [];
      
      if (this.specificQuestionIds && this.specificQuestionIds.length > 0) {
        areaFavoriteIds = this.specificQuestionIds;
        console.log('✅ Usando IDs dos parâmetros da URL:', areaFavoriteIds.length, 'questões');
      } else {
        // Se não tiver parâmetros, carregar do localStorage e filtrar
        const savedFavorites = localStorage.getItem('favoriteQuestions');
        
        if (!savedFavorites) {
          this.showError('Você ainda não tem questões favoritas!');
          this.generateEmergencyQuestions();
          return;
        }
        
        const allFavoriteIds: string[] = JSON.parse(savedFavorites);
        
        if (allFavoriteIds.length === 0) {
          this.showError('Você ainda não tem questões favoritas!');
          this.generateEmergencyQuestions();
          return;
        }
        
        // Filtrar apenas os favoritos da área específica
        const areaPrefix = this.area + '-';
        areaFavoriteIds = allFavoriteIds.filter((id: string) => 
          id.toLowerCase().startsWith(areaPrefix) || id.toLowerCase().includes(this.area)
        );
        
        console.log('✅ Usando IDs do localStorage filtrados:', areaFavoriteIds.length, 'questões');
      }
      
      if (areaFavoriteIds.length === 0) {
        this.showError(`Você não tem favoritos na área ${this.area}!`);
        this.generateEmergencyQuestions();
        return;
      }
      
      console.log('🔍 IDs dos favoritos da área:', areaFavoriteIds);
      
      // Carregar index
      const indexResponse = await fetch('assets/data/index.json');
      if (!indexResponse.ok) {
        throw new Error('Falha ao carregar index.json');
      }
      
      const indexData = await indexResponse.json();
      const allQuestions: Question[] = [];
      
      // Carregar questões apenas desta área
      const areaPaths = this.getFilePathsForArea(indexData, this.area);
      for (const p of areaPaths) {
        try {
          const response = await fetch(p.filePath);
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions?.length > 0) {
              allQuestions.push(...fileData.questions.map((q: any) => ({
                ...q, area: this.area, subject: p.subject, category: this.area
              })));
            }
          }
        } catch (error) {
          console.warn(`Erro ao carregar ${p.filePath}:`, error);
        }
      }
      
      // Filtrar apenas as questões favoritas
      console.log('🔍 Total de questões da área carregadas:', allQuestions.length);
      
      const filteredQuestions = allQuestions.filter(q => {
        const questionId = String(q.id);
        const isMatch = areaFavoriteIds.includes(questionId);
        if (isMatch) {
          console.log('✅ Match encontrado:', questionId, '-', q.question?.substring(0, 50));
        }
        return isMatch;
      });
      
      console.log(`📊 Questões favoritas da área encontradas: ${filteredQuestions.length} de ${areaFavoriteIds.length} favoritos`);
      
      if (filteredQuestions.length === 0) {
        console.warn('⚠️ Nenhuma questão favorita encontrada na área!');
        console.warn('Exemplos de IDs disponíveis:', allQuestions.slice(0, 5).map(q => q.id));
        throw new Error('Nenhuma questão favorita encontrada na área');
      }
      
      // Configurar quiz
      this.questions = filteredQuestions as Question[];
      this.totalQuestions = filteredQuestions.length;
      this.currentQuestionIndex = 0;
      
      this.setState(QuizState.IN_PROGRESS);
      this.isLoading = false;
      this.startTimer();
      
      this.showSuccessMessage(`⭐ Quiz de Favoritos - ${this.area} iniciado com ${filteredQuestions.length} questões!`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar quiz de favoritos da área:', error);
      this.showError('Erro ao carregar favoritos. Usando questões demonstrativas.');
      this.generateEmergencyQuestions();
    }
  }

  // ✅ MÉTODO DE CARREGAMENTO MISTO (IMPLEMENTAÇÃO COMPLETA)
  private async loadMixedQuestionsWithIndex(): Promise<void> {
    try {
      this.loadingMessage = 'Preparando questões de múltiplas áreas...';
      
      // ✅ TENTAR CARREGAR QUESTÕES REAIS PRIMEIRO
      const success = await this.tryLoadRealQuestions();
      
      if (!success) {
        this.generateEmergencyQuestions();
      }
      
    } catch (error) {
      this.generateEmergencyQuestions();
    }
  }

  // ✅ TENTATIVA DE CARREGAMENTO REAL
  private async tryLoadRealQuestions(): Promise<boolean> {
    try {
      this.loadingMessage = 'Verificando questões disponíveis...';

      const indexResponse = await fetch('assets/data/index.json');
      if (!indexResponse.ok) return false;

      const indexData = await indexResponse.json();
      const paths = this.getFilePaths(indexData);

      if (paths.length === 0) return false;

      // Testar se pelo menos um arquivo tem questões reais
      let foundQuestions = false;
      for (const p of paths.slice(0, 5)) {
        try {
          const r = await fetch(p.filePath);
          if (r.ok) {
            const d = await r.json();
            if (d.questions?.length > 0) { foundQuestions = true; break; }
          }
        } catch { /* continua */ }
      }

      if (!foundQuestions) return false;

      switch (this.mode) {
        case 'area':     await this.loadAreaQuestionsFromReal(indexData); break;
        case 'subject':  await this.loadSubjectQuestionsFromReal(indexData); break;
        case 'simulado': await this.loadSubjectQuestionsFromReal(indexData); break;
        case 'mixed':
        default:         await this.loadMixedQuestionsFromReal(indexData); break;
      }

      return true;
    } catch {
      return false;
    }
  }

  // ✅ CORRIGIR O loadMixedQuestionsFromReal COM CAMINHO CORRETO:
  private async loadMixedQuestionsFromReal(indexData: any): Promise<void> {
    try {
      const allQuestions: Question[] = [];
      const limit = this.getQuestionLimit();
      const paths = this.getFilePaths(indexData);

      // Carregar algumas questões de cada arquivo (distribui entre áreas)
      const perFile = Math.max(1, Math.ceil(limit / Math.max(paths.length, 1)));

      for (const p of paths) {
        try {
          const response = await fetch(p.filePath);
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions?.length > 0) {
              const qs = fileData.questions.slice(0, perFile).map((q: any) => ({
                ...q, area: p.area, subject: p.subject, category: p.area
              }));
              allQuestions.push(...qs);
            }
          }
        } catch { /* continua */ }
      }

      if (allQuestions.length === 0) throw new Error('Nenhuma questão real carregada');

      const shuffled = this.shuffleArray(allQuestions);
      const finalQuestions = shuffled.slice(0, limit);

      this.questions = finalQuestions;
      this.totalQuestions = finalQuestions.length;
      this.currentQuestionIndex = 0;

      this.setState(QuizState.IN_PROGRESS);
      this.isLoading = false;
      this.startTimer();

      this.showSuccessMessage(`🎯 Quiz iniciado com ${finalQuestions.length} questões reais!`);
    } catch (error) {
      throw error;
    }
  }

  // ✅ TAMBÉM CORRIGIR OS OUTROS MÉTODOS DE CARREGAMENTO:
  private async loadAreaQuestionsFromReal(indexData: any): Promise<void> {
    try {
      const paths = this.getFilePathsForArea(indexData, this.area);
      if (paths.length === 0) throw new Error(`Área '${this.area}' não encontrada no index`);

      const areaQuestions: Question[] = [];
      for (const p of paths) {
        try {
          const response = await fetch(p.filePath);
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions?.length > 0) {
              areaQuestions.push(...fileData.questions.map((q: any) => ({
                ...q, area: this.area, subject: p.subject, category: this.area
              })));
            }
          }
        } catch { /* continua */ }
      }

      if (areaQuestions.length === 0) throw new Error(`Nenhuma questão real encontrada para área ${this.area}`);
      
      // ✅ EMBARALHAR E CONFIGURAR
      const shuffled = this.shuffleArray<Question>(areaQuestions);
      const limit = this.getQuestionLimit();
      const selectedQuestions = shuffled.slice(0, limit);
      
      this.questions = selectedQuestions as Question[];
      this.totalQuestions = selectedQuestions.length;
      this.currentQuestionIndex = 0;
      
      this.setState(QuizState.IN_PROGRESS);
      this.isLoading = false;
      this.startTimer();
      
      this.showSuccessMessage(`🎯 Quiz ${this.getCategoryTitle(this.area)} iniciado com ${selectedQuestions.length} questões!`);
      
    } catch (error) {
      throw error;
    }
  }

  private async loadSubjectQuestionsFromReal(indexData: any): Promise<void> {
    try {
      // Encontrar o arquivo do subject no novo ou antigo formato
      const areaPaths = this.getFilePathsForArea(indexData, this.area);
      // Normaliza id "boas-praticas" → "Boas Praticas" para comparar com nome formatado do chip
      const normalizeId = (s: string) =>
        s.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const subjectPath = areaPaths.find(p =>
        p.subject === this.subject ||
        p.subject.toLowerCase() === this.subject?.toLowerCase() ||
        normalizeId(p.subject) === this.subject
      );

      if (!subjectPath) {
        throw new Error(`Subject '${this.subject}' não encontrado na área '${this.area}'`);
      }

      const response = await fetch(subjectPath.filePath);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const fileData = await response.json();
      if (!fileData.questions || !Array.isArray(fileData.questions)) throw new Error('Formato de arquivo inválido');

      const questionsWithMeta = fileData.questions.map((q: any) => ({
        ...q, area: this.area, subject: this.subject, category: this.area
      }));

      const shuffled = this.isSimulado ? questionsWithMeta : this.shuffleArray(questionsWithMeta);
      const limit = this.getQuestionLimit();
      const selectedQuestions: Question[] = shuffled.slice(0, limit) as Question[];

      this.questions = selectedQuestions;
      this.totalQuestions = selectedQuestions.length;
      this.currentQuestionIndex = 0;

      this.setState(QuizState.IN_PROGRESS);
      this.isLoading = false;
      this.startTimer();

      this.showSuccessMessage(`🎯 Quiz ${this.subject} iniciado com ${selectedQuestions.length} questões!`);
    } catch (error) {
      throw error;
    }
  }

  // ✅ MÉTODO PARA DEBUG COM CAMINHOS CORRETOS:
  async debugFileStructure(): Promise<void> {
    
    const filesToCheck = [
      'assets/data/index.json',
      'assets/data/areas/desenvolvimento-web/angular.json',
      'assets/data/areas/desenvolvimento-web/javascript.json',
      'assets/data/areas/portugues/gramatica.json',
      'assets/data/areas/matematica/algebra.json',
      'assets/data/areas/informatica/hardware.json'
    ];
    
    for (const file of filesToCheck) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${file}: OK (${JSON.stringify(data).length} bytes)`);
          
          if (file.includes('.json') && !file.includes('index.json')) {
          }
        } else {
        }
      } catch (error) {
      }
    }
  }

  // ✅ UTIL: obter limite de questões (lê query param 'limit' ou retorna padrão)
  private getQuestionLimit(): number {
    // Simulado: sem limite — carrega todas as questões do arquivo
    if (this.isSimulado) return 9999;
    if (this.isFreeTrial) return this.FREE_QUESTIONS_LIMIT;
    // Premium: count=unlimited ou não informado → usa padrão 20
    if (this.countParam === 'unlimited' || !this.countParam) return this.PREMIUM_QUESTIONS_LIMIT;
    const parsed = parseInt(this.countParam, 10);
    return isNaN(parsed) ? this.PREMIUM_QUESTIONS_LIMIT : Math.min(parsed, 100);
  }

  /**
   * Extrai todos os caminhos de arquivo de questões do index.json.
   * Suporta tanto o formato antigo (structure) quanto o novo (cursos).
   */
  private getFilePaths(indexData: any): Array<{ filePath: string; area: string; subject: string }> {
    const paths: Array<{ filePath: string; area: string; subject: string }> = [];

    // Formato antigo: structure[areaKey] = ['subject1', 'subject2', ...]
    if (indexData.structure && Object.keys(indexData.structure).length > 0) {
      for (const [areaKey, subjects] of Object.entries(indexData.structure as Record<string, string[]>)) {
        for (const subject of subjects) {
          paths.push({ filePath: `assets/data/areas/${areaKey}/${subject}.json`, area: areaKey, subject });
        }
      }
      return paths;
    }

    // Formato novo: cursos[].disciplinas[].topicos[].arquivo
    if (indexData.cursos && Array.isArray(indexData.cursos)) {
      for (const curso of indexData.cursos) {
        const cursoId: string = curso.id;
        for (const disc of (curso.disciplinas || [])) {
          const discId: string = disc.id;
          for (const topico of (disc.topicos || [])) {
            const arquivo: string = topico.arquivo || `${topico.id}.json`;
            paths.push({
              filePath: `assets/data/areas/${cursoId}/${discId}/${arquivo}`,
              area: cursoId,
              subject: topico.id
            });
          }
        }
      }
    }

    return paths;
  }

  /**
   * Retorna os caminhos de arquivo para uma área específica.
   * Mapeia IDs legados (ex: 'desenvolvimento-web') para o novo formato.
   */
  private getFilePathsForArea(indexData: any, areaKey: string): Array<{ filePath: string; area: string; subject: string }> {
    const all = this.getFilePaths(indexData);
    if (all.length === 0) return [];

    // Mapa de alias legados para os novos cursoIds
    const legacyMap: Record<string, string[]> = {
      'desenvolvimento-web': ['analise-desenvolvimento-sistemas'],
      'informatica': ['informatica-geral'],
      'matematica': ['matematica'],
      'portugues': ['portugues'],
    };

    const targetIds = legacyMap[areaKey] || [areaKey];
    return all.filter(p => targetIds.includes(p.area));
  }

  // ✅ UTIL: embaralhar array (Fisher-Yates) — evita erro "Property 'shuffleArray' does not exist"
  private shuffleArray<T>(array: T[]): T[] {
    const a = Array.isArray(array) ? array.slice() : [];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // ✅ MÉTODOS PARA INTEGRAÇÃO COM ESCOLAS
  // ===============================================

  /**
   * Obtém dados do aluno de escola do localStorage
   */
  private getSchoolStudentData(): any {
    try {
      const schoolDataStr = localStorage.getItem('school_student_data');
      if (schoolDataStr) {
        return JSON.parse(schoolDataStr);
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter dados da escola:', error);
      return null;
    }
  }

  /**
   * Registra tentativa de quiz para aluno de escola
   */
  private async registerSchoolQuizAttempt(schoolData: any): Promise<void> {
    try {
      const { schoolId, studentRa, studentName } = schoolData;

      if (!schoolId || !studentRa || !studentName) {
        console.error('❌ Dados da escola incompletos para registrar tentativa');
        return;
      }

      // URL da Cloud Function
      const functionUrl = 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/recordQuizAttempt';

      // Preparar payload
      const payload = {
        schoolId,
        ra: studentRa,
        studentName,
        score: this.score,
        totalQuestions: this.totalQuestions,
        duration: this.finalTime,
        questionsAnswered: this.correctAnswers
      };

      console.log('📤 Enviando tentativa de quiz para escola:', payload);

      // Chamar Cloud Function
      const response = await this.http.post<any>(functionUrl, payload).toPromise();

      console.log('✅ Tentativa registrada com sucesso! Attempt ID:', response?.attemptId);

      // Limpar quiz_context após registro bem-sucedido
      localStorage.removeItem('quiz_context');

      // Redirecionar para school-dashboard após 2 segundos
      setTimeout(() => {
        this.router.navigate(['/school-dashboard']);
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao registrar tentativa de quiz para escola:', error);
      // Mesmo com erro, redirecionar após 3 segundos para evitar ficar travado
      setTimeout(() => {
        this.router.navigate(['/school-dashboard']);
      }, 3000);
    }
  }
}
