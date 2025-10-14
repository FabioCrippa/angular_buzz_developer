import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';

interface FavoriteQuestion {
  id: string;
  question: string;
  area: string;
  areaDisplayName: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  subject: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  addedDate: string;
  attempts: number;
  lastAttempt?: string;
  isCorrect?: boolean;
  icon: string;
}

interface FavoritesData {
  totalFavorites: number;
  favoritesByArea: { [key: string]: number };
  favoritesByDifficulty: { [key: string]: number };
  lastUpdated: string;
  recentActivity: {
    added: number;
    removed: number;
    quizzesTaken: number;
  };
}

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  
  favorites: FavoriteQuestion[] = [];
  favoritesData: FavoritesData = {
    totalFavorites: 0,
    favoritesByArea: {},
    favoritesByDifficulty: {},
    lastUpdated: '',
    recentActivity: {
      added: 0,
      removed: 0,
      quizzesTaken: 0
    }
  };
  
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Filtros e ordenação
  filterBy: 'all' | 'easy' | 'medium' | 'hard' = 'all';
  sortBy: 'recent' | 'area' | 'difficulty' | 'attempts' = 'recent';
  selectedArea: string = 'all';
  searchQuery: string = '';
  
  // Areas disponíveis
  availableAreas: string[] = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Meus Favoritos - Quizzfy');
    this.loadFavoritesData();
  }

  // ===============================================
  // 📊 CARREGAMENTO DE DADOS
  // ===============================================
  
  loadFavoritesData(): void {
    this.isLoading = true;
    this.hasError = false;

    try {
      // Carregar favoritos do localStorage
      const savedFavorites = localStorage.getItem('favoriteQuestions');
      
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites);
        this.loadFavoriteQuestions(favoriteIds);
      } else {
        // Gerar dados de exemplo se não houver favoritos
        this.generateSampleFavorites();
      }
      
      this.calculateFavoritesData();
      this.extractAvailableAreas();
      
      this.isLoading = false;
      this.showSuccessMessage('Favoritos carregados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.hasError = true;
      this.errorMessage = 'Erro ao carregar questões favoritas';
      this.isLoading = false;
      this.showErrorMessage('Erro ao carregar favoritos');
    }
  }

  private loadFavoriteQuestions(favoriteIds: string[]): void {
    // Simular carregamento de questões por ID
    // Em uma aplicação real, isso faria chamadas para API
    this.favorites = favoriteIds.map((id, index) => this.generateQuestionById(id, index));
  }

  private generateSampleFavorites(): void {
    // Gerar questões favoritas de exemplo
    const sampleQuestions: FavoriteQuestion[] = [
      {
        id: 'fav-001',
        question: 'Qual é a diferença entre let, const e var em JavaScript?',
        area: 'desenvolvimento-web',
        areaDisplayName: 'Desenvolvimento Web',
        difficulty: 'Médio',
        subject: 'JavaScript',
        options: [
          'Todas funcionam da mesma forma',
          'let e const têm escopo de bloco, var tem escopo de função',
          'Apenas const é imutável',
          'var é mais moderno que let'
        ],
        correctAnswer: 1,
        explanation: 'let e const têm escopo de bloco e não podem ser redeclaradas no mesmo escopo.',
        addedDate: this.getRandomDate(30),
        attempts: Math.floor(Math.random() * 5) + 1,
        lastAttempt: this.getRandomDate(10),
        isCorrect: Math.random() > 0.3,
        icon: '💻'
      },
      {
        id: 'fav-002',
        question: 'O que é o conceito de "hoisting" em JavaScript?',
        area: 'desenvolvimento-web',
        areaDisplayName: 'Desenvolvimento Web',
        difficulty: 'Difícil',
        subject: 'JavaScript',
        options: [
          'Elevação de variáveis e funções',
          'Compressão de código',
          'Otimização de performance',
          'Debugging avançado'
        ],
        correctAnswer: 0,
        explanation: 'Hoisting é o comportamento do JavaScript de mover declarações para o topo do escopo.',
        addedDate: this.getRandomDate(25),
        attempts: Math.floor(Math.random() * 3) + 1,
        lastAttempt: this.getRandomDate(5),
        isCorrect: Math.random() > 0.4,
        icon: '💻'
      },
      {
        id: 'fav-003',
        question: 'Qual é a função da vírgula na língua portuguesa?',
        area: 'portugues',
        areaDisplayName: 'Português',
        difficulty: 'Fácil',
        subject: 'Pontuação',
        options: [
          'Apenas separar palavras',
          'Indicar pausas e separar elementos',
          'Finalizar frases',
          'Não tem função específica'
        ],
        correctAnswer: 1,
        explanation: 'A vírgula indica pausas curtas e separa elementos de uma oração.',
        addedDate: this.getRandomDate(20),
        attempts: Math.floor(Math.random() * 4) + 1,
        lastAttempt: this.getRandomDate(8),
        isCorrect: Math.random() > 0.2,
        icon: '📚'
      },
      {
        id: 'fav-004',
        question: 'Como calcular a derivada de x²?',
        area: 'matematica',
        areaDisplayName: 'Matemática',
        difficulty: 'Médio',
        subject: 'Cálculo',
        options: [
          'x',
          '2x',
          'x²',
          '2x²'
        ],
        correctAnswer: 1,
        explanation: 'A derivada de x² é 2x, aplicando a regra da potência.',
        addedDate: this.getRandomDate(15),
        attempts: Math.floor(Math.random() * 6) + 1,
        lastAttempt: this.getRandomDate(3),
        isCorrect: Math.random() > 0.5,
        icon: '🔢'
      },
      {
        id: 'fav-005',
        question: 'O que é um algoritmo de ordenação bubble sort?',
        area: 'informatica',
        areaDisplayName: 'Informática',
        difficulty: 'Médio',
        subject: 'Algoritmos',
        options: [
          'Algoritmo de busca',
          'Algoritmo de ordenação por comparação',
          'Algoritmo de hash',
          'Algoritmo de compressão'
        ],
        correctAnswer: 1,
        explanation: 'Bubble sort é um algoritmo de ordenação que compara elementos adjacentes.',
        addedDate: this.getRandomDate(12),
        attempts: Math.floor(Math.random() * 3) + 1,
        lastAttempt: this.getRandomDate(6),
        isCorrect: Math.random() > 0.4,
        icon: '💾'
      }
    ];

    this.favorites = sampleQuestions;
  }

  private generateQuestionById(id: string, index: number): FavoriteQuestion {
    const areas = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];
    const difficulties: ('Fácil' | 'Médio' | 'Difícil')[] = ['Fácil', 'Médio', 'Difícil'];
    const selectedArea = areas[index % areas.length];
    
    return {
      id,
      question: `Questão favorita ${index + 1} sobre ${selectedArea}`,
      area: selectedArea,
      areaDisplayName: this.getAreaDisplayName(selectedArea),
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      subject: 'Assunto Exemplo',
      options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: 'Explicação da questão favorita.',
      addedDate: this.getRandomDate(30),
      attempts: Math.floor(Math.random() * 5) + 1,
      lastAttempt: this.getRandomDate(10),
      isCorrect: Math.random() > 0.3,
      icon: this.getAreaIcon(selectedArea)
    };
  }

  // ===============================================
  // 📊 CÁLCULOS E ESTATÍSTICAS
  // ===============================================
  
  private calculateFavoritesData(): void {
    this.favoritesData = {
      totalFavorites: this.favorites.length,
      favoritesByArea: this.calculateByArea(),
      favoritesByDifficulty: this.calculateByDifficulty(),
      lastUpdated: new Date().toISOString(),
      recentActivity: {
        added: Math.floor(Math.random() * 5) + 1,
        removed: Math.floor(Math.random() * 3),
        quizzesTaken: Math.floor(Math.random() * 10) + 1
      }
    };
  }

  private calculateByArea(): { [key: string]: number } {
    return this.favorites.reduce((acc, fav) => {
      acc[fav.areaDisplayName] = (acc[fav.areaDisplayName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private calculateByDifficulty(): { [key: string]: number } {
    return this.favorites.reduce((acc, fav) => {
      acc[fav.difficulty] = (acc[fav.difficulty] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private extractAvailableAreas(): void {
    this.availableAreas = [...new Set(this.favorites.map(f => f.areaDisplayName))];
  }

  // ===============================================
  // 🔧 FILTROS E ORDENAÇÃO
  // ===============================================
  
  setFilterBy(filter: 'all' | 'easy' | 'medium' | 'hard'): void {
    this.filterBy = filter;
  }

  setSortBy(sort: 'recent' | 'area' | 'difficulty' | 'attempts'): void {
    this.sortBy = sort;
  }

  setSelectedArea(area: string): void {
    this.selectedArea = area;
  }

  get filteredAndSortedFavorites(): FavoriteQuestion[] {
    let filtered = [...this.favorites];

    // Filtrar por dificuldade
    if (this.filterBy !== 'all') {
      const difficultyMap: { [key in 'easy' | 'medium' | 'hard']: string } = {
        'easy': 'Fácil',
        'medium': 'Médio',
        'hard': 'Difícil'
      };
      filtered = filtered.filter(fav => fav.difficulty === difficultyMap[this.filterBy as 'easy' | 'medium' | 'hard']);
    }

    // Filtrar por área
    if (this.selectedArea !== 'all') {
      filtered = filtered.filter(fav => fav.areaDisplayName === this.selectedArea);
    }

    // Filtrar por busca
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.question.toLowerCase().includes(query) ||
        fav.subject.toLowerCase().includes(query) ||
        fav.areaDisplayName.toLowerCase().includes(query)
      );
    }

    // Ordenar
    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'recent':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'area':
          return a.areaDisplayName.localeCompare(b.areaDisplayName);
        case 'difficulty':
          const diffOrder: { [key in 'Fácil' | 'Médio' | 'Difícil']: number } = { 
            'Fácil': 1, 
            'Médio': 2, 
            'Difícil': 3 
          };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        case 'attempts':
          return b.attempts - a.attempts;
        default:
          return 0;
      }
    });
  }

  // ===============================================
  // 🎯 AÇÕES
  // ===============================================
  
  removeFavorite(questionId: string): void {
    const question = this.favorites.find(f => f.id === questionId);
    if (!question) return;

    // Confirmar remoção
    if (confirm(`Remover "${question.question.substring(0, 50)}..." dos favoritos?`)) {
      this.favorites = this.favorites.filter(f => f.id !== questionId);
      
      // Atualizar localStorage
      const favoriteIds = this.favorites.map(f => f.id);
      localStorage.setItem('favoriteQuestions', JSON.stringify(favoriteIds));
      
      // Recalcular dados
      this.calculateFavoritesData();
      this.extractAvailableAreas();
      
      this.showSuccessMessage('Questão removida dos favoritos!');
    }
  }

  startFavoritesQuiz(): void {
    if (this.favorites.length === 0) {
      this.showErrorMessage('Você precisa ter pelo menos uma questão favorita!');
      return;
    }

    this.showSuccessMessage('Iniciando quiz com suas questões favoritas...');
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'favorites',
          count: Math.min(this.favorites.length, 10)
        }
      });
    }, 500);
  }

  startAreaQuiz(area: string): void {
    const areaFavorites = this.favorites.filter(f => f.areaDisplayName === area);
    
    if (areaFavorites.length === 0) {
      this.showErrorMessage(`Nenhuma questão favorita encontrada para ${area}!`);
      return;
    }

    this.showSuccessMessage(`Iniciando quiz de ${area}...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'area-favorites',
          area: area.toLowerCase().replace(' ', '-'),
          count: Math.min(areaFavorites.length, 10)
        }
      });
    }, 500);
  }

  viewQuestion(question: FavoriteQuestion): void {
    // Simular visualização detalhada da questão
    this.showSuccessMessage('Abrindo questão...');
    
    // Em uma aplicação real, abriria modal ou navegaria para página da questão
    console.log('Visualizando questão:', question);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToUpgrade(): void {
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'favorites',
        feature: 'unlimited-favorites'
      }
    });
  }

  reloadData(): void {
    console.log('🔄 Recarregando favoritos...');
    this.showSuccessMessage('Recarregando dados...');
    this.loadFavoritesData();
  }

  // ===============================================
  // 🔧 FUNÇÕES AUXILIARES
  // ===============================================
  
  trackFavorite(index: number, favorite: FavoriteQuestion): string {
    return favorite.id;
  }

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

  private getAreaDisplayName(areaName: string): string {
    const names: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'portugues': 'Português',
      'matematica': 'Matemática',
      'informatica': 'Informática',
      'direito': 'Direito',
      'administracao': 'Administração',
      'contabilidade': 'Contabilidade',
      'economia': 'Economia'
    };
    return names[areaName] || areaName;
  }

  private getRandomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Fácil': return '#22c55e';
      case 'Médio': return '#f59e0b';
      case 'Difícil': return '#ef4444';
      default: return '#64748b';
    }
  }

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'Fácil': return 'trending_down';
      case 'Médio': return 'trending_flat';
      case 'Difícil': return 'trending_up';
      default: return 'help';
    }
  }

  getAttemptStatusIcon(isCorrect: boolean | undefined): string {
    if (isCorrect === undefined) return 'help_outline';
    return isCorrect ? 'check_circle' : 'cancel';
  }

  getAttemptStatusColor(isCorrect: boolean | undefined): string {
    if (isCorrect === undefined) return '#64748b';
    return isCorrect ? '#22c55e' : '#ef4444';
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
  // 🔧 MÉTODOS HELPER PARA TEMPLATE
  // ===============================================
  
  getAreaKeys(): string[] {
    return Object.keys(this.favoritesData.favoritesByArea);
  }

  getAreaCount(area: string): number {
    return this.favoritesData.favoritesByArea[area] || 0;
  }

  getDifficultyCount(difficulty: string): number {
    return this.favoritesData.favoritesByDifficulty[difficulty] || 0;
  }

  hasAnyAreas(): boolean {
    return Object.keys(this.favoritesData.favoritesByArea).length > 0;
  }
}
