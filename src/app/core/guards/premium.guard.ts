import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PremiumUpgradeDialogComponent } from '../../shared/components/premium-upgrade-dialog/premium-upgrade-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class PremiumGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkPremiumAccess(state.url);
  }

  private checkPremiumAccess(url: string): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // Verificar se usuário está logado
        if (!user || !this.authService.isAuthenticated()) {
          this.handleUnauthenticated(url);
          return false;
        }

        // Verificar se usuário é premium
        if (this.authService.isPremium()) {
          return true;
        } else {
          this.handleNonPremiumAccess(url);
          return false;
        }
      })
    );
  }

  private handleUnauthenticated(url: string): void {
    localStorage.setItem('redirectAfterLogin', url);
    
    this.snackBar.open(
      'Faça login para acessar conteúdo premium',
      'Login',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/login']);
    });

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  private handleNonPremiumAccess(url: string): void {
    // Salvar URL premium que tentou acessar
    localStorage.setItem('premiumUrlRequested', url);

    // Mostrar dialog de upgrade premium
    this.showPremiumDialog();
  }

  private showPremiumDialog(): void {
    const dialogRef = this.dialog.open(PremiumUpgradeDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'premium-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'upgrade') {
        this.router.navigate(['/upgrade']);
      } else if (result === 'login') {
        this.router.navigate(['/login']);
      } else {
        // Redirecionar para página gratuita
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
