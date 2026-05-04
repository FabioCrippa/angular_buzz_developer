import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

interface TrialData {
  date: string;
  attempts: { [area: string]: number };
  lastAttempt: string;
  userId: string; // ✅ ADICIONAR USERID
  trialStartDate: string; // ✅ Quando o usuário criou conta
  totalQuestionsResolved: number; // ✅ Total de questões resolvidas
}

@Injectable({
  providedIn: 'root'
})
export class FreeTrialService {
  
  private readonly STORAGE_KEY_PREFIX = 'buzz_developer_free_trial';
  private readonly AVAILABLE_AREAS = ['analise-desenvolvimento', 'portugues', 'matematica', 'informatica'];
  
  // ✅ TENTATIVAS PROGRESSIVAS: Dias 1-7: 7/dia | Dias 8-14: 7/dia | Dia 15+: 3/dia
  private readonly TRIAL_PHASES = {
    phase1: { days: 7, attemptsPerDay: 7 },   // Dias 1-7: Generoso
    phase2: { days: 14, attemptsPerDay: 7 },  // Dias 8-14: Mantém generoso
    phase3: { days: Infinity, attemptsPerDay: 3 } // Dia 15+: Hard paywall
  };

  constructor(private authService: AuthService) {
  }

  // ✅ CALCULAR TENTATIVAS BASEADO NO DIA DO TRIAL (PÚBLICO)
  getMaxAttemptsForDay(): number {
    const daysInTrial = this.getTrialDaysElapsed();
    
    if (daysInTrial <= 7) {
      return this.TRIAL_PHASES.phase1.attemptsPerDay;
    } else if (daysInTrial <= 14) {
      return this.TRIAL_PHASES.phase2.attemptsPerDay;
    } else {
      return this.TRIAL_PHASES.phase3.attemptsPerDay; // Hard paywall: 3/dia
    }
  }

  // ✅ OBTER DIAS DECORRIDOS DESDE INÍCIO DO TRIAL
  getTrialDaysElapsed(): number {
    const data = this.getTrialData();
    if (!data.trialStartDate) {
      return 0;
    }
    
    const startDate = new Date(data.trialStartDate);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysElapsed);
  }

  // ✅ OBTER DIAS RESTANTES ANTES DO HARD PAYWALL (D15)
  getTrialDaysRemaining(): number {
    const daysElapsed = this.getTrialDaysElapsed();
    const daysRemaining = Math.max(0, 14 - daysElapsed); // 14 dias de trial generoso
    
    return daysRemaining;
  }

  // ✅ VERIFICAR SE ESTÁ NA FASE DE HARD PAYWALL
  isInPaywallPhase(): boolean {
    return this.getTrialDaysElapsed() >= 15;
  }

  // ✅ VERIFICAR SE ESTÁ PERTO DO PAYWALL (últimos 2 dias)
  isNearPaywall(): boolean {
    const remaining = this.getTrialDaysRemaining();
    return remaining >= 0 && remaining <= 2;
  }

  // ✅ OBTER CHAVE DE STORAGE ESPECÍFICA DO USUÁRIO
  private getStorageKey(): string {
    // Obter userId de forma síncrona do localStorage
    const storedUser = localStorage.getItem('sowlfy_user');
    let userId = 'anonymous';
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        userId = userData.id || userData.uid || 'anonymous';
      } catch (error) {
        userId = 'anonymous';
      }
    }
    
    return `${this.STORAGE_KEY_PREFIX}_${userId}`;
  }

  // ✅ OBTER USERID ATUAL DE FORMA SÍNCRONA
  private getCurrentUserId(): string {
    const storedUser = localStorage.getItem('sowlfy_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.id || userData.uid || 'anonymous';
      } catch (error) {
        return 'anonymous';
      }
    }
    return 'anonymous';
  }

  // ✅ OBTER DADOS DO TRIAL
  private getTrialData(): TrialData {
    try {
      const storageKey = this.getStorageKey(); // ✅ USAR CHAVE ESPECÍFICA DO USUÁRIO
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // ✅ VERIFICAR SE É NOVO DIA (RESET À MEIA-NOITE)
        const today = this.getTodayString();
        if (data.date !== today) {
          return this.resetTrialData();
        }
        
        return data;
      }
    } catch (error) {
    }
    
    return this.resetTrialData();
  }

  // ✅ RESETAR DADOS DO TRIAL
  private resetTrialData(): TrialData {
    // Tentar recuperar dados existentes para preservar trialStartDate
    let existingData: TrialData | null = null;
    try {
      const storageKey = this.getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        existingData = JSON.parse(stored);
      }
    } catch (error) {
    }
    
    const data: TrialData = {
      date: this.getTodayString(),
      attempts: {
        'analise-desenvolvimento': 0,
        'portugues': 0,
        'matematica': 0,
        'informatica': 0
      },
      lastAttempt: '',
      userId: this.getCurrentUserId(),
      trialStartDate: existingData?.trialStartDate || new Date().toISOString(), // ✅ Só set na primeira vez
      totalQuestionsResolved: existingData?.totalQuestionsResolved || 0 // ✅ Acumula
    };
    
    this.saveTrialData(data);
    return data;
  }

  // ✅ SALVAR DADOS DO TRIAL
  private saveTrialData(data: TrialData): void {
    try {
      const storageKey = this.getStorageKey(); // ✅ USAR CHAVE ESPECÍFICA DO USUÁRIO
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
    }
  }

  // ✅ OBTER STRING DO DIA ATUAL (FORMATO YYYY-MM-DD)
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ✅ VERIFICAR SE PODE FAZER QUIZ EM UMA ÁREA ESPECÍFICA (COMPATIBILIDADE)
  canStartQuiz(area: string): boolean {
    const data = this.getTrialData();
    const attempts = data.attempts[area] || 0;
    const maxAttempts = this.getMaxAttemptsForDay();
    const canStart = attempts < maxAttempts;
    
    return canStart;
  }

  // ✅ OBTER TENTATIVAS RESTANTES EM UMA ÁREA ESPECÍFICA (COMPATIBILIDADE)
  getRemainingAttempts(area: string): number {
    const data = this.getTrialData();
    const attempts = data.attempts[area] || 0;
    const maxAttempts = this.getMaxAttemptsForDay();
    const remaining = Math.max(0, maxAttempts - attempts);
    
    return remaining;
  }

  // ✅ PODE INICIAR QUALQUER QUIZ?
  canStartAnyQuiz(): boolean {
    return this.getTotalRemainingAttempts() > 0;
  }

  // ✅ REGISTRAR TENTATIVA EM UMA ÁREA ESPECÍFICA
  registerAttempt(area: string): boolean {
    if (!this.canStartQuiz(area)) {
      return false;
    }

    const data = this.getTrialData();
    data.attempts[area] = (data.attempts[area] || 0) + 1;
    data.lastAttempt = new Date().toISOString();
    
    this.saveTrialData(data);
    
    const remaining = this.getRemainingAttempts(area);
    
    return true;
  }

  // ✅ ADICIONAR QUESTÕES RESOLVIDAS (PARA TRIGGER DE SOFT OFFER)
  addQuestionsResolved(count: number): void {
    const data = this.getTrialData();
    data.totalQuestionsResolved = (data.totalQuestionsResolved || 0) + count;
    this.saveTrialData(data);
  }

  // ✅ OBTER TOTAL DE QUESTÕES RESOLVIDAS
  getTotalQuestionsResolved(): number {
    const data = this.getTrialData();
    return data.totalQuestionsResolved || 0;
  }

  // ✅ VERIFICAR SE ATINGIU 50 QUESTÕES (SOFT OFFER TRIGGER)
  shouldShowSoftUpgradeOffer(): boolean {
    const totalResolved = this.getTotalQuestionsResolved();
    const daysElapsed = this.getTrialDaysElapsed();
    
    // Mostrar se: resolveu 50+ questões E ainda tem dias disponíveis E não está na fase de paywall
    return totalResolved >= 50 && daysElapsed >= 1 && !this.isInPaywallPhase();
  }

  // ✅ OBTER RESUMO DETALHADO DE TODAS AS ÁREAS
  getDailySummary(): { [area: string]: { used: number; remaining: number; canStart: boolean } } {
    const data = this.getTrialData();
    const summary: { [area: string]: { used: number; remaining: number; canStart: boolean } } = {};
    
    const maxAttempts = this.getMaxAttemptsForDay();
    this.AVAILABLE_AREAS.forEach(area => {
      const used = data.attempts[area] || 0;
      const remaining = Math.max(0, maxAttempts - used);
      const canStart = remaining > 0;
      
      summary[area] = {
        used,
        remaining,
        canStart
      };
    });
    
    return summary;
  }

  // ✅ VERIFICAR SE AINDA HÁ TENTATIVAS DISPONÍVEIS EM QUALQUER ÁREA
  hasAvailableAttempts(): boolean {
    const summary = this.getDailySummary();
    return Object.values(summary).some(area => area.remaining > 0);
  }

  // ✅ VERIFICAR SE ESGOTOU TODAS AS TENTATIVAS DE TODAS AS ÁREAS
  hasExhaustedAllAttempts(): boolean {
    return !this.hasAvailableAttempts();
  }

  // ✅ OBTER ÁREAS COM TENTATIVAS DISPONÍVEIS
  getAvailableAreas(): string[] {
    const summary = this.getDailySummary();
    return this.AVAILABLE_AREAS.filter(area => summary[area].canStart);
  }

  // ✅ OBTER ÁREAS ESGOTADAS
  getExhaustedAreas(): string[] {
    const summary = this.getDailySummary();
    return this.AVAILABLE_AREAS.filter(area => !summary[area].canStart);
  }

  // ✅ OBTER TOTAL DE TENTATIVAS RESTANTES (TODAS AS ÁREAS)
  getTotalRemainingAttempts(): number {
    const summary = this.getDailySummary();
    return Object.values(summary).reduce((total, area) => total + area.remaining, 0);
  }

  // ✅ OBTER TOTAL DE TENTATIVAS USADAS (TODAS AS ÁREAS)
  getTotalUsedAttempts(): number {
    const summary = this.getDailySummary();
    return Object.values(summary).reduce((total, area) => total + area.used, 0);
  }

  // ✅ VERIFICAR SE É UM NOVO USUÁRIO (PRIMEIRA VEZ)
  isNewUser(): boolean {
    const storageKey = this.getStorageKey(); // ✅ USAR CHAVE ESPECÍFICA DO USUÁRIO
    const stored = localStorage.getItem(storageKey);
    return !stored;
  }

  // ✅ OBTER ESTATÍSTICAS GERAIS
  getTrialStats(): {
    totalAreas: number;
    availableAreas: number;
    exhaustedAreas: number;
    totalAttempts: number;
    usedAttempts: number;
    remainingAttempts: number;
    isNewUser: boolean;
    userId: string;
    daysElapsed: number;
    daysRemaining: number;
  } {
    const summary = this.getDailySummary();
    const maxAttemptsToday = this.getMaxAttemptsForDay();
    
    return {
      totalAreas: this.AVAILABLE_AREAS.length,
      availableAreas: this.getAvailableAreas().length,
      exhaustedAreas: this.getExhaustedAreas().length,
      totalAttempts: this.AVAILABLE_AREAS.length * maxAttemptsToday,
      usedAttempts: this.getTotalUsedAttempts(),
      remainingAttempts: this.getTotalRemainingAttempts(),
      isNewUser: this.isNewUser(),
      userId: this.getCurrentUserId(),
      daysElapsed: this.getTrialDaysElapsed(),
      daysRemaining: this.getTrialDaysRemaining()
    };
  }

  // ✅ MÉTODO PARA LIMPAR DADOS DO USUÁRIO ATUAL (DESENVOLVIMENTO/TESTES)
  clearTrialData(): void {
    const storageKey = this.getStorageKey();
    localStorage.removeItem(storageKey);
  }

  // ✅ MÉTODO PARA LIMPAR DADOS DE TODOS OS USUÁRIOS (APENAS PARA LIMPEZA COMPLETA)
  clearAllTrialData(): void {
    // Remove todas as chaves que começam com o prefixo
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  // ✅ MÉTODO PARA DEBUG/LOG COMPLETO
  logTrialStatus(): void {
    const stats = this.getTrialStats();
    const summary = this.getDailySummary();
    // Log removed for production
  }
}
