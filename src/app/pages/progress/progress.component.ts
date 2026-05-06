import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from 'src/app/core/services/progress.service';
import { DataService } from 'src/app/core/services/data.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { QuizHistoryService, QuizStats, QuizResult } from 'src/app/core/services/quiz-history.service';

interface AreaProgress {
  name: string;
  displayName: string;
  progress: number;
  questionCount: number;
  completed: number;
  accuracy: number;
  timeSpent: string;
  lastActivity: string;
  icon: string;
  difficulty: string;
  description?: string; // ✅ Adicione esta linha
}

interface ProgressData {
  totalQuestions: number;
  areasProgress: AreaProgress[];
  lastAccess: string;
  overallStats: {
    totalCompleted: number;
    averageAccuracy: number;
    totalTimeSpent: string;
    streak: number;
  };
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  
  // ✅ ADICIONE ESTA PROPRIEDADE
  indexData: any = null;
  
  progressData: ProgressData = {
    totalQuestions: 0,
    areasProgress: [],
    lastAccess: new Date().toISOString(), // ✅ Sempre uma data válida
    overallStats: {
      totalCompleted: 0,
      averageAccuracy: 0,
      totalTimeSpent: '0h 0min', // ✅ Formato padrão
      streak: 0
    }
  };
  
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  private firestoreStats: QuizStats | null = null;
  
  sortBy: 'progress' | 'accuracy' | 'name' = 'progress';
  filterBy: 'all' | 'completed' | 'inProgress' | 'notStarted' = 'all';

  constructor(
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private progressService: ProgressService,
    private dataService: DataService,
    private authService: AuthService,
    private quizHistoryService: QuizHistoryService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Meu Progresso - Sowlfy');
    this.isLoading = true;

    const user = this.authService.currentUserValue;

    // Carregar stats reais do Firestore em paralelo com o index.json
    const statsPromise = user?.id
      ? this.quizHistoryService.calculateStats(user.id)
      : Promise.resolve(null);

    statsPromise.then(stats => {
      this.firestoreStats = stats;
    });
    
    this.dataService.getIndex().subscribe({
      next: (indexJson: any) => {
        statsPromise.then(() => this.loadProgressData(indexJson));
      },
      error: (error) => {
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados do sistema';
        this.isLoading = false;
        this.showErrorMessage('Erro ao carregar progresso');
      }
    });
  }

  private loadProgressData(indexJson: any): void {
    this.isLoading = true;
    this.hasError = false;

    this.indexData = indexJson;

    try {
      if (!indexJson) {
        throw new Error('index.json não carregado');
      }

      const stats = this.progressService.getStats();

      // ─── Extrair cursos do novo formato (cursos[]) ou legado (areas{}) ───
      interface CourseEntry { id: string; nome: string; displayName?: string; descricao?: string; icon?: string; totalQuestoes?: number; }
      let courses: CourseEntry[] = [];
      if (Array.isArray(indexJson.cursos)) {
        courses = indexJson.cursos.map((c: any) => ({
          id: c.id,
          nome: c.nome || c.displayName || c.id,
          displayName: c.displayName || c.nome || c.id,
          descricao: c.descricao || '',
          icon: c.icon || '',
          totalQuestoes: c.totalQuestoes || 0
        }));
      } else if (indexJson.areas && typeof indexJson.areas === 'object') {
        // Formato legado
        courses = Object.keys(indexJson.areas).map(id => ({
          id,
          nome: indexJson.areas[id]?.displayName || id,
          displayName: indexJson.areas[id]?.displayName || id,
          descricao: indexJson.areas[id]?.description || '',
          icon: '',
          totalQuestoes: 0
        }));
      }

      if (courses.length === 0) {
        throw new Error('Nenhum curso encontrado no index.json');
      }

      // Contagem de questões por curso (stats.byCurso ou stats.byArea ou totalQuestoes)
      const byArea: { [key: string]: number } = indexJson.stats?.byArea || {};

      let lastActivity = '';
      let lastActivityDate = 0;
      if (stats.lastActivity) {
        lastActivity = stats.lastActivity;
        lastActivityDate = new Date(stats.lastActivity).getTime();
      } else {
        courses.forEach(c => {
          const areaStats = this.progressService.getAreaStats(c.id);
          if (areaStats.lastActivity) {
            const d = new Date(areaStats.lastActivity).getTime();
            if (d > lastActivityDate) { lastActivityDate = d; lastActivity = areaStats.lastActivity; }
          }
        });
      }

      const areasProgress: AreaProgress[] = courses.map(c => {
        const fsArea = this.firestoreStats?.byArea?.[c.id];
        const questionCount = byArea[c.id] || c.totalQuestoes || 0;
        const completed   = fsArea?.totalQuestions ?? 0;
        const accuracy    = fsArea ? Math.round(fsArea.averageScore) : 0;
        const quizzesDone = fsArea?.quizzesTaken ?? 0;
        const lastAct     = fsArea?.lastAttempt
          ? new Date(fsArea.lastAttempt).toLocaleDateString('pt-BR')
          : 'Nunca';
        return {
          name: c.id,
          displayName: c.displayName || c.nome,
          progress: questionCount ? Math.min(100, Math.round((completed / questionCount) * 100)) : 0,
          questionCount,
          completed,
          accuracy,
          timeSpent: quizzesDone > 0 ? `${quizzesDone} quiz${quizzesDone > 1 ? 'zes' : ''}` : '—',
          lastActivity: lastAct,
          icon: c.icon || this.getAreaIcon(c.id),
          difficulty: this.getAreaDifficulty(c.id),
          description: c.descricao || ''
        };
      });

      const totalQuestions = courses.reduce((sum, c) => sum + (byArea[c.id] || c.totalQuestoes || 0), 0);

      this.progressData = {
        totalQuestions,
        areasProgress,
        lastAccess: this.firestoreStats?.recentActivity?.[0]?.completedAt?.toISOString?.() || new Date().toISOString(),
        overallStats: {
          totalCompleted: this.firestoreStats?.totalQuestions ?? 0,
          averageAccuracy: this.firestoreStats?.averageScore ?? 0,
          totalTimeSpent: this.formatTotalTime(this.firestoreStats?.totalTimeSpent ?? 0),
          streak: this.calculateStreak(this.firestoreStats?.recentActivity ?? [])
        }
      };

      this.isLoading = false;
      this.showSuccessMessage('Progresso carregado com sucesso!');
      
    } catch (error) {
      this.hasError = true;
      this.errorMessage = 'Erro ao processar dados de progresso';
      this.isLoading = false;
      this.showErrorMessage('Erro ao carregar progresso');
    }
  }

  // ===============================================
  // 🎯 AÇÕES E NAVEGAÇÃO
  // ===============================================
  
  startQuizForArea(areaName: string): void {
  
  if (!areaName || areaName.trim() === '') {
    this.showErrorMessage('Nome da área inválido');
    return;
  }
  
  this.showSuccessMessage(`Iniciando quiz de ${areaName}...`);
  
  // ✅ NAVEGAÇÃO CORRETA COM MODO 'area' E PARÂMETROS
  this.router.navigate(['/quiz'], {
    queryParams: { 
      mode: 'area',
      area: areaName,
      limit: 10
    }
  }).then(success => {
    if (success) {
      console.log(`✅ Navegou para quiz com área: ${areaName}`);
    } else {
      this.showErrorMessage('Erro ao iniciar quiz');
    }
  }).catch(error => {
    console.error('Erro ao navegar para quiz:', error);
    this.showErrorMessage('Erro ao iniciar quiz');
  });
}

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  isPremium(): boolean {
    return this.authService.isPremium();
  }

  private formatTotalTime(minutes: number): string {
    if (!minutes || minutes <= 0) return '0min';
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  private calculateStreak(activity: QuizResult[]): number {
    if (!activity.length) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = new Set(
      activity.map(q => {
        const d = new Date(q.completedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    let checkDate = today.getTime();
    // Permite começar a contar de hoje ou ontem (caso não estudou hoje ainda)
    if (!dates.has(checkDate)) checkDate -= 86400000;
    let streak = 0;
    while (dates.has(checkDate)) {
      streak++;
      checkDate -= 86400000;
    }
    return streak;
  }

  navigateToUpgrade(): void {
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'progress',
        feature: 'detailed-analytics'
      }
    });
  }

  // ===============================================
  // 🔧 FILTROS E ORDENAÇÃO
  // ===============================================
  
  setSortBy(sortBy: 'progress' | 'accuracy' | 'name'): void {
    this.sortBy = sortBy;
  }

  setFilterBy(filterBy: 'all' | 'completed' | 'inProgress' | 'notStarted'): void {
    this.filterBy = filterBy;
  }

  get filteredAndSortedAreas(): AreaProgress[] {
    if (!this.progressData?.areasProgress?.length) {
      return [];
    }
    
    let filtered = [...this.progressData.areasProgress];

    switch (this.filterBy) {
      case 'completed':
        // Considera "concluída" se tiver completado pelo menos 1 questão
        // OU se progress >= 100% (caso tenha respondido todas as questões disponíveis)
        filtered = filtered.filter(area => area.completed > 0 && area.progress >= 100);
        break;
      case 'inProgress':
        filtered = filtered.filter(area => area.completed > 0 && area.progress < 100);
        break;
      case 'notStarted':
        filtered = filtered.filter(area => area.completed === 0);
        break;
      case 'all':
      default:
        // 'all' - não filtra, retorna todos
        break;
    }

    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'name':
          return a.displayName.localeCompare(b.displayName, 'pt-BR');
        default:
          return 0;
      }
    });
  }

  // ===============================================
  // 🎨 FUNÇÕES AUXILIARES
  // ===============================================
  
  // ✅ Novo método para formatar nomes de exibição
  private formatDisplayName(areaName: string): string {
    return areaName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getAreaIcon(areaName: string): string {
    // Lê icon do cursos[] do index.json
    const curso = this.indexData?.cursos?.find((c: any) => c.id === areaName);
    if (curso?.icon) return curso.icon;

    const icons: { [key: string]: string } = {
      'analise-desenvolvimento-sistemas': '💻',
      'informatica-geral': '💾',
      'matematica': '🔢',
      'portugues': '📚',
      'simulados': '📝'
    };
    return icons[areaName] || '📖';
  }

  private getAreaDifficulty(areaName: string): string {
    const difficulties: { [key: string]: string } = {
      'analise-desenvolvimento-sistemas': 'Alto',
      'informatica-geral': 'Médio',
      'matematica': 'Alto',
      'portugues': 'Médio',
      'simulados': 'Provas Reais'
    };
    return difficulties[areaName] || 'Médio';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#22c55e';
    if (progress >= 60) return '#3b82f6';
    if (progress >= 40) return '#f59e0b';
    if (progress >= 20) return '#f97316';
    return '#ef4444';
  }

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return '#22c55e';
    if (accuracy >= 80) return '#3b82f6';
    if (accuracy >= 70) return '#f59e0b';
    if (accuracy >= 60) return '#f97316';
    return '#ef4444';
  }

  // ===============================================
  // 📢 NOTIFICAÇÕES
  // ===============================================
  
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

  // ===============================================
  // 🎯 MÉTODOS PARA TEMPLATE
  // ===============================================
  
  trackAreaProgress(index: number, area: AreaProgress): string {
    return area.name;
  }

  getProgressLevel(progress: number): string {
    if (progress >= 100) return 'completed';
    if (progress >= 75) return 'high';
    if (progress >= 50) return 'medium';
    if (progress >= 25) return 'low';
    return 'none';
  }

  getInProgressAreasCount(): number {
    return this.progressData.areasProgress.filter(
      area => area.completed > 0 && area.name !== 'simulados'
    ).length;
  }

  getNextAreaToStudy(): string {
    const inProgress = this.progressData.areasProgress.filter(
      area => area.progress > 0 && area.progress < 100
    );
    
    if (inProgress.length > 0) {
      return inProgress[0].name;
    }
    
    const notStarted = this.progressData.areasProgress.filter(
      area => area.progress === 0
    );
    
    return notStarted.length > 0 ? notStarted[0].name : this.progressData.areasProgress[0]?.name || '';
  }

  // ===============================================
  // 🔄 RECARREGAR DADOS (PÚBLICO)
  // ===============================================

  reloadData(): void {
    this.ngOnInit();
  }

  // ✅ Formatação melhorada do tempo
  private formatTime(totalSeconds: number): string {
  
  if (!totalSeconds || totalSeconds === 0) {
    return '0s';
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  let formatted = '';
  
  if (hours > 0) {
    // Se tem horas: "2h 15min 30s"
    formatted = `${hours}h ${minutes}min ${seconds}s`;
  } else if (minutes > 0) {
    // Se tem minutos: "15min 30s"
    formatted = `${minutes}min ${seconds}s`;
  } else {
    // Só segundos: "30s"
    formatted = `${seconds}s`;
  }
  
  return formatted;
}

  // ✅ Adicione este método no seu progress.component.ts

  debugProgress(): void {
    
    const history = this.progressService.getHistory();
    
    // ✅ VERIFIQUE OS TEMPOS INDIVIDUALMENTE
    
    const stats = this.progressService.getStats();
    
    
    if (history.length === 0) {
      this.showErrorMessage('❌ Nenhuma resposta encontrada no histórico');
    } else {
      this.showSuccessMessage(`✅ ${history.length} respostas encontradas`);
    }
  }

  // Adicione estes métodos após os métodos existentes:

  // ✅ MÉTODO PARA ÁREAS DISPONÍVEIS PARA COMEÇAR
  getAvailableAreasToStart(): AreaProgress[] {
    if (!this.indexData?.cursos?.length) return [];

    // Retorna áreas onde o usuário ainda não fez nenhum quiz (completed === 0)
    return this.progressData.areasProgress.filter(a => a.completed === 0);
  }

  // ✅ MÉTODO PARA FORMATAR DATA DE ÚLTIMO ACESSO
  formatLastAccess(dateString: string): string {
    if (!dateString) return 'Nunca';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  }

  // Adicione este método temporário para debug:
  debugAvailableAreas(): void {
    const areas = this.getAvailableAreasToStart();
    
    if (areas.length === 0) {
      this.showErrorMessage('❌ Nenhuma área disponível para começar');
    } else {
      this.showSuccessMessage(`✅ ${areas.length} áreas disponíveis para começar`);
    }
  }

  // ✅ NO progress.component.ts, ADICIONE este método:

  navigateToArea(areaName: string): void {
    
    this.showSuccessMessage(`Explorando ${areaName}...`);
    
    this.router.navigate(['/area', areaName]).then(success => {
      if (!success) {
        this.showErrorMessage('Erro ao navegar para a área');
      }
    });
  }
}
