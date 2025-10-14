import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  
  progressData: ProgressData = {
    totalQuestions: 0,
    areasProgress: [],
    lastAccess: '',
    overallStats: {
      totalCompleted: 0,
      averageAccuracy: 0,
      totalTimeSpent: '0h',
      streak: 0
    }
  };
  
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Filtros e ordenação
  sortBy: 'progress' | 'accuracy' | 'name' = 'progress';
  filterBy: 'all' | 'completed' | 'inProgress' | 'notStarted' = 'all';

  constructor(
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Meu Progresso - Quizzfy');
    this.loadProgressData();
  }

  // ===============================================
  // 📊 CARREGAMENTO DE DADOS
  // ===============================================
  
  private loadProgressData(): void {
    this.isLoading = true;
    this.hasError = false;

    try {
      // Carregar dados do localStorage
      const savedProgressData = localStorage.getItem('progressData');
      
      if (savedProgressData) {
        const baseData = JSON.parse(savedProgressData);
        this.processProgressData(baseData);
      } else {
        // Dados simulados se não houver dados salvos
        this.generateSampleData();
      }
      
      this.isLoading = false;
      this.showSuccessMessage('Progresso carregado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      this.hasError = true;
      this.errorMessage = 'Erro ao carregar dados de progresso';
      this.isLoading = false;
      this.showErrorMessage('Erro ao carregar progresso');
    }
  }

  private processProgressData(baseData: any): void {
    // Enriquecer dados com estatísticas detalhadas
    const areasProgress: AreaProgress[] = baseData.areasProgress?.map((area: any) => ({
      name: area.name,
      displayName: area.displayName,
      progress: area.progress || 0,
      questionCount: area.questionCount || 0,
      completed: Math.floor((area.progress || 0) * (area.questionCount || 0) / 100),
      accuracy: this.getAreaAccuracy(area.name),
      timeSpent: this.getAreaTimeSpent(area.name),
      lastActivity: this.getLastActivity(area.name),
      icon: this.getAreaIcon(area.name),
      difficulty: this.getAreaDifficulty(area.name)
    })) || [];

    this.progressData = {
      totalQuestions: baseData.totalQuestions || 0,
      areasProgress,
      lastAccess: baseData.lastAccess || new Date().toISOString(),
      overallStats: this.calculateOverallStats(areasProgress)
    };
  }

  private generateSampleData(): void {
    // Gerar dados de exemplo se não houver dados salvos
    const sampleAreas = [
      { name: 'desenvolvimento-web', displayName: 'Desenvolvimento Web', questionCount: 150 },
      { name: 'portugues', displayName: 'Português', questionCount: 120 },
      { name: 'matematica', displayName: 'Matemática', questionCount: 100 },
      { name: 'informatica', displayName: 'Informática', questionCount: 80 }
    ];

    const areasProgress: AreaProgress[] = sampleAreas.map(area => ({
      name: area.name,
      displayName: area.displayName,
      progress: Math.floor(Math.random() * 100),
      questionCount: area.questionCount,
      completed: 0,
      accuracy: Math.floor(Math.random() * 40) + 60,
      timeSpent: `${Math.floor(Math.random() * 5) + 1}h ${Math.floor(Math.random() * 60)}min`,
      lastActivity: this.getRandomDate(),
      icon: this.getAreaIcon(area.name),
      difficulty: this.getAreaDifficulty(area.name)
    }));

    // Calcular completed baseado no progresso
    areasProgress.forEach(area => {
      area.completed = Math.floor(area.progress * area.questionCount / 100);
    });

    this.progressData = {
      totalQuestions: sampleAreas.reduce((sum, area) => sum + area.questionCount, 0),
      areasProgress,
      lastAccess: new Date().toISOString(),
      overallStats: this.calculateOverallStats(areasProgress)
    };
  }

  // ===============================================
  // 📈 CÁLCULOS E ESTATÍSTICAS
  // ===============================================
  
  private calculateOverallStats(areas: AreaProgress[]): ProgressData['overallStats'] {
    const totalCompleted = areas.reduce((sum, area) => sum + area.completed, 0);
    const averageAccuracy = areas.reduce((sum, area) => sum + area.accuracy, 0) / areas.length;
    const totalMinutes = areas.reduce((sum, area) => {
      const match = area.timeSpent.match(/(\d+)h\s*(\d+)min/);
      if (match) {
        return sum + (parseInt(match[1]) * 60) + parseInt(match[2]);
      }
      return sum;
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalTimeSpent = `${hours}h ${minutes}min`;
    
    return {
      totalCompleted,
      averageAccuracy: Math.round(averageAccuracy),
      totalTimeSpent,
      streak: Math.floor(Math.random() * 15) + 1 // Simulado
    };
  }

  // ===============================================
  // 🎯 AÇÕES E NAVEGAÇÃO
  // ===============================================
  
  startQuizForArea(areaName: string): void {
    const area = this.progressData.areasProgress.find(a => a.name === areaName);
    if (!area) return;

    this.showSuccessMessage(`Iniciando quiz de ${area.displayName}...`);
    
    setTimeout(() => {
      this.router.navigate(['/area', areaName]);
    }, 500);
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
    let filtered = this.progressData.areasProgress;

    // Aplicar filtro
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
    }

    // Aplicar ordenação
    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        default:
          return 0;
      }
    });
  }

  // ===============================================
  // 🎨 FUNÇÕES AUXILIARES
  // ===============================================
  
  private getAreaIcon(areaName: string): string {
    const icons: { [key: string]: string } = {
      'desenvolvimento-web': '💻',
      'portugues': '📚',
      'matematica': '🔢',
      'informatica': '💾',
      'direito': '⚖️',
      'administracao': '📊',
      'contabilidade': '💰',
      'economia': '📈'
    };
    return icons[areaName] || '📖';
  }

  private getAreaDifficulty(areaName: string): string {
    const difficulties: { [key: string]: string } = {
      'desenvolvimento-web': 'Alto',
      'portugues': 'Médio',
      'matematica': 'Alto',
      'informatica': 'Médio',
      'direito': 'Alto',
      'administracao': 'Médio',
      'contabilidade': 'Alto',
      'economia': 'Médio'
    };
    return difficulties[areaName] || 'Médio';
  }

  private getAreaAccuracy(areaName: string): number {
    const saved = localStorage.getItem(`accuracy_${areaName}`);
    return saved ? parseInt(saved) : Math.floor(Math.random() * 40) + 60;
  }

  private getAreaTimeSpent(areaName: string): string {
    const saved = localStorage.getItem(`timeSpent_${areaName}`);
    if (saved) return saved;
    
    const hours = Math.floor(Math.random() * 5) + 1;
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}h ${minutes}min`;
  }

  private getLastActivity(areaName: string): string {
    const saved = localStorage.getItem(`lastActivity_${areaName}`);
    return saved || this.getRandomDate();
  }

  private getRandomDate(): string {
    const days = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toLocaleDateString('pt-BR');
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#22c55e'; // Verde
    if (progress >= 60) return '#3b82f6'; // Azul  
    if (progress >= 40) return '#f59e0b'; // Amarelo
    if (progress >= 20) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
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
    
    return notStarted.length > 0 ? notStarted[0].name : this.progressData.areasProgress[0]?.name;
  }

  // ===============================================
  // 🔄 RECARREGAR DADOS (PÚBLICO)
  // ===============================================

  reloadData(): void {
    console.log('🔄 Recarregando dados do progresso...');
    this.loadProgressData();
  }
}
