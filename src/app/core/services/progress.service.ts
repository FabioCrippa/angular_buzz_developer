import { Injectable } from '@angular/core';

export interface UserAnswer {
  area: string;
  questionId: number;
  correct: boolean;
  timeSpent: number; // segundos
  date: string; // ISO string
  subarea?: string; // opcional para uso futuro
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private STORAGE_KEY_PREFIX = 'userProgressHistory';

  // ✅ OBTER CHAVE ESPECÍFICA DO USUÁRIO
  private getStorageKey(): string {
    // Firebase user
    const user = localStorage.getItem('sowlfy_user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const userId = userData.uid || userData.id;
        if (userId) return `${this.STORAGE_KEY_PREFIX}_${userId}`;
      } catch (e) {
        console.error('Erro ao parsear dados do usuário:', e);
      }
    }
    // Teacher profile
    const teacherRaw = localStorage.getItem('teacher_data');
    if (teacherRaw) {
      try {
        const teacher = JSON.parse(teacherRaw);
        const tid = teacher.id || teacher.email;
        if (tid) return `${this.STORAGE_KEY_PREFIX}_teacher_${tid}`;
      } catch { /* ignore */ }
    }
    // Student profile
    const studentRaw = localStorage.getItem('student_data');
    if (studentRaw) {
      try {
        const student = JSON.parse(studentRaw);
        const sid = student.ra || student.id;
        if (sid) return `${this.STORAGE_KEY_PREFIX}_student_${sid}`;
      } catch { /* ignore */ }
    }
    return this.STORAGE_KEY_PREFIX; // Fallback genérico
  }

  // Carrega o histórico de respostas do usuário
  getHistory(): UserAnswer[] {
    const storageKey = this.getStorageKey();
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Salva o histórico de respostas
  private saveHistory(history: UserAnswer[]) {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(history));
  }

  // Adiciona uma nova resposta ao histórico (mantém só a última resposta por questão)
  addAnswer(answer: UserAnswer) {
    let history = this.getHistory();
    // Remove respostas antigas da mesma questão na mesma área
    history = history.filter(a => !(a.area === answer.area && a.questionId === answer.questionId));
    history.push(answer);
    this.saveHistory(history);
  }

  // Limpa todo o progresso
  clearProgress() {
    const storageKey = this.getStorageKey();
    localStorage.removeItem(storageKey);
  }

  // ✅ MÉTODO GETSSTATS CORRIGIDO
  getStats() {
    const history = this.getHistory();
    const totalCompleted = history.length;
    const totalCorrect = history.filter(a => a.correct).length;
    const totalTime = history.reduce((sum, a) => sum + (Number(a.timeSpent) || 0), 0);

    if (history.length === 0) {
      return {
        totalCompleted: 0,
        totalCorrect: 0,
        accuracy: 0,
        totalTime: 0,
        streak: 0,
        lastActivity: null
      };
    }

    // ✅ CÁLCULO CORRETO DO STREAK
    const uniqueDates = [...new Set(history.map(a => a.date.slice(0, 10)))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());


    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera horas para comparação correta
    
    // ✅ NOVO ALGORITMO: Mais tolerante e inteligente
    let currentCheckDate = new Date(today);
    let foundToday = false;
    
    // Verifica se estudou hoje
    const todayStr = today.toISOString().slice(0, 10);
    if (uniqueDates.includes(todayStr)) {
      foundToday = true;
      streak = 1;
    }
    
    // Se não estudou hoje, verifica se estudou ontem (grace period)
    if (!foundToday) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      if (uniqueDates.includes(yesterdayStr)) {
        streak = 1;
        currentCheckDate = yesterday;
      } else {
        streak = 0;
      }
    }
    
    // ✅ Conta dias consecutivos para trás a partir do último dia válido
    if (streak > 0) {
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDay = new Date(currentCheckDate);
        prevDay.setDate(currentCheckDate.getDate() - 1);
        const prevDayStr = prevDay.toISOString().slice(0, 10);
        
        
        if (uniqueDates.includes(prevDayStr)) {
          streak++;
          currentCheckDate = prevDay;
        } else {
          break;
        }
      }
    }


    const lastActivity = history.length > 0 
      ? history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
      : null;

    return {
      totalCompleted,
      totalCorrect,
      accuracy: totalCompleted ? Math.round((totalCorrect / totalCompleted) * 100) : 0,
      totalTime,
      streak,
      lastActivity
    };
  }

  // Estatísticas por área
  getAreaStats(area: string) {
    const history = this.getHistory().filter(a => a.area === area);
    const completed = history.length;
    const correct = history.filter(a => a.correct).length;
    const totalTime = history.reduce((sum, a) => sum + (Number(a.timeSpent) || 0), 0);
    const lastActivity = history.length > 0 ? history[history.length - 1].date : null;

    return {
      completed,
      correct,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      totalTime,
      lastActivity
    };
  }

  // Estatísticas por subárea (opcional)
  getSubareaStats(area: string, subarea: string) {
    const history = this.getHistory().filter(a => a.area === area && a.subarea === subarea);
    const completed = history.length;
    const correct = history.filter(a => a.correct).length;
    const totalTime = history.reduce((sum, a) => sum + (Number(a.timeSpent) || 0), 0);
    const lastActivity = history.length > 0 ? history[history.length - 1].date : null;

    return {
      completed,
      correct,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      totalTime,
      lastActivity
    };
  }

  // ── Revisão de Simulado ──────────────────────────────
  private getSimuladoReviewKey(simuladoId: string): string {
    const base = this.getStorageKey();
    return `${base}_simulado_review_${simuladoId}`;
  }

  saveSimuladoReview(simuladoId: string, result: any): void {
    try {
      const key = this.getSimuladoReviewKey(simuladoId);
      localStorage.setItem(key, JSON.stringify({ simuladoId, savedAt: new Date().toISOString(), result }));
    } catch (e) {
      console.error('Erro ao salvar revisão do simulado:', e);
    }
  }

  getSimuladoReview(simuladoId: string): { simuladoId: string; savedAt: string; result: any } | null {
    try {
      const key = this.getSimuladoReviewKey(simuladoId);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  hasSimuladoReview(simuladoId: string): boolean {
    return !!this.getSimuladoReview(simuladoId);
  }
}
