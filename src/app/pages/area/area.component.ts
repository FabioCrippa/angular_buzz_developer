import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from '../../core/services/progress.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PremiumService } from '../../core/services/premium.service';
import { AuthService } from '../../core/services/auth.service';
import { QuizHistoryService } from '../../core/services/quiz-history.service';

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
  
  // ===============================================
  // 📊 PROPRIEDADES PRINCIPAIS
  // ===============================================
  
  areaName: string = '';
  areaId: string = '';

  // ── Simulados ──────────────────────────────────
  simuladosList: { id: string; displayName: string; subtitle: string; icon: string; color: string; questionCount: number; duration: number; year: number; tags?: string; group: string }[] = [
    {
      id: 'prova-paulista-9ano-2024',
      displayName: 'Prova Paulista',
      subtitle: '9º Ano — Ensino Fundamental',
      icon: '🏫',
      color: 'linear-gradient(135deg, #e67e22, #f39c12)',
      questionCount: 0,
      duration: 90,
      year: 2024,
      group: 'Exames Oficiais'
    },
    {
      id: 'enem-2024',
      displayName: 'ENEM 2024',
      subtitle: 'Ensino Médio',
      icon: '📋',
      color: 'linear-gradient(135deg, #2980b9, #3498db)',
      questionCount: 0,
      duration: 90,
      year: 2024,
      group: 'Exames Oficiais'
    },
    {
      id: 'lp-caderno-9ano-1bimestre',
      displayName: 'Língua Portuguesa',
      subtitle: '9º Ano — Volume 1',
      icon: '📖',
      color: 'linear-gradient(135deg, #27ae60, #2ecc71)',
      questionCount: 0,
      duration: 90,
      year: 2025,
      tags: 'Aulas 1–3, 6–11, 13–19, 21–22, 24, 26, 28',
      group: 'Língua Portuguesa'
    },
    {
      id: 'mat-caderno-9ano-1bimestre',
      displayName: 'Matemática',
      subtitle: '9º Ano — Volume 1',
      icon: '📐',
      color: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
      questionCount: 0,
      duration: 90,
      year: 2025,
      tags: 'Aulas 1 a 8',
      group: 'Matemática'
    },
    {
      id: 'mat-caderno-9ano-vol1-p2',
      displayName: 'Matemática',
      subtitle: '9º Ano — Vol. 1 · Parte 2',
      icon: '📐',
      color: 'linear-gradient(135deg, #6c3483, #8e44ad)',
      questionCount: 0,
      duration: 90,
      year: 2025,
      tags: 'Aulas 11 a 18',
      group: 'Matemática'
    },
    {
      id: 'mat-caderno-9ano-vol1-p3',
      displayName: 'Matemática',
      subtitle: '9º Ano — Vol. 1 · Parte 3',
      icon: '📐',
      color: 'linear-gradient(135deg, #1a5276, #2980b9)',
      questionCount: 0,
      duration: 90,
      year: 2025,
      tags: 'Aulas 21 a 28',
      group: 'Matemática'
    },
    {
      id: 'lp-caderno-9ano-vol1-p2',
      displayName: 'Língua Portuguesa',
      subtitle: '9º Ano — Vol. 1 · Parte 2',
      icon: '📖',
      color: 'linear-gradient(135deg, #1a5276, #2980b9)',
      questionCount: 0,
      duration: 90,
      year: 2025,
      tags: 'Aulas 1–3, 5–9, 11–28',
      group: 'Língua Portuguesa'
    }
  ];

  // Propriedade estável — calculada uma vez em loadSimuladosData() para evitar
  // que o *ngFor destrua/recrie os DOM nodes a cada change detection (hover loop)
  simuladosGroups: { label: string; icon: string; items: { id: string; displayName: string; subtitle: string; icon: string; color: string; questionCount: number; duration: number; year: number; tags?: string; group: string }[] }[] = [];

  // Cache de histórico calculado uma vez no init (evita recalcular a cada change detection)
  simuladosHistoryCache: { [id: string]: { attempts: number; bestScore: number } } = {};
  simuladosReviewAvailable: { [id: string]: boolean } = {};

  private async loadSimuladosData(): Promise<void> {
    // 1. Carregar questionCount real de cada arquivo JSON
    const filePaths: { [id: string]: string } = {
      'prova-paulista-9ano-2024': 'assets/data/areas/simulados/prova-paulista/prova-paulista-9ano-2024.json',
      'enem-2024': 'assets/data/areas/simulados/enem/enem-2024.json',
      'lp-caderno-9ano-1bimestre': 'assets/data/areas/simulados/lingua-portuguesa/lp-caderno-9ano-1bimestre.json',
      'mat-caderno-9ano-1bimestre': 'assets/data/areas/simulados/matematica/mat-caderno-9ano-1bimestre.json',
      'mat-caderno-9ano-vol1-p2': 'assets/data/areas/simulados/matematica/mat-caderno-9ano-vol1-p2.json',
      'mat-caderno-9ano-vol1-p3': 'assets/data/areas/simulados/matematica/mat-caderno-9ano-vol1-p3.json',
      'lp-caderno-9ano-vol1-p2': 'assets/data/areas/simulados/lingua-portuguesa/lp-caderno-9ano-vol1-p2.json'
    };

    for (const sim of this.simuladosList) {
      try {
        const res = await fetch(filePaths[sim.id]);
        if (res.ok) {
          const data = await res.json();
          sim.questionCount = data.questions?.length ?? sim.questionCount;
          if (data.metadata?.duracao) sim.duration = data.metadata.duracao;
          if (data.metadata?.ano) sim.year = data.metadata.ano;
        }
      } catch { /* mantém valor padrão */ }
    }

    // 2. Pré-calcular histórico do usuário (filtrado por area='simulados')
    const allHistory = this.progressService.getHistory().filter(h => h.area === 'simulados');

    for (const sim of this.simuladosList) {
      const simHistory = allHistory.filter(h => h.subarea === sim.id);
      if (simHistory.length === 0) {
        this.simuladosHistoryCache[sim.id] = { attempts: 0, bestScore: 0 };
        continue;
      }
      const byDate = simHistory.reduce((acc: { [d: string]: typeof simHistory }, h) => {
        const d = new Date(h.date).toDateString();
        if (!acc[d]) acc[d] = [];
        acc[d].push(h);
        return acc;
      }, {});
      const attempts = Object.keys(byDate).length;
      const bestScore = Math.max(...Object.values(byDate).map(group => {
        const correct = group.filter(h => h.correct).length;
        return group.length > 0 ? Math.round((correct / group.length) * 100) : 0;
      }));
      this.simuladosHistoryCache[sim.id] = { attempts, bestScore };
    }

    // 3. Verificar se há revisão salva para cada simulado
    for (const sim of this.simuladosList) {
      this.simuladosReviewAvailable[sim.id] = this.progressService.hasSimuladoReview(sim.id);
    }

    // 4. Calcular grupos uma única vez (referência estável para o *ngFor)
    const order = ['Exames Oficiais', 'Língua Portuguesa', 'Matemática'];
    const icons: Record<string, string> = {
      'Exames Oficiais': '🏆',
      'Língua Portuguesa': '📖',
      'Matemática': '📐'
    };
    const map = new Map<string, typeof this.simuladosList>();
    for (const sim of this.simuladosList) {
      if (!map.has(sim.group)) map.set(sim.group, []);
      map.get(sim.group)!.push(sim);
    }
    this.simuladosGroups = order.filter(g => map.has(g)).map(g => ({ label: g, icon: icons[g] || '📄', items: map.get(g)! }));
  }

  getSimuladoHistory(simuladoId: string): { attempts: number; bestScore: number } {
    return this.simuladosHistoryCache[simuladoId] ?? { attempts: 0, bestScore: 0 };
  }

  viewSimuladoReview(simuladoId: string): void {
    this.router.navigate(['/quiz'], {
      queryParams: {
        area: 'simulados',
        mode: 'simulado-review',
        subject: simuladoId,
        premium: 'true'
      }
    });
  }

  navigateToSimulado(simuladoId: string, displayName?: string): void {
    this.router.navigate(['/quiz'], {
      queryParams: {
        area: 'simulados',
        mode: 'simulado',
        subject: simuladoId,
        simuladoDisplayName: displayName || simuladoId,
        count: 'unlimited',
        premium: 'true'
      }
    });
  }
  
  // States
  isLoading = true;
  hasError = false;
  errorMessage = '';
  
  // Area Data
  areaData: AreaData | null = null;
  questions: AreaQuestion[] = [];
  
  // Premium Logic
  isPremium = false;
  remainingQuizzes = 5;
  canTakeQuiz = true;
  
  // Filter States
  searchQuery = '';
  selectedSubject = 'all';
  selectedDifficulty = 'all';
  sortBy: 'popularity' | 'difficulty' | 'subject' | 'recent' = 'popularity';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  // ✅ Estatísticas Detalhadas
  showDetailedStats = false;
  detailedStats: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private progressService: ProgressService,
    private http: HttpClient,
    public premiumService: PremiumService,
    private authService: AuthService,
    private quizHistoryService: QuizHistoryService
  ) {}

  // ===============================================
  // 🚀 INICIALIZAÇÃO
  // ===============================================
  
  ngOnInit(): void {
  console.log('🚀 INICIANDO AREA COMPONENT');
  
  // ✅ Agora vai funcionar perfeitamente
  this.areaId = this.route.snapshot.paramMap.get('id') || '';
  this.areaName = this.areaId;
  
  console.log('📍 URL areaId:', this.areaId);
  
  if (!this.areaId) {
    this.hasError = true;
    this.errorMessage = 'ID da área não encontrado na URL';
    this.isLoading = false;
    return;
  }

  this.loadAreaData();
  this.loadUserPremiumStatus();
  this.loadUserQuizLimits();
  if (this.areaName === 'simulados') {
    this.loadSimuladosData();
  }

  // Monitorar status premium (se o service existir)
  if (this.premiumService && this.premiumService.premiumStatus$) {
    this.premiumService.premiumStatus$.subscribe(status => {
      // Teacher token sempre garante premium, ignorar override do service
      const isTeacher = !!localStorage.getItem('teacher_token');
      this.isPremium = isTeacher ? true : status.isPremium;
      this.canTakeQuiz = this.premiumService.canTakeQuiz;
      this.remainingQuizzes = this.premiumService.remainingQuizzes;
    });
  }
}

  // ===============================================
  // 📊 GETTERS COMPUTADOS
  // ===============================================
  
  get filteredQuestions(): AreaQuestion[] {
    const wrongQuestions = this.getWrongQuestions();
    
    if (wrongQuestions.length === 0) {
      return [];
    }
    
    let filtered = [...wrongQuestions];

    // Filtro por busca
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.subject.toLowerCase().includes(query) ||
        q.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filtro por assunto
    if (this.selectedSubject && this.selectedSubject !== 'all') {
      filtered = filtered.filter(q => q.subject === this.selectedSubject);
    }

    // Filtro por dificuldade
    if (this.selectedDifficulty && this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === this.selectedDifficulty);
    }

    return this.sortQuestions(filtered);
  }

  get paginatedQuestions(): AreaQuestion[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredQuestions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredQuestions.length / this.itemsPerPage);
  }

  get hasWrongQuestions(): boolean {
    return this.getWrongQuestions().length > 0;
  }

  get wrongQuestionsCount(): number {
    return this.getWrongQuestions().length;
  }

  // ===============================================
  // 🔧 CARREGAMENTO DE DADOS REAIS
  // ===============================================
  
  private loadAreaData(): void {
    this.isLoading = true;
    this.hasError = false;

    console.log('🔄 Carregando dados da área:', this.areaId);

    try {
      // ✅ 1. Carregar configuração da área
      this.areaData = this.getAreaConfiguration(this.areaId);
      
      if (!this.areaData) {
        this.hasError = true;
        this.errorMessage = `Área "${this.areaId}" não encontrada. Áreas disponíveis: analise-desenvolvimento-sistemas, informatica-geral, matematica, portugues, simulados`;
        this.isLoading = false;
        return;
      }

      // ✅ 2. Definir título da página
      this.titleService.setTitle(`${this.areaData.displayName} - Quizzfy`);

      // ✅ 2b. Atualizar totalQuestions com valor real do index.json
      this.http.get<any>('assets/data/index.json').subscribe({
        next: (indexData) => {
          if (!this.areaData) return;
          const byArea = indexData?.stats?.byArea;
          if (byArea) {
            // Soma possíveis aliases (ex: ADS engloba múltiplas chaves)
            const areaKeys: { [key: string]: string[] } = {
              'analise-desenvolvimento-sistemas': ['analise-desenvolvimento-sistemas', 'desenvolvimento-web', 'metodologias', 'design', 'seguranca', 'entrevista'],
              'informatica-geral': ['informatica-geral', 'informatica'],
              'matematica': ['matematica'],
              'portugues': ['portugues'],
              'simulados': ['simulados']
            };
            const keys = areaKeys[this.areaId] || [this.areaId];
            const total = keys.reduce((sum, k) => sum + (byArea[k] || 0), 0);
            if (total > 0) this.areaData.totalQuestions = total;
          }
        }
      });

      // ✅ 3. Carregar questões reais da área
      this.loadRealAreaQuestions().subscribe({
        next: (questions) => {
          this.questions = questions;
          console.log(`✅ ${questions.length} questões carregadas para ${this.areaData!.displayName}`);
          
          // ✅ 4. Calcular progresso real do usuário
          this.updateUserProgress();
          this.loadFirestoreProgress();
          
          this.isLoading = false;
          
          // ✅ 5. Mostrar status das questões erradas
          const wrongCount = this.getWrongQuestions().length;
          if (wrongCount > 0) {
            this.showSuccessMessage(`📚 ${this.areaData!.displayName} carregada! ${wrongCount} questões para revisar.`);
          } else {
            this.showSuccessMessage(`🎉 ${this.areaData!.displayName} carregada! Nenhuma questão para revisar.`);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao carregar questões:', error);
          this.hasError = true;
          this.errorMessage = `Erro ao carregar questões de ${this.areaData!.displayName}`;
          this.isLoading = false;
          this.showErrorMessage('Erro ao carregar questões da área');
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar área:', error);
      this.hasError = true;
      this.errorMessage = 'Erro ao carregar dados da área';
      this.isLoading = false;
      this.showErrorMessage('Erro ao carregar área');
    }
  }

  private loadRealAreaQuestions(): Observable<AreaQuestion[]> {
    console.log('🔍 Carregando questões REAIS para:', this.areaName);
    
    // ✅ Carregar index.json e depois todas as questões da área (IGUAL AO QUIZ)
    return this.http.get<any>('assets/data/index.json').pipe(
      catchError(error => {
        console.error('❌ Falha ao carregar index.json:', error);
        throw error;
      }),
      switchMap(indexData => {
        console.log('📦 Index carregado, buscando estrutura para:', this.areaName);
        
        if (!indexData?.structure?.[this.areaName]) {
          // Tentar novo formato com mapeamento de legado
          const legacyMap: { [key: string]: string[] } = {
            'desenvolvimento-web': ['analise-desenvolvimento-sistemas'],
            'informatica': ['informatica-geral'],
            'analise-desenvolvimento-sistemas': ['analise-desenvolvimento-sistemas'],
            'informatica-geral': ['informatica-geral'],
            'matematica': ['matematica'],
            'portugues': ['portugues'],
          };
          const targetIds = legacyMap[this.areaName] || [this.areaName];
          // Coletar todos os caminhos de arquivo do novo formato
          const filePaths: Array<{ subject: string; path: string }> = [];
          if (indexData?.cursos && Array.isArray(indexData.cursos)) {
            for (const curso of indexData.cursos) {
              if (targetIds.includes(curso.id)) {
                for (const disc of (curso.disciplinas || [])) {
                  for (const topico of (disc.topicos || [])) {
                    const arquivo = topico.arquivo || `${topico.id}.json`;
                    filePaths.push({
                      subject: topico.id,
                      path: `assets/data/areas/${curso.id}/${disc.id}/${arquivo}`
                    });
                  }
                }
              }
            }
          }
          if (filePaths.length === 0) {
            console.error('❌ Área não encontrada no index:', this.areaName);
            throw new Error(`Área ${this.areaName} não encontrada`);
          }
          const requests2 = filePaths.map(fp =>
            this.http.get<any>(fp.path).pipe(
              catchError(() => of(null)),
              map(data => ({ subject: fp.subject, questions: data?.questions || [] }))
            )
          );
          return forkJoin(requests2) as Observable<any[]>;
        }
        
        const subjects = indexData.structure[this.areaName];
        console.log('✅ Assuntos encontrados:', subjects);
        
        // ✅ Criar array de requisições para TODOS os assuntos (IGUAL AO QUIZ)
        const requests = subjects.map((subject: string) => {
          const path = `assets/data/areas/${this.areaName}/${subject}.json`;
          console.log('📥 Carregando:', path);
          
          return this.http.get<any>(path).pipe(
            catchError(error => {
              console.warn(`⚠️ Erro ao carregar ${subject}:`, error);
              return of(null);
            }),
            map(data => ({
              subject,
              questions: data?.questions || []
            }))
          );
        });
        
        // ✅ Retornar forkJoin tipado corretamente
        return forkJoin(requests) as Observable<any[]>;
      }),
      map((results: any[]) => {
        console.log('📊 Processando', results.length, 'arquivos carregados');
        
        let allQuestions: AreaQuestion[] = [];
        
        results.forEach((result: any) => {
          if (result && result.questions && result.questions.length > 0) {
            console.log(`✅ ${result.subject}: ${result.questions.length} questões`);
            
            const processedQuestions = result.questions.map((q: any) => ({
              id: String(q.id),
              question: q.question || q.pergunta || 'Sem texto',
              subject: this.formatSubjectName(result.subject),
              difficulty: this.normalizeDifficulty(q.difficulty || q.dificuldade || 'Médio'),
              options: q.options || q.alternativas || [],
              correctAnswer: q.correctAnswer || q.correct || 0,
              explanation: q.explanation || q.explicacao || 'Sem explicação',
              tags: q.tags || [result.subject],
              estimatedTime: q.estimatedTime || '2min',
              popularity: q.popularity || 50,
              isFavorite: this.isQuestionFavorite(String(q.id))
            } as AreaQuestion));
            
            allQuestions = [...allQuestions, ...processedQuestions];
          }
        });
        
        console.log('📊 TOTAL questões carregadas:', allQuestions.length);
        
        if (allQuestions.length === 0) {
          throw new Error('Nenhuma questão válida');
        }
        
        return allQuestions;
      }),
      catchError(error => {
        console.error('❌ Erro ao carregar questões da área:', error);
        throw error;
      }),
      map(questions => {
        // ✅ GARANTIR que totalQuestions seja sempre atualizado
        if (this.areaData && questions.length > 0) {
          this.areaData.totalQuestions = questions.length;
          console.log(`📊 Total de questões definido: ${questions.length}`);
        }
        return questions;
      })
    );
  }

  private generateQuestionsForArea(): AreaQuestion[] {
    if (!this.areaData) return [];

    console.log('🔧 Gerando questões simuladas para:', this.areaData.displayName);

    const questions: AreaQuestion[] = [];
    const subjects = this.areaData.subjects;
    let questionCounter = 1;

    // ✅ Gerar questões baseadas na dificuldade configurada
    const difficulties: ('Fácil' | 'Médio' | 'Difícil')[] = ['Fácil', 'Médio', 'Difícil'];
    const difficultyCount = [
      this.areaData.difficulty.easy,
      this.areaData.difficulty.medium, 
      this.areaData.difficulty.hard
    ];

    difficulties.forEach((difficulty, diffIndex) => {
      const count = difficultyCount[diffIndex];
      
      for (let i = 0; i < count; i++) {
        const subject = subjects[i % subjects.length];
        
        questions.push({
          id: `${this.areaName}-generated-${questionCounter}`,
          question: this.generateQuestionText(subject, difficulty, questionCounter),
          subject: subject,
          difficulty: difficulty,
          options: this.generateOptions(subject, difficulty),
          correctAnswer: Math.floor(Math.random() * 4),
          explanation: `Explicação da questão ${questionCounter} sobre ${subject}.`,
          tags: [subject, difficulty, this.areaData!.displayName],
          estimatedTime: this.getEstimatedTime(difficulty),
          popularity: Math.floor(Math.random() * 100) + 1,
          isFavorite: false
        });
        
        questionCounter++;
      }
    });

    // ✅ IMPORTANTE: Atualizar totalQuestions imediatamente
    this.areaData.totalQuestions = questions.length;
    
    console.log(`✅ ${questions.length} questões geradas para ${this.areaData.displayName}`);

    return questions;
  }

  private async loadFirestoreProgress(): Promise<void> {
    if (!this.areaData) return;
    const userId = this.getCurrentUserId();
    if (!userId) return;
    try {
      const stats = await this.quizHistoryService.calculateStats(userId);
      const fsArea = stats?.byArea?.[this.areaName];
      if (!fsArea || fsArea.quizzesTaken === 0) return;
      const areaMinutes = stats.totalQuizzes > 0
        ? Math.round(stats.totalTimeSpent * (fsArea.quizzesTaken / stats.totalQuizzes))
        : 0;
      this.areaData.userProgress = {
        completed: fsArea.totalQuestions,
        accuracy: Math.round(fsArea.averageScore),
        timeSpent: this.formatTotalTime(areaMinutes)
      };
    } catch {}
  }

  private formatTotalTime(minutes: number): string {
    if (!minutes || minutes <= 0) return '0min';
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  private updateUserProgress(): void {
    if (!this.areaData) return;

    // ✅ Limpar cache quando o progresso muda
    this.wrongQuestionsCache = null;

    // ✅ 1. Atualizar totalQuestions com o número real de questões carregadas
    this.areaData.totalQuestions = this.questions.length;

    // ✅ 2. Calcular progresso real baseado no histórico
    const history = this.progressService.getHistory().filter(h => h.area === this.areaName);
    const totalCompleted = history.length;
    const totalCorrect = history.filter(h => h.correct).length;
    const totalTimeSeconds = history.reduce((sum, h) => sum + (Number(h.timeSpent) || 0), 0);
    
    const accuracy = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;
    const timeSpent = this.formatTimeFromSeconds(totalTimeSeconds);
    
    // ✅ 3. Atualizar dados da área com progresso real
    this.areaData.userProgress = {
      completed: totalCompleted,
      accuracy: accuracy,
      timeSpent: timeSpent
    };

    // ✅ 4. Derivar lista de assuntos reais das questões carregadas
    const uniqueSubjects = [...new Set(this.questions.map(q => q.subject))].sort();
    if (uniqueSubjects.length > 0) {
      this.areaData.subjects = uniqueSubjects;
    }
  }

  private loadUserPremiumStatus(): void {
    // Admin sempre tem acesso premium
    if (localStorage.getItem('sowlfy_admin_token')) {
      this.isPremium = true;
      return;
    }
    // Estudante de escola ativa tem acesso premium
    if (localStorage.getItem('student_token')) {
      this.isPremium = true;
      return;
    }
    // Professor/coordenador tem acesso premium
    if (localStorage.getItem('teacher_token')) {
      this.isPremium = true;
      return;
    }
    // Usuário individual: verificar status premium salvo
    const savedStatus = localStorage.getItem('testPremiumStatus');
    this.isPremium = savedStatus === 'true';
  }

  private getCurrentUserId(): string | null {
    // 1. Firebase Auth user (currentUserSubject populado)
    const fbUser = this.authService.currentUserValue;
    if (fbUser?.id) return fbUser.id;

    // 2. Usuário regular salvo no localStorage
    try {
      const stored = localStorage.getItem('sowlfy_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id) return u.id;
      }
    } catch {}

    // 3. Admin
    try {
      const adminData = localStorage.getItem('sowlfy_admin_data');
      if (adminData) {
        const a = JSON.parse(adminData);
        if (a?.id) return a.id;
        if (a?.uid) return a.uid;
      }
    } catch {}

    // 4. Estudante
    try {
      const studentData = localStorage.getItem('student_data');
      if (studentData) {
        const s = JSON.parse(studentData);
        if (s?.id) return s.id;
        if (s?.uid) return s.uid;
      }
    } catch {}

    return null;
  }

  private async loadUserQuizLimits(): Promise<void> {
    try {
      if (this.isPremium) {
        this.remainingQuizzes = -1; // ✅ -1 = Ilimitado
        this.canTakeQuiz = true;
        console.log('👑 Usuário Premium: Quizzes ilimitados ativados');
        return;
      }

      // ✅ Usuário gratuito: gerenciar limite diário
      const today = new Date().toDateString();
      const savedData = localStorage.getItem('dailyQuizLimits');
      
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.date === today) {
          this.remainingQuizzes = Math.max(0, 5 - data.used);
        } else {
          // Novo dia, resetar limite
          this.remainingQuizzes = 5;
          localStorage.setItem('dailyQuizLimits', JSON.stringify({
            date: today,
            used: 0
          }));
        }
      } else {
        // Primeira vez, criar limite
        this.remainingQuizzes = 5;
        localStorage.setItem('dailyQuizLimits', JSON.stringify({
          date: today,
          used: 0
        }));
      }
      
      this.canTakeQuiz = this.remainingQuizzes > 0;
      console.log('🆓 Usuário gratuito:', this.remainingQuizzes, 'quizzes restantes hoje');
      
    } catch (error) {
      console.error('❌ Erro ao carregar limites de quiz:', error);
      // Fallback seguro
      this.remainingQuizzes = this.isPremium ? -1 : 5;
      this.canTakeQuiz = true;
    }
  }

  // ===============================================
  // 🎯 SISTEMA INTELIGENTE REAL
  // ===============================================
  
  // ✅ Cache para evitar recalcular a cada change detection
  private wrongQuestionsCache: AreaQuestion[] | null = null;
  private lastHistoryLength: number = 0;
  
  getWrongQuestions(): AreaQuestion[] {
    // ✅ Usar cache se o histórico não mudou
    const history = this.progressService.getHistory();
    if (this.wrongQuestionsCache && history.length === this.lastHistoryLength) {
      return this.wrongQuestionsCache;
    }
    
    const wrongAnswers = history
      .filter(h => h.area === this.areaName && !h.correct)
      .map(h => String(h.questionId));
    
    const wrongQuestions = this.questions.filter(q => {
      const questionId = String(q.id);
      
      // Match direto
      if (wrongAnswers.includes(questionId)) {
        return true;
      }
      
      // Extrair número do ID (ex: 'desenvolvimento-web-generated-319' → '319')
      const match = questionId.match(/-(\d+)$/);
      const numericId = match ? match[1] : null;
      
      if (numericId && wrongAnswers.includes(numericId)) {
        return true;
      }
      
      return false;
    });
    
    // ✅ Atualizar cache
    this.wrongQuestionsCache = wrongQuestions;
    this.lastHistoryLength = history.length;
    
    return wrongQuestions;
  }

  getUnansweredQuestions(): AreaQuestion[] {
    // ✅ Buscar questões que o usuário ainda não respondeu
    const answeredIds = this.progressService.getHistory()
      .filter(h => h.area === this.areaName)
      .map(h => String(h.questionId)); // ✅ Garante que seja string
          
    return this.questions.filter(q => !answeredIds.includes(String(q.id))); // ✅ Garante comparação string vs string
  }

  getUserMode(): string {
    const progress = this.getProgressPercentage();
    const wrongCount = this.getWrongQuestions().length;
    const totalAnswered = this.areaData?.userProgress.completed || 0;
    
    if (totalAnswered === 0) {
      return 'DISCOVERY';
    } else if (progress < 30 || wrongCount > 10) {
      return 'DISCOVERY';
    } else if (progress < 70 || wrongCount > 5) {
      return 'PRACTICE';
    } else {
      return 'MASTERY';
    }
  }

  getModeIcon(): string {
    const mode = this.getUserMode();
    switch (mode) {
      case 'DISCOVERY': return '🌱';
      case 'PRACTICE': return '💪';
      case 'MASTERY': return '🏆';
      default: return '📚';
    }
  }

  getModeText(): string {
    const mode = this.getUserMode();
    switch (mode) {
      case 'DISCOVERY': return 'Descoberta';
      case 'PRACTICE': return 'Prática';
      case 'MASTERY': return 'Domínio';
      default: return 'Estudo';
    }
  }

  getModeDescription(): string {
    const mode = this.getUserMode();
    const wrongCount = this.getWrongQuestions().length;
    const totalAnswered = this.areaData?.userProgress.completed || 0;
    
    switch(mode) {
      case 'DISCOVERY':
        if (totalAnswered === 0) {
          return 'Comece sua jornada! Faça seu primeiro quiz para descobrir esta área de conhecimento.';
        }
        return `Continue explorando! Você tem ${wrongCount} questões para revisar e melhorar.`;
      case 'PRACTICE':
        return `Foco na prática! Você já respondeu ${totalAnswered} questões. Revise as ${wrongCount} questões erradas para evoluir.`;
      case 'MASTERY':
        return `Parabéns! Você domina esta área com ${this.areaData?.userProgress.accuracy}% de acertos. Continue praticando para manter o nível.`;
      default:
        return 'Continue estudando para melhorar seu desempenho!';
    }
  }

  getSmartQuizSubtitle(): string {
    const wrongQuestions = this.getWrongQuestions();
    if (wrongQuestions.length === 0) {
      return 'Nenhuma questão para revisar';
    }
    return `${wrongQuestions.length} questão${wrongQuestions.length > 1 ? 'ões' : ''} para revisar`;
  }

  getSmartQuizDescription(): string {
    const wrongQuestions = this.getWrongQuestions();
    const totalAnswered = this.areaData?.userProgress.completed || 0;
    
    if (wrongQuestions.length === 0) {
      if (totalAnswered === 0) {
        return 'Faça alguns quizzes primeiro para gerar sua lista de revisão personalizada!';
      }
      return 'Parabéns! Você não tem questões erradas para revisar nesta área.';
    }
    return `Revise as ${wrongQuestions.length} questões que você errou e melhore sua taxa de acertos de ${this.areaData?.userProgress.accuracy}%.`;
  }

  // ===============================================
  // 🎮 AÇÕES DE QUIZ REAIS
  // ===============================================
  
  startAreaQuiz(): void {
    // ✅ Verificar Premium usando variável local primeiro
    if (!this.isPremium && !this.canTakeQuiz) {
      this.showPremiumLimitMessage();
      return;
    }

    if (!this.areaData) {
      this.showErrorMessage('Dados da área não disponíveis');
      return;
    }

    // Simulados: redirecionar para o primeiro subject disponível com mode=simulado
    if (this.areaName === 'simulados') {
      const firstSubject = this.areaData.subjects?.[0];
      if (firstSubject) {
        this.router.navigate(['/quiz'], {
          queryParams: {
            area: this.areaName,
            mode: 'simulado',
            subject: firstSubject,
            count: 'unlimited',
            premium: 'true'
          }
        });
      }
      return;
    }

    // ✅ Decrementar contador apenas se NÃO for premium
    if (!this.isPremium) {
      this.decrementQuizCount();
    }

    const quizCount = this.isPremium ? 'ilimitadas' : '10';
    this.showSuccessMessage(`🚀 Iniciando quiz ${this.isPremium ? 'Premium' : ''} de ${this.areaData.displayName} com ${quizCount} questões...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          area: this.areaName,
          mode: 'area',
          count: this.isPremium ? 'unlimited' : 10, // ✅ Premium = ilimitado
          premium: this.isPremium ? 'true' : 'false' // ✅ Passar status Premium
        }
      });
    }, 500);
  }

  startSubjectQuiz(subject: string): void {
    if (!this.isPremium) {
      this.navigateToUpgrade();
      return;
    }
    this.router.navigate(['/quiz'], {
      queryParams: {
        area: this.areaName,
        mode: 'subject',
        subject: subject,
        count: 'unlimited',
        premium: 'true'
      }
    });
  }

  startWrongQuestionsQuiz(): void {
    if (!this.isPremium) {
      this.showPremiumFeatureMessage('Quiz Inteligente');
      return;
    }

    // ✅ Premium não precisa verificar limite de quiz
    const wrongQuestions = this.getWrongQuestions();
    if (wrongQuestions.length === 0) {
      this.showErrorMessage('Nenhuma questão errada encontrada. Faça alguns quizzes primeiro!');
      return;
    }

    this.showSuccessMessage(`🧠 Iniciando Quiz Inteligente Premium com ${wrongQuestions.length} questões para revisar...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: { 
          area: this.areaName,
          mode: 'smart',
          questionIds: wrongQuestions.map(q => q.id).join(','),
          limit: wrongQuestions.length, // ✅ Todas as questões erradas
          premium: 'true' // ✅ Sempre Premium
        }
      });
    }, 500);
  }

  startCustomQuiz(): void {
    if (!this.isPremium) {
      this.showPremiumFeatureMessage('Filtros Avançados');
      return;
    }

    // ✅ Premium não precisa verificar limite de quiz
    const filtered = this.filteredQuestions;
    
    if (filtered.length === 0) {
      this.showErrorMessage('Nenhuma questão encontrada com os filtros aplicados!');
      return;
    }

    const quizSize = Math.min(filtered.length, 20); // ✅ Premium pode ter mais questões
    this.showSuccessMessage(`🎯 Iniciando quiz Premium personalizado com ${quizSize} questões filtradas...`);
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          area: this.areaName,
          mode: 'custom',
          subject: this.selectedSubject,
          difficulty: this.selectedDifficulty,
          questionIds: filtered.slice(0, quizSize).map(q => q.id).join(','),
          count: quizSize,
          premium: 'true' // ✅ Sempre Premium
        }
      });
    }, 500);
  }

  private decrementQuizCount(): void {
    if (this.isPremium) return;

    const today = new Date().toDateString();
    const savedData = localStorage.getItem('dailyQuizLimits');
    
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.date === today) {
        data.used += 1;
        localStorage.setItem('dailyQuizLimits', JSON.stringify(data));
        this.remainingQuizzes = Math.max(0, 5 - data.used);
      }
    }
    
    this.canTakeQuiz = this.remainingQuizzes > 0;
  }

  // ===============================================
  // 🏆 PREMIUM UPGRADE (MANTIDO IGUAL)
  // ===============================================
  
  togglePremiumForTesting(): void {
    this.isPremium = !this.isPremium;
    
    // ✅ Salvar no localStorage para persistir
    localStorage.setItem('testPremiumStatus', this.isPremium.toString());
    
    // ✅ Atualizar limites e capacidades
    this.loadUserQuizLimits();
    
    // ✅ Se tiver premiumService, sincronizar também
    if (this.premiumService) {
      // Simular mudança no service também
      try {
        // Tentar atualizar o service se tiver métodos públicos
        console.log('🔄 Sincronizando com PremiumService...');
      } catch (error) {
        console.warn('⚠️ Não foi possível sincronizar com PremiumService:', error);
      }
    }
    
    console.log('👑 Status Premium alterado para:', this.isPremium);
    
    // ✅ Mensagem mais detalhada
    const features = this.isPremium ? 
      'Quizzes ilimitados, Quiz Inteligente e Filtros Avançados desbloqueados!' : 
      'Voltou ao modo gratuito: 5 quizzes por dia.';
      
    this.showSuccessMessage(`${this.isPremium ? '👑' : '🆓'} ${features}`);
    
    // ✅ Log das capacidades atuais
    console.log('📊 Capacidades atuais:', {
      isPremium: this.isPremium,
      canTakeQuiz: this.canTakeQuiz,
      remainingQuizzes: this.remainingQuizzes,
      unlimitedQuizzes: this.isPremium
    });
  }

  navigateToUpgrade(): void {
    this.showSuccessMessage('Redirecionando para página de upgrade...');
    
    setTimeout(() => {
      this.router.navigate(['/upgrade']).catch(error => {
        console.error('Erro ao navegar para upgrade:', error);
        this.showErrorMessage('Erro ao carregar página de upgrade');
      });
    }, 500);
  }

  // ===============================================
  // 🔧 MÉTODOS AUXILIARES FALTANTES
  // ===============================================

  private isQuestionFavorite(questionId: string): boolean {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteQuestions') || '[]');
      return favorites.includes(questionId);
    } catch (error) {
      console.error('❌ Erro ao verificar favorito:', error);
      return false;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateQuestionText(subject: string, difficulty: string, questionNumber: number): string {
    const templates: { [key: string]: { [key: string]: string[] } } = {
      'Álgebra': {
        'Fácil': [
          `Resolva a equação: x + ${questionNumber} = ${questionNumber + 5}`,
          `Simplifique a expressão: ${questionNumber}x + ${questionNumber + 1}x`,
          `Qual o valor de x na equação ${questionNumber}x = ${questionNumber * 3}?`
        ],
        'Médio': [
          `Resolva o sistema: x + y = ${questionNumber}, x - y = ${questionNumber - 2}`,
          `Fatore a expressão: x² + ${questionNumber}x + ${questionNumber - 1}`,
          `Resolva a inequação: ${questionNumber}x > ${questionNumber * 2}`
        ],
        'Difícil': [
          `Resolva a equação quadrática: x² - ${questionNumber}x + ${questionNumber - 1} = 0`,
          `Simplifique: (x + ${questionNumber})² - (x - ${questionNumber})²`,
          `Encontre as raízes da função f(x) = x² + ${questionNumber}x - ${questionNumber * 2}`
        ]
      },
      'Geometria': {
        'Fácil': [
          `Calcule a área de um retângulo com base ${questionNumber} e altura ${questionNumber + 2}`,
          `Qual o perímetro de um quadrado com lado ${questionNumber} cm?`,
          `Calcule a área de um triângulo com base ${questionNumber} e altura ${questionNumber + 1}`
        ],
        'Médio': [
          `Calcule a área de um círculo com raio ${questionNumber} cm`,
          `Qual o volume de um cubo com aresta ${questionNumber} cm?`,
          `Calcule a hipotenusa de um triângulo retângulo com catetos ${questionNumber} e ${questionNumber + 1}`
        ],
        'Difícil': [
          `Calcule o volume de uma esfera com raio ${questionNumber} cm`,
          `Qual a área da superfície de um cilindro com raio ${questionNumber} e altura ${questionNumber * 2}?`,
          `Calcule a distância entre os pontos A(${questionNumber}, 0) e B(0, ${questionNumber + 3})`
        ]
      },
      'Gramática': {
        'Fácil': [
          `Qual é a classe gramatical da palavra destacada na frase?`,
          `Identifique o sujeito da oração: "O menino correu rapidamente."`,
          `Qual é o plural da palavra "cidadão"?`
        ],
        'Médio': [
          `Classifique a oração subordinada na frase complexa apresentada.`,
          `Identifique a figura de linguagem presente no texto.`,
          `Qual é a função sintática do termo destacado?`
        ],
        'Difícil': [
          `Analise sintática completa da seguinte oração complexa.`,
          `Identifique o tipo de discurso utilizado no fragmento.`,
          `Classifique o período quanto à composição e estrutura.`
        ]
      },
      'HTML': {
        'Fácil': [
          `Qual tag HTML é usada para criar um parágrafo?`,
          `Como criar um link em HTML?`,
          `Qual atributo define o texto alternativo de uma imagem?`
        ],
        'Médio': [
          `Qual a diferença entre <div> e <span>?`,
          `Como criar uma tabela em HTML?`,
          `Qual é a estrutura básica de um formulário HTML?`
        ],
        'Difícil': [
          `Como implementar HTML semântico corretamente?`,
          `Qual a diferença entre HTML5 e versões anteriores?`,
          `Como otimizar o HTML para SEO e acessibilidade?`
        ]
      }
    };

    const subjectTemplates = templates[subject];
    if (subjectTemplates && subjectTemplates[difficulty]) {
      const questions = subjectTemplates[difficulty];
      return questions[questionNumber % questions.length];
    }

    return `Questão ${questionNumber} de ${subject} (${difficulty}): Como resolver este problema específico da área?`;
  }

  private generateOptions(subject: string, difficulty: string): string[] {
    // Gerar opções baseadas no assunto
    if (subject.includes('Álgebra') || subject.includes('Aritmética')) {
      return ['x = 2', 'x = 3', 'x = 4', 'x = 5'];
    } else if (subject.includes('Geometria')) {
      return ['12 cm²', '15 cm²', '18 cm²', '20 cm²'];
    } else if (subject.includes('Gramática')) {
      return ['Substantivo', 'Adjetivo', 'Verbo', 'Advérbio'];
    } else if (subject.includes('HTML') || subject.includes('CSS')) {
      return ['<div>', '<span>', '<p>', '<section>'];
    } else if (subject.includes('JavaScript')) {
      return ['var', 'let', 'const', 'function'];
    }

    // Opções genéricas
    return ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
  }

  private showPremiumFeatureMessage(featureName: string): void {
    this.showErrorMessage(`${featureName} é um recurso Premium! 
  
👑 UPGRADE PREMIUM:
✅ ${featureName}
✅ Quizzes Ilimitados
✅ Estatísticas Avançadas

Clique em "Upgrade Premium" para desbloquear!`);
  }

  // ===============================================
  // 🔄 NAVEGAÇÃO
  // ===============================================
  
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToFavorites(): void {
    this.showSuccessMessage('Navegando para favoritos...');
    setTimeout(() => {
      this.router.navigate(['/favorites']);
    }, 500);
  }

  reloadData(): void {
    this.showSuccessMessage('Recarregando dados...');
    this.loadAreaData();
  }

  // ===============================================
  // 📊 PREMIUM: ESTATÍSTICAS E EXPORTAÇÃO
  // ===============================================
  
  async viewStatistics(): Promise<void> {
    if (!this.isPremium) {
      this.showPremiumFeatureMessage('Estatísticas Avançadas');
      return;
    }

    if (!this.areaData) {
      this.showErrorMessage('Dados da área não disponíveis');
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.showErrorMessage('Faça login para ver as estatísticas');
      return;
    }

    const history = await this.quizHistoryService.getHistoryByArea(userId, this.areaName, 20);

    if (history.length === 0) {
      this.showErrorMessage('Você ainda não respondeu nenhuma questão desta área. Faça um quiz primeiro!');
      return;
    }

    const totalQuestions = history.reduce((s, q) => s + q.totalQuestions, 0);
    const correctAnswers = history.reduce((s, q) => s + q.correctAnswers, 0);
    const wrongAnswers = totalQuestions - correctAnswers;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTimeSeconds = history.reduce((s, q) => s + q.timeSpent, 0);
    const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSeconds / totalQuestions) : 0;

    // Agrupar por data para sessões recentes
    const byDate: { [key: string]: { total: number; correct: number } } = {};
    history.forEach(q => {
      const date = new Date(q.completedAt).toLocaleDateString('pt-BR');
      if (!byDate[date]) byDate[date] = { total: 0, correct: 0 };
      byDate[date].total += q.totalQuestions;
      byDate[date].correct += q.correctAnswers;
    });

    const recentSessions = Object.keys(byDate).slice(0, 5).map(date => ({
      date,
      total: byDate[date].total,
      correct: byDate[date].correct,
      accuracy: Math.round((byDate[date].correct / byDate[date].total) * 100)
    }));

    this.detailedStats = {
      areaName: this.areaData.displayName,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      accuracy,
      avgTimePerQuestion,
      totalTimeFormatted: this.formatTimeFromSeconds(totalTimeSeconds),
      wrongQuestionsCount: this.getWrongQuestions().length,
      recentSessions
    };

    this.showDetailedStats = true;

    setTimeout(() => {
      const statsSection = document.getElementById('detailed-stats-section');
      if (statsSection) statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    this.showSuccessMessage('📊 Estatísticas carregadas!');
  }
  
  closeDetailedStats(): void {
    this.showDetailedStats = false;
    this.detailedStats = null;
  }
  
  async exportProgress(): Promise<void> {
    if (!this.isPremium) {
      this.showPremiumFeatureMessage('Exportar Progresso');
      return;
    }

    if (!this.areaData) {
      this.showErrorMessage('Dados da área não disponíveis');
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.showErrorMessage('Faça login para exportar');
      return;
    }

    try {
      // Buscar histórico real do Firestore
      const history = await this.quizHistoryService.getHistoryByArea(userId, this.areaName, 50);

      if (history.length === 0) {
        this.showErrorMessage('Você ainda não respondeu nenhuma questão desta área. Faça um quiz primeiro!');
        return;
      }

      // Calcular estatísticas
      const totalQuestions = history.reduce((s, q) => s + q.totalQuestions, 0);
      const correctAnswers = history.reduce((s, q) => s + q.correctAnswers, 0);
      const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
      const totalTimeSeconds = history.reduce((s, q) => s + q.timeSpent, 0);

      // Criar conteúdo HTML para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Progresso - ${this.areaData.displayName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #f59e0b;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #f59e0b;
              margin: 0;
              font-size: 32px;
            }
            .header p {
              color: #666;
              margin: 10px 0 0 0;
            }
            .summary {
              background: #fffbeb;
              border: 2px solid #fbbf24;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .summary h2 {
              color: #f59e0b;
              margin-top: 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .stat-item {
              background: white;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #111;
            }
            .history-section {
              margin-top: 30px;
            }
            .history-section h2 {
              color: #111;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #f9fafb;
              font-weight: 600;
              color: #111;
            }
            .correct {
              color: #22c55e;
              font-weight: bold;
            }
            .wrong {
              color: #ef4444;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #999;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório de Progresso</h1>
            <p><strong>${this.areaData.displayName}</strong></p>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="summary">
            <h2>📈 Resumo Geral</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total de Questões</div>
                <div class="stat-value">${totalQuestions}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Acertos</div>
                <div class="stat-value" style="color: #22c55e;">${correctAnswers}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Erros</div>
                <div class="stat-value" style="color: #ef4444;">${totalQuestions - correctAnswers}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Precisão</div>
                <div class="stat-value" style="color: #3b82f6;">${accuracy}%</div>
              </div>
            </div>
          </div>
          
          <div class="history-section">
            <h2>📋 Histórico de Quizzes</h2>
            <table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Acertos</th>
                  <th>Pontuação</th>
                  <th>Tempo</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                ${history.map((q, i) => `
                  <tr>
                    <td>#${i + 1} (${q.totalQuestions} questões)</td>
                    <td class="${q.score >= 70 ? 'correct' : 'wrong'}">
                      ${q.correctAnswers}/${q.totalQuestions}
                    </td>
                    <td class="${q.score >= 70 ? 'correct' : 'wrong'}">${q.score}%</td>
                    <td>${Math.round(q.timeSpent / 60)}min</td>
                    <td>${new Date(q.completedAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Relatório gerado por <strong>Quizzfy</strong> | Plataforma de Quizzes Inteligentes</p>
            <p>Usuário Premium 👑</p>
          </div>
        </body>
        </html>
      `;
      
      // ✅ Criar janela de impressão
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // ✅ Esperar carregar e imprimir
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
        
        this.showSuccessMessage('📄 PDF sendo gerado! Use a opção "Salvar como PDF" na janela de impressão.');
      } else {
        throw new Error('Não foi possível abrir janela de impressão');
      }
      
    } catch (error) {
      console.error('❌ Erro ao exportar progresso:', error);
      this.showErrorMessage('Erro ao exportar progresso. Tente novamente.');
    }
  }

  // ===============================================
  // 🔧 MÉTODOS AUXILIARES
  // ===============================================

  getAvailableSubjects(): string[] {
    const wrongQuestions = this.getWrongQuestions();
    const subjects = [...new Set(wrongQuestions.map(q => q.subject))];
    return subjects.sort();
  }

  getAvailableDifficulties(): ('Fácil' | 'Médio' | 'Difícil')[] {
    const wrongQuestions = this.getWrongQuestions();
    const difficulties = [...new Set(wrongQuestions.map(q => q.difficulty))];
    
    const order: { [key: string]: number } = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };
    return difficulties.sort((a, b) => order[a] - order[b]) as ('Fácil' | 'Médio' | 'Difícil')[];
  }

  // ===============================================
  // 🧪 DEBUG METHODS (REMOVER EM PRODUÇÃO)
  // ===============================================
  
  debugAreaData(): void {
    console.log('🔍 DEBUG AREA DATA:');
    console.log('- areaId:', this.areaId);
    console.log('- areaName:', this.areaName);
    console.log('- areaData:', this.areaData);
    console.log('- isLoading:', this.isLoading);
    console.log('- hasError:', this.hasError);
    console.log('- questions.length:', this.questions.length);
    console.log('- totalQuestions:', this.areaData?.totalQuestions);
    console.log('- completed:', this.areaData?.userProgress.completed);
    console.log('- progressPercentage:', this.getProgressPercentage());
    console.log('- wrongQuestions:', this.getWrongQuestions().length);
    console.log('- isPremium:', this.isPremium);
    
    // ✅ VERIFICAÇÃO DE CÁLCULO
    if (this.areaData) {
      const calc = {
        completed: this.areaData.userProgress.completed,
        total: this.areaData.totalQuestions,
        division: this.areaData.userProgress.completed / this.areaData.totalQuestions,
        percentage: (this.areaData.userProgress.completed / this.areaData.totalQuestions) * 100
      };
      console.log('🧮 CÁLCULO DETALHADO:', calc);
    }
  }

  // ✅ MÉTODO PARA SIMULAR DADOS (APENAS PARA TESTE)
  forceWrongQuestionsForTesting(): void {
    if (this.questions.length === 0) {
      this.showErrorMessage('Carregue as questões primeiro!');
      return;
    }

    console.log('🧪 SIMULANDO QUESTÕES ERRADAS PARA TESTE...');
    
    // Pegar algumas questões aleatórias
    const randomQuestions = this.shuffleArray(this.questions).slice(0, 3);
    
    // Criar histórico fake
    const fakeHistory = randomQuestions.map(q => ({
      questionId: String(q.id), // ✅ GARANTIR que seja string
      area: this.areaName,
      correct: false,
      date: new Date().toISOString(),
      timeSpent: Math.floor(Math.random() * 60) + 30
    }));
    
    // Obter histórico existente
    const existingHistory = this.progressService.getHistory();
    
    // Remover entradas duplicadas
    const filteredExisting = existingHistory.filter(h => 
      !fakeHistory.some(f => String(f.questionId) === String(h.questionId) && f.area === h.area) // ✅ GARANTIR comparação string vs string
    );
    
    // Adicionar novo histórico
    const newHistory = [...filteredExisting, ...fakeHistory];
    
    // Salvar no localStorage
    localStorage.setItem('quizHistory', JSON.stringify(newHistory));
    
    // Atualizar progresso
    this.updateUserProgress();
    
    console.log('✅ Histórico simulado:', fakeHistory);
    console.log('🔄 Questões erradas agora:', this.getWrongQuestions().length);
    
    this.showSuccessMessage(`${fakeHistory.length} questões erradas simuladas! Progresso atualizado.`);
  }

  getProgressPercentage(): number {
    if (!this.areaData || !this.areaData.totalQuestions) {
      return 0;
    }
    const total = this.areaData.totalQuestions;
    const completed = this.areaData.userProgress.completed;
    const percentage = Math.round((completed / total) * 100);
    if (!isFinite(percentage) || isNaN(percentage)) return 0;
    return Math.min(percentage, 100);
  }

  // ===============================================
  // � MÉTODOS DE ESTATÍSTICAS QUALITATIVAS
  // ===============================================

  getDominatedSubjects(): string {
    if (!this.questions || this.questions.length === 0) return '0';
    const history = this.progressService.getHistory().filter(h => h.area === this.areaName);
    if (history.length === 0) return '0';

    const uniqueSubjects = new Set(this.questions.map(q => q.subject));
    const totalSubjects = uniqueSubjects.size;
    let dominated = 0;

    uniqueSubjects.forEach(subject => {
      const subjectIds = new Set(this.questions.filter(q => q.subject === subject).map(q => String(q.id)));
      const subjectHistory = history.filter(h => subjectIds.has(String(h.questionId)));
      if (subjectHistory.length >= 3) {
        const accuracy = subjectHistory.filter(h => h.correct).length / subjectHistory.length;
        if (accuracy >= 0.7) dominated++;
      }
    });

    return `${dominated} de ${totalSubjects}`;
  }

  getBestSubject(): string {
    if (!this.questions || this.questions.length === 0) return 'Nenhuma';
    const history = this.progressService.getHistory().filter(h => h.area === this.areaName);
    if (history.length === 0) return 'Faça um quiz';

    const uniqueSubjects = new Set(this.questions.map(q => q.subject));
    let bestSubject = '';
    let bestAccuracy = -1;

    uniqueSubjects.forEach(subject => {
      const subjectIds = new Set(this.questions.filter(q => q.subject === subject).map(q => String(q.id)));
      const subjectHistory = history.filter(h => subjectIds.has(String(h.questionId)));
      if (subjectHistory.length >= 1) {
        const accuracy = subjectHistory.filter(h => h.correct).length / subjectHistory.length;
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy;
          bestSubject = subject;
        }
      }
    });

    return bestSubject ? this.formatSubjectName(bestSubject) : 'Faça um quiz';
  }

  getSubjectToReview(): string {
    if (!this.questions || this.questions.length === 0) return 'Nenhuma';
    const history = this.progressService.getHistory().filter(h => h.area === this.areaName);
    if (history.length === 0) return 'Faça um quiz';

    const uniqueSubjects = new Set(this.questions.map(q => q.subject));
    let reviewSubject = '';
    let lowestAccuracy = Infinity;

    uniqueSubjects.forEach(subject => {
      const subjectIds = new Set(this.questions.filter(q => q.subject === subject).map(q => String(q.id)));
      const subjectHistory = history.filter(h => subjectIds.has(String(h.questionId)));
      if (subjectHistory.length >= 1) {
        const accuracy = subjectHistory.filter(h => h.correct).length / subjectHistory.length;
        if (accuracy < lowestAccuracy) {
          lowestAccuracy = accuracy;
          reviewSubject = subject;
        }
      }
    });

    return reviewSubject ? this.formatSubjectName(reviewSubject) : 'Faça um quiz';
  }

  // REMOVIDO: Método duplicado formatSubjectName

  // ===============================================
  // �🔧 MÉTODOS DE FILTRO E ORDENAÇÃO
  // ===============================================

  private sortQuestions(questions: AreaQuestion[]): AreaQuestion[] {
    switch (this.sortBy) {
      case 'popularity':
        return questions.sort((a, b) => b.popularity - a.popularity);
      case 'difficulty':
        const difficultyOrder = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };
        return questions.sort((a, b) => 
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
      case 'subject':
        return questions.sort((a, b) => a.subject.localeCompare(b.subject));
      case 'recent':
        const wrongHistory = this.progressService.getHistory()
          .filter(h => h.area === this.areaName && !h.correct)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return questions.sort((a, b) => {
          // ✅ CORRIGIDO: Garantir comparação string vs string
          const aIndex = wrongHistory.findIndex(h => String(h.questionId) === String(a.id));
          const bIndex = wrongHistory.findIndex(h => String(h.questionId) === String(b.id));
          
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          
          return aIndex - bIndex;
        });
      default:
        return questions;
    }
  }

  clearFilters(): void {
    this.selectedSubject = 'all';
    this.selectedDifficulty = 'all';
    this.sortBy = 'popularity';
    this.searchQuery = '';
    this.currentPage = 1;
    
    this.showSuccessMessage('Filtros limpos! Mostrando todas as questões.');
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  startSingleQuestionQuiz(questionId: string): void {
    this.showSuccessMessage('Carregando questão...');
    
    setTimeout(() => {
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'single',
          area: this.areaName,
          questionId: questionId,
          premium: this.isPremium ? 'true' : 'false'
        }
      }).catch(error => {
        console.error('Erro ao navegar para quiz:', error);
        this.showErrorMessage('Erro ao carregar questão');
      });
    }, 500);
  }

  toggleFavorite(questionId: string): void {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteQuestions') || '[]');
      const index = favorites.indexOf(questionId);
      
      if (index > -1) {
        favorites.splice(index, 1);
        this.showSuccessMessage('Questão removida dos favoritos');
      } else {
        favorites.push(questionId);
        this.showSuccessMessage('Questão adicionada aos favoritos');
      }
      
      localStorage.setItem('favoriteQuestions', JSON.stringify(favorites));
      
      const question = this.filteredQuestions.find(q => q.id === questionId);
      if (question) {
        question.isFavorite = !question.isFavorite;
      }
      
    } catch (error) {
      this.showErrorMessage('Erro ao atualizar favoritos');
    }
  }

  // ===============================================
  // 🔧 MÉTODOS AUXILIARES ADICIONAIS
  // ===============================================

  private formatTimeFromSeconds(totalSeconds: number): string {
    if (totalSeconds === 0) return '0min';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    } else if (minutes > 0) {
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    } else {
      return `${seconds}s`;
    }
  }

  private getEstimatedTime(difficulty: string): string {
    switch (difficulty) {
      case 'Fácil': return '1min';
      case 'Médio': return '2min';
      case 'Difícil': return '3min';
      default: return '2min';
    }
  }

  private formatSubjectName(subject: string): string {
    return subject
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private normalizeDifficulty(difficulty: string): 'Fácil' | 'Médio' | 'Difícil' {
    const normalized = difficulty.toLowerCase();
    if (normalized.includes('fac') || normalized.includes('easy') || normalized.includes('basic')) return 'Fácil';
    if (normalized.includes('dif') || normalized.includes('hard') || normalized.includes('avanced')) return 'Difícil';
    return 'Médio';
  }

  private showPremiumLimitMessage(): void {
    if (this.isPremium) {
      // ✅ Se for Premium, não deveria chegar aqui, mas...
      this.showSuccessMessage('👑 Usuário Premium: Quizzes ilimitados! Pode fazer quantos quiser.');
      return;
    }

    const remaining = this.remainingQuizzes;
    if (remaining === 0) {
      this.showErrorMessage(`🚫 Limite diário atingido! Você fez 5 quizzes hoje.
      
👑 UPGRADE PREMIUM:
✅ Quizzes ILIMITADOS por dia
✅ Quiz Inteligente 
✅ Filtros Avançados
    
Clique em "Upgrade Premium" para desbloquear!`);
    } else {
      this.showErrorMessage(`⚠️ Restam ${remaining} quiz${remaining > 1 ? 's' : ''} hoje.
    
👑 Upgrade para Premium = Quizzes ILIMITADOS!`);
    }
  }

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
  // 📊 CONFIGURAÇÕES DE ÁREA (DADOS REAIS)
  // ===============================================

  private getAreaConfiguration(areaId: string): AreaData | null {
    const areaConfigurations: { [key: string]: AreaData } = {
      'matematica': {
        name: 'matematica',
        displayName: 'Matemática',
        description: 'Matemática Básica, Álgebra e Geometria',
        icon: '🔢',
        color: '#ffc107',
        totalQuestions: 80,
        subjects: ['Porcentagem', 'Razão', 'Proporção', 'Regra de Três', 'Álgebra', 'Equações', 'Geometria'],
        difficulty: { easy: 30, medium: 35, hard: 15 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      },
      'portugues': {
        name: 'portugues',
        displayName: 'Português',
        description: 'Gramática, Interpretação, Redação e Comunicação',
        icon: '📚',
        color: '#dc3545',
        totalQuestions: 140,
        subjects: ['Gramática', 'Ortografia', 'Semântica', 'Interpretação', 'Redação', 'Coerência', 'Coesão'],
        difficulty: { easy: 50, medium: 60, hard: 30 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      },
      'informatica': {
        name: 'informatica',
        displayName: 'Informática',
        description: 'Conceitos gerais de Informática, Hardware, Redes e Ferramentas Office',
        icon: '💾',
        color: '#28a745',
        totalQuestions: 75,
        subjects: ['Hardware', 'Sistemas Operacionais', 'Internet', 'Editor de Texto', 'Planilhas', 'Redes'],
        difficulty: { easy: 25, medium: 35, hard: 15 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      },
      'informatica-geral': {
        name: 'informatica-geral',
        displayName: 'Informática Geral',
        description: 'Conceitos gerais de Informática, Hardware, Redes e Ferramentas Office',
        icon: '💾',
        color: '#28a745',
        totalQuestions: 75,
        subjects: ['Hardware', 'Sistemas Operacionais', 'Internet', 'Editor de Texto', 'Planilhas', 'Redes'],
        difficulty: { easy: 25, medium: 35, hard: 15 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      },
      'desenvolvimento-web': {
        name: 'desenvolvimento-web',
        displayName: 'Desenvolvimento Web',
        description: 'HTML, CSS, JavaScript, React, Angular, Node.js',
        icon: '💻',
        color: '#007bff',
        totalQuestions: 0,
        subjects: ['HTML', 'CSS', 'JavaScript', 'Angular', 'React', 'DevOps'],
        difficulty: { easy: 45, medium: 75, hard: 30 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      },
      'analise-desenvolvimento-sistemas': {
        name: 'analise-desenvolvimento-sistemas',
        displayName: 'Análise e Desenvolvimento de Sistemas',
        description: 'Desenvolvimento Web, DevOps e Segurança da Informação',
        icon: '💻',
        color: '#007bff',
        totalQuestions: 600,
        subjects: ['Fundamentos de Programação', 'Desenvolvimento Web Frontend', 'Design e Interface', 'Metodologias e DevOps', 'Segurança em Desenvolvimento', 'Preparação para Entrevista'],
        difficulty: { easy: 200, medium: 280, hard: 120 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      },
      'simulados': {
        name: 'simulados',
        displayName: 'Simulados',
        description: 'Provas completas no estilo real: Prova Paulista, ENEM e mais',
        icon: '📝',
        color: '#e67e22',
        totalQuestions: 30,
        subjects: ['prova-paulista-9ano-2024', 'enem-2024', 'lp-caderno-9ano-1bimestre'],
        difficulty: { easy: 10, medium: 15, hard: 5 },
        userProgress: { completed: 0, accuracy: 0, timeSpent: '0min' }
      }
    };

    const config = areaConfigurations[areaId.toLowerCase()];
    if (!config) {
      console.error(`❌ Área não encontrada: ${areaId}`);
      console.log('✅ Áreas disponíveis:', Object.keys(areaConfigurations));
      return null;
    }

    return config;
  }
}