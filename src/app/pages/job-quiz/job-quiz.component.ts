import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type Step = 'input' | 'confirm' | 'loading' | 'quiz' | 'result';

interface TopicConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  file: string;
  keywords: string[];
}

interface DetectedTopic extends TopicConfig {
  selected: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: number; name: string; alias: string }[];
  correct: string;
  explanation: string;
  topicId: string;
  topicLabel: string;
  topicIcon: string;
}

interface QuizAnswer {
  question: QuizQuestion;
  selected: string;
  correct: boolean;
}

interface TopicResult {
  id: string;
  label: string;
  icon: string;
  color: string;
  file: string;
  correct: number;
  total: number;
}

@Component({
  selector: 'app-job-quiz',
  templateUrl: './job-quiz.component.html',
  styleUrls: ['./job-quiz.component.css']
})
export class JobQuizComponent {

  step: Step = 'input';
  jobText = '';
  detectedTopics: DetectedTopic[] = [];

  // Quiz state
  questions: QuizQuestion[] = [];
  currentIndex = 0;
  selectedAlias: string | null = null;
  answered = false;
  answers: QuizAnswer[] = [];

  // Result
  topicResults: TopicResult[] = [];
  finalScore = 0;

  readonly MAX_QUESTIONS = 20;

  private readonly TOPIC_MAP: TopicConfig[] = [
    {
      id: 'javascript', label: 'JavaScript', icon: '🟡', color: '#f59e0b',
      file: 'analise-desenvolvimento-sistemas/fundamentos-programacao/javascript',
      keywords: ['javascript', 'es6', 'es2015', 'ecmascript', 'node.js', 'nodejs', 'vanilla js',
        'dom manipulation', 'promises', 'async/await', 'arrow function', 'closures', 'prototype',
        'event loop', 'hoisting']
    },
    {
      id: 'typescript', label: 'TypeScript', icon: '🔷', color: '#3178c6',
      file: 'analise-desenvolvimento-sistemas/fundamentos-programacao/typescript',
      keywords: ['typescript', 'tipagem', 'tipos estáticos', 'type script', ' ts,', ' ts ']
    },
    {
      id: 'boas-praticas', label: 'Boas Práticas / SOLID', icon: '✨', color: '#8b5cf6',
      file: 'analise-desenvolvimento-sistemas/fundamentos-programacao/boas-praticas',
      keywords: ['clean code', 'solid', 'design pattern', 'padrões de projeto', 'boas práticas',
        'refactor', 'dry principle', 'kiss principle', 'código limpo', 'coesão', 'acoplamento']
    },
    {
      id: 'angular', label: 'Angular', icon: '🔺', color: '#dd0031',
      file: 'analise-desenvolvimento-sistemas/desenvolvimento-web-frontend/angular',
      keywords: ['angular', 'rxjs', 'ngrx', '@angular', 'angular cli', 'angularjs', 'angular 2',
        'angular 14', 'angular 15', 'angular 16', 'angular 17', 'angular 18']
    },
    {
      id: 'react', label: 'React', icon: '⚛️', color: '#20d0f3',
      file: 'analise-desenvolvimento-sistemas/desenvolvimento-web-frontend/react',
      keywords: ['react', 'reactjs', 'react.js', 'react native', 'hooks', 'useeffect',
        'usestate', 'redux', 'next.js', 'nextjs', 'jsx', 'tsx', 'zustand', 'react query']
    },
    {
      id: 'html', label: 'HTML5', icon: '🌐', color: '#e34f26',
      file: 'analise-desenvolvimento-sistemas/desenvolvimento-web-frontend/html',
      keywords: ['html', 'html5', 'semântica', 'acessibilidade', 'aria', 'dom', 'marcação', 'seo técnico']
    },
    {
      id: 'css', label: 'CSS / Estilização', icon: '🎨', color: '#1572b6',
      file: 'analise-desenvolvimento-sistemas/desenvolvimento-web-frontend/css',
      keywords: ['css', 'css3', 'scss', 'sass', 'less', 'tailwind', 'bootstrap', 'flexbox',
        'grid layout', 'estilização', 'styled components', 'css modules', 'material ui', 'chakra']
    },
    {
      id: 'responsividade', label: 'Responsividade', icon: '📱', color: '#06b6d4',
      file: 'analise-desenvolvimento-sistemas/desenvolvimento-web-frontend/responsividade',
      keywords: ['responsiv', 'mobile first', 'media querie', 'layout adapt', 'telas móveis',
        'design responsivo', 'mobile-first', 'breakpoint']
    },
    {
      id: 'debugging', label: 'Debugging', icon: '🐞', color: '#ef4444',
      file: 'analise-desenvolvimento-sistemas/desenvolvimento-web-frontend/debugging-frontend',
      keywords: ['debug', 'debugging', 'devtools', 'chrome tools', 'breakpoint', 'profiler', 'inspetor']
    },
    {
      id: 'git', label: 'Git / Versionamento', icon: '🌿', color: '#f05032',
      file: 'analise-desenvolvimento-sistemas/metodologias-devops/versionamento',
      keywords: ['git', 'github', 'gitlab', 'bitbucket', 'versionamento', 'controle de versão',
        'branch', 'merge', 'gitflow', 'pull request', 'rebase', 'cherry-pick']
    },
    {
      id: 'scrum', label: 'Scrum / Agile', icon: '🏃', color: '#0ea5e9',
      file: 'analise-desenvolvimento-sistemas/metodologias-devops/scrum',
      keywords: ['scrum', 'agile', 'ágil', 'kanban', 'sprint', 'metodologia ágil',
        'product backlog', 'daily scrum', 'retrospectiva', 'jira', 'trello', 'planning']
    },
    {
      id: 'testes', label: 'Testes', icon: '🧪', color: '#10b981',
      file: 'analise-desenvolvimento-sistemas/metodologias-devops/testes-unitarios',
      keywords: ['teste', 'testing', 'tdd', 'bdd', 'jest', 'jasmine', 'cypress',
        'unit test', 'e2e', 'test coverage', 'cobertura de test', 'vitest', 'playwright']
    },
    {
      id: 'devops', label: 'DevOps / Docker', icon: '🐳', color: '#2496ed',
      file: 'analise-desenvolvimento-sistemas/metodologias-devops/devops',
      keywords: ['devops', 'docker', 'kubernetes', 'k8s', 'container', 'aws', 'azure',
        'gcp', 'cloud', 'terraform', 'ansible', 'linux', 'infraestrutura como código']
    },
    {
      id: 'cicd', label: 'CI/CD', icon: '⚙️', color: '#6366f1',
      file: 'analise-desenvolvimento-sistemas/metodologias-devops/ci-cd',
      keywords: ['ci/cd', 'ci cd', 'pipeline', 'github actions', 'jenkins', 'gitlab ci',
        'continuous integration', 'continuous deployment', 'integração contínua', 'deploy automatizado']
    },
    {
      id: 'code-review', label: 'Code Review', icon: '👁️', color: '#a855f7',
      file: 'analise-desenvolvimento-sistemas/metodologias-devops/code-review',
      keywords: ['code review', 'revisão de código', 'pull request review', 'pair programming',
        'code quality', 'qualidade de código']
    },
    {
      id: 'autenticacao', label: 'Autenticação / Auth', icon: '🔐', color: '#f59e0b',
      file: 'analise-desenvolvimento-sistemas/seguranca-desenvolvimento/autenticacao',
      keywords: ['autenticação', 'auth', 'jwt', 'oauth', 'token', 'oauth2',
        'keycloak', 'auth0', 'sessão', 'cookie', 'sso', 'ldap']
    },
    {
      id: 'seguranca', label: 'Segurança / Criptografia', icon: '🛡️', color: '#64748b',
      file: 'analise-desenvolvimento-sistemas/seguranca-desenvolvimento/criptografia',
      keywords: ['segurança', 'criptografia', 'encryption', 'ssl', 'https', 'xss',
        'csrf', 'sql injection', 'owasp', 'pentest', 'cybersecurity', 'vulnerabilidade']
    },
    {
      id: 'figma', label: 'Design / Figma', icon: '🎭', color: '#f24e1e',
      file: 'analise-desenvolvimento-sistemas/design-interface/figma',
      keywords: ['figma', 'ux', 'ui design', 'prototip', 'wireframe', 'sketch',
        'adobe xd', 'design system', 'componentes visuais', 'user experience', 'user interface']
    },
    {
      id: 'micro-frontend', label: 'Micro Frontend', icon: '🧩', color: '#0d9488',
      file: 'analise-desenvolvimento-sistemas/design-interface/micro-front-end',
      keywords: ['micro frontend', 'micro-frontend', 'microfrontend',
        'module federation', 'monorepo', 'nx workspace', 'web components']
    },
    {
      id: 'entrevista', label: 'Entrevista Técnica', icon: '💬', color: '#ec4899',
      file: 'analise-desenvolvimento-sistemas/prep-entrevista/entrevista-tecnica',
      keywords: [] // Always included
    }
  ];

  constructor(private http: HttpClient, private router: Router) {}

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentIndex];
  }

  get selectedCount(): number {
    return this.detectedTopics.filter(t => t.selected).length;
  }

  get progress(): number {
    const done = this.currentIndex + (this.answered ? 1 : 0);
    return (done / this.questions.length) * 100;
  }

  get correctAnswersCount(): number {
    return this.answers.filter(a => a.correct).length;
  }

  analyzeJob(): void {
    if (this.jobText.trim().length < 20) return;
    const text = this.jobText.toLowerCase();
    this.detectedTopics = this.TOPIC_MAP
      .filter(t => t.keywords.length === 0 || t.keywords.some(kw => text.includes(kw)))
      .map(t => ({ ...t, selected: true }));
    this.step = 'confirm';
  }

  toggleTopic(topic: DetectedTopic): void {
    topic.selected = !topic.selected;
  }

  selectAll(): void {
    this.detectedTopics.forEach(t => t.selected = true);
  }

  deselectAll(): void {
    this.detectedTopics.forEach(t => t.selected = false);
  }

  startQuiz(): void {
    const selected = this.detectedTopics.filter(t => t.selected);
    if (!selected.length) return;
    this.step = 'loading';

    const requests: Observable<QuizQuestion[]>[] = selected.map(topic =>
      this.http.get<any>(`assets/data/areas/${topic.file}.json`).pipe(
        map(data => (data.questions || []).map((q: any): QuizQuestion => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || '',
          topicId: topic.id,
          topicLabel: topic.label,
          topicIcon: topic.icon
        }))),
        catchError(() => of([] as QuizQuestion[]))
      )
    );

    forkJoin(requests).subscribe(results => {
      let all: QuizQuestion[] = ([] as QuizQuestion[]).concat(...results);
      // Fisher-Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      this.questions = all.slice(0, this.MAX_QUESTIONS);
      this.currentIndex = 0;
      this.selectedAlias = null;
      this.answered = false;
      this.answers = [];
      this.step = 'quiz';
    });
  }

  selectAnswer(alias: string): void {
    if (this.answered) return;
    this.selectedAlias = alias;
    this.answered = true;
    const correct = alias === this.currentQuestion.correct;
    this.answers.push({ question: this.currentQuestion, selected: alias, correct });
  }

  isCorrectOption(alias: string): boolean {
    return this.answered && alias === this.currentQuestion.correct;
  }

  isWrongSelected(alias: string): boolean {
    return this.answered && alias === this.selectedAlias && alias !== this.currentQuestion.correct;
  }

  isDimmed(alias: string): boolean {
    return this.answered && alias !== this.currentQuestion.correct && alias !== this.selectedAlias;
  }

  isSelected(alias: string): boolean {
    return !this.answered && this.selectedAlias === alias;
  }

  next(): void {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.selectedAlias = null;
      this.answered = false;
    } else {
      this.calculateResults();
      this.step = 'result';
    }
  }

  private calculateResults(): void {
    this.finalScore = this.answers.length
      ? Math.round((this.correctAnswersCount / this.answers.length) * 100)
      : 0;

    const byTopic = new Map<string, { correct: number; total: number; topic: DetectedTopic }>();
    this.answers.forEach(a => {
      const topic = this.detectedTopics.find(t => t.id === a.question.topicId);
      if (!topic) return;
      if (!byTopic.has(a.question.topicId)) {
        byTopic.set(a.question.topicId, { correct: 0, total: 0, topic });
      }
      const entry = byTopic.get(a.question.topicId)!;
      entry.total++;
      if (a.correct) entry.correct++;
    });

    this.topicResults = Array.from(byTopic.values())
      .map(e => ({
        id: e.topic.id,
        label: e.topic.label,
        icon: e.topic.icon,
        color: e.topic.color,
        file: e.topic.file,
        correct: e.correct,
        total: e.total
      }))
      .sort((a, b) => (a.correct / a.total) - (b.correct / b.total)); // weakest first
  }

  getScoreLabel(): string {
    if (this.finalScore >= 80) return '🏆 Excelente!';
    if (this.finalScore >= 60) return '👍 Bom resultado!';
    if (this.finalScore >= 40) return '📖 Continue estudando';
    return '💪 Precisa revisar mais';
  }

  getScoreColor(): string {
    if (this.finalScore >= 80) return '#10b981';
    if (this.finalScore >= 60) return '#3b82f6';
    if (this.finalScore >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getTopicBarColor(tr: TopicResult): string {
    return (tr.correct / tr.total) >= 0.6 ? '#10b981' : '#ef4444';
  }

  getTopicScoreColor(tr: TopicResult): string {
    return (tr.correct / tr.total) >= 0.6 ? '#10b981' : '#ef4444';
  }

  restart(): void {
    this.step = 'input';
    this.jobText = '';
    this.detectedTopics = [];
    this.questions = [];
    this.answers = [];
    this.topicResults = [];
    this.finalScore = 0;
    this.currentIndex = 0;
    this.selectedAlias = null;
    this.answered = false;
  }

  goToArea(): void {
    this.router.navigate(['/area', 'analise-desenvolvimento-sistemas']);
  }
}
