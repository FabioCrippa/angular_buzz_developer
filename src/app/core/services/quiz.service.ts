import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { QuizConfig } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private currentSessionSubject = new BehaviorSubject<any>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  private questionsCache: { [areaName: string]: any[] } = {};

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  // ✅ LOAD QUESTIONS BY AREA
  getQuestionsByArea(areaName: string): Observable<any[]> {
    // Verifica cache primeiro
    if (this.questionsCache[areaName]) {
      return of(this.questionsCache[areaName]);
    }

    return this.http.get<any>(`assets/data/areas/${areaName}.json`).pipe(
      map(data => {
        const questions = data.questions || [];
        this.questionsCache[areaName] = questions;
        return questions;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  // ✅ CREATE QUIZ SESSION
  createQuizSession(config: QuizConfig): Observable<any> {
    return new Observable(observer => {
      this.loadQuestionsForConfig(config).subscribe({
        next: (questions) => {
          if (questions.length === 0) {
            observer.error('Nenhuma questão encontrada para esta configuração');
            return;
          }

          const session = {
            id: this.generateSessionId(),
            config: config,
            questions: this.prepareQuestions(questions, config),
            answers: [],
            startTime: new Date(),
            currentQuestionIndex: 0,
            isCompleted: false
          };

          this.currentSessionSubject.next(session);
          observer.next(session);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ✅ LOAD QUESTIONS FOR CONFIG
  private loadQuestionsForConfig(config: QuizConfig): Observable<any[]> {
    if (config.mode === 'area' && config.areaName) {
      return this.getQuestionsByArea(config.areaName);
    }
    
    if (config.mode === 'random') {
      return this.getAllQuestions();
    }
    
    if (config.mode === 'favorites') {
      return this.getFavoriteQuestions();
    }

    return of([]);
  }

  // ✅ GET ALL QUESTIONS (FOR RANDOM MODE)
  private getAllQuestions(): Observable<any[]> {
    const areas = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];
    const requests = areas.map(area => this.getQuestionsByArea(area));
    
    return new Observable(observer => {
      let allQuestions: any[] = [];
      let completed = 0;

      requests.forEach(request => {
        request.subscribe({
          next: (questions) => {
            allQuestions = allQuestions.concat(questions);
            completed++;
            if (completed === requests.length) {
              observer.next(allQuestions);
              observer.complete();
            }
          },
          error: (error) => {
            completed++;
            if (completed === requests.length) {
              observer.next(allQuestions);
              observer.complete();
            }
          }
        });
      });
    });
  }

  // ✅ GET FAVORITE QUESTIONS
  private getFavoriteQuestions(): Observable<any[]> {
    const favoriteIds = this.storage.getFavorites();
    
    if (favoriteIds.length === 0) {
      return of([]);
    }

    return this.getAllQuestions().pipe(
      map(questions => questions.filter(q => favoriteIds.includes(q.id)))
    );
  }

  // ✅ PREPARE QUESTIONS FOR SESSION
  private prepareQuestions(questions: any[], config: QuizConfig): any[] {
    let filtered = [...questions];

    // Filtrar por dificuldade
    if (config.difficulty && config.difficulty !== 'mixed') {
      filtered = filtered.filter(q => q.difficulty === config.difficulty);
    }

    // Filtrar por subjects
    if (config.subjects && config.subjects.length > 0) {
      filtered = filtered.filter(q => config.subjects!.includes(q.subject));
    }

    // Embaralhar se solicitado
    if (config.shuffle) {
      filtered = this.shuffleArray(filtered);
    }

    // Limitar quantidade
    if (config.questionCount && config.questionCount < filtered.length) {
      filtered = filtered.slice(0, config.questionCount);
    }

    return filtered;
  }

  // ✅ ANSWER QUESTION
  answerQuestion(questionId: string, selectedAnswer: number): void {
    const session = this.currentSessionSubject.value;
    if (!session) return;

    const question = session.questions[session.currentQuestionIndex];
    if (question.id !== questionId) return;

    const answer = {
      questionId: questionId,
      selectedAnswer: selectedAnswer,
      isCorrect: selectedAnswer === question.correctAnswer,
      timeSpent: this.calculateTimeSpent(session),
      answeredAt: new Date()
    };

    session.answers.push(answer);
    
    // Atualiza progresso da questão atual
    this.updateSessionProgress(session);
    
    this.currentSessionSubject.next(session);
  }

  // ✅ NEXT QUESTION
  nextQuestion(): boolean {
    const session = this.currentSessionSubject.value;
    if (!session) return false;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      session.currentQuestionIndex++;
      this.currentSessionSubject.next(session);
      return true;
    }

    return false;
  }

  // ✅ PREVIOUS QUESTION
  previousQuestion(): boolean {
    const session = this.currentSessionSubject.value;
    if (!session) return false;

    if (session.currentQuestionIndex > 0) {
      session.currentQuestionIndex--;
      this.currentSessionSubject.next(session);
      return true;
    }

    return false;
  }

  // ✅ COMPLETE QUIZ
  completeQuiz(): any {
    const session = this.currentSessionSubject.value;
    if (!session) return null;

    session.isCompleted = true;
    session.endTime = new Date();
    session.score = this.calculateScore(session);

    // Salvar sessão
    this.storage.saveQuizSession(session);
    
    // Atualizar progresso do usuário
    this.updateUserProgress(session);
    
    // Limpar sessão atual
    this.currentSessionSubject.next(null);

    return session;
  }

  // ✅ CALCULATE SCORE
  private calculateScore(session: any): any {
    const correctAnswers = session.answers.filter((a: any) => a.isCorrect).length;
    const totalQuestions = session.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = Math.round((session.endTime - session.startTime) / 1000);

    return {
      totalQuestions,
      correctAnswers,
      percentage,
      timeSpent,
      difficulty: session.config.difficulty || 'mixed',
      area: session.config.areaName || 'random'
    };
  }

  // ✅ UPDATE USER PROGRESS
  private updateUserProgress(session: any): void {
    const progress = this.storage.getUserProgress();
    const score = session.score;

    // Atualizar estatísticas gerais
    progress.statistics.totalQuizzes++;
    progress.statistics.totalQuestions += score.totalQuestions;
    progress.statistics.correctAnswers += score.correctAnswers;
    progress.statistics.avgScore = Math.round(
      (progress.statistics.correctAnswers / progress.statistics.totalQuestions) * 100
    );
    progress.statistics.timeSpent += Math.round(score.timeSpent / 60); // em minutos

    // Atualizar XP e Level
    const xpGained = this.calculateXP(score);
    progress.totalXP += xpGained;
    progress.level = Math.floor(progress.totalXP / 100) + 1;

    // Atualizar streak
    if (score.percentage >= 70) {
      progress.streak++;
      if (progress.streak > progress.statistics.bestStreak) {
        progress.statistics.bestStreak = progress.streak;
      }
    } else {
      progress.streak = 0;
    }

    // Atualizar progresso da área
    if (session.config.areaName) {
      this.updateAreaSpecificProgress(progress, session);
    }

    this.storage.setUserProgress(progress);
  }

  // ✅ UPDATE AREA SPECIFIC PROGRESS
  private updateAreaSpecificProgress(progress: any, session: any): void {
    const areaName = session.config.areaName;
    
    if (!progress.areas[areaName]) {
      progress.areas[areaName] = {
        percentage: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        streak: 0,
        lastActivity: new Date().toISOString(),
        level: 1,
        xp: 0
      };
    }

    const areaProgress = progress.areas[areaName];
    const score = session.score;

    areaProgress.questionsAnswered += score.totalQuestions;
    areaProgress.correctAnswers += score.correctAnswers;
    areaProgress.percentage = Math.round((areaProgress.correctAnswers / areaProgress.questionsAnswered) * 100);
    areaProgress.lastActivity = new Date().toISOString();
    
    const areaXP = this.calculateXP(score);
    areaProgress.xp += areaXP;
    areaProgress.level = Math.floor(areaProgress.xp / 50) + 1;
  }

  // ✅ CALCULATE XP
  private calculateXP(score: any): number {
    let xp = score.correctAnswers * 10; // 10 XP por resposta certa
    
    // Bonus por porcentagem
    if (score.percentage >= 90) xp += 50; // Bonus expert
    else if (score.percentage >= 80) xp += 30; // Bonus ótimo
    else if (score.percentage >= 70) xp += 15; // Bonus bom
    
    // Bonus por velocidade (menos de 1 min por questão)
    const avgTimePerQuestion = score.timeSpent / score.totalQuestions;
    if (avgTimePerQuestion < 60) xp += 20;
    
    return xp;
  }

  // ✅ UTILITY METHODS
  private calculateTimeSpent(session: any): number {
    return Math.round((new Date().getTime() - session.startTime.getTime()) / 1000);
  }

  private updateSessionProgress(session: any): void {
    // Implementar lógica adicional se necessário
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ✅ PUBLIC GETTERS
  getCurrentSession(): any {
    return this.currentSessionSubject.value;
  }

  getCurrentQuestion(): any {
    const session = this.currentSessionSubject.value;
    if (!session) return null;
    return session.questions[session.currentQuestionIndex];
  }

  getSessionProgress(): any {
    const session = this.currentSessionSubject.value;
    if (!session) return null;

    return {
      current: session.currentQuestionIndex + 1,
      total: session.questions.length,
      answered: session.answers.length,
      percentage: Math.round(((session.currentQuestionIndex + 1) / session.questions.length) * 100)
    };
  }
}
