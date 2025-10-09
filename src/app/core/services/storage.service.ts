import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly KEYS = {
    USER_PROGRESS: 'quizzfy_user_progress',
    QUIZ_SESSIONS: 'quizzfy_quiz_sessions', 
    FAVORITES: 'quizzfy_favorites',
    SETTINGS: 'quizzfy_settings',
    ACHIEVEMENTS: 'quizzfy_achievements'
  };

  // Observables para mudanças
  private progressSubject = new BehaviorSubject<any>(null);
  public progress$ = this.progressSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    // Inicializa dados padrão se não existirem
    if (!this.getItem(this.KEYS.USER_PROGRESS)) {
      this.setUserProgress(this.createDefaultProgress());
    }
    
    if (!this.getItem(this.KEYS.FAVORITES)) {
      this.setFavorites([]);
    }

    // Emite valores iniciais
    this.progressSubject.next(this.getUserProgress());
    this.favoritesSubject.next(this.getFavorites());
  }

  // ✅ PROGRESS METHODS
  getUserProgress(): any {
    return this.getItem(this.KEYS.USER_PROGRESS) || this.createDefaultProgress();
  }

  setUserProgress(progress: any): void {
    this.setItem(this.KEYS.USER_PROGRESS, progress);
    this.progressSubject.next(progress);
  }

  updateAreaProgress(areaName: string, progress: any): void {
    const userProgress = this.getUserProgress();
    userProgress.areas[areaName] = { ...userProgress.areas[areaName], ...progress };
    userProgress.updatedAt = new Date().toISOString();
    this.setUserProgress(userProgress);
  }

  // ✅ FAVORITES METHODS
  getFavorites(): string[] {
    const favorites = this.getItem(this.KEYS.FAVORITES) || [];
    return Array.isArray(favorites) ? favorites : [];
  }

  setFavorites(favorites: string[]): void {
    this.setItem(this.KEYS.FAVORITES, favorites);
    this.favoritesSubject.next(favorites);
  }

  addFavorite(questionId: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(questionId)) {
      favorites.push(questionId);
      this.setFavorites(favorites);
    }
  }

  removeFavorite(questionId: string): void {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(questionId);
    if (index > -1) {
      favorites.splice(index, 1);
      this.setFavorites(favorites);
    }
  }

  isFavorite(questionId: string): boolean {
    return this.getFavorites().includes(questionId);
  }

  // ✅ QUIZ SESSIONS
  saveQuizSession(session: any): void {
    const sessions = this.getItem(this.KEYS.QUIZ_SESSIONS) || [];
    sessions.push(session);
    
    // Mantém apenas os últimos 50 sessions
    if (sessions.length > 50) {
      sessions.splice(0, sessions.length - 50);
    }
    
    this.setItem(this.KEYS.QUIZ_SESSIONS, sessions);
  }

  getQuizSessions(): any[] {
    return this.getItem(this.KEYS.QUIZ_SESSIONS) || [];
  }

  getQuizSessionsByArea(areaName: string): any[] {
    const sessions = this.getQuizSessions();
    return sessions.filter(session => 
      session.config.areaName === areaName || 
      (session.config.mode === 'area' && session.config.areaName === areaName)
    );
  }

  // ✅ SETTINGS
  getSettings(): any {
    return this.getItem(this.KEYS.SETTINGS) || this.createDefaultSettings();
  }

  setSettings(settings: any): void {
    this.setItem(this.KEYS.SETTINGS, settings);
  }

  // ✅ ACHIEVEMENTS
  getAchievements(): any[] {
    return this.getItem(this.KEYS.ACHIEVEMENTS) || [];
  }

  unlockAchievement(achievement: any): void {
    const achievements = this.getAchievements();
    if (!achievements.find(a => a.id === achievement.id)) {
      achievement.unlockedAt = new Date().toISOString();
      achievements.push(achievement);
      this.setItem(this.KEYS.ACHIEVEMENTS, achievements);
    }
  }

  // ✅ STATISTICS
  updateStatistics(stats: any): void {
    const progress = this.getUserProgress();
    progress.statistics = { ...progress.statistics, ...stats };
    progress.updatedAt = new Date().toISOString();
    this.setUserProgress(progress);
  }

  // ✅ PRIVATE HELPERS
  private getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erro ao recuperar ${key}:`, error);
      return null;
    }
  }

  private setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
    }
  }

  private createDefaultProgress(): any {
    return {
      userId: this.generateId(),
      totalXP: 0,
      level: 1,
      streak: 0,
      areas: {},
      achievements: [],
      statistics: {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        avgScore: 0,
        timeSpent: 0,
        favoriteArea: '',
        bestStreak: 0,
        weeklyGoal: 50,
        weeklyProgress: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private createDefaultSettings(): any {
    return {
      theme: 'light',
      notifications: true,
      sound: true,
      autoNext: true,
      showExplanations: true,
      defaultQuestionCount: 10,
      defaultTimeLimit: 0
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ✅ UTILITY METHODS
  clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeStorage();
  }

  exportData(): string {
    const data = {
      progress: this.getUserProgress(),
      favorites: this.getFavorites(),
      sessions: this.getQuizSessions(),
      achievements: this.getAchievements(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.progress) this.setUserProgress(data.progress);
      if (data.favorites) this.setFavorites(data.favorites);
      if (data.sessions) this.setItem(this.KEYS.QUIZ_SESSIONS, data.sessions);
      if (data.achievements) this.setItem(this.KEYS.ACHIEVEMENTS, data.achievements);
      if (data.settings) this.setSettings(data.settings);
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }
}
