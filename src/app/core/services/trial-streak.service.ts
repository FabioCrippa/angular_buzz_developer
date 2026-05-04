import { Injectable } from '@angular/core';

interface StreakData {
  currentStreak: number;
  lastAccessDate: string;
  poolIds: string[]; // IDs fixos do pool de 15 questões
}

@Injectable({
  providedIn: 'root'
})
export class TrialStreakService {
  private readonly STREAK_KEY = 'sowlfy_trial_streak';
  private readonly POOL_KEY = 'sowlfy_trial_pool';
  
  // Pool FIXO de 15 questões - IDs únicos (será populado dinamicamente)
  private fixedPoolSize = 15;
  private dailyQuizSize = 7;

  constructor() {}

  /**
   * Obtém ou inicializa o streak do usuário
   * @returns Objeto com streak atual e data do último acesso
   */
  getStreakData(): StreakData {
    const today = this.getTodayDateString();
    const stored = localStorage.getItem(this.STREAK_KEY);

    if (!stored) {
      // Primeiro acesso
      return this.initializeNewStreak(today);
    }

    const streakData: StreakData = JSON.parse(stored);
    
    // Verificar se é um novo dia
    if (streakData.lastAccessDate !== today) {
      // Novo dia - incrementar streak
      streakData.currentStreak++;
      streakData.lastAccessDate = today;
      localStorage.setItem(this.STREAK_KEY, JSON.stringify(streakData));
    }

    return streakData;
  }

  /**
   * Inicializa um novo streak
   */
  private initializeNewStreak(today: string): StreakData {
    const newStreak: StreakData = {
      currentStreak: 1,
      lastAccessDate: today,
      poolIds: []
    };
    localStorage.setItem(this.STREAK_KEY, JSON.stringify(newStreak));
    return newStreak;
  }

  /**
   * Configura o pool fixo de questões (chamado uma única vez com as questões carregadas)
   * @param allQuestions Array com todas as questões carregadas
   */
  setFixedPool(allQuestions: any[]): string[] {
    const existing = localStorage.getItem(this.POOL_KEY);
    
    if (existing) {
      // Pool já existe - retornar os IDs armazenados
      return JSON.parse(existing);
    }

    // Primeira vez - criar pool de 15 questões
    const selectedIds = this.shuffleArray(allQuestions.map(q => q.id))
      .slice(0, this.fixedPoolSize);

    localStorage.setItem(this.POOL_KEY, JSON.stringify(selectedIds));
    return selectedIds;
  }

  /**
   * Obtém as 7 questões do dia (do pool fixo)
   * @param allQuestions Todas as questões carregadas
   * @param poolIds IDs do pool fixo
   * @returns Array com 7 questões para hoje
   */
  getDailyQuestions(allQuestions: any[], poolIds: string[]): any[] {
    const today = this.getTodayDateString();
    const seed = this.hashDate(today);
    
    // Usar seed do dia para shuffle determinístico
    const shuffled = this.shuffleArrayWithSeed(poolIds, seed);
    const selectedIds = shuffled.slice(0, this.dailyQuizSize);

    // Retornar objetos de questão (não apenas IDs)
    return selectedIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter(q => q !== undefined);
  }

  /**
   * Retorna string visual do streak com emojis 🔥
   */
  getStreakDisplay(streak: number): string {
    if (streak === 0) return 'Comece hoje!';
    if (streak === 1) return '✅ Dia 1';
    if (streak <= 3) return '🔥'.repeat(streak - 1) + ' Dia ' + streak;
    if (streak <= 5) return '🔥'.repeat(streak - 1) + ' Dia ' + streak;
    if (streak <= 7) return '🔥'.repeat(streak - 1) + ' Dia ' + streak + ' (Upgrade em 1!)';
    return '🔥'.repeat(7) + ' Máximo!';
  }

  /**
   * Verifica se atingiu o limite de 7 dias (paywall)
   */
  hasReachedPaywall(streak: number): boolean {
    return streak >= 7;
  }

  /**
   * Reseta o streak (usuário comprou upgrade ou limpou cache)
   */
  resetStreak(): void {
    localStorage.removeItem(this.STREAK_KEY);
  }

  /**
   * Reseta o pool (para testes ou mudanças de questões)
   */
  resetPool(): void {
    localStorage.removeItem(this.POOL_KEY);
  }

  /**
   * Shuffle array usando Fisher-Yates
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Shuffle determinístico usando seed (mesmo resultado por dia)
   */
  private shuffleArrayWithSeed<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.seededRandom(seed, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      seed = this.nextSeed(seed);
    }
    return shuffled;
  }

  /**
   * Gerador seeded aleatório (mantém ordem mesmo resultado por dia)
   */
  private seededRandom(seed: number, max: number): number {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max + 1));
  }

  /**
   * Próxima seed
   */
  private nextSeed(seed: number): number {
    return (seed * 9301 + 49297) % 233280;
  }

  /**
   * Hash de data para seed determinístico
   */
  private hashDate(dateString: string): number {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Data de hoje em formato YYYY-MM-DD
   */
  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
