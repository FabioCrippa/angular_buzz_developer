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
    console.log('📝 Carregando', firestoreFavorites.length, 'favoritos do Firestore');
    
    if (!firestoreFavorites || firestoreFavorites.length === 0) {
      this.favorites = [];
      return;
    }

    try {
      // 1. Carregar o index para saber onde estão as questões
      const index = await this.dataService.getIndex().toPromise();

      if (!index?.structure || !index?.areas) {
        console.error('❌ Index mal formatado');
        this.favorites = [];
        return;
      }

      // 2. Para cada favorito, buscar a questão completa
      const loadedQuestions: FavoriteQuestion[] = [];
      
      for (const favorite of firestoreFavorites) {
        const questionId = Number(favorite.questionId);
        console.log('🔍 Buscando questão ID:', questionId, '| Adicionada em:', favorite.addedAt);
        
        let found = false;
        
        // Buscar em todas as áreas
        for (const areaKey of Object.keys(index.structure)) {
          if (found) break;
          
          const area = index.areas[areaKey];
          const subjects = index.structure[areaKey];
          
          // Buscar em todas as matérias da área
          for (const subjectKey of subjects) {
            if (found) break;
            
            try {
              const data = await this.dataService.getQuestions(areaKey, subjectKey).toPromise();
              const questions = data.questions || data;
              const metadata = data.metadata || {};
              
              // Buscar a questão pelo ID
              const question = questions.find((q: any) => Number(q.id) === questionId);
              
              if (question) {
                console.log('✅ Questão', questionId, 'encontrada em', areaKey, '/', subjectKey);
                
                // Mapear dificuldade
                const difficultyMap: { [key: string]: 'Fácil' | 'Médio' | 'Difícil' } = {
                  'fundamental': 'Fácil',
                  'intermediário': 'Médio',
                  'intermediario': 'Médio',
                  'avançado': 'Difícil',
                  'avancado': 'Difícil',
                  'easy': 'Fácil',
                  'medium': 'Médio',
                  'hard': 'Difícil'
                };
                
                const rawDifficulty = question.difficulty || metadata.difficulty || 'fundamental';
                const mappedDifficulty = difficultyMap[rawDifficulty.toLowerCase()] || 'Médio';
                
                // Converter para FavoriteQuestion mantendo dados do Firestore
                loadedQuestions.push({
                  id: String(question.id),
                  question: question.question,
                  area: areaKey,
                  areaDisplayName: area.displayName || areaKey,
                  difficulty: mappedDifficulty,
                  subject: subjectKey,
                  options: question.options || [],
                  correctAnswer: question.correctAnswer || 0,
                  explanation: question.explanation || '',
                  addedDate: favorite.addedAt || new Date().toISOString(),
                  attempts: 0,
                  icon: this.getAreaIcon(areaKey)
                });
                
                found = true;
                break;
              }
            } catch (error) {
              // Arquivo não existe, continuar
              console.warn(`    ⚠️ Erro ao carregar ${areaKey}/${subjectKey}`);
            }
          }
        }
        
        if (!found) {
          console.warn('⚠️ Questão não encontrada:', questionId);
        }
      }
      
      this.favorites = loadedQuestions;
      console.log('🎉 Total de favoritos carregados:', this.favorites.length);
      
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
    // Carregar IDs reais dos favoritos do localStorage
    const savedFavorites = localStorage.getItem('favoriteQuestions');
    
    if (!savedFavorites) {
      this.showErrorMessage('Você ainda não tem questões favoritas!');
      return;
    }

    const favoriteIds: string[] = JSON.parse(savedFavorites);
    
    if (favoriteIds.length === 0) {
      this.showErrorMessage('Você precisa ter pelo menos uma questão favorita!');
      return;
    }

    this.showSuccessMessage(`Iniciando quiz com ${favoriteIds.length} questões favoritas...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'favorites',
          questionIds: favoriteIds.join(','),
          count: favoriteIds.length
        }
      });
    }, 500);
  }

  startAreaQuiz(area: string): void {
    console.log('🎯 Iniciando quiz da área:', area);
    
    // Carregar IDs reais dos favoritos do localStorage
    const savedFavorites = localStorage.getItem('favoriteQuestions');
    
    if (!savedFavorites) {
      this.showErrorMessage('Você ainda não tem questões favoritas!');
      return;
    }

    const allFavoriteIds: string[] = JSON.parse(savedFavorites);
    console.log('📂 Total de favoritos:', allFavoriteIds);
    
    if (allFavoriteIds.length === 0) {
      this.showErrorMessage('Você ainda não tem questões favoritas!');
      return;
    }
    
    // Filtrar IDs que pertencem à área (formato: "area-123" ou contém o nome da área)
    const areaKey = area.toLowerCase().replace(/ /g, '-');
    console.log('🔍 Buscando IDs da área:', areaKey);
    
    const areaFavoriteIds = allFavoriteIds.filter((id: any) => {
      const idStr = String(id).toLowerCase();
      return idStr.startsWith(areaKey + '-') || idStr.includes(areaKey);
    });
    
    console.log('✅ IDs encontrados:', areaFavoriteIds);
    
    if (areaFavoriteIds.length === 0) {
      this.showErrorMessage(`Nenhuma questão favorita encontrada para ${area}!`);
      console.warn('⚠️ Nenhum ID match para área:', areaKey);
      return;
    }

    this.showSuccessMessage(`Iniciando quiz de ${area} com ${areaFavoriteIds.length} questões...`);
    
    setTimeout(() => {
      console.log('🔗 Navegando para /quiz com params:', {
        mode: 'area-favorites',
        area: areaKey,
        questionIds: areaFavoriteIds.join(','),
        count: areaFavoriteIds.length
      });
      
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'area-favorites',
          area: areaKey,
          questionIds: areaFavoriteIds.join(','),
          count: areaFavoriteIds.length
        }
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
    // Ler IDs reais do localStorage e extrair áreas
    const savedFavorites = localStorage.getItem('favoriteQuestions');
    if (!savedFavorites) return [];
    
    try {
      const favoriteIds: any[] = JSON.parse(savedFavorites);
      const areas = new Set<string>();
      
      // Extrair área de cada ID (formato: "area-123")
      favoriteIds.forEach(id => {
        const idStr = String(id);
        const parts = idStr.split('-');
        if (parts.length >= 2) {
          // Área pode ter hífens (ex: "desenvolvimento-web")
          // Pegar tudo exceto o último elemento (que é o número)
          const areaKey = parts.slice(0, -1).join('-');
          areas.add(areaKey);
        }
      });
      
      return Array.from(areas);
    } catch {
      return [];
    }
  }

  getAreaCount(area: string): number {
    // Contar quantos IDs pertencem a esta área
    const savedFavorites = localStorage.getItem('favoriteQuestions');
    if (!savedFavorites) return 0;
    
    try {
      const favoriteIds: any[] = JSON.parse(savedFavorites);
      return favoriteIds.filter(id => {
        const idStr = String(id).toLowerCase();
        return idStr.startsWith(area + '-') || idStr.includes(area);
      }).length;
    } catch {
      return 0;
    }
  }

  getDifficultyCount(difficulty: string): number {
    return this.favoritesData.favoritesByDifficulty[difficulty] || 0;
  }

  hasAnyAreas(): boolean {
    return this.getAreaKeys().length > 0;
  }
}
