import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { QuizService } from '../../core/services/quiz.service';
import { AnonymousAttemptService } from '../../core/services/anonymous-attempt.service';
import { TrialAnalyticsService } from '../../core/services/trial-analytics.service';
import { TrialStreakService } from '../../core/services/trial-streak.service';
import { AttemptsLimitDialogComponent } from '../../shared/components/attempts-limit-dialog/attempts-limit-dialog.component';

interface Question {
  id: string;
  category: string;
  question: string;
  options: { id: number; name: string; alias: string }[];
  correct: string;
  explanation: string;
  difficulty?: string;
}

interface QuestionWithAnswer extends Question {
  userAnswer?: string;
  isCorrect?: boolean;
}

@Component({
  selector: 'app-anonymous-quiz',
  templateUrl: './anonymous-quiz.component.html',
  styleUrls: ['./anonymous-quiz.component.css']
})
export class AnonymousQuizComponent implements OnInit, OnDestroy {
  // ✅ ESTADO DO QUIZ
  currentState: 'loading' | 'quiz' | 'results' = 'loading';
  questions: QuestionWithAnswer[] = [];
  currentQuestionIndex: number = 0;
  score: number = 0;
  correctAnswers: number = 0;
  startTime: Date = new Date();
  finalTime: number = 0;
  elapsedTime: number = 0;
  private timerSubscription: any = null;

  // ✅ CONTROLES
  loadingMessage: string = 'Preparando 10 questões incríveis para você...';
  loadingProgress: number = 0;
  canProceed: boolean = false;
  isLoading: boolean = true;

  // ✅ UI
  selectedAnswer: string | null = null;
  showExplanation: boolean = false;
  currentQuestion: QuestionWithAnswer | null = null;
  answerFeedback: { isCorrect: boolean; message: string } | null = null;

  // ✅ CACHE E PERFORMANCE
  private indexCache: any = null;

  // ✅ DEVICE ID & IP (SEGURANÇA)
  deviceId: string = '';
  userIp: string = 'unknown';
  remainingAttempts: number = 7;

  // ✅ STREAK & TRIAL SYSTEM
  currentStreak: number = 0;
  streakDisplay: string = 'Comece hoje!';
  private allQuestionsCache: any[] = [];
  private poolIds: string[] = [];

  // ✅ CATEGORIAS PARA DISPLAY
  private categoryMap: { [key: string]: { name: string; icon: string; color: string } } = {
    'analise-desenvolvimento-sistemas': { name: 'Análise e Desenvolvimento', icon: '🏗️', color: '#667eea' },
    'informatica-geral': { name: 'Informática Geral', icon: '💻', color: '#764ba2' },
    'matematica': { name: 'Matemática', icon: '📐', color: '#f093fb' },
    'portugues': { name: 'Português', icon: '📚', color: '#4facfe' }
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private quizService: QuizService,
    private snackBar: MatSnackBar,
    private router: Router,
    private attemptService: AnonymousAttemptService,
    private dialog: MatDialog,
    private analyticsService: TrialAnalyticsService,
    private streakService: TrialStreakService
  ) {}

  ngOnInit(): void {
    this.initializeDeviceAndLoad();
  }

  // ✅ INICIALIZAR DEVICE ID E CARREGAR QUESTÕES
  private async initializeDeviceAndLoad(): Promise<void> {
    try {
      // 1. Gerar/recuperar Device ID
      this.deviceId = this.attemptService.getOrCreateDeviceId();

      // 2. Obter IP do cliente
      this.userIp = await this.attemptService.getClientIp();

      // 3. Carregar streak do usuário
      const streakData = this.streakService.getStreakData();
      this.currentStreak = streakData.currentStreak;
      this.streakDisplay = this.streakService.getStreakDisplay(this.currentStreak);

      // 4. Verificar se atingiu o paywall (7 dias)
      if (this.streakService.hasReachedPaywall(this.currentStreak)) {
        this.showStreakLimitDialog();
        return;
      }

      // 5. Inicializar tentativas do dia (localStorage)
      const localAttempts = localStorage.getItem('sowlfy_attempts');
      this.remainingAttempts = localAttempts ? parseInt(localAttempts) : 7;

      // 6. Carregar questões
      this.loadRandomQuestions();
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      this.loadRandomQuestions();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerSubscription) {
      clearInterval(this.timerSubscription);
    }
  }

  // ✅ CARREGAR 7 QUESTÕES DO POOL FIXO (SEM REPETIÇÃO POR DIA)
  async loadRandomQuestions(): Promise<void> {
    try {
      this.currentState = 'loading';
      this.loadingMessage = 'Preparando suas 7 questões de hoje...';
      this.loadingProgress = 0;

      // Obter todas as questões
      const allQuestions: Question[] = [];
      const courses = ['analise-desenvolvimento-sistemas', 'informatica-geral', 'matematica', 'portugues'];

      for (const course of courses) {
        try {
          const questions = await this.loadQuestionsFromCourse(course);
          allQuestions.push(...questions);
          this.loadingProgress += 25;
        } catch (error) {
          console.warn(`Erro ao carregar questões de ${course}:`, error);
        }
      }

      // Cache de todas as questões
      this.allQuestionsCache = allQuestions;

      // Configurar pool fixo (primeira vez) ou recuperar (próximas vezes)
      this.poolIds = this.streakService.setFixedPool(allQuestions);

      // Obter as 7 questões do dia (determinístico por data)
      this.questions = this.streakService.getDailyQuestions(allQuestions, this.poolIds);

      if (this.questions.length < 7) {
        this.snackBar.open('Apenas ' + this.questions.length + ' questões disponíveis hoje', 'Fechar', {
          duration: 3000
        });
      }

      this.currentQuestion = this.questions[0];
      this.currentState = 'quiz';
      this.startTimer();

      // ✅ LOG ANALYTICS - QUIZ INICIADO
      this.analyticsService.logEvent(
        'quiz_started',
        this.deviceId,
        this.userIp,
        {
          totalQuestions: this.questions.length,
          streakDays: this.currentStreak
        }
      );
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      this.snackBar.open('Erro ao carregar questões. Tente novamente.', 'Fechar', {
        duration: 3000
      });
      this.router.navigate(['/home']);
    }
  }

  // ✅ CARREGAR QUESTÕES DE UM CURSO (COM PARALLELIZAÇÃO)
  private async loadQuestionsFromCourse(courseId: string): Promise<Question[]> {
    try {
      // ✅ CACHE DO INDEX.JSON
      if (!this.indexCache) {
        const indexUrl = 'assets/data/index.json';
        this.indexCache = await this.http.get<any>(indexUrl).toPromise();
      }

      const course = this.indexCache.cursos.find((c: any) => c.id === courseId);
      if (!course) return [];

      // ✅ CARREGAR TODOS OS TÓPICOS EM PARALELO
      const topicPromises: Promise<Question[]>[] = [];

      for (const disciplina of course.disciplinas) {
        for (const topico of disciplina.topicos) {
          const filePath = `assets/data/areas/${courseId}/${disciplina.id}/${topico.arquivo}`;
          const promise = this.loadTopicQuestions(filePath);
          topicPromises.push(promise);
        }
      }

      // ✅ ESPERAR POR TODOS OS TÓPICOS EM PARALELO
      const allResults = await Promise.all(topicPromises);
      const allQuestions = allResults.flat();

      return allQuestions;
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      return [];
    }
  }

  // ✅ CARREGAR QUESTÕES DE UM TÓPICO
  private async loadTopicQuestions(filePath: string): Promise<Question[]> {
    try {
      const data = await this.http.get<any>(filePath).toPromise();
      if (data && data.questions && Array.isArray(data.questions)) {
        return data.questions;
      }
      return [];
    } catch (error) {
      console.warn(`Erro ao carregar ${filePath}:`, error);
      return [];
    }
  }

  // ✅ INICIAR TIMER
  private startTimer(): void {
    this.timerSubscription = setInterval(() => {
      this.elapsedTime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    }, 1000); // Atualizar a cada segundo
  }
  private selectRandomQuestions(questions: Question[], count: number): QuestionWithAnswer[] {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(q => ({
      ...q,
      userAnswer: undefined,
      isCorrect: undefined
    }));
  }

  // ✅ SELECIONAR RESPOSTA (COM VALIDAÇÃO BACKEND)
  selectAnswer(optionAlias: string): void {
    if (!this.currentQuestion) return;

    // ❌ NÃO PERMITIR SE EXPLICAÇÃO JÁ FOI MOSTRADA
    if (this.showExplanation) return;

    // ✅ PERMITIR DESELECIONAR - Clicando na mesma opção que já está selecionada
    if (this.selectedAnswer === optionAlias) {
      this.selectedAnswer = null;
      this.answerFeedback = null;
      return;
    }

    // ✅ PERMITIR MUDAR SELEÇÃO - Se já selecionou e clica em outra opção (sem mostrar explicação)
    if (this.selectedAnswer !== null && this.selectedAnswer !== optionAlias && !this.showExplanation) {
      this.selectedAnswer = optionAlias;
      if (this.currentQuestion) {
        this.currentQuestion.userAnswer = optionAlias;
        this.currentQuestion.isCorrect = optionAlias === this.currentQuestion.correct;
        this.answerFeedback = {
          isCorrect: this.currentQuestion.isCorrect,
          message: this.currentQuestion.isCorrect ? '✓ Resposta Correta!' : '✗ Resposta Incorreta'
        };
      }
      return;
    }

    // Se chegou aqui, é primeira seleção (selectedAnswer === null)
    // ✅ PROCESSAR RESPOSTA COM VALIDAÇÃO LOCAL
    this.processAnswerLocal(optionAlias);
  }

  // ✅ FALLBACK: PROCESSAR RESPOSTA SEM BACKEND
  private processAnswerLocal(optionAlias: string): void {
    // Verificar tentativas no localStorage
    const attempts = parseInt(localStorage.getItem('sowlfy_attempts') || '7');

    if (attempts <= 0) {
      this.showAttemptsLimitDialog({
        allowed: false,
        attempts: 7,
        remaining: 0,
        message: 'Limite de tentativas atingido'
      });
      return;
    }

    this.selectedAnswer = optionAlias;
    if (this.currentQuestion) {
      this.currentQuestion.userAnswer = optionAlias;
      this.currentQuestion.isCorrect = optionAlias === this.currentQuestion.correct;

      this.remainingAttempts = attempts - 1;
      localStorage.setItem('sowlfy_attempts', this.remainingAttempts.toString());

      this.answerFeedback = {
        isCorrect: this.currentQuestion.isCorrect,
        message: this.currentQuestion.isCorrect ? '✓ Resposta Correta!' : '✗ Resposta Incorreta'
      };

      if (this.currentQuestion.isCorrect) {
        this.correctAnswers++;
      }

      // ✅ LOG ANALYTICS - RESPOSTA SELECIONADA
      this.analyticsService.logEvent(
        'answer_selected',
        this.deviceId,
        this.userIp,
        {
          questionNumber: this.currentQuestionIndex + 1,
          totalQuestions: this.questions.length,
          correctAnswers: this.correctAnswers,
          category: this.currentQuestion.category,
          remainingAttempts: this.remainingAttempts
        }
      );

      setTimeout(() => {
        this.showExplanation = true;
      }, 300);
    }
  }

  // ✅ MOSTRAR DIALOG DE LIMITE DE STREAK (7 DIAS ATINGIDOS)
  private showStreakLimitDialog(): void {
    // ✅ LOG ANALYTICS - LIMITE DE STREAK ATINGIDO
    this.analyticsService.logEvent(
      'streak_limit_reached',
      this.deviceId,
      this.userIp,
      {
        streakDays: this.currentStreak
      }
    );

    const dialogRef = this.dialog.open(AttemptsLimitDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        title: '🔥 Parabéns! Você completou 7 dias!',
        message: 'Você desbloqueou quizzes ilimitados. Faça upgrade para continuar praticando sem restrições!',
        remaining: 0,
        totalAttempts: 7,
        isStreakLimit: true,
        deviceId: this.deviceId,
        userIp: this.userIp
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/home']);
    });
  }

  // ✅ MOSTRAR DIALOG DE LIMITE DE TENTATIVAS
  private showAttemptsLimitDialog(response: any): void {
    // ✅ LOG ANALYTICS - LIMITE DE TENTATIVAS ATINGIDO
    this.analyticsService.logEvent(
      'attempts_limit_reached',
      this.deviceId,
      this.userIp,
      {
        questionNumber: this.currentQuestionIndex + 1,
        totalQuestions: this.questions.length,
        correctAnswers: this.correctAnswers
      }
    );

    const dialogRef = this.dialog.open(AttemptsLimitDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: false,
      data: {
        remaining: response.remaining || 0,
        resetAt: response.resetAt || response.nextResetAt,
        totalAttempts: 7,
        deviceId: this.deviceId,
        userIp: this.userIp
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Dialog fechado, usuário escolheu voltar ou fazer upgrade
    });
  }

  // ✅ PRÓXIMA QUESTÃO
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.selectedAnswer = null;
      this.showExplanation = false;
      this.answerFeedback = null;
    } else {
      this.completeQuiz();
    }
  }

  // ✅ COMPLETAR QUIZ
  completeQuiz(): void {
    if (this.timerSubscription) {
      clearInterval(this.timerSubscription);
    }
    this.finalTime = this.elapsedTime;
    this.score = Math.round((this.correctAnswers / this.questions.length) * 100);
    this.currentState = 'results';
  }

  // ✅ SHARE RESULTADO
  shareResult(): void {
    const message = `🎯 Acertei ${this.correctAnswers}/${this.questions.length} questões (${this.score}%) no Quiz Anônimo da SOWLFY! Você consegue fazer melhor? 💪`;

    if (navigator.share) {
      navigator.share({
        title: 'SOWLFY Quiz',
        text: message,
        url: window.location.href
      });
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(message).then(() => {
        this.snackBar.open('Resultado copiado para a área de transferência!', 'Fechar', {
          duration: 2000
        });
      });
    }
  }

  // ✅ CRIAR CONTA
  createAccount(): void {
    localStorage.setItem('quiz_result_to_save', JSON.stringify({
      score: this.score,
      correctAnswers: this.correctAnswers,
      totalQuestions: this.questions.length,
      timestamp: new Date().toISOString()
    }));
    this.router.navigate(['/'], { queryParams: { signup: true, referral: 'quiz' } });
  }

  // ✅ VOLTAR PARA HOME
  backToHome(): void {
    this.router.navigate(['/home']);
  }

  // ✅ UTILITÁRIOS
  getCategoryName(category: string): string {
    const categoryInfo = this.categoryMap[category] || { name: category, icon: '📝', color: '#667eea' };
    return categoryInfo.name;
  }

  getCategoryIcon(category: string): string {
    const categoryInfo = this.categoryMap[category] || { name: category, icon: '📝', color: '#667eea' };
    return categoryInfo.icon;
  }

  getCategoryColor(category: string): string {
    const categoryInfo = this.categoryMap[category] || { name: category, icon: '📝', color: '#667eea' };
    return categoryInfo.color;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  getProgressPercentage(): number {
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  getTimeFormatted(): string {
    const minutes = Math.floor(this.finalTime / 60);
    const seconds = this.finalTime % 60;
    return `${minutes}m ${seconds}s`;
  }

  getScoreColor(): string {
    if (this.score >= 80) return '#4caf50'; // Verde
    if (this.score >= 60) return '#ff9800'; // Laranja
    return '#f44336'; // Vermelho
  }

  getScoreMessage(): string {
    if (this.score >= 90) return 'Excelente! 🌟';
    if (this.score >= 75) return 'Muito bom! 👏';
    if (this.score >= 60) return 'Bom! 👍';
    if (this.score >= 40) return 'Continue praticando! 💪';
    return 'Tente novamente! 🎯';
  }
}
