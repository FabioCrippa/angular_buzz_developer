import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // ✅ ADICIONAR IMPORT
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

// ✅ INTERFACES ATUALIZADAS
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
    name: 'Quizzfy',
    version: '1.0.0',
    description: 'Plataforma completa de preparação profissional'
  };
  
  totalQuestions: number = 0;
  areas: Area[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  Math = Math;

  constructor(
    private http: HttpClient,
    private router: Router, // ✅ ADICIONAR NO CONSTRUCTOR
    private titleService: Title,
    private snackBar: MatSnackBar, // ✅ NOVO: para notificações
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Dashboard - Quizzfy');
    this.loadDashboardData();
  }

  // ✅ CARREGAMENTO DE DADOS
  private loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.http.get<IndexData>('assets/data/index.json').subscribe({
      next: (indexData) => {
        this.appInfo = {
          name: 'Quizzfy',
          version: indexData.appInfo?.version || '1.0.0',
          description: 'Plataforma completa de preparação profissional'
        };
        
        this.totalQuestions = indexData.stats.totalQuestions;
        
        const areasDashboard = [
          {
            key: 'desenvolvimento-web',
            displayName: 'Desenvolvimento Web',
            icon: '💻',
            questionCount:
              (indexData.stats.byArea['desenvolvimento-web'] || 0) +
              (indexData.stats.byArea['metodologias'] || 0) +
              (indexData.stats.byArea['design'] || 0) +
              (indexData.stats.byArea['seguranca'] || 0) +
              (indexData.stats.byArea['entrevista'] || 0),
            subjects: [
              ...(indexData.structure['desenvolvimento-web'] || []),
              ...(indexData.structure['metodologias'] || []),
              ...(indexData.structure['design'] || []),
              ...(indexData.structure['seguranca'] || []),
              ...(indexData.structure['entrevista'] || [])
            ]
          },
          {
            key: 'portugues',
            displayName: 'Português',
            icon: '📚',
            questionCount: indexData.stats.byArea['portugues'] || 0,
            subjects: indexData.structure['portugues'] || []
          },
          {
            key: 'matematica',
            displayName: 'Matemática',
            icon: '🧮',
            questionCount: indexData.stats.byArea['matematica'] || 0,
            subjects: indexData.structure['matematica'] || []
          },
          {
            key: 'informatica',
            displayName: 'Informática',
            icon: '🖥️',
            questionCount: indexData.stats.byArea['informatica'] || 0,
            subjects: indexData.structure['informatica'] || []
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
        console.error('Erro ao carregar dados do dashboard:', error);
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
        console.error('Erro na navegação:', error);
        this.showErrorMessage('Erro ao navegar para a área');
      });
    }, 500);
  }

  // ✅ AÇÕES RÁPIDAS - FUNCIONALIDADES
  startRandomQuiz(): void {
    const availableAreas = this.areas.filter(area => area.available);
    
    if (availableAreas.length === 0) {
      this.showWarningMessage('Nenhuma área disponível para quiz');
      return;
    }

    // ✅ SELECIONA ÁREA ALEATÓRIA
    const randomArea = availableAreas[Math.floor(Math.random() * availableAreas.length)];
    
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
        console.error('Erro ao iniciar quiz:', error);
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
        console.error('Erro ao visualizar progresso:', error);
        this.showErrorMessage('Erro ao carregar progresso');
      });
    }, 500);
  }

  viewFavorites(): void {
    // ✅ VERIFICA SE HÁ FAVORITOS
    const favorites = JSON.parse(localStorage.getItem('favoriteQuestions') || '[]');
    
    if (favorites.length === 0) {
      this.showWarningMessage('Você ainda não possui questões favoritas');
      return;
    }
    
    this.showSuccessMessage(`Carregando ${favorites.length} questões favoritas...`);
    
    setTimeout(() => {
      this.router.navigate(['/favorites']).catch(error => {
        console.error('Erro ao visualizar favoritos:', error);
        this.showErrorMessage('Erro ao carregar favoritos');
      });
    }, 500);
  }

  // ✅ RECARGA DE DADOS
  reloadData(): void {
    console.log('🔄 Recarregando dados do dashboard...');
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
    console.log('💎 Navegando para upgrade premium...');
    
    // ✅ FEEDBACK VISUAL
    this.showSuccessMessage('Carregando planos premium...');
    
    // ✅ NAVEGAR COM CONTEXTO
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'dashboard',
        timestamp: Date.now(),
        currentPlan: 'free' // Usuário atual está no plano gratuito
      }
    });
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
      'desenvolvimento-web': 'Desenvolvimento Web',
      'portugues': 'Português',
      'matematica': 'Matemática',
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
      'desenvolvimento-web': 'Tecnologias modernas para desenvolvimento de aplicações web.',
      'portugues': 'Gramática, interpretação de texto e redação.',
      'matematica': 'Álgebra, geometria, estatística e raciocínio lógico.',
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

  getAreaStats(areaName: string): { difficulty: string; avgTime: string } {
    const stats: { [key: string]: { difficulty: string; avgTime: string } } = {
      'desenvolvimento-web': { difficulty: 'Alto', avgTime: '3min' },
      'portugues': { difficulty: 'Médio', avgTime: '2min' },
      'matematica': { difficulty: 'Alto', avgTime: '4min' },
      'informatica': { difficulty: 'Médio', avgTime: '2min' },
      'direito': { difficulty: 'Alto', avgTime: '3min' },
      'administracao': { difficulty: 'Médio', avgTime: '2min' },
      'contabilidade': { difficulty: 'Alto', avgTime: '3min' },
      'economia': { difficulty: 'Médio', avgTime: '2min' }
    };
    return stats[areaName] || { difficulty: 'Médio', avgTime: '2min' };
  }

  getAreaProgress(areaName: string): number {
    // ✅ RECUPERA PROGRESSO DO LOCALSTORAGE
    const savedProgress = localStorage.getItem(`progress_${areaName}`);
    if (savedProgress) {
      return parseInt(savedProgress, 10);
    }
    
    // ✅ PROGRESSO SIMULADO BASEADO NO NOME
    const progressMap: { [key: string]: number } = {
      'desenvolvimento-web': 75,
      'portugues': 60,
      'matematica': 45,
      'informatica': 80,
      'direito': 30,
      'administracao': 65,
      'contabilidade': 40,
      'economia': 55
    };
    return progressMap[areaName] || Math.floor(Math.random() * 100);
  }

  // ✅ TRACKBY FUNCTIONS PARA PERFORMANCE
  trackByAreaName(index: number, area: Area): string {
    return area.name;
  }

  trackBySubject(index: number, subject: string): string {
    return subject;
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
}
