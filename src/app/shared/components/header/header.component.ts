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

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
openSignupDialog() {
throw new Error('Method not implemented.');
}
  
  @ViewChild('menuTrigger') menuTrigger!: ElementRef;
  
  // ✅ PROPRIEDADES DO USUÁRIO
  isLoggedIn = false;
  isPremium = false;
  isFreeTrial = true;
  currentUser: any = null;
  
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
    private snackBar: MatSnackBar
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
    console.log('🔐 Abrindo modal de login...');
    // ✅ SIMULAR LOGIN PARA DESENVOLVIMENTO
    this.simulateLogin();
  }

  // Simula um login rápido para desenvolvimento/local
  private simulateLogin(): void {
    const mockUser: any = {
      id: 'dev-user',
      name: 'Developer',
      email: 'dev@example.com',
      isPremium: false
    };

    this.currentUser = mockUser;
    this.isLoggedIn = true;
    this.isPremium = !!mockUser.isPremium;

    try {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('isPremium', String(this.isPremium));
    } catch (e) {
      // Falha ao persistir, ignorar em dev
    }

    this.snackBar.open(`Bem-vindo, ${mockUser.name}! (modo dev)`, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });

    // Atualiza notificações locais com base no usuário simulado
    this.updateNotifications(mockUser);
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

  private showWelcomeMessage(user: User): void {
    const message = user.isPremium 
      ? `Bem-vindo de volta, ${user.name}! ✨ Premium ativo`
      : `Olá, ${user.name}! 🎉`;
      
    this.snackBar.open(
      message,
      'Fechar',
      {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: [user.isPremium ? 'premium-snackbar' : 'success-snackbar']
      }
    );
  }

  // ===============================================
    // 💎 PREMIUM
    // ===============================================
  
    openPremiumDialog(): void {
      console.log('💎 Abrindo modal premium...');
      
      const confirmUpgrade = confirm(
        '👑 Upgrade para SOWLFY Pro?\n\n' +
        '✅ Tentativas ilimitadas\n' +
        '✅ 2.500+ questões\n' +
        '✅ Relatórios detalhados\n' +
        '✅ Quiz inteligente\n\n' +
        'Apenas R$ 39,90/mês'
      );
      
      if (confirmUpgrade) {
        // ✅ SIMULAR UPGRADE
        this.isPremium = true;
        this.isFreeTrial = false;
        localStorage.setItem('isPremium', 'true');
        
        alert('🎉 SOWLFY Pro ativado!\n\nAgora você tem acesso total à plataforma!');
        this.checkUserStatus();
        this.closeMenus();
      }
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
}
