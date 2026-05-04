// ===============================================
// 📊 TRIAL ANALYTICS SERVICE
// ===============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

export interface TrialEvent {
  deviceId: string;
  userIp: string;
  eventType: 'quiz_started' | 'answer_selected' | 'attempts_limit_reached' | 'streak_limit_reached' | 'paywall_shown' | 'paywall_action' | 'upgrade_clicked' | 'home_clicked' | 'quiz_completed';
  timestamp: Timestamp;
  data?: {
    questionNumber?: number;
    totalQuestions?: number;
    score?: number;
    correctAnswers?: number;
    timeSpent?: number;
    area?: string;
    category?: string;
    remainingAttempts?: number;
    action?: string;
    streakDays?: number;
  };
}

export interface TrialSessionData {
  deviceId: string;
  userIp: string;
  sessionStarted: Timestamp;
  sessionEnded?: Timestamp;
  quizzesStarted: number;
  questionsAnswered: number;
  correctAnswers: number;
  limitsReached: number;
  upgradesClicked: number;
  totalTimeSpent: number; // em segundos
  conversionFlag: boolean; // true se fez upgrade
  lastActivity: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class TrialAnalyticsService {
  private apiUrl = environment.production
    ? 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/api'
    : 'http://localhost:5001/angular-buzz-developer/southamerica-east1/api';

  constructor(
    private firestore: Firestore,
    private http: HttpClient
  ) {}

  // ✅ REGISTRAR EVENTO
  async logEvent(
    eventType: TrialEvent['eventType'],
    deviceId: string,
    userIp: string,
    data?: TrialEvent['data']
  ): Promise<void> {
    try {
      const event: TrialEvent = {
        deviceId,
        userIp,
        eventType,
        timestamp: Timestamp.now(),
        data
      };

      const eventsRef = collection(this.firestore, 'analytics_events');
      await addDoc(eventsRef, event);

      // ✅ ATUALIZAR SESSÃO DO USUÁRIO
      await this.updateSessionData(deviceId, userIp, eventType, data);
    } catch (error) {
      console.error('Erro ao registrar evento de analytics:', error);
    }
  }

  // ✅ ATUALIZAR DADOS DA SESSÃO
  private async updateSessionData(
    deviceId: string,
    userIp: string,
    eventType: TrialEvent['eventType'],
    data?: TrialEvent['data']
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const timestamp = Timestamp.now();

      // Buscar ou criar sessão
      const q = query(
        collection(this.firestore, 'analytics_sessions'),
        where('deviceId', '==', deviceId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Criar nova sessão
        await addDoc(
          collection(this.firestore, 'analytics_sessions'),
          {
            deviceId,
            userIp,
            sessionStarted: timestamp,
            quizzesStarted: eventType === 'quiz_started' ? 1 : 0,
            questionsAnswered: eventType === 'answer_selected' ? 1 : 0,
            correctAnswers: data?.correctAnswers ? 1 : 0,
            limitsReached: eventType === 'attempts_limit_reached' ? 1 : 0,
            upgradesClicked: eventType === 'upgrade_clicked' ? 1 : 0,
            totalTimeSpent: data?.timeSpent || 0,
            conversionFlag: eventType === 'upgrade_clicked',
            lastActivity: timestamp,
            date: today
          } as any
        );
      } else {
        // Atualizar sessão existente
        const sessionDoc = querySnapshot.docs[0];
        const sessionData = sessionDoc.data() as any;

        const updates: any = {
          lastActivity: timestamp
        };

        if (eventType === 'quiz_started') {
          updates.quizzesStarted = (sessionData.quizzesStarted || 0) + 1;
        }

        if (eventType === 'answer_selected') {
          updates.questionsAnswered = (sessionData.questionsAnswered || 0) + 1;
          if (data?.correctAnswers) {
            updates.correctAnswers = (sessionData.correctAnswers || 0) + 1;
          }
        }

        if (eventType === 'attempts_limit_reached') {
          updates.limitsReached = (sessionData.limitsReached || 0) + 1;
        }

        if (eventType === 'upgrade_clicked') {
          updates.upgradesClicked = (sessionData.upgradesClicked || 0) + 1;
          updates.conversionFlag = true;
        }

        if (data?.timeSpent) {
          updates.totalTimeSpent = (sessionData.totalTimeSpent || 0) + data.timeSpent;
        }

        await updateDoc(sessionDoc.ref, updates);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados da sessão:', error);
    }
  }

  // ✅ OBTER ESTATÍSTICAS DO DIA
  async getDayStats(date: string = new Date().toISOString().split('T')[0]): Promise<any> {
    try {
      const q = query(
        collection(this.firestore, 'analytics_sessions'),
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(q);

      let stats = {
        totalSessions: querySnapshot.size,
        totalQuizzesStarted: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalLimitsReached: 0,
        totalUpgradesClicked: 0,
        conversionRate: 0,
        avgTimePerSession: 0,
        totalTimeSpent: 0
      };

      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        stats.totalQuizzesStarted += data.quizzesStarted || 0;
        stats.totalQuestionsAnswered += data.questionsAnswered || 0;
        stats.totalCorrectAnswers += data.correctAnswers || 0;
        stats.totalLimitsReached += data.limitsReached || 0;
        stats.totalUpgradesClicked += data.upgradesClicked || 0;
        stats.totalTimeSpent += data.totalTimeSpent || 0;
      });

      stats.conversionRate = querySnapshot.size > 0
        ? Math.round((stats.totalUpgradesClicked / stats.totalSessions) * 100)
        : 0;

      stats.avgTimePerSession = querySnapshot.size > 0
        ? Math.round(stats.totalTimeSpent / querySnapshot.size)
        : 0;

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas do dia:', error);
      return null;
    }
  }

  // ✅ OBTER FUNNEL DE CONVERSÃO
  async getConversionFunnel(date: string = new Date().toISOString().split('T')[0]): Promise<any> {
    try {
      const stats = await this.getDayStats(date);

      if (!stats) return null;

      return {
        step1_quizzesStarted: stats.totalQuizzesStarted,
        step2_limitsReached: stats.totalLimitsReached,
        step3_upgradesClicked: stats.totalUpgradesClicked,
        conversionRate_step1_to_step2: stats.totalQuizzesStarted > 0
          ? Math.round((stats.totalLimitsReached / stats.totalQuizzesStarted) * 100)
          : 0,
        conversionRate_step2_to_step3: stats.totalLimitsReached > 0
          ? Math.round((stats.totalUpgradesClicked / stats.totalLimitsReached) * 100)
          : 0,
        conversionRate_overall: Math.round((stats.totalUpgradesClicked / stats.totalQuizzesStarted) * 100)
      };
    } catch (error) {
      console.error('Erro ao obter funnel de conversão:', error);
      return null;
    }
  }

  // ✅ ENVIAR DADOS AGREGADOS PARA BACKEND (OPCIONAL)
  async sendAnalyticsToBackend(date: string = new Date().toISOString().split('T')[0]): Promise<any> {
    try {
      const stats = await this.getDayStats(date);
      const funnel = await this.getConversionFunnel(date);

      const payload = {
        date,
        stats,
        funnel,
        timestamp: new Date().toISOString()
      };

      const response = await this.http.post(
        `${this.apiUrl}/v1/analytics/trial-summary`,
        payload
      ).toPromise();

      console.log('📊 Dados de analytics enviados ao backend:', response);
      return response;
    } catch (error) {
      console.error('Erro ao enviar analytics para backend:', error);
      return null;
    }
  }

  // ✅ OBTER ÚLTIMOS N EVENTOS
  async getRecentEvents(limit: number = 100): Promise<TrialEvent[]> {
    try {
      const eventsRef = collection(this.firestore, 'analytics_events');
      const q = query(eventsRef);

      const querySnapshot = await getDocs(q);
      const events: TrialEvent[] = [];

      querySnapshot.docs.forEach(doc => {
        events.push(doc.data() as TrialEvent);
      });

      // Ordenar por timestamp descendente e pegar últimos N
      return events
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao obter eventos recentes:', error);
      return [];
    }
  }
}
