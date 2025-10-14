import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';

interface AreaQuestion {
  id: string;
  question: string;
  subject: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  options: string[];
  correctAnswer: number;
  explanation: string;
  tags: string[];
  estimatedTime: string;
  popularity: number;
  isFavorite: boolean;
}

interface AreaData {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  totalQuestions: number;
  subjects: string[];
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  userProgress: {
    completed: number;
    accuracy: number;
    timeSpent: string;
  };
}

@Component({
  selector: 'app-area',
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.css']
})
export class AreaComponent implements OnInit {
  
  areaName: string = '';
  areaData: AreaData | null = null;
  questions: AreaQuestion[] = [];
  
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Filtros
  selectedSubject: string = 'all';
  selectedDifficulty: string = 'all';
  searchQuery: string = '';
  sortBy: 'popularity' | 'difficulty' | 'subject' | 'recent' = 'popularity';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.areaName = params['name'];
      this.loadAreaData();
    });
  }

  // ===============================================
  // 📊 CARREGAMENTO DE DADOS
  // ===============================================
  
  private loadAreaData(): void {
    this.isLoading = true;
    this.hasError = false;

    try {
      // Carregar dados da área
      this.areaData = this.getAreaData(this.areaName);
      
      if (!this.areaData) {
        this.hasError = true;
        this.errorMessage = 'Área não encontrada';
        this.isLoading = false;
        return;
      }

      // Configurar título da página
      this.titleService.setTitle(`${this.areaData.displayName} - Quizzfy`);
      
      // Gerar questões da área
      this.generateAreaQuestions();
      
      this.isLoading = false;
      this.showSuccessMessage(`${this.areaData.displayName} carregada com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao carregar área:', error);
      this.hasError = true;
      this.errorMessage = 'Erro ao carregar dados da área';
      this.isLoading = false;
      this.showErrorMessage('Erro ao carregar área');
    }
  }

  private getAreaData(areaName: string): AreaData | null {
    const areaDatabase: { [key: string]: AreaData } = {
      'desenvolvimento-web': {
        name: 'desenvolvimento-web',
        displayName: 'Desenvolvimento Web',
        description: 'HTML, CSS, JavaScript, React, Angular, Node.js e tecnologias modernas de desenvolvimento web',
        icon: '💻',
        color: '#3b82f6',
        totalQuestions: 150,
        subjects: ['HTML/CSS', 'JavaScript', 'React', 'Angular', 'Node.js', 'APIs', 'Databases'],
        difficulty: { easy: 45, medium: 75, hard: 30 },
        userProgress: {
          completed: Math.floor(Math.random() * 100) + 20,
          accuracy: Math.floor(Math.random() * 30) + 70,
          timeSpent: `${Math.floor(Math.random() * 10) + 5}h`
        }
      },
      'portugues': {
        name: 'portugues',
        displayName: 'Português',
        description: 'Gramática, interpretação de texto, literatura e redação em língua portuguesa',
        icon: '📚',
        color: '#22c55e',
        totalQuestions: 120,
        subjects: ['Gramática', 'Interpretação', 'Literatura', 'Redação', 'Ortografia', 'Sintaxe'],
        difficulty: { easy: 40, medium: 60, hard: 20 },
        userProgress: {
          completed: Math.floor(Math.random() * 80) + 15,
          accuracy: Math.floor(Math.random() * 25) + 75,
          timeSpent: `${Math.floor(Math.random() * 8) + 3}h`
        }
      },
      'matematica': {
        name: 'matematica',
        displayName: 'Matemática',
        description: 'Álgebra, geometria, cálculo, estatística e matemática aplicada',
        icon: '🔢',
        color: '#f59e0b',
        totalQuestions: 100,
        subjects: ['Álgebra', 'Geometria', 'Cálculo', 'Estatística', 'Trigonometria', 'Funções'],
        difficulty: { easy: 30, medium: 45, hard: 25 },
        userProgress: {
          completed: Math.floor(Math.random() * 70) + 10,
          accuracy: Math.floor(Math.random() * 20) + 60,
          timeSpent: `${Math.floor(Math.random() * 12) + 4}h`
        }
      },
      'informatica': {
        name: 'informatica',
        displayName: 'Informática',
        description: 'Sistemas operacionais, redes, segurança da informação e conceitos gerais de TI',
        icon: '💾',
        color: '#8b5cf6',
        totalQuestions: 80,
        subjects: ['SO', 'Redes', 'Segurança', 'Hardware', 'Software', 'Algoritmos'],
        difficulty: { easy: 25, medium: 35, hard: 20 },
        userProgress: {
          completed: Math.floor(Math.random() * 60) + 15,
          accuracy: Math.floor(Math.random() * 25) + 70,
          timeSpent: `${Math.floor(Math.random() * 6) + 2}h`
        }
      }
    };

    return areaDatabase[areaName] || null;
  }

  private generateAreaQuestions(): void {
    if (!this.areaData) return;

    const sampleQuestions: Partial<AreaQuestion>[] = this.getSampleQuestions(this.areaName);
    
    this.questions = sampleQuestions.map((q, index) => ({
      id: `${this.areaName}-${index + 1}`,
      question: q.question || `Questão ${index + 1} de ${this.areaData!.displayName}`,
      subject: q.subject || this.areaData!.subjects[index % this.areaData!.subjects.length],
      difficulty: q.difficulty || this.getRandomDifficulty(),
      options: q.options || ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
      correctAnswer: q.correctAnswer || Math.floor(Math.random() * 4),
      explanation: q.explanation || 'Explicação da questão.',
      tags: q.tags || [this.areaData!.displayName],
      estimatedTime: q.estimatedTime || `${Math.floor(Math.random() * 3) + 1}min`,
      popularity: Math.floor(Math.random() * 100) + 1,
      isFavorite: Math.random() > 0.8
    }));
  }

  private getSampleQuestions(areaName: string): Partial<AreaQuestion>[] {
    const questionDatabase: { [key: string]: Partial<AreaQuestion>[] } = {
      'desenvolvimento-web': [
        {
          question: 'Qual é a diferença entre let, const e var em JavaScript?',
          subject: 'JavaScript',
          difficulty: 'Médio',
          options: [
            'Todas funcionam da mesma forma',
            'let e const têm escopo de bloco, var tem escopo de função',
            'Apenas const é imutável',
            'var é mais moderno que let'
          ],
          correctAnswer: 1,
          explanation: 'let e const têm escopo de bloco e não podem ser redeclaradas no mesmo escopo.',
          tags: ['JavaScript', 'Variáveis', 'ES6'],
          estimatedTime: '2min'
        },
        {
          question: 'O que é o Virtual DOM no React?',
          subject: 'React',
          difficulty: 'Difícil',
          options: [
            'Uma cópia do DOM real em memória',
            'Um novo tipo de HTML',
            'Uma biblioteca CSS',
            'Um framework backend'
          ],
          correctAnswer: 0,
          explanation: 'O Virtual DOM é uma representação em memória do DOM real que permite otimizações de performance.',
          tags: ['React', 'Virtual DOM', 'Performance'],
          estimatedTime: '3min'
        }
      ],
      'portugues': [
        {
          question: 'Qual é a função da vírgula na língua portuguesa?',
          subject: 'Gramática',
          difficulty: 'Fácil',
          options: [
            'Apenas separar palavras',
            'Indicar pausas e separar elementos',
            'Finalizar frases',
            'Não tem função específica'
          ],
          correctAnswer: 1,
          explanation: 'A vírgula indica pausas curtas e separa elementos de uma oração.',
          tags: ['Pontuação', 'Gramática'],
          estimatedTime: '1min'
        }
      ],
      'matematica': [
        {
          question: 'Como calcular a derivada de x²?',
          subject: 'Cálculo',
          difficulty: 'Médio',
          options: ['x', '2x', 'x²', '2x²'],
          correctAnswer: 1,
          explanation: 'A derivada de x² é 2x, aplicando a regra da potência.',
          tags: ['Cálculo', 'Derivadas'],
          estimatedTime: '2min'
        }
      ],
      'informatica': [
        {
          question: 'O que é um algoritmo de ordenação bubble sort?',
          subject: 'Algoritmos',
          difficulty: 'Médio',
          options: [
            'Algoritmo de busca',
            'Algoritmo de ordenação por comparação',
            'Algoritmo de hash',
            'Algoritmo de compressão'
          ],
          correctAnswer: 1,
          explanation: 'Bubble sort é um algoritmo de ordenação que compara elementos adjacentes.',
          tags: ['Algoritmos', 'Ordenação'],
          estimatedTime: '2min'
        }
      ]
    };

    const baseQuestions = questionDatabase[areaName] || [];
    
    // Gerar mais questões para preencher a área
    const additionalQuestions: Partial<AreaQuestion>[] = [];
    for (let i = baseQuestions.length; i < 20; i++) {
      additionalQuestions.push({
        question: `Questão ${i + 1} sobre ${this.getAreaDisplayName(areaName)}`,
        subject: this.areaData?.subjects[i % this.areaData.subjects.length],
        difficulty: this.getRandomDifficulty(),
        estimatedTime: `${Math.floor(Math.random() * 3) + 1}min`
      });
    }

    return [...baseQuestions, ...additionalQuestions];
  }

  // ===============================================
  // 🔧 FILTROS E BUSCA
  // ===============================================
  
  get filteredQuestions(): AreaQuestion[] {
    let filtered = [...this.questions];

    // Filtrar por assunto
    if (this.selectedSubject !== 'all') {
      filtered = filtered.filter(q => q.subject === this.selectedSubject);
    }

    // Filtrar por dificuldade
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === this.selectedDifficulty);
    }

    // Filtrar por busca
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.subject.toLowerCase().includes(query) ||
        q.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Ordenar
    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'difficulty':
          const diffOrder = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'recent':
          return Math.random() - 0.5; // Simulado
        default:
          return 0;
      }
    });
  }

  get paginatedQuestions(): AreaQuestion[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredQuestions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredQuestions.length / this.itemsPerPage);
  }

  // ===============================================
  // 🎯 AÇÕES
  // ===============================================
  
  startAreaQuiz(): void {
    if (!this.areaData) return;

    this.showSuccessMessage(`Iniciando quiz de ${this.areaData.displayName}...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          area: this.areaName,
          mode: 'area',
          count: 10
        }
      });
    }, 500);
  }

  startCustomQuiz(): void {
    const filtered = this.filteredQuestions;
    
    if (filtered.length === 0) {
      this.showErrorMessage('Nenhuma questão encontrada com os filtros aplicados!');
      return;
    }

    this.showSuccessMessage(`Iniciando quiz personalizado com ${Math.min(filtered.length, 10)} questões...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          area: this.areaName,
          mode: 'custom',
          subject: this.selectedSubject,
          difficulty: this.selectedDifficulty,
          count: Math.min(filtered.length, 10)
        }
      });
    }, 500);
  }

  toggleFavorite(questionId: string): void {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return;

    question.isFavorite = !question.isFavorite;
    
    // Salvar no localStorage
    const favorites = JSON.parse(localStorage.getItem('favoriteQuestions') || '[]');
    if (question.isFavorite) {
      favorites.push(questionId);
      this.showSuccessMessage('Questão adicionada aos favoritos!');
    } else {
      const index = favorites.indexOf(questionId);
      if (index > -1) favorites.splice(index, 1);
      this.showSuccessMessage('Questão removida dos favoritos!');
    }
    
    localStorage.setItem('favoriteQuestions', JSON.stringify(favorites));
  }

  viewQuestion(question: AreaQuestion): void {
    this.showSuccessMessage('Abrindo questão...');
    console.log('Visualizando questão:', question);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  clearFilters(): void {
    this.selectedSubject = 'all';
    this.selectedDifficulty = 'all';
    this.searchQuery = '';
    this.currentPage = 1;
    this.showSuccessMessage('Filtros limpos!');
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToFavorites(): void {
    this.router.navigate(['/favorites']);
  }

  reloadData(): void {
    console.log('🔄 Recarregando área...');
    this.showSuccessMessage('Recarregando dados...');
    this.loadAreaData();
  }

  // ===============================================
  // 🔧 FUNÇÕES AUXILIARES
  // ===============================================
  
  private getRandomDifficulty(): 'Fácil' | 'Médio' | 'Difícil' {
    const difficulties: ('Fácil' | 'Médio' | 'Difícil')[] = ['Fácil', 'Médio', 'Difícil'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  private getAreaDisplayName(areaName: string): string {
    const names: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'portugues': 'Português',
      'matematica': 'Matemática',
      'informatica': 'Informática'
    };
    return names[areaName] || areaName;
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

  trackQuestion(index: number, question: AreaQuestion): string {
    return question.id;
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
  // 📈 PROGRESSO E PAGINAÇÃO
  // ===============================================
  
  getProgressPercentage(): number {
    if (!this.areaData) return 0;
    return Math.round((this.areaData.userProgress.completed / this.areaData.totalQuestions) * 100);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  startSingleQuestionQuiz(question: AreaQuestion): void {
    this.showSuccessMessage('Iniciando questão...');
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'single',
          questionId: question.id,
          area: this.areaName
        }
      });
    }, 500);
  }
}
