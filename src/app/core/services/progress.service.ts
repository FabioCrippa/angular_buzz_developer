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
  private STORAGE_KEY = 'userProgressHistory';

  // Carrega o histórico de respostas do usuário
  getHistory(): UserAnswer[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Salva o histórico de respostas
  private saveHistory(history: UserAnswer[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
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
    localStorage.removeItem(this.STORAGE_KEY);
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

    console.log('📅 Datas únicas para streak:', uniqueDates);

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
      console.log('✅ Estudou hoje! Streak iniciado em 1');
    }
    
    // Se não estudou hoje, verifica se estudou ontem (grace period)
    if (!foundToday) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      if (uniqueDates.includes(yesterdayStr)) {
        streak = 1;
        currentCheckDate = yesterday;
        console.log('⏰ Não estudou hoje, mas estudou ontem. Streak = 1');
      } else {
        console.log('❌ Não estudou hoje nem ontem. Streak = 0');
        streak = 0;
      }
    }
    
    // ✅ Conta dias consecutivos para trás a partir do último dia válido
    if (streak > 0) {
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDay = new Date(currentCheckDate);
        prevDay.setDate(currentCheckDate.getDate() - 1);
        const prevDayStr = prevDay.toISOString().slice(0, 10);
        
        console.log(`🔍 Verificando dia anterior: ${prevDayStr}`);
        
        if (uniqueDates.includes(prevDayStr)) {
          streak++;
          currentCheckDate = prevDay;
          console.log(`✅ Encontrou ${prevDayStr}! Streak agora: ${streak}`);
        } else {
          console.log(`❌ Não encontrou ${prevDayStr}. Parando streak em: ${streak}`);
          break;
        }
      }
    }

    console.log(`🔥 STREAK FINAL: ${streak} dias consecutivos`);

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
}
