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
handleKeyboardShortcut($event: KeyboardEvent) {
throw new Error('Method not implemented.');
}
startNewPremiumQuiz() {
throw new Error('Method not implemented.');
}
navigateToUpgrade() {
throw new Error('Method not implemented.');
}
getCurrentAreaRemainingAttempts() {
throw new Error('Method not implemented.');
}
handleOptionKeydown($event: KeyboardEvent,arg1: string,_t87: number) {
throw new Error('Method not implemented.');
}

  // ✅ PROPRIEDADES PRINCIPAIS
  mode: string = 'mixed';
  private readonly FREE_QUESTIONS_LIMIT = 10; // ✅ LIMITE DE QUESTÕES PARA USUÁRIOS FREE
  private readonly PREMIUM_QUESTIONS_LIMIT = 20; // ✅ LIMITE DE QUESTÕES PARA USUÁRIOS PREMIUM
  
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
    
    // ✅ LER PARÂMETROS DA ROTA E QUERY PARAMS JUNTOS
    const routeParamsSub = this.route.params.subscribe(params => {
      this.area = params['area'] || '';
      this.subject = params['subject'] || '';
      
    });

    // ✅ CORRIGIR A LÓGICA DE QUERY PARAMS PARA DETECTAR ÁREA ESPECÍFICA
    const queryParamsSub = this.route.queryParams.subscribe(queryParams => {
      
      const queryMode = queryParams['mode'];
      const queryArea = queryParams['area']; // ✅ CAPTURAR ÁREA DOS QUERY PARAMS
      const querySubject = queryParams['subject']; // ✅ CAPTURAR SUBJECT DOS QUERY PARAMS
      const queryQuestionId = queryParams['questionId']; // ✅ CAPTURAR QUESTION ID PARA MODO SINGLE
      const queryType = queryParams['type'];
      const questionLimit = queryParams['limit'];
      const premiumParam = queryParams['premium'];
      
      // ✅ PRIORIZAR ÁREA E SUBJECT DOS QUERY PARAMS (VINDOS DA HOME)
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
      
      // ✅ DETERMINAR MODO CORRETO BASEADO NOS PARÂMETROS
      if (queryMode === 'single' && queryQuestionId) {
        this.mode = 'single';
      } else if (queryMode === 'area' && this.area) {
        this.mode = 'area';
      } else if (queryMode === 'subject' && this.area && this.subject) {
        this.mode = 'subject';
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
        const savedPremiumStatus = localStorage.getItem('testPremiumStatus');
        this.isFreeTrial = savedPremiumStatus !== 'true';
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

    this.subscriptions.push(routeParamsSub, queryParamsSub);
  }
  checkTrialLimits() {
    
    if (!this.isFreeTrial) {
      this.canStartQuiz = true;
      this.showTrialWarning = false;
      this.remainingAttempts = -1; // Ilimitado
      return;
    }
    
    const areaKey = this.area || 'desenvolvimento-web';
    this.remainingAttempts = this.freeTrialService.getRemainingAttempts(areaKey);
    this.canStartQuiz = this.remainingAttempts > 0;
    
    if (this.remainingAttempts === 0) {
      this.showTrialWarning = true;
      this.trialMessage = `Você esgotou suas tentativas diárias para ${this.getCategoryTitle(areaKey)}. Tente outras áreas ou faça upgrade para Premium!`;
    } else if (this.remainingAttempts <= 2) {
      this.showTrialWarning = true;
      this.trialMessage = `Restam apenas ${this.remainingAttempts} tentativa(s) hoje para ${this.getCategoryTitle(areaKey)}. Aproveite!`;
    } else {
      this.showTrialWarning = false;
      this.trialMessage = `Você tem ${this.remainingAttempts} tentativas restantes hoje para ${this.getCategoryTitle(areaKey)}.`;
    }
    
    console.log('🎯 Trial status:', {
      areaKey,
      remainingAttempts: this.remainingAttempts,
      canStartQuiz: this.canStartQuiz,
      showWarning: this.showTrialWarning
    });
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
  loadFavorites() {
    try {
      const saved = localStorage.getItem('favoriteQuestions');
      if (saved) {
        const favorites = JSON.parse(saved);
        this.favoriteQuestions = new Set(favorites);
      }
    } catch (error) {
      this.favoriteQuestions = new Set();
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
      
      // Carregar index.json
      const indexResponse = await fetch('assets/data/index.json');
      if (!indexResponse.ok) {
        throw new Error('Erro ao carregar index');
      }
      
      const indexData = await indexResponse.json();
      
      if (!indexData.structure || !indexData.structure[this.area]) {
        throw new Error(`Área ${this.area} não encontrada`);
      }
      
      const subjects = indexData.structure[this.area];
      console.log('🔍 Procurando questão ID:', this.specificQuestionId, 'na área:', this.area);
      
      // Procurar a questão em todos os assuntos da área
      for (const subject of subjects) {
        try {
          const response = await fetch(`assets/data/areas/${this.area}/${subject}.json`);
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions) {
              const foundQuestion = fileData.questions.find((q: any) => String(q.id) === String(this.specificQuestionId));
              
              if (foundQuestion) {
                console.log('✅ Questão encontrada em:', subject);
                
                // Configurar o quiz com apenas essa questão
                this.questions = [{
                  ...foundQuestion,
                  area: this.area,
                  subject: subject,
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
          console.warn(`Erro ao carregar ${subject}:`, error);
        }
      }
      
      // Se não encontrou a questão
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
    const validAreas = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];
    if (!validAreas.includes(this.area)) {
      this.showError(`Área inválida: ${this.area}. Áreas válidas: ${validAreas.join(', ')}`);
      return;
    }
    
    this.loadingMessage = `Carregando questões de ${this.getCategoryTitle(this.area)}...`;
    
    // ✅ TENTAR CARREGAR QUESTÕES REAIS DA ÁREA ESPECÍFICA
    this.tryLoadRealQuestions().then(success => {
      if (!success) {
        this.generateEmergencyQuestionsForArea(this.area);
      }
    }).catch(error => {
      this.generateEmergencyQuestionsForArea(this.area);
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
    
    // ✅ USAR O MESMO SISTEMA DE EMERGÊNCIA
    this.tryLoadRealQuestions().then(success => {
      if (!success) {
        this.generateEmergencyQuestions();
      }
    });
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
      this.showError('Limite de tentativas diárias excedido!');
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
    
    // ✅ REGISTRAR TENTATIVA APENAS AO COMPLETAR O QUIZ (FREE TRIAL)
    if (this.isFreeTrial) {
      const areaKey = this.area || 'desenvolvimento-web';
      
      // Registrar a tentativa agora que o quiz foi completado
      const registered = this.freeTrialService.registerAttempt(areaKey);
      
      if (registered) {
        console.log(`✅ Tentativa registrada para ${areaKey}`);
      }
      
      // Atualizar tentativas restantes
      const remaining = this.freeTrialService.getRemainingAttempts(areaKey);
      this.remainingAttempts = remaining;
      this.canStartQuiz = remaining > 0;
    }
    
    // ✅ NÃO MOSTRAR SNACKBAR AO COMPLETAR - A TELA DE RESULTADOS JÁ MOSTRA TUDO
    // Apenas atualizar flags se tentativas esgotadas
    if (this.isFreeTrial && this.remainingAttempts === 0) {
      this.canStartQuiz = false;
      this.showTrialWarning = true;
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
      
      // Navegar
      this.router.navigate(['/']);
      
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
      
      this.showSuccessMessage('💾 Progresso salvo automaticamente');
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
  toggleFavorite(): void {
    if (!this.currentQuestion) {
      this.showErrorMessage('Nenhuma questão para favoritar');
      return;
    }
    
    const questionId = this.currentQuestion.id;
    
    if (this.favoriteQuestions.has(questionId)) {
      // ✅ REMOVER DOS FAVORITOS
      this.favoriteQuestions.delete(questionId);
      this.showSuccessMessage('⭐ Removido dos favoritos');
      this.playCorrectSound();
    } else {
      // ✅ ADICIONAR AOS FAVORITOS
      this.favoriteQuestions.add(questionId);
      this.showSuccessMessage('💖 Adicionado aos favoritos');
      this.playCorrectSound();
    }
    
    // ✅ SALVAR NO LOCALSTORAGE
    this.saveFavorites();
    
    console.log('⭐ Favoritos atualizados:', Array.from(this.favoriteQuestions));
  }

  // ✅ VERIFICAR SE QUESTÃO ATUAL É FAVORITA
  isFavorite(): boolean {
    if (!this.currentQuestion) {
      return false;
    }
    
    return this.favoriteQuestions.has(this.currentQuestion.id);
  }

  // ✅ SALVAR FAVORITOS NO LOCALSTORAGE
  private saveFavorites(): void {
    try {
      const favoritesArray = Array.from(this.favoriteQuestions);
      localStorage.setItem('favoriteQuestions', JSON.stringify(favoritesArray));
    } catch (error) {
    }
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

    // Para free trial, filtrar apenas áreas com tentativas disponíveis
    return allAreas
      .map(area => ({
        ...area,
        remaining: this.freeTrialService.getRemainingAttempts(area.key)
      }))
      .filter(area => area.remaining > 0);
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
    
    // ✅ TEMPORÁRIO: Usar questões de emergência até implementar carregamento real
    this.showSuccessMessage('🧠 Quiz Inteligente: usando questões demonstrativas');
    this.generateEmergencyQuestions();
  }

  private loadCustomQuestions(): void {
    
    // ✅ TEMPORÁRIO: Usar questões de emergência até implementar carregamento real
    this.showSuccessMessage('🎯 Quiz Personalizado: usando questões demonstrativas');
    this.generateEmergencyQuestions();
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
      
      // ✅ VERIFICAR SE INDEX.JSON EXISTE
      const indexResponse = await fetch('assets/data/index.json');
      
      if (!indexResponse.ok) {
        return false;
      }
      
      const indexData = await indexResponse.json();
      console.log('✅ Index.json carregado:', {
        totalQuestions: indexData.stats?.totalQuestions || 'N/A',
        areas: Object.keys(indexData.structure || {}).length,
        estrutura: indexData.structure
      });
      
      if (!indexData.structure || Object.keys(indexData.structure).length === 0) {
        return false;
      }
      
      // ✅ TENTAR CARREGAR UM ARQUIVO DE TESTE DE CADA ÁREA (CAMINHO CORRIGIDO)
      let foundQuestions = false;
      
      for (const [areaKey, subjects] of Object.entries(indexData.structure)) {
        const subjectList = subjects as string[];
        if (subjectList && subjectList.length > 0) {
          const firstSubject = subjectList[0];
          // ✅ CAMINHO CORRETO COM /areas/
          const testFile = `assets/data/areas/${areaKey}/${firstSubject}.json`;
          
          
          try {
            const testResponse = await fetch(testFile);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              if (testData.questions && Array.isArray(testData.questions) && testData.questions.length > 0) {
                foundQuestions = true;
                break; // Encontrou pelo menos um arquivo válido
              } else {
              }
            } else {
            }
          } catch (fileError) {
          }
        }
      }
      
      if (!foundQuestions) {
        return false;
      }
      
      // ✅ SE CHEGOU ATÉ AQUI, TEM QUESTÕES REAIS
      
      // ✅ CARREGAR QUESTÕES BASEADO NO MODO
      switch (this.mode) {
        case 'area':
          await this.loadAreaQuestionsFromReal(indexData);
          break;
        case 'subject':
          await this.loadSubjectQuestionsFromReal(indexData);
          break;
        case 'mixed':
        default:
          await this.loadMixedQuestionsFromReal(indexData);
          break;
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }

  // ✅ CORRIGIR O loadMixedQuestionsFromReal COM CAMINHO CORRETO:
  private async loadMixedQuestionsFromReal(indexData: any): Promise<void> {
    try {
      
      const allQuestions: Question[] = [];
      const limit = this.getQuestionLimit();
      
      // ✅ CARREGAR ALGUMAS QUESTÕES DE CADA ÁREA (CAMINHO CORRIGIDO)
      for (const [areaKey, subjects] of Object.entries(indexData.structure)) {
        
        const areaSubjects = subjects as string[];
        const firstSubject = areaSubjects[0];
        
        if (firstSubject) {
          try {
            // ✅ CAMINHO CORRETO COM /areas/
            const filename = `assets/data/areas/${areaKey}/${firstSubject}.json`;
            const response = await fetch(filename);
            
            if (response.ok) {
              const fileData = await response.json();
              if (fileData.questions && fileData.questions.length > 0) {
                // ✅ PEGAR ALGUMAS QUESTÕES DA ÁREA
                const areaQuestions = fileData.questions
                  .slice(0, Math.ceil(limit / 4))
                  .map((q: any) => ({
                    ...q,
                    area: areaKey,
                    subject: firstSubject,
                    category: areaKey
                  }));
              
                allQuestions.push(...areaQuestions);
              }
            }
          } catch (error) {
          }
        }
      }
    
      if (allQuestions.length === 0) {
        throw new Error('Nenhuma questão real carregada');
      }
    
      // ✅ EMBARALHAR E CONFIGURAR
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
      
      if (!indexData.structure[this.area]) {
        throw new Error(`Área '${this.area}' não encontrada no index`);
      }
      
      const subjects = indexData.structure[this.area];
      const areaQuestions: Question[] = [];
      
      for (const subject of subjects) {
        try {
          // ✅ CAMINHO CORRETO COM /areas/
          const filename = `assets/data/areas/${this.area}/${subject}.json`;
          const response = await fetch(filename);
          
          if (response.ok) {
            const fileData = await response.json();
            if (fileData.questions && fileData.questions.length > 0) {
              const questionsWithMeta = fileData.questions.map((q: any) => ({
                ...q,
                area: this.area,
                subject: subject,
                category: this.area
              }));
              
              areaQuestions.push(...questionsWithMeta);
            }
          }
        } catch (error) {
        }
      }
      
      if (areaQuestions.length === 0) {
        throw new Error(`Nenhuma questão real encontrada para área ${this.area}`);
      }
      
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
      
      if (!indexData.structure[this.area] || !indexData.structure[this.area].includes(this.subject)) {
        throw new Error(`Subject '${this.subject}' não encontrado na área '${this.area}'`);
      }
      
      // ✅ CAMINHO CORRETO COM /areas/
      const filename = `assets/data/areas/${this.area}/${this.subject}.json`;
      const response = await fetch(filename);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const fileData = await response.json();
      
      if (!fileData.questions || !Array.isArray(fileData.questions)) {
        throw new Error('Formato de arquivo inválido');
      }
      
      const questionsWithMeta = fileData.questions.map((q: any) => ({
        ...q,
        area: this.area,
        subject: this.subject,
        category: this.area
      }));
      
      // ✅ EMBARALHAR E CONFIGURAR
      const shuffled = this.shuffleArray(questionsWithMeta);
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
    // ✅ RETORNAR LIMITE BASEADO NO PLANO DO USUÁRIO
    if (this.isFreeTrial) {
      return this.FREE_QUESTIONS_LIMIT; // 10 questões para FREE
    } else {
      return this.PREMIUM_QUESTIONS_LIMIT; // 20 questões para PREMIUM
    }
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
}
