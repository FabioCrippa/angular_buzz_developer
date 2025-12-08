// ===============================================
// 🦉 SOWLFY - HEADER COMPONENT TYPESCRIPT
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\shared\components\header\header.component.ts

import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router'; // ✅ IMPORTAR Event
import { Subject, takeUntil, filter } from 'rxjs';

// Services & Components
import { AuthService, User, LoginResponse, RegisterRequest } from '../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginComponent } from '../login/login.component';
import { PremiumUpgradeDialogComponent } from '../premium-upgrade-dialog/premium-upgrade-dialog.component';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  @ViewChild('menuTrigger') menuTrigger!: ElementRef;
  
  // ✅ PROPRIEDADES DO USUÁRIO
  isLoggedIn = false;
  isPremium = false;
  isFreeTrial = true;
  currentUser: any = null;

  // Getter for compatibility: existing code sometimes checks isAuthenticated
  // Keep this in sync with isLoggedIn/currentUser so older checks keep working.
  get isAuthenticated(): boolean {
    return this.isLoggedIn || !!this.currentUser;
  }
  
  // ✅ PROPRIEDADES DA UI
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  currentRoute = '';
  logoError = false;
  isDarkTheme = false;
  
  // ✅ NOTIFICAÇÕES E TENTATIVAS
  notificationCount = 0;
  remainingAttempts = 3;
  showDashboardForGuests = true; // Dashboard disponível para guests
  
  // Controle de subscriptions
  private destroy$ = new Subject<void>();
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    
    this.subscribeToAuthChanges();
    this.subscribeToRouteChanges();
    this.initializeNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================================
  // 🔧 INICIALIZAÇÃO
  // ===============================================

  private subscribeToAuthChanges(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        this.isPremium = this.authService.isPremium();
        
        // Atualizar notificações baseadas no usuário
        this.updateNotifications(user);
        
        // Forçar detecção de mudanças
        this.cdr.detectChanges();
      });
  }

  // ✅ VERSÃO CORRIGIDA
  private subscribeToRouteChanges(): void {
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  private initializeNotifications(): void {
    // Placeholder para sistema de notificações futuro
    this.notificationCount = Math.floor(Math.random() * 5);
  }

  private updateNotifications(user: User | null): void {
    if (user && !user.isPremium) {
      this.notificationCount += 1; // Adicionar notificação de upgrade
    }
  }

  // ===============================================
  // 🔐 AUTENTICAÇÃO - VERSÃO CORRIGIDA
  // ===============================================

  openLoginDialog(): void {
    this.openLoginModal();
  }


  // ✅ MANTER O MÉTODO PARA COMPATIBILIDADE (CASO SEJA USADO EM OUTROS LUGARES)
  openLoginPage(): void {
    this.router.navigate(['/login']);
    this.closeMobileMenu();
    this.closeUserMenu();
  }

  // ✅ MODAL PROFISSIONAL DE LOGIN
  private openLoginModal(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '450px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'login-dialog',
      backdropClass: 'login-backdrop',
      disableClose: false,
      autoFocus: true,
      data: { 
        mode: 'login',
        title: 'Fazer Login',
        subtitle: 'Digite seus dados para acessar sua conta'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        this.handleAuthSuccess(result);
      }
    });
  }

  // 📝 ADICIONAR NO HEADER.COMPONENT.TS
  // ===============================================

  openSignupDialog(): void {
    this.openSignupModal();
  }


  // ✅ MÉTODO AUXILIAR PARA VALIDAÇÃO (ADICIONAR APÓS openSignupDialog)
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // ✅ MODAL PROFISSIONAL DE CADASTRO
  private openSignupModal(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '450px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'signup-dialog',
      backdropClass: 'signup-backdrop',
      disableClose: false,
      autoFocus: true,
      data: { 
        mode: 'register',
        title: 'Criar Conta SOWLFY',
        subtitle: 'Preencha os dados para criar sua conta'
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        this.handleAuthSuccess(result);
      }
    });
  }
  
  logout(): void {
    
    const confirmLogout = confirm('🚪 Tem certeza que deseja sair?');
    
    if (confirmLogout) {
      // ✅ LIMPAR DADOS DO USUÁRIO
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isPremium');
      
      this.isLoggedIn = false;
      this.isPremium = false;
      this.currentUser = null;
      
      this.closeMenus();
      this.router.navigate(['/']);
      
      alert('👋 Logout realizado com sucesso!\n\nVolte sempre ao SOWLFY!');
    }
  }

  // ✅ PROCESSAR SUCESSO DE AUTENTICAÇÃO
  private handleAuthSuccess(result: any): void {
    if (result?.user) {
      this.showWelcomeMessage(result.user);
      
      // ✅ VERIFICAR REDIRECIONAMENTO
      const redirectUrl = localStorage.getItem('sowlfy_redirect_after_login');
      const targetUrl = redirectUrl || '/dashboard';
      
      const userName = result.user.name || result.user.email?.split('@')[0] || 'Usuário';
      const isNewUser = result.isNewUser || false;
      
      const message = isNewUser 
        ? `🎉 Bem-vindo ao SOWLFY, ${userName}!`
        : `🎉 Bem-vindo de volta, ${userName}!`;
      
      const snackBarRef = this.snackBar.open(
        message,
        'Continuar',
        { 
          duration: 5000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
      
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate([targetUrl]);
        this.closeMenus();
        localStorage.removeItem('sowlfy_redirect_after_login');
      });
      
      setTimeout(() => {
        this.router.navigate([targetUrl]);
        this.closeMenus();
        localStorage.removeItem('sowlfy_redirect_after_login');
      }, 2000);
    }
  }

  // ✅ MÉTODO MELHORADO showWelcomeMessage COM REDIRECIONAMENTO INTELIGENTE
  private showWelcomeMessage(user: any): void {
    const welcomeMessages = [
      `🎉 Bem-vindo ao SOWLFY, ${user.name}!`,
      `🚀 Acesso liberado! Ótimo ter você aqui, ${user.name}!`,
      `🦉 Olá, ${user.name}! Seu acesso está pronto!`,
      `✨ Bem-vindo de volta, ${user.name}!`,
      `🎯 Pronto para continuar, ${user.name}!`
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    
    // ✅ VERIFICAR SE HÁ REDIRECIONAMENTO PENDENTE
    const redirectUrl = localStorage.getItem('sowlfy_redirect_after_login');
    const isRedirectToDashboard = redirectUrl === '/dashboard';
    
    // ✅ TOAST DE BOAS-VINDAS COM INFORMAÇÃO CONTEXTUAL
    setTimeout(() => {
      const message = isRedirectToDashboard 
        ? `📊 Redirecionando para o Dashboard onde você pode acompanhar seu progresso!`
        : redirectUrl 
        ? `🔄 Redirecionando para a página que você estava tentando acessar...`
        : `📊 Dica: Acesse seu Dashboard para ver suas estatísticas e continuar estudando!`;
        
      this.snackBar.open(
        message,
        'Ir Agora',
        { 
          duration: 5000,
          panelClass: ['info-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        }
      ).onAction().subscribe(() => {
        const targetUrl = redirectUrl || '/dashboard';
        this.router.navigate([targetUrl]);
        this.closeMenus();
        localStorage.removeItem('sowlfy_redirect_after_login');
      });
    }, 3000);
  }

  // ===============================================
    // 💎 PREMIUM
    // ===============================================
  
    openPremiumDialog(): void {
      
      // ✅ REDIRECIONAR DIRETAMENTE PARA PÁGINA DE UPGRADE
      this.router.navigate(['/upgrade'], {
        queryParams: {
          source: 'header',
          ref: 'upgrade-button'
        }
      });
      
      this.closeMenus();
    }
    
    // ✅ MÉTODO ANTIGO COM DIALOG (DESATIVADO - USAR /upgrade)
    openPremiumDialog_OLD(): void {
      
      const dialogRef = this.dialog.open(PremiumUpgradeDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        panelClass: 'premium-dialog',
        backdropClass: 'premium-backdrop',
        disableClose: false,
        data: {
          context: {
            url: this.currentRoute,
            feature: 'header_upgrade',
            reason: 'Acesso premium solicitado via header',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          },
          plans: this.paymentService.plans
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        
        if (result === 'upgrade') {
          this.router.navigate(['/upgrade']);
        } else if (result === 'login') {
          this.openLoginDialog();
        }
      });
    }
  
    // Atualiza o estado do usuário no componente (corrige referência faltante)
    private checkUserStatus(): void {
      // Tenta recuperar usuário salvo localmente
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch {
          this.currentUser = null;
        }
      }
  
      // Atualiza flags baseadas no storage e no usuário atual
      const storedPremium = localStorage.getItem('isPremium');
      this.isPremium = storedPremium === 'true' || !!this.currentUser?.isPremium;
      this.isFreeTrial = !this.isPremium;
  
      // Atualiza notificações ou outras informações dependentes do usuário
      this.updateNotifications(this.currentUser);
    }
    
    // ===============================================
  // 🧭 NAVEGAÇÃO
  // ===============================================

  navigateToHome(): void {
    this.router.navigate(['/']);
    this.closeMenus();
  }
  
  navigateToDashboard(): void {
    
    // ✅ VERIFICAR SE USUÁRIO ESTÁ LOGADO
    if (this.isLoggedIn && this.currentUser) {
      this.router.navigate(['/dashboard']);
      this.closeMenus();
    } else {
      this.handleDashboardAccessForGuests();
    }
  }

  // ✅ NOVO MÉTODO PARA LIDAR COM ACESSO NÃO AUTENTICADO
  private handleDashboardAccessForGuests(): void {
    this.closeMenus();
    
    // ✅ ABRIR MODAL DE ESCOLHA LOGIN/CADASTRO
    this.openAuthSelectionModal();
  }

  // ✅ MODAL ELEGANTE PARA SELEÇÃO DE AUTENTICAÇÃO
  private openAuthSelectionModal(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '450px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'auth-selection-dialog',
      backdropClass: 'auth-backdrop',
      disableClose: false,
      autoFocus: true,
      data: { 
        mode: 'selection',
        title: 'Acesso ao Dashboard',
        subtitle: 'Para acessar seu dashboard personalizado, escolha uma opção:',
        showSelectionButtons: true
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.action === 'login') {
        this.openLoginModal();
      } else if (result?.action === 'register') {
        this.openSignupModal();
      } else if (result?.success) {
        // Login/cadastro já foi realizado no modal
        this.handleAuthSuccess(result);
      }
    });
  }
  
  navigateToProgress(): void {
    this.router.navigate(['/progress']);
    this.closeMenus();
  }
  
  navigateToFavorites(): void {
    this.router.navigate(['/favorites']);
    this.closeMenus();
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeMenus();
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.closeMenus();
  }
  
  // ===============================================
  // 🔧 MÉTODOS DE UI
  // ===============================================
  
  isCurrentRoute(route: string): boolean {
    if (route === '/') {
      return this.currentRoute === '/' || this.currentRoute === '';
    }
    return this.currentRoute.startsWith(route);
  }
  
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }
  
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }
  
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }
  
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
  
  private closeMenus(): void {
    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
  }
  
  // ===============================================
  // 👤 MÉTODOS DO USUÁRIO
  // ===============================================
  
  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  
  getUserLevel(): number {
    // ✅ CALCULAR NÍVEL BASEADO EM PROGRESSO
    const totalAnswered = parseInt(localStorage.getItem('totalAnswered') || '0');
    return Math.floor(totalAnswered / 50) + 1;
  }
  
  getUserStreak(): number {
    // ✅ STREAK DE DIAS CONSECUTIVOS
    return parseInt(localStorage.getItem('currentStreak') || '0');
  }
  
  // ===============================================
  // 🔔 OUTROS MÉTODOS
  // ===============================================
  
  openNotifications(): void {
    alert('🔔 Notificações\n\n📚 2 novas questões adicionadas\n🎯 Meta semanal: 80% concluída');
    this.notificationCount = 0;
  }
  
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
    
    this.closeMenus();
  }
  
  onLogoError(event: any): void {
    this.logoError = true;
  }
  
  // ===============================================
  // 📱 RESPONSIVE HANDLERS
  // ===============================================
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (!this.isMobile()) {
      this.isMobileMenuOpen = false;
    }
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any): void {
    // ✅ FECHAR MENUS AO CLICAR FORA
    if (!event.target.closest('.user-section') && !event.target.closest('.mobile-nav-overlay')) {
      this.closeMenus();
    }
  }
  
  // ✅ SUBSTITUIR O MÉTODO openPremiumDialog():
  private handleUpgradeSelection(planId: string = 'sowlfy-pro-monthly'): void {
    
    if (!this.isAuthenticated) {
      this.snackBar.open(
        '🔐 Faça login primeiro para fazer upgrade',
        'Login',
        { duration: 4000 }
      ).onAction().subscribe(() => this.openLoginDialog());
      return;
    }

    // ✅ VERIFICAR SE STRIPE ESTÁ PRONTO
    if (!this.paymentService.isStripeReady()) {
      this.snackBar.open(
        '⏳ Carregando sistema de pagamento seguro...',
        '',
        { duration: 2000 }
      );
      
      // Tentar novamente em 2 segundos
      setTimeout(() => this.handleUpgradeSelection(planId), 2000);
      return;
    }

    // ✅ MOSTRAR LOADING
    this.snackBar.open(
      '💳 Redirecionando para checkout seguro Stripe...',
      '',
      { duration: 3000, panelClass: ['info-snackbar'] }
    );

    // ✅ REDIRECIONAR PARA STRIPE CHECKOUT REAL
    this.paymentService.redirectToCheckout(planId).subscribe({
      next: () => {
        // Usuário será redirecionado para o Stripe
      },
      error: (error) => {
        
        this.snackBar.open(
          '⚠️ Problema no checkout. Usando modo de teste...',
          'OK',
          { duration: 3000, panelClass: ['warning-snackbar'] }
        );
        
        // ✅ FALLBACK PARA MOCK SE STRIPE FALHAR
        this.handleMockUpgrade(planId);
      }
    });
  }

  // ✅ MÉTODO DE BACKUP (CASO STRIPE FALHE):
  private handleMockUpgrade(planId: string): void {
    this.paymentService.mockUpgradeToPremium(planId).subscribe({
      next: (success) => {
        if (success) {
          const plan = this.paymentService.getPlanById(planId);
          this.snackBar.open(
            `🎉 Upgrade para ${plan?.name} realizado! (modo teste)`,
            'Ver Dashboard',
            { duration: 6000, panelClass: ['success-snackbar'] }
          ).onAction().subscribe(() => {
            this.router.navigate(['/dashboard']);
          });
          
          this.isPremium = true;
          this.isFreeTrial = false;
          
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
            this.closeMenus();
          }, 3000);
        }
      },
      error: (error) => {
        this.snackBar.open(
          'Erro no upgrade. Tente novamente.',
          'Fechar',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }
}
