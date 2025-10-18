import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
export class PremiumUpgradeDialogComponent implements OnInit {
  
  featureName: string = 'Funcionalidade Premium';
  userName: string = '';
  isLoggedIn: boolean = false;
  
  premiumBenefits = [
    {
      icon: 'analytics',
      title: 'Relatórios Avançados',
      description: 'Análises detalhadas do seu progresso'
    },
    {
      icon: 'quiz',
      title: 'Quiz Ilimitados',
      description: 'Acesso a todos os níveis e categorias'
    },
    {
      icon: 'trending_up',
      title: 'Estatísticas Completas',
      description: 'Acompanhe cada detalhe da sua evolução'
    },
    {
      icon: 'bookmark',
      title: 'Favoritos Ilimitados',
      description: 'Salve quantas questões quiser'
    },
  ];

  constructor(
    private dialogRef: MatDialogRef<PremiumUpgradeDialogComponent>,
    private authService: AuthService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: PremiumDialogData
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Verificar estado do usuário
    const user = this.authService.getCurrentUser();
    this.isLoggedIn = !!user;
    this.userName = user?.name || '';
    
    // Definir nome da funcionalidade baseado no contexto
    if (this.data?.context?.feature) {
      this.featureName = this.data.context.feature;
    }
  }

  onUpgrade(): void {
    this.dialogRef.close('upgrade');
  }

  onLogin(): void {
    this.dialogRef.close('login');
  }

  onClose(): void {
    this.dialogRef.close('cancel');
  }

  onTryFree(): void {
    this.dialogRef.close('free');
  }

  // Método para analytics/tracking
  trackEvent(action: string): void {
    console.log('Premium Dialog Event:', {
      action,
      feature: this.featureName,
      user: this.userName,
      timestamp: new Date().toISOString()
    });
  }
}
