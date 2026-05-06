import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../core/services/data.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { AuthService } from '../../core/services/auth.service';
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
    private snackBar: MatSnackBar,
    private dataService: DataService,
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Meus Favoritos - Sowlfy');
    this.loadFavoritesData();
  }

  // ===============================================
  // 📊 CARREGAMENTO DE DADOS
  // ===============================================
  
  async loadFavoritesData(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;

    try {
      const user = this.authService.currentUserValue;
      
      if (!user?.id) {
        console.warn('⚠️ Usuário não logado');
        this.favorites = [];
        this.isLoading = false;
        this.showWarningMessage('⚠️ Faça login para acessar seus favoritos');
        return;
      }

      console.log('👤 Carregando favoritos para usuário:', user.id);
      
      // Buscar favoritos do Firestore para este usuário específico
      const firestoreFavorites = await this.favoritesService.getAllFavorites(user.id);
      console.log('✅ Favoritos do Firestore:', firestoreFavorites.length);
      
      if (firestoreFavorites.length === 0) {
        this.favorites = [];
        this.calculateFavoritesData();
        this.isLoading = false;
        this.showInfoMessage('Você ainda não tem favoritos. Marque questões durante os quizzes!');
        return;
      }
      
      // Carregar questões completas com dados do Firestore
      await this.loadFavoriteQuestionsFromFirestore(firestoreFavorites);
      
      this.calculateFavoritesData();
      this.extractAvailableAreas();
      
      console.log('📊 Favoritos processados:', this.favorites.length, 'questões');
      
      this.isLoading = false;
      
      if (this.favorites.length > 0) {
        this.showSuccessMessage(`${this.favorites.length} favorito(s) carregado(s)!`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar favoritos:', error);
      this.hasError = true;
      this.errorMessage = 'Erro ao carregar questões favoritas';
      this.isLoading = false;
      this.showErrorMessage('Erro ao carregar favoritos');
    }
  }

  private async loadFavoriteQuestionsFromFirestore(firestoreFavorites: any[]): Promise<void> {
    if (!firestoreFavorites?.length) { this.favorites = []; return; }

    try {
      const index = await this.dataService.getIndex().toPromise();
      const cursos: any[] = index?.cursos || [];

      // Monta lista plana de todos os caminhos area/subject do cursos[]
      const allPaths: { area: string; subject: string }[] = [];
      for (const curso of cursos) {
        for (const disc of (curso.disciplinas || [])) {
          for (const topico of (disc.topicos || [])) {
            const subjectFile = topico.arquivo?.replace('.json', '');
            if (subjectFile) allPaths.push({ area: curso.id, subject: subjectFile });
          }
        }
      }

      const diffMap: { [k: string]: 'Fácil' | 'Médio' | 'Difícil' } = {
        'fundamental': 'Fácil', 'easy': 'Fácil',
        'intermediário': 'Médio', 'intermediario': 'Médio', 'medium': 'Médio',
        'avançado': 'Difícil', 'avancado': 'Difícil', 'hard': 'Difícil'
      };

      const loadedQuestions: FavoriteQuestion[] = [];

      for (const favorite of firestoreFavorites) {
        const questionId = Number(favorite.questionId);
        let found = false;

        // Prioriza busca direta via area+subject armazenados
        const directPath = (favorite.area && favorite.subject)
          ? [{ area: favorite.area, subject: favorite.subject }]
          : [];
        const otherPaths = allPaths.filter(p =>
          !(p.area === favorite.area && p.subject === favorite.subject)
        );
        const searchPaths = [...directPath, ...otherPaths];

        for (const path of searchPaths) {
          if (found) break;
          try {
            const data = await this.dataService.getQuestions(path.area, path.subject).toPromise();
            const questions: any[] = data?.questions || (Array.isArray(data) ? data : []);
            const question = questions.find((q: any) => Number(q.id) === questionId);

            if (question) {
              const rawDiff = (question.difficulty || favorite.difficulty || 'fundamental').toLowerCase();
              const curso = cursos.find((c: any) => c.id === path.area);
              loadedQuestions.push({
                id: String(question.id),
                question: question.question,
                area: path.area,
                areaDisplayName: curso?.displayName || curso?.nome || path.area,
                difficulty: diffMap[rawDiff] || 'Médio',
                subject: path.subject,
                options: question.options || [],
                correctAnswer: question.correctAnswer || 0,
                explanation: question.explanation || '',
                addedDate: favorite.addedAt?.toISOString?.() || favorite.addedAt || new Date().toISOString(),
                attempts: 0,
                icon: this.getAreaIcon(path.area)
              });
              found = true;
            }
          } catch {}
        }
      }

      this.favorites = loadedQuestions;
    } catch (error) {
      console.error('❌ Erro ao carregar questões favoritas:', error);
      this.favorites = [];
    }
  }

  // Método antigo mantido para compatibilidade se necessário
  private async loadFavoriteQuestions(favoriteIds: any[]): Promise<void> {
    // Deprecated - usar loadFavoriteQuestionsFromFirestore
    console.warn('⚠️ Método loadFavoriteQuestions está deprecated');
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
    const difficulties: ('Fácil' | 'Médio' | 'Difícil')[] = ['Fácil', 'Médio', 'Difícil'];
    
    // Extrair área do ID (formato: "desenvolvimento-web-123")
    let selectedArea = 'desenvolvimento-web'; // Área padrão
    
    try {
      const parts = id.split('-');
      if (parts.length >= 2) {
        // Remover último elemento (número) e verificar se é válido
        const lastPart = parts[parts.length - 1];
        if (!isNaN(Number(lastPart))) {
          // Último elemento é um número, então pegar o resto como área
          selectedArea = parts.slice(0, -1).join('-');
        }
      }
    } catch (error) {
      console.warn('Erro ao extrair área do ID:', id, error);
    }
    
    return {
      id,
      question: `Questão favorita ${index + 1} sobre ${this.getAreaDisplayName(selectedArea) || selectedArea}`,
      area: selectedArea,
      areaDisplayName: this.getAreaDisplayName(selectedArea) || selectedArea,
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
        added: 0,
        removed: 0,
        quizzesTaken: 0
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

    // Filtrar por área (comparar com area, não com areaDisplayName)
    if (this.selectedArea !== 'all') {
      filtered = filtered.filter(fav => 
        fav.area === this.selectedArea || 
        fav.areaDisplayName === this.selectedArea ||
        fav.areaDisplayName === this.getAreaDisplayName(this.selectedArea)
      );
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
  
  async removeFavorite(questionId: string): Promise<void> {
    const question = this.favorites.find(f => f.id === questionId);
    if (!question) return;

    // Confirmar remoção
    if (confirm(`Remover "${question.question.substring(0, 50)}..." dos favoritos?`)) {
      const user = this.authService.currentUserValue;
      
      if (user && user.id) {
        // Remover do Firestore
        await this.favoritesService.removeFavorite(user.id, Number(questionId));
      } else {
        // Remover do localStorage se não estiver logado
        const savedFavorites = localStorage.getItem('favoriteQuestions');
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites).filter((id: any) => String(id) !== questionId);
          localStorage.setItem('favoriteQuestions', JSON.stringify(favoriteIds));
        }
      }
      
      // Atualizar lista local
      this.favorites = this.favorites.filter(f => f.id !== questionId);
      
      // Recalcular dados
      this.calculateFavoritesData();
      this.extractAvailableAreas();
      
      this.showSuccessMessage('Questão removida dos favoritos!');
    }
  }

  startFavoritesQuiz(): void {
    if (this.favorites.length === 0) {
      this.showErrorMessage('Você ainda não tem questões favoritas!');
      return;
    }
    const ids = this.favorites.map(f => f.id).join(',');
    this.showSuccessMessage(`Iniciando quiz com ${this.favorites.length} questões favorítas...`);
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: { mode: 'favorites', questionIds: ids, count: this.favorites.length }
      });
    }, 500);
  }

  startFilteredQuiz(): void {
    const filtered = this.filteredAndSortedFavorites;
    if (filtered.length === 0) {
      this.showErrorMessage('Nenhuma questão filtrada para iniciar quiz!');
      return;
    }
    const ids = filtered.map(f => f.id).join(',');
    this.showSuccessMessage(`Iniciando quiz com ${filtered.length} questões filtradas...`);
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: { mode: 'favorites', questionIds: ids, count: filtered.length }
      });
    }, 500);
  }

  startAreaQuiz(area: string): void {
    const areaFavorites = this.favorites.filter(f =>
      f.area === area || f.areaDisplayName === area
    );
    if (areaFavorites.length === 0) {
      this.showErrorMessage(`Nenhum favoríto encontrado para ${area}!`);
      return;
    }
    const ids = areaFavorites.map(f => f.id).join(',');
    this.showSuccessMessage(`Iniciando quiz de ${area} com ${areaFavorites.length} questões...`);
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: { mode: 'favorites', questionIds: ids, count: areaFavorites.length }
      });
    }, 500);
  }

  viewQuestion(question: FavoriteQuestion): void {
    console.log('👁️ Visualizando questão:', question);
    
    if (!question || !question.id || !question.area) {
      this.showErrorMessage('Dados da questão inválidos!');
      console.error('Questão inválida:', question);
      return;
    }
    
    this.showSuccessMessage('Abrindo questão...');
    
    // Navegar para o quiz no modo single question
    setTimeout(() => {
      console.log('🔗 Navegando para /quiz com params:', {
        mode: 'single',
        area: question.area,
        questionId: question.id
      });
      
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'single',
          area: question.area,
          questionId: question.id
        }
      });
    }, 500);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  isPremium(): boolean {
    return this.authService.isPremium();
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
      'analise-desenvolvimento-sistemas': '💻',
      'informatica-geral': '💾',
      'matematica': '🔢',
      'portugues': '📚',
      'simulados': '📝',
      'desenvolvimento-web': '💻',
      'informatica': '💾'
    };
    return icons[areaName] || '📖';
  }

  getAreaDisplayName(areaName: string): string {
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

  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
  
  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 4000,
      panelClass: ['info-snackbar'],
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
    return this.getAreaKeys().length > 0;
  }
}
