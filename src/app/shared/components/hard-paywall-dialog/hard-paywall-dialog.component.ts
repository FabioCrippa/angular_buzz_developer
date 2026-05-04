import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

export interface HardPaywallData {
  daysElapsed: number;
  nextResetTime: string; // Próximo reset (meia-noite)
  maxAttemptsToday: number;
  usedAttempts: number;
}

@Component({
  selector: 'app-hard-paywall-dialog',
  templateUrl: './hard-paywall-dialog.component.html',
  styleUrls: ['./hard-paywall-dialog.component.css']
})
export class HardPaywallDialogComponent implements OnInit {
  daysElapsed: number = 0;
  nextResetTime: string = '';
  maxAttemptsToday: number = 3;
  usedAttempts: number = 3;
  timeUntilReset: string = ''; // Formatado: "12h 34m"

  // ✅ PREMIUM FEATURES
  premiumFeatures = [
    { icon: '🔓', text: 'Acesso Ilimitado a Quizzes' },
    { icon: '📚', text: '3000+ Questões Curadas' },
    { icon: '📊', text: 'Análise Avançada de Progresso' },
    { icon: '🏆', text: 'Certificados Profissionais' },
    { icon: '🎯', text: 'Simulados Realistas de Entrevista' },
    { icon: '💡', text: 'Dicas Personalizadas por Fraqueza' }
  ];

  constructor(
    public dialogRef: MatDialogRef<HardPaywallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HardPaywallData,
    private router: Router
  ) {
    if (data) {
      this.daysElapsed = data.daysElapsed;
      this.nextResetTime = data.nextResetTime;
      this.maxAttemptsToday = data.maxAttemptsToday;
      this.usedAttempts = data.usedAttempts;
    }
  }

  ngOnInit(): void {
    this.calculateTimeUntilReset();
  }

  // ✅ CALCULAR TEMPO ATÉ RESET
  calculateTimeUntilReset(): void {
    if (!this.nextResetTime) {
      this.timeUntilReset = 'calculando...';
      return;
    }

    const resetDate = new Date(this.nextResetTime);
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();

    if (diff <= 0) {
      this.timeUntilReset = 'agora';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    this.timeUntilReset = `${hours}h ${minutes}m`;
  }

  // ✅ FAZER UPGRADE
  upgradeNow(): void {
    localStorage.setItem('paywall_source', 'hard_paywall');
    this.dialogRef.close('upgrade');
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'hard-paywall',
        reason: 'attempts-exhausted'
      }
    });
  }

  // ✅ VOLTAR AMANHÃ
  comeBackTomorrow(): void {
    localStorage.setItem('paywall_dismissed_at', new Date().toISOString());
    this.dialogRef.close('dismiss');
  }

  // ✅ OBTER MENSAGEM DE TENTATIVAS
  getAttemptsMessage(): string {
    return `Você usou ${this.usedAttempts}/${this.maxAttemptsToday} tentativas de hoje`;
  }

  // ✅ OBTER PERCENTUAL DE USO
  getUsagePercentage(): number {
    return (this.usedAttempts / this.maxAttemptsToday) * 100;
  }
}
