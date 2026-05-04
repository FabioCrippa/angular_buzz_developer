import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

export interface SoftUpgradeData {
  questionsResolved: number;
  daysElapsed: number;
  daysRemaining: number;
  triggerType: 'questions' | 'days'; // O que disparou o modal
}

@Component({
  selector: 'app-soft-upgrade-dialog',
  templateUrl: './soft-upgrade-dialog.component.html',
  styleUrls: ['./soft-upgrade-dialog.component.css']
})
export class SoftUpgradeDialogComponent implements OnInit {
  triggerType: 'questions' | 'days' = 'questions';
  questionsResolved: number = 0;
  daysElapsed: number = 0;
  daysRemaining: number = 0;

  // ✅ FEATURES COMPARAÇÃO
  features = [
    { name: 'Questões por dia', free: 'Até 7', premium: 'Ilimitadas' },
    { name: 'Total de questões', free: '1300+', premium: '3000+' },
    { name: 'Histórico completo', free: '❌', premium: '✅' },
    { name: 'Certificados', free: '❌', premium: '✅' },
    { name: 'Análise de progresso', free: '❌', premium: '✅' },
    { name: 'Simulados', free: '❌', premium: '✅' },
  ];

  constructor(
    public dialogRef: MatDialogRef<SoftUpgradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SoftUpgradeData,
    private router: Router
  ) {
    if (data) {
      this.questionsResolved = data.questionsResolved;
      this.daysElapsed = data.daysElapsed;
      this.daysRemaining = data.daysRemaining;
      this.triggerType = data.triggerType;
    }
  }

  ngOnInit(): void {
  }

  // ✅ CRIAR CONTA
  createAccount(): void {
    localStorage.setItem('signup_source', 'soft_upgrade');
    this.dialogRef.close('upgrade');
    this.router.navigate(['/'], { queryParams: { signup: true, referral: 'soft_offer' } });
  }

  // ✅ CONTINUAR TESTANDO (SNOOZE)
  snooze(): void {
    localStorage.setItem('soft_upgrade_snoozed_at', new Date().toISOString());
    this.dialogRef.close('snooze');
  }

  // ✅ FECHAR DIALOG
  close(): void {
    this.dialogRef.close('dismissed');
  }

  // ✅ UTILITÁRIOS
  getTriggerIcon(): string {
    return this.triggerType === 'questions' ? '🎓' : '📅';
  }

  getTriggerMessage(): string {
    if (this.triggerType === 'questions') {
      return `Parabéns! Você resolveu ${this.questionsResolved} questões! 🎉`;
    } else {
      return `Você está há ${this.daysElapsed} dias praticando! 🚀`;
    }
  }

  getProgressPercentage(): number {
    // 14 dias de trial generoso
    return Math.min(100, (this.daysElapsed / 14) * 100);
  }
}
