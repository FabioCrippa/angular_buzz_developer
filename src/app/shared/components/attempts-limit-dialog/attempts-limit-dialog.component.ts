// ===============================================
// 🔒 ANONYMOUS ATTEMPTS LIMIT DIALOG
// ===============================================

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TrialAnalyticsService } from '../../../core/services/trial-analytics.service';

export interface AttemptsLimitDialogData {
  remaining: number;
  resetAt: number;
  totalAttempts: number;
  deviceId?: string;
  userIp?: string;
}

@Component({
  selector: 'app-attempts-limit-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>🔒 Limite de Tentativas Atingido!</h2>
      </div>

      <div class="dialog-content">
        <div class="limit-icon">
          ⏰
        </div>

        <p class="main-message">
          Você usou suas {{ data.totalAttempts }} tentativas gratuitas de hoje!
        </p>

        <div class="reset-info">
          <p><strong>Próximas tentativas em:</strong></p>
          <p class="reset-time">{{ getResetTime() }}</p>
        </div>

        <div class="benefits-section">
          <h3>💎 Deseja Continuar Agora?</h3>
          <div class="upgrade-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">🚀</span>
              <span class="benefit-text">Tentativas Ilimitadas</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📚</span>
              <span class="benefit-text">2.500+ Questões Premium</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📊</span>
              <span class="benefit-text">Relatórios Detalhados</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">⭐</span>
              <span class="benefit-text">Favoritos Ilimitados</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary" (click)="onBackClick()">
          🏠 Voltar para Home
        </button>
        <button class="btn btn-primary" (click)="onUpgradeClick()">
          👑 Upgrade por R$ 39,90/mês
        </button>
      </div>

      <div class="trial-info">
        <p>💳 7 dias de teste grátis. Cancele a qualquer momento.</p>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 500px;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .dialog-header {
      background: rgba(0, 0, 0, 0.1);
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .dialog-header h2 {
      margin: 0;
      color: white;
      font-size: 20px;
      font-weight: 600;
      text-align: center;
    }

    .dialog-content {
      padding: 32px 24px;
      background: white;
    }

    .limit-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 16px;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .main-message {
      text-align: center;
      font-size: 16px;
      color: #333;
      margin: 16px 0;
      font-weight: 500;
    }

    .reset-info {
      background: #f5f5f5;
      border-left: 4px solid #667eea;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: center;
    }

    .reset-info p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }

    .reset-time {
      font-size: 18px;
      font-weight: 600;
      color: #667eea !important;
    }

    .benefits-section {
      margin: 24px 0;
    }

    .benefits-section h3 {
      text-align: center;
      color: #333;
      margin-bottom: 16px;
      font-size: 16px;
    }

    .upgrade-benefits {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .benefit-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #eee;
    }

    .benefit-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .benefit-text {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }

    .dialog-actions {
      padding: 24px;
      background: #f5f5f5;
      display: flex;
      gap: 12px;
      flex-direction: column;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-secondary:hover {
      background: #f5f5f5;
    }

    .trial-info {
      text-align: center;
      padding-bottom: 16px;
      font-size: 12px;
      color: #999;
    }

    .trial-info p {
      margin: 0;
    }

    @media (max-width: 480px) {
      .dialog-container {
        max-width: 100%;
        border-radius: 12px;
      }

      .dialog-content {
        padding: 24px 16px;
      }

      .upgrade-benefits {
        grid-template-columns: 1fr;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }
    }
  `]
})
export class AttemptsLimitDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AttemptsLimitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttemptsLimitDialogData,
    private router: Router,
    private analyticsService: TrialAnalyticsService
  ) {}

  getResetTime(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const hours = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  onBackClick(): void {
    // ✅ LOG ANALYTICS - USUÁRIO VOLTOU PARA HOME
    if (this.data.deviceId && this.data.userIp) {
      this.analyticsService.logEvent(
        'paywall_action',
        this.data.deviceId,
        this.data.userIp,
        {
          action: 'home_clicked',
          remainingAttempts: this.data.remaining
        }
      );
    }

    this.dialogRef.close();
    this.router.navigate(['/home']);
  }

  onUpgradeClick(): void {
    // ✅ LOG ANALYTICS - USUÁRIO CLICOU EM UPGRADE
    if (this.data.deviceId && this.data.userIp) {
      this.analyticsService.logEvent(
        'upgrade_clicked',
        this.data.deviceId,
        this.data.userIp,
        {
          action: 'upgrade_clicked',
          remainingAttempts: this.data.remaining
        }
      );
    }

    this.dialogRef.close();
    this.router.navigate(['/upgrade']);
  }
}
