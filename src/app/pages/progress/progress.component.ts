import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from 'src/app/core/services/progress.service';
import { DataService } from 'src/app/core/services/data.service';

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
  
  sortBy: 'progress' | 'accuracy' | 'name' = 'progress';
  filterBy: 'all' | 'completed' | 'inProgress' | 'notStarted' = 'all';

  constructor(
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private progressService: ProgressService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Meu Progresso - Quizzfy');
    this.isLoading = true;
    
    this.dataService.getIndex().subscribe({
      next: (indexJson: any) => {
        this.loadProgressData(indexJson);
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

    // ✅ ADICIONE ESTA LINHA PARA SALVAR O INDEX
    this.indexData = indexJson;

    try {
      if (!indexJson || !indexJson.areas || !indexJson.stats) {
        throw new Error('Estrutura do index.json inválida');
      }

      const stats = this.progressService.getStats();
      
      // No método loadProgressData(), logo após capturar as áreas:
      const areasObj = indexJson.areas;
      const areaNames = Object.keys(areasObj);

      const areaDisplayNames: { [key: string]: string } = {};
      
      areaNames.forEach(area => {
        if (areasObj[area] && typeof areasObj[area] === 'object') {
          areaDisplayNames[area] = areasObj[area].displayName || this.formatDisplayName(area);
        } else {
          areaDisplayNames[area] = this.formatDisplayName(area);
        }
      });

      const areaQuestionCounts: { [key: string]: number } = indexJson.stats.byArea || {};

      let lastActivity = '';
      let lastActivityDate = 0;
      
      if (stats.lastActivity) {
        lastActivity = stats.lastActivity;
        lastActivityDate = new Date(stats.lastActivity).getTime();
      } else {
        areaNames.forEach(area => {
          const areaStats = this.progressService.getAreaStats(area);
          if (areaStats.lastActivity) {
            const d = new Date(areaStats.lastActivity).getTime();
            if (d > lastActivityDate) {
              lastActivityDate = d;
              lastActivity = areaStats.lastActivity;
            }
          }
        });
      }

      // No método loadProgressData(), substitua a criação do areasProgress:
      const areasProgress: AreaProgress[] = areaNames.map(area => {
        const areaStats = this.progressService.getAreaStats(area);
        const questionCount = areaQuestionCounts[area] || 0;
        const areaData = this.indexData.areas[area] || {};
        
        return {
          name: area,
          displayName: areaDisplayNames[area],
          progress: questionCount ? Math.round((areaStats.completed / questionCount) * 100) : 0,
          questionCount,
          completed: areaStats.completed,
          accuracy: areaStats.accuracy,
          timeSpent: this.formatTime(areaStats.totalTime),
          lastActivity: areaStats.lastActivity 
            ? new Date(areaStats.lastActivity).toLocaleDateString('pt-BR') 
            : 'Nunca',
          icon: this.getAreaIcon(area),
          difficulty: this.getAreaDifficulty(area),
          description: areaData.description || '' // ✅ Adicione esta linha
        };
      })
      // ✅ FILTRAR APENAS ÁREAS COM PROGRESSO
      .filter(area => area.completed > 0); // Só mostra áreas onde respondeu pelo menos 1 questão

      // ✅ CORRIJA O CÁLCULO DA PRECISÃO MÉDIA
      // Use a precisão geral do serviço, não a média das áreas
      const averageAccuracy = stats.accuracy; // ✅ Use direto do serviço

      this.progressData = {
        totalQuestions: Object.values(areaQuestionCounts).reduce((sum: number, count: number) => sum + count, 0),
        areasProgress,
        lastAccess: lastActivity || new Date().toISOString(),
        overallStats: {
          totalCompleted: stats.totalCompleted,
          averageAccuracy: averageAccuracy,
          totalTimeSpent: this.formatTime(stats.totalTime), // ✅ Certifique-se que está usando stats.totalTime
          streak: stats.streak
        }
      };

      // ✅ ADICIONE ESTE LOG FINAL TAMBÉM

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
  
  // ✅ TENTE DIFERENTES VARIAÇÕES DA ROTA:
  
  // Opção 1: Se a rota é /quiz (sem duplo z)
  this.router.navigate(['/quiz'], {
    queryParams: { 
      area: areaName, 
      limit: 10 
    }
  }).then(success => {
    if (success) {
    } else {
      // ✅ FALLBACK: Se não conseguir ir para quiz, vai para área
      this.navigateToArea(areaName);
    }
  }).catch(error => {
    // ✅ FALLBACK: Se der erro, vai para área
    this.navigateToArea(areaName);
  });
}

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
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
    let filtered = [...this.progressData.areasProgress]; // ✅ Clone para evitar mutação

    switch (this.filterBy) {
      case 'completed':
        filtered = filtered.filter(area => area.progress >= 100);
        break;
      case 'inProgress':
        filtered = filtered.filter(area => area.progress > 0 && area.progress < 100);
        break;
      case 'notStarted':
        filtered = filtered.filter(area => area.progress === 0);
        break;
      default:
        // 'all' - não filtra
        break;
    }

    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'name':
          return a.displayName.localeCompare(b.displayName, 'pt-BR'); // ✅ Localização PT-BR
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
    // ✅ Agora pega do index.json se disponível, senão usa fallback
    const areaData = this.indexData?.areas?.[areaName];
    if (areaData?.icon) {
      return areaData.icon;
    }
    
    // ✅ Fallbacks atualizados
    const icons: { [key: string]: string } = {
      'desenvolvimento-web': '💻',
      'metodologias': '⚙️',
      'design': '🎨',
      'seguranca': '🔒',
      'entrevista': '💼',
      'portugues': '📚',
      'matematica': '🔢',
      'informatica': '💾'
    };
    return icons[areaName] || '📖';
  }

  private getAreaDifficulty(areaName: string): string {
    // ✅ Agora pega do index.json se disponível, senão usa fallback
    const areaData = this.indexData?.areas?.[areaName];
    if (areaData?.difficulty) {
      return areaData.difficulty;
    }
    
    // ✅ Fallbacks atualizados
    const difficulties: { [key: string]: string } = {
      'desenvolvimento-web': 'Alto',
      'metodologias': 'Médio',
      'design': 'Médio',
      'seguranca': 'Alto',
      'entrevista': 'Alto',
      'portugues': 'Médio',
      'matematica': 'Alto',
      'informatica': 'Médio'
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
      area => area.progress > 0 && area.progress < 100
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
    if (!this.indexData?.areas) return [];
    
    const startedAreas = this.progressData.areasProgress.map(a => a.name);
    const allAreas = Object.keys(this.indexData.areas);
    
    return allAreas
      .filter(areaName => !startedAreas.includes(areaName))
      .map(areaName => {
        const areaData = this.indexData.areas[areaName];
        const questionCount = this.indexData.stats?.byArea?.[areaName] || 0;
        
        return {
          name: areaName,
          displayName: areaData.displayName || this.formatDisplayName(areaName),
          description: areaData.description || 'Área de estudo disponível',
          icon: areaData.icon || this.getAreaIcon(areaName),
          difficulty: areaData.difficulty || 'Médio',
          questionCount,
          progress: 0,
          completed: 0,
          accuracy: 0,
          timeSpent: '0s',
          lastActivity: 'Nunca'
        };
      });
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
