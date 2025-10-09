import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

// ✅ MATERIAL IMPORTS INDIVIDUAIS
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

// ✅ SERVICES
import { QuizService } from '../../core/services/quiz.service';
import { StorageService } from '../../core/services/storage.service';
import { QuizConfig } from '../../core/models/quiz.model';

interface AreaData {
  area: {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    subjects: Subject[];
  };
  questions: any[];
}

interface Subject {
  name: string;
  displayName: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
}

@Component({
  selector: 'app-area',
  standalone: true, // ✅ COMPONENTE STANDALONE
  imports: [
    // ✅ IMPORTS NECESSÁRIOS
    CommonModule,
    FormsModule,
    
    // Material Components
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSliderModule,
    MatRadioModule,
    MatCheckboxModule,
    MatRippleModule,
    MatDividerModule
  ],
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.css']
})
export class AreaComponent implements OnInit {
  areaName: string = '';
  areaData: AreaData | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Quiz Configuration
  selectedSubjects: string[] = [];
  selectedDifficulty: string = 'mixed';
  questionCount: number = 10;
  timeLimit: number = 0; // 0 = sem limite
  shuffleQuestions: boolean = true;

  // User Progress for this area
  areaProgress: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private quizService: QuizService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.areaName = params['name'];
      this.loadAreaData();
    });
  }

  loadAreaData(): void {
    this.isLoading = true;
    this.hasError = false;

    // Carregar dados da área
    this.quizService.getQuestionsByArea(this.areaName).subscribe({
      next: (questions) => {
        // Simular estrutura de área (normalmente viria do backend)
        this.areaData = {
          area: {
            name: this.areaName,
            displayName: this.getAreaDisplayName(this.areaName),
            description: this.getAreaDescription(this.areaName),
            icon: this.getAreaIcon(this.areaName),
            subjects: this.extractSubjects(questions)
          },
          questions: questions
        };

        // Carregar progresso do usuário para esta área
        this.loadAreaProgress();

        // Definir título da página
        this.titleService.setTitle(`${this.areaData.area.displayName} - Quizzfy`);
        
        this.isLoading = false;
        
        this.showSuccessMessage(`${questions.length} questões carregadas!`);
      },
      error: (error) => {
        console.error('Erro ao carregar área:', error);
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados da área. Verifique se a área existe.';
        this.isLoading = false;
        
        this.showErrorMessage('Erro ao carregar área');
      }
    });
  }

  loadAreaProgress(): void {
    const userProgress = this.storage.getUserProgress();
    this.areaProgress = userProgress.areas[this.areaName] || {
      percentage: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      streak: 0,
      lastActivity: null,
      level: 1,
      xp: 0
    };
  }

  // ✅ CONFIGURAÇÃO DO QUIZ
  startQuiz(): void {
    if (!this.areaData) return;

    const config: QuizConfig = {
      mode: 'area',
      areaName: this.areaName,
      questionCount: this.questionCount,
      timeLimit: this.timeLimit > 0 ? this.timeLimit : undefined,
      subjects: this.selectedSubjects.length > 0 ? this.selectedSubjects : undefined,
      difficulty: this.selectedDifficulty === 'mixed' ? undefined : this.selectedDifficulty as any,
      shuffle: this.shuffleQuestions
    };

    this.showSuccessMessage('Iniciando quiz...');

    // Criar sessão de quiz
    this.quizService.createQuizSession(config).subscribe({
      next: (session) => {
        // Navegar para a página de quiz
        setTimeout(() => {
          this.router.navigate(['/quiz', 'area', this.areaName]);
        }, 500);
      },
      error: (error) => {
        console.error('Erro ao criar sessão de quiz:', error);
        this.showErrorMessage('Erro ao iniciar quiz');
      }
    });
  }

  // ✅ QUIZ RÁPIDO
  startQuickQuiz(): void {
    const config: QuizConfig = {
      mode: 'area',
      areaName: this.areaName,
      questionCount: 5,
      shuffle: true
    };

    this.quizService.createQuizSession(config).subscribe({
      next: (session) => {
        this.showSuccessMessage('Iniciando quiz rápido!');
        setTimeout(() => {
          this.router.navigate(['/quiz', 'area', this.areaName]);
        }, 500);
      },
      error: (error) => {
        this.showErrorMessage('Erro ao iniciar quiz rápido');
      }
    });
  }

  // ✅ ALTERNAR SUBJECT SELECIONADO
  toggleSubject(subjectName: string): void {
    const index = this.selectedSubjects.indexOf(subjectName);
    if (index > -1) {
      this.selectedSubjects.splice(index, 1);
    } else {
      this.selectedSubjects.push(subjectName);
    }
  }

  isSubjectSelected(subjectName: string): boolean {
    return this.selectedSubjects.includes(subjectName);
  }

  // ✅ UTILITY METHODS
  private extractSubjects(questions: any[]): Subject[] {
    const subjectMap = new Map<string, any>();

    questions.forEach(question => {
      if (!subjectMap.has(question.subject)) {
        subjectMap.set(question.subject, {
          name: question.subject,
          displayName: this.getSubjectDisplayName(question.subject),
          questionCount: 0,
          difficulties: new Set(),
          topics: new Set()
        });
      }

      const subject = subjectMap.get(question.subject);
      subject.questionCount++;
      subject.difficulties.add(question.difficulty);
      
      if (question.tags) {
        question.tags.forEach((tag: string) => subject.topics.add(tag));
      }
    });

    return Array.from(subjectMap.values()).map(subject => ({
      name: subject.name,
      displayName: subject.displayName,
      questionCount: subject.questionCount,
      difficulty: this.getMostCommonDifficulty(subject.difficulties),
      topics: Array.from(subject.topics)
    }));
  }

  private getMostCommonDifficulty(difficulties: Set<string>): 'easy' | 'medium' | 'hard' {
    if (difficulties.has('medium')) return 'medium';
    if (difficulties.has('hard')) return 'hard';
    return 'easy';
  }

  private getAreaDisplayName(areaName: string): string {
    const displayNames: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'portugues': 'Português',
      'matematica': 'Matemática',
      'informatica': 'Informática'
    };
    return displayNames[areaName] || areaName;
  }

  private getAreaDescription(areaName: string): string {
    const descriptions: { [key: string]: string } = {
      'desenvolvimento-web': 'Domine as tecnologias mais modernas do desenvolvimento web',
      'portugues': 'Aprimore seu conhecimento em gramática, interpretação e redação',
      'matematica': 'Desenvolva seu raciocínio lógico e habilidades matemáticas',
      'informatica': 'Explore conceitos fundamentais de sistemas e redes'
    };
    return descriptions[areaName] || 'Área de conhecimento especializado';
  }

  private getAreaIcon(areaName: string): string {
    const icons: { [key: string]: string } = {
      'desenvolvimento-web': '💻',
      'portugues': '📚',
      'matematica': '🔢',
      'informatica': '💾'
    };
    return icons[areaName] || '📖';
  }

  private getSubjectDisplayName(subjectName: string): string {
    const displayNames: { [key: string]: string } = {
      'react': 'React',
      'angular': 'Angular',
      'javascript': 'JavaScript',
      'node': 'Node.js',
      'css': 'CSS',
      'html': 'HTML',
      'typescript': 'TypeScript'
    };
    return displayNames[subjectName] || subjectName.charAt(0).toUpperCase() + subjectName.slice(1);
  }

  // ✅ NOTIFICATION METHODS
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // ✅ NAVIGATION
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  viewProgress(): void {
    this.router.navigate(['/progress']);
  }
}
