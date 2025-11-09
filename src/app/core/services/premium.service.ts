import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PremiumFeatures {
  unlimitedQuizzes: boolean;
  smartQuiz: boolean;
  advancedStats: boolean;
  performanceAnalysis: boolean;
  advancedFilters: boolean;
  spacedRepetition: boolean;
  exportProgress: boolean;
  customThemes: boolean;
  noAds: boolean;
}

export interface UserPremiumStatus {
  isPremium: boolean;
  expiryDate?: Date;
  features: PremiumFeatures;
  dailyQuizCount: number;
  dailyQuizLimit: number;
}

@Injectable({
  providedIn: 'root'
})
export class PremiumService {
  private readonly STORAGE_KEY = 'premiumStatus';
  private readonly DAILY_QUIZ_KEY = 'dailyQuizCount';
  
  private premiumStatusSubject = new BehaviorSubject<UserPremiumStatus>(this.getInitialStatus());
  
  constructor() {
    this.resetDailyCountIfNeeded();
  }

  // ===============================================
  // 🎯 OBSERVABLES PÚBLICOS
  // ===============================================
  
  get premiumStatus$(): Observable<UserPremiumStatus> {
    return this.premiumStatusSubject.asObservable();
  }

  get isPremium(): boolean {
    return this.premiumStatusSubject.value.isPremium;
  }

  get canTakeQuiz(): boolean {
    const status = this.premiumStatusSubject.value;
    if (status.isPremium) return true;
    return status.dailyQuizCount < status.dailyQuizLimit;
  }

  get remainingQuizzes(): number {
    const status = this.premiumStatusSubject.value;
    if (status.isPremium) return -1; // Ilimitado
    return Math.max(0, status.dailyQuizLimit - status.dailyQuizCount);
  }

  // ===============================================
  // 🎮 AÇÕES PRINCIPAIS
  // ===============================================
  
  consumeQuiz(): boolean {
    const currentStatus = this.premiumStatusSubject.value;
    
    if (currentStatus.isPremium) {
      return true; // Premium pode fazer quantos quiser
    }
    
    if (currentStatus.dailyQuizCount >= currentStatus.dailyQuizLimit) {
      return false; // Limite atingido
    }
    
    // Incrementa contador
    const newStatus = {
      ...currentStatus,
      dailyQuizCount: currentStatus.dailyQuizCount + 1
    };
    
    this.updateStatus(newStatus);
    this.saveDailyCount(newStatus.dailyQuizCount);
    
    return true;
  }

  activatePremium(duration: 'monthly' | 'yearly' = 'monthly'): void {
    const expiryDate = new Date();
    if (duration === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const premiumStatus: UserPremiumStatus = {
      isPremium: true,
      expiryDate,
      features: this.getPremiumFeatures(),
      dailyQuizCount: 0,
      dailyQuizLimit: -1 // Ilimitado
    };

    this.updateStatus(premiumStatus);
    this.saveToStorage(premiumStatus);
  }

  deactivatePremium(): void {
    const freeStatus = this.getFreeStatus();
    this.updateStatus(freeStatus);
    this.saveToStorage(freeStatus);
  }

  // ===============================================
  // 🔧 VERIFICAÇÕES DE RECURSOS
  // ===============================================
  
  hasFeature(feature: keyof PremiumFeatures): boolean {
    return this.premiumStatusSubject.value.features[feature];
  }

  canUseSmartQuiz(): boolean {
    return this.hasFeature('smartQuiz');
  }

  canViewAdvancedStats(): boolean {
    return this.hasFeature('advancedStats');
  }

  canUseAdvancedFilters(): boolean {
    return this.hasFeature('advancedFilters');
  }

  canExportProgress(): boolean {
    return this.hasFeature('exportProgress');
  }

  // ===============================================
  // 🔧 MÉTODOS PRIVADOS
  // ===============================================
  
  private getInitialStatus(): UserPremiumStatus {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Verifica se ainda é premium (não expirou)
        if (parsed.isPremium && parsed.expiryDate) {
          const expiryDate = new Date(parsed.expiryDate);
          if (expiryDate <= new Date()) {
            // Expirou, volta para free
            return this.getFreeStatus();
          }
        }
        
        return {
          ...parsed,
          expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
          dailyQuizCount: this.getDailyCount()
        };
      }
    } catch (error) {
      console.warn('Erro ao carregar status premium:', error);
    }
    
    return this.getFreeStatus();
  }

  private getFreeStatus(): UserPremiumStatus {
    return {
      isPremium: false,
      features: this.getFreeFeatures(),
      dailyQuizCount: this.getDailyCount(),
      dailyQuizLimit: 5
    };
  }

  private getPremiumFeatures(): PremiumFeatures {
    return {
      unlimitedQuizzes: true,
      smartQuiz: true,
      advancedStats: true,
      performanceAnalysis: true,
      advancedFilters: true,
      spacedRepetition: true,
      exportProgress: true,
      customThemes: true,
      noAds: true
    };
  }

  private getFreeFeatures(): PremiumFeatures {
    return {
      unlimitedQuizzes: false,
      smartQuiz: false,
      advancedStats: false,
      performanceAnalysis: false,
      advancedFilters: false,
      spacedRepetition: false,
      exportProgress: false,
      customThemes: false,
      noAds: false
    };
  }

  private updateStatus(status: UserPremiumStatus): void {
    this.premiumStatusSubject.next(status);
  }

  private saveToStorage(status: UserPremiumStatus): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.warn('Erro ao salvar status premium:', error);
    }
  }

  private getDailyCount(): number {
    try {
      const today = new Date().toDateString();
      const saved = localStorage.getItem(this.DAILY_QUIZ_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          return parsed.count || 0;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar contagem diária:', error);
    }
    return 0;
  }

  private saveDailyCount(count: number): void {
    try {
      const today = new Date().toDateString();
      const data = { date: today, count };
      localStorage.setItem(this.DAILY_QUIZ_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Erro ao salvar contagem diária:', error);
    }
  }

  private resetDailyCountIfNeeded(): void {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(this.DAILY_QUIZ_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date !== today) {
          // Novo dia, resetar contador
          this.saveDailyCount(0);
          const currentStatus = this.premiumStatusSubject.value;
          this.updateStatus({
            ...currentStatus,
            dailyQuizCount: 0
          });
        }
      } catch (error) {
        console.warn('Erro ao resetar contagem diária:', error);
      }
    }
  }

  // ===============================================
  // 🎯 SIMULAÇÃO PARA TESTE
  // ===============================================
  
  // Método temporário para testar diferentes estados
  simulatePremiumStatus(isPremium: boolean): void {
    if (isPremium) {
      this.activatePremium('monthly');
    } else {
      this.deactivatePremium();
    }
  }

  // Para testar limites
  simulateQuizConsumption(count: number): void {
    const currentStatus = this.premiumStatusSubject.value;
    const newStatus = {
      ...currentStatus,
      dailyQuizCount: Math.min(count, currentStatus.dailyQuizLimit)
    };
    this.updateStatus(newStatus);
    this.saveDailyCount(newStatus.dailyQuizCount);
  }
}
