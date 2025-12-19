// ===============================================
// 📊 QUIZ-HISTORY.SERVICE.TS - HISTÓRICO DE QUIZZES NO FIRESTORE
// ===============================================

import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, where, Timestamp, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

// ===============================================
// 📝 INTERFACES
// ===============================================

export interface QuizResult {
  id: string;
  userId: string;
  area: string;
  subject?: string;
  mode: 'single' | 'area' | 'subject' | 'mixed' | 'custom';
  totalQuestions: number;
  correctAnswers: number;
  score: number; // 0-100
  timeSpent: number; // segundos
  completedAt: Date;
  isPremium: boolean;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  questionId: number;
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  timeSpent: number; // segundos
}

export interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number; // minutos
  bestScore: number;
  worstScore: number;
  byArea: { [area: string]: AreaStats };
  recentActivity: QuizResult[];
}

export interface AreaStats {
  quizzesTaken: number;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  lastAttempt: Date;
}

// ===============================================
// 💎 QUIZ HISTORY SERVICE
// ===============================================

@Injectable({
  providedIn: 'root'
})
export class QuizHistoryService {

  private statsSubject = new BehaviorSubject<QuizStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  constructor(private firestore: Firestore) {}

  // ===============================================
  // 💾 SALVAR RESULTADO DO QUIZ
  // ===============================================

  async saveQuizResult(result: QuizResult): Promise<boolean> {
    try {
      if (!result.userId) {
        console.warn('⚠️ UserID não fornecido para salvar histórico');
        return false;
      }

      const quizId = result.id || `quiz_${Date.now()}_${result.area}`;
      const quizRef = doc(this.firestore, `users/${result.userId}/quizHistory/${quizId}`);

      const quizData = {
        ...result,
        id: quizId,
        completedAt: Timestamp.fromDate(result.completedAt)
      };

      await setDoc(quizRef, quizData);

      console.log(`✅ Quiz salvo no histórico: ${quizId}`);
      console.log(`📊 Score: ${result.score}% | Corretas: ${result.correctAnswers}/${result.totalQuestions}`);

      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar histórico do quiz:', error);
      return false;
    }
  }

  // ===============================================
  // 📋 BUSCAR HISTÓRICO COMPLETO
  // ===============================================

  async getQuizHistory(userId: string, limitCount: number = 50): Promise<QuizResult[]> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido para buscar histórico');
        return [];
      }

      const historyRef = collection(this.firestore, `users/${userId}/quizHistory`);
      const q = query(historyRef, orderBy('completedAt', 'desc'), limit(limitCount));
      
      const snapshot = await getDocs(q);
      
      const history: QuizResult[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: data['id'],
          userId: data['userId'],
          area: data['area'],
          subject: data['subject'],
          mode: data['mode'],
          totalQuestions: data['totalQuestions'],
          correctAnswers: data['correctAnswers'],
          score: data['score'],
          timeSpent: data['timeSpent'],
          completedAt: data['completedAt']?.toDate() || new Date(),
          isPremium: data['isPremium'],
          answers: data['answers'] || []
        });
      });

      console.log(`📋 Histórico carregado: ${history.length} quizzes`);
      return history;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return [];
    }
  }

  // ===============================================
  // 📊 CALCULAR ESTATÍSTICAS
  // ===============================================

  async calculateStats(userId: string): Promise<QuizStats> {
    try {
      if (!userId) {
        return this.getEmptyStats();
      }

      const history = await this.getQuizHistory(userId, 100); // Últimos 100 quizzes

      if (history.length === 0) {
        return this.getEmptyStats();
      }

      // Calcular estatísticas gerais
      const totalQuizzes = history.length;
      const totalQuestions = history.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
      const correctAnswers = history.reduce((sum, quiz) => sum + quiz.correctAnswers, 0);
      const averageScore = history.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuizzes;
      const totalTimeSpent = Math.round(history.reduce((sum, quiz) => sum + quiz.timeSpent, 0) / 60); // minutos
      const bestScore = Math.max(...history.map(quiz => quiz.score));
      const worstScore = Math.min(...history.map(quiz => quiz.score));

      // Calcular estatísticas por área
      const byArea: { [area: string]: AreaStats } = {};
      
      history.forEach(quiz => {
        if (!byArea[quiz.area]) {
          byArea[quiz.area] = {
            quizzesTaken: 0,
            averageScore: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            lastAttempt: quiz.completedAt
          };
        }

        const areaStats = byArea[quiz.area];
        areaStats.quizzesTaken++;
        areaStats.totalQuestions += quiz.totalQuestions;
        areaStats.correctAnswers += quiz.correctAnswers;
        
        if (quiz.completedAt > areaStats.lastAttempt) {
          areaStats.lastAttempt = quiz.completedAt;
        }
      });

      // Calcular média por área
      Object.keys(byArea).forEach(area => {
        const areaQuizzes = history.filter(q => q.area === area);
        byArea[area].averageScore = areaQuizzes.reduce((sum, q) => sum + q.score, 0) / areaQuizzes.length;
      });

      // Atividade recente (últimos 10)
      const recentActivity = history.slice(0, 10);

      const stats: QuizStats = {
        totalQuizzes,
        totalQuestions,
        correctAnswers,
        averageScore: Math.round(averageScore),
        totalTimeSpent,
        bestScore,
        worstScore,
        byArea,
        recentActivity
      };

      this.statsSubject.next(stats);
      console.log('📊 Estatísticas calculadas:', stats);

      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return this.getEmptyStats();
    }
  }

  // ===============================================
  // 📈 BUSCAR HISTÓRICO POR ÁREA
  // ===============================================

  async getHistoryByArea(userId: string, area: string, limitCount: number = 20): Promise<QuizResult[]> {
    try {
      if (!userId) {
        return [];
      }

      const historyRef = collection(this.firestore, `users/${userId}/quizHistory`);
      const q = query(
        historyRef,
        where('area', '==', area),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      const history: QuizResult[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: data['id'],
          userId: data['userId'],
          area: data['area'],
          subject: data['subject'],
          mode: data['mode'],
          totalQuestions: data['totalQuestions'],
          correctAnswers: data['correctAnswers'],
          score: data['score'],
          timeSpent: data['timeSpent'],
          completedAt: data['completedAt']?.toDate() || new Date(),
          isPremium: data['isPremium'],
          answers: data['answers'] || []
        });
      });

      console.log(`📋 Histórico de ${area}: ${history.length} quizzes`);
      return history;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico por área:', error);
      return [];
    }
  }

  // ===============================================
  // 🏆 BUSCAR MELHORES SCORES
  // ===============================================

  async getTopScores(userId: string, limitCount: number = 10): Promise<QuizResult[]> {
    try {
      if (!userId) {
        return [];
      }

      const history = await this.getQuizHistory(userId, 100);
      
      // Ordenar por score (maior primeiro)
      const topScores = history
        .sort((a, b) => b.score - a.score)
        .slice(0, limitCount);

      console.log(`🏆 Top ${limitCount} scores obtidos`);
      return topScores;
    } catch (error) {
      console.error('❌ Erro ao buscar top scores:', error);
      return [];
    }
  }

  // ===============================================
  // 📅 BUSCAR HISTÓRICO POR PERÍODO
  // ===============================================

  async getHistoryByDateRange(userId: string, startDate: Date, endDate: Date): Promise<QuizResult[]> {
    try {
      if (!userId) {
        return [];
      }

      const historyRef = collection(this.firestore, `users/${userId}/quizHistory`);
      const q = query(
        historyRef,
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('completedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const history: QuizResult[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: data['id'],
          userId: data['userId'],
          area: data['area'],
          subject: data['subject'],
          mode: data['mode'],
          totalQuestions: data['totalQuestions'],
          correctAnswers: data['correctAnswers'],
          score: data['score'],
          timeSpent: data['timeSpent'],
          completedAt: data['completedAt']?.toDate() || new Date(),
          isPremium: data['isPremium'],
          answers: data['answers'] || []
        });
      });

      console.log(`📅 Histórico do período: ${history.length} quizzes`);
      return history;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico por período:', error);
      return [];
    }
  }

  // ===============================================
  // 🧹 LIMPAR HISTÓRICO (CUIDADO!)
  // ===============================================

  async clearHistory(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        return false;
      }

      const historyRef = collection(this.firestore, `users/${userId}/quizHistory`);
      const snapshot = await getDocs(historyRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      this.statsSubject.next(this.getEmptyStats());
      console.log('🧹 Histórico limpo');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar histórico:', error);
      return false;
    }
  }

  // ===============================================
  // 🛠️ MÉTODOS AUXILIARES
  // ===============================================

  private getEmptyStats(): QuizStats {
    return {
      totalQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      bestScore: 0,
      worstScore: 0,
      byArea: {},
      recentActivity: []
    };
  }

  // Obter estatísticas atuais do cache
  getCurrentStats(): QuizStats | null {
    return this.statsSubject.value;
  }
  
  // ✅ BUSCAR QUIZZES RECENTES
  async getRecentQuizzes(userId: string, limitCount: number = 5): Promise<QuizResult[]> {
    return this.getQuizHistory(userId, limitCount);
  }

  // Formatar tempo em formato legível
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}
