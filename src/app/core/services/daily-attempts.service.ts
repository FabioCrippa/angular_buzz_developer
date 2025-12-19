// ===============================================
// 🔄 DAILY-ATTEMPTS.SERVICE.TS - CONTROLE DE TENTATIVAS NO FIRESTORE
// ===============================================

import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

// ===============================================
// 📝 INTERFACES
// ===============================================

export interface DailyAttempt {
  userId: string;
  area: string;
  date: string; // YYYY-MM-DD
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Date;
  quizzesTaken: string[]; // IDs dos quizzes realizados
}

export interface AttemptsStatus {
  canAttempt: boolean;
  remaining: number;
  maxAttempts: number;
  nextResetAt: Date;
  message: string;
}

// ===============================================
// 💎 DAILY ATTEMPTS SERVICE
// ===============================================

@Injectable({
  providedIn: 'root'
})
export class DailyAttemptsService {

  private readonly MAX_FREE_ATTEMPTS = 1; // 1 tentativa por área por dia (FREE)
  private attemptsCache = new Map<string, DailyAttempt>();
  
  // Observable para status de tentativas
  private attemptsStatusSubject = new BehaviorSubject<Map<string, AttemptsStatus>>(new Map());
  public attemptsStatus$ = this.attemptsStatusSubject.asObservable();

  constructor(private firestore: Firestore) {}

  // ===============================================
  // 📥 VERIFICAR SE PODE FAZER TENTATIVA
  // ===============================================

  async canAttemptQuiz(userId: string, area: string, isPremium: boolean = false): Promise<AttemptsStatus> {
    try {
      if (!userId) {
        return this.getErrorStatus('Usuário não identificado');
      }

      // Premium tem tentativas ilimitadas
      if (isPremium) {
        return {
          canAttempt: true,
          remaining: -1,
          maxAttempts: -1,
          nextResetAt: this.getNextMidnight(),
          message: 'Tentativas ilimitadas (Premium)'
        };
      }

      // Buscar tentativas do dia
      const todayAttempt = await this.getTodayAttempt(userId, area);
      const remaining = this.MAX_FREE_ATTEMPTS - todayAttempt.attempts;

      return {
        canAttempt: remaining > 0,
        remaining: Math.max(0, remaining),
        maxAttempts: this.MAX_FREE_ATTEMPTS,
        nextResetAt: this.getNextMidnight(),
        message: remaining > 0 
          ? `Você tem ${remaining} tentativa(s) restante(s) hoje`
          : 'Tentativas esgotadas. Próxima tentativa disponível à meia-noite'
      };

    } catch (error) {
      console.error('❌ Erro ao verificar tentativas:', error);
      return this.getErrorStatus('Erro ao verificar tentativas');
    }
  }

  // ===============================================
  // ➕ REGISTRAR TENTATIVA
  // ===============================================

  async registerAttempt(userId: string, area: string, quizId: string, isPremium: boolean = false): Promise<boolean> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido para registrar tentativa');
        return false;
      }

      // Premium não registra tentativas (ilimitadas)
      if (isPremium) {
        console.log('💎 Usuário premium - tentativa não contabilizada');
        return true;
      }

      const today = this.getTodayString();
      const attemptRef = doc(this.firestore, `users/${userId}/dailyAttempts/${area}_${today}`);
      
      // Buscar documento existente
      const attemptSnap = await getDoc(attemptRef);

      if (attemptSnap.exists()) {
        // Atualizar tentativa existente
        const currentData = attemptSnap.data() as DailyAttempt;
        
        // Verificar se já excedeu o limite
        if (currentData.attempts >= this.MAX_FREE_ATTEMPTS) {
          console.warn('⚠️ Limite de tentativas já atingido');
          return false;
        }

        await updateDoc(attemptRef, {
          attempts: currentData.attempts + 1,
          lastAttemptAt: Timestamp.now(),
          quizzesTaken: [...currentData.quizzesTaken, quizId]
        });

        console.log(`✅ Tentativa registrada: ${currentData.attempts + 1}/${this.MAX_FREE_ATTEMPTS}`);
      } else {
        // Criar novo documento
        const newAttempt: DailyAttempt = {
          userId,
          area,
          date: today,
          attempts: 1,
          maxAttempts: this.MAX_FREE_ATTEMPTS,
          lastAttemptAt: new Date(),
          quizzesTaken: [quizId]
        };

        await setDoc(attemptRef, {
          ...newAttempt,
          lastAttemptAt: Timestamp.fromDate(newAttempt.lastAttemptAt)
        });

        console.log(`✅ Primeira tentativa registrada: 1/${this.MAX_FREE_ATTEMPTS}`);
      }

      // Atualizar cache
      this.attemptsCache.delete(`${userId}_${area}_${today}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao registrar tentativa:', error);
      return false;
    }
  }

  // ===============================================
  // 📊 OBTER TENTATIVAS DO DIA
  // ===============================================

  async getTodayAttempt(userId: string, area: string): Promise<DailyAttempt> {
    try {
      const today = this.getTodayString();
      const cacheKey = `${userId}_${area}_${today}`;

      // Verificar cache primeiro
      if (this.attemptsCache.has(cacheKey)) {
        return this.attemptsCache.get(cacheKey)!;
      }

      // Buscar do Firestore
      const attemptRef = doc(this.firestore, `users/${userId}/dailyAttempts/${area}_${today}`);
      const attemptSnap = await getDoc(attemptRef);

      if (attemptSnap.exists()) {
        const data = attemptSnap.data();
        const attempt: DailyAttempt = {
          userId: data['userId'],
          area: data['area'],
          date: data['date'],
          attempts: data['attempts'],
          maxAttempts: data['maxAttempts'],
          lastAttemptAt: data['lastAttemptAt']?.toDate() || new Date(),
          quizzesTaken: data['quizzesTaken'] || []
        };

        // Salvar no cache
        this.attemptsCache.set(cacheKey, attempt);
        return attempt;
      }

      // Retornar tentativa vazia se não existir
      const emptyAttempt: DailyAttempt = {
        userId,
        area,
        date: today,
        attempts: 0,
        maxAttempts: this.MAX_FREE_ATTEMPTS,
        lastAttemptAt: new Date(),
        quizzesTaken: []
      };

      return emptyAttempt;

    } catch (error) {
      console.error('❌ Erro ao buscar tentativas do dia:', error);
      return {
        userId,
        area,
        date: this.getTodayString(),
        attempts: 0,
        maxAttempts: this.MAX_FREE_ATTEMPTS,
        lastAttemptAt: new Date(),
        quizzesTaken: []
      };
    }
  }

  // ===============================================
  // 📈 OBTER ESTATÍSTICAS DE TODAS AS ÁREAS
  // ===============================================

  async getAllAreasStatus(userId: string, areas: string[], isPremium: boolean = false): Promise<Map<string, AttemptsStatus>> {
    const statusMap = new Map<string, AttemptsStatus>();

    for (const area of areas) {
      const status = await this.canAttemptQuiz(userId, area, isPremium);
      statusMap.set(area, status);
    }

    this.attemptsStatusSubject.next(statusMap);
    return statusMap;
  }

  // ===============================================
  // 🔄 MIGRAR DO LOCALSTORAGE PARA FIRESTORE
  // ===============================================

  async migrateFromLocalStorage(userId: string): Promise<number> {
    try {
      let migratedCount = 0;
      const today = this.getTodayString();

      // Procurar por chaves antigas no localStorage
      const possibleKeys = [
        `buzz_developer_free_trial_${userId}`,
        'buzz_developer_free_trial_anonymous',
        'buzz_developer_free_trial'
      ];

      for (const key of possibleKeys) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        try {
          const oldData = JSON.parse(stored);
          
          // Verificar se é de hoje
          if (oldData.date === today && oldData.attempts) {
            for (const [area, attempts] of Object.entries(oldData.attempts)) {
              if (typeof attempts === 'number' && attempts > 0) {
                const attemptRef = doc(this.firestore, `users/${userId}/dailyAttempts/${area}_${today}`);
                
                await setDoc(attemptRef, {
                  userId,
                  area,
                  date: today,
                  attempts,
                  maxAttempts: this.MAX_FREE_ATTEMPTS,
                  lastAttemptAt: Timestamp.now(),
                  quizzesTaken: []
                });

                migratedCount++;
                console.log(`✅ Migrado ${area}: ${attempts} tentativa(s)`);
              }
            }
          }

          // Limpar localStorage após migração
          localStorage.removeItem(key);
        } catch (parseError) {
          console.warn('⚠️ Erro ao parsear dados antigos:', parseError);
        }
      }

      if (migratedCount > 0) {
        console.log(`✅ ${migratedCount} tentativa(s) migrada(s) do localStorage`);
      }

      return migratedCount;
    } catch (error) {
      console.error('❌ Erro ao migrar tentativas:', error);
      return 0;
    }
  }

  // ===============================================
  // 🧹 LIMPAR CACHE LOCAL
  // ===============================================

  clearCache(): void {
    this.attemptsCache.clear();
    console.log('🧹 Cache de tentativas limpo');
  }

  // ===============================================
  // 🛠️ MÉTODOS AUXILIARES
  // ===============================================

  private getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private getErrorStatus(message: string): AttemptsStatus {
    return {
      canAttempt: false,
      remaining: 0,
      maxAttempts: this.MAX_FREE_ATTEMPTS,
      nextResetAt: this.getNextMidnight(),
      message
    };
  }

  // Obter tentativas restantes (síncrono - usa cache)
  getRemainingFromCache(userId: string, area: string): number {
    const today = this.getTodayString();
    const cacheKey = `${userId}_${area}_${today}`;
    const cached = this.attemptsCache.get(cacheKey);
    
    if (cached) {
      return Math.max(0, this.MAX_FREE_ATTEMPTS - cached.attempts);
    }
    
    return this.MAX_FREE_ATTEMPTS; // Assume máximo se não tiver no cache
  }
}
