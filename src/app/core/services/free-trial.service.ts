import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

interface TrialData {
  date: string;
  attempts: { [area: string]: number };
  lastAttempt: string;
  userId: string; // ✅ ADICIONAR USERID
}

@Injectable({
  providedIn: 'root'
})
export class FreeTrialService {
  
  private readonly STORAGE_KEY_PREFIX = 'buzz_developer_free_trial'; // ✅ AGORA É UM PREFIXO
  private readonly MAX_ATTEMPTS_PER_DAY = 3; // ✅ 3 TENTATIVAS POR ÁREA POR DIA
  private readonly AVAILABLE_AREAS = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];

  constructor(private authService: AuthService) {
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
    const data: TrialData = {
      date: this.getTodayString(),
      attempts: {
        'desenvolvimento-web': 0,
        'portugues': 0,
        'matematica': 0,
        'informatica': 0
      },
      lastAttempt: '',
      userId: this.getCurrentUserId() // ✅ VINCULAR AO USUÁRIO
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

  // ✅ VERIFICAR SE PODE FAZER QUIZ EM UMA ÁREA ESPECÍFICA
  canStartQuiz(area: string): boolean {
    const data = this.getTrialData();
    const attempts = data.attempts[area] || 0;
    const canStart = attempts < this.MAX_ATTEMPTS_PER_DAY;
    
    return canStart;
  }

  // ✅ OBTER TENTATIVAS RESTANTES EM UMA ÁREA ESPECÍFICA
  getRemainingAttempts(area: string): number {
    const data = this.getTrialData();
    const attempts = data.attempts[area] || 0;
    const remaining = Math.max(0, this.MAX_ATTEMPTS_PER_DAY - attempts);
    
    return remaining;
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

  // ✅ OBTER RESUMO DETALHADO DE TODAS AS ÁREAS
  getDailySummary(): { [area: string]: { used: number; remaining: number; canStart: boolean } } {
    const data = this.getTrialData();
    const summary: { [area: string]: { used: number; remaining: number; canStart: boolean } } = {};
    
    this.AVAILABLE_AREAS.forEach(area => {
      const used = data.attempts[area] || 0;
      const remaining = Math.max(0, this.MAX_ATTEMPTS_PER_DAY - used);
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
  } {
    const summary = this.getDailySummary();
    
    return {
      totalAreas: this.AVAILABLE_AREAS.length,
      availableAreas: this.getAvailableAreas().length,
      exhaustedAreas: this.getExhaustedAreas().length,
      totalAttempts: this.AVAILABLE_AREAS.length * this.MAX_ATTEMPTS_PER_DAY,
      usedAttempts: this.getTotalUsedAttempts(),
      remainingAttempts: this.getTotalRemainingAttempts(),
      isNewUser: this.isNewUser(),
      userId: this.getCurrentUserId()
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
