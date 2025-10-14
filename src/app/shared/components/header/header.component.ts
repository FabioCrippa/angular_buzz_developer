import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  
  @ViewChild('menuTrigger') menuTrigger!: ElementRef;
  
  // Estado do componente
  currentUser: User | null = null;
  isLoggedIn: boolean = false;
  isPremium: boolean = false;
  currentRoute: string = '';
  
  // Controle de subscriptions
  private destroy$ = new Subject<void>();
  
  // Menu mobile
  isMobileMenuOpen: boolean = false;
  
  // Notificações (placeholder para futuras features)
  notificationCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
  // 🔐 AUTENTICAÇÃO
  // ===============================================

  openLoginDialog(): void {
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
    const userName = this.currentUser?.name || '';
    
    this.authService.logout();
    
    this.snackBar.open(
      `Até logo, ${userName}! 👋`,
      'Fechar',
      {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      }
    );
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
    const dialogRef = this.dialog.open(PremiumUpgradeDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        context: {
          url: this.currentRoute,
          feature: 'Upgrade Premium',
          reason: 'header_upgrade_click',
          timestamp: new Date().toISOString()
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'upgrade') {
        this.navigateToUpgrade();
      }
    });
  }

  // ===============================================
  // 🧭 NAVEGAÇÃO
  // ===============================================

  navigateToHome(): void {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  navigateToDashboard(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    } else {
      this.openLoginDialog();
    }
    this.closeMobileMenu();
  }

  navigateToProfile(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/profile']);
    } else {
      this.openLoginDialog();
    }
    this.closeMobileMenu();
  }

  navigateToProgress(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/progress']);
    } else {
      this.openLoginDialog();
    }
    this.closeMobileMenu();
  }

  navigateToFavorites(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/favorites']);
    } else {
      this.openLoginDialog();
    }
    this.closeMobileMenu();
  }

  navigateToUpgrade(): void {
    this.router.navigate(['/upgrade']);
    this.closeMobileMenu();
  }

  navigateToSettings(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/settings']);
    } else {
      this.openLoginDialog();
    }
    this.closeMobileMenu();
  }

  // ===============================================
  // 📱 MOBILE MENU
  // ===============================================

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // ===============================================
  // 🎯 UTILITÁRIOS
  // ===============================================

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return this.currentUser.name.substring(0, 2).toUpperCase();
  }

  getUserLevel(): number {
    return this.currentUser?.stats?.level || 1;
  }

  getUserStreak(): number {
    return this.currentUser?.stats?.streak || 0;
  }

  isCurrentRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }

  // ===============================================
  // 🔔 NOTIFICAÇÕES (PLACEHOLDER)
  // ===============================================

  openNotifications(): void {
    this.snackBar.open(
      'Sistema de notificações em breve! 🔔',
      'Ok',
      { duration: 2000 }
    );
    
    // Reset contador
    this.notificationCount = 0;
  }

  // ===============================================
  // 🎨 THEME (PLACEHOLDER PARA FUTURO)
  // ===============================================

  toggleTheme(): void {
    // Placeholder para toggle de tema
    this.snackBar.open(
      'Theme toggle em breve! 🌙',
      'Ok',
      { duration: 2000 }
    );
  }
}
