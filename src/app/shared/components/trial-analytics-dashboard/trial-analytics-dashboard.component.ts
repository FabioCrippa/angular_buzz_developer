// ===============================================
// 📊 TRIAL ANALYTICS DASHBOARD COMPONENT
// ===============================================

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface TrialStats {
  totalSessions: number;
  totalQuizzesStarted: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalLimitsReached: number;
  totalUpgradesClicked: number;
  conversionRate: number;
  avgTimePerSession: number;
  totalTimeSpent: number;
  date: string;
}

interface ConversionFunnel {
  step1_quizzesStarted: number;
  step2_limitsReached: number;
  step3_upgradesClicked: number;
  conversionRate_step1_to_step2: number;
  conversionRate_step2_to_step3: number;
  conversionRate_overall: number;
  date: string;
}

@Component({
  selector: 'app-trial-analytics-dashboard',
  template: `
    <div class="analytics-container">
      <div class="header">
        <h1>📊 Trial Analytics Dashboard</h1>
        <p class="date-info">{{ selectedDate }}</p>
      </div>

      <div class="date-selector">
        <input type="date" [(ngModel)]="selectedDate" (change)="loadData()">
      </div>

      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total Sessions</div>
            <div class="stat-value">{{ stats.totalSessions }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-label">Quizzes Started</div>
            <div class="stat-value">{{ stats.totalQuizzesStarted }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">❓</div>
          <div class="stat-content">
            <div class="stat-label">Questions Answered</div>
            <div class="stat-value">{{ stats.totalQuestionsAnswered }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">Correct Answers</div>
            <div class="stat-value">{{ stats.totalCorrectAnswers }} ({{ ((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100 | number:'1.1-1') }}%)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-label">Avg Time/Session</div>
            <div class="stat-value">{{ stats.avgTimePerSession }}s</div>
          </div>
        </div>

        <div class="stat-card highlight">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Conversion Rate</div>
            <div class="stat-value">{{ stats.conversionRate }}%</div>
          </div>
        </div>
      </div>

      <div class="funnel-section" *ngIf="funnel">
        <h2>🔄 Conversion Funnel</h2>
        <div class="funnel-chart">
          <div class="funnel-step">
            <div class="step-header">Step 1: Quiz Started</div>
            <div class="step-bar" [style.width.%]="100">
              <span class="step-count">{{ funnel.step1_quizzesStarted }}</span>
            </div>
          </div>

          <div class="funnel-step">
            <div class="step-header">Step 2: Attempts Limit Reached</div>
            <div class="step-bar" [style.width.%]="(funnel.step2_limitsReached / funnel.step1_quizzesStarted) * 100">
              <span class="step-count">{{ funnel.step2_limitsReached }}</span>
            </div>
            <div class="conversion-rate">{{ funnel.conversionRate_step1_to_step2 }}% converted</div>
          </div>

          <div class="funnel-step">
            <div class="step-header">Step 3: Upgrade Clicked</div>
            <div class="step-bar" [style.width.%]="(funnel.step3_upgradesClicked / funnel.step1_quizzesStarted) * 100">
              <span class="step-count">{{ funnel.step3_upgradesClicked }}</span>
            </div>
            <div class="conversion-rate">{{ funnel.conversionRate_overall }}% overall conversion</div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>⏳ Loading analytics...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>❌ {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 32px;
      color: #333;
    }

    .date-info {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .date-selector {
      margin-bottom: 24px;
      text-align: center;
    }

    .date-selector input {
      padding: 8px 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .stat-card.highlight {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }

    .stat-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
    }

    .funnel-section {
      background: white;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 24px;
    }

    .funnel-section h2 {
      margin: 0 0 24px 0;
      font-size: 20px;
      color: #333;
    }

    .funnel-chart {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .funnel-step {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .step-header {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .step-bar {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      min-width: 100px;
      transition: width 0.3s ease;
    }

    .step-count {
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    .conversion-rate {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .loading, .error {
      text-align: center;
      padding: 32px;
      font-size: 16px;
      color: #666;
    }

    .error {
      color: #e74c3c;
      background: #faddd1;
      border-radius: 8px;
      padding: 24px;
    }

    @media (max-width: 768px) {
      .analytics-container {
        padding: 16px;
      }

      .header h1 {
        font-size: 24px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TrialAnalyticsDashboardComponent implements OnInit {
  stats: TrialStats | null = null;
  funnel: ConversionFunnel | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];
  loading = false;
  error: string | null = null;

  private apiUrl = environment.production
    ? 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/api'
    : 'http://localhost:5001/angular-buzz-developer/southamerica-east1/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    const params = `?date=${this.selectedDate}`;

    Promise.all([
      this.http.get<TrialStats>(`${this.apiUrl}/v1/analytics/trial-stats${params}`).toPromise(),
      this.http.get<ConversionFunnel>(`${this.apiUrl}/v1/analytics/conversion-funnel${params}`).toPromise()
    ]).then(([statsRes, funnelRes]) => {
      if (statsRes) this.stats = statsRes;
      if (funnelRes) this.funnel = funnelRes;
      this.loading = false;
    }).catch((error) => {
      console.error('Erro ao carregar analytics:', error);
      this.error = 'Erro ao carregar dados de analytics. Tente novamente.';
      this.loading = false;
    });
  }
}
