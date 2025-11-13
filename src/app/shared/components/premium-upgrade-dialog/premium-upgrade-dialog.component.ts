// ===============================================
// 💎 PREMIUM-UPGRADE-DIALOG - VERSÃO MELHORADA
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\shared\components\premium-upgrade-dialog\premium-upgrade-dialog.component.ts

import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

export interface PremiumDialogData {
  context?: {
    url: string;
    feature: string;
    reason: string;
    timestamp: string;
  };
}

@Component({
  selector: 'app-premium-upgrade-dialog',
  templateUrl: './premium-upgrade-dialog.component.html',
  styleUrls: ['./premium-upgrade-dialog.component.css']
})
export class PremiumUpgradeDialogComponent implements OnInit, OnDestroy {
onLogin() {
throw new Error('Method not implemented.');
}
onTryFree() {
throw new Error('Method not implemented.');
}
  
  // ✅ PROPRIEDADES
  userName = '';
  isLoggedIn = false;
  isPremium = false;
  
  // ✅ CONTROLE DE SUBSCRIPTIONS
  private destroy$ = new Subject<void>();
  
  // ✅ BENEFÍCIOS PREMIUM
  premiumBenefits = [
    {
      icon: '🚀',
      title: 'Quizzes Ilimitados',
      description: 'Pratique quanto quiser, sem restrições'
    },
    {
      icon: '📊',
      title: 'Relatórios Avançados',
      description: 'Análises detalhadas do seu progresso'
    },
    {
      icon: '🎯',
      title: 'Quiz Inteligente',
      description: 'IA personalizada para seu aprendizado'
    },
    {
      icon: '⭐',
      title: 'Favoritos Ilimitados',
      description: 'Salve todas as questões importantes'
    },
    {
      icon: '📈',
      title: 'Estatísticas Completas',
      description: 'Métricas avançadas de desempenho'
    },
    {
      icon: '🎮',
      title: 'Recursos Exclusivos',
      description: 'Acesso antecipado a novas funcionalidades'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: PremiumDialogData,
    private dialogRef: MatDialogRef<PremiumUpgradeDialogComponent>
  ) {}

  ngOnInit(): void {
    console.log('💎 Premium Dialog inicializado com contexto:', this.data?.context);
    
    // ✅ CORRIGIDO: SUBSCRIBER CORRETAMENTE AO OBSERVABLE
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userName = user?.name || '';
        this.isLoggedIn = !!user;
        this.isPremium = user?.isPremium || false;
        
        console.log('👤 Dados do usuário carregados:', {
          userName: this.userName,
          isLoggedIn: this.isLoggedIn,
          isPremium: this.isPremium
        });
      });
    
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ RESTO DOS MÉTODOS PERMANECEM IGUAIS...
  
  private loadAnalytics(): void {
    // Track evento de abertura do dialog
    try {
      const analytics = {
        event: 'premium_dialog_opened',
        timestamp: new Date().toISOString(),
        context: this.data?.context || {},
        user: this.userName || 'anonymous'
      };
      
      console.log('📊 Analytics Premium Dialog:', analytics);
      // TODO: Enviar para Google Analytics ou seu sistema de analytics
    } catch (error) {
      console.warn('⚠️ Erro ao carregar analytics:', error);
    }
  }

  selectPlan(): void {
    console.log('💳 Usuário selecionou upgrade premium');
    
    if (!this.isLoggedIn) {
      this.dialogRef.close('login');
      return;
    }
    
    this.dialogRef.close('upgrade');
  }

  continueWithFree(): void {
    console.log('🆓 Usuário escolheu continuar com plano gratuito');
    this.dialogRef.close('free');
  }

  close(): void {
    console.log('❌ Dialog fechado sem ação');
    this.dialogRef.close('cancel');
  }
}
