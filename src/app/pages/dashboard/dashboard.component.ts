import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // ✅ ADICIONAR IMPORT
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService, UserProgress } from '../../core/services/gamification.service';
import { QuizHistoryService, QuizStats } from '../../core/services/quiz-history.service';
import { FavoritesService } from '../../core/services/favorites.service';

// ✅ INTERFACES ATUALIZADAS
interface IndexData {
  appInfo: {
    name: string;
    version: string;
    description: string;
  };
  stats: {
    totalQuestions?: number;
    totalQuestoes?: number;
    byArea: { [key: string]: number };
  };
  structure?: { [key: string]: string[] };
  cursos?: Array<{
    id: string;
    nome: string;
    displayName?: string;
    icon?: string;
    totalQuestoes?: number;
    disciplinas?: Array<{
      id: string;
      topicos?: Array<{ id: string; nome: string; arquivo?: string }>;
    }>;
  }>;
}

interface Area {
  name: string;
  displayName: string;
  questionCount: number;
  subjects: string[];
  available: boolean;
  description?: string;
  stats?: {
    difficulty: string;
    avgTime: string;
  };
  progress?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  // ✅ PROPRIEDADES DA CLASSE
  appInfo: IndexData['appInfo'] = {
    name: 'Sowlfy',
    version: '1.0.0',
    description: 'Plataforma completa de preparação profissional'
  };
  
  totalQuestions: number = 0;
  areas: Area[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  Math = Math;
  
  // 🎮 GAMIFICAÇÃO
  userProgress: UserProgress | null = null;
  userLevel: number = 1;
  userXP: number = 0;
  levelName: string = 'Iniciante';
  xpToNextLevel: number = 100;
  levelProgress: number = 0;
  recentQuizzes: any[] = [];
  isLoadingGamification: boolean = true;
  quizStats: QuizStats | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private gamificationService: GamificationService,
    private quizHistoryService: QuizHistoryService,
    private favoritesService: FavoritesService
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Dashboard - Sowlfy');
    this.checkSchoolAccessAndLoad();
    this.loadGamificationData();
  }

  /**
   * Verificar acesso do aluno à escola e carregar dados
   * Se subscription inativa, mostra mensagem de bloqueio
   */
  private checkSchoolAccessAndLoad(): void {
    const user = this.authService.currentUserValue;
    
    if (!user?.schoolId) {
      this.loadDashboardData();
      return;
    }

    // Chamar Cloud Function para verificar se a escola tem subscription ativa
    const checkUrl = 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/checkSchoolAccess';
    this.http.post<any>(checkUrl, { schoolId: user.schoolId }).subscribe({
      next: (response: any) => {
        if (response.hasAccess) {
          // Acesso permitido, carregar dados normalmente
          this.loadDashboardData();
        } else {
          // Acesso negado - subscription inativa
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = `🔒 A escola perdeu acesso à plataforma. Status: ${response.subscriptionStatus}`;
        }
      },
      error: (error: any) => {
        // Erro ao verificar, carregar dados mesmo assim (vai ser bloqueado pelas Rules)
        console.error('Erro ao verificar acesso:', error);
        this.loadDashboardData();
      }
    });
  }
  
  // 🎮 CARREGAR DADOS DE GAMIFICAÇÃO
  private async loadGamificationData(): Promise<void> {
    try {
      const user = this.authService.currentUserValue;
      if (!user?.id) {
        console.warn('Usuário não logado');
        this.isLoadingGamification = false;
        return;
      }
      
      // Carregar progresso
      this.userProgress = await this.gamificationService.loadUserProgress(user.id);
      
      if (this.userProgress) {
        this.userXP = this.userProgress.xp;
        this.userLevel = this.userProgress.level;
        
        const levelInfo = this.gamificationService.getLevelInfo(this.userXP);
        this.levelName = levelInfo.levelName;
        this.xpToNextLevel = levelInfo.xpToNextLevel;
        this.levelProgress = levelInfo.progressPercentage;
      }
      
      // Carregar histórico recente de quizzes
      this.recentQuizzes = await this.quizHistoryService.getRecentQuizzes(user.id, 5);

      // Carregar estatísticas reais por área
      this.quizStats = await this.quizHistoryService.calculateStats(user.id);
      
      this.isLoadingGamification = false;
    } catch (error) {
      console.error('Erro ao carregar gamificação:', error);
      this.isLoadingGamification = false;
    }
  }

  // ✅ CARREGAMENTO DE DADOS
  private loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.http.get<IndexData>('assets/data/index.json').subscribe({
      next: (indexData) => {
        this.appInfo = {
          name: 'Sowlfy',
          version: indexData.appInfo?.version || '1.0.0',
          description: 'Plataforma completa de preparação profissional'
        };
        
        this.totalQuestions = indexData.stats.totalQuestoes || indexData.stats.totalQuestions || 0;

        // Helper: extrai lista de subjects de cursos (novo formato) ou structure (formato antigo)
        const getSubjects = (oldKey: string, newCursoId: string): string[] => {
          if (indexData.structure?.[oldKey]) {
            return indexData.structure[oldKey];
          }
          const curso = indexData.cursos?.find(c => c.id === newCursoId);
          if (curso?.disciplinas) {
            const subjects: string[] = [];
            for (const disc of curso.disciplinas) {
              for (const topico of (disc.topicos || [])) {
                subjects.push(topico.nome || topico.id);
              }
            }
            return subjects;
          }
          return [];
        };

        // Helper: soma contagem de questões de múltiplos keys
        const getCount = (...keys: string[]): number =>
          keys.reduce((sum, k) => sum + (indexData.stats.byArea[k] || 0), 0);

        const areasDashboard = [
          {
            key: 'analise-desenvolvimento-sistemas',
            displayName: 'Análise e Desenvolvimento de Sistemas',
            icon: '💻',
            questionCount: getCount('analise-desenvolvimento-sistemas', 'desenvolvimento-web', 'metodologias', 'design', 'seguranca', 'entrevista'),
            subjects: getSubjects('desenvolvimento-web', 'analise-desenvolvimento-sistemas')
          },
          {
            key: 'informatica-geral',
            displayName: 'Informática Geral',
            icon: '🖥️',
            questionCount: getCount('informatica-geral', 'informatica'),
            subjects: getSubjects('informatica', 'informatica-geral')
          },
          {
            key: 'matematica',
            displayName: 'Matemática',
            icon: '🧮',
            questionCount: getCount('matematica'),
            subjects: getSubjects('matematica', 'matematica')
          },
          {
            key: 'portugues',
            displayName: 'Português',
            icon: '📚',
            questionCount: getCount('portugues'),
            subjects: getSubjects('portugues', 'portugues')
          },
          {
            key: 'simulados',
            displayName: 'Simulados',
            icon: '📝',
            questionCount: getCount('simulados'),
            subjects: getSubjects('simulados', 'simulados')
          }
        ];
        
        this.areas = areasDashboard.map(area => ({
          name: area.key,
          displayName: area.displayName,
          questionCount: area.questionCount,
          subjects: area.subjects,
          available: area.questionCount > 0,
          description: this.getAreaDescription(area.key),
          stats: this.getAreaStats(area.key),
          progress: this.getAreaProgress(area.key)
        }));

        this.isLoading = false;
        
        // ✅ NOVO: Notificação de sucesso
        this.showSuccessMessage(`${this.areas.length} áreas carregadas com sucesso!`);
      },
      error: (error) => {
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados do dashboard. Tente recarregar a página.';
        this.isLoading = false;
        
        // ✅ NOVO: Notificação de erro
        this.showErrorMessage('Erro ao carregar dados do dashboard');
      }
    });
  }

  // ✅ NAVEGAÇÃO PARA ÁREAS - FUNCIONALIDADE PRINCIPAL
  navigateToArea(areaName: string): void {
    const area = this.areas.find(a => a.name === areaName);
    
    if (!area) {
      this.showErrorMessage('Área não encontrada');
      return;
    }

    if (!area.available) {
      this.showWarningMessage(`A área "${area.displayName}" ainda não está disponível`);
      return;
    }

    // ✅ IMPLEMENTAR: Salvar área selecionada no localStorage
    localStorage.setItem('selectedArea', areaName);
    localStorage.setItem('selectedAreaData', JSON.stringify(area));

    // ✅ NOTIFICAÇÃO DE NAVEGAÇÃO
    this.showSuccessMessage(`Carregando ${area.displayName}...`);

    // ✅ NAVEGAÇÃO COM DELAY PARA UX
    setTimeout(() => {
      this.router.navigate(['/area', areaName]).catch(error => {
        this.showErrorMessage('Erro ao navegar para a área');
      });
    }, 500);
  }

  // ✅ AÇÕES RÁPIDAS - FUNCIONALIDADES
  startRandomQuiz(): void {
    // Excluir simulados — têm fluxo próprio (caderno de prova completo)
    const availableAreas = this.areas.filter(area => area.available && area.name !== 'simulados');
    
    if (availableAreas.length === 0) {
      this.showWarningMessage('Nenhuma área disponível para quiz');
      return;
    }

    // ✅ SALVA CONFIGURAÇÃO DO QUIZ
    const quizConfig = {
      mode: 'random',
      areas: availableAreas.map(a => a.name),
      questionCount: 10,
      timeLimit: null
    };
    
    localStorage.setItem('quizConfig', JSON.stringify(quizConfig));
    
    this.showSuccessMessage(`Iniciando quiz aleatório com ${availableAreas.length} áreas!`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz', 'random']).catch(error => {
        this.showErrorMessage('Erro ao iniciar quiz aleatório');
      });
    }, 500);
  }

  viewProgress(): void {
    // ✅ COLETA DADOS DE PROGRESSO
    const progressData = {
      totalQuestions: this.totalQuestions,
      areasProgress: this.areas.map(area => ({
        name: area.name,
        displayName: area.displayName,
        progress: area.progress || 0,
        questionCount: area.questionCount
      })),
      lastAccess: new Date().toISOString()
    };
    
    localStorage.setItem('progressData', JSON.stringify(progressData));
    
    this.showSuccessMessage('Carregando seu progresso...');
    
    setTimeout(() => {
      this.router.navigate(['/progress']).catch(error => {
        this.showErrorMessage('Erro ao carregar progresso');
      });
    }, 500);
  }

  viewFavorites(): void {
    const user = this.authService.currentUserValue;
    if (!user?.id) {
      this.showWarningMessage('Você precisa estar logado para ver seus favoritos');
      return;
    }

    this.favoritesService.getFavoritesStats(user.id).then(stats => {
      if (stats.total === 0) {
        this.showWarningMessage('Você ainda não possui questões favoritas');
        return;
      }
      this.showSuccessMessage(`Carregando ${stats.total} questões favoritas...`);
      setTimeout(() => {
        this.router.navigate(['/favorites']).catch(() => {
          this.showErrorMessage('Erro ao carregar favoritos');
        });
      }, 500);
    }).catch(() => {
      // Fallback: navegar mesmo assim
      this.router.navigate(['/favorites']);
    });
  }

  // ✅ RECARGA DE DADOS
  reloadData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Simular reload
    setTimeout(() => {
      this.loadDashboardData();
    }, 1000);
  }

  // ===============================================
  // 🚀 NAVEGAÇÃO PARA UPGRADE
  // ===============================================
  navigateToUpgrade(): void {
    
    // ✅ FEEDBACK VISUAL
    this.showSuccessMessage('Carregando planos premium...');
    
    // ✅ NAVEGAR COM CONTEXTO
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'dashboard',
        timestamp: Date.now(),
        currentPlan: this.authService.getUserPlan()
      }
    });
  }

  navigateToJobQuiz(): void {
    this.router.navigate(['/preparar-vaga']);
  }

  // ===============================================
  // 📊 MÉTODOS PARA TEMPLATE
  // ===============================================
  
  // ✅ CALCULAR ÁREAS DISPONÍVEIS
  getAvailableAreasCount(): number {
    return this.areas.filter(area => area.available).length;
  }

  // ✅ OBTER TOTAL DE QUESTÕES
  getTotalQuestions(): number {
    return this.areas.reduce((total, area) => total + area.questionCount, 0);
  }

  // ✅ MÉTODO PARA ÍCONES DAS ÁREAS (se não existir)
  // (Removido por duplicidade)

  // ✅ MÉTODO SHOW SUCCESS MESSAGE (se não existir)
  // (Removido por duplicidade)

  // ✅ FUNÇÕES AUXILIARES - NOMES E DESCRIÇÕES
  getAreaDisplayName(areaName: string): string {
    const displayNames: { [key: string]: string } = {
      'analise-desenvolvimento-sistemas': 'Análise e Desenvolvimento de Sistemas',
      'informatica-geral': 'Informática Geral',
      'matematica': 'Matemática',
      'portugues': 'Português',
      'desenvolvimento-web': 'Desenvolvimento Web',
      'informatica': 'Informática',
      'direito': 'Direito',
      'administracao': 'Administração',
      'contabilidade': 'Contabilidade',
      'economia': 'Economia'
    };
    return displayNames[areaName] || areaName.charAt(0).toUpperCase() + areaName.slice(1);
  }

  getAreaDescription(areaName: string): string {
    const descriptions: { [key: string]: string } = {
      'analise-desenvolvimento-sistemas': 'Tecnologias modernas para desenvolvimento de aplicações web, sistemas e boas práticas.',
      'informatica-geral': 'Sistemas operacionais, redes, banco de dados e hardware.',
      'matematica': 'Álgebra, geometria, estatística e raciocínio lógico.',
      'portugues': 'Gramática, interpretação de texto e redação.',
      'simulados': 'Provas completas no estilo real: Prova Paulista, ENEM e mais.',
      'desenvolvimento-web': 'Tecnologias modernas para desenvolvimento de aplicações web.',
      'informatica': 'Sistemas operacionais, redes e banco de dados.',
      'direito': 'Direito constitucional, civil, penal e administrativo.',
      'administracao': 'Gestão, liderança e processos organizacionais.',
      'contabilidade': 'Contabilidade geral, custos e auditoria.',
      'economia': 'Microeconomia, macroeconomia e economia brasileira.'
    };
    return descriptions[areaName] || 'Área de conhecimento especializado.';
  }

  getAreaIcon(areaName: string): string {
    const icons: { [key: string]: string } = {
      'analise-desenvolvimento-sistemas': '💻',
      'informatica-geral': '🖥️',
      'matematica': '🔢',
      'portugues': '📚',
      'simulados': '📝',
      'desenvolvimento-web': '💻',
      'informatica': '💾',
      'direito': '⚖️',
      'administracao': '📊',
      'contabilidade': '💰',
      'economia': '📈'
    };
    return icons[areaName] || '📖';
  }

  getAreaStats(areaName: string): { difficulty: string; avgTime: string } {
    const stats: { [key: string]: { difficulty: string; avgTime: string } } = {
      'analise-desenvolvimento-sistemas': { difficulty: 'Alto', avgTime: '3min' },
      'informatica-geral': { difficulty: 'M\u00e9dio', avgTime: '2min' },
      'matematica': { difficulty: 'Alto', avgTime: '4min' },
      'portugues': { difficulty: 'M\u00e9dio', avgTime: '2min' },
      'desenvolvimento-web': { difficulty: 'Alto', avgTime: '3min' },
      'informatica': { difficulty: 'Médio', avgTime: '2min' },
      'direito': { difficulty: 'Alto', avgTime: '3min' },
      'administracao': { difficulty: 'Médio', avgTime: '2min' },
      'contabilidade': { difficulty: 'Alto', avgTime: '3min' },
      'economia': { difficulty: 'Médio', avgTime: '2min' }
    };
    return stats[areaName] || { difficulty: 'Médio', avgTime: '2min' };
  }

  getAreaProgress(areaName: string): number {
    // Usa média de acerto real do Firestore (via QuizHistoryService)
    const areaStats = this.quizStats?.byArea?.[areaName];
    if (areaStats && areaStats.quizzesTaken > 0) {
      return Math.round(areaStats.averageScore);
    }
    return 0;
  }

  getAreaQuizCount(areaName: string): number {
    return this.quizStats?.byArea?.[areaName]?.quizzesTaken || 0;
  }

  getAreaAvgScore(areaName: string): number {
    const areaStats = this.quizStats?.byArea?.[areaName];
    if (areaStats && areaStats.quizzesTaken > 0) {
      return Math.round(areaStats.averageScore);
    }
    return 0;
  }

  // ✅ TRACKBY FUNCTIONS PARA PERFORMANCE
  trackByAreaName(index: number, area: Area): string {
    return area.name;
  }

  trackBySubject(index: number, subject: string): string {
    return subject;
  }
  
  // ✅ FORMATAR TEMPO RELATIVO
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  }

  // ✅ FUNÇÕES DE NOTIFICAÇÃO
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // ✅ VERIFICAR SE USUÁRIO É PREMIUM
  isPremium(): boolean {
    return this.authService.isPremium();
  }

  // ✅ OBTER TAMANHO DO QUIZ BASEADO NO PLANO
  getQuizSize(): number {
    return this.isPremium() ? 20 : 10;
  }

  // ✅ OBTER TENTATIVAS RESTANTES PARA UMA ÁREA
  getRemainingAttempts(areaName: string): number {
    try {
      const userId = JSON.parse(localStorage.getItem('sowlfy_user') || '{}').uid;
      const storageKey = `buzz_developer_free_trial_${userId}`;
      const trialData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      if (!trialData.attempts || !trialData.attempts[areaName]) {
        return 1; // 1 tentativa disponível
      }

      const today = new Date().toISOString().split('T')[0];
      const areaAttempts = trialData.attempts[areaName];
      
      if (areaAttempts.lastReset !== today) {
        return 1; // Reset diário
      }

      return Math.max(0, 1 - areaAttempts.count); // Máximo de 1 tentativa
    } catch (error) {
      return 1;
    }
  }
}
