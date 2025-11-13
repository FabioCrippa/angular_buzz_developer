// ===============================================
// 🦉 SOWLFY - HEADER COMPONENT TYPESCRIPT
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\shared\components\header\header.component.ts

import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router'; // ✅ IMPORTAR Event
import { Subject, takeUntil, filter } from 'rxjs';

// Services & Components
import { AuthService, User } from '../../../core/services/auth.service';
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
    private paymentService: PaymentService // ← ADICIONAR ESTA LINHA
  ) {}

  ngOnInit(): void {
    console.log('🦉 SOWLFY Header inicializado');
    
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
    console.log('🔐 Abrindo sistema de login...');
    
    // ✅ USAR MOCK LOGIN ENQUANTO NÃO TEM API
    this.authService.mockLogin('usuario@sowlfy.com').subscribe({
      next: (response) => {
        if (response.success) {
          this.showWelcomeMessage(response.user);
        }
      },
      error: (error) => {
        console.error('❌ Erro no login:', error);
        this.snackBar.open(
          'Erro no login. Tente novamente.',
          'Fechar',
          { duration: 3000 }
        );
      }
    });
  }

  // ✅ MANTER O MÉTODO PARA COMPATIBILIDADE (CASO SEJA USADO EM OUTROS LUGARES)
  openLoginPage(): void {
    this.router.navigate(['/login']);
    this.closeMobileMenu();
    this.closeUserMenu();
  }

  // ✅ MÉTODO ALTERNATIVO CASO QUEIRA ABRIR MODAL EM OUTRAS SITUAÇÕES
  openLoginModal(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '450px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'login-dialog',
      backdropClass: 'login-backdrop',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showWelcomeMessage(result.user);
      }
    });
  }

  // 📝 ADICIONAR NO HEADER.COMPONENT.TS
  // ===============================================

  openSignupDialog(): void {
    console.log('📝 Iniciando cadastro SOWLFY...');
    
    // ✅ PROMPT PERSONALIZADO E AMIGÁVEL
    const email = prompt(
      '🦉 Bem-vindo ao SOWLFY!\n\n' +
      '📧 Digite seu email para criar sua conta gratuita:\n' +
      '• Acesso imediato ao dashboard\n' +
      '• 3 tentativas grátis por dia\n' +
      '• Progresso salvo automaticamente\n' +
      '• Upgrade disponível a qualquer momento'
    );
    
    if (email && this.isValidEmail(email)) {
      // ✅ FEEDBACK VISUAL IMEDIATO
      this.snackBar.open(
        '⚡ Criando sua conta SOWLFY...',
        '',
        { 
          duration: 2000,
          panelClass: ['info-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
      
      // ✅ CRIAR CONTA COM MOCK LOGIN
      this.authService.mockLogin(email).subscribe({
        next: (response) => {
          if (response.success) {
            // ✅ PERSONALIZAR DADOS DO USUÁRIO
            const userName = email.split('@')[0];
            const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
            response.user.name = capitalizedName;
            response.user.email = email.toLowerCase();
            
            this.showWelcomeMessage(response.user);
            
            // ✅ MENSAGEM DE SUCESSO COM AÇÃO
            const snackBarRef = this.snackBar.open(
              `🎉 Olá, ${capitalizedName}! Conta criada com sucesso!`,
              'Ver Dashboard',
              { 
                duration: 6000,
                panelClass: ['success-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'top'
              }
            );
            
            // ✅ AÇÃO DO BOTÃO "VER DASHBOARD"
            snackBarRef.onAction().subscribe(() => {
              this.router.navigate(['/dashboard']);
              this.closeMenus();
            });
            
            // ✅ AUTO REDIRECT APÓS 3 SEGUNDOS
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
              this.closeMenus();
            }, 3000);
            
            // ✅ SALVAR DADOS EXTRAS DE CADASTRO
            try {
              localStorage.setItem('sowlfy_signup_data', JSON.stringify({
                signupDate: new Date().toISOString(),
                email: email.toLowerCase(),
                source: 'header_signup',
                welcomeShown: true
              }));
            } catch (error) {
              console.warn('⚠️ Erro ao salvar dados de cadastro:', error);
            }
          }
        },
        error: (error) => {
          console.error('❌ Erro no cadastro:', error);
          this.snackBar.open(
            'Ops! Erro no cadastro. Tente novamente em alguns segundos.',
            'Fechar',
            { 
              duration: 4000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
        }
      });
      
    } else if (email) {
      // ✅ FEEDBACK DE EMAIL INVÁLIDO
      this.snackBar.open(
        '📧 Email inválido. Digite um email válido como: seu@email.com',
        'OK',
        { 
          duration: 4000,
          panelClass: ['warning-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    }
    // ✅ Se cancelou (email = null), não faz nada
  }

  // ✅ MÉTODO AUXILIAR PARA VALIDAÇÃO (ADICIONAR APÓS openSignupDialog)
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // ✅ MÉTODO ALTERNATIVO USANDO MODAL (MAIS PROFISSIONAL)
  openSignupModal(): void {
    console.log('📝 Abrindo modal de cadastro profissional...');
    
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
        subtitle: 'Comece sua jornada de aprendizado hoje!'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showWelcomeMessage(result.user);
        this.snackBar.open(
          '🎉 Conta criada com sucesso! Bem-vindo ao SOWLFY!',
          'Fechar',
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        
        // ✅ REDIRECIONAR PARA ONBOARDING/DASHBOARD
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
          this.closeMenus();
        }, 2000);
      }
    });
  }

  // ✅ VERSÃO AVANÇADA COM VALIDAÇÕES MÚLTIPLAS
  openAdvancedSignup(): void {
    console.log('📝 Cadastro avançado com validações...');
    
    // ✅ COLETAR DADOS BÁSICOS
    const name = prompt('👤 Qual é seu nome completo?');
    if (!name || name.trim().length < 2) {
      alert('❌ Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    
    const email = prompt('📧 Digite seu melhor email:');
    if (!email || !this.isValidEmail(email)) {
      alert('❌ Email inválido. Digite um email válido.');
      return;
    }
    
    const acceptTerms = confirm(
      '📋 Termos de Uso SOWLFY\n\n' +
      '✅ Aceito os termos de uso\n' +
      '✅ Aceito receber emails educacionais\n' +
      '✅ Confirmo que sou maior de idade\n\n' +
      'Clique OK para aceitar e criar sua conta.'
    );
    
    if (!acceptTerms) {
      alert('❌ É necessário aceitar os termos para criar sua conta.');
      return;
    }
    
    // ✅ CRIAR CONTA COM DADOS COLETADOS
    this.snackBar.open(
      '⏳ Criando sua conta personalizada...',
      '',
      { duration: 3000 }
    );
    
    // ✅ SIMULAR CADASTRO COM DADOS REAIS
    setTimeout(() => {
      const mockUserData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        acceptedTerms: true,
        createdAt: new Date()
      };
      
      // ✅ USAR MOCK LOGIN COM DADOS PERSONALIZADOS
      this.authService.mockLogin(email).subscribe({
        next: (response) => {
          if (response.success) {
            // ✅ PERSONALIZAR USUÁRIO COM DADOS COLETADOS
            response.user.name = name.trim();
            response.user.email = email.toLowerCase().trim();
            
            this.showWelcomeMessage(response.user);
            this.snackBar.open(
              `🎉 Olá, ${name}! Sua conta foi criada com sucesso!`,
              'Fechar',
              { 
                duration: 6000,
                panelClass: ['success-snackbar']
              }
            );
            
            // ✅ SALVAR DADOS EXTRAS NO LOCALSTORAGE
            localStorage.setItem('userSignupData', JSON.stringify(mockUserData));
            
            // ✅ REDIRECIONAR PARA DASHBOARD
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
              this.closeMenus();
            }, 3000);
          }
        },
        error: (error) => {
          console.error('❌ Erro no cadastro avançado:', error);
          this.snackBar.open(
            'Erro no cadastro. Tente novamente.',
            'Fechar',
            { duration: 3000 }
          );
        }
      });
    }, 1500);
  }
  
  logout(): void {
    console.log('🚪 Fazendo logout...');
    
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

  // ✅ MÉTODO MELHORADO showWelcomeMessage (ATUALIZAR SE EXISTIR)
  private showWelcomeMessage(user: any): void {
    const welcomeMessages = [
      `🎉 Bem-vindo ao SOWLFY, ${user.name}!`,
      `🚀 Ótimo ter você aqui, ${user.name}!`,
      `🦉 Olá, ${user.name}! Pronto para aprender?`,
      `✨ Sua jornada SOWLFY começou, ${user.name}!`,
      `🎯 Vamos acelerar seus estudos, ${user.name}!`
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    console.log(randomMessage);
    
    // ✅ TOAST DE BOAS-VINDAS EXTRA
    setTimeout(() => {
      this.snackBar.open(
        `👋 Dica: Acesse seu Dashboard para começar a praticar!`,
        'Entendi',
        { 
          duration: 5000,
          panelClass: ['info-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        }
      );
    }, 4000);
  }

  // ===============================================
    // 💎 PREMIUM
    // ===============================================
  
    openPremiumDialog(): void {
      console.log('💎 Abrindo sistema de upgrade premium...');
      
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
          plans: this.paymentService.plans // ← PASSAR PLANOS REAIS
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('💎 Premium dialog closed with result:', result);
        
        if (result === 'upgrade') {
          this.handleUpgradeSelection();
        } else if (result === 'login') {
          this.openLoginDialog();
        } else if (result?.planId) {
          // Se selecionou plano específico
          this.handleUpgradeSelection(result.planId);
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
    console.log('🏠 Navegando para home...');
    this.router.navigate(['/']);
    this.closeMenus();
  }
  
  navigateToDashboard(): void {
    console.log('📊 Navegando para dashboard...');
    this.router.navigate(['/dashboard']);
    this.closeMenus();
  }
  
  navigateToProgress(): void {
    console.log('📈 Navegando para progresso...');
    this.router.navigate(['/progress']);
    this.closeMenus();
  }
  
  navigateToFavorites(): void {
    console.log('❤️ Navegando para favoritos...');
    this.router.navigate(['/favorites']);
    this.closeMenus();
  }
  
  navigateToProfile(): void {
    console.log('👤 Navegando para perfil...');
    this.router.navigate(['/profile']);
    this.closeMenus();
  }
  
  navigateToSettings(): void {
    console.log('⚙️ Navegando para configurações...');
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
    console.log('🔔 Abrindo notificações...');
    alert('🔔 Notificações\n\n📚 2 novas questões adicionadas\n🎯 Meta semanal: 80% concluída');
    this.notificationCount = 0;
  }
  
  toggleTheme(): void {
    console.log('🎨 Alternando tema...');
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
    console.warn('⚠️ Erro ao carregar logo, usando fallback');
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
    console.log(`💳 Iniciando upgrade Stripe para: ${planId}`);
    
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
        console.log('✅ Redirecionando para Stripe Checkout...');
        // Usuário será redirecionado para o Stripe
      },
      error: (error) => {
        console.warn('⚠️ Stripe falhou, usando backup:', error);
        
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
        console.error('❌ Erro no mock upgrade:', error);
        this.snackBar.open(
          'Erro no upgrade. Tente novamente.',
          'Fechar',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }
}
