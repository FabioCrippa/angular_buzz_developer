import { Injectable } from '@angular/core';

interface TrialData {
  date: string;
  attempts: { [area: string]: number };
  lastAttempt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FreeTrialService {
  
  private readonly STORAGE_KEY = 'buzz_developer_free_trial';
  private readonly MAX_ATTEMPTS_PER_DAY = 3; // ✅ 3 TENTATIVAS POR ÁREA POR DIA
  private readonly AVAILABLE_AREAS = ['desenvolvimento-web', 'portugues', 'matematica', 'informatica'];

  constructor() {
    console.log('🔧 FreeTrialService inicializado - 3 tentativas por área/dia');
  }

  // ✅ OBTER DADOS DO TRIAL
  private getTrialData(): TrialData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // ✅ VERIFICAR SE É NOVO DIA (RESET À MEIA-NOITE)
        const today = this.getTodayString();
        if (data.date !== today) {
          console.log('🌅 Novo dia detectado - resetando tentativas às 00:00');
          return this.resetTrialData();
        }
        
        return data;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados do trial:', error);
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
      lastAttempt: ''
    };
    
    this.saveTrialData(data);
    console.log('🔄 Tentativas resetadas - 3 por área disponível:', data);
    return data;
  }

  // ✅ SALVAR DADOS DO TRIAL
  private saveTrialData(data: TrialData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Erro ao salvar dados do trial:', error);
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
    
    console.log(`🎯 Verificando área "${area}": ${attempts}/${this.MAX_ATTEMPTS_PER_DAY} tentativas usadas`);
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
      console.warn(`❌ Não é possível iniciar quiz em ${area} - limite atingido`);
      return false;
    }

    const data = this.getTrialData();
    data.attempts[area] = (data.attempts[area] || 0) + 1;
    data.lastAttempt = new Date().toISOString();
    
    this.saveTrialData(data);
    
    const remaining = this.getRemainingAttempts(area);
    console.log(`✅ Tentativa registrada em "${area}": ${data.attempts[area]}/${this.MAX_ATTEMPTS_PER_DAY} (${remaining} restantes)`);
    
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
    const stored = localStorage.getItem(this.STORAGE_KEY);
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
  } {
    const summary = this.getDailySummary();
    
    return {
      totalAreas: this.AVAILABLE_AREAS.length,
      availableAreas: this.getAvailableAreas().length,
      exhaustedAreas: this.getExhaustedAreas().length,
      totalAttempts: this.AVAILABLE_AREAS.length * this.MAX_ATTEMPTS_PER_DAY,
      usedAttempts: this.getTotalUsedAttempts(),
      remainingAttempts: this.getTotalRemainingAttempts(),
      isNewUser: this.isNewUser()
    };
  }

  // ✅ MÉTODO PARA LIMPAR DADOS (DESENVOLVIMENTO/TESTES)
  clearTrialData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Dados do trial limpos - todas as tentativas resetadas');
  }

  // ✅ MÉTODO PARA DEBUG/LOG COMPLETO
  logTrialStatus(): void {
    const stats = this.getTrialStats();
    const summary = this.getDailySummary();
    
    console.log('📊 STATUS COMPLETO DO TRIAL GRATUITO:', {
      estatisticas: stats,
      porArea: summary,
      areasDisponiveis: this.getAvailableAreas(),
      areasEsgotadas: this.getExhaustedAreas()
    });
  }
}
