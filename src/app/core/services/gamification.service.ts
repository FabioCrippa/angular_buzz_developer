// ===============================================
// 🎮 GAMIFICATION.SERVICE.TS - SISTEMA DE GAMIFICAÇÃO
// ===============================================

import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

// ===============================================
// 📝 INTERFACES
// ===============================================

export interface UserProgress {
  userId: string;
  xp: number;
  level: number;
  streak: number; // dias consecutivos
  lastActivityDate: string; // YYYY-MM-DD
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  studyTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XPGain {
  amount: number;
  reason: string;
  timestamp: Date;
}

export interface LevelInfo {
  levelName: string;
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPercentage: number;
}

// ===============================================
// 💎 GAMIFICATION SERVICE
// ===============================================

@Injectable({
  providedIn: 'root'
})
export class GamificationService {

  // ✅ CONFIGURAÇÃO DE XP
  private readonly XP_PER_QUIZ = 50;
  private readonly XP_PER_CORRECT_ANSWER = 5;
  private readonly XP_BONUS_PERFECT_SCORE = 100; // 100% de acerto
  private readonly XP_BONUS_STREAK_3_DAYS = 20;
  private readonly XP_BONUS_STREAK_7_DAYS = 50;
  private readonly XP_BONUS_STREAK_30_DAYS = 200;

  // ✅ CONFIGURAÇÃO DE LEVELS (XP necessário para cada level)
  private readonly LEVEL_XP_REQUIREMENTS = [
    0,      // Level 1: 0 XP
    100,    // Level 2: 100 XP
    250,    // Level 3: 250 XP
    500,    // Level 4: 500 XP
    1000,   // Level 5: 1000 XP
    2000,   // Level 6: 2000 XP
    3500,   // Level 7: 3500 XP
    5500,   // Level 8: 5500 XP
    8000,   // Level 9: 8000 XP
    11000,  // Level 10: 11000 XP
    15000,  // Level 11: 15000 XP
    20000,  // Level 12: 20000 XP
    26000,  // Level 13: 26000 XP
    33000,  // Level 14: 33000 XP
    41000,  // Level 15: 41000 XP
    50000   // Level 16+: 50000 XP
  ];

  private progressSubject = new BehaviorSubject<UserProgress | null>(null);
  public progress$ = this.progressSubject.asObservable();

  constructor(private firestore: Firestore) {}

  // ===============================================
  // 📥 CARREGAR PROGRESSO DO USUÁRIO
  // ===============================================

  async loadUserProgress(userId: string): Promise<UserProgress> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido');
        return this.getDefaultProgress(userId);
      }

      const progressRef = doc(this.firestore, `users/${userId}/progress/stats`);
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const data = progressSnap.data();
        const progress: UserProgress = {
          userId: data['userId'],
          xp: data['xp'] || 0,
          level: data['level'] || 1,
          streak: data['streak'] || 0,
          lastActivityDate: data['lastActivityDate'] || this.getTodayString(),
          totalQuizzes: data['totalQuizzes'] || 0,
          totalQuestions: data['totalQuestions'] || 0,
          correctAnswers: data['correctAnswers'] || 0,
          studyTimeMinutes: data['studyTimeMinutes'] || 0,
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        };

        this.progressSubject.next(progress);
        console.log('📊 Progresso carregado:', progress);
        return progress;
      }

      // Criar progresso inicial
      const newProgress = this.getDefaultProgress(userId);
      await this.saveProgress(newProgress);
      return newProgress;

    } catch (error) {
      console.error('❌ Erro ao carregar progresso:', error);
      return this.getDefaultProgress(userId);
    }
  }

  // ===============================================
  // ➕ ADICIONAR XP POR QUIZ COMPLETADO
  // ===============================================

  async addXPForQuiz(
    userId: string, 
    correctAnswers: number, 
    totalQuestions: number, 
    timeSpent: number
  ): Promise<{ xpGained: number; leveledUp: boolean; newLevel: number }> {
    try {
      if (!userId) {
        return { xpGained: 0, leveledUp: false, newLevel: 1 };
      }

      const progress = await this.loadUserProgress(userId);
      const oldLevel = progress.level;

      // 1. XP BASE por quiz completado
      let xpGained = this.XP_PER_QUIZ;

      // 2. XP por respostas corretas
      xpGained += correctAnswers * this.XP_PER_CORRECT_ANSWER;

      // 3. BÔNUS por score perfeito
      if (correctAnswers === totalQuestions) {
        xpGained += this.XP_BONUS_PERFECT_SCORE;
        console.log('🌟 BÔNUS DE SCORE PERFEITO: +' + this.XP_BONUS_PERFECT_SCORE + ' XP');
      }

      // 4. Atualizar streak
      const today = this.getTodayString();
      const yesterday = this.getYesterdayString();
      
      if (progress.lastActivityDate === today) {
        // Já estudou hoje - mantém streak
      } else if (progress.lastActivityDate === yesterday) {
        // Estudou ontem - incrementa streak
        progress.streak++;
        
        // BÔNUS por streak
        if (progress.streak === 3) {
          xpGained += this.XP_BONUS_STREAK_3_DAYS;
          console.log('🔥 BÔNUS DE 3 DIAS CONSECUTIVOS: +' + this.XP_BONUS_STREAK_3_DAYS + ' XP');
        } else if (progress.streak === 7) {
          xpGained += this.XP_BONUS_STREAK_7_DAYS;
          console.log('🔥 BÔNUS DE 7 DIAS CONSECUTIVOS: +' + this.XP_BONUS_STREAK_7_DAYS + ' XP');
        } else if (progress.streak === 30) {
          xpGained += this.XP_BONUS_STREAK_30_DAYS;
          console.log('🔥 BÔNUS DE 30 DIAS CONSECUTIVOS: +' + this.XP_BONUS_STREAK_30_DAYS + ' XP');
        }
      } else {
        // Quebrou o streak - reinicia
        progress.streak = 1;
      }

      // 5. Atualizar progresso
      progress.xp += xpGained;
      progress.level = this.calculateLevel(progress.xp);
      progress.lastActivityDate = today;
      progress.totalQuizzes++;
      progress.totalQuestions += totalQuestions;
      progress.correctAnswers += correctAnswers;
      progress.studyTimeMinutes += Math.round(timeSpent / 60);
      progress.updatedAt = new Date();

      // 6. Salvar no Firestore
      await this.saveProgress(progress);

      const leveledUp = progress.level > oldLevel;

      console.log('✨ XP GANHO:', {
        xpGained,
        totalXP: progress.xp,
        level: progress.level,
        leveledUp,
        streak: progress.streak
      });

      return {
        xpGained,
        leveledUp,
        newLevel: progress.level
      };

    } catch (error) {
      console.error('❌ Erro ao adicionar XP:', error);
      return { xpGained: 0, leveledUp: false, newLevel: 1 };
    }
  }

  // ===============================================
  // 📊 CALCULAR LEVEL BASEADO EM XP
  // ===============================================

  private calculateLevel(xp: number): number {
    for (let i = this.LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (xp >= this.LEVEL_XP_REQUIREMENTS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // ===============================================
  // 📈 OBTER INFORMAÇÕES DO LEVEL ATUAL
  // ===============================================

  getLevelInfo(xp: number): LevelInfo {
    const currentLevel = this.calculateLevel(xp);
    const xpForCurrentLevel = this.LEVEL_XP_REQUIREMENTS[currentLevel - 1] || 0;
    const xpForNextLevel = this.LEVEL_XP_REQUIREMENTS[currentLevel] || this.LEVEL_XP_REQUIREMENTS[this.LEVEL_XP_REQUIREMENTS.length - 1];
    const xpToNextLevel = xpForNextLevel - xp;
    const progressPercentage = Math.round(((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100);

    return {
    levelName: this.getLevelName(currentLevel),
    currentLevel,
    currentXP: xp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    progressPercentage: Math.min(100, Math.max(0, progressPercentage))
};
  }

  // ===============================================
  // 💾 SALVAR PROGRESSO
  // ===============================================

  private async saveProgress(progress: UserProgress): Promise<void> {
    try {
      const progressRef = doc(this.firestore, `users/${progress.userId}/progress/stats`);
      
      await setDoc(progressRef, {
        ...progress,
        createdAt: Timestamp.fromDate(progress.createdAt),
        updatedAt: Timestamp.fromDate(progress.updatedAt)
      }, { merge: true });

      this.progressSubject.next(progress);
      console.log('💾 Progresso salvo');
    } catch (error) {
      console.error('❌ Erro ao salvar progresso:', error);
    }
  }

  // ===============================================
  // 🛠️ MÉTODOS AUXILIARES
  // ===============================================

  private getDefaultProgress(userId: string): UserProgress {
    return {
      userId,
      xp: 0,
      level: 1,
      streak: 0,
      lastActivityDate: this.getTodayString(),
      totalQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      studyTimeMinutes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }

  // Obter progresso atual do cache
  getCurrentProgress(): UserProgress | null {
    return this.progressSubject.value;
  }

  // Obter nome do level
  getLevelName(level: number): string {
    const names = [
      'Iniciante', 'Aprendiz', 'Estudante', 'Dedicado', 'Experiente',
      'Profissional', 'Expert', 'Mestre', 'Sábio', 'Lendário',
      'Mestre Supremo', 'Gênio', 'Prodígio', 'Virtuoso', 'Iluminado', 'Divino'
    ];
    return names[level - 1] || 'Lendário';
  }
}
